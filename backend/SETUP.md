# Backend Setup Guide

## Step 1: Navigate to Backend Directory
```bash
cd backend
```

## Step 2: Create Virtual Environment

### For macOS/Linux:
```bash
python3 -m venv venv
```

### For Windows:
```bash
python -m venv venv
```

This creates a `venv` folder in your backend directory.

## Step 3: Activate Virtual Environment

### For macOS/Linux:
```bash
source venv/bin/activate
```

### For Windows (Command Prompt):
```bash
venv\Scripts\activate
```

### For Windows (PowerShell):
```bash
venv\Scripts\Activate.ps1
```

**Note:** When activated, you'll see `(venv)` at the beginning of your terminal prompt.

## Step 4: Install Requirements
```bash
pip install -r requirements.txt
```

This will install all the packages listed in `requirements.txt`:
- fastapi
- uvicorn
- sqlalchemy
- pydantic
- python-multipart

## Step 5: Run the Backend Server
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

## Step 6: Deactivate Virtual Environment (when done)
```bash
deactivate
```

## Troubleshooting

### If `python3` command not found:
- Try `python` instead
- Make sure Python 3.7+ is installed

### If `pip` command not found:
- Try `pip3` instead
- On some systems: `python -m pip install -r requirements.txt`

### If you get permission errors:
- Make sure you're using a virtual environment (not installing globally)
- Check that the venv is activated

### If you need to recreate the virtual environment:
```bash
# Remove the old one
rm -rf venv  # macOS/Linux
# or
rmdir /s venv  # Windows

# Create a new one
python3 -m venv venv  # macOS/Linux
python -m venv venv   # Windows
```

