import { exec } from "child_process";
import { writeFileSync } from "fs";
import { SERIAL_PATH } from "./serial";

export function sendCommand(cmd: string) {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout:\n${stdout}`);
    });

}


export function sendByte(byte: number) {
    const buf = Buffer.from([byte]);  // raw single byte
    writeFileSync(SERIAL_PATH, buf);
}

export function char(c: string) {
    return c.charCodeAt(0)
}

export const KEY = {
    LEFT_CTRL: 0x80,
    LEFT_SHIFT: 0x81,
    LEFT_ALT: 0x82,
    LEFT_GUI: 0x83,
    RIGHT_CTRL: 0x84,
    RIGHT_SHIFT: 0x85,
    RIGHT_ALT: 0x86,
    RIGHT_GUI: 0x87,

    UP_ARROW: 0xDA,
    DOWN_ARROW: 0xD9,
    LEFT_ARROW: 0xD8,
    RIGHT_ARROW: 0xD7,
    MENU: 0xFE,
    SPACE: 0x20,
    BACKSPACE: 0xB2,
    TAB: 0xB3,
    RETURN: 0xB0,
    ESC: 0xB1,
    INSERT: 0xD1,
    DELETE: 0xD4,
    PAGE_UP: 0xD3,
    PAGE_DOWN: 0xD6,
    HOME: 0xD2,
    END: 0xD5,
    NUM_LOCK: 0xDB,
    CAPS_LOCK: 0xC1,
    F1: 0xC2,
    F2: 0xC3,
    F3: 0xC4,
    F4: 0xC5,
    F5: 0xC6,
    F6: 0xC7,
    F7: 0xC8,
    F8: 0xC9,
    F9: 0xCA,
    F10: 0xCB,
    F11: 0xCC,
    F12: 0xCD,
    F13: 0xF0,
    F14: 0xF1,
    F15: 0xF2,
    F16: 0xF3,
    F17: 0xF4,
    F18: 0xF5,
    F19: 0xF6,
    F20: 0xF7,
    F21: 0xF8,
    F22: 0xF9,
    F23: 0xFA,
    F24: 0xFB,
    PRINT_SCREEN: 0xCE,
    SCROLL_LOCK: 0xCF,
    PAUSE: 0xD0
};

// export function echo(arg: string) {
//     const cmd = `echo "${arg}" > /dev/ttyACM0`;

//     // Execute the command
//     exec(cmd, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error executing command: ${error.message}`);
//             return;
//         }
//         if (stderr) {
//             console.error(`stderr: ${stderr}`);
//             return;
//         }
//         console.log(`stdout:\n${stdout}`);
//     });
// }