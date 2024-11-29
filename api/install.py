#!/usr/bin/env python3
"""Installation script for Python dependencies."""
import os
import sys
import urllib.request
import subprocess
from pathlib import Path

def setup_virtualenv():
    """Set up a virtual environment."""
    try:
        venv_path = Path('venv')
        if not venv_path.exists():
            subprocess.check_call([sys.executable, '-m', 'venv', 'venv'])
        
        # Activate virtual environment
        if sys.platform == 'win32':
            python_path = venv_path / 'Scripts' / 'python.exe'
        else:
            python_path = venv_path / 'bin' / 'python'
            
        return str(python_path)
    except Exception as e:
        print(f"Error setting up virtual environment: {e}")
        return sys.executable

def install_dependencies(python_path):
    """Install required Python packages."""
    try:
        requirements_path = Path(__file__).parent / 'requirements.txt'
        subprocess.check_call([
            python_path, '-m', 'pip', 'install',
            '-r', str(requirements_path)
        ])
        print("Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        return False

if __name__ == "__main__":
    python_path = setup_virtualenv()
    install_dependencies(python_path)