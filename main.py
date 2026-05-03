import sys
from pathlib import Path

# Add backend to PYTHONPATH so imports work if executed from root
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.main import app
