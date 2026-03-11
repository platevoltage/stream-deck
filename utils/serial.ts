import { SerialPort } from "serialport"


export function openSerialPort(path?: string, baudRate?: number) {

    const port = new SerialPort({
        path: path || '/dev/ttyUSB0',
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

export function sendButtonColors(port: SerialPort, colors: number[]) {
    port.write("");
}