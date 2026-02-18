import subprocess
import signal
import sys
import os
import time

# Global process variables for cleanup
backend_process = None
frontend_process = None

def cleanup(sig=None, frame=None):
    """Cleanup function to terminate processes."""
    print('\nShutting down services...')
    if backend_process:
        print("Stopping Backend...")
        backend_process.terminate()
    if frontend_process:
        print("Stopping Frontend...")
        # On Windows, terminating the shell might not kill the child npm process,
        # but on Linux/Mac it usually propagates or we might need a process group kill.
        # For simplicity in this script, terminate is usually sufficient for dev servers.
        frontend_process.terminate()
    sys.exit(0)

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    global backend_process, frontend_process

    # Determine Python executable
    # If specific venv exists, prefer it. Otherwise use current sys.executable.
    python_exec = sys.executable
    if os.path.exists("venv/bin/python"):
        python_exec = "venv/bin/python"
    elif os.path.exists("venv/Scripts/python.exe"): # Windows fallback
        python_exec = "venv/Scripts/python.exe"
    
    print(f"Using Python: {python_exec}")

    # Start Backend
    print("Starting Backend (FastAPI)...")
    try:
        backend_process = subprocess.Popen(
            [python_exec, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
            cwd=os.getcwd()
        )
    except FileNotFoundError:
        print("Error: Python or Uvicorn not found. Ensure requirements are installed.")
        return

    # Give backend a moment to start (optional, but nice for logs)
    time.sleep(1)

    # Start Frontend
    print("Starting Frontend (Vite)...")
    try:
        # 'npm' needs to be in PATH. 
        # On Windows, 'npm' is a batch file, so shell=True might be needed or use 'npm.cmd'.
        # On Linux/Mac, 'npm' is usually a script.
        npm_cmd = "npm"
        if os.name == 'nt':
            npm_cmd = "npm.cmd"
        
        frontend_process = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=os.path.join(os.getcwd(), "frontend")
        )
    except FileNotFoundError:
        print("Error: npm not found. Ensure Node.js is installed.")
        if backend_process:
            backend_process.terminate()
        return

    print("\n🚀 Project is running!")
    print("Backend: http://localhost:8000")
    print("Frontend: http://localhost:5173 (usually)")
    print("Press Ctrl+C to stop both.\n")

    # Wait for processes to complete (they likely won't unless crashed or stopped)
    backend_process.wait()
    frontend_process.wait()

if __name__ == "__main__":
    main()
