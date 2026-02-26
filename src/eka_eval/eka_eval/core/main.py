# src/eka_eval/eka_eval/core/main.py (FULLY FIXED)

import logging
from datetime import datetime
import csv
import asyncio
import uvicorn
import functools
import subprocess
import json
import sys
import os
import pandas as pd
from fastapi.responses import FileResponse
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from ..benchmarks.benchmark_registry import BenchmarkRegistry
from . import model_loader

logger = logging.getLogger("eka_eval.core")
if not logger.hasHandlers():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

app = FastAPI(
    title="Eka Eval Model Server",
    description="API for loading, managing, and running inference with models.",
    version="1.0.0"
)

origins = [
    "https://10.0.62.187:5173/",  # Your frontend
    "https://localhost:5173",   # Also good to add for local testing
]

# 3. Add the middleware to your app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)



# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: str):
        if not self.active_connections:
            logger.warning("No active WebSocket connections to broadcast to")
            return
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# --- Pydantic Models ---
class AdvancedSettings(BaseModel):
    batchSize: int
    maxNewTokens: int
    temperature: float
    gpuCount: int
class FeedbackRequest(BaseModel):
    email: Optional[str] = "anonymous"
    feedback: str
FEEDBACK_FILE = "feedback_submissions.csv"
class EvaluationRequest(BaseModel):
    model: Dict[str, Any]
    benchmarks: List[str]
    advancedSettings: AdvancedSettings

class ModelInitRequest(BaseModel):
    type: str
    identifier: str
    apiKey: Optional[str] = None
    provider: Optional[str] = None
    gpu_id: int = 0

class GenerateRequest(BaseModel):
    prompt: str
    max_length: int = 100

# --- Global state ---
CURRENT_MODEL: Dict[str, Any] = {
    "pipeline": None,
    "param_count": "N/A",
    "config": None
}
model_lock = asyncio.Lock()

# --- API Endpoints ---

@app.get("/api/v1/benchmarks", tags=["Benchmarks"])
async def get_benchmarks():
    try:
        registry = BenchmarkRegistry()
        all_task_groups = registry.get_task_groups()
        if not all_task_groups:
            raise Exception("BenchmarkRegistry loaded no task groups.")
        
        colors = ['#00BFFF', '#00FFFF', '#FFD700', '#FF8C00', '#9D4EDD', 
                  '#00C9A7', '#B0C4DE', '#D3D3D3', '#FF69B4', '#7B68EE']
        frontend_categories = []
        
        for i, group_name in enumerate(all_task_groups):
            benchmarks_in_group = registry.get_benchmarks_for_group(group_name)
            category_obj = {
                "id": group_name.lower().replace(" ", "_").replace("-", ""),
                "name": group_name,
                "description": f"Evaluations for {group_name}",
                "color": colors[i % len(colors)],
                "benchmarks": []
            }
            
            for benchmark_name in benchmarks_in_group:
                details = registry.benchmarks.get(group_name, {}).get(benchmark_name, {})
                benchmark_obj = {
                    "id": benchmark_name.lower().replace(" ", "_").replace("-", "").replace("+", "plus"),
                    "name": benchmark_name,
                    "category": category_obj["id"],
                    "description": details.get("description", ""),
                    "difficulty": "medium"
                }
                category_obj["benchmarks"].append(benchmark_obj)
            
            frontend_categories.append(category_obj)
        
        return frontend_categories
    except Exception as e:
        logger.error(f"Failed to load benchmark config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not load benchmark configuration.")

@app.get("/api/v1/model-status", tags=["Model Management"])
async def get_model_status():
    if CURRENT_MODEL["pipeline"]:
        return {
            "loaded": True,
            "config": CURRENT_MODEL["config"],
            "param_count": CURRENT_MODEL["param_count"]
        }
    return {"loaded": False}

