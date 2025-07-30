
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
  [
    () => sendKeypress(KeyCode.KEY_ENTER),
    () => sendKeypress(KeyCode.KEY_A, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_B),
    () => sendKeypress(KeyCode.KEY_C),
    () => sendKeypress(KeyCode.KEY_D),
    async () => {
      if (!pause) {
        currentPage = 1;
        pause = true;
        await pageChange(deck, images, currentPage);
        pause = false;
      }
    }
  ],
  [
    () => sendKeypress(KeyCode.KEY_ENTER),
    () => sendKeypress(KeyCode.KEY_A, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_B),
    () => sendKeypress(KeyCode.KEY_C),
    () => sendKeypress(KeyCode.KEY_D),
    async () => {
      if (!pause) {
        currentPage = 0;
        pause = true;
        await pageChange(deck, images, currentPage);
        pause = false;
      }
    }
  ],
  [
    () => sendKeypress(KeyCode.KEY_ENTER),
    () => sendKeypress(KeyCode.KEY_A, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_B),
    () => sendKeypress(KeyCode.KEY_C),
    () => sendKeypress(KeyCode.KEY_D),
    async () => {
      if (!pause) {
        currentPage = 0;
        pause = true;
        await pageChange(deck, images, currentPage);
        pause = false;
      }
    }
  ]
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
    ],
    [
      await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
      await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
      await animatedIcon(path.resolve(__dirname, "images", `bm.gif`), "Menu"),
      await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
      await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
      await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
    ]
  ]

const frames = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
];



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
      let index = frames[page][i];

      if (_images) {
        try {
          const _image = _images[index];
          await deck.fillKeyBuffer(i, _image.buffer, { format: 'rgba' });
          if (_image.delay) {
            await new Promise(resolve => setTimeout(resolve, _image.delay! * 10));
          } else {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (e) {
          console.error(e);
        }
        if (index >= _images.length - 1) {
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

