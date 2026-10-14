"""Compare configured score motifs with audio across count origins and transpositions."""
import argparse
import json
import os
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent


def compare(mapping, score, features):
    times = np.asarray(mapping['beats'])
    count = len(times) - 1
    subdivisions = score['subdivisions']
    chroma, fps = features['chroma'], float(features['chroma_fps'])
    samples = np.array([
        chroma[:, int((a + k * (b-a) / subdivisions) * fps):
                  int((a + (k+1) * (b-a) / subdivisions) * fps)].mean(axis=1)
        for a, b in zip(times[:-1], times[1:]) for k in range(subdivisions)
    ])
    samples /= np.linalg.norm(samples, axis=1)[:, None] + 1e-9
    motif = score['motif']
    if len(motif) % subdivisions:
        raise ValueError('Score motif must span a whole number of dance counts')
    template = np.zeros((len(motif), 12))
    for i, notes in enumerate(motif):
        for pitch in notes:
            template[i, pitch] = 1 / len(notes)
    if not template.sum():
        raise ValueError('Score motif must contain at least one note')
    motif_counts = len(motif) // subdivisions
    results = []
    for phase in range(mapping['cycle']):
        for transpose in range(12):
            shifted = np.roll(template, transpose, axis=1)
            scores = [float(np.sum(samples[start*subdivisions:start*subdivisions+len(motif)] * shifted)
                            / template.sum())
                      for start in range(phase, count - motif_counts, mapping['cycle'])]
            if scores:
                results.append((float(np.mean(scores)), phase, transpose, scores))
    return [{'score':value, 'countPhase':phase, 'seconds':float(times[phase]),
             'transpose':transpose, 'cycleScores':scores}
            for value, phase, transpose, scores in sorted(results, reverse=True)[:15]]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--track', action='append', help='Track key; default: all tracks with a score motif.')
    parser.add_argument('--work-dir', type=Path, default=Path(os.environ.get('BALFOLK_SYNC_WORK', '/tmp/balfolk-sync')))
    parser.add_argument('--output', type=Path, default=HERE / 'score-phase.json')
    args = parser.parse_args()
    tracks = json.loads((HERE / 'tracks.json').read_text())
    maps = json.loads((HERE / 'audit.json').read_text())
    names = args.track or [name for name, track in tracks.items() if 'score' in track]
    for name in names:
        if name not in tracks or 'score' not in tracks[name]:
            parser.error(f'{name}: no reference score configured')
    results = json.loads(args.output.read_text()) if args.track and args.output.exists() else {}
    for name in names:
        with np.load(args.work_dir / f'{name}-features.npz') as features:
            results[name] = compare(maps[name], tracks[name]['score'], features)
        print(name, results[name][0] if results[name] else 'No complete motif in passage')
    args.output.write_text(json.dumps(results, indent=2, allow_nan=False) + '\n')


if __name__ == '__main__':
    main()
