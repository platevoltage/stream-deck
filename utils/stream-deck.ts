import type { StreamDeck } from "@elgato-stream-deck/node";
import { setup, stillIcon, animatedIcon, stillPanel, pageChange, loadingAnimation, delay, solidColorIcon, customIcon } from "./utils.ts"
import type { ImageFrame } from "./utils.ts"
import { char, echo, KEY, sendByte, sendCommand } from "./linux.ts";


export const PAGE_NAMES = {
    EMULATION_STATION: 0,
    GAME_COMMON: 1,
    EXIT_CONFIRM: 2,
    RESTART_CONFIRM: 3,
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
        await animatedIcon("metal-slug-guy.gif", "", 90, false),
        await animatedIcon(`metal-slug.gif`, "Volume +", 100, false),
        await animatedIcon(`metalslug-zombie.gif`, "Volume -", 100, false),
        await animatedIcon(`fio-metalslug-hot-gif.gif`, "", 90, false),
        await animatedIcon(`fio-metalslug-picnic.gif`, "View", 100, false),
        await animatedIcon(`metal-slug-knife.gif`, "Menu", 100, false),
    ],
    [ // GAME_COMMON
        await animatedIcon(`luigi.gif`, "Pause", 70, false),
        await animatedIcon(`mc.gif`, "Load State", 70, false),
        await animatedIcon(`mm.gif`, "Save State", 70),
        await animatedIcon(`game_over_inv.gif`, "Exit Game"),
        await animatedIcon(`POW.gif`, "Restart"),
        await animatedIcon(`bm.gif`, "Menu"),
    ],
    [ // EXIT_CONFIRM
        await animatedIcon(`bubble-bobble-check.gif`, "", 100, false),
        await solidColorIcon([0, 0, 0], ""),
        await animatedIcon(`bubble-bobble-X.gif`, "", 100, false),
        await solidColorIcon([0, 0, 0], "Sure?"),
        await solidColorIcon([0, 0, 0], "You"),
        await solidColorIcon([0, 0, 0], "Are"),
    ],
    [ // RESTART_CONFIRM
        await animatedIcon(`bubble-bobble-check.gif`, "", 100, false),
        await solidColorIcon([0, 0, 0], ""),
        await animatedIcon(`bubble-bobble-X.gif`, "", 100, false),
        await solidColorIcon([0, 0, 0], "Sure?"),
        await solidColorIcon([0, 0, 0], "You"),
        await solidColorIcon([0, 0, 0], "Are"),
    ],
];

const actions: Function[/*page*/][/*key*/] = [
    [ // EMULATION_STATION
        () => null,
        () => sendCommand("batocera-audio setSystemVolume +5"),
        () => sendCommand("batocera-audio setSystemVolume -5"),
        () => null,
        () => sendByte(KEY.SPACE),
        () => sendByte(KEY.RETURN),
    ],
    [ // GAME_COMMON
        () => sendByte(KEY.F7),
        () => sendByte(KEY.F4),
        () => sendByte(KEY.F3),
        () => goToPage(PAGE_NAMES.EXIT_CONFIRM),
        () => goToPage(PAGE_NAMES.RESTART_CONFIRM),
        () => sendByte(KEY.F1),
    ],
    [ // EXIT_CONFIRM
        () => sendCommand("batocera-es-swissknife --emukill"),
        () => null,
        () => goToPage(PAGE_NAMES.GAME_COMMON),
        () => null,
        () => null,
        () => null,
    ],
    [ // RESTART_CONFIRM
        () => {
            sendByte(KEY.F10);
            goToPage(PAGE_NAMES.GAME_COMMON);
        },
        () => null,
        () => goToPage(PAGE_NAMES.GAME_COMMON),
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