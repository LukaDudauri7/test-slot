import * as PIXI from 'pixi.js';

export class Reel extends PIXI.Container {
  index: number;
  rows: number;
  symbolSize: number;
  textures: PIXI.Texture[]; // textures[0..6] for symbols 1..7
  seq: number[]; // large sequence of symbol indices (1..7)
  sprites: PIXI.Sprite[] = [];
  spinSpeed = 24; // pixels per frame base
  private offset = 0; // offset for visible area
  private maskRect: PIXI.Graphics;
  private emitter: PIXI.utils.EventEmitter;

  private spinning = false;
  private stopping = false;
  private finalSymbols: number[] | null = null; // chosen final visible symbols (1..7)

  constructor(index: number, seq: number[], textures: PIXI.Texture[], rows: number, symbolSize: number, emitter: PIXI.utils.EventEmitter) {
    super();
    this.index = index;
    this.seq = seq.slice();
    this.textures = textures;
    this.rows = rows;
    this.symbolSize = symbolSize;
    this.emitter = emitter;

    this.createSprites();
    this.createMask();

    // update via ticker
    PIXI.Ticker.shared.add(this.onTick, this);
  }

  private createSprites() {
    // Create extra sprites to allow wrapping - create rows + 2 extra
    const total = this.rows + 3;
    for (let i = 0; i < total; i++) {
      const val = this.nextSequenceValue();
      const t = this.getTextureFor(val);
      const s = new PIXI.Sprite(t);
      s.width = this.symbolSize;
      s.height = this.symbolSize;
      s.y = (i - 1) * this.symbolSize; // start slightly above so visible slots are rows 0..rows-1
      this.addChild(s);
      this.sprites.push(s);
    }
  }

  private createMask() {
    const g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawRect(0, 0, this.symbolSize, this.rows * this.symbolSize);
    g.endFill();
    this.addChild(g);
    this.maskRect = g;
    this.mask = g;
  }

  private nextSequenceValue() {
    const v = this.seq.shift()!; // assume non-empty
    this.seq.push(v);
    return v;
  }

  private getTextureFor(value: number) {
    const idx = Math.max(0, Math.min(this.textures.length - 1, value - 1));
    return this.textures[idx] ?? PIXI.Texture.EMPTY;
  }

  startSpin() {
    this.spinning = true;
    this.stopping = false;
    // apply blur while spinning (visual motion blur)
    (this.filters = [new PIXI.filters.BlurFilter(2)])
  }

  prepareFinalSymbols() {
    // choose random final symbols for the visible rows (1..7)
    const finals: number[] = [];
    for (let r = 0; r < this.rows; r++) {
      finals.push(1 + Math.floor(Math.random() * this.textures.length));
    }
    this.finalSymbols = finals;
  }

  startStop() {
    if (!this.spinning) return;
    this.stopping = true;
    // reduce speed progressively, then snap into final position with optional overshoot
    // we will keep spinning but decelerate
  }

  quickStop() {
    // Immediately place finalSymbols (if not chosen, choose now)
    if (!this.finalSymbols) this.prepareFinalSymbols();
    this.snapToFinal();
  }

  private snapToFinal() {
    // remove blur -> sharp
    this.filters = [];

    // directly set top visible sprites to final symbols
    // sprites with y positions within [0, rows*size) are visible rows
    const visibleYStart = 0;
    for (let r = 0; r < this.rows; r++) {
      // find sprite at approximately y = r*symbolSize
      let candidate = this.sprites.find(s => Math.abs(s.y - (r * this.symbolSize)) < this.symbolSize / 2);
      if (!candidate) candidate = this.sprites[r];
      const val = this.finalSymbols ? this.finalSymbols[r] : (1 + Math.floor(Math.random() * this.textures.length));
      candidate.texture = this.getTextureFor(val);
      candidate.y = r * this.symbolSize; // align perfectly
    }

    // align others above/below accordingly
    for (let i = 0; i < this.sprites.length; i++) {
      const s = this.sprites[i];
      if (s.y < 0) s.y = -this.symbolSize + (i * 0); // leave offscreen
      if (s.y >= this.rows * this.symbolSize) s.y = (i - 1) * this.symbolSize;
    }

    this.spinning = false;
    this.stopping = false;

    // emit stop event
    this.emitter.emit('stop', this.index);
  }

  private onTick(delta: number) {
    if (!this.spinning) return;

    // basic spin movement: move sprites downwards
    const speed = this.spinSpeed * (delta);
    for (const s of this.sprites) {
      s.y += speed;
    }

    // wrap sprites when they pass bottom
    const bottom = this.rows * this.symbolSize;
    for (const s of this.sprites) {
      if (s.y >= bottom) {
        // move to top
        s.y -= (this.sprites.length) * this.symbolSize;
        // update texture to next in sequence
        const val = this.nextSequenceValue();
        s.texture = this.getTextureFor(val);
      }
    }

    // if stopping in progress, gradually slow down and when speed small -> snap
    if (this.stopping) {
      this.spinSpeed *= 0.96; // decelerate
      if (this.spinSpeed < 2) {
        // overshoot by a small amount then snap back
        // choose final if absent
        if (!this.finalSymbols) this.prepareFinalSymbols();

        // do a tiny overshoot: advance sprites a bit then snap
        for (const s of this.sprites) s.y += 8; // overshoot

        // after overshoot, snap to final arrangement next tick
        this.snapToFinal();
        // reset base speed
        this.spinSpeed = 24;
      }
    }
  }
}