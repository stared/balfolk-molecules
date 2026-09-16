import { frame, sections, duration } from './movement.ts';
import type { Dancer, HandReach, DanceSection } from './movement.ts';
import { chapelloiseFrame } from './chapelloise.ts';
import { cercleFrame } from './cercle.ts';
import { anDroFrame, hanterDroFrame, chainContacts } from './chains.ts';

interface ViewFrame { dancers: Dancer[]; hands: HandReach[]; weight: number; section: number }
export interface Dance {
  id: string;
  title: string;
  description: string;
  duration: number;
  millisecondsPerPhrase: number;
  countsPerPhrase?: number;
  contacts?: readonly number[];
  tempoNote?: string;
  sections: DanceSection[];
  phrases: string[];
  guides: string;
  note: string;
  sources: string;
  roles?: boolean;
  formation?: 'chain';
  progression?: 1 | -1;
  frame(time: number, cycle: number, pairCount?: number): ViewFrame;
}
export const dances: Dance[] = [
  {
    id: 'bourree', title: 'Bourrée bancale', description: 'Six dancers, changing lines and crossing four sides.', duration,
    millisecondsPerPhrase: 5000, sections,
    phrases: ['Approach, change, retreat', 'Approach, change, retreat', 'Approach, change, retreat', 'Approach, change, retreat', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn'],
    guides: '<path class="guide" d="M -120 -120 H 120 V 120 H -120 Z M 0 -120 V 120 M -120 0 H 120"/>',
    note: 'Each phrase has four bourrée steps.',
    sources: '<a href="https://www.folkabourk.fr/apprendre" target="_blank" rel="noreferrer">Choreography</a> · <a href="https://dansetrad.fr/fiches/fiches_pdf/Bourree_du_Berry.pdf" target="_blank" rel="noreferrer">Step reference</a>',
    frame(time, cycle) { const state = frame(time, cycle); return { ...state, weight: state.rhythm.weight }; },
  },
  {
    id: 'chapelloise', title: 'Chapelloise', description: 'Couples in a circle: walk, turn, exchange sides, then join the partner behind.', duration: 8,
    millisecondsPerPhrase: 2500, roles: true,
    sections: [{ name: 'Walk + turn', start: 0, duration: 4, detail: 'Four forward, turn, four backward; repeat back to the start.' }, { name: 'Exchange + change', start: 4, duration: 4, detail: 'Together/apart, exchange sides; together/apart, underarm turn to the partner behind.' }],
    phrases: ['Forward + turn', 'Backward', 'Forward + turn', 'Backward', 'Together / apart', 'Exchange sides', 'Together / apart', 'Change partner'],
    guides: '<circle class="guide" r="108"/><circle class="guide" r="162"/>',
    note: '32 counts · Four counts per phrase · New partner each cycle.',
    sources: '<a href="https://www.dansetrad.fr/fiches/fiches_pdf/Chapelloise.pdf" target="_blank" rel="noreferrer">Steps: Olivier Pécheux</a> · Walking on counts; lateral polka on 1 &amp; 2, 3 &amp; 4; exchanges on three steps, then settle. Distance and the split of partner progression are schematic. Raised curve = underarm passage.',
    frame: chapelloiseFrame,
  },
  {
    id: 'cercle', title: 'Cercle circassien', description: 'A circle advances and retreats, followers then leaders approach, new partners swing and promenade.', duration: 16,
    millisecondsPerPhrase: 2500, roles: true, progression: -1,
    sections: [
      {name:'All in / out',start:0,duration:4,detail:'Four steps in, four out, twice.'},
      {name:'Take turns',start:4,duration:4,detail:'Followers in and out; leaders in, turn left, return to the partner on their left.'},
      {name:'Swing',start:8,duration:4,detail:'Sixteen counts rotating as couples, right foot supporting, left foot pushing.'},
      {name:'Promenade',start:12,duration:4,detail:'Sixteen walking counts anticlockwise; open into a circle on the last two.'},
    ],
    phrases: ['All in','All out','All in','All out','Followers in','Followers out','Leaders in + turn','Meet next partner','Swing','Swing','Swing','Swing','Promenade','Promenade','Promenade','Open the circle'],
    guides: '<circle class="guide" r="170"/>',
    note: '64 counts · Four counts per phrase · New partner each cycle.',
    sources: '<a href="https://dansetrad.fr/fiches/fiches_pdf/Cercle_circassien.pdf" target="_blank" rel="noreferrer">Steps: Olivier Pécheux</a> · Four-step walking variant. Swing with the neighbour on the left; promenade anticlockwise, follower outside. Travel distance and number of swing turns are schematic. Hand lines show connection, not the full swing hold; claps and optional final underarm turns are omitted.',
    frame: cercleFrame,
  },
  {
    id:'hanter-dro',formation:'chain',title:'Hanter-dro',description:'An open chain moves to its left with a close, steady armhold and a three-beat repeating step.',duration:4,
    millisecondsPerPhrase:2000,countsPerPhrase:3,contacts:chainContacts('hanter-dro'),tempoNote:'90 beats/min at 1×.',
    sections:[{name:'Left · close',start:0,duration:4,detail:'Repeat: left–right–left on 1 & 2; right closes slightly behind on 3.'}],
    phrases:Array.from({length:4},()=> '1 & 2: left–right–left travelling left · 3: right closes'),
    guides:'<circle class="guide" r="145"/>',
    note:'1 & 2 · 3 — L R L · R. Four repeats · Open chain.',
    sources:'<a href="https://dansetrad.fr/fiches/fiches_pdf/Hanter_dro.pdf" target="_blank" rel="noreferrer">Steps and hold: Olivier Pécheux</a> · Close spacing and steady links suggest the bent armhold. Body centres and support dots cannot show the right foot closing slightly behind, elbow overlap, or vertical suspension. The chain follows a circular track; a live leader may choose another path.',
    frame:hanterDroFrame,
  },
  {
    id:'an-dro',formation:'chain',title:'An dro',description:'An open chain steps left, then on the spot, with hands rolling forward and back.',duration:4,
    millisecondsPerPhrase:2500,countsPerPhrase:4,contacts:chainContacts('an-dro'),
    sections:[{name:'Left · on the spot',start:0,duration:4,detail:'Repeat: left–right–left on 1 & 2; right–left–right on 3 & 4.'}],
    phrases:Array.from({length:4},()=> '1 & 2: left–right–left travelling left · 3 & 4: right–left–right in place'),
    guides:'<circle class="guide" r="145"/>',
    note:'1 & 2 · 3 & 4 — L R L · R L R. Four repeats · Open chain.',
    sources:'<a href="https://www.dansetrad.fr/fiches/fiches_pdf/Kei_jaj.pdf" target="_blank" rel="noreferrer">Step rhythm: Olivier Pécheux</a> · <a href="https://www.accrofolk.net/danses-folks/an-dro" target="_blank" rel="noreferrer">Hold and movement: AccroFolk</a> · Lateral version: travel left, then step in place. Hand curves suggest forward/back motion; little-finger grip, arm height and the full rolling gesture cannot be shown from above. The four-beat motif is also taught using eight half-beat counts.',
    frame:anDroFrame,
  },
];
