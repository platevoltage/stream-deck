
import path from "path";
import { fileURLToPath } from 'url';
import { setup, stillIcon, animatedIcon, stillPanel, pageChange } from "./utils/utils.ts"
import sharp from 'sharp';
import { sendKeypress, KeyCode } from "./utils/keyboard.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { deck } = await setup(onKeyPress);

let currentPage = 0;
let pause = false;

const actions = [
  {
    0: () => sendKeypress(KeyCode.KEY_ENTER),
    1: () => sendKeypress(KeyCode.KEY_A, KeyCode.KEY_LEFTSHIFT),
    2: () => sendKeypress(KeyCode.KEY_B),
    3: () => sendKeypress(KeyCode.KEY_C),
    4: () => sendKeypress(KeyCode.KEY_D),
    5: async () => {
      if (!pause) {
        currentPage = 1;
        pause = true;
        await pageChange(deck, images, currentPage);
        pause = false;
      }
    }
  },
  {
    0: () => sendKeypress(KeyCode.KEY_ENTER),
    1: () => sendKeypress(KeyCode.KEY_A, KeyCode.KEY_LEFTSHIFT),
    2: () => sendKeypress(KeyCode.KEY_B),
    3: () => sendKeypress(KeyCode.KEY_C),
    4: () => sendKeypress(KeyCode.KEY_D),
    5: async () => {
      if (!pause) {
        currentPage = 0;
        pause = true;
        await pageChange(deck, images, currentPage);
        pause = false;
      }
    }
  }
];

const images: {
  buffer: Buffer<ArrayBufferLike>;
  delay?: number;
}[][][] = [
    [
      await animatedIcon(path.resolve(__dirname, "images", `bm.gif`), "Menu"),
      await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "Restart"),
      await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
      await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
      await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
      await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
    ],
    [
      await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
      await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
      await animatedIcon(path.resolve(__dirname, "images", `bm.gif`), "Menu"),
      await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
      await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
      await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
    ]
  ]

const frames = new Array(2).fill(
  new Array(6).fill(0)
);



function onKeyPress(key: number) {
  actions[currentPage][key]();
}



for (let i = 0; i < 6; i++) {
  (async () => {
    while (true) {
      while (pause) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const page = currentPage;
      let _images = images[page][i];

      if (_images) {

        await deck.fillKeyBuffer(i, _images[frames[page][i]].buffer, { format: 'rgba' });
        if (_images[frames[page][i]].delay) {
          await new Promise(resolve => setTimeout(resolve, _images[frames[page][i]].delay! * 10));
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

