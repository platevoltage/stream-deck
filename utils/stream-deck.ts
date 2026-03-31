import path from "path";
import type { StreamDeck } from "@elgato-stream-deck/node";
import { setup, stillIcon, animatedIcon, stillPanel, pageChange, loadingAnimation, delay } from "./utils.ts"
import type { ImageFrame } from "./utils.ts"
import { sendKeypress, KeyCode } from "./keyboard.ts";
import { char, echo, KEY, sendByte, sendCommand } from "./linux.ts";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "..");


const images: ImageFrame[/*page*/][/*key*/][/*frame*/] = [
    [
        await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
        await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
        await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
        await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
        await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
        await stillIcon(path.resolve(__dirname, "images", `Super Mario 64 (USA).png`), "Mario"),
    ],
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
];

const actions: (() => unknown)[/*page*/][/*key*/] = [
    [
        goToNextPage,
        () => sendByte(KEY.F4),
        () => sendByte(KEY.F3),
        () => sendCommand("batocera-es-swissknife --emukill"),
        () => sendByte(char("h")),
        () => sendByte(KEY.F1),
    ],
    [
        goToNextPage,
        () => sendByte(KEY.F4),
        () => sendByte(KEY.F3),
        () => sendCommand("batocera-es-swissknife --emukill"),
        () => sendByte(char("h")),
        () => sendByte(KEY.F1),
    ],
    [
        goToNextPage,
        () => sendByte(KEY.F4),
        () => sendByte(KEY.F3),
        () => sendCommand("batocera-es-swissknife --emukill"),
        () => sendByte(char("h")),
        () => sendByte(KEY.F1),
    ],
];

let currentPage = 0;
let pause = false;
let loading = true;
let deck: StreamDeck | null = null;

export async function startStreamDeck(NUM_KEYS: number) {
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
    await new Promise(resolve => setTimeout(resolve, 4000));

    for (let i = 0; i < NUM_KEYS; i++) {
        (async () => {
            while (true) {
                while (pause) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                const page = currentPage;
                let _images = images[page][i];
                let index = frames[page][i];

                if (_images && deck) {
                    try {
                        const _image = _images[index];
                        await deck.fillKeyBuffer(i, _image.buffer, { format: 'rgba' });

                        //Frame delay. If there is no delay property, delay defaults to 100 ms.
                        await new Promise(resolve => setTimeout(resolve, (_image.delay || 10) * 10));

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