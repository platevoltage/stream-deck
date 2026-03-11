import { SerialPort } from "serialport"


export function openSerialPort(path?: string, baudRate?: number) {

    const port = new SerialPort({
        path: path || '/dev/ttyACM0',
        baudRate: baudRate || 115200,
    })

    port.on('open', () => {
        console.log('Serial port opened')
    })

    port.on('data', (data) => {
        console.log('Received:', data.toString())
    })

    port.on('error', (err) => {
        console.error('Error:', err.message)
    })

    return port;
}

export function sendButtonColors(port: SerialPort, colors: string[]) {
    console.log(colors);
    // port.write(`{"button1":$"110000","button2":"110000","button3":"110000","button4":"110000","button5":"FF0000","button6":"00FF00","button7":"110000","button8":"110000","button9":"111111","button10":"111111","button11":"000011","button12":"000011","button13":"000011","button14":"000011","button15":"FF0000","button16":"00FF00","button17":"000011","button18":"000011","button19":"111111","button20":"111111"}`);
    let json: { [key: string]: string } = {};
    colors.forEach((color, i) => {
        json[`button${i + 1}`] = color;
    });
    console.log(json);
    port.write(JSON.stringify(json));
}