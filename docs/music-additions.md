# October 21 recording additions

Ten additions, with the fourth Hanter-dro choice removed, leave exactly three
recordings for each of the eleven dances (33 total). Muscat and Cobla La Mitja
Lluna are the first two Tzadik choices, followed by Bill Woodgate. ViatoreS is
the third Drumul choice. Hanter-dro retains Barray, ba.fnu and Naragonia; the
Folk Knock timing analysis is retained for reference. The selector layout and
choreography are unchanged.

| Dance | Exact recording | Selected seconds | Complete cycles | Timing |
| --- | --- | --- | --- | --- |
| Cercle | [Beat Bouet Trio: Ça Dégénère](https://www.youtube.com/watch?v=eEArcahXX8g) | 10.930–285.216 | 10 | 140 BPM |
| Cercle | [Lyradanz: Un salto nel vuoto / Desgarbuglies!](https://www.youtube.com/watch?v=STbN-opaqfE) | 1.813–205.449 | 7 | 132 BPM |
| Noirmoutier | [Ciac Boum: Suite de Bransles](https://www.youtube.com/watch?v=A5haP6-bPRE) | 2.220–179.080 | 12 | Measured; nominal 130 BPM |
| Noirmoutier | [Arbadétorne: Les gens qui sont riches](https://www.youtube.com/watch?v=H_6dl1q4OvY) | 14.550–237.159 | 16 | 138 BPM |
| Chapelloise | [Lyradanz: Ticket Restaurant](https://www.youtube.com/watch?v=G_92bfkQbBQ) | 7.880–224.360 | 15 | Measured; nominal 133.1 BPM |
| Waltz | [Ballsy Swing: Valse du port Galland](https://www.youtube.com/watch?v=XxFa31Du6Ws) | 90.880–297.040 | 97 | Measured; nominal 169.5 BPM |
| An dro | [Arvest: Ma flanedenn, live](https://www.youtube.com/watch?v=hKk7_49fTTU) | 121.960–374.380 | 25 | Measured; nominal 95 BPM |
| Tzadik Katamar | [Muscat: live at Treure Ball, Terrassa](https://www.youtube.com/watch?v=DkSRycdK1b8) | 4.240–112.780 | 4 | Measured; nominal 126.9 BPM |
| Tzadik Katamar | [Cobla La Mitja Lluna: Ball Folk](https://www.youtube.com/watch?v=xQsk9nYWm64) | 48.860–133.600 | 3 | Measured; nominal 105.3 BPM |
| Drumul Dracului | [ViatoreS: Drumul Dracului / Ördög útja](https://www.youtube.com/watch?v=2rXDxHWpjlI) | 0.520–229.720 | 8 | Measured; nominal 134.6 BPM |

These are bounded practice passages. Restart seeks to the listed entry; the
animation and music stop at the passage end. Only timing metadata is shipped.
Full source media was examined computationally, not listened through or danced
through by a human reviewer.

## Selection and phrase checks

- The Lyradanz [set list](https://www.lyradanz.com/wp-content/uploads/2015/12/Press-Kit-Lyradanz.pdf)
  identifies Ticket Restaurant as chapelloise and Un salto nel vuoto /
  Desgarbuglies as cercle. Their measured chroma repetition supports the
  respective 32- and 64-count cycles. Ticket Restaurant starts after the
  opening 16-count passage. Its map follows the small expressive timing changes
  around 164–166 seconds rather than forcing them to a constant grid. The cercle
  stops before the closing cadence, whose last expected count lacks support.
- Ciac Boum and Arbadétorne both support 32-count musical repetition. Ciac Boum
  starts at the shared detected bar entry after the pickup. Arbadétorne starts
  after its metrically ambiguous opening. These checks support the musical cycle,
  not a new assertion about which facing line must advance first in every
  Noirmoutier variant.
- Ça Dégénère is explicitly labelled cercle by the artist's release. It has a
  particularly strong 16-count musical motif, so the 64-count dance spans four
  such units. The entry is a supported bar boundary after the irregular opening;
  there is no claim that each arrangement change prescribes a dance figure.
- The waltz uses three counts per bar and six per full turn. Both models have
  unresolved gaps in the earlier passage. The selected later passage provides
  over three minutes of continuous, mutually supported counts, following the
  performance's tempo changes.
- Arvest's live recording is a different performance from the local album file.
  Its map was measured afresh. It starts after an earlier tracking gap and follows
  approximately 91–100 counts/minute, with four counts per basic an dro pattern.

- Muscat's album upload `k2NBdDkNGmA` returns iframe error 150. Their own live
  Terrassa upload plays and is measured separately. Its opening accelerates
  from approximately 46 to 147 counts/minute. Both the score comparison and
  the repeated 16+16+16-count pattern identify 4.24 s as the first Travel entry.
  The selected passage contains four full cycles before later ambiguous timing.
- Cobla's first passage and late accelerando have ambiguous pulse-level changes.
  The selected 48.86–133.60 s passage supports three whole cycles and agrees
  forwards and backwards. The notated melody identifies phase zero; no constant
  BPM is imposed on its approximately 85–113 counts/minute passage. The extended
  forward-only candidate reaching 167.94 s was rejected because its reverse
  traversal selected different subdivisions.
- ViatoreS accelerates from approximately 119 to 153 counts/minute over eight
  cycles. Chroma comparison with the existing Żniwa Travel-first map, allowing
  all 64 count origins and twelve transpositions, selects 0.52 s as Travel.
  This compares melody order rather than treating loudness as a stamp. The
  supported passage ends at 229.72 s, before an unresolved tracking gap around
  235 s. Results and reproduction script are in
  `research/music-analysis/sync-2026-10/drumul-reference-phase.json` and
  `compare_drumul_phrase.py`.

## Reproduction and evidence

Inputs are in [tracks.json](../research/music-analysis/sync-2026-10/tracks.json),
[sources.json](../research/music-analysis/sync-2026-10/sources.json), and
[detections.json](../research/music-analysis/sync-2026-10/detections.json).
The existing `build_maps.py` regenerates the shipped TypeScript and audit.
Each new track specifies its models explicitly; earlier tracks retain their
original observations and maps.

The original checkpoint host returned HTTP 503. These additions use Beat This
`final0` and `final1` from the public
[checkpoint mirror](https://huggingface.co/oulianov/beat_this), loaded with
PyTorch's weights-only loader. They are two checkpoints of the same model family,
not independent human annotations. SHA-256:

```
final0 8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331
final1 365b553f43750717c907f32fbc42910f3b264d616654583df6e44472c93ead80
```

Set `BALFOLK_BEAT_MODELS=final0,final1` and `BALFOLK_SYNC_WORK` to the temporary
media/checkpoint directory when running `neural.py`. Run `features.py` using the
same directory for independent spectral flux, chroma and librosa observations.

The initial four measured maps have identical forward/backward counts, at most 40 ms
timestamp disagreement, and 95th-percentile smoothing changes of 14–20 ms.
The initial three constant grids have 95th-percentile model discrepancies of 27–42 ms.
Every grid was checked in separate 45-second windows. The few >60 ms model
disagreements are retained in
[grid-validation.json](../research/music-analysis/sync-2026-10/grid-validation.json).
The largest model misses are at 158.787 seconds in Ça Dégénère and 186.813 seconds
in Lyradanz's cercle. Independent spectral bands have attacks within 40 ms of
these grid positions; neither requires inserting a new count. Three smaller
Arbadétorne discrepancies reach 77 ms. A loud attack alone is never interpreted
as a stamp.

`tests/browser/music-catalogue-real.mjs` exercises actual iframe playback,
immediate app Pause, native paused seeking, Restart, No music, and dropdown
geometry at 1440, 390 and 320 pixels. `TRACK_KEYS` selects comma-separated keys
from tracks.json; `SYNC_REPORT` retains the results and `REVIEW_SCREENSHOTS`
selects a screenshot directory. The shared simulated catalogue test also
checks rate changes, passage ends and finite geometry for every recording.

## Initial shortlist items not published

- **AedO: Café Coiffeur:** the artist upload `589u7ofebU8` still returns iframe
  error 150. Arvest's live an dro supplies the third choice instead. The Arvest
  album upload `Sl-WojrIJ8o` also rejects embedding; its timing was not reused
  for the live version.
- **Alambic: Quadratures:** the local file exists, but a matching YouTube upload
  was not found. Lyradanz supplies the third cercle choice instead.
- **JAM.PT: Drumul Dracului:** `3J5kLp1TH5Q` plays, but is a 73-second live
  excerpt, not the album recording. Both models switch pulse levels and fail to
  support a continuous full-rate map after about 30 seconds. The video was also
  inspected for figure phase; the available evidence was insufficient for a
  reliable new preset. Existing Drumul recordings remain available.
- **Jonathan Gabay: Tzadik Katamar:** no full matching embeddable upload was
  found. A related Effi Netzer upload `U63_6e9Hkow` again returned error 150;
  short dance-demonstration clips were not substituted or credited as the
  requested recording. The existing Bill Woodgate preset remains available.

## Verification result

All ten additions played in the actual iframe. App Pause froze the pose immediately; Restart and No music worked. Fifty real paused seeks, including late passages and backwards seeks, matched the animation clock. Desktop and mobile screenshots were inspected at 1440, 390 and 320 pixels; opening and closing the selector preserved control and animation geometry, with no page overflow. Existing narrow selectors truncate long titles; this change does not redesign them. Results are retained in [browser-additions.json](../research/music-analysis/sync-2026-10/browser-additions.json).

The full 33-recording catalogue passed 198 simulated seeks, restart/play/pause, playback-rate, end-of-passage and No music checks. All 130 unit tests and the production build pass. Original recording maps and analysis entries were compared with HEAD and remain identical.

The three final additions have identical forward/backward count totals, maximum
timestamp disagreements of 20–40 ms, and smoothing p95 of 15.5–22.2 ms.
The existing score-phase report now includes both new Tzadik recordings; the
notated opening motif ranks count phase zero first for each.
