#!/bin/bash

# This script creates the file structure for the 'utils' directory.
# It should be run from within the .../eka_eval/utils/ directory.

echo "Setting up utils file structure..."

# Create the Python files in the current directory
echo "Creating Python utility files..."
touch __init__.py
touch constants.py
touch file_utils.py
touch gpu_utils.py
touch logging_setup.py
touch prompt_utils.py

echo ""
echo "✅ All utility files created successfully!"