
import path from "path";
import { fileURLToPath } from 'url';
import robot from "robotjs";
import { setup, stillIcon, animatedIcon } from "./utils/utils.ts"
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { deck } = await setup(onKeyPress);



const actions = [
  {
    1: () => robot.keyTap("a"),
    2: () => robot.keyTap("b"),
    3: () => robot.keyTap("c"),
    4: () => robot.keyTap("d"),
    5: () => robot.keyTap("e"),
    6: () => robot.keyTap("f"),
  }
];

const images = [
  {
    1: await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "a", 60),
    2: await stillIcon(path.resolve(__dirname, "images", `sega.png`), "b"),
    3: await stillIcon(path.resolve(__dirname, "images", `sega.png`), "c"),
    4: await stillIcon(path.resolve(__dirname, "images", `sega.png`), "d"),
    5: await stillIcon(path.resolve(__dirname, "images", `sega.png`), "e"),
    6: await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "f"),
  }
]

const frames = [
  {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  }
]


function onKeyPress(key: number) {
  actions[0][key + 1]();
}



while (1) {
  for (let i = 0; i < 6; i++) {
    let _images = images[0][i + 1];
    await deck.fillKeyBuffer(i, _images[frames[0][i + 1]], { format: 'rgba' });
    if (frames[0][i + 1] === _images.length - 1) {
      frames[0][i + 1] = 0;
    } else {
      frames[0][i + 1]++;
    }
    await new Promise(resolve => setTimeout(resolve, 1));
  }
}
