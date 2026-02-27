export class FPSMeter {
  private container: HTMLDivElement;
  private frames = 0;
  private prevTime = performance.now();
  private fps = 0;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '10px';
    this.container.style.left = '10px';
    this.container.style.padding = '8px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.container.style.color = '#00ff00';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '12px';
    this.container.style.zIndex = '9999';
    this.container.style.pointerEvents = 'none';
    this.container.textContent = 'FPS: --';
    document.body.appendChild(this.container);
  }

  public update() {
    this.frames++;
    const time = performance.now();

    if (time >= this.prevTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (time - this.prevTime));
      this.prevTime = time;
      this.frames = 0;
      this.container.textContent = `FPS: ${this.fps}`;
    }
  }

  public dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
