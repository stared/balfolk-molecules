import test from 'node:test';
import assert from 'node:assert/strict';
import { createYouTubePlayer } from '../src/ui/youtube-player.ts';

interface PlayerOptions {
  events: { onReady(): void; onStateChange(event: { data: number }): void };
}

async function playerFixture() {
  let embedded!: FakePlayer;
  let visible = false;
  class FakePlayer {
    state = 2;
    time = 10;
    pauses = 0;
    options: PlayerOptions;
    constructor(_element: HTMLElement, options: PlayerOptions) { this.options = options; embedded = this; }
    playVideo() {}
    pauseVideo() { this.pauses++; }
    seekTo(time: number) { this.time = time; }
    getCurrentTime() { return this.time; }
    getPlayerState() { return this.state; }
    getPlaybackRate() { return 1; }
    destroy() {}
    emit(state: number) { this.state = state; this.options.events.onStateChange({ data: state }); }
  }
  Object.assign(globalThis, {
    window: { YT: { Player: FakePlayer } },
    document: { createElement: () => ({}) },
    location: { origin: 'http://localhost' },
  });
  const container = {
    replaceChildren() {},
    getClientRects: () => visible ? [{}] : [],
  } as unknown as HTMLElement;
  const player = createYouTubePlayer(container, () => {}, message => assert.fail(message));
  await player.load('recording');
  embedded.options.events.onReady();
  return { player, embedded, showVideo() { visible = true; } };
}

test('late playback events cannot resume a paused recording in the closed selector', async () => {
  const { player, embedded } = await playerFixture();
  player.play(); embedded.emit(1);
  assert.equal(player.time, 10);
  player.pause(); embedded.emit(2);
  for (const state of [3, 1, 2, 1]) {
    embedded.time++;
    const pauses = embedded.pauses;
    embedded.emit(state);
    assert.equal(player.playing, false, `state ${state} must not undo Pause`);
    assert.equal(player.time, 10, `state ${state} must not unfreeze the dance clock`);
    if (state === 1 || state === 3) assert.ok(embedded.pauses > pauses);
  }
  player.play(); embedded.emit(1);
  assert.equal(player.playing, true);
  assert.equal(player.time, embedded.time);
});

test('the visible embedded video can still start playback after app Pause', async () => {
  const { player, embedded, showVideo } = await playerFixture();
  player.play(); embedded.emit(1); player.pause(); embedded.emit(2);
  showVideo(); embedded.emit(1);
  assert.equal(player.playing, true);
  embedded.time = 12;
  assert.equal(player.time, 12);
});
