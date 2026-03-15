#!/bin/bash

# This script creates the file structure for the 'prompts' directory.
# It should be run from within the .../src/prompts/ directory.

echo "Setting up prompt file structure..."

# --- 1. Create all the main directories ---
echo "Creating categories: code, commonsense, general, indic, long_context, math, reading, tool_use, world_knowledge"
mkdir -p code
mkdir -p commonsense
mkdir -p general
mkdir -p indic
mkdir -p long_context
mkdir -p math
mkdir -p reading
mkdir -p tool_use
mkdir -p world_knowledge

# --- 2. Create the JSON files inside each directory ---

# Code
echo "Creating files in 'code'..."
touch code/humaneval.json
touch code/mbpp.json
touch code/multiple.json

# Commonsense
echo "Creating files in 'commonsense'..."
touch commonsense/arc_c.json
touch commonsense/commonsenseqa.json
touch commonsense/hellaswag.json
touch commonsense/openbookqa.json
touch commonsense/piqa.json
touch commonsense/siqa.json
touch commonsense/winogrande.json

# General (assuming it might have files later, creating the dir is enough for now)

# Indic
echo "Creating files in 'indic'..."
touch indic/arc_c_in.json
touch indic/boolq_in.json
touch indic/cross-sum.json
touch indic/flores.json
touch indic/milu.json
touch indic/mmlu_in.json
touch indic/trivia_qa.json
touch indic/triviaqa_in.json
touch indic/xorqa.json
touch indic/xquad.json

# Long Context
echo "Creating files in 'long_context'..."
touch long_context/infinitebench.json

# Math
echo "Creating files in 'math'..."
touch math/gsm8k.json
touch math/math.json

# Reading
echo "Creating files in 'reading'..."
touch reading/boolq.json
touch reading/quac.json
touch reading/squad.json

# Tool Use
echo "Creating files in 'tool_use'..."
touch tool_use/apibank.json
touch tool_use/apibench.json

# World Knowledge
echo "Creating files in 'world_knowledge'..."
touch world_knowledge/naturalqa.json
touch world_knowledge/triviaqa.json

echo ""
echo "✅ All prompt directories and files created successfully!"