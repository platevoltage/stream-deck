import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { openSerialPort } from './serial.ts';
import systemColors from "../buttons/system.ts";
import gameColors from "../buttons/game.ts";
import defaultColors from "../buttons/default.ts";
import * as streamDeck from './stream-deck.ts';
import { sendButtonColors } from './buttons.ts';


type ButtonBody = {
    event: "gameStart" | "gameStop",
    system: string, // ie: 'fbneo'
    rom: string // ie: '/userdata/roms/fbneo/mk2.7z'
}

export function start() {
    const port = openSerialPort();
    const app = express();
    app.use(express.json());
    app.use(cors());

    sendButtonColors(port, defaultColors);

    app.post('/button-lights', (req: express.Request, res: express.Response) => {
        const body: ButtonBody = req.body;
        console.log(body);


        if ("event" in body) {
            switch (body.event) {
                case "gameStart": {
                    streamDeck.goToPage(streamDeck.pageNames.GAME_COMMON);
                    if ("rom" in body) {
                        const rom = body.rom;
                        const game = path.basename(rom, path.extname(rom));
                        if (game in gameColors) {
                            console.log("GameColors:", gameColors[game]);
                            sendButtonColors(port, gameColors[game]);
                            break;
                        }
                    }
                    if ("system" in body) {
                        const system = body.system;
                        if (system in systemColors) {
                            console.log("SystemColors:", systemColors[system]);
                            sendButtonColors(port, systemColors[system]);
                            break;
                        }
                    }
                    break;

                }
                case "gameStop": {
                    sendButtonColors(port, defaultColors);
                    streamDeck.goToPage(streamDeck.pageNames.EMULATION_STATION);
                    break;
                }

            }
        }

        res.status(200).json({
            status: "success"
        });
    });




    const server = http.createServer(app);
    server.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.PORT || 3000} (HTTPS)`);
    });
}
