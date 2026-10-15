interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  getPlaybackRate(): number;
  destroy(): void;
}
interface YouTubeAPI {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    width: string;
    height: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady(): void;
      onStateChange(event: {data: number}): void;
      onError(event: {data: number}): void;
      onAutoplayBlocked(): void;
    };
  }) => YouTubePlayer;
}
declare global {
  interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void }
}
let apiPromise: Promise<YouTubeAPI> | undefined;
function loadAPI(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return apiPromise ??= new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => { apiPromise = undefined; reject(new Error('YouTube did not load.')); }, 15000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timeout); resolve(window.YT!); };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timeout); apiPromise = undefined; reject(new Error('YouTube is unavailable.')); };
    document.head.append(script);
  });
}
export function createYouTubePlayer(container: HTMLElement, changed: () => void, failed: (message: string) => void) {
  let player: YouTubePlayer | undefined;
  let ready = false;
  let loading = false;
  let currentId = '';
  // Commands cross an iframe boundary. Keep the latest intent until the
  // corresponding state arrives; buffering is not a request to stop.
  let pending: boolean | undefined;
  let active = false;
  // The iframe clock can keep advancing after pauseVideo(). Freeze the clock
  // exposed to the dancers at the last observed time, including through the
  // delayed PAUSED notification. Explicit seeks still update the held time.
  let heldTime: number | undefined;
  let lastTime = 0;
  let generation = 0;
  return {
    async load(videoId: string, startSeconds = 0) {
      if (videoId === currentId && (ready || loading)) return;
      const request = ++generation;
      ready = false; loading = true; pending = undefined; active = false;
      heldTime = undefined; lastTime = startSeconds;
      player?.destroy(); player = undefined;
      currentId = videoId;
      try {
        const api = await loadAPI();
        if (request !== generation) return;
        const target = document.createElement('div');
        container.replaceChildren(target);
        player = new api.Player(target, {
          videoId, width: '100%', height: '203',
          playerVars: {origin: location.origin, playsinline: 1, controls: 1, autoplay: 0, start: Math.max(0, Math.floor(startSeconds))},
          events: {
            onReady() { if (request !== generation) return; ready = true; loading = false; changed(); },
            onStateChange(event) {
              if (request !== generation) return;
              const state = event.data;
              if (pending === false && (state === 1 || state === 3)) {
                // A late PLAYING/BUFFERING notification must not undo Pause.
                player?.pauseVideo();
              } else if (state === 1) {
                heldTime = undefined;
                active = true; pending = undefined;
              } else if ([0,2,5].includes(state) && pending !== true) {
                if (pending !== false && (active || state !== 2)) heldTime = undefined;
                active = false; pending = undefined;
              } else if (state === 3 && pending === undefined) {
                heldTime = undefined;
                active = true;
              }
              changed();
            },
            onAutoplayBlocked() {
              if (request !== generation) return;
              pending = undefined; active = false;
              failed('Playback was blocked. Press Play in the video player.');
              changed();
            },
            onError(event) {
              if (request !== generation) return;
              ready = false; loading = false; pending = undefined; active = false;
              failed([101,150].includes(event.data) ? 'This video cannot be embedded. Choose another recording or No music.' : 'YouTube playback is unavailable. Choose No music to practise.');
              changed();
            },
          },
        });
      } catch (error) { if (request !== generation) return; loading = false; failed(error instanceof Error ? error.message : 'YouTube is unavailable.'); changed(); }
    },
    get ready() { return ready; },
    get playing() { return ready && (pending ?? active); },
    get state() { return ready ? player!.getPlayerState() : -1; },
    get time() {
      if (heldTime !== undefined) return heldTime;
      const time = ready ? player!.getCurrentTime() : 0;
      lastTime = Number.isFinite(time) ? time : 0;
      return lastTime;
    },
    get rate() { const rate = ready ? player!.getPlaybackRate() : 1; return Number.isFinite(rate) && rate > 0 ? rate : 1; },
    play() {
      if (!ready) return;
      heldTime = undefined;
      pending = pending === false || player!.getPlayerState() !== 1 ? true : undefined;
      active = true;
      player!.playVideo();
    },
    pause() {
      if (!ready) return;
      heldTime = lastTime;
      // Pausing an already stopped player may emit no acknowledgement. Do not
      // leave a stale cancellation that would block its own embedded controls.
      pending = pending === true || active || [1,3].includes(player!.getPlayerState()) ? false : undefined;
      active = false;
      player!.pauseVideo();
    },
    seek(seconds: number) {
      if (!ready) return;
      if (heldTime !== undefined) heldTime = lastTime = seconds;
      player!.seekTo(seconds, true);
    },
  };
}
