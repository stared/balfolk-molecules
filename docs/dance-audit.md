# Dance data audit

Audited 17 September 2026 against the references below, the animation scores, and the movement decisions made during development. This is a textual-source and implementation audit, not independent verification of every movement against video.

## Units and scope

The structure trees use musical beats. Animation time still uses internal phrases. Conversion happens at the timeline boundary; a bourrée step occupies **two** musical beats. Foot contacts may occur between beats. A repeated movement is not automatically a musical phrase: the four repetitions shown for the Breton chain dances are a practice window, not an assertion about the form of a recording.

The UI shows two levels, with unnamed brackets spanning repeated phrases. Deeper steps remain in hover descriptions. Mirrored starting feet are separate phrases, not identical repeats. All scores share the ruler's axis; labels that cannot fit are omitted visually but retain accessible names and hover descriptions. The full cycle stays visible.

## Reviewed dances

| Dance | Displayed cycle | Formation | Origin used |
| --- | --- | --- | --- |
| Bourrée bancale | 64 beats: four 8-beat line passages, four 8-beat crossings | Six-person set | France |
| Chapelloise | 32: walking 8, walking 8, exchange 8, progression 8 | Progressive couples in a circle | France; earlier origin disputed |
| Cercle circassien | 64: circle 16, followers 8, leaders 8, swing 16, promenade 16 | Circle, then couples | England, United Kingdom |
| Branle de Noirmoutier | 32: straight 8, straight 8, turning 8, turning 8 | Two facing lines | Vendée, France |
| Waltz | 6: two mirrored 3-beat measures | Couples | Austria and southern Germany |
| Schottische | 8: sideways 4, turning 4 | Couples | Central Europe; precise origin disputed |
| Mazurka | 12: two mirrored 6-beat passages | Couples | Poland; balfolk adaptation |
| Hanter-dro | 12: four 3-beat motifs | Open chain | Morbihan, Brittany, France |
| An dro | 16: four 4-beat motifs | Open chain | Morbihan, Brittany, France |
| Tzadik Katamar | 48: procession 8 twice, figure 16 twice | Circle | Israel |
| Drumul Dracului | 64: travel 16 twice, crossing 16 twice | Open circle | Romania, Csángó tradition |

### Bourrée bancale

