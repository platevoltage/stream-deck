
import path from "path";
import { fileURLToPath } from 'url';
import robot from "robotjs";
import { setup, stillIcon, animatedIcon, stillPanel } from "./utils/utils.ts"
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { deck } = await setup(onKeyPress);



const actions = [
  {
    0: () => robot.keyTap("f"),
    1: () => robot.keyTap("a"),
    2: () => robot.keyTap("b"),
    3: () => robot.keyTap("c"),
    4: () => robot.keyTap("d"),
    5: () => robot.keyTap("e"),
  }
];

const images = [
  {
    0: await animatedIcon(path.resolve(__dirname, "images", `bm.gif`), "Menu"),
    1: await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "Restart"),
    2: await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
    3: await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
    4: await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
    // 5: await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "f"),
  }
]

const frames = [
  {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }
]


function onKeyPress(key: number) {
  actions[0][key]();
}



for (let i = 0; i < 6; i++) {
  (async () => {
    while (1) {

      let _images = images[0][i];

      if (_images) {

        await deck.fillKeyBuffer(i, _images[frames[0][i]].buffer, { format: 'rgba' });
        if (frames[0][i] === _images.length - 1) {
          frames[0][i] = 0;
        } else {
          frames[0][i]++;
        }
        await new Promise(resolve => setTimeout(resolve, _images[frames[0][i]].delay * 10));
      } else {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }
  })();
}

