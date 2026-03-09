
---

# EKA-EVAL Demo

<p align="center">
<img src="https://img.shields.io/badge/python-3.9%2B-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />
<img src="https://img.shields.io/badge/framework-React%20%7C%20FastAPI-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/benchmarks-55%2B%20Supported-orange?style=for-the-badge" />
</p>

<p align="center">
<b>EKA-EVAL Demo</b>
</p>

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

**EKA-EVAL** is a unified framework for evaluating **Large Language Models (LLMs)** across **low-resource multilingual languages**.

Most existing evaluation frameworks focus heavily on **English and high-resource languages**, while requiring complex CLI workflows and configuration files.

**EKA-EVAL solves this with a Zero-Code Web Interface**, enabling researchers to run multilingual evaluations directly from a browser.

### What the framework provides

| Capability                 | Description                                       |
| -------------------------- | ------------------------------------------------- |
| 🌍 Multilingual Benchmarks | 55+ benchmarks including 23 multilingual datasets |
| 🖥 Zero-Code UI            | Run evaluations without editing configs or code   |
| 📊 Visual Analytics        | Interactive charts and model comparisons          |
| 🤖 AI Diagnostics          | Automatic analysis of model failures              |
| ⚡ Modular Framework        | Easily extend with new models and datasets        |

The **eka-eval-demo repository** provides the **complete UI-based evaluation platform**, combining a **React frontend** with a **FastAPI backend**.

---

# Zero-Code Evaluation Interface

The **web interface** allows users to perform full evaluations without writing code.

### Workflow

```
Select Model → Choose Benchmarks → Configure Parameters → Run Evaluation → Analyze Results
```

Users can:

• select multilingual benchmarks
• configure prompts and inference parameters
• monitor evaluation progress
• visualize benchmark performance

---

# UI Features

---

## Benchmark Selection Dashboard

Users can build evaluation suites by selecting benchmarks from multiple categories.

<div align="center">
<img width="700" src="https://github.com/user-attachments/assets/37d6f915-19e0-4c22-b3e6-044e5ae4ee34" />
</div>

Supported domains include:

| Category        | Examples     |
| --------------- | ------------ |
| Reasoning       | ARC, MMLU    |
| Code Generation | HumanEval    |
| Commonsense     | HellaSwag    |
| Multilingual QA | XQuAD, XorQA |

---

## Advanced Configuration Panel

Fine-tune evaluation settings directly in the UI.

<div align="center">
<img width="700" src="https://github.com/user-attachments/assets/b1a12bef-f98a-4216-aa92-29bc53593c9b" />
</div>

| Parameter        | Purpose                       |
| ---------------- | ----------------------------- |
| Temperature      | Controls randomness           |
| Batch Size       | Optimizes GPU throughput      |
| Top-p / decoding | Controls generation diversity |
| GPU Manager      | Select compute resources      |

---

## Prompt Customization Interface

Modify prompts without editing JSON configuration files.

<div align="center">
<img width="700" src="https://github.com/user-attachments/assets/022591fe-42a8-4f0f-8f9a-f16156915fd4" />
</div>

Users can edit:

• system prompts
• few-shot examples
• prompt templates

---

## Live Evaluation Dashboard

Real-time monitoring of evaluation progress.

<div align="center">
<img width="700" src="https://github.com/user-attachments/assets/e9637bb5-30ba-49dc-a70b-17b309491776" />
</div>

Displays:

| Feature          | Description                   |
| ---------------- | ----------------------------- |
| Live Logs        | Streamed model inference logs |
| Benchmark Status | Task progress tracking        |
| GPU Usage        | Real-time resource monitoring |

---

## AI Diagnosis Dashboard

Automatically analyzes model failures after evaluation.

<div align="center">
<img width="700" src="https://github.com/user-attachments/assets/f4532567-1a39-4c00-b46d-e1ca44ba054b" />
</div>

Provides insights such as:

• hallucination patterns
• reasoning weaknesses
• multilingual performance gaps

---

## Interactive Leaderboard

Compare models across benchmarks and languages.

<div align="center">
<img width="700" src="https://github.com/user-attachments/assets/4872a697-76cf-4840-9033-356273435220" />
</div>

### Visualization Examples

<div align="center">
<img width="600" src="https://github.com/user-attachments/assets/4b37436e-e5a9-424f-a118-12a32ce22124" />
</div>

<div align="center">
<img width="600" src="https://github.com/user-attachments/assets/c1d67f61-3830-4211-85d7-106b60cb46fa" />
</div>

| Visualization | Purpose                   |
| ------------- | ------------------------- |
| Radar Charts  | Compare model strengths   |
| Bar Charts    | Benchmark score breakdown |
| Leaderboards  | Model ranking             |

---

# Low-Resource Multilingual Benchmark Suite

EKA-EVAL includes one of the **largest multilingual evaluation suites** for LLMs.

### Knowledge & Reasoning

| Benchmark           | Description                              |
| ------------------- | ---------------------------------------- |
| IndicMMLU-Pro       | Indic multi-task reasoning               |
| MMLU-IN             | Multilingual reasoning                   |
| MILU                | Indic language understanding             |
| TriviaQA-IN         | Multilingual QA                          |
| ARC-Challenge-Indic | Science reasoning across Indic languages |

---

### Reading & Question Answering

| Benchmark   | Languages       |
| ----------- | --------------- |
| Belebele    | 122 languages   |
| XQuAD-Indic | Hindi, Greek    |
| XorQA-Indic | Bengali, Telugu |
| BoolQ-Indic | Indic languages |
| Indic-QA    | Multilingual QA |

---

### Natural Language Understanding

| Benchmark      | Task                     |
| -------------- | ------------------------ |
| IndicNER       | Named entity recognition |
| IndicSentiment | Sentiment classification |
| IndicGLUE      | Multilingual NLU         |
| XNLI           | Cross-lingual inference  |

---

### Multilingual Generation

| Benchmark       | Task                    |
| --------------- | ----------------------- |
| Flores-IN       | Translation             |
| IndicWikiBio    | Biographical generation |
| IndicParaphrase | Paraphrase generation   |

Supported languages include:

Hindi • Bengali • Kannada • Malayalam • Odia • Telugu • Swahili • Yoruba

---

# System Architecture

EKA-EVAL follows a **four-layer modular architecture**.

| Layer              | Responsibility                                   |
| ------------------ | ------------------------------------------------ |
| Evaluation Engine  | task scheduling, batching, distributed inference |
| Benchmark Registry | dataset loading and benchmark configuration      |
| Model Interface    | local models + API models                        |
| Results Processor  | metrics computation and visualization            |

---

# Installation

Clone the repository

```bash
git clone https://github.com/lingo-iitgn/eka-eval-demo.git
cd eka-eval-demo
```

Create environment

```bash
conda create -n eka-env python=3.10 pip -y
conda activate eka-env
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

# Running the Application

The demo platform consists of two services.

| Service  | Technology |
| -------- | ---------- |
| Backend  | FastAPI    |
| Frontend | React      |

---

## Start Backend

```bash
uvicorn main:app --reload
```

Backend runs at

```
http://127.0.0.1:8000
```

---

## Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# Citation

If you use EKA-EVAL in your research:

```bibtex
@misc{sinha2025ekaevalcomprehensiveevaluation,
      title={Eka-Eval : A Comprehensive Evaluation Framework for Large Language Models in Indian Languages}, 
      author={Samridhi Raj Sinha and Rajvee Sheth and Abhishek Upperwal and Mayank Singh},
      year={2025},
      eprint={2507.01853},
      archivePrefix={arXiv},
      primaryClass={cs.CL}
}
```

---
