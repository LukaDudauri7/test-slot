import * as PIXI from 'pixi.js';
import { ReelsController } from './reels';

const app = new PIXI.Application({
  resizeTo: window,
  antialias: true,
  backgroundColor: 0x0a0a0a
});

document.getElementById('app')!.appendChild(app.view);

const emitter = new PIXI.utils.EventEmitter();

// --- Load separate textures ---
const assets: Record<string, string> = {};
for (let i = 1; i <= 7; i++) {
  const name = `symbol_${String(i).padStart(2, '0')}`;
  assets[name] = `/symbols/${name}.png`;
}

PIXI.Assets.load(assets).then((loaded) => {
  // loaded object -> { symbol_01: Texture, symbol_02: Texture, ... }
  const symbolTextures: PIXI.Texture[] = [];
  for (let i = 1; i <= 7; i++) {
    const key = `symbol_${String(i).padStart(2, '0')}`;
    symbolTextures.push(loaded[key]);
  }

  const controller = new ReelsController(app, symbolTextures, emitter);
  controller.position.set(100, 100);
  app.stage.addChild(controller);

  // wire UI
  const spinBtn = document.getElementById('spin') as HTMLButtonElement;
  const stopBtn = document.getElementById('stop') as HTMLButtonElement;
  const breakBtn = document.getElementById('break') as HTMLButtonElement;

  spinBtn.onclick = () => controller.spin();
  stopBtn.onclick = () => controller.stopStandard();
  breakBtn.onclick = () => controller.stopQuick();

  emitter.on('stop', (idx: number) => {
    console.log('Reel stopped:', idx);
  });
});
