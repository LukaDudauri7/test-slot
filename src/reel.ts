import * as PIXI from 'pixi.js';

export class Reel extends PIXI.Container {
  index: number;
  rows: number;
  symbolSize: number;
  textures: PIXI.Texture[];
  seq: number[];
  sprites: PIXI.Sprite[] = [];
  baseSpeed = 24;
  spinSpeed = 24;
  private emitter: PIXI.utils.EventEmitter;

  private spinning = false;
  private stopping = false;
  private finalSymbols: number[] | null = null;

  constructor(
    index: number,
    seq: number[],
    textures: PIXI.Texture[],
    rows: number,
    symbolSize: number,
    emitter: PIXI.utils.EventEmitter
  ) {
    super();
    this.index = index;
    this.seq = seq.slice();
    this.textures = textures;
    this.rows = rows;
    this.symbolSize = symbolSize;
    this.emitter = emitter;

    this.createSprites();
    this.createMask();

    PIXI.Ticker.shared.add(this.onTick, this);
  }

  private createSprites() {
    const total = this.rows + 2;
    for (let i = 0; i < total; i++) {
      const val = this.nextSequenceValue();
      const sprite = new PIXI.Sprite(this.getTextureFor(val));
      sprite.width = this.symbolSize;
      sprite.height = this.symbolSize;
      sprite.y = (i - 1) * this.symbolSize;
      this.addChild(sprite);
      this.sprites.push(sprite);
    }
  }

  private createMask() {
    const g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawRect(0, 0, this.symbolSize, this.rows * this.symbolSize);
    g.endFill();
    this.addChild(g);
    this.mask = g;
  }

  private nextSequenceValue() {
    const v = this.seq.shift()!;
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
    this.finalSymbols = null;
    this.spinSpeed = this.baseSpeed;
    this.filters = [new PIXI.filters.BlurFilter(2)];
  }

  prepareFinalSymbols() {
    const finals: number[] = [];
    for (let r = 0; r < this.rows; r++) {
      finals.push(1 + Math.floor(Math.random() * this.textures.length));
    }
    this.finalSymbols = finals;
  }

  startStop() {
    if (!this.spinning) return;
    this.stopping = true;
  }

  quickStop() {
    if (!this.finalSymbols) this.prepareFinalSymbols();
    this.snapToFinal();
  }

  private snapToFinal() {
    this.filters = [];
    for (const s of this.sprites) {
        s.y = Math.round(s.y / this.symbolSize) * this.symbolSize;
    }
    for (const s of this.sprites) {
        s.y = Math.round(s.y / this.symbolSize) * this.symbolSize;
    }
    if (!this.finalSymbols) this.prepareFinalSymbols();

    for (let r = 0; r < this.rows; r++) {
      const sprite = this.sprites[r];
      const val = this.finalSymbols![r];
      sprite.texture = this.getTextureFor(val);
      sprite.y = r * this.symbolSize;
    }

    this.sprites[0].y = -this.symbolSize;
    for (let i = 1; i < this.sprites.length; i++) {
      this.sprites[i].y = this.sprites[i - 1].y + this.symbolSize;
    }

    this.spinning = false;
    this.stopping = false;
    this.spinSpeed = this.baseSpeed;

    this.emitter.emit('stop', this.index);
  }

  private onTick(delta: number) {
    if (!this.spinning) return;

    const bottom = this.rows * this.symbolSize;
    const totalHeight = this.sprites.length * this.symbolSize;

    // movement
    const speed = this.spinSpeed * delta;
    for (const s of this.sprites) {
      s.y += speed;
    }

    // wrapping
    for (const s of this.sprites) {
      if (s.y >= bottom + this.symbolSize) {
        s.y -= totalHeight;
        const val = this.nextSequenceValue();
        s.texture = this.getTextureFor(val);
      }
    }

    // stopping
    if (this.stopping) {
      this.spinSpeed *= 0.95;
      if (this.spinSpeed < 2) {
        this.snapToFinal();
      }
    }
  }
}
