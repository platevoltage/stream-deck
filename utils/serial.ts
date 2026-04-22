import { SerialPort } from "serialport"


export function openSerialPort(path?: string, baudRate?: number): Promise<SerialPort> {
    return new Promise((resolve, reject) => {
        const port = new SerialPort({
            path: path || '/dev/ttyACM0',
            baudRate: baudRate || 115200,
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

