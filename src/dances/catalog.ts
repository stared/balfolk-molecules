import { danceStructures } from './structures.ts';
import { noirmoutierDance } from './noirmoutier.ts';
import { coupleDances } from './couples.ts';
import { tzadikFrame, drumulFrame, tzadikPhrases, drumulPhrases } from './folk-circles.ts';
import { frame, sections, duration } from './bourree.ts';
import type { Dance } from '../model.ts';
import { chapelloiseFrame } from './chapelloise.ts';
import { cercleFrame } from './cercle.ts';
import { anDroFrame, hanterDroFrame, chainContacts } from './chains.ts';

const catalog: Dance[] = [
  {
    id: 'bourree', category: 'set', title: 'Bourrée bancale', origin: 'France', description: 'Six dancers, changing lines and crossing four sides.', duration,
    millisecondsPerPhrase: 5000, beatsPerPhrase: 8, sections,
    contacts: [0,0.25,0.5,1,1.25,1.5,2,2.25,2.5,3,3.25,3.5],
    phrases: ['Approach, change, retreat', 'Approach, change, retreat', 'Approach, change, retreat', 'Approach, change, retreat', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn', 'Approach, meet, pass, turn'],
    guides: '<path class="guide" d="M -120 -120 H 120 V 120 H -120 Z M 0 -120 V 120 M -120 0 H 120"/>',
    note: 'Each phrase has four bourrée steps.',
    sources: '<a href="https://www.folkabourk.fr/apprendre" target="_blank" rel="noreferrer">Choreography</a> · <a href="https://dansetrad.fr/fiches/fiches_pdf/Bourree_du_Berry.pdf" target="_blank" rel="noreferrer">Step reference</a>',
    frame(time, cycle) { const state = frame(time, cycle); return { ...state, weight: state.rhythm.weight }; },
  },
  {
    // The Swedish attribution is contested: https://en.wikipedia.org/wiki/Chapelloise#History
    id: 'chapelloise', category: 'circle', title: 'Chapelloise', origin: 'France; earlier origin disputed', description: 'Couples in a circle: walk, turn, exchange sides, then join the partner behind.', duration: 8,
    millisecondsPerPhrase: 2500, roles: true,
    phraseContacts: [[0,1,2,3],[0,1,2,3],[0,1,2,3],[0,1,2,3],[0,0.5,1,2,2.5,3],[0,1,2],[0,0.5,1,2,2.5,3],[0,1,2]],
    sections: [{ name: 'Walking', start: 0, duration: 4, detail: 'Four forward, turn, four backward; repeat back to the start.' }, { name: 'Progression', start: 4, duration: 4, detail: 'Together/apart, exchange sides; together/apart, underarm turn to the partner behind.' }],
    phrases: ['Forward + turn', 'Backward', 'Forward + turn', 'Backward', 'Together / apart', 'Exchange sides', 'Together / apart', 'Change partner'],
    guides: '<circle class="guide" r="108"/><circle class="guide" r="162"/>',
    note: '32 counts · Four counts per phrase · New partner each cycle.',
    sources: '<a href="https://www.dansetrad.fr/fiches/fiches_pdf/Chapelloise.pdf" target="_blank" rel="noreferrer">Steps: Olivier Pécheux</a> · Walking on counts; lateral polka on 1 &amp; 2, 3 &amp; 4; exchanges on three steps, then settle. Distance and the split of partner progression are schematic. Raised curve = underarm passage.',
    frame: chapelloiseFrame,
  },
  {
    id: 'cercle', category: 'circle', title: 'Cercle circassien', origin: 'England, United Kingdom', description: 'A circle advances and retreats, followers then leaders approach, new partners swing and promenade.', duration: 16,
    millisecondsPerPhrase: 2500, roles: true, progression: -1,
    sections: [
      {name:'Circle',start:0,duration:4,detail:'Four steps in, four out, twice.'},
      {name:'Invitations',start:4,duration:4,detail:'Followers in and out; leaders in, turn left, return to the partner on their left.'},
      {name:'Swing',start:8,duration:4,detail:'Sixteen counts rotating as couples, right foot supporting, left foot pushing.'},
      {name:'Promenade',start:12,duration:4,detail:'Sixteen walking counts anticlockwise; open into a circle on the last two.'},
    ],
    phrases: ['All in','All out','All in','All out','Followers in','Followers out','Leaders in + turn','Meet next partner','Swing','Swing','Swing','Swing','Promenade','Promenade','Promenade','Open the circle'],
    guides: '<circle class="guide" r="170"/>',
    note: '64 counts · Four counts per phrase · New partner each cycle.',
    sources: '<a href="https://dansetrad.fr/fiches/fiches_pdf/Cercle_circassien.pdf" target="_blank" rel="noreferrer">Steps: Olivier Pécheux</a> · Four-step walking variant. Swing with the neighbour on the left; promenade anticlockwise, follower outside. Travel distance and number of swing turns are schematic. Hand lines show connection, not the full swing hold; claps and optional final underarm turns are omitted.',
    frame: cercleFrame,
  },
  noirmoutierDance,
  ...coupleDances,
  {
    id:'hanter-dro',category:'chain',formation:'chain',title:'Hanter-dro',origin:'Morbihan, Brittany, France',description:'An open chain moves to its left with a close, steady armhold and a three-beat repeating step.',duration:4,
    millisecondsPerPhrase:2000,countsPerPhrase:3,contacts:chainContacts('hanter-dro'),tempoNote:'Practice tempo.',
    sections:[{name:'Basic step',start:0,duration:4,detail:'Repeat: left–right–left on 1 & 2; right closes slightly behind on 3.'}],
    phrases:Array.from({length:4},()=> '1 & 2: left–right–left travelling left · 3: right closes'),
    guides:'<circle class="guide" r="145"/>',
    note:'1 & 2 · 3 — L R L · R. Four repeats · Open chain.',
    sources:'<a href="https://dansetrad.fr/fiches/fiches_pdf/Hanter_dro.pdf" target="_blank" rel="noreferrer">Steps and hold: Olivier Pécheux</a> · Close spacing and steady links suggest the bent armhold. Body centres and support dots cannot show the right foot closing slightly behind, elbow overlap, or vertical suspension. The chain follows a circular track; a live leader may choose another path.',
    frame:hanterDroFrame,
  },
  {
    id:'an-dro',category:'chain',formation:'chain',title:'An dro',origin:'Morbihan, Brittany, France',description:'An open chain steps left, then on the spot, with hands rolling forward and back.',duration:4,
    millisecondsPerPhrase:2500,countsPerPhrase:4,contacts:chainContacts('an-dro'),
    sections:[{name:'Basic step',start:0,duration:4,detail:'Repeat: left–right–left on 1 & 2; right–left–right on 3 & 4.'}],
    phrases:Array.from({length:4},()=> '1 & 2: left–right–left travelling left · 3 & 4: right–left–right in place'),
    guides:'<circle class="guide" r="145"/>',
    note:'1 & 2 · 3 & 4 — L R L · R L R. Four repeats · Open chain.',
    sources:'<a href="https://www.accrofolk.net/danses-folks/an-dro" target="_blank" rel="noreferrer">Hold and movement: AccroFolk</a> · Lateral version: travel left, then step in place. Hand curves suggest forward/back motion; little-finger grip, arm height and the full rolling gesture cannot be shown from above. The four-beat motif is also taught using eight half-beat counts.',
    frame:anDroFrame,
  },
  {
    id:'tzadik-katamar',category:'circle',title:'Tzadik Katamar',origin:'Israel',description:'A circle walks, sways, crosses and turns together, without partners.',duration:12,
    millisecondsPerPhrase:2000,tempoNote:'Illustrative practice tempo.',
    sections:[{name:'Procession',start:0,duration:4,detail:'Four walking counts anticlockwise, four sways; twice.'},{name:'Figure',start:4,duration:8,detail:'Open mayim, right turn, crossing rocks, four sways; twice.'}],
    phrases:tzadikPhrases,guides:'<circle class="guide" r="145"/>',
    note:'48 counts · Walk/sway × 2 + crossing sequence × 2.',
    sources:'<a href="https://www.evansvillefolkdancers.com/resources/Notes/T/Tzadik%20Katamar%20DN.pdf" target="_blank" rel="noreferrer">48-count step notes: Evansville Folk Dancers</a> · Yonatan Gabay choreography. Body travel and turning speed are schematic. Right hand reaches to the left shoulder of the dancer ahead when walking; hands open to the sides for sways and release for turns. Arm height, palm orientation and crossed feet remain abstract.',
    frame:tzadikFrame,
  },
  {
    id:'drumul-dracului',category:'circle',title:'Drumul Dracului',origin:'Romania (Csángó tradition)',description:'A closed circle travels right and left, stamps, then crosses and opens with a hip twist.',duration:16,
    millisecondsPerPhrase:1500,tempoNote:'Fixed practice tempo; recordings often accelerate.',
    sections:[{name:'Travel',start:0,duration:8,detail:'Five side/close steps, two stamps, hold; mirror left. Repeat.'},{name:'Crossing',start:8,duration:8,detail:'Cross right in front, recover; open right to the side/back, recover. Three times, then three stamps and hold. Repeat.'}],
    phrases:drumulPhrases,guides:'<circle class="guide" r="145"/>',
    note:'64 counts · Side sequence × 2 + crossing sequence × 2. Foot-dot pulses = stamps without weight transfer.',
    sources:'<a href="https://duramecho.com/Dance/BEECIIFolkDance/Drumul_Dracului.html" target="_blank" rel="noreferrer">Step sequence: Andrew Hardwick</a> · Crossing-step adaptation with the basic heel-stamp ending. Csángó dance from Romania. Crossing and opening twist the lower body, shown by the two foot dots; the facing tick turns less. Travel distances and twist angles are schematic. Heel stamps pulse the free foot dot; vertical bounce and heel contact are omitted.',
    materials:[{name:'Closed-circle formation',url:'https://socalfolkdance.org/dances/D/Drumul_Dracului.pdf'}],
    frame:drumulFrame,
  },
];

export const dances: Dance[] = catalog.map(dance => {
  if (dance.structure) return dance;
  const phrase = danceStructures[dance.id];
  if (!phrase) throw new Error(`Missing structure for ${dance.id}`);
  return {...dance, structure: {phrase, note: 'Dance phrases in musical beats; not the structure of a particular recording.'}};
});
