# Movement and recording review — 24 September 2026

Ordinary support changes now rock the main circle toward its supporting side. The circle and eyes tilt together around a low pivot: up to 2° for schottische, 5° for Drumul, and 3° elsewhere. This displaces the centre by approximately 0.42, 1.05 and 0.63 drawing units respectively. Travel paths, hand connections, heading data and choreography are unchanged. The Steps setting hides both the lean and stamp marks.

Only intentional stamps show the small black contact circles, behind and overlapping the body. Their opacity follows the existing stamp envelope directly. The previous renderer started a 200 ms fade when a sampled frame crossed a threshold; that made a stamp dependent on frame history. Direct sampling now gives the same cue on playback, pause, backward seek, or a skipped frame, and its duration follows the current count length. Holds do not create another impact. A same-foot repeated stamp remains visible without falsely transferring support.

## Review and checks

The browser audit exercised all 11 dances over complete cycles, with ordinary contacts producing no flashes. It checked every count of both existing Drumul maps against the renderer:

| Map | Counts checked | Explicit stamp counts | Held counts |
| --- | ---: | ---: | ---: |
| Żniwa | 384 | 84 | 36 |
| Stary Olsa | 320 | 70 | 30 |

At each mapped count, the audit rendered the stamp peak, visited a different time, and returned to verify identical cues. It also checked suppression during formation changes. These checks establish renderer/map consistency; they do not independently establish the musical meaning of each count.

The [earlier audio measurements](../research/music-analysis/README.md) support keeping those maps rather than replacing them with fixed BPM: 100% of Żniwa's and 96% of Stary Olsa's selected neural predictions are within 60 ms of a mapped count. This direction of comparison does not validate interpolated counts. Żniwa retains the user-selected Crossing offset. Stary Olsa's first tempo transition remains uncertain, so no speculative phase or rate correction was made.

Build/type checking and all 120 existing tests passed. The comparison page was checked at desktop and 390 px width, including local audio playback, seeking, track switching, count-offset selection, and hiding cues. No browser errors or horizontal overflow were found. The small tilt is visually restrained in screenshots; whether it improves learning still needs a viewer's judgment in motion.

The [browser audit script](../research/music-analysis/scripts/check-movement.mjs) and [results](../research/music-analysis/data/movement-validation.json) are preserved. The script requires an existing Playwright installation/browser and a running development server. `PLAYWRIGHT_MODULE` selects the installed module, `REVIEW_ORIGIN` selects the server (default `http://127.0.0.1:5173`), and optional `ZNIWA_AUDIO` enables the local-file playback check. No browser or analysis dependency was added to the app.

## Compare the music with the actual renderer

Run `pnpm dev`, then open `/research/music-analysis/motion-review.html` on the reported local server. Unlike the standalone measurement viewer, this page imports the current app's choreography and renderer and requires the development server. No audio is shipped; choose the matching local file to hear it while the animation follows its playback time. Duration checks can catch some version mismatches but cannot authenticate a recording.

| Recording | What to compare | Alignment status |
| --- | --- | --- |
| Żniwa — Drumul Draculi | Repeated stamps, quiet holds, later acceleration; inspect 15.92, 74 and 106 seconds | Existing app map and figure offset |
| Stary Olsa — Drumul Draculi | Slower opening, first tempo transition around 60 seconds, faster material around 110 and 180 seconds | Existing map; first transition uncertain |
| Accordzéâm — Hotel Califorgna | Bass and bright attacks oppose one another; inspect 30, 150 and 300 seconds | Experimental model pulse; figure phase unconfirmed |
| Accordzéâm — Jottish | Bass and bright attacks favour the same parity; inspect 30, 100 and 180 seconds | Experimental model pulse; figure phase unconfirmed |
| Alambic — La Solitaire | Quiet third position instead of simple alternation; inspect 30, 150 and 250 seconds | Experimental model pulse; figure phase unconfirmed |

The three schottisches all use the same movement and tilt. They do not use their attack strengths to change the dancer's force. Offsets 0 and 4 compare the two halves of an eight-count cycle; the other offsets expose phase sensitivity. Those controls make an unresolved choice reviewable rather than silently choosing a new production preset. Model beats can still skip, double or drift, particularly in introductions and endings.

## Remaining musical uncertainty

Barray's Hanter-dro still needs an independent count-rate check. Its fast-pulse map implies a 1.1-second basic pattern, versus 2.25 seconds for ba.fnu. The [composer's score listing](https://www.valentinbarray.com/en/product-page/hanter-dro-la-version-m%C3%A9lodie-et-accord) confirms that an annotated melody/chord score exists, but the notation was not available in this review. Neither a generic Hanter-dro score nor agreement between related beat models resolves this specific performance. No purchase or map change was made.

The next human review can therefore be narrow: decide whether the lean is readable in place, confirm schottische's travelling/turning halves at the listed passages, and establish Barray's actual dance-count rate. Further automated passes cannot substitute for those judgments.