[Folk à Bourk's choreography](https://www.folkabourk.fr/apprendre) supplies the six-person figure. [Pécheux's Berry bourrée sheet](https://dansetrad.fr/fiches/fiches_pdf/Bourree_du_Berry.pdf) supplies the two-beat basic step, not the provenance of this particular choreography. The former 32-step ruler hid half the musical beats: it now has 64 beats and half-beat contact marks. During crossings, middle and outer dancers have different jobs; the timeline follows the outer dancers and its descriptions explain the middle dancers' advance, quarter-turn and retreat. No unsupported regional origin is assigned to the particular bancale choreography.

### Chapelloise

[Pécheux's sheet, May 2010](https://www.dansetrad.fr/fiches/fiches_pdf/Chapelloise.pdf): 16 walking counts followed by two eight-count exchanges. Polka contacts occupy two beats each. The score separates exchanging sides from progressing to a new partner. Half-turns remain at the ends of the forward passages. Exact turn placement varies in teaching; the sheet itself is not entirely consistent about this boundary. Its Swedish-origin attribution is not treated as established history. The source-year comment was corrected from 2012.

### Cercle circassien

[Pécheux's sheet](https://dansetrad.fr/fiches/fiches_pdf/Cercle_circassien.pdf) supports the 64-count sequence, including the separate invitations and 16-count swing and promenade. The next partner is originally on the leader's left. The last two promenade beats open the circle. [Collection history](https://laine.artsci.utoronto.ca/folkdans/misc/circassian_en.htm) places the collected dance in Northumberland. The drawing does not prescribe a number of swing revolutions or depict the full hold.

### Branle de Noirmoutier

[Lannig's collected variants](https://lannig.e-monsite.com/pages/pays-nantais/retz/branle-de-noirmoutiers.html) distinguish several steps. This visualization uses the Mme Raymond step in a contemporary double-front arrangement, also called Branle de l'Épine. The teal front supplies the timeline; ochre is four beats ahead. That offset is not claimed as a feature established for all collected forms. The accepted half-pivot, travel, half-pivot interpretation remains. Precise pivot timing, hop compression, crossed legs and arm swing are schematic. The French Wikipedia stub remains excluded from the UI.

### Waltz

[AccroFolk's step description](https://www.accrofolk.net/danses-folks/valse) gives alternating left–right–left and right–left–right measures. These are represented separately. The approved first-beat drive and gentle nonuniform rotation remain; the score does not imply an identical turn angle for every real-world measure.

### Schottische

[AccroFolk](https://www.accrofolk.net/danses-folks/scottish) and [Vitrifolk's step sheet](https://www.vitrifolk.fr/descriptions/descriptions-suede-SCOTTISH%20A%20---%20Schottische-anglais.pdf) describe two travelling steps followed by turning supports. Counting conventions differ: the application uses eight main pulses, with half-beat contacts in the travelling part. Its four turning supports remain smooth, as requested. Historic step-hop execution and turn counts are not imposed on the approved balfolk interpretation. The country name does not derive from the dance's Scottish-sounding name; the interface retains uncertainty about its precise origin.

### Mazurka

The displayed twelve-beat variant is the explicitly requested interpretation: a small, soft two-beat weight shift, transfer on three, then three walking steps, mirrored on the other foot. It is not offered as a universal mazurka syllabus. The close embrace and restrained redirection remain. Poland identifies historical origin, not the provenance of every feature of this balfolk adaptation. The rejected video-reference link remains removed.

### Hanter-dro and An dro

[Pécheux's Hanter-dro sheet](https://dansetrad.fr/fiches/fiches_pdf/Hanter_dro.pdf) supports the three-beat motif with four contacts. Its visible movement is Left, Left, Close, one block per beat; the first block contains the left step and the intervening right support on the half-beat. [AccroFolk's An dro description](https://www.accrofolk.net/danses-folks/an-dro) and [UltraDanse's account](https://www.ultradanse.fr/tag/an-dro) support lateral travel followed by stepping in place. An dro's four main beats can also be taught as eight half-counts. The unrelated Kei jaj PDF was removed. Armhold, finger grip and vertical suspension remain schematic; a real chain need not follow the circular track used here.

### Tzadik Katamar

[Evansville Folk Dancers' notes](https://www.evansvillefolkdancers.com/resources/Notes/T/Tzadik%20Katamar%20DN.pdf) support the 48-count sequence: two walking/swaying passages, then two figures containing grapevine, turn and crossing rocks, and sway. The clockwise turn occupies two counts. The score follows these boundaries rather than treating all internal four-count animation phrases as equivalent figures. Shoulder contact and hand release remain abstract, and the body-centre model cannot show crossed feet precisely.

### Drumul Dracului

[Hardwick's notes](https://duramecho.com/Dance/BEECIIFolkDance/Drumul_Dracului.html) specify an open circle: the erroneous closing link is removed and the dance is grouped under Chain & line. Travel has five steps, two stamps and a hold in each direction. Crossing has three four-count rocks followed by three stamps and a hold. The existing animation combines crossing steps with the basic heel-stamp ending; it is now explicitly identified as that adaptation, not a faithful rendering of Variation 1's flat stamps at three positions. Support stays on the standing foot during stamps. Fixed practice tempo does not reproduce a recording's acceleration.

## Verification and remaining limits

Automated checks cover all eleven cycle lengths, phrase boundaries, complete coverage of both visible levels, nested repeats, mirrored feet, beat/time conversion and fractional contacts. Motion tests cover support, continuity, turning, spacing and connections. Open-chain transitions preserve dancer order, including Drumul. Browser checks cover all eleven scores at desktop and mobile widths, alignment, label fit, seeking and restart.

Source descriptions do not establish precise body trajectories, angular velocities, embrace geometry or individual musical accents. Those remain visual interpretations. A future recording layer should describe its own measures, sections and introductions rather than reusing these movement trees as song analysis.
