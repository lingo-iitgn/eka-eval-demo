# scripts/run_evaluation_suite.py

import subprocess
import multiprocessing
import os
import pandas as pd 
import time
import sys
import json
import argparse
import logging # For logging levels
from typing import List, Dict as PyDict, Tuple, Set, Any
from collections import defaultdict

import sys
import os


"""Project path configuration"""
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from eka_eval.benchmarks.benchmark_registry import BenchmarkRegistry
from eka_eval.utils.gpu_utils import get_available_gpus
from eka_eval.utils.logging_setup import setup_logging
from eka_eval.utils import constants 
from eka_eval.core.model_loader import get_model_selection_interface
from eka_eval.core.api_loader import get_available_api_models

# Visualization imports
try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    import plotly.express as px
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
    VISUALIZATION_AVAILABLE = True
except ImportError as e:
    VISUALIZATION_AVAILABLE = False
    print(f"Visualization libraries not available: {e}")
    print("Install with: pip install matplotlib seaborn plotly")

csv_path="calculated.csv"

logger = logging.getLogger(__name__) 


#new functioanlity
def get_gpus_from_environment():
    """Get available GPUs respecting the CUDA_VISIBLE_DEVICES constraint."""
    available_gpus_str = os.environ.get("CUDA_VISIBLE_DEVICES")
    if not available_gpus_str:
        logger.warning("CUDA_VISIBLE_DEVICES is not set. Attempting to detect all GPUs.")
        return get_available_gpus() # Fallback to original detection

    physical_gpu_ids = [int(g) for g in available_gpus_str.split(',') if g.strip().isdigit()]
    logger.info(f"Detected GPUs from CUDA_VISIBLE_DEVICES: {physical_gpu_ids}")
    return physical_gpu_ids

def get_constrained_gpus():
    """
    Get available GPUs respecting the CUDA_VISIBLE_DEVICES constraint.
    Returns logical GPU IDs (0, 1) which map to physical GPUs (2, 3).
    """
    
    available_gpus = get_available_gpus()
    if not available_gpus:
        logger.warning("No GPUs available or CUDA not accessible with current CUDA_VISIBLE_DEVICES setting")
        return []
    
    # Map logical to physical for logging
    cuda_visible = os.environ.get("CUDA_VISIBLE_DEVICES", "").split(",")
    physical_mapping = {}
    for logical_id, physical_id in enumerate(cuda_visible):
        if physical_id.strip().isdigit():
            physical_mapping[logical_id] = int(physical_id.strip())
    
    logger.info(f"GPU constraint active: CUDA_VISIBLE_DEVICES={os.environ.get('CUDA_VISIBLE_DEVICES')}")
    logger.info(f"Available logical GPUs: {available_gpus}")
    logger.info(f"Logical -> Physical GPU mapping: {physical_mapping}")
    
    return available_gpus

def worker_process(
    assigned_physical_gpu_id: int,
    subprocess_unique_id: int,
    model_name_or_path: str,
    total_num_workers: int,
    task_group_to_run: str,
    selected_benchmarks_for_group: List[str],
    orchestrator_batch_size: int,
    is_api_model: bool = False,
    api_provider: str = None,
    api_key: str = None,
):
    """
    Manages the execution of a single worker (evaluation_worker.py) as a subprocess.
    Now supports both local and API models with GPU constraints.
    """
    
    worker_log_prefix = f"Worker {subprocess_unique_id} ({'API' if is_api_model else f'GPU {assigned_physical_gpu_id}'})"
    model_type_str = f"{api_provider} API" if is_api_model else "Local"
    logger.info(
        f"{worker_log_prefix}: Starting {model_type_str} model '{model_name_or_path}' for TG: '{task_group_to_run}', "
        f"BMs: {selected_benchmarks_for_group}, BatchSize: {orchestrator_batch_size}"
    )
    try:
        python_executable = sys.executable or "python3"
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        worker_script_path = os.path.join(project_root, "scripts", "evaluation_worker.py")

        if not os.path.exists(worker_script_path):
            logger.error(f"{worker_log_prefix}: CRITICAL - Worker script not found at {worker_script_path}. Aborting this worker.")
            return

        command = [
            python_executable, "-u", worker_script_path,
            "--gpu_id", str(assigned_physical_gpu_id),
            "--num_gpus", str(total_num_workers),
            "--process_id", str(subprocess_unique_id), 
            "--model_name", model_name_or_path,
            "--batch_size", str(orchestrator_batch_size),
            "--task_group", task_group_to_run,
            "--selected_benchmarks_json", json.dumps({task_group_to_run: selected_benchmarks_for_group}),
            "--results_dir", constants.DEFAULT_RESULTS_DIR if hasattr(constants, 'DEFAULT_RESULTS_DIR') else "results_output"
        ]

        # Add API-specific parameters
        if is_api_model:
            command.extend([
                "--is_api_model", "true",
                "--api_provider", api_provider or "",
                "--api_key", api_key or ""
            ])

        # Set environment for subprocess
        env = os.environ.copy()
        #if not is_api_model and assigned_physical_gpu_id >= 0:
            # This is the crucial fix: each worker sees ONLY its assigned GPU.
           # env["CUDA_VISIBLE_DEVICES"] = str(assigned_physical_gpu_id)

        logger.debug(f"{worker_log_prefix}: Executing command: {' '.join(command[:-1])} [API_KEY_HIDDEN]" if is_api_model else f"{worker_log_prefix}: Executing command: {' '.join(command)}")

        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            bufsize=1,
            env=env  # Pass environment with GPU constraint
        )

        logger.info(f"\n--------- Output from {worker_log_prefix} for TG '{task_group_to_run}' ---------\n")
        if process.stdout:
            for line in iter(process.stdout.readline, ''):
                sys.stdout.write(f"[{worker_log_prefix}] {line}")
                sys.stdout.flush()
            process.stdout.close()

        return_code = process.wait()
        logger.info(f"\n--------- End Output from {worker_log_prefix} for TG '{task_group_to_run}' ---------")

        if return_code == 0:
            logger.info(f"{worker_log_prefix}: Finished TG '{task_group_to_run}' successfully (RC: {return_code}).")
        else:
            logger.error(f"{worker_log_prefix}: TG '{task_group_to_run}' exited with error (RC: {return_code}).")

    except Exception as e:
        logger.critical(
            f"{worker_log_prefix}: FATAL error launching/monitoring worker for TG '{task_group_to_run}': {e}",
            exc_info=True
        )

