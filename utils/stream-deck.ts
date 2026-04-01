import path from "path";
import type { StreamDeck } from "@elgato-stream-deck/node";
import { setup, stillIcon, animatedIcon, stillPanel, pageChange, loadingAnimation, delay, solidColorIcon } from "./utils.ts"
import type { ImageFrame } from "./utils.ts"
import { char, echo, KEY, sendByte, sendCommand } from "./linux.ts";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "..");

export const pageNames = {
    EMULATION_STATION: 0,
    GAME_COMMON: 1,
    EXIT_CONFIRM: 2
}

/* [
  bottom right,
  bottom middle,
  bottom left,
  top right,
  top middle,
  top left
] */
const images: ImageFrame[/*page*/][/*key*/][/*frame*/] = [
    [ // EMULATION_STATION
        await animatedIcon(path.resolve(__dirname, "images", `bubble-bobble-blue.gif`), "More...", 70),
        await animatedIcon(path.resolve(__dirname, "images", `bubble-bobble-push.gif`), "Volume +", 70, false),
        await animatedIcon(path.resolve(__dirname, "images", `bubble-bobble-ty.gif`), "Volume -", 70, false),
        await animatedIcon(path.resolve(__dirname, "images", `fio-metalslug-hot-gif.gif`), "Exit Game", 70, false),
        await animatedIcon(path.resolve(__dirname, "images", `fio-metalslug-picnic.gif`), "View", 100, false),
        await animatedIcon(path.resolve(__dirname, "images", `metal-slug-knife.gif`), "Menu", 100, false),
        // await animatedIcon(path.resolve(__dirname, "images", `metal-slug-guy.gif`), "More...", 70, false),
        // await animatedIcon(path.resolve(__dirname, "images", `metal-slug.gif`), "Volume +", 100, false),
        // await animatedIcon(path.resolve(__dirname, "images", `metalslug-zombie.gif`), "Volume -", 100, false),
        // await animatedIcon(path.resolve(__dirname, "images", `fio-metalslug-hot-gif.gif`), "Exit Game", 70, false),
        // await animatedIcon(path.resolve(__dirname, "images", `fio-metalslug-picnic.gif`), "View", 100, false),
        // await animatedIcon(path.resolve(__dirname, "images", `metal-slug-knife.gif`), "Menu", 100, false),
    ],
    [   // GAME_COMMON
        await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
        await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
        await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
        await animatedIcon(path.resolve(__dirname, "images", `game_over_inv.gif`), "Exit Game"),
        await animatedIcon(path.resolve(__dirname, "images", `POW.gif`), "Restart"),
        await animatedIcon(path.resolve(__dirname, "images", `bm.gif`), "Menu"),
    ],
    [ // EXIT_CONFIRM
        await solidColorIcon([0, 100, 0], "Yes"),
        await solidColorIcon([0, 0, 140]),
        await solidColorIcon([100, 0, 0], "No"),
        await solidColorIcon([0, 0, 140], "Sure?"),
        await solidColorIcon([0, 0, 140], "You"),
        await solidColorIcon([0, 0, 140], "Are"),
    ]
    // [
    //     await animatedIcon(path.resolve(__dirname, "images", `luigi.gif`), "More...", 70, false),
    //     await animatedIcon(path.resolve(__dirname, "images", `mc.gif`), "Load State", 70, false),
    //     await animatedIcon(path.resolve(__dirname, "images", `mm.gif`), "Save State", 70),
    //     await animatedIcon(path.resolve(__dirname, "images", `sonic.gif`), "Menu", 70),
    //     await animatedIcon(path.resolve(__dirname, "images", `star.gif`), "Exit Game", 70, false),
    //     await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
    // ],
];

const actions: (() => unknown)[/*page*/][/*key*/] = [
    [
        goToNextPage,
        () => sendCommand("batocera-audio setSystemVolume +5"),
        () => sendCommand("batocera-audio setSystemVolume -5"),
        () => sendByte(KEY.F3),
        () => sendByte(char("h")),
        () => sendByte(KEY.F1),
    ],
    [
        goToNextPage,
        () => sendByte(KEY.F4),
        () => sendByte(KEY.F3),
        () => goToPage(pageNames.EXIT_CONFIRM),
        () => sendByte(char("h")),
        () => sendByte(KEY.F1),
    ],
    [
        () => sendCommand("batocera-es-swissknife --emukill"),
        () => null,
        () => goToPage(pageNames.GAME_COMMON),
        () => null,
        () => null,
        () => null,
    ],
];

let currentPage = 0;
let pause = false;
let loading = true;
let deck: StreamDeck | null = null;

export async function start(NUM_KEYS: number) {
    while (!deck) {
        try {
            deck = (await setup(onKeyPress)).deck;
            console.log(deck);
            deck.setBrightness(60);
        } catch (e) {
            console.error(e);
            await delay(5000);
        }

    }

    (async () => {
        while (loading)
            await loadingAnimation(deck);
    })();



    const frames: number[/*page*/][/*key*/] = [];
    const keys = new Array(NUM_KEYS).fill(0);
    images.forEach(() => frames.push([...keys]));



    loading = false;
    await delay(4000);
    for (let i = 0; i < NUM_KEYS; i++) {
        (async () => {
            while (true) {
                while (pause) {
                    await delay(100);
                }
                const page = currentPage;
                let _images = images[page][i];
                let index = frames[page][i];

                if (_images && deck) {
                    try {
                        const _image = _images[index];
                        await deck.fillKeyBuffer(i, _image.buffer, { format: 'rgba' });

                        //Frame delay. If there is no delay property, delay defaults to 100 ms.
                        await delay((_image.delay || 10) * 10);

                    } catch (e) {
                        console.error(e);
                    }
                    if (index >= _images.length - 1) {
                        frames[page][i] = 0;
                    } else {
                        frames[page][i]++;
                    }
                } else {
                    await delay(100);
                }
            }
        })();
    }
}


function onKeyPress(key: number) {
    actions[currentPage][key]();
}

async function goToNextPage() {
    if (!pause) {
        currentPage++;
        pause = true;
        if (!images[currentPage]) currentPage = 0;
        await pageChange(deck, images, currentPage);
        pause = false;
    }
}

export async function goToPage(page: number) {
    if (!pause) {
        currentPage = page;
        pause = true;
        await pageChange(deck, images, currentPage);
        pause = false;
    }
}