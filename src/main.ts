import * as PIXI from 'pixi.js';
import { ReelsController } from './reels';

const app = new PIXI.Application({
  resizeTo: window,
  antialias: true,
});

document.getElementById('app')!.appendChild(app.view as HTMLCanvasElement);

// Event emitter shared
const emitter = new PIXI.utils.EventEmitter();

// Load 
PIXI.Assets.add('background', '/bg.jpeg');
PIXI.Assets.load('background').then((bg) => {
  const bgSprite = new PIXI.Sprite(bg as PIXI.Texture);
  bgSprite.width = app.screen.width;
  bgSprite.height = app.screen.height + 400;
  app.stage.addChild(bgSprite);
});

PIXI.Assets.add('symbols-atlas', '/test_res.json');
PIXI.Assets.load('symbols-atlas').then((atlas) => {
    const textures = atlas as any;
    const symbolTextures: PIXI.Texture[] = [];
    for (let i = 1; i <= 10; i++) {
        const key = `symbols/symbol_${String(i).padStart(2, '0')}.png`;
        const t = textures.textures?.[key] ?? PIXI.Texture.EMPTY;
        symbolTextures.push(t);
    }
    
    const controller = new ReelsController(app, symbolTextures, emitter);
    controller.pivot.set(controller.width / 2, controller.height / 2);
    controller.position.set(app.screen.width / 2, app.screen.height / 2);

    app.stage.addChild(controller);
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