def create_visualizations(
    results_csv_path: str,
    model_name: str = None,
    viz_types: List[str] = None,
    output_dir: str = None
):
    """
    Create various visualizations from evaluation results.
    
    Args:
        results_csv_path: Path to the results CSV file
        model_name: Specific model to visualize (None for all models)
        viz_types: List of visualization types to create
        output_dir: Directory to save visualizations
    """
    if not VISUALIZATION_AVAILABLE:
        logger.error("Visualization libraries not available. Please install matplotlib, seaborn, and plotly.")
        return False
    
    if not os.path.exists(results_csv_path):
        logger.error(f"Results file not found: {results_csv_path}")
        return False
    
    # Load data
    try:
        df = pd.read_csv(results_csv_path)
        logger.info(f"Loaded {len(df)} results from {results_csv_path}")
    except Exception as e:
        logger.error(f"Error loading results CSV: {e}")
        return False
    
    # Filter by model if specified
    if model_name:
        df = df[df['Model'] == model_name]
        if df.empty:
            logger.warning(f"No results found for model: {model_name}")
            return False
    
    # Set up output directory
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(results_csv_path), "visualizations")
    os.makedirs(output_dir, exist_ok=True)
    
    # Default visualization types
    if viz_types is None:
        viz_types = ["heatmap", "bar_chart", "radar_chart", "model_comparison", "task_breakdown"]
    
    success = True
    
    try:
        # Set style for better-looking plots
        plt.style.use('seaborn-v0_8' if 'seaborn-v0_8' in plt.style.available else 'default')
        sns.set_palette("husl")
        
        for viz_type in viz_types:
            try:
                if viz_type == "heatmap":
                    success &= create_heatmap(df, output_dir, model_name)
                elif viz_type == "bar_chart":
                    success &= create_bar_chart(df, output_dir, model_name)
                elif viz_type == "radar_chart":
                    success &= create_radar_chart(df, output_dir, model_name)
                elif viz_type == "model_comparison":
                    success &= create_model_comparison(df, output_dir)
                elif viz_type == "task_breakdown":
                    success &= create_task_breakdown(df, output_dir, model_name)
                elif viz_type == "interactive_dashboard":
                    success &= create_interactive_dashboard(df, output_dir, model_name)
                else:
                    logger.warning(f"Unknown visualization type: {viz_type}")
            except Exception as e:
                logger.error(f"Error creating {viz_type}: {e}")
                success = False
    
    except Exception as e:
        logger.error(f"Error setting up visualizations: {e}")
        return False
    
    if success:
        logger.info(f"Visualizations saved to: {output_dir}")
    
    return success

