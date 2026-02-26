#!/bin/bash

# This script creates the file structure for the 'indic' benchmark tasks.
# It should be run from within the .../benchmarks/tasks/indic/ directory.

echo "Setting up Indic benchmark file structure..."

# Create the subdirectory
echo "Creating directory: boolq-in"
mkdir -p boolq-in

# Create the Python files in the current directory
echo "Creating Python files..."
touch arc_c_in.py
touch cross_sum.py
touch flores_in.py
touch gsm8k_in.py
touch milu_in.py
touch mmlu_in.py
touch triviaqa_in.py
touch xorqa_in.py
touch xquad_in.py

# It's good practice to add __init__.py files to make these folders Python packages
touch __init__.py
touch boolq-in/__init__.py

echo ""
echo "✅ All files and directories created successfully!"