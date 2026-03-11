import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import fs from 'fs';
import { openSerialPort } from './serial.ts';
// import privateKey from '../cert/server.key';
// import certificate from '../cert/server.crt';
export function startServer() {
    const port = openSerialPort();
    const app = express();
    app.use(express.json());
    app.use(cors());

    // Root route response with a cartoon-styled HTML
    app.get('/', (req: express.Request, res: express.Response) => {
        const currentTime = new Date().toLocaleString();
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Goodbye World!</title>
    <style>
        body {
            font-family: 'Comic Sans MS', cursive, sans-serif;
            background-color: #FFF5DC;
            color: #703B0D;
            margin: 0;
            padding: 0;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <h1>Goodbye World!</h1>
    <p>Current Time: ${currentTime}</p>
</body>
</html>
`;
        res.status(200).send(html);
    });

    // JSON response with more detailed output
    app.get('/json', (req: express.Request, res: express.Response) => {
        const currentTime = new Date().toLocaleString();
        const data: { message: string; time: string } = {
            message: 'Hello World!',
            time: `Current Time: ${currentTime}`,
        };
        res.status(200).json(data);
    });

    // YAML response with more detailed output
    app.get('/yaml', (req: express.Request, res: express.Response) => {
        const currentTime = new Date().toLocaleString();
        const data: string = `message: Hello World!
time: ${currentTime}`;
        res.status(200).set('Content-Type', 'application/yaml').send(data);
    });

    app.post('/button-lights', (req: express.Request, res: express.Response) => {
        const body = req.body;
        console.log(body);

        if ("buttons" in body) {
            const buttonColors: string[] = body.buttons;
            const buttonColorsInt = buttonColors.map(color => parseInt("0x" + color), 16);
            console.log(buttonColorsInt.map(color => color.toString(16)));

        } else {
            console.log("NOPE")
        }
        res.status(200).json({
            status: "success"
        });
    });

    // Image serving with more detailed output
    // const __filename = path.resolve(import.meta.url);
    // const imagePath = path.join(__dirname, 'images', 'mario.jpg');
    // app.get('/mario-image', (req: express.Request, res: express.Response) => {
    //     fs.readFile(imagePath, (err, data) => {
    //         if (err) {
    //             console.error(`Error reading ${imagePath}:`, err);
    //             res.status(500).send('Error serving image.');
    //         } else {
    //             res.status(200).send(data);
    //         }
    //     });
    // });

    // const options = {
    //     key: privateKey,
    //     cert: certificate,
    // };


    const server = http.createServer(app);
    server.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.PORT || 3000} (HTTPS)`);
    });
}
