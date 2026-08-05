import os
import sys
import subprocess

# Auto-detect and use .venv Python if system Python was called
project_root = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.join(project_root, ".venv", "Scripts", "python.exe")

if os.path.exists(venv_python) and os.path.normpath(sys.executable).lower() != os.path.normpath(venv_python).lower():
    sys.exit(subprocess.call([venv_python] + sys.argv))

# Switch working directory to backend
backend_dir = os.path.join(project_root, "backend")
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

import uvicorn

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