@app.post("/api/v1/init-model", tags=["Model Management"])
async def init_model(request: ModelInitRequest):
    async with model_lock:
        if CURRENT_MODEL["pipeline"]:
            await asyncio.to_thread(
                model_loader.cleanup_model_resources,
                CURRENT_MODEL["pipeline"]
            )
        
        try:
            loader_func = functools.partial(
                model_loader.initialize_model_pipeline,
                model_name_or_path=request.identifier,
                target_device_id=0,
                is_api_model=(request.type == 'api'),
                api_provider=request.provider,
                api_key=request.apiKey
            )
            
            pipeline, param_count = await asyncio.to_thread(loader_func)
            
            if pipeline is None:
                raise Exception("Model initialization returned None.")
            
            CURRENT_MODEL.update({
                "pipeline": pipeline,
                "param_count": param_count,
                "config": request.dict()
            })
            
            return {
                "status": "success",
                "message": "Model initialized.",
                "config": CURRENT_MODEL["config"]
            }
        except Exception as e:
            logger.error(f"Failed to initialize model {request.identifier}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/cleanup-model", tags=["Model Management"])
async def cleanup_model():
    async with model_lock:
        if CURRENT_MODEL["pipeline"]:
            await asyncio.to_thread(
                model_loader.cleanup_model_resources,
                CURRENT_MODEL["pipeline"]
            )
            CURRENT_MODEL.update({
                "pipeline": None,
                "param_count": "N/A",
                "config": None
            })
            return {"status": "success", "message": "Model cleaned up."}
        return {"status": "info", "message": "No model loaded."}

@app.post("/api/v1/generate", tags=["Inference"])
async def generate_text(request: GenerateRequest):
    if not CURRENT_MODEL["pipeline"]:
        raise HTTPException(status_code=400, detail="No model loaded.")
    
    try:
        result = await asyncio.to_thread(
            CURRENT_MODEL["pipeline"],
            request.prompt,
            max_length=request.max_length,
            do_sample=False
        )
        return {"generated_text": result[0]["generated_text"]}
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/run-evaluation", tags=["Evaluation"])
async def run_evaluation(request: EvaluationRequest):
    logger.info("="*80)
    logger.info(f"🚀 EVALUATION REQUEST RECEIVED")
    logger.info(f"Model: {request.model.get('identifier')}")
    logger.info(f"Benchmarks: {request.benchmarks}")
    logger.info(f"Settings: {request.advancedSettings}")
    logger.info("="*80)
    
    model_name = request.model.get('identifier')
    if not model_name:
        raise HTTPException(status_code=400, detail="Model identifier is missing.")
    
    # Build benchmarks map
    registry = BenchmarkRegistry()
    benchmarks_by_group = {}
    
    for bm_id in request.benchmarks:
        found = registry.find_benchmark_by_id(bm_id)
        if found:
            group, name = found
            if group not in benchmarks_by_group:
                benchmarks_by_group[group] = []
            benchmarks_by_group[group].append(name)
    
    if not benchmarks_by_group:
        raise HTTPException(status_code=400, detail="No valid benchmarks selected.")
    
    logger.info(f"📊 Mapped benchmarks by group: {benchmarks_by_group}")
    
    # Prepare command
    benchmarks_json_str = json.dumps(benchmarks_by_group)
    python_executable = sys.executable or "python3"
    
    # Path calculation
    current_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    script_path = os.path.join(src_dir, 'scripts', 'run_benchmarks.py')
    
    logger.info(f"📂 Current file: {__file__}")
    logger.info(f"📂 Calculated src_dir: {src_dir}")
    logger.info(f"📂 Script path: {script_path}")
    logger.info(f"📂 Script exists: {os.path.exists(script_path)}")
    
    if not os.path.exists(script_path):
        error_msg = f"❌ FATAL: run_benchmarks.py not found at: {script_path}"
        logger.error(error_msg)
        await manager.broadcast(json.dumps({
            "type": "log",
            "payload": error_msg
        }))
        raise HTTPException(status_code=500, detail=error_msg)
    
    # Build command
    command = [
        python_executable,
        "-u",
        script_path,
        "--model_name", model_name,
        "--benchmarks_json", benchmarks_json_str,
        "--batch_size", str(request.advancedSettings.batchSize),
        "--num_gpus", "1",
    ]
    
    # Environment setup
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{src_dir}{os.pathsep}{env.get('PYTHONPATH', '')}"
    
    cuda_visible = env.get("CUDA_VISIBLE_DEVICES", "not set")
    logger.info(f"🎮 CUDA_VISIBLE_DEVICES: {cuda_visible}")
    logger.info(f"🔧 PYTHONPATH: {env['PYTHONPATH']}")
    logger.info(f"💻 Full command: {' '.join(command)}")
    
    # Broadcast initial messages
    await manager.broadcast(json.dumps({
        "type": "log",
        "payload": f"🚀 Starting evaluation for {model_name}"
    }))
    
    await manager.broadcast(json.dumps({
        "type": "log",
        "payload": f"🎮 Using GPU: {cuda_visible}"
    }))
    
    # Start subprocess
    logger.info("🔄 Creating subprocess task...")
    task = asyncio.create_task(run_subprocess_and_stream_logs(command, env, model_name))
    logger.info(f"✅ Subprocess task created: {task}")
    
    return {
        "status": "success",
        "message": "Evaluation process initiated.",
        "details": {
            "model": model_name,
            "benchmarks_count": len(request.benchmarks),
            "gpu": cuda_visible,
            "script_path": script_path
        }
    }

