import pandas as pd
import numpy as np
from typing import List, Optional

DEFAULT_CLUSTERS = [
    "Konkan_Deccan",
    "NCR",
    "Tamil_Nadu_Coast",
    "West_Bengal",
    "__MISSING__"
]

def encode_clusters(df: pd.DataFrame, cluster_col: str = "cluster", clusters: Optional[List[str]] = None) -> pd.DataFrame:
    """
    One-hot encodes the regional weather cluster column using fixed schema.
    """
    df = df.copy()
    valid_clusters = clusters or DEFAULT_CLUSTERS
    raw_series = df[cluster_col].fillna("NCR").astype(str).str.strip() if cluster_col in df.columns else pd.Series("NCR", index=df.index)
    
    for c in valid_clusters:
        col_name = f"cluster_{c}"
        if c == "__MISSING__":
            df[col_name] = raw_series.isin(["", "nan", "None", "__MISSING__"]).astype(float)
        else:
            df[col_name] = (raw_series == c).astype(float)
            
    return df

def to_model_matrix(engineered_df: pd.DataFrame, feature_cols: List[str]) -> pd.DataFrame:
    """
    Constructs a model input DataFrame ordered strictly by feature_cols.
    Ensures column name alignment, cluster dummy generation, and fills missing features with 0.0.
    """
    X = pd.DataFrame(index=engineered_df.index)
    col_map = {str(c).strip(): c for c in engineered_df.columns}
    
    for f in feature_cols:
        f_clean = str(f).strip()
        if f in engineered_df.columns:
            X[f] = engineered_df[f]
        elif f_clean in col_map:
            X[f] = engineered_df[col_map[f_clean]]
        elif f_clean.startswith("cluster_"):
            cluster_name = f_clean.replace("cluster_", "")
            if "cluster" in engineered_df.columns:
                raw_c = engineered_df["cluster"].fillna("NCR").astype(str).str.strip()
                X[f] = (raw_c == cluster_name).astype(float)
            else:
                X[f] = 1.0 if cluster_name == "NCR" else 0.0
        else:
            X[f] = 0.0
            
    return X.fillna(0.0)

def decode_classes(indices: np.ndarray, class_names: Optional[List[str]] = None) -> List[str]:
    """
    Decodes numerical class indices to taxonomic label names.
    """
    if class_names is None:
        from ..core.constants import ALL_CLASSES
        class_names = ALL_CLASSES
        
    names = []
    for idx in indices:
        i = int(idx)
        if 0 <= i < len(class_names):
            names.append(class_names[i])
        else:
            names.append(f"class_{i}")
    return names
