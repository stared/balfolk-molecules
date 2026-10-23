# Congo de Captieux

Implemented as a fixed set of two couples, with a 64-beat cycle comprising sixteen four-beat rondeau steps. A/B and C/D remain partners. A/C take the leader route; B/D take the follower route.

## References and visual inspection

- [Olivier Pécheux's notation, February 2016](https://www.dansetrad.fr/fiches/fiches_pdf/Congo_de_Captieux.pdf): rhythm on page 1, formation and sequence on page 4, role-specific detail on pages 5–10. The diagrams were rendered and inspected alongside the text.
- [Frisse Folk demonstration at Kattendijk](https://www.youtube.com/watch?v=M0vr8fQoyCQ): frames sampled throughout the 40-second demonstration, with closer inspection of its ending. Useful for the interaction, underarm passage and assisted reunion. Its description credits Didier Oliver & Emmanuel Pariselle Duo for the music.
- [Gennetines 2004 workshop demonstration, uploaded by Michael Shade](https://www.youtube.com/watch?v=ZHovppdfZBk): inspected successive frames through a complete cycle and the following repeat.
- [Pierre Corbefin and Philippe Marsac workshop, Brussels 2011, uploaded by Elenette](https://www.youtube.com/watch?v=iSI2-4J3NOM): supplementary frame inspection. Other participants sometimes obscure the foreground set.

These were visual frame inspections, not motion capture or an independent dance-teacher review.

## Choreographic decisions

| Beats | Figure |
|---|---|
| 1–16 | Approach, retreat, approach; exchange under an arm, leader inside. |
| 17–32 | Counterpartner meeting, outward turn, tiroir with leader behind, left turn. |
| 33–48 | Followers cross left shoulders diagonally; leaders cross right shoulders behind them. Sideways chase, then left turns. |
| 49–64 | Return by different routes. Leaders play in the centre while followers go behind them; original partners reunite. |

The basic supports are left on beat 1, right on 3, left on 3½, right on 4. The final support anticipates the next direction. Turns use explicit winding rather than shortest-angle interpolation. Followers begin turning during the tiroir and prepare each diagonal before travelling. Head direction can differ from body direction during counterpartner play.

The finale shows floor travel and connection, omitting the vertical lift and precise grip. Body-centre distances, curves and timing within each step are illustrative. The follower's last two figures include gestures and footwork that the basic support indication does not fully describe. This implementation uses the sixteen-step version; it does not combine the shorter collected variant with this cycle.

## Integration and checks

The two routes are mirrored by a half turn for the other couple. A fixed camera includes the complete cycle without following or zooming during movement. Roles remain visible; adding/removing pairs is available only for variable formations.

The sequence retains four figure groups and sixteen movements. Hover, keyboard focus or touch reveals the detailed movement. There is no horizontal sequence scrolling at the tested widths.

Automated checks cover identity, bounds, minimum body separation throughout the cycle, continuous positions/body/head angles, cycle closure, passing shoulders, anticipatory retreat, partner holds and turn direction. Browser checks cover 1440×900, 768×1024, 390×844, 320×568 and 844×390, including playback, seeking, tooltips and switching between Congo and a twelve-couple circle. Screenshots were reviewed and used to tighten the camera bounds and clarify the underarm curve.

## Scale and pacing review

The first animation spread partners 130 units apart, with bodies 28 units wide. The revised home spacing is 76 units. The short-side return and the follower's loop behind the partner are compacted independently, retaining the required passing shoulders and separation. The fixed camera is tighter, so the formation remains readable on a phone.

At the same 120 BPM practice tempo, the largest sampled travel burst falls from 12.44 to 4.56 body diameters per second. The largest heading rate falls from 540 to 360 degrees per second. These are geometry checks, not measurements of a real dancer. Unwrapped heading interpolation now maintains continuous angular velocity between successive turn keys instead of stopping at each intermediate heading. The final reunion retains extra clearance for the rendered body sway.

Successive screenshots at half-step intervals were inspected through the full cycle, in addition to the five viewport checks. Regression checks limit late sprints, spin bursts, stretched holds and body overlap. They establish continuity and workable spacing, not a claim that the abstract circles reproduce every bodily gesture.

## Music

Three recordings are available: Bargainatt's *Pris entre Captieux*, Trencadit's *Congò de M. Lagardère*, and Duo Brotto Lopez's *Congo de Captieux* at Eurre in 2012. Each has a measured timing map and a selected passage containing complete 64-count dance cycles. See [music synchronization](music-sync.md#congo-de-captieux) for exact sources, phrase-origin evidence, timing bounds and playback checks. No music retains the adjustable practice tempo, initially 120 BPM.
