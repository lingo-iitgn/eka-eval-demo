
---

# EKA-EVAL Demo

<p align="center">
<img src="https://img.shields.io/badge/python-3.9%2B-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />
<img src="https://img.shields.io/badge/framework-React%20%7C%20FastAPI-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/benchmarks-55%2B%20Supported-orange?style=for-the-badge" />
</p>

<p align="center"><b>EKA-EVAL Demo</b></p>
<p align="center">
Evaluation Framework for <b>Low-Resource Multilingual Large Language Models</b>
</p>

<div align="center">
<a href="https://lingo.iitgn.ac.in/eka-eval/">
<img width="150" src="https://github.com/user-attachments/assets/2822b114-39bb-4c19-8808-accd8b415b3a"/>
</a>
</div>

---

# Overview

**EKA-EVAL** is a unified framework for evaluating **Large Language Models (LLMs)** across **low-resource multilingual settings**.

Modern LLM evaluation frameworks often focus on high-resource languages and require complex command-line workflows. This creates barriers for researchers working with **Indic, African, and Southeast Asian languages**.

EKA-EVAL addresses this gap through a **Zero-Code Web Interface** that allows users to configure and run multilingual benchmarks directly from the browser.

The framework integrates:

• **55+ benchmarks** across multiple evaluation categories
• **23 multilingual datasets** targeting low-resource languages
• **visual analytics and leaderboards** for model comparison
• **automated AI-generated diagnostics** explaining model failures

The **eka-eval-demo repository** provides the **full UI-based evaluation platform**, combining a **React frontend** with a **FastAPI backend** for interactive benchmarking workflows.

EKA-EVAL is designed to make **multilingual LLM evaluation accessible, reproducible, and scalable**. 

---

# Zero-Code Evaluation Interface

A key contribution of EKA-EVAL is its **web-based evaluation interface**, which enables end-to-end benchmarking without writing code.

The UI allows researchers to:

• select benchmarks
• configure prompts and inference settings
• monitor evaluation progress
• analyze results through interactive dashboards

This removes the need for manual configuration files or complex CLI pipelines.

---

# Key UI Features

### Benchmark Selection Dashboard

Users can create custom evaluation suites by selecting benchmarks from different categories.

📷 **Screenshot Placeholder**

```
<img width="603" height="296" alt="Screenshot 2026-03-08 at 7 32 27 PM" src="https://github.com/user-attachments/assets/37d6f915-19e0-4c22-b3e6-044e5ae4ee34" />

```

The dashboard groups tasks into domains such as:

• reasoning
• code generation
• multilingual QA
• commonsense reasoning

---

### Advanced Configuration Panel

The configuration interface enables users to adjust inference parameters such as:

• temperature
• batch size
• decoding strategy

It also includes a **GPU resource manager** for allocating compute resources during evaluation.

<img width="604" height="343" alt="Screenshot 2026-03-08 at 7 32 55 PM" src="https://github.com/user-attachments/assets/b1a12bef-f98a-4216-aa92-29bc53593c9b" />

---

### Prompt Customization Interface

EKA-EVAL includes a visual **Prompt Editing Engine** that allows users to modify:

• system prompts
• few-shot examples
• template variables

without editing configuration files.


<img width="602" height="375" alt="Screenshot 2026-03-08 at 7 33 16 PM" src="https://github.com/user-attachments/assets/022591fe-42a8-4f0f-8f9a-f16156915fd4" />



---

### Live Evaluation Dashboard

During evaluation, the system streams real-time progress including:

• inference logs
• benchmark progress
• GPU utilization
<img width="606" height="332" alt="Screenshot 2026-03-08 at 7 33 46 PM" src="https://github.com/user-attachments/assets/e9637bb5-30ba-49dc-a70b-17b309491776" />


---

### AI Diagnosis Dashboard

After evaluation, EKA-EVAL automatically analyzes results using a large language model.

The system identifies:

• model strengths
• failure patterns
• hallucination cases
• weaknesses in low-resource languages

Users can inspect individual failed predictions and see explanations for why the model likely failed.
<img width="598" height="283" alt="Screenshot 2026-03-08 at 7 34 22 PM" src="https://github.com/user-attachments/assets/f4532567-1a39-4c00-b46d-e1ca44ba054b" />

---

### Interactive Leaderboard


All evaluation runs are aggregated into a **dynamic leaderboard** that enables comparison across:

• models
• languages
• benchmarks

<img width="592" height="407" alt="Screenshot 2026-03-08 at 7 34 40 PM" src="https://github.com/user-attachments/assets/4872a697-76cf-4840-9033-356273435220" />


Visualizations include:

• radar charts
• benchmark-wise bar charts
• performance summaries


<img width="590" height="520" alt="Screenshot 2026-03-08 at 7 35 00 PM" src="https://github.com/user-attachments/assets/4b37436e-e5a9-424f-a118-12a32ce22124" />

<img width="597" height="484" alt="Screenshot 2026-03-08 at 7 35 14 PM" src="https://github.com/user-attachments/assets/c1d67f61-3830-4211-85d7-106b60cb46fa" />


---

# Low-Resource Multilingual Benchmark Suite

EKA-EVAL provides one of the **largest unified multilingual evaluation suites**.

These benchmarks evaluate model performance across languages that are typically underrepresented in LLM research.

### Knowledge & Reasoning

IndicMMLU-Pro
MMLU-IN
MILU
TriviaQA-IN
ARC-Challenge-Indic

### Reading & Question Answering

Belebele (122 languages)
XQuAD-Indic
XorQA-Indic
BoolQ-Indic
Indic-QA

### Natural Language Understanding

IndicNER
IndicSentiment
IndicGLUE
XNLI

### Multilingual Generation

Flores-IN
IndicWikiBio
IndicParaphrase

These benchmarks cover languages such as:

Hindi
Bengali
Kannada
Malayalam
Odia
Swahili
Yoruba
Telugu

---

# System Architecture

EKA-EVAL follows a modular architecture consisting of four main components.

### Evaluation Engine

Handles evaluation scheduling, batching, and distributed inference across benchmarks.

### Benchmark Registry

Provides a standardized interface for loading datasets from:

• HuggingFace Hub
• local datasets
• custom evaluation datasets

### Model Interface Layer

Supports both:

• local transformer checkpoints
• API-based models

### Results Processing System

Computes metrics such as:

• Accuracy
• BLEU
• F1 Score
• Exact Match
• Pass@1

and generates visual analytics.

---

# Installation

Clone the repository:

```bash
git clone https://github.com/lingo-iitgn/eka-eval-demo.git
cd eka-eval-demo
```

Create a Python environment:

```bash
conda create -n eka-env python=3.10 pip -y
conda activate eka-env
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# Running the Application

The demo platform consists of:

• **FastAPI Backend**
• **React Frontend**

Both services must be started separately.

---

# Start Backend

```bash
uvicorn main:app --reload
```

Backend runs at

```
http://127.0.0.1:8000
```

---

# Start Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# Citation

If you use EKA-EVAL in your research, please cite:

```bibtex
@misc{sinha2025ekaeval,
title={EKA-EVAL : An Evaluation Framework for Low-Resource Multilingual Large Language Models},
author={Samridhi Raj Sinha and Rajvee Sheth and Abhishek Upperwal and Mayank Singh},
year={2025},
url={https://github.com/lingo-iitgn/eka-eval}
}
```

---

