import type { Phrase } from '../engine/phrase-structure.ts';

// Beat-based scores audited against the references in docs/dance-audit.md.
// These describe the selected variants, not a universal form of each dance.
const action = (name: string, beats: number, detail = ''): Phrase => ({kind:'action',name,beats,detail});
const sequence = (name: string, ...parts: Phrase[]): Phrase => ({kind:'sequence',name,parts});
const repeat = (times: number, phrase: Phrase): Phrase => ({kind:'repeat',times,phrase});
const cycle = (...parts: Phrase[]) => sequence('Cycle', ...parts);
const walk = (name: string, feet: string[]): Phrase => sequence(name, ...feet.map(foot=>action(foot,1)));
const polka = (name: string, first: string, second: string) => sequence(name,
  action(first,0.5),action(second,0.5),action(first,1));

const bourreeLines = sequence('Lines',
  action('Forward',4,'Two bourrée steps; the end dancers cross to the other line.'),
  action('Back',4,'Two bourrée steps; continue the line change.'));
const bourreeCrossing = sequence('Crossing',
  action('Approach',2,'Outer dancers approach; middle dancers advance.'),
  action('Meet',2,'Outer dancers meet; middle dancers turn a quarter-turn.'),
  action('Pass',2,'Outer dancers pass; middle dancers retreat.'),
  action('Turn',2,'Face the next crossing; middle dancers finish retreating.'));
const chapelloiseWalk = sequence('Walking',
  action('Forward',4,'Turn toward your partner on the last count.'),action('Back',4));
const circle = sequence('Circle',action('In',4),action('Out',4));
const mazurkaHalf = (first: string, other: string) => sequence(`${first} lead`,
  action('Lower',2,`Small weight shift onto ${first.toLowerCase()}; soften without travelling.`),
  action('Transfer',1,`Transfer to ${other.toLowerCase()} on three.`),walk('Walk',[first,other,first]));
const tzadikWalk = sequence('Procession',walk('Walk',['Right','Left','Right','Left']),
  walk('Sway',['Right','Left','Right','Left']));
const tzadikFigure = sequence('Figure',
  sequence('Grapevine',action('Side',1),action('Cross',1),action('Side',1),action('Behind',1)),
  sequence('Turning',action('Turn',2,'Full clockwise turn on right, left.'),action('Side',1),action('Cross',1),
    action('Recover',1),action('Side',1),action('Cross',1),action('Recover',1)),
  walk('Sway',['Right','Left','Right','Left']));
const drumulSide = (name: string) => sequence(name,
  action('Travel',5,'Side, close, side, close, side.'),
  repeat(2,action('Stamp',1,'Stamp the free foot without transferring weight.')),action('Hold',1));
const drumulRock = sequence('Rock',action('Cross',1,'Right across left.'),action('Recover',1,'On left.'),
  action('Open',1,'Right to the side/back.'),action('Recover',1,'On left.'));

export const danceStructures: Record<string, Phrase> = {
  bourree: cycle(repeat(4,bourreeLines),repeat(4,bourreeCrossing)),
  chapelloise: cycle(repeat(2,chapelloiseWalk),
    sequence('Exchange',polka('Together','Right','Left'),polka('Apart','Left','Right'),
      action('Swap sides',4,'Follower crosses in front; three steps, then settle.')),
    sequence('Progression',polka('Together','Left','Right'),polka('Apart','Right','Left'),
      action('New partner',4,'Follower passes under the arm to the partner behind; three steps, then settle.'))),
  cercle: cycle(repeat(2,circle),
    sequence('Followers',action('In',4),action('Out',4)),
    sequence('Leaders',action('In',4,'Turn left at the end.'),action('Meet',4,'Approach the partner originally on your left.')),
    sequence('Partners',action('Swing',16,'Right foot supports; left pushes. Number of revolutions is illustrative.'),
      sequence('Promenade',action('Walk',14),action('Open',2,'Re-form the circle, facing inward.')))),
  waltz: cycle(
    sequence('Left lead',action('Left',1,'Drive on the first beat.'),action('Right',1),action('Left',1)),
    sequence('Right lead',action('Right',1,'Drive on the first beat.'),action('Left',1),action('Right',1))),
  scottish: cycle(
    sequence('Sideways',polka('Left','Left','Right'),polka('Right','Right','Left')),
    sequence('Turning',action('Step',1),action('Step',1),action('Step',1),action('Step',1))),
  mazurka: cycle(mazurkaHalf('Left','Right'),mazurkaHalf('Right','Left')),
  'hanter-dro': cycle(repeat(4,sequence('Basic step',
    sequence('Left',action('Left',0.5,'Step left.'),action('Right',0.5,'Recover onto right on the half-beat.')),
    action('Left',1,'Step left again on two.'),
    action('Close',1,'Right closes slightly behind the left on three.')))),
  'an-dro': cycle(repeat(4,sequence('Basic step',
    polka('Left','Left','Right'),polka('In place','Right','Left')))),
  'tzadik-katamar': cycle(repeat(2,tzadikWalk),repeat(2,tzadikFigure)),
  'drumul-dracului': cycle(
    repeat(2,sequence('Travel',drumulSide('Right'),drumulSide('Left'))),
    repeat(2,sequence('Crossing',repeat(3,drumulRock),
      sequence('Finish',repeat(3,action('Stamp',1,'Free right foot; weight stays on left.')),action('Hold',1))))),
};