async def run_subprocess_and_stream_logs(command: List[str], env: Dict, model_name: str):
    """Runs command and streams logs with comprehensive error handling"""
    logger.info("="*80)
    logger.info("📡 SUBPROCESS STREAM STARTING")
    logger.info("="*80)
    
    results_sent = False
    
    try:
        await manager.broadcast(json.dumps({
            "type": "log",
            "payload": "🔄 Launching evaluation subprocess..."
        }))
        
        logger.info(f"Executing: {' '.join(command[:5])}...")
        
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env
        )
        
        logger.info(f"✅ Process started with PID: {process.pid}")
        
        await manager.broadcast(json.dumps({
            "type": "log",
            "payload": f"✅ Subprocess launched (PID: {process.pid})"
        }))
        
        # Stream both stdout and stderr
        async def stream_output(stream, prefix="", is_error=False):
            line_count = 0
            while True:
                try:
                    line = await stream.readline()
                    if not line:
                        break
                    
                    decoded = line.decode('utf-8', errors='replace').strip()
                    if decoded:
                        line_count += 1
                        log_msg = f"{prefix}{decoded}"
                        
                        # Log to console
                        if is_error:
                            logger.error(log_msg)
                        else:
                            logger.info(log_msg)
                        
                        # Broadcast to WebSocket
                        await manager.broadcast(json.dumps({
                            "type": "log",
                            "payload": log_msg
                        }))
                        
                        # Check for results marker
                        if "Consolidated Evaluation Results" in decoded:
                            logger.info("🎯 Results marker detected!")
                except Exception as e:
                    logger.error(f"Error reading stream: {e}")
                    break
            
            logger.info(f"Stream finished. Read {line_count} lines.")
        
        # Run both streams concurrently
        await asyncio.gather(
            stream_output(process.stdout, "", False),
            stream_output(process.stderr, "⚠️ [STDERR] ", True)
        )
        
        # Wait for process to complete
        return_code = await process.wait()
        
        logger.info(f"Process finished with return code: {return_code}")
        
        if return_code == 0:
            success_msg = "✅ Evaluation completed successfully!"
            logger.info(success_msg)
            await manager.broadcast(json.dumps({
                "type": "log",
                "payload": success_msg
            }))
            
            # Wait a bit for files to be written
            await asyncio.sleep(1)
            
            # Send completion status
            await manager.broadcast(json.dumps({
                "type": "status",
                "payload": "completed"
            }))
            results_sent = True
            
        else:
            error_msg = f"❌ Subprocess exited with error code {return_code}"
            logger.error(error_msg)
            await manager.broadcast(json.dumps({
                "type": "log",
                "payload": error_msg
            }))
    
    except Exception as e:
        error_msg = f"💥 CRITICAL ERROR in subprocess: {str(e)}"
        logger.error(error_msg, exc_info=True)
        await manager.broadcast(json.dumps({
            "type": "log",
            "payload": error_msg
        }))
    
    finally:
        if not results_sent:
            await manager.broadcast(json.dumps({
                "type": "status",
                "payload": "completed"
            }))
        logger.info("="*80)
        logger.info("📡 SUBPROCESS STREAM FINISHED")
        logger.info("="*80)

