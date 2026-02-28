import Stats from 'three/examples/jsm/libs/stats.module.js';

export class FPSOverlay {
  private stats: Stats;

  constructor() {
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom);
  }

  public update(): void {
    this.stats.update();
  }

  public hide(): void {
    this.stats.dom.style.display = 'none';
  }

  public show(): void {
    this.stats.dom.style.display = 'block';
  }

  public destroy(): void {
    if (this.stats.dom.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
    }
  }
}
