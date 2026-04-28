import { SerialPort } from "serialport"

export const SERIAL_PATH = "/dev/ttyACM0";
export const SERIAL_BAUD = 115200;


export function openSerialPort(): Promise<SerialPort> {
    return new Promise((resolve, reject) => {
        const port = new SerialPort({
            path: SERIAL_PATH,
            baudRate: SERIAL_BAUD,
        })

        port.on('open', () => {
            console.log('Serial port opened')
            resolve(port);
        })

        port.on('data', (data) => {
            console.log('Received:', data.toString())
        })

        port.on('error', (err) => {
            console.error('Error:', err.message)
            reject(err);
        })

    });
}