def create_heatmap(df: pd.DataFrame, output_dir: str, model_name: str = None):
    """Create a heatmap of scores across tasks and benchmarks"""
    try:
        # Prepare data for heatmap
        pivot_data = df[df['Benchmark'] != 'Average'].pivot_table(
            values='Score', 
            index='Model', 
            columns=['Task', 'Benchmark'], 
            aggfunc='mean'
        )
        
        if pivot_data.empty:
            logger.warning("No data available for heatmap")
            return False
        
        # Create heatmap
        plt.figure(figsize=(16, 8))
        sns.heatmap(
            pivot_data, 
            annot=True, 
            fmt='.2f', 
            cmap='RdYlBu_r',
            center=0.5,
            cbar_kws={'label': 'Score'}
        )
        
        title = f"Performance Heatmap - {model_name}" if model_name else "Performance Heatmap - All Models"
        plt.title(title, fontsize=16, fontweight='bold')
        plt.xlabel('Task - Benchmark', fontsize=12)
        plt.ylabel('Model', fontsize=12)
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()
        
        filename = f"heatmap_{model_name.replace('/', '_')}.png" if model_name else "heatmap_all_models.png"
        plt.savefig(os.path.join(output_dir, filename), dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Heatmap saved: {filename}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating heatmap: {e}")
        return False

def create_bar_chart(df: pd.DataFrame, output_dir: str, model_name: str = None):
    """Create bar charts showing performance across different metrics"""
    try:
        # Average scores by task group
        avg_scores = df[df['Benchmark'] == 'Average'].groupby(['Model', 'Task'])['Score'].mean().reset_index()
        
        if avg_scores.empty:
            logger.warning("No average scores available for bar chart")
            return False
        
        plt.figure(figsize=(14, 8))
        
        if model_name:
            model_data = avg_scores[avg_scores['Model'] == model_name]
            bars = plt.bar(model_data['Task'], model_data['Score'], color='skyblue', alpha=0.8)
            title = f"Average Performance by Task - {model_name}"
        else:
            # Multiple models comparison
            pivot_avg = avg_scores.pivot(index='Task', columns='Model', values='Score')
            pivot_avg.plot(kind='bar', figsize=(14, 8), alpha=0.8)
            title = "Average Performance by Task - Model Comparison"
            plt.legend(title='Model', bbox_to_anchor=(1.05, 1), loc='upper left')
        
        plt.title(title, fontsize=16, fontweight='bold')
        plt.xlabel('Task Group', fontsize=12)
        plt.ylabel('Average Score', fontsize=12)
        plt.xticks(rotation=45, ha='right')
        plt.grid(axis='y', alpha=0.3)
        
        # Add value labels on bars
        if model_name:
            for bar in bars:
                height = bar.get_height()
                if pd.notna(height):
                    plt.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                            f'{height:.2f}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        
        filename = f"bar_chart_{model_name.replace('/', '_')}.png" if model_name else "bar_chart_comparison.png"
        plt.savefig(os.path.join(output_dir, filename), dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Bar chart saved: {filename}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating bar chart: {e}")
        return False

def create_radar_chart(df: pd.DataFrame, output_dir: str, model_name: str = None):
    """Create radar chart showing model performance across different dimensions"""
    try:
        import numpy as np
        
        # Get average scores by task
        avg_scores = df[df['Benchmark'] == 'Average'].groupby(['Model', 'Task'])['Score'].mean().reset_index()
        
        if avg_scores.empty:
            logger.warning("No average scores available for radar chart")
            return False
        
        # Prepare data
        if model_name:
            model_data = avg_scores[avg_scores['Model'] == model_name]
            models_to_plot = [model_name]
        else:
            model_data = avg_scores
            models_to_plot = avg_scores['Model'].unique()[:5]  # Limit to 5 models for readability
        
        tasks = avg_scores['Task'].unique()
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(projection='polar'))
        
        # Set up angles for radar chart
        angles = np.linspace(0, 2 * np.pi, len(tasks), endpoint=False).tolist()
        angles += angles[:1]  # Complete the circle
        
        # Plot each model
        colors = plt.cm.Set3(np.linspace(0, 1, len(models_to_plot)))
        
        for i, model in enumerate(models_to_plot):
            model_scores = []
            for task in tasks:
                score_row = model_data[(model_data['Model'] == model) & (model_data['Task'] == task)]
                score = score_row['Score'].iloc[0] if not score_row.empty else 0
                model_scores.append(score)
            
            model_scores += model_scores[:1]  # Complete the circle
            
            ax.plot(angles, model_scores, 'o-', linewidth=2, label=model, color=colors[i])
            ax.fill(angles, model_scores, alpha=0.25, color=colors[i])
        
        # Customize chart
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(tasks)
        ax.set_ylim(0, 1)
        ax.set_yticks([0.2, 0.4, 0.6, 0.8, 1.0])
        ax.set_yticklabels(['0.2', '0.4', '0.6', '0.8', '1.0'])
        ax.grid(True)
        
        title = f"Performance Radar Chart - {model_name}" if model_name else "Performance Radar Chart - Model Comparison"
        plt.title(title, size=16, fontweight='bold', pad=20)
        
        if len(models_to_plot) > 1:
            plt.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0))
        
        plt.tight_layout()
        
        filename = f"radar_chart_{model_name.replace('/', '_')}.png" if model_name else "radar_chart_comparison.png"
        plt.savefig(os.path.join(output_dir, filename), dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Radar chart saved: {filename}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating radar chart: {e}")
        return False

def create_model_comparison(df: pd.DataFrame, output_dir: str):
    """Create comprehensive model comparison visualizations"""
    try:
        # Overall performance comparison
        avg_scores = df[df['Benchmark'] == 'Average'].groupby('Model')['Score'].mean().sort_values(ascending=False)
        
        if avg_scores.empty:
            logger.warning("No data available for model comparison")
            return False
        
        plt.figure(figsize=(12, 8))
        bars = plt.bar(range(len(avg_scores)), avg_scores.values, color='lightcoral', alpha=0.8)
        
        plt.title('Overall Model Performance Comparison', fontsize=16, fontweight='bold')
        plt.xlabel('Model', fontsize=12)
        plt.ylabel('Average Score', fontsize=12)
        plt.xticks(range(len(avg_scores)), avg_scores.index, rotation=45, ha='right')
        plt.grid(axis='y', alpha=0.3)
        
        # Add value labels
        for i, (bar, score) in enumerate(zip(bars, avg_scores.values)):
            plt.text(bar.get_x() + bar.get_width()/2., score + 0.01,
                    f'{score:.3f}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "model_comparison_overall.png"), dpi=300, bbox_inches='tight')
        plt.close()
        
        # Task-specific comparison
        task_comparison = df[df['Benchmark'] == 'Average'].pivot(index='Task', columns='Model', values='Score')
        
        plt.figure(figsize=(14, 8))
        task_comparison.plot(kind='bar', alpha=0.8)
        plt.title('Model Performance by Task Group', fontsize=16, fontweight='bold')
        plt.xlabel('Task Group', fontsize=12)
        plt.ylabel('Average Score', fontsize=12)
        plt.xticks(rotation=45, ha='right')
        plt.legend(title='Model', bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "model_comparison_by_task.png"), dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info("Model comparison charts saved")
        return True
        
    except Exception as e:
        logger.error(f"Error creating model comparison: {e}")
        return False

def create_task_breakdown(df: pd.DataFrame, output_dir: str, model_name: str = None):
    """Create detailed breakdown of performance within each task"""
    try:
        # Filter data
        plot_df = df[df['Benchmark'] != 'Average'].copy() if not df.empty else pd.DataFrame()
        
        if model_name:
            plot_df = plot_df[plot_df['Model'] == model_name]
        
        if plot_df.empty:
            logger.warning("No detailed benchmark data available for task breakdown")
            return False
        
        # Create subplots for each task
        tasks = plot_df['Task'].unique()
        n_tasks = len(tasks)
        
        if n_tasks == 0:
            return False
        
        fig, axes = plt.subplots(n_tasks, 1, figsize=(12, 4 * n_tasks))
        if n_tasks == 1:
            axes = [axes]
        
        for i, task in enumerate(tasks):
            task_data = plot_df[plot_df['Task'] == task]
            
            if model_name:
                # Single model - show benchmarks
                benchmark_scores = task_data.groupby('Benchmark')['Score'].mean().sort_values(ascending=True)
                bars = axes[i].barh(range(len(benchmark_scores)), benchmark_scores.values, color='lightblue', alpha=0.8)
                axes[i].set_yticks(range(len(benchmark_scores)))
                axes[i].set_yticklabels(benchmark_scores.index)
                axes[i].set_xlabel('Score')
                
                # Add value labels
                for j, (bar, score) in enumerate(zip(bars, benchmark_scores.values)):
                    if pd.notna(score):
                        axes[i].text(score + 0.01, bar.get_y() + bar.get_height()/2.,
                                   f'{score:.3f}', va='center', fontweight='bold')
            else:
                # Multiple models - show comparison
                task_pivot = task_data.pivot_table(values='Score', index='Benchmark', columns='Model', aggfunc='mean')
                task_pivot.plot(kind='bar', ax=axes[i], alpha=0.8)
                axes[i].set_xticklabels(task_pivot.index, rotation=45, ha='right')
                axes[i].legend(title='Model', bbox_to_anchor=(1.05, 1), loc='upper left')
            
            axes[i].set_title(f'Task: {task}', fontweight='bold')
            axes[i].grid(axis='x' if model_name else 'y', alpha=0.3)
        
        title = f"Task Breakdown - {model_name}" if model_name else "Task Breakdown - All Models"
        fig.suptitle(title, fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        filename = f"task_breakdown_{model_name.replace('/', '_')}.png" if model_name else "task_breakdown_all.png"
        plt.savefig(os.path.join(output_dir, filename), dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Task breakdown saved: {filename}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating task breakdown: {e}")
        return False

def create_interactive_dashboard(df: pd.DataFrame, output_dir: str, model_name: str = None):
    """Create an interactive Plotly dashboard"""
    try:
        # Overall performance chart
        avg_scores = df[df['Benchmark'] == 'Average'].groupby(['Model', 'Task'])['Score'].mean().reset_index()
        
        if avg_scores.empty:
            logger.warning("No data available for interactive dashboard")
            return False
        
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Overall Performance', 'Task Comparison', 'Score Distribution', 'Detailed Breakdown'),
            specs=[[{"type": "bar"}, {"type": "bar"}],
                   [{"type": "histogram"}, {"type": "scatter"}]]
        )
        
        # 1. Overall performance
        if model_name:
            model_avg = avg_scores[avg_scores['Model'] == model_name].groupby('Model')['Score'].mean()
            fig.add_trace(
                go.Bar(x=model_avg.index, y=model_avg.values, name="Overall Score"),
                row=1, col=1
            )
        else:
            overall_avg = avg_scores.groupby('Model')['Score'].mean().sort_values(ascending=False)
            fig.add_trace(
                go.Bar(x=overall_avg.index, y=overall_avg.values, name="Overall Score"),
                row=1, col=1
            )
        
        # 2. Task comparison
        for task in avg_scores['Task'].unique():
            task_data = avg_scores[avg_scores['Task'] == task]
            fig.add_trace(
                go.Bar(x=task_data['Model'], y=task_data['Score'], name=task),
                row=1, col=2
            )
        
        # 3. Score distribution
        all_scores = df[df['Score'].notna()]['Score']
        fig.add_trace(
            go.Histogram(x=all_scores, name="Score Distribution", nbinsx=20),
            row=2, col=1
        )
        
        # 4. Detailed scatter plot
        detailed_df = df[df['Benchmark'] != 'Average'].copy()
        if not detailed_df.empty:
            fig.add_trace(
                go.Scatter(
                    x=detailed_df['Task'],
                    y=detailed_df['Score'],
                    mode='markers',
                    text=detailed_df['Benchmark'],
                    name="Detailed Scores",
                    marker=dict(size=8, opacity=0.7)
                ),
                row=2, col=2
            )
        
        # Update layout
        title = f"Interactive Dashboard - {model_name}" if model_name else "Interactive Dashboard - All Models"
        fig.update_layout(
            title_text=title,
            title_x=0.5,
            height=800,
            showlegend=True
        )
        
        # Save interactive HTML
        filename = f"dashboard_{model_name.replace('/', '_')}.html" if model_name else "dashboard_all.html"
        fig.write_html(os.path.join(output_dir, filename))
        
        logger.info(f"Interactive dashboard saved: {filename}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating interactive dashboard: {e}")
        return False
# In scripts/run_benchmarks.py

def main_orchestrator():
    """
    Main function to orchestrate the LLM benchmark evaluations.
    Supports both INTERACTIVE (for command-line use) and 
    NON-INTERACTIVE (for API/scripted use) modes.
    """
    parser = argparse.ArgumentParser(description="Eka-Eval: LLM Benchmark Evaluation Suite.")
    
    # --- COMBINED ARGUMENTS FOR BOTH MODES ---
    # Non-Interactive Arguments
    parser.add_argument("--model_name", type=str, help="Full model name or path. Bypasses interactive model selection.")
    parser.add_argument("--benchmarks_json", type=str, help="A JSON string mapping task groups to benchmarks. Bypasses interactive benchmark selection.")

    # General Configuration Arguments
    parser.add_argument("--num_gpus", type=int, help="Number of GPUs/workers to use. Default: all available.")
    parser.add_argument("--batch_size", type=int, default=4, help="Default batch size for worker tasks.")
    parser.add_argument("--results_dir", type=str, default="results_output", help="Directory to save evaluation results.")
    parser.add_argument("--log_level", type=str, default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"], help="Logging level.")
    
    # Interactive-Mode-Only Arguments (will be ignored in non-interactive mode)
    parser.add_argument("--task_groups", type=str, nargs='+', help="[INTERACTIVE-ONLY] List of task groups to run.")
    
    # Visualization Arguments
    parser.add_argument("--visualize", action="store_true", help="Create visualizations after evaluation.")
    parser.add_argument("--viz_only", action="store_true", help="Only create visualizations (skip evaluation).")
    parser.add_argument("--viz_types", type=str, nargs="+", default=["heatmap", "bar_chart", "model_comparison"], help="Types of visualizations to create.")
    # ... other viz args

    args = parser.parse_args()
    
    # It's important to set up logging first
    setup_logging(level=getattr(logging, args.log_level.upper(), logging.INFO), worker_id="Orchestrator")

    # --- NEW CONFIRMATION LOGS ---
    logger.info("==========================================================")
    logger.info("--- EKA-EVAL ORCHESTRATOR SCRIPT STARTED SUCCESSFULLY ---")
    logger.info("==========================================================")
    
    # Check which mode we are in
    is_interactive = not (args.model_name and args.benchmarks_json)
    logger.info(f"RUNNING IN: {'INTERACTIVE' if is_interactive else 'NON-INTERACTIVE (API)'} MODE")

    # Log the received arguments for debugging
    logger.info(f"Received Model: {args.model_name}")
    logger.info(f"Received Benchmarks JSON: {args.benchmarks_json}")
    logger.info(f"Received GPU Count: {args.num_gpus}")
    logger.info(f"Received Batch Size: {args.batch_size}")
    logger.info("----------------------------------------------------------")
    results_csv_path = os.path.join(args.results_dir, 'calculated.csv')
    if args.viz_only:
        # ... (visualization logic)
        return

    benchmark_registry = BenchmarkRegistry()
    if not benchmark_registry.benchmarks:
        logger.critical("Benchmark configuration is empty or failed to load. Exiting.")
        return

    # =================================================================
    # --- SMART SELECTION: Non-Interactive vs. Interactive ---
    # =================================================================

    # --- 1. MODEL SELECTION ---
    if args.model_name:
        # --- NON-INTERACTIVE MODEL SELECTION ---
        input_model_name = args.model_name
        is_api_model = False  # Default to local; can be expanded later if needed
        api_provider, api_key = None, None
        logger.info(f"Using model from arguments: {input_model_name}")
    else:
        # --- INTERACTIVE MODEL SELECTION ---
        logger.info("\n--- Model Selection ---")
        try:
            model_info, is_api_model = get_model_selection_interface()
            input_model_name = model_info["model_name"]
            api_provider = model_info.get("provider")
            api_key = model_info.get("api_key")
            logger.info(f"Selected model interactively: {input_model_name}")
        except Exception as e:
            logger.error(f"Error during interactive model selection: {e}")
            return

    if not input_model_name:
        logger.error("No model selected. Exiting.")
        return

    # --- 2. BENCHMARK SELECTION ---
    user_selected_benchmarks: PyDict[str, List[str]] = {}
    ordered_selected_task_groups_for_processing: List[str] = []

    if args.benchmarks_json:
        # --- NON-INTERACTIVE BENCHMARK SELECTION ---
        logger.info("Running in non-interactive mode with --benchmarks_json.")
        try:
            selected_data = json.loads(args.benchmarks_json)
            user_selected_benchmarks = selected_data
            ordered_selected_task_groups_for_processing = list(selected_data.keys())
            logger.info(f"Benchmarks loaded from JSON: {user_selected_benchmarks}")
        except json.JSONDecodeError:
            logger.critical("Invalid JSON provided to --benchmarks_json. Exiting.")
            return
    else:
        # --- INTERACTIVE BENCHMARK SELECTION ---
        logger.info("Running in interactive mode for benchmark selection.")
        # This is the full interactive logic from your old version
        logger.info("\n--- Available Benchmark Task Groups ---")
        all_task_groups = benchmark_registry.get_task_groups()
        for i, tg_name in enumerate(all_task_groups):
            print(f"{i+1}. {tg_name}")
        print(f"{len(all_task_groups)+1}. ALL Task Groups")

        selected_indices_str = input(f"Select task group #(s) (e.g., '1', '1 3', 'ALL'): ").strip().lower().split()
        chosen_initial_task_groups: List[str] = []
        if "all" in selected_indices_str or str(len(all_task_groups) + 1) in selected_indices_str:
            chosen_initial_task_groups = all_task_groups
        else:
            for idx_str in selected_indices_str:
                try:
                    idx = int(idx_str) - 1
                    if 0 <= idx < len(all_task_groups):
                        chosen_initial_task_groups.append(all_task_groups[idx])
                except ValueError:
                    logger.warning(f"Invalid input '{idx_str}' ignored.")

        if not chosen_initial_task_groups:
            logger.error("No valid task groups selected. Exiting.")
            return

        for task_group_name in chosen_initial_task_groups:
            group_benchmarks = benchmark_registry.get_benchmarks_for_group(task_group_name)
            if len(group_benchmarks) == 1 and group_benchmarks[0] == task_group_name:
                user_selected_benchmarks[task_group_name] = [task_group_name]
                if task_group_name not in ordered_selected_task_groups_for_processing:
                    ordered_selected_task_groups_for_processing.append(task_group_name)
            else:
                logger.info(f"\n--- Select benchmarks for Task Group: {task_group_name} ---")
                for i, sub_bm in enumerate(group_benchmarks): print(f"{i+1}. {sub_bm}")
                print(f"{len(group_benchmarks)+1}. ALL (within {task_group_name})")
                
                selected_sub_indices_str = input(f"Select benchmark #(s) for {task_group_name}: ").strip().lower().split()
                selected_for_this_group: List[str] = []
                if "all" in selected_sub_indices_str or str(len(group_benchmarks)+1) in selected_sub_indices_str:
                    selected_for_this_group = group_benchmarks
                else:
                    for sub_idx_str in selected_sub_indices_str:
                        try:
                            sub_idx = int(sub_idx_str) - 1
                            if 0 <= sub_idx < len(group_benchmarks):
                                selected_for_this_group.append(group_benchmarks[sub_idx])
                        except ValueError:
                            logger.warning(f"Invalid input '{sub_idx_str}' ignored.")
                
                if selected_for_this_group:
                    user_selected_benchmarks[task_group_name] = sorted(list(set(selected_for_this_group)))
                    if task_group_name not in ordered_selected_task_groups_for_processing:
                        ordered_selected_task_groups_for_processing.append(task_group_name)

    # --- From this point on, the logic is the same for both modes ---
    if not user_selected_benchmarks:
        logger.info("No benchmarks were selected for evaluation. Exiting.")
        return

    logger.info("\n--- Final Benchmarks Selected for Evaluation ---")
    for tg_name in ordered_selected_task_groups_for_processing:
        if tg_name in user_selected_benchmarks:
            logger.info(f"- {tg_name}: {user_selected_benchmarks[tg_name]}")
# Check for completed benchmarks
    completed_benchmarks_set: Set[Tuple[str, str]] = set()
    if os.path.exists(results_csv_path):
        try:
            df = pd.read_csv(results_csv_path)
            if all(col in df.columns for col in ['Model', 'Task', 'Benchmark', 'Score']):
                model_df = df[df['Model'] == input_model_name]
                for _, row in model_df.iterrows():
                    if pd.notna(row['Score']):
                        completed_benchmarks_set.add((row['Task'], row['Benchmark']))
                logger.info(f"Found {len(completed_benchmarks_set)} completed benchmarks.")
        except Exception as e:
            logger.error(f"Error loading completed benchmarks: {e}")

    # Filter tasks needing evaluation
    tasks_to_schedule_for_workers: PyDict[str, List[str]] = defaultdict(list)
    for task_group, selected_bms_for_group in user_selected_benchmarks.items():
        bms_needing_eval = [bm for bm in selected_bms_for_group if (task_group, bm) not in completed_benchmarks_set]
        if bms_needing_eval:
            tasks_to_schedule_for_workers[task_group] = bms_needing_eval

    if not tasks_to_schedule_for_workers:
        logger.info(f"All benchmarks already completed!")
        display_consolidated_results(input_model_name, results_csv_path, user_selected_benchmarks, ordered_selected_task_groups_for_processing, benchmark_registry)
        return

    logger.info(f"\n--- Tasks to Evaluate ---")
    for tg in ordered_selected_task_groups_for_processing:
        if tg in tasks_to_schedule_for_workers:
            logger.info(f"- {tg}: {tasks_to_schedule_for_workers[tg]}")

    # GPU/Worker setup
    available_gpus = get_constrained_gpus()
    total_workers_to_use = 1 if not available_gpus else min(args.num_gpus or len(available_gpus), len(available_gpus))
    effective_gpu_ids = available_gpus[:total_workers_to_use] if available_gpus else [-1]
    
    logger.info(f"Using {total_workers_to_use} worker(s) on GPUs: {effective_gpu_ids}")

    # Prepare work items
    work_items: List[PyDict[str, Any]] = []
    for task_group, benchmarks in tasks_to_schedule_for_workers.items():
        for bm in benchmarks:
            work_items.append({'task_group': task_group, 'benchmarks': [bm]})

    # Launch workers
    processes = []
    logger.info(f"\n--- Launching {len(work_items)} tasks across {total_workers_to_use} workers ---")
    
    for i, work_item in enumerate(work_items):
        worker_idx = i % total_workers_to_use
        gpu_id = effective_gpu_ids[worker_idx]
        
        p = multiprocessing.Process(
            target=worker_process,
            args=(gpu_id, i, input_model_name, total_workers_to_use,
                  work_item['task_group'], work_item['benchmarks'],
                  args.batch_size, is_api_model, api_provider, api_key)
        )
        processes.append(p)
        p.start()
        time.sleep(1)

    for i, p in enumerate(processes):
        p.join()
        logger.info(f"Worker {i} finished.")

    logger.info("\n--- All workers completed ---")
    display_consolidated_results(input_model_name, results_csv_path, user_selected_benchmarks, ordered_selected_task_groups_for_processing, benchmark_registry)
    # --- (The rest of the script: checking completed tasks, scheduling workers,
    # launching processes, and displaying results is UNCHANGED) ---
    
    # ... (Paste the rest of your original, working orchestrator logic here, from
    #      `completed_benchmarks_set: Set[Tuple[str, str]] = set()` onwards) ...```
                # Ask about output di
def display_consolidated_results(
    model_name_to_display: str,
    csv_path: str,
    user_selected_benchmarks_map: PyDict[str, List[str]], 
    ordered_task_groups_for_display: List[str],
    registry: BenchmarkRegistry 
):
    """Displaying consolidated results (unchanged from original)"""
    if not os.path.exists(csv_path):
        logger.error(f"Results file '{csv_path}' not found. Cannot display results.")
        return
    try:
        final_df = pd.read_csv(csv_path)
        model_df_display = final_df[final_df['Model'] == model_name_to_display].copy()

        if model_df_display.empty:
            logger.info(f"\nNo results found for model '{model_name_to_display}' in '{csv_path}'.")
            return

        model_df_display['Score'] = pd.to_numeric(model_df_display['Score'], errors='coerce')

        size_b_val = 'N/A'
        if 'Size (B)' in model_df_display.columns and not model_df_display['Size (B)'].dropna().empty:
            size_b_val = model_df_display['Size (B)'].dropna().iloc[0]

        current_model_row_data = {('Model', ''): model_name_to_display, ('Size (B)', ''): size_b_val}
        task_bm_scores_from_csv = defaultdict(lambda: defaultdict(lambda: pd.NA))
        for _, row in model_df_display.iterrows():
            task_bm_scores_from_csv[row['Task']][row['Benchmark']] = row['Score']

        multi_index_columns_for_df = [('Model', ''), ('Size (B)', '')]

        for task_group_name in ordered_task_groups_for_display:
            if task_group_name not in user_selected_benchmarks_map:
                continue

            selected_bms_in_this_group = user_selected_benchmarks_map.get(task_group_name, [])
            if not selected_bms_in_this_group:
                continue

            registry_benchmarks_for_group = registry.get_benchmarks_for_group(task_group_name)
            is_single_bm_task_group = len(registry_benchmarks_for_group) == 1 and registry_benchmarks_for_group[0] == task_group_name

            if is_single_bm_task_group:
                if task_group_name in selected_bms_in_this_group: 
                    score = task_bm_scores_from_csv[task_group_name].get(task_group_name, pd.NA)
                    current_model_row_data[(task_group_name, '')] = round(score, 2) if pd.notna(score) else pd.NA 
                    multi_index_columns_for_df.append((task_group_name, '')) 
                    current_model_row_data[(task_group_name, 'Average')] = round(score, 2) if pd.notna(score) else pd.NA
                    multi_index_columns_for_df.append((task_group_name, 'Average'))
            else: 
                actual_scores_for_group_avg = []
                canonical_bms_in_group = registry.get_benchmarks_for_group(task_group_name)

                for bm_name in canonical_bms_in_group:
                    if bm_name in selected_bms_in_this_group:
                        score = task_bm_scores_from_csv[task_group_name].get(bm_name, pd.NA)
                        current_model_row_data[(task_group_name, bm_name)] = round(score, 2) if pd.notna(score) else pd.NA
                        multi_index_columns_for_df.append((task_group_name, bm_name))
                        if pd.notna(score):
                            actual_scores_for_group_avg.append(score)

                if len([bm for bm in canonical_bms_in_group if bm in selected_bms_in_this_group]) > 1:
                    avg_score_from_csv = task_bm_scores_from_csv[task_group_name].get('Average', pd.NA)
                    if pd.notna(avg_score_from_csv):
                        current_model_row_data[(task_group_name, 'Average')] = round(avg_score_from_csv, 2)
                    elif actual_scores_for_group_avg:
                        avg_score_calculated = sum(actual_scores_for_group_avg) / len(actual_scores_for_group_avg)
                        current_model_row_data[(task_group_name, 'Average')] = round(avg_score_calculated, 2)
                        logger.warning(f"Calculated average for {task_group_name} as it was missing from CSV.")
                    else:
                        current_model_row_data[(task_group_name, 'Average')] = pd.NA
                    multi_index_columns_for_df.append((task_group_name, 'Average'))

        seen_cols, unique_multi_index_cols = set(), []
        for col_tuple in multi_index_columns_for_df:
            if col_tuple not in seen_cols:
                unique_multi_index_cols.append(col_tuple)
                seen_cols.add(col_tuple)

        if not unique_multi_index_cols or (len(unique_multi_index_cols) == 2 and unique_multi_index_cols[0][0] == 'Model' and unique_multi_index_cols[1][0] == 'Size (B)' ):
             logger.warning("No benchmark score columns to display in table for the selected model.")
             if ('Model', '') in current_model_row_data :
                 print(f"\nModel: {current_model_row_data[('Model', '')]}, Size (B): {current_model_row_data.get(('Size (B)', ''), 'N/A')}")
                 print("No benchmark scores were found or selected for display for this model.")
             return

        df_for_display = pd.DataFrame(columns=pd.MultiIndex.from_tuples(unique_multi_index_cols))
        row_data_for_series = {col_t: current_model_row_data.get(col_t, pd.NA) for col_t in unique_multi_index_cols}
        series_for_df_row = pd.Series(row_data_for_series, index=df_for_display.columns)

        if not series_for_df_row.empty:
            df_for_display.loc[0] = series_for_df_row
        elif unique_multi_index_cols:
            df_for_display.loc[0] = pd.NA

        def sort_key_for_display_table(col_tuple: Tuple[str, str]):
            tg_name, bm_name = col_tuple[0], col_tuple[1]
            if tg_name == 'Model': return (0, 0, 0)
            if tg_name == 'Size (B)': return (1, 0, 0)

            try: 
                task_order_idx = ordered_task_groups_for_display.index(tg_name)
            except ValueError:
                task_order_idx = 9999 
                
            registry_bms_for_group_sort = registry.get_benchmarks_for_group(tg_name)
            is_single_bm_group_sort = len(registry_bms_for_group_sort) == 1 and registry_bms_for_group_sort[0] == tg_name

            if is_single_bm_group_sort:
                sub_order = 0 if bm_name == '' else 1 
                return (2, task_order_idx, sub_order) 
            else: # Multi-benchmark group
                if bm_name == 'Average':
                    bm_order_idx = 99999 # Average last within its group
                else:
                    try:
                        canonical_bms_in_group_sort = registry.get_benchmarks_for_group(tg_name)
                        bm_order_idx = canonical_bms_in_group_sort.index(bm_name)
                    except (KeyError, ValueError):
                        bm_order_idx = 99998
                return (3, task_order_idx, bm_order_idx) 

        cols_to_sort = [col for col in df_for_display.columns.tolist() if col in unique_multi_index_cols]
        if not cols_to_sort and not df_for_display.empty:
             cols_to_sort = df_for_display.columns.tolist()

        if cols_to_sort:
            sorted_display_columns = sorted(cols_to_sort, key=sort_key_for_display_table)
            df_for_display = df_for_display[sorted_display_columns]
        elif df_for_display.empty:
            logger.info("No results data to display in table.")
            return

        logger.info("\n--- Consolidated Evaluation Results ---")
        print(df_for_display.to_markdown(index=False, floatfmt=".2f"))

    except FileNotFoundError:
        logger.error(f"Results file '{csv_path}' not found for display.")
    except Exception as e:
        logger.error(f"Error displaying consolidated results from '{csv_path}': {e}", exc_info=True)


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main_orchestrator()