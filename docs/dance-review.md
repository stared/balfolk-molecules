# Dance review — 18 September 2026

Review of all eleven implemented dances: source descriptions, animation scores, hierarchy data, names, origins, materials and rendered timelines. This is a review of the selected versions, not certification of every regional form. No choreography or interface changes were made in this review.

## Findings, in priority order

### 1. Barray's Hanter-dro synchronization remains unresolved

`src/music/recordings.ts:26` maps the recording to the faster pulse, nominally 167 BPM. The user subsequently reported an incompatible tempo, not simply a late start. The previous computational accent analysis does not resolve that objection. Tests that compare animation position with this same beat map cannot validate the choice of pulse subdivision.

The dance's three-count motif is supported by [Pécheux's step sheet](https://dansetrad.fr/fiches/fiches_pdf/Hanter_dro.pdf). Which pulses in this particular recording should carry those counts still needs independent musical validation. Do not describe the current mapping as a confirmed correction, or apply another factor-of-two change without establishing that correspondence.

An dro has a related, narrower limitation: the selected passage has a continuous measured pulse, but its named tune entry and some later phrase boundaries are unconfirmed. Its recent first-Play fix addresses playback starting before the map; it does not settle musical interpretation.

### 2. Hierarchy labels become unreadable on small screens

`src/ui/phrase-structure.ts:25–33` hides the lowest row below 8 px, but allows the other rows to shrink indefinitely. Chromium measurements at a 390 px viewport:

| Dance | Smallest remaining hierarchy text |
| --- | ---: |
| Drumul Dracului | 4.3 px |
| Chapelloise | 5.9 px |
| Cercle circassien | 7.7 px |
| Hanter-dro | 8.2 px |
| Bourrée bancale | 8.3 px |

There is no page overflow, but that is not a readability pass. At 1280 px, Bourrée and Drumul already omit their entire lowest row; the remaining levels are legible. Stamps, holds and individual bourrée steps therefore often exist only in hover descriptions.

Recommended correction: apply a readability threshold to every tier and drop complete finer tiers, including their edges. Keep a meaningful labelled parent and the common beat axis. Do not solve this with truncated names, empty cells or smaller type. On touch devices, native `title` tooltips alone are insufficient for inspecting hidden detail.

### 3. Repetition is represented inconsistently

- **Drumul colors:** repeated Travel blocks receive different colors, as do repeated Crossing blocks. `src/ui/phrase-structure.ts:84–99` assigns colors by occurrence for nested dances, while other dances use names. This visually invents differences between identical repetitions. Color should identify the movement pattern, with position identifying the occurrence.
- **Bourrée ancestry:** the top 32-count groups come from `dance.sections`, outside the phrase tree. The renderer recognizes the dance ID to add them. The tree by itself does not contain the hierarchy visible in the interface. “Lines” also labels both the parent and each child, adding a row without explaining the relationship.
- **Drumul rocks:** three identical four-count crossing/opening motifs are expanded with `Array.from` inside a 12-count `Rock` sequence. Their durations are correct, but the threefold repetition is absent from `phraseRepeats`. This matters if the tree is meant to express reusable patterns rather than merely draw cells.
- **Tzadik rocks:** the two three-count rocks are mirrored, not identical repeats. Their labels and children are currently identical and omit the supporting feet. Preserve them as distinct mirrored phrases; supply their directions/feet in the detail.

### 4. The timeline's perspective and variant are hidden

`Dance.structure.note` is populated but never rendered. `src/main.ts:108–119` extracts links from `sources`, discarding the surrounding explanation. Much of that prose was deliberately removed from the interface; restoring paragraphs is not the remedy.

Information that is necessary to interpret the drawing should remain available in a compact, relevant place:

- Noirmoutier follows the lower/teal front; the other front is four counts ahead. Neither the diagram nor its existing phrase tooltips says this.
- Couple foot names describe the leader; the follower mirrors them. “Left” elsewhere means travel direction, so the reference must be explicit when inspecting a step.
- The chain dances' four repetitions are a practice window, not a four-phrase claim about every recording.
- Drumul combines crossing steps with the basic heel-stamp ending. It is an adaptation, not an exact transcription of all of Hardwick's Variation 1.
- The Mazurka is the user's chosen close-embrace interpretation. It has no independent step reference currently linked, intentionally; the previously rejected video label should not be restored.

Use a concise tooltip or inspectable phrase detail, not a new explanatory panel. Keep the existing names/origin/materials notes compact.

### 5. Some names conceal the hierarchy instead of explaining it

- **Mazurka:** `Left lead → Lower, Transfer, Left, Right, Left` mixes movement names and supporting feet on one row. The missing intermediate distinction is `Weight shift` (three counts) versus `Walk` (three counts), within each mirrored six-count passage. The two-count lowering and third-count transfer should remain nested below Weight shift. This is a data-structure improvement; it does not require larger movement or more rotation.
- **Bourrée:** retain distinct levels for the overall line-changing section, each eight-count passage, and its two-beat steps. Choose a parent name that identifies line changing; do not repeat “Lines” at both levels or substitute an expression containing “+” or “×”.
- **Tzadik:** “Figure” is an uninformative parent name. A useful replacement must distinguish this whole 16-count passage without just listing its children. Avoid calling the whole passage a turn: only two counts actually turn.
- **Cercle:** `Circle / Followers / Leaders / Partners` mixes formation and participant groups, but is understandable: all move, then each role, then pairs. It is less urgent than the concrete defects above. Its 16-count Swing and 16-count Promenade remain distinct and correctly proportioned.
- **Schottische:** keep this display name. The material link currently changes spelling to “Scottish steps”; use the dance's chosen spelling or a neutral source title consistently. Existing internal IDs need not change.

## Dance-by-dance assessment

“Consistent” below means that the selected count sequence and implementation agree with the cited description or explicitly chosen interpretation. It does not mean that travel distances, holds or accents have been verified against a filmed dancer.

| Dance | Selected structure | Assessment and remaining work |
| --- | --- | --- |
| Bourrée bancale | 64 counts; four line passages, then four crossings | Six-person choreography agrees with [Folk à Bourk](https://www.folkabourk.fr/apprendre). Middle dancers and outer dancers have different jobs; their hover descriptions preserve that distinction. Two-beat steps are represented correctly. Put the existing enclosing groups into the tree; remove duplicate parent/child naming. Corner turns and travel are schematic, not independently video-verified. |
| Chapelloise | 32 counts; Outward, Return, Exchange, Progression | Three complete hierarchy tiers. Outward/Return are correctly separate rather than falsely marked as identical repeats. Walking, lateral polka, side exchange and underarm progression agree with [Pécheux](https://www.dansetrad.fr/fiches/fiches_pdf/Chapelloise.pdf). Selected turn placement is within the fourth forward count. Fix mobile fitting; retain Spring and its Together/Apart children. |
| Cercle circassien | 64 counts; circle, followers, leaders, swing, promenade | Counts and next-partner progression agree with [Pécheux](https://dansetrad.fr/fiches/fiches_pdf/Cercle_circassien.pdf). Four walking steps are one documented variant; optional claps and final underarm turn are omitted. Hierarchy is complete at the displayed depths. Opening the circle is nested inside Promenade. Slightly undersized phone labels remain. |
| Branle de Noirmoutier | 32 counts; Straight, Straight, Turning, Turning | [Lannig](https://lannig.e-monsite.com/pages/pays-nantais/retz/branle-de-noirmoutiers.html) supports the Mme Raymond step and distinguishes contemporary offset fronts from collected variants. Retain the accepted pivot–travel–pivot drawing. Expose the timeline's front in context. The half-beat forward contact exists in the animation but has no contact tick: unlike the other syncopated dances, this dance supplies neither `contacts` nor `phraseContacts`. Exact delayed contact timings are illustrative. |
| Waltz | Six counts; mirrored three-count measures | Feet agree with [AccroFolk](https://www.accrofolk.net/danses-folks/valse). First-beat drive and continuous rotation have regression coverage. Current hierarchy is sufficient; clarify leader-foot perspective in details. Rotation amount and accent strength remain illustrative. |
| Schottische | Eight main pulses; sideways then four turning supports | The selected smooth balfolk version agrees with the step descriptions in [AccroFolk](https://www.accrofolk.net/danses-folks/scottish). Its prose mixes eight-/sixteen-count conventions, so do not infer an extra half or double speed from that page alone. The app consistently uses half-beat contacts in the travelling half and four full supports in the turning half. Hops and improvised alternatives are not modelled. Keep origin uncertainty explicit. |
| Mazurka | Twelve counts; two mirrored six-count passages | Animation matches the requested soft two-count shift, transfer on three, then three small steps. Tests preserve restrained travel and close embrace. Independent validation of this exact version is incomplete. Improve nesting of the two three-count measures; do not replace the accepted motion with a generic syllabus. |
| Hanter-dro | Three-count motif, repeated four times for practice | Left, Left, Close is consistent with [Pécheux](https://dansetrad.fr/fiches/fiches_pdf/Hanter_dro.pdf); the first beat contains the intervening right support. Open chain, circular teaching track, abbreviated armhold. Structure is sound. Barray music correspondence remains the highest correctness concern. |
| An dro | Four-count motif, repeated four times for practice | Left, Left, In place, In place matches the selected lateral version. [AccroFolk](https://www.accrofolk.net/danses-folks/an-dro) also describes diagonal travel/backward returns; the animation is a simplification, not the only form. Half-beat supports are present. The rolling arm gesture is only projected schematically. Musical phrase entry remains provisional. |
| Tzadik Katamar | 48 counts; two eight-count processions and two sixteen-count figures | Walking/swaying, grapevine, two-count turn and crossing rocks agree with [Evansville's notes](https://www.evansvillefolkdancers.com/resources/Notes/T/Tzadik%20Katamar%20DN.pdf). Clarify the two mirrored rocks and improve “Figure”. The choreographer attribution is stored in discarded prose; it should be structured metadata if attribution is to be available. |
| Drumul Dracului | 64 counts; two Travel and two Crossing passages | Closed circle, correct side-step/stamp/hold counts, and a complete three-tier tree. [Hardwick](https://duramecho.com/Dance/BEECIIFolkDance/Drumul_Dracului.html) distinguishes the basic and crossing variants; the app combines their selected features. Closed-circle material is separately linked. Fix repeated-pattern colors, encode the repeated rock explicitly, and fix tiny mobile labels. Keep Żniwa's recording-specific 32-count offset separate from choreography. |

## Origins, formation and completeness

All eleven dances have an origin and a structure. Formation groups are retained: chain/lines, circle, couple, and set. Noirmoutier's two open fronts fit the Chain navigation group, while its actual floor geometry is two straight lines. Drumul is now in Circle and has all ten neighbour links, including last-to-first.

The current origin strings are broadly appropriate, but they mix geography with qualifications. Poland is the Mazurka's historical origin, not proof of this balfolk variant. France identifies the Chapelloise's French name/tradition, while earlier origins are disputed. Schottische's exact origin is uncertain. England for Cercle follows the [Northumberland collection account](https://laine.artsci.utoronto.ca/folkdans/misc/circassian_en.htm); it should not be replaced with the Caucasus based on the title. Csángó provenance should remain attached to Drumul's Romanian geography.

Country, region, variant, attribution and alternative names should become separate data fields when this metadata is expanded. Only verified aliases need be added; completeness does not mean filling every dance with speculative names or countries. The supplied private PDF is a useful reference/link index, not independent verification of these precise movement scores. It remains untracked.

## Structure model: retain the useful distinctions

The useful hierarchy is **figure → movement phrase → action → support**, with repetition and mirroring represented explicitly. Not every dance needs four displayed rows. Avoid forcing all descendants to the same depth just to fill a rectangle.

The existing recursive model is a good starting point. Before a broad refactor:

1. Make the tree contain the whole choreography hierarchy, including Bourrée's enclosing groups.
2. Distinguish pattern identity from occurrence; use identity for consistent color and repetition, occurrence for timing and seeking.
3. Retain the difference between repeating the same movement, mirroring its feet, and doing a different job simultaneously in another role/front.
4. Select complete readable tiers from the data, rather than adding another dance-ID condition to the renderer.
5. Keep musical sections in the recording layer. A dance repeat is not evidence of a song's phrase boundary.

`sections`, `phrases`, and `structure` currently duplicate some descriptions at different granularities. They do not all mean the same thing, so blindly replacing one with another would break useful distinctions. Document their units and migrate deliberately. No motion refactor is necessary to correct the identified hierarchy problems.

## Verification

- All **107 existing tests passed**; `pnpm build` passed, including TypeScript checking.
- All eleven timeline layouts were loaded in Chromium at **1280 and 390 px**. Their visible label sizes and rows were measured; screenshots of every desktop timeline and the problematic mobile examples were inspected.
- No page overflow was found at those widths. This did not prevent the unreadable text described above.
- Existing tests cover cycle totals, boundaries, selected support sequences, continuity, spacing, partner progression and ring/chain connections. They primarily prove implementation consistency, not fidelity to source videos or musical interpretation.
- Source review used the linked step descriptions. No new ear-verified transcription or independent frame-by-frame video validation was performed. The music player was excluded from this layout pass.

The previous An dro startup fix remains a separate, pre-existing working-tree change. This review changes documentation only and does not commit the supplied PDF.

## Follow-up: data consistency branch

A later read-only check of the data found no arithmetic errors; the changes below remove disagreements between fields. `tests/data-consistency.test.ts` keeps them from returning.

- **Names:** Chapelloise's second scrubber section is `Exchanges`; `Progression` now only means the eight-count change of partner. Bourrée's second section is `Crossings`, matching the tree's `Crossing`. The Schottische origin reads “precise origin disputed”, as this audit already stated, and its source link uses the display spelling. The internal id stays `scottish`. “Drumul Draculi” in recording titles is the artists' spelling.
- **Units:** `model.ts` documents `sections` (phrases), `phrases` (fixed-length captions that may cut across movements, as in Tzadik's rocks), `structure` (beats) and contacts (counts within a phrase; a Bourrée count is a two-beat step). Section boundaries must coincide with structure boundaries; granularity may differ, as in Cercle and Mazurka.
- **Contacts:** couple-dance timeline contacts are derived from the arrays that drive the animation. Noirmoutier lists its nominal forward contacts 1 & 2, 3, so the half-beat contact has a tick.
- **Unused fields:** `structure.note` is the diagram's tooltip and `tempoNote` the tempo readout's, defaulting to “Practice tempo.”; the redundant generic notes were dropped. `Recording.passage` was removed. Prose in `sources` remains deliberately unrendered.
- **Noirmoutier** stays in the Chain group without `formation: 'chain'`: that flag means one open chain whose order survives a change of dance.
- Music findings are in [music-sync.md](music-sync.md): the Hanter-dro count-rate disagreement, tempo flags, Stary Olsa's segments and timestamp precision.