@app.websocket("/ws/v1/evaluation-logs")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Send initial connection message
    try:
        await websocket.send_text(json.dumps({
            "type": "log",
            "payload": "🔗 Connected to evaluation server"
        }))
    except Exception as e:
        logger.error(f"Error sending initial message: {e}")
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            logger.debug(f"Received from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected from WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/api/v1/debug/results-files", tags=["Debug"])
async def debug_results_files():
    """Debug endpoint to check what result files exist"""
    results_dir = os.environ.get("RESULTS_DIR", "results_output")
    
    debug_info = {
        "results_dir": results_dir,
        "dir_exists": os.path.exists(results_dir),
        "files": [],
        "cwd": os.getcwd()
    }
    
    if os.path.exists(results_dir):
        debug_info["files"] = os.listdir(results_dir)
        
        # Check calculated.csv specifically
        csv_path = os.path.join(results_dir, "calculated.csv")
        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)
                debug_info["csv_info"] = {
                    "shape": df.shape,
                    "columns": df.columns.tolist(),
                    "models": df['Model'].unique().tolist() if 'Model' in df.columns else [],
                    "first_rows": df.head(3).to_dict('records')
                }
            except Exception as e:
                debug_info["csv_error"] = str(e)
    
    return debug_info


@app.get("/api/v1/results/latest/{model_name:path}", tags=["Results"])
async def get_latest_result_fixed(model_name: str):
    """FIXED version - Get the most recent evaluation result for a specific model"""
    results_dir = os.environ.get("RESULTS_DIR", "results_output")
    csv_path = os.path.join(results_dir, "calculated.csv")
    
    logger.info(f"📊 Fetching results for model: {model_name}")
    logger.info(f"📂 Looking in: {csv_path}")
    
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found at: {csv_path}")
        files = os.listdir(results_dir) if os.path.exists(results_dir) else []
        return {
            "found": False, 
            "message": "Results file not yet generated",
            "debug": {"expected_path": csv_path, "files_in_dir": files}
        }
    
    try:
        df = pd.read_csv(csv_path)
        logger.info(f"📊 CSV loaded with {len(df)} rows")
        
        # Get all rows for this model (most recent evaluation)
        model_df = df[df['Model'] == model_name].copy()
        
        if model_df.empty:
            return {
                "found": False, 
                "message": f"No results for model '{model_name}'",
                "available_models": df['Model'].unique().tolist()
            }
        
        # Get only the most recent entries (by timestamp) for each Task-Benchmark combo
        model_df['Timestamp'] = pd.to_datetime(model_df['Timestamp'])
        latest_df = model_df.sort_values('Timestamp').groupby(['Task', 'Benchmark']).tail(1)
        
        logger.info(f"📊 Found {len(latest_df)} latest benchmark results")
        
        # Build results structure
        latest = {
            "found": True,
            "model": model_name,
            "results": []
        }
        
        # Group by Task
        for task in latest_df['Task'].unique():
            task_data = latest_df[latest_df['Task'] == task]
            task_result = {
                "task": task,
                "benchmarks": []
            }
            
            valid_scores = []
            
            # Get individual benchmark scores
            for _, row in task_data.iterrows():
                score = None
                if pd.notna(row['Score']):
                    try:
                        score = float(row['Score'])
                        valid_scores.append(score)
                    except (ValueError, TypeError):
                        logger.warning(f"Could not convert score to float: {row['Score']}")
                
                task_result["benchmarks"].append({
                    "name": row['Benchmark'],
                    "score": score
                })
            
            # Calculate average from valid scores
            if valid_scores:
                task_result["average"] = sum(valid_scores) / len(valid_scores)
            else:
                task_result["average"] = None
            
            latest["results"].append(task_result)
        
        logger.info(f"✅ Successfully returned results for {len(latest['results'])} tasks")
        return latest
    
    except Exception as e:
        logger.error(f"💥 Error reading results: {e}", exc_info=True)
        return {
            "found": False,
            "message": f"Error reading results: {str(e)}",
            "error_type": type(e).__name__
        }

