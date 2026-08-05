import os
import sys
import subprocess

# Auto-detect and use .venv Python if system Python was called
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
venv_python = os.path.join(project_root, ".venv", "Scripts", "python.exe")

if os.path.exists(venv_python) and os.path.normpath(sys.executable).lower() != os.path.normpath(venv_python).lower():
    sys.exit(subprocess.call([venv_python] + sys.argv))

import uvicorn

if __name__ == "__main__":
    is_prod = os.getenv("APP_ENV") == "production"
    host = os.getenv("HOST", "0.0.0.0" if is_prod else "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=not is_prod)
