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
  let generation = 0;
  return {
    async load(videoId: string, startSeconds = 0) {
      if (videoId === currentId && (ready || loading)) return;
      const request = ++generation;
      ready = false; loading = true;
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
            onStateChange() { if (request === generation) changed(); },
            onError(event) {
              if (request !== generation) return;
              ready = false; loading = false;
              failed([101,150].includes(event.data) ? 'This video cannot be embedded. Choose another recording or No music.' : 'YouTube playback is unavailable. Choose No music to practise.');
              changed();
            },
          },
        });
      } catch (error) { if (request !== generation) return; loading = false; failed(error instanceof Error ? error.message : 'YouTube is unavailable.'); changed(); }
    },
    get ready() { return ready; },
    get state() { return ready ? player!.getPlayerState() : -1; },
    get time() { const time = ready ? player!.getCurrentTime() : 0; return Number.isFinite(time) ? time : 0; },
    get rate() { const rate = ready ? player!.getPlaybackRate() : 1; return Number.isFinite(rate) && rate > 0 ? rate : 1; },
    play() { if (ready) player!.playVideo(); },
    pause() { if (ready) player!.pauseVideo(); },
    seek(seconds: number) { if (ready) player!.seekTo(seconds, true); },
  };
}