@app.get("/api/v1/results", tags=["Leaderboard"])
async def get_all_results():
    """Get all evaluation results for the leaderboard"""
    results_dir = os.environ.get("RESULTS_DIR", "results_output")
    csv_path = os.path.join(results_dir, "calculated.csv")
    
    logger.info(f"📊 Fetching all results from: {csv_path}")
    
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found at: {csv_path}")
        raise HTTPException(status_code=404, detail="No evaluation results found yet. Run some evaluations first!")
    
    try:
        df = pd.read_csv(csv_path)
        logger.info(f"📊 CSV loaded with {len(df)} rows")
        
        if df.empty:
            raise HTTPException(status_code=404, detail="Results file is empty")
        
        # Get unique models
        models = df['Model'].unique()
        
        # Build results structure
        results = {
            "models": [],
            "task_groups": df['Task'].unique().tolist()
        }
        
        for model_name in models:
            model_df = df[df['Model'] == model_name].copy()
            
            # Get latest results for this model
            model_df['Timestamp'] = pd.to_datetime(model_df['Timestamp'])
            latest_df = model_df.sort_values('Timestamp').groupby(['Task', 'Benchmark']).tail(1)
            
            # Calculate scores by task
            task_scores = {}
            all_scores = []
            
            for task in latest_df['Task'].unique():
                task_data = latest_df[latest_df['Task'] == task]
                valid_scores = []
                
                for _, row in task_data.iterrows():
                    if pd.notna(row['Score']):
                        try:
                            score = float(row['Score'])
                            valid_scores.append(score)
                            all_scores.append(score)
                        except (ValueError, TypeError):
                            continue
                
                if valid_scores:
                    task_scores[task] = sum(valid_scores) / len(valid_scores)
            
            # Calculate overall average
            average_score = sum(all_scores) / len(all_scores) if all_scores else None
            
            # Get model size (try to extract from name or use default)
            size = "Unknown"
            if "2b" in model_name.lower():
                size = "2B"
            elif "7b" in model_name.lower():
                size = "7B"
            elif "13b" in model_name.lower():
                size = "13B"
            elif "70b" in model_name.lower():
                size = "70B"
            
            # Build detailed scores structure
            scores = {}
            for _, row in latest_df.iterrows():
                task = row['Task']
                benchmark = row['Benchmark']
                
                if task not in scores:
                    scores[task] = {}
                
                try:
                    score = float(row['Score']) if pd.notna(row['Score']) else None
                except (ValueError, TypeError):
                    score = None
                
                scores[task][benchmark] = score
            
            results["models"].append({
                "name": model_name,
                "size": size,
                "scores": scores,
                "task_scores": task_scores,
                "average_score": average_score
            })
        
        # Sort by average score descending
        results["models"].sort(key=lambda x: x["average_score"] if x["average_score"] is not None else -1, reverse=True)
        
        logger.info(f"✅ Returning results for {len(results['models'])} models")
        return results
    
    except Exception as e:
        logger.error(f"💥 Error reading results: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error reading results: {str(e)}")


@app.get("/api/v1/results/download", tags=["Results"])
async def download_results_csv():
    """Download the complete results as CSV"""
    results_dir = os.environ.get("RESULTS_DIR", "results_output")
    csv_path = os.path.join(results_dir, "calculated.csv")
    
    logger.info(f"📥 Download request for: {csv_path}")
    
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found at: {csv_path}")
        raise HTTPException(status_code=404, detail="No results file available for download")
    
    try:
        return FileResponse(
            path=csv_path,
            media_type='text/csv',
            filename='evaluation_results.csv'
        )
    except Exception as e:
        logger.error(f"Error serving CSV file: {e}")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

@app.post("/api/v1/submit-feedback", tags=["Feedback"])
async def submit_feedback(request: FeedbackRequest):
    logger.info(f"Received feedback from: {request.email}")
    
    try:
        headers = ["timestamp", "email", "feedback"]
        file_exists = os.path.isfile(FEEDBACK_FILE)
        
        with open(FEEDBACK_FILE, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            if not file_exists:
                writer.writerow(headers)
            
            timestamp = datetime.now().isoformat()
            writer.writerow([timestamp, request.email, request.feedback])
            
        logger.info(f"Feedback successfully saved to {FEEDBACK_FILE}")
        return {"status": "success", "message": "Feedback submitted successfully."}
    
    except Exception as e:
        logger.error(f"Failed to save feedback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not save feedback: {str(e)}")


@app.on_event("startup")
async def startup_event():
    logger.info("="*80)
    logger.info("🚀 EKA-EVAL SERVER STARTING")
    logger.info(f"📂 Working directory: {os.getcwd()}")
    logger.info(f"🐍 Python executable: {sys.executable}")
    logger.info(f"🎮 CUDA_VISIBLE_DEVICES: {os.environ.get('CUDA_VISIBLE_DEVICES', 'not set')}")
    logger.info("="*80)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
    #new
    