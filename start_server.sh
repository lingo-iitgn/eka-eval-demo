#!/bin/bash

# start_server.sh - Start Eka-Eval with proper GPU configuration

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Eka-Eval Server${NC}"

# Activate virtual environment
if [ -d "myenv" ]; then
    source myenv/bin/activate
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
elif [ -d "eka310" ]; then
    source eka310/bin/activate
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
else
    echo -e "${YELLOW}⚠ No virtual environment found (myenv or eka310)${NC}"
fi

# Check GPU availability
echo -e "\n${YELLOW}Checking GPU availability...${NC}"
nvidia-smi --query-gpu=index,name,memory.used,memory.total --format=csv,noheader

# Ask which GPU to use
echo -e "\n${YELLOW}Which GPU would you like to use?${NC}"
echo "Enter GPU ID (e.g., 3 for GPU 3), or press Enter for GPU 3:"
read gpu_id

# Default to GPU 3 if nothing entered
if [ -z "$gpu_id" ]; then
    gpu_id=3
fi

echo -e "${GREEN}Selected GPU: $gpu_id${NC}"

# Set environment variables
export CUDA_VISIBLE_DEVICES=$gpu_id
export PYTHONPATH=./src:$PYTHONPATH

# Navigate to project directory
cd ~/project16 || { echo -e "${RED}❌ project16 directory not found${NC}"; exit 1; }

# Check if uvicorn is installed
if ! command -v uvicorn &> /dev/null; then
    echo -e "${RED}❌ uvicorn not found. Installing...${NC}"
    pip install uvicorn
fi

# Display configuration
echo -e "\n${GREEN}=== Configuration ===${NC}"
echo -e "GPU ID: ${YELLOW}$gpu_id${NC}"
echo -e "CUDA_VISIBLE_DEVICES: ${YELLOW}$CUDA_VISIBLE_DEVICES${NC}"
echo -e "PYTHONPATH: ${YELLOW}$PYTHONPATH${NC}"
echo -e "Working Directory: ${YELLOW}$(pwd)${NC}"

# Start the server
echo -e "\n${GREEN}Starting Uvicorn server on http://127.0.0.1:8001${NC}"
echo -e "${YELLOW}Press CTRL+C to stop${NC}\n"

uvicorn src.eka_eval.eka_eval.core.main:app --reload --port 8001