import { SerialPort } from "serialport"


async function demo(port: any) {
    // const colors = ["FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000"];
    const colors = ["000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000"];
    const player1Top = ["FF0000", "FF0000", "FF0000", "FF0000"];
    const player1Bottom = ["FF0000", "FF0000", "FF0000", "FF0000"];
    const p1StartSelect = ["FFFFFF", "FFFFFF"];
    const player2Top = ["0000FF", "0000FF", "0000FF", "0000FF"];
    const player2Bottom = ["0000FF", "0000FF", "0000FF", "0000FF"];
    const p2StartSelect = ["FFFFFF", "FFFFFF"];
    await new Promise(resolve => setTimeout(resolve, 1000));
    sendButtonColors(port, colors);
    await new Promise(resolve => setTimeout(resolve, 100));
    // while (1) {
    // for (let i = 0; i < 48; i++) {
    //     if (i >= 0 && i < 16)
    //         colors.unshift("0000FF");
    //     if (i >= 16 && i < 32)
    //         colors.unshift("FFFF00");
    //     if (i >= 32 && i < 48)
    //         colors.unshift("FF0000");
    //     colors.pop();

    //     const finalColors = [...colors];
    //     finalColors.splice(8, 0, "FFFFFF", "FFFFFF");
    //     finalColors.splice(18, 0, "FFFFFF", "FFFFFF");
    //     sendButtonColors(port, finalColors);
    //     console.log(finalColors);
    //     await new Promise(resolve => setTimeout(resolve, 20));
    // }
    // }
    let swap = false;
    while (1) {
        const color1 = swap ? ["FF00F0", "FF0000", "FF0000", "FF0000", "FF00F0", "FF0000", "FF0000", "FF0000"] : ["FFFF00", "FFFF00", "FFFF00", "FFFF00", "FFFF00", "FFFF00", "FFFF00", "FFFF00"];
        const color2 = swap ? ["0000FF", "0000FF", "0000FF", "0000FF", "0000FF", "0000FF", "0000FF", "0000FF"] : ["FFFF00", "FFFF00", "FFFF00", "FFFF00", "FFFF00", "FFFF00", "FFFF00", "FFFF00"];
        for (let i = -2; i < 24; i++) {

            player1Top[i] = color1[i];
            player1Bottom[i - 1] = color1[i - 1];
            player2Top[i - 14] = color2[i - 14];
            player2Bottom[i - 15] = color2[i - 15];

            const _player1Top = [...player1Top];
            const _player1Bottom = [...player1Bottom];
            const _player2Top = [...player2Top];
            const _player2Bottom = [...player2Bottom];
            _player1Top[i + 1] = "FFFFFF";
            _player1Bottom[i] = "FFFFFF";
            _player1Top[i + 2] = "FFFFFF";
            _player1Bottom[i + 1] = "FFFFFF";

            _player2Top[i - 13] = "FFFFFF";
            _player2Bottom[i - 14] = "FFFFFF";
            _player2Top[i - 12] = "FFFFFF";
            _player2Bottom[i - 13] = "FFFFFF";

            const finalColors = [..._player1Top.slice(0, 4), ..._player1Bottom.slice(0, 4), ...p1StartSelect, ..._player2Top.slice(0, 4), ..._player2Bottom.slice(0, 4), ...p2StartSelect];
            sendButtonColors(port, finalColors);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        swap = !swap;
    }

}

export function openSerialPort(path?: string, baudRate?: number) {

    const port = new SerialPort({
        path: path || '/dev/ttyACM0',
        baudRate: baudRate || 115200,
    })

    port.on('open', () => {
        console.log('Serial port opened')
        // demo(port);
    })

    port.on('data', (data) => {
        console.log('Received:', data.toString())
    })

    port.on('error', (err) => {
        console.error('Error:', err.message)
    })

    return port;
}


let runId = 0;
export async function sendButtonColors(port: SerialPort, colors: string[]) {

    if (colors.length <= 10) {
        colors = [...colors, ...colors];
    }
    colors.splice(20);
    console.log(colors);

    const player1Top = ["FF0000", "FF0000", "FF0000", "FF0000"];
    const player1Bottom = ["FF0000", "FF0000", "FF0000", "FF0000"];
    const p1StartSelect = colors.slice(8, 10);
    const player2Top = ["0000FF", "0000FF", "0000FF", "0000FF"];
    const player2Bottom = ["0000FF", "0000FF", "0000FF", "0000FF"];
    const p2StartSelect = colors.slice(18, 20);
    // const p2StartSelect = ["FFFFFF", "FFFFFF"];
    const myRun = ++runId;

    for (let i = -2; i < 24; i++) {

        player1Top[i] = colors.slice(0, 4)[i];
        player1Bottom[i - 1] = colors.slice(4, 8)[i - 1];
        player2Top[i - 14] = colors.slice(10, 14)[i - 14];
        player2Bottom[i - 15] = colors.slice(14, 18)[i - 15];

        const _player1Top = [...player1Top];
        const _player1Bottom = [...player1Bottom];
        const _player2Top = [...player2Top];
        const _player2Bottom = [...player2Bottom];
        _player1Top[i + 1] = "FFFFFF";
        _player1Bottom[i] = "FFFFFF";
        _player1Top[i + 2] = "FFFFFF";
        _player1Bottom[i + 1] = "FFFFFF";

        _player2Top[i - 13] = "FFFFFF";
        _player2Bottom[i - 14] = "FFFFFF";
        _player2Top[i - 12] = "FFFFFF";
        _player2Bottom[i - 13] = "FFFFFF";

        const finalColors = [..._player1Top.slice(0, 4), ..._player1Bottom.slice(0, 4), ...p1StartSelect, ..._player2Top.slice(0, 4), ..._player2Bottom.slice(0, 4), ...p2StartSelect];
        // sendButtonColors(port, finalColors);
        let json = { "buttons": finalColors };
        port.write(JSON.stringify(json));
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (myRun !== runId) return;
    }

}