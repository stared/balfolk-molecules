"""Check decoder diagnostics even when FFmpeg returns success."""
import concurrent.futures
import json
import re
import subprocess
from extract_features import BASE, FF

def check(track):
    p = subprocess.run([FF, '-v', 'error', '-i', track['path'], '-map',
                        '0:a:0', '-f', 'null', '-'], capture_output=True,
                       text=True, timeout=180)
    return dict(id=track['id'], returncode=p.returncode,
                decoder_messages=re.sub(r'0x[0-9a-f]+', '<address>', p.stderr.strip()))

def main():
    tracks = json.load(open(BASE / 'reviewed-manifest.json'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, tracks))
    result = dict(files_checked=len(results), files_with_errors=[r for r in results
                  if r['returncode'] or r['decoder_messages']])
    (BASE / 'decode-audit.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
