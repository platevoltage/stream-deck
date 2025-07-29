
import path from "path";
import { fileURLToPath } from 'url';
import robot from "robotjs";
import { setup, stillIcon, animatedIcon, stillPanel } from "./utils/utils.ts"
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { deck } = await setup(onKeyPress);

let currentPage = 0;


const actions = [
  {
    0: () => robot.keyTap("f"),
    1: () => robot.keyTap("a"),
    2: () => robot.keyTap("b"),
    3: () => robot.keyTap("c"),
    4: () => robot.keyTap("d"),
    5: () => currentPage = 1,
  },
  {
    0: () => robot.keyTap("f"),
    1: () => robot.keyTap("a"),
    2: () => robot.keyTap("b"),
    3: () => robot.keyTap("c"),
    4: () => robot.keyTap("d"),
    5: () => currentPage = 0,
  }
];

const images = [
  {
    0: await stillIcon(path.resolve(__dirname, "images", `link.png`), "Menu"),
    1: await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "Restart"),
    2: await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
    3: await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
    4: await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
    5: await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
  },
  {
    0: await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "Restart"),
    1: await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
    2: await animatedIcon(path.resolve(__dirname, "images", `bm.gif`), "Menu"),
    3: await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
    4: await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
    5: await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
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
  },
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
  actions[currentPage][key]();
}



for (let i = 0; i < 6; i++) {
  (async () => {
    while (1) {
      const page = currentPage;
      let _images = images[page][i];

      if (_images) {

        await deck.fillKeyBuffer(i, _images[frames[page][i]].buffer, { format: 'rgba' });
        if (_images[frames[page][i]].delay) {
          await new Promise(resolve => setTimeout(resolve, _images[frames[page][i]].delay * 10));
        } else {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (frames[page][i] === _images.length - 1) {
          frames[page][i] = 0;
        } else {
          frames[page][i]++;
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  })();
}

