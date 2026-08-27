ACTION_CATALOG = {
    'temperature_spike': ('Inspect RTD/thermistor wiring, grounding, solar shield and ADC channel.', 'High if persistent'),
    'humidity_spike': ('Inspect hygrometer element for condensation/contamination and check enclosure seal.', 'Medium'),
    'pressure_jump': ('Inspect barometric port, vent path and pressure sensor installation.', 'High'),
    'freeze': ('Check sensor communication, sampling loop and stuck-value condition; replace sensor if persistent.', 'High'),
    'drift': ('Compare against a reference sensor and recalibrate or replace the drifting sensor.', 'High'),
    'offset': ('Compare against a calibrated reference and perform offset calibration.', 'Medium'),
    'missing_data': ('Inspect power, communication link, logger channel and sensor connector.', 'Critical if persistent'),
    'multivariate_inconsistency': ('Inspect temperature/humidity sensor pair, enclosure and local micro-environment.', 'High'),
    'spatial_inconsistency': ('Compare neighboring stations and inspect station siting, shielding and obstruction.', 'Medium'),
    'novel_anomaly': ('Perform a comprehensive multi-sensor diagnostic, inspect firmware/logs and conduct field inspection.', 'High'),
    'normal': ('Continue routine scheduled maintenance and monitoring.', 'Nominal')
}

def recommend_maintenance(root_cause, severity):
    """
    Returns actionable maintenance advice and engineering priority based on diagnosed root cause.
    """
    action, priority = ACTION_CATALOG.get(root_cause, ACTION_CATALOG['normal'])
    return {'recommended_action': action, 'engineering_priority': f'{severity} - {priority}'}
