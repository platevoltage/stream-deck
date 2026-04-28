import { SerialPort } from "serialport";
import { delay } from "./utils.ts";

const NUM_BUTTONS = 20;
const OVER_SCAN = 2;

let runId = 0;
export async function sendButtonColors(port: SerialPort, colors: string[]) {

    if (colors.length <= (NUM_BUTTONS / 2)) {
        colors = [...colors, ...colors];
    }
    colors.splice(NUM_BUTTONS);
    console.log(colors);

    const player1Top = [ //
        "#FF0000", "#FF0000", "#FF0000", "#FF0000"];
    const player1Bottom = [ //
        "#FF0000", "#FF0000", "#FF0000", "#FF0000"];
    const p1StartSelect = colors.slice(8, (NUM_BUTTONS / 2));
    const player2Top = [ //
        "#0000FF", "#0000FF", "#0000FF", "#0000FF"];
    const player2Bottom = [ //
        "#0000FF", "#0000FF", "#0000FF", "#0000FF"];
    const p2StartSelect = colors.slice(18, NUM_BUTTONS);

    const myRun = ++runId;


    for (let i = -OVER_SCAN; (i < NUM_BUTTONS + OVER_SCAN * 2); i++) {

        player1Top[i] = colors.slice(0, 4)[i];
        player1Bottom[i - 1] = colors.slice(4, 8)[i - 1];
        player2Top[i - 14] = colors.slice(10, 14)[i - 14];
        player2Bottom[i - 15] = colors.slice(14, 18)[i - 15];

        const _player1Top = [...player1Top];
        const _player1Bottom = [...player1Bottom];
        const _player2Top = [...player2Top];
        const _player2Bottom = [...player2Bottom];
        _player1Top[i + 1] = "#FFFFFF";
        _player1Bottom[i] = "#FFFFFF";
        _player1Top[i + 2] = "#FFFFFF";
        _player1Bottom[i + 1] = "#FFFFFF";

        _player2Top[i - 13] = "#FFFFFF";
        _player2Bottom[i - 14] = "#FFFFFF";
        _player2Top[i - 12] = "#FFFFFF";
        _player2Bottom[i - 13] = "#FFFFFF";

        const finalColors = [..._player1Top.slice(0, 4), ..._player1Bottom.slice(0, 4), ...p1StartSelect, ..._player2Top.slice(0, 4), ..._player2Bottom.slice(0, 4), ...p2StartSelect];

        const json = { "buttons": finalColors.map(x => x.replace("#", "")) };
        console.log(json);
        port.write(JSON.stringify(json));
        await delay(50);
    }
    await delay(500);

    while (true) {
        //do other shit with buttons. fades, etc here.
        await delay(50);
        if (myRun !== runId) return;
    }

}