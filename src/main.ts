import * as PIXI from 'pixi.js';
import { ReelsController } from './reels';

const app = new PIXI.Application({
  resizeTo: window,
  antialias: true,
  backgroundColor: 0x0a0a0a
});

document.getElementById('app')!.appendChild(app.view);

// Event emitter shared
const emitter = new PIXI.utils.EventEmitter();

// Load atlas (public/atlas.json + public/test_res.png)
PIXI.Assets.add('symbols-atlas', '/test_res.json');
PIXI.Assets.load('symbols-atlas').then((atlas) => {
  // textures are available through atlas.textures
  const textures = atlas as any;

  // build textures array from atlas keys
  const symbolTextures: PIXI.Texture[] = [];
  for (let i = 1; i <= 10; i++) {
    // შეცვლილი key atlas.json-სთან შესაბამისობისთვის
    const key = `symbols/symbol_${String(i).padStart(2, '0')}.png`;
    const t = textures.textures?.[key] ?? PIXI.Texture.EMPTY;
    symbolTextures.push(t);
  }

  // initialize reels controller
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

  // log stop events
  emitter.on('stop', (idx: number) => {
    console.log('Reel stopped:', idx);
  });
});
