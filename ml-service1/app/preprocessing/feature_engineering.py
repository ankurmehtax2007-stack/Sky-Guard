import numpy as np
import pandas as pd

CLUSTER_BASELINES = {
    'NCR': {'temp_mean': 28.5, 'temp_std': 5.5, 'hum_mean': 55.0, 'hum_std': 18.0, 'press_mean': 1008.0, 'press_std': 6.0},
    'Konkan_Deccan': {'temp_mean': 27.5, 'temp_std': 4.5, 'hum_mean': 70.0, 'hum_std': 15.0, 'press_mean': 1010.0, 'press_std': 5.0},
    'Tamil_Nadu_Coast': {'temp_mean': 30.5, 'temp_std': 3.5, 'hum_mean': 75.0, 'hum_std': 12.0, 'press_mean': 1012.0, 'press_std': 4.0},
    'West_Bengal': {'temp_mean': 29.0, 'temp_std': 4.5, 'hum_mean': 78.0, 'hum_std': 14.0, 'press_mean': 1009.0, 'press_std': 5.0},
}
DEFAULT_BASELINE = {'temp_mean': 28.5, 'temp_std': 5.5, 'hum_mean': 55.0, 'hum_std': 18.0, 'press_mean': 1008.0, 'press_std': 6.0}

def calculate_dewpoint_magnus(temp_c, humidity_pct):
    a, b = 17.27, 237.7
    rh_safe = np.clip(humidity_pct, 0.1, 100.0) / 100.0
    t_safe = np.clip(temp_c, -50.0, 60.0)
    gamma = (a * t_safe) / (b + t_safe + 1e-9) + np.log(rh_safe)
    denom = a - gamma
    denom = np.where(np.abs(denom) < 1e-5, 1e-5, denom)
    return (b * gamma) / denom

