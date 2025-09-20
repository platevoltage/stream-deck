
import path from "path";
import { fileURLToPath } from 'url';
import { setup, stillIcon, animatedIcon, stillPanel, pageChange, loadingAnimation } from "./utils/utils.ts"
import type { ImageFrame } from "./utils/utils.ts"
import { sendKeypress, KeyCode } from "./utils/keyboard.ts";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { deck } = await setup(onKeyPress);
deck.setBrightness(60);

let currentPage = 0;
let pause = false;

let loading = true;
(async () => {
  while (loading)
    await loadingAnimation(deck);
})();

const actions: (() => unknown)[/*page*/][/*key*/] = [
  [
    goToNextPage,
    () => sendKeypress(KeyCode.KEY_F4, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_F2, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_DELETE, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_H, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_F1, KeyCode.KEY_LEFTSHIFT),
  ],
  [
    goToNextPage,
    () => sendKeypress(KeyCode.KEY_D),
    () => sendKeypress(KeyCode.KEY_C),
    () => sendKeypress(KeyCode.KEY_B),
    () => sendKeypress(KeyCode.KEY_A, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_ENTER),
  ],
  [
    goToNextPage,
    () => sendKeypress(KeyCode.KEY_D),
    () => sendKeypress(KeyCode.KEY_C),
    () => sendKeypress(KeyCode.KEY_B),
    () => sendKeypress(KeyCode.KEY_A, KeyCode.KEY_LEFTSHIFT),
    () => sendKeypress(KeyCode.KEY_ENTER),
  ],
];


const images: ImageFrame[/*page*/][/*key*/][/*frame*/] = [
  [
    await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
    await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
    await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
    await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
    await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "Restart"),
    await animatedIcon(path.resolve(__dirname, "images", `bm.gif`), "Menu"),
  ],
  [
    await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
    await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
    await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
    await animatedIcon(path.resolve(__dirname, "images", `sonic.gif`), "Menu", 70),
    await animatedIcon(path.resolve(__dirname, "images", `star.gif`), "Exit Game", 70, false),
    await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
  ],
  [
    await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
    await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
    await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
    await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
    await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
    await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
  ],
];

const frames: number[/*page*/][/*key*/] = [];
images.forEach(() => frames.push([0, 0, 0, 0, 0, 0]));


function onKeyPress(key: number) {
  actions[currentPage][key]();
}


loading = false;
await new Promise(resolve => setTimeout(resolve, 4000));

(async () => {
  while (true) {
    while (pause) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const page = currentPage;
    for (let i = 0; i < 6; i++) {
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
  }
})();

// await deck.fillPanelBuffer(await stillPanel(path.resolve(__dirname, "images", `pm.gif`), 100));

async function goToNextPage() {
  if (!pause) {
    currentPage++;
    pause = true;
    if (!images[currentPage]) currentPage = 0;
    await pageChange(deck, images, currentPage);
    pause = false;
  }
}

//--------------------------------------

// let playlistDirs = await fs.promises.readdir("/Users/garrett/Documents/RetroArch/playlists");
// playlistDirs = playlistDirs.filter((file) => file.endsWith(".lpl"));
// console.log(playlistDirs);
// for (let dir of playlistDirs) {
//   const playlistPath = path.join("/Users/garrett/Documents/RetroArch/playlists", dir);
//   // const playlistFile = await fs.promises.readFile(path.join(__dirname, "stuff", "Nintendo - Nintendo 64.lpl"), { encoding: 'utf8' });
//   const playlistFile = await fs.promises.readFile(playlistPath, { encoding: 'utf8' });
//   const items = JSON.parse(playlistFile).items;

//   let newPage: ImageFrame[/*key*/][/*frame*/] = []
//   let newActions: (() => unknown)[/*key*/] = [];
//   for (let item of items) {
//     try {
//       let filePath = path.join("/Users/garrett/Library/Application Support/RetroArch/thumbnails", path.parse(dir).name, "Named_Titles", item.label + ".png")
//       try {
//         const imageFile = await fs.promises.readFile(filePath, { encoding: 'utf8' });

//       } catch (e) {
//         filePath = path.join("/Users/garrett/Library/Application Support/RetroArch/thumbnails", path.parse(dir).name, "Named_Boxarts", item.label + ".png")
//         const imageFile = await fs.promises.readFile(filePath, { encoding: 'utf8' }).catch((e) => { throw new Error(e) });
//       }
//       // console.log(item.label);
//       if (newPage.length === 6) {
//         images.push(newPage);
//         actions.push(newActions);
//         frames.push([0, 0, 0, 0, 0, 0])
//         newPage = [];
//         newActions = [];
//       }
//       const nextPage = images.length + 1;
//       newPage.push(await stillIcon(filePath, item.label, 90));
//       newActions.push(async () => {
//         if (!pause) {
//           currentPage = nextPage;
//           pause = true;
//           if (!images[currentPage]) currentPage = 0;
//           await pageChange(deck, images, currentPage);
//           pause = false;
//         }
//       })


//     } catch (e) {
//       console.error(e);
//     }
//   }
// }

