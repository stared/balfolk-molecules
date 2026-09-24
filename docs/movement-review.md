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

## Chapelloise walking refinement — 24 September

The [Pécheux dance sheet](https://www.dansetrad.fr/fiches/fiches_pdf/Chapelloise.pdf) distinguishes the walking half, lateral polka contacts, and three-step exchanges with a fourth-count settle. It also acknowledges variants in foot choice and turn timing. The existing choreography keeps its selected variant; this refinement changes how weight and travel flow between those contacts.

Previously every support change completed within 0.22 count, followed by a rigid supported pose over nearly constant-speed travel. Transfers now occupy 70% of the interval available before the next contact: longer for walking, shorter for polka. Peak walking support-change speed drops from 13.64 to 4.29 normalized units/count, about 69%. Equal counted stride distances remain, with ±12% speed modulation inside the steady walking passage. Integrated cosine ramps make acceleration continuous at the start, reversal and finish.

A small lowering accompanies the transfer between supports, returning to neutral on single support and during settles. This uses the general distinction between double-support lowering and midstance rise discussed in [walking biomechanics research](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2017.00187/full). The chosen timing, modulation and maximum 1.35% silhouette contraction are illustrative visual parameters, not measured Chapelloise motion capture. No foot-impact dots or extra hops were added.

All 122 tests and the build passed, including spacing for 1–12 pairs, equal strides, forward/back travel, progression, quieter weight transfer, and continuous lowering at figure/cycle boundaries. Browser checks covered playback, pause, passage seeking and desktop/mobile rendering. Other dances were unchanged.

## Step-driven body travel — follow-up

The earlier foot-visibility investigation did not sufficiently isolate body velocity. Cercle's promenade and most of its swing used exactly constant angular velocity between passage ramps. The first Chapelloise refinement added only ±12% modulation, while schottische eased across its entire turn. Changing glyphs before correcting those trajectories was premature.

The main app now drives body travel from the steps. Chapelloise and Cercle walking use continuous drive/coast cycles with positive interior velocity (±45% around the steady passage mean), stopping only at passage endpoints/reversals. Cercle's swing gets a milder push every two counts. Schottische drives each of its four turning supports and each of its three side-step contacts. Waltz layers a mild per-step drive onto its existing first-beat phrasing; mazurka's three travelling steps drive the path while its suspension remains in place. Contact schedules, formation endpoints, partner progression, and the circle glyph are preserved.

Measured walking angular velocity in radians/count: Chapelloise 0.1150–0.3033 and Cercle promenade 0.04416–0.11643. Both now have a 2.64 peak/trough ratio inside a steady step; the previous Cercle ratio was 1.00. These amplitudes are visual tuning, not measured dancer kinematics. The new regression checks explicitly reject constant promenade speed and a single whole-turn schottische easing. All 124 tests and the production build pass.

### Chapelloise balance tuning

After feedback that the step-driven walking was readable but slightly jerky, Chapelloise alone uses a softer ±30% drive/coast modulation instead of ±45%. Its steady walking speed ratio falls from 2.64 to 1.86, retaining more momentum in the slower part of a step and reducing the periodic angular acceleration by one third. The drive remains aligned with the existing support transfer; counted positions, turns, exchanges and settling are unchanged. Other dances retain their settings. This is a visual adjustment based on feedback, not a claim of measured human gait.
