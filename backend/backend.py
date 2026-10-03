"""
Compatibility shim for cloud deployment environments (such as Render) where
the Root Directory is set to 'backend', but the Start Command is executed as:
    uvicorn backend.main:app --host 0.0.0.0 --port $PORT

This module intercepts 'backend', adds the current folder to sys.path, and
registers 'backend.main' to point directly to 'main.py'.
"""
import sys
from pathlib import Path

_current_dir = str(Path(__file__).resolve().parent)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

try:
    from . import main
except (ImportError, ValueError):
    import main

# Alias into sys.modules so uvicorn can resolve backend.main
sys.modules["backend"] = sys.modules[__name__]
sys.modules["backend.main"] = main
