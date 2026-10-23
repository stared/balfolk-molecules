"""Compare the 16+16+16+16 melodic sections of Bargainatt's Congo passage."""
import argparse
import json
from pathlib import Path

import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--work-dir', type=Path, required=True)
args = parser.parse_args()
here = Path(__file__).resolve().parent
key = 'congo-bargainatt'
times = np.array(json.loads((here / 'audit.json').read_text())[key]['beats'])
with np.load(args.work_dir / f'{key}-features.npz') as features:
    chroma, fps = features['chroma'], float(features['chroma_fps'])
    samples = np.array([chroma[:, int(a*fps):int(b*fps)].mean(axis=1)
                        for a, b in zip(times[:-1], times[1:])])
samples /= np.linalg.norm(samples, axis=1)[:, None] + 1e-9
results = []
for phase in range(32):
    cycles = [samples[i:i+64] for i in range(phase, len(samples)-63, 64)]
    contrast = np.mean([
        np.mean(np.sum(c[:16]*c[16:32], axis=1))
        + np.mean(np.sum(c[32:48]*c[48:64], axis=1))
        - 2*np.mean(np.sum(c[:16]*c[32:48], axis=1))
        for c in cycles
    ])
    results.append({'phase': phase, 'seconds': float(times[phase]), 'contrast': float(contrast)})
print(json.dumps(sorted(results, key=lambda r: r['contrast'], reverse=True), indent=2))
