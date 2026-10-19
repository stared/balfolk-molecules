import type { Phrase } from '../engine/phrase-structure.ts';

// Beat-based scores audited against the references in docs/dance-audit.md.
// These describe the selected variants, not a universal form of each dance.
const action = (name: string, beats: number, detail = ''): Phrase => ({kind:'action',name,beats,detail});
const sequence = (name: string, ...parts: Phrase[]): Phrase => ({kind:'sequence',name,parts});
const repeat = (times: number, phrase: Phrase): Phrase => ({kind:'repeat',times,phrase});
const cycle = (...parts: Phrase[]) => sequence('Cycle', ...parts);
const walk = (name: string, feet: string[]): Phrase => sequence(name, ...feet.map(foot=>action(foot,1)));
// Two visible movement pulses; the intervening support stays one level deeper.
// Direction labels describe travel, while the children name supporting feet.
const lateral = (name: string, first: string, second: string): Phrase[] => [
  sequence(name,action(first,0.5),action(second,0.5)),
  action(name,1,`Step on ${first.toLowerCase()}; ${name.toLowerCase()}.`),
];

const bourreeLines = sequence('Lines',
  repeat(2,action('Forward',2,'One bourrée step; the end dancers cross to the other line.')),
  repeat(2,action('Back',2,'One bourrée step; continue the line change.')));
const bourreeCrossing = sequence('Crossing',
  action('Approach',2,'Outer dancers approach; middle dancers advance.'),
  action('Meet',2,'Outer dancers meet; middle dancers turn a quarter-turn.'),
  action('Pass',2,'Outer dancers pass; middle dancers retreat.'),
  action('Turn',2,'Face the next crossing; middle dancers finish retreating.'));
const chapelloiseWalk = (name: string, direction: string) => sequence(name,
  sequence('Forward',action('Walk',3,`Walk ${direction}.`),
    action('Turn',1,'Keep travelling; turn toward your partner on the fourth step.')),
  sequence('Backward',action('Walk',4,`Continue ${direction}, now walking backwards.`)));
const chapelloiseLateral = (name: string, first: string, second: string) =>
  sequence(name,...lateral(name,first,second));
const circle = sequence('Circle',action('In',4),action('Out',4));
const mazurkaHalf = (first: string, other: string) => sequence(`${first} lead`,
  action('Lower',2,`Small weight shift onto ${first.toLowerCase()}; soften without travelling.`),
  action('Transfer',1,`Transfer to ${other.toLowerCase()} on three.`),...[first,other,first].map(foot=>action(foot,1,`Small walking step on ${foot.toLowerCase()}.`)));
const tzadikWalk = sequence('Travel',walk('Walk',['Right','Left','Right','Left']),
  walk('Sway',['Right','Left','Right','Left']));
const tzadikFigure = sequence('Crossing',
  sequence('Forward',action('Right',1),action('Left',1)),
  sequence('Back',action('Right',1,'Continue anticlockwise, walking backwards.'),action('Left',1,'Continue anticlockwise, walking backwards.')),
  action('Turn',2,'Turn right on right, left, travelling anticlockwise; finish facing inward.'),
  sequence('Lean R',action('Side',1,'Right opens right.'),action('Lean',1,'Left crosses; incline inward over the support.'),action('Recover',1,'Recover onto right.')),
  sequence('Lean L',action('Side',1,'Left opens left.'),action('Lean',1,'Right crosses; incline inward over the support.'),action('Recover',1,'Recover onto left.')),
  walk('Sway',['Right','Left','Right','Left']));
const drumulSide = (name: string): Phrase[] => [
  repeat(2,sequence(name,action('Side',1,`Step ${name.toLowerCase()}.`),action('Close',1))),
  sequence('Stamps',action('Side',1,`One more step ${name.toLowerCase()}.`),
    repeat(2,action('Stamp',1,'Stamp the free foot without transferring weight.')),action('Hold',1)),
];
const drumulHip = sequence('Hip',
  action('Cross',1,'Right across left; twist the hips.'),action('Recover',1,'On left.'),
  action('Open',1,'Right to the side/back; twist the hips.'),action('Recover',1,'On left.'));
const drumulStamps = () => sequence('Stamps',
  repeat(3,action('Stamp',1,'Free right foot; weight stays on left.')),action('Hold',1));

export const danceStructures: Record<string, Phrase> = {
  bourree: cycle(repeat(4,bourreeLines),repeat(4,bourreeCrossing)),
  chapelloise: cycle(chapelloiseWalk('Outward','anticlockwise'),chapelloiseWalk('Return','clockwise'),
    sequence('Exchange',sequence('Spring',chapelloiseLateral('Together','Right','Left'),chapelloiseLateral('Apart','Left','Right')),
      sequence('Swap sides',action('Cross',3,'Follower crosses in front on three steps.'),action('Settle',1))),
    sequence('Progression',sequence('Spring',chapelloiseLateral('Together','Left','Right'),chapelloiseLateral('Apart','Right','Left')),
      sequence('New partner',action('Pass',3,'Follower passes under the arm to the partner behind on three steps.'),action('Settle',1)))),
  cercle: cycle(repeat(2,circle),
    sequence('Followers',action('In',4),action('Out',4)),
    sequence('Leaders',action('In',4,'Turn left at the end.'),action('Meet',4,'Approach the partner originally on your left.')),
    sequence('Partners',action('Swing',16,'Right foot supports; left pushes. Number of revolutions is illustrative.'),
      sequence('Promenade',action('Walk',14),action('Open',2,'Re-form the circle, facing inward.')))),
  waltz: cycle(
    sequence('Left lead',action('Left',1,'Drive on the first beat.'),action('Right',1),action('Left',1)),
    sequence('Right lead',action('Right',1,'Drive on the first beat.'),action('Left',1),action('Right',1))),
  schottische: cycle(
    sequence('Sideways',...lateral('Left','Left','Right'),...lateral('Right','Right','Left')),
    sequence('Turning',action('Step',1),action('Step',1),action('Step',1),action('Step',1))),
  mazurka: cycle(mazurkaHalf('Left','Right'),mazurkaHalf('Right','Left')),
  'hanter-dro': cycle(repeat(4,sequence('Basic step',
    sequence('Left',action('Left',0.5,'Step left.'),action('Right',0.5,'Recover onto right on the half-beat.')),
    action('Left',1,'Step left again on two.'),
    action('Close',1,'Right closes slightly behind the left on three.')))),
  'an-dro': cycle(repeat(4,sequence('Basic step',
    ...lateral('Left','Left','Right'),...lateral('In place','Right','Left')))),
  'tzadik-katamar': cycle(repeat(2,tzadikWalk),repeat(2,tzadikFigure)),
  'drumul-dracului': cycle(
    repeat(2,sequence('Travel',...drumulSide('Right'),...drumulSide('Left'))),
    repeat(2,sequence('Crossing',repeat(3,drumulHip),drumulStamps()))),
};