def _frozen(series):
    values = series.to_numpy()
    counts = np.ones(len(values), dtype=int)
    for i in range(1, len(values)):
        if pd.notna(values[i]) and pd.notna(values[i-1]) and values[i] == values[i-1]:
            counts[i] = counts[i-1] + 1
    return pd.Series(counts, index=series.index)

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['cluster'] = df['cluster'].fillna('NCR').astype(str).str.strip()
    df['cluster'] = df['cluster'].replace('', 'NCR')
    df = df.sort_values(['station_id', 'timestamp']).reset_index(drop=True)
    
    df['hour'] = df.timestamp.dt.hour
    df['month'] = df.timestamp.dt.month
    df['day'] = df.timestamp.dt.day
    df['dayofweek'] = df.timestamp.dt.dayofweek
    
    df['hour_sin'] = np.sin(2 * np.pi * df.hour / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * df.hour / 24.0)
    df['month_sin'] = np.sin(2 * np.pi * df.month / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * df.month / 12.0)
    
    # Compute cluster means and deviations with fallback to regional baselines
    for sensor, prefix in [('temperature_c', 'temp'), ('pressure_hpa', 'press'), ('humidity_pct', 'hum')]:
        means = []
        stds = []
        for _, row in df.iterrows():
            c_info = CLUSTER_BASELINES.get(row['cluster'], DEFAULT_BASELINE)
            means.append(c_info[f'{prefix}_mean'])
            stds.append(c_info[f'{prefix}_std'])
            
        g = df.groupby(['cluster', 'timestamp'])[sensor]
        cluster_mean_dyn = g.transform('mean')
        cluster_std_dyn = g.transform('std')
        
        use_dyn = (df.groupby(['cluster', 'timestamp'])[sensor].transform('count') > 1)
        df[f'cluster_{prefix}_mean'] = np.where(use_dyn, cluster_mean_dyn, np.array(means))
        df[f'cluster_{prefix}_std'] = np.where(use_dyn & (cluster_std_dyn > 1e-4), cluster_std_dyn, np.array(stds))
        df[f'cluster_{prefix}_std'] = df[f'cluster_{prefix}_std'].fillna(1.0).replace(0, 1.0)
        
    if 'spatial_temp_diff' not in df.columns:
        df['spatial_temp_diff'] = df.temperature_c - df.cluster_temp_mean
    if 'spatial_temp_zscore' not in df.columns:
        df['spatial_temp_zscore'] = df.spatial_temp_diff / (df.cluster_temp_std + 1e-9)
        
    if 'spatial_press_diff' not in df.columns:
        df['spatial_press_diff'] = df.pressure_hpa - df.cluster_press_mean
    if 'spatial_press_zscore' not in df.columns:
        df['spatial_press_zscore'] = df.spatial_press_diff / (df.cluster_press_std + 1e-9)
        
    if 'spatial_hum_diff' not in df.columns:
        df['spatial_hum_diff'] = df.humidity_pct - df.cluster_hum_mean
    if 'spatial_hum_zscore' not in df.columns:
        df['spatial_hum_zscore'] = df.spatial_hum_diff / (df.cluster_hum_std + 1e-9)
    
    df['neighbor_dev_score'] = df.spatial_temp_diff.abs() / (df.cluster_temp_mean.abs() + 1e-5)
    df['station_neighbor_consistency'] = 1.0 / (1.0 + df.neighbor_dev_score)
    df['cluster_anomaly_pct'] = (df['spatial_temp_zscore'].abs() > 3.0).astype(float)
    
    df['temp_press_ratio'] = df.temperature_c / (df.pressure_hpa + 1e-5)
    df['temp_hum_ratio'] = df.temperature_c / (df.humidity_pct + 1e-5)
    df['hum_press_ratio'] = df.humidity_pct / (df.pressure_hpa + 1e-5)
    
    df['dewpoint_c'] = calculate_dewpoint_magnus(df.temperature_c, df.humidity_pct)
    df['dewpoint_depression_c'] = df.temperature_c - df.dewpoint_c
    df['vapor_pressure_ratio'] = df.humidity_pct * np.exp(17.27 * df.temperature_c / (237.7 + np.clip(df.temperature_c, -50, 60))) / 100.0
    
    for col in ['temperature_c', 'humidity_pct', 'pressure_hpa']:
        g = df.groupby('station_id')[col]
        lag1 = g.shift(1)
        lag24 = g.shift(24)
        
        prefix = 'temp' if 'temp' in col else ('hum' if 'hum' in col else 'press')
        base_mean = df[f'cluster_{prefix}_mean']
        base_std = df[f'cluster_{prefix}_std']
        
        # When previous lag is missing, fill with current value
        calc_lag1 = lag1.fillna(df[col])
        calc_lag24 = lag24.fillna(df[col])
        
        if f'{col}_lag1' not in df.columns:
            df[f'{col}_lag1'] = calc_lag1
        if f'{col}_lag24' not in df.columns:
            df[f'{col}_lag24'] = calc_lag24
            
        calc_diff1 = df[col] - df[f'{col}_lag1']
        calc_diff24 = df[col] - df[f'{col}_lag24']
        
        if f'{col}_diff_lag1' not in df.columns:
            df[f'{col}_diff_lag1'] = calc_diff1
        if f'{col}_diff_lag24' not in df.columns:
            df[f'{col}_diff_lag24'] = calc_diff24
            
        if f'{col}_rate_1h' not in df.columns:
            df[f'{col}_rate_1h'] = df[f'{col}_diff_lag1'].abs()
            
        if f'{col}_roll6_med' not in df.columns:
            df[f'{col}_roll6_med'] = g.transform(lambda x: x.rolling(6, min_periods=1).median()).fillna(df[col])
        if f'{col}_roll6_mean' not in df.columns:
            df[f'{col}_roll6_mean'] = g.transform(lambda x: x.rolling(6, min_periods=1).mean()).fillna(df[col])
        if f'{col}_roll6_var' not in df.columns:
            df[f'{col}_roll6_var'] = g.transform(lambda x: x.rolling(6, min_periods=1).var()).fillna(0.0)
            
        if f'{col}_frozen_count' not in df.columns:
            df[f'{col}_frozen_count'] = g.transform(_frozen).fillna(1)
        
        roll24_mean = g.transform(lambda x: x.rolling(24, min_periods=1).mean()).fillna(base_mean)
        roll24_std = g.transform(lambda x: x.rolling(24, min_periods=1).std()).fillna(base_std)
        roll24_std = roll24_std.replace(0, 1.0)
        
        if f'{col}_roll24_mean' not in df.columns:
            df[f'{col}_roll24_mean'] = roll24_mean
        if f'{col}_roll24_std' not in df.columns:
            df[f'{col}_roll24_std'] = roll24_std
        if f'{col}_roll24_diff' not in df.columns:
            df[f'{col}_roll24_diff'] = df[col] - df[f'{col}_roll24_mean']
        if f'{col}_roll24_zscore' not in df.columns:
            df[f'{col}_roll24_zscore'] = df[f'{col}_roll24_diff'] / (df[f'{col}_roll24_std'] + 1e-9)

    clusters = ['Konkan_Deccan', 'NCR', 'Tamil_Nadu_Coast', 'West_Bengal']
    for c in clusters:
        df[f'cluster_{c}'] = (df.cluster == c).astype(float)
        
    return df

def to_model_matrix(engineered_df: pd.DataFrame, feature_cols: list) -> pd.DataFrame:
    X = pd.DataFrame(index=engineered_df.index)
    col_map = {c.strip(): c for c in engineered_df.columns}
    
    for f in feature_cols:
        f_clean = f.strip()
        if f in engineered_df.columns:
            X[f] = engineered_df[f]
        elif f_clean in col_map:
            X[f] = engineered_df[col_map[f_clean]]
        elif f_clean.startswith('cluster_'):
            cluster_name = f_clean.replace('cluster_', '')
            X[f] = (engineered_df['cluster'] == cluster_name).astype(float)
        else:
            X[f] = 0.0
            
    return X.fillna(0.0)
