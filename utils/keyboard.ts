import { spawn } from 'child_process';

export async function sendKeypress(): Promise<void> {
    return new Promise((resolve, reject) => {
        const evemu = spawn('sudo', ['evemu-play', '/dev/input/virtual-kbd']);

        const inputEvents = `
E: 0.000000 0004 0004 458792
E: 0.000000 0001 001c 0001
E: 0.000000 0000 0000 0000
E: 0.100000 0001 001c 0000
E: 0.100000 0000 0000 0000
`;

        evemu.stdin.write(inputEvents);
        evemu.stdin.end();

        evemu.stdout.on('data', (data: Buffer) => {
            console.log(`stdout: ${data.toString()}`);
        });

        evemu.stderr.on('data', (data: Buffer) => {
            console.error(`stderr: ${data.toString()}`);
        });

        evemu.on('close', (code: number) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`evemu-play exited with code ${code}`));
            }
        });

        evemu.on('error', (err) => {
            reject(err);
        });
    });
}
