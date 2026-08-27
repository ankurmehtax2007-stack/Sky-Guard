import os
from pathlib import Path

CURRENT_FILE = Path(__file__).resolve()

def _find_dir(dir_name: str) -> Path:
    env_val = os.getenv(dir_name.upper() + '_DIR')
    if env_val:
        p = Path(env_val)
        if p.exists(): return p.resolve()
        
    # Search all ancestors of CURRENT_FILE
    for parent in [CURRENT_FILE.parent, *CURRENT_FILE.parents]:
        cand = parent / dir_name
        if cand.exists() and cand.is_dir():
            return cand.resolve()
            
    # Search relative to current working directory
    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        cand = parent / dir_name
        if cand.exists() and cand.is_dir():
            return cand.resolve()
            
    # Docker mount fallback
    docker_cand = Path(f"/app/{dir_name}")
    if docker_cand.exists() and docker_cand.is_dir():
        return docker_cand.resolve()
        
    fallback = CURRENT_FILE.parents[2] / dir_name
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback.resolve()

def _find_file(rel_path: str) -> Path:
    env_val = os.getenv('METADATA_PATH')
    if env_val:
        p = Path(env_val)
        if p.exists(): return p.resolve()
        
    for parent in [CURRENT_FILE.parent, *CURRENT_FILE.parents]:
        cand = parent / rel_path
        if cand.exists() and cand.is_file():
            return cand.resolve()
            
    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        cand = parent / rel_path
        if cand.exists() and cand.is_file():
            return cand.resolve()
            
    docker_cand = Path(f"/app/{rel_path}")
    if docker_cand.exists() and docker_cand.is_file():
        return docker_cand.resolve()
        
    return (CURRENT_FILE.parents[2] / rel_path).resolve()

MODEL_DIR = _find_dir('models')
METADATA_PATH = _find_file('metadata/pipeline_metadata.json')

