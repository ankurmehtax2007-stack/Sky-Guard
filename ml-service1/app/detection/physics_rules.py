import numpy as np
import pandas as pd
from .physics_config import PhysicsEngine, load_physics_config

def bin_physics_score(scores):
    arr=np.asarray(scores,dtype=float)
    return np.select([arr<.12,arr<.38,arr<.65,arr<.85],[0.,.25,.5,.75],default=1.)

def evaluate_physics(df: pd.DataFrame, cfg=None) -> pd.DataFrame:
    engine=PhysicsEngine(cfg or load_physics_config())
    rows=[]
    for _, row in df.iterrows():
        result=engine.evaluate(row.to_dict())
        count=result["physics_violation_count"]
        score=float(np.clip(1-np.exp(-count/3.0),0,1))
        rows.append({"physics_violation_count":count,"physics_violation_score":score,
                     "physics_evidence_score":score,"physics_violated_rules":result["violated_rules"],
                     "physics_rules":result["rules"]})
    return pd.DataFrame(rows,index=df.index)
