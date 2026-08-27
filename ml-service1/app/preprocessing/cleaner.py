import pandas as pd
import numpy as np

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = df.columns.str.strip()
    numeric = [
        'temperature_c', 'humidity_pct', 'pressure_hpa', 'latitude', 'longitude',
        'temperature_c_rate_1h', 'humidity_pct_rate_1h', 'pressure_hpa_rate_1h',
        'temperature_c_frozen_count', 'humidity_pct_frozen_count', 'pressure_hpa_frozen_count',
        'spatial_temp_zscore', 'spatial_hum_zscore', 'spatial_press_zscore'
    ]
    for c in numeric:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors='coerce')
        else:
            defaults = {'temperature_c': 25.0, 'humidity_pct': 50.0, 'pressure_hpa': 1013.25, 'latitude': 28.6139, 'longitude': 77.2090}
            if c in defaults:
                df[c] = defaults[c]

    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        if df['timestamp'].isna().any():
            df['timestamp'] = df['timestamp'].fillna(pd.Timestamp.now())
    else:
        df['timestamp'] = pd.Timestamp.now()

    if 'station_id' not in df.columns:
        df['station_id'] = 'DEMO-001'

    df = df.sort_values(['station_id', 'timestamp']).reset_index(drop=True)
    
    # Fill gaps per station, then fall back to defaults
    fallbacks = {'temperature_c': 25.0, 'humidity_pct': 50.0, 'pressure_hpa': 1013.25}
    for c, default_val in fallbacks.items():
        df[c] = df.groupby('station_id')[c].transform(lambda s: s.interpolate().ffill().bfill())
        df[c] = df[c].fillna(default_val)
        
    return df

