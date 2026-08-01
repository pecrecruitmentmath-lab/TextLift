/**
 * Utility to maintain full background execution speed when the user switches tabs or minimizes the browser.
 * Uses Web Workers for background timers (immune to main-thread tab throttling), Screen WakeLock API,
 * and intelligent UI update batching when document.hidden is true.
 */

class BackgroundKeepAlive {
  private worker: Worker | null = null;
  private wakeLock: any = null;
  private isRunning = false;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // 1. Request Screen WakeLock to prevent device sleep during extraction
    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      (navigator as any).wakeLock
        .request('screen')
        .then((lock: any) => {
          this.wakeLock = lock;
        })
        .catch(() => {
          // Wake lock unavailable or denied
        });
    }

    // 2. Create an inline Web Worker ticker.
    // Web Workers run in a separate execution context whose setInterval is NOT throttled by tab visibility!
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage('tick');
              }, 100);
            }
          } else if (e.data === 'stop') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      this.worker.postMessage('start');
    } catch (err) {
      console.warn('Web Worker ticker init failed:', err);
    }
  }

  public stop() {
    this.isRunning = false;

    if (this.worker) {
      try {
        this.worker.postMessage('stop');
        this.worker.terminate();
      } catch {
        // Ignore worker error
      }
      this.worker = null;
    }

    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {
        // Ignore wake lock release error
      }
      this.wakeLock = null;
    }
  }
}

export const backgroundKeepAlive = new BackgroundKeepAlive();

/**
 * Creates a progress callback wrapper that batches React state updates when the tab is hidden,
 * preventing UI state re-render queuing from slowing down background WASM / Fetch execution.
 */
export function createOptimizedProgressCallback(
  updateStateFn: (progress: number, message: string) => void,
  minIntervalMs: number = 100
) {
  let lastUpdate = 0;
  let pendingProgress = -1;
  let pendingMessage = '';
  let timeoutId: any = null;

  return (progress: number, message: string) => {
    const now = Date.now();
    pendingProgress = progress;
    pendingMessage = message;

    // If tab is hidden or rapid updates, batch state calls so worker thread gets max CPU
    if (document.hidden) {
      if (now - lastUpdate > 300 || progress >= 1.0) {
        lastUpdate = now;
        updateStateFn(progress, message);
      } else {
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            timeoutId = null;
            if (pendingProgress >= 0) {
              updateStateFn(pendingProgress, pendingMessage);
            }
          }, 250);
        }
      }
    } else {
      if (now - lastUpdate > minIntervalMs || progress >= 1.0) {
        lastUpdate = now;
        updateStateFn(progress, message);
      }
    }
  };
}
