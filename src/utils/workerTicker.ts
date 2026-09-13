/**
 * Web Worker Ticker para evitar que o navegador congele o relógio
 * em segundo plano (background throttling).
 *
 * Browsers normais reduzem setInterval para 1x por minuto em segundo plano.
 * Com um Web Worker dedicado, o clock roda a cada 1 segundo com precisão absoluta!
 */

export class BackgroundTicker {
  private worker: Worker | null = null;
  private onTickCallback: ((timestamp: number) => void) | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              self.postMessage({ type: 'tick', timestamp: Date.now() });
            }, 1000);
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = (e) => {
        if (e.data?.type === 'tick' && this.onTickCallback) {
          this.onTickCallback(e.data.timestamp);
        }
      };
    } catch {
      // Fallback gracioso se Workers não forem permitidos
      this.worker = null;
    }
  }

  public start(callback: (timestamp: number) => void) {
    this.onTickCallback = callback;
    if (this.worker) {
      this.worker.postMessage('start');
    } else {
      // Fallback padrão se worker falhar
      setInterval(() => {
        callback(Date.now());
      }, 1000);
    }
  }

  public stop() {
    if (this.worker) {
      this.worker.postMessage('stop');
    }
  }
}
