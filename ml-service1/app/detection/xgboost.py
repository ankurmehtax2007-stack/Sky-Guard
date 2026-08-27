import numpy as np

def predict(model, X):
    if hasattr(model, 'predict_proba'):
        probs = np.asarray(model.predict_proba(X), dtype=float)
    elif callable(model):
        probs = np.asarray(model(X), dtype=float)
    else:
        probs = np.zeros((len(X), 10), dtype=float)
        probs[:, 0] = 1.0

    if probs.ndim == 1:
        probs = probs[None, :]
    return probs
