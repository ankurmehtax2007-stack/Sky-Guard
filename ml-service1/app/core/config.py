import os
from pathlib import Path

CURRENT_FILE = Path(__file__).resolve()
APP_DIR = CURRENT_FILE.parents[1]
SERVICE_ROOT = CURRENT_FILE.parents[2]

def _resolve_model_dir() -> Path:
    env_path = os.getenv("MODEL_DIR")
    if env_path and Path(env_path).exists():
        return Path(env_path).resolve()
    
    candidates = [
        SERVICE_ROOT / "models",
        APP_DIR / "models",
        SERVICE_ROOT.parent / "ml-service1" / "models",
        SERVICE_ROOT.parent / "models",
        Path("/app/models")
    ]
    for c in candidates:
        if c.exists() and c.is_dir():
            return c.resolve()
            
    fallback = SERVICE_ROOT / "models"
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback.resolve()

def _resolve_metadata_path(model_dir: Path) -> Path:
    env_path = os.getenv("METADATA_PATH")
    if env_path and Path(env_path).is_file():
        return Path(env_path).resolve()
        
    for name in ["pipeline_metadata.json", "pipeline_metadata (1).json"]:
        p = model_dir / name
        if p.exists() and p.is_file():
            return p.resolve()
            
    return (model_dir / "pipeline_metadata (1).json").resolve()

MODEL_DIR = _resolve_model_dir()
METADATA_PATH = _resolve_metadata_path(MODEL_DIR)
