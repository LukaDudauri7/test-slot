import * as PIXI from 'pixi.js';
import { Reel } from './reel';

export class ReelsController extends PIXI.Container {
  reels: Reel[] = [];
  cols = 5; // 5 columns (reels)
  rows = 3; // 3 visible rows
  stopping = false;
  private _stopQueue: number[] = [];

  constructor(app: PIXI.Application, textures: PIXI.Texture[], emitter: PIXI.utils.EventEmitter) {
    super();

    const spacing = 12;
    const symbolSize = 128; // size per symbol (assumed square)

    for (let i = 0; i < this.cols; i++) {
      // create unique texture sequence per reel
      const seq = ReelsController.generateUniqueSequence(textures.length);
      const reel = new Reel(i, seq, textures, this.rows, symbolSize, emitter);
      reel.x = i * (symbolSize + spacing);
      this.addChild(reel);
      this.reels.push(reel);
    }
  }

  static generateUniqueSequence(symbolCount: number) {
    // shuffle 1..symbolCount
    const arr = Array.from({ length: 1000 }, (_, i) => ((i % symbolCount) + 1));
    // shuffle in place
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr; // very long random cycle
  }

  spin() {
    this.stopping = false;
    this._stopQueue = [];
    this.reels.forEach(r => r.startSpin());
  }

  stopStandard() {
    if (this.stopping) return;
    this.stopping = true;
    // pick final grids for each reel ahead of time
    this.reels.forEach(r => r.prepareFinalSymbols());

    // stop one by one with 1s interval
    this.reels.forEach((r, idx) => {
      setTimeout(() => {
        r.startStop();
      }, idx * 1000);
    });
  }

  stopQuick() {
    // If standard stopping is in progress, do not change already chosen finals
    // Immediately stop all reels
    this.reels.forEach(r => {
      r.quickStop();
    });
  }
}