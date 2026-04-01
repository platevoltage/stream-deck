
import sharp from 'sharp';
import { openStreamDeck, listStreamDecks } from "@elgato-stream-deck/node";
import fs from "fs"
import { fileURLToPath } from 'url';
/* @ts-ignore */
import gifFrames from "gif-frames";
import { crc32 } from 'crc';
import path from "path";
import { sendButtonColors } from './buttons';

const ROTATE = 180;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ImageFrame = {
  buffer: Buffer;
  delay?: number;
};

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function setup(onKeyPress: (key: number) => void) {

  // List the connected streamdecks
  const devices = await listStreamDecks();
  if (devices.length === 0) throw new Error("No streamdecks connected!");

  // You must provide the devicePath yourself as the first argument to the constructor.
  // For example: const myStreamDeck = new StreamDeck('\\\\?\\hid#vid_05f3&pid_0405&mi_00#7&56cf813&0&0000#{4d1e55b2-f16f-11cf-88cb-001111000030}')
  // On linux the equivalent would be: const myStreamDeck = new StreamDeck('0001:0021:00')
  const deck = await openStreamDeck(devices[0].path);
  const pressedKeys = new Set<number>();

  deck.on("error", (error) => {
    console.error(error);
    throw (error);
  });

  deck.on("up", (key) => {
    pressedKeys.delete(key.index);
  });

  deck.on("down", (key) => {
    if (pressedKeys.has(key.index)) return; // already pressed, ignore
    pressedKeys.add(key.index);
    onKeyPress(key.index);
  });


  return { deck, pressedKeys };
}

export async function solidColorIcon(color: [number, number, number], label: string = ""): Promise<ImageFrame[]> {
  const textSvg = `
    <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <style>
        .label {
          fill: white;
          font-size: 14px;
          font-weight: 700;
          font-family: sans-serif;
          dominant-baseline: middle;
          text-anchor: middle;
        }
      </style>
      <rect width="100%" height="100%" fill="#00000000" />
      <text x="50%" y="90%" class="label">${label}</text>
    </svg>
  `;


  const text = await sharp(Buffer.from(textSvg))
    .resize(80, 80)
    .rotate(ROTATE)
    .toBuffer();


  const combined = await sharp({
    create: {
      width: 80,
      height: 80,
      channels: 4,
      background: { r: color[0], g: color[1], b: color[2], alpha: 1 }
    }
  })
    .composite([
      { input: text, top: 0, left: 0 }
    ])
    .raw()
    .toBuffer();


  return [{ buffer: combined }];
}


export async function stillPanel(iconPath: string, sizePercentage: number = 100): Promise<Buffer> {
  const _height = 160 * (sizePercentage / 100);
  const _width = 240 * (sizePercentage / 100);
  const icon = await sharp(iconPath)
    .resize(_height, _width, { fit: 'contain' }) // upper part for the icon
    .removeAlpha() // <-- strips alpha
    .raw()
    .toBuffer();


  const combined = await sharp({
    create: {
      width: 240,
      height: 160,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  }).composite([
    {
      input: icon,
      top: 0,
      left: 0,
      raw: {
        width: _width,
        height: _height,
        channels: 4,
      }
    }])

    .raw()
    .toBuffer();

  return combined
}

export async function stillIcon(iconPath: string, label: string = "", sizePercentage: number = 100): Promise<ImageFrame[]> {
  const crc = await getFileCRC32(iconPath);
  // console.log(path.basename(iconPath), 'CRC32:', crc);

  try {
    const file = await loadImagesFromFile(path.join(__dirname, "../", "cache", crc + ".json"));
    if (file) {
      // console.log("found");
      return file;
    }
  } catch (e) {
    console.log("not found");
  }

  const width = 80 * (sizePercentage / 100);
  const icon = await sharp(iconPath)
    .resize(width, width, { fit: 'contain' }) // upper part for the icon
    .rotate(ROTATE)
    .toBuffer();

  const textSvg = `
    <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <style>
        .label {
          fill: white;
          font-size: 14px;
          font-weight: 700;
          font-family: sans-serif;
          dominant-baseline: middle;
          text-anchor: middle;
        }
      </style>
      <rect width="100%" height="100%" fill="#00000000" />
      <text x="50%" y="90%" class="label">${label}</text>
    </svg>
  `;


  const text = await sharp(Buffer.from(textSvg))
    .resize(80, 80)
    .rotate(ROTATE)
    .toBuffer();

  const combined = await sharp({
    create: {
      width: 80,
      height: 80,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([
      {
        input: icon,
        top: Math.round((80 - width) / (label.length > 0 ? 6 : 2)),
        left: Math.round((80 - width) / 2)
      },
      { input: text, top: 0, left: 0 }
    ])
    .raw()
    .toBuffer();

  saveImagesToFile([{ buffer: combined }], path.join(__dirname, "../", "cache", crc + ".json"));

  return [{ buffer: combined }];
}

export async function animatedIcon(gifPath: string, label: string = "", sizePercentage: number = 100, cumulative = true) {

  const crc = await getFileCRC32(gifPath);
  const baseName = path.basename(gifPath);
  console.log(baseName, 'CRC32:', crc);

  try {
    const file = await loadImagesFromFile(path.join(__dirname, "../", "cache", crc + ".json"));
    if (file) {
      // console.log("found");
      return file;
    }
  } catch (e) {
    console.log("not found");
  }


  const width = 80 * (sizePercentage / 100);

  const frameData = await gifFrames({ url: gifPath, frames: "all", outputType: "png", cumulative });




  const buffers = await Promise.all(
    frameData.map(async (frame: any) => {
      const chunks: Buffer[] = [];

      return new Promise<ImageFrame>((resolve, reject) => {
        frame.getImage()
          .on("data", (chunk: any) => chunks.push(chunk))
          .on("end", () => {
            const pngBuffer = Buffer.concat(chunks);
            resolve({ buffer: pngBuffer, delay: frame.frameInfo.delay }); // This is a valid PNG now
          })
          .on("error", reject);
      });
    })
  );

  const textSvg = `
    <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <style>
        .label {
          fill: white;
          font-size: 14px;
          font-weight: 700;
          font-family: sans-serif;
          dominant-baseline: middle;
          text-anchor: middle;
        }
      </style>
      <rect width="100%" height="100%" fill="#00000000" />
      <text x="50%" y="90%" class="label">${label}</text>
    </svg>
  `;

  const text = await sharp(Buffer.from(textSvg))
    .resize(80, 80)
    .rotate(ROTATE)
    .toBuffer();

  const images: { buffer: Buffer<ArrayBufferLike>, delay: number }[] = [];

  for (let _buffer of buffers) {
    const image = await sharp(Buffer.from(_buffer.buffer))
      .resize(width, width, { fit: 'contain' })
      .rotate(ROTATE)
      // .removeAlpha()         // strip alpha if present
      .toBuffer()
    const combined = await sharp({
      create: {
        width: 80,
        height: 80,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
      .composite([
        {
          input: image,
          top: Math.round((80 - width) / (label.length > 0 ? 2 : 1)),
          left: Math.round((80 - width) / 2)
        },
        { input: text, top: 0, left: 0 }
      ])
      .raw()
      .toBuffer();
    images.push({ buffer: combined, delay: _buffer.delay });
  }

  saveImagesToFile(images, path.join(__dirname, "../", "cache", crc + ".json"));

  return images;
}

export async function pageChange(deck: any, images: any[], currentPage: number) {
  const colors = [[255, 0, 0], [0, 0, 255]];
  const flip = currentPage % 2 === 1 ? 1 : 0;
  for (let i = 0; i < 6; i++) {
    const color = i < 3 ? colors[0 ^ flip] : colors[1 ^ flip];
    await deck.fillKeyColor(i, ...color);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  for (let i = 0; i < 6; i++) {
    const color = i < 3 ? colors[0 ^ flip] : colors[1 ^ flip];
    await deck.fillKeyColor(i, ...color);
    await delay(20);
    await deck.fillKeyBuffer(i, images[currentPage][i][0].buffer, { format: 'rgba' });
    await delay(20);
  }
}

export async function loadingAnimation(deck: any) {
  const colors = [[255, 0, 0], [0, 0, 255], [255, 255, 0]];
  for (const color of colors) {
    for (let i = 0; i < 6; i++) {
      await deck.fillKeyColor(i, ...color);
      await delay(100);
    }
  }

  for (const color of colors) {
    for (let i = 0; i < 3; i++) {
      await deck.fillKeyColor(i, ...color);
      await delay(100);
      await deck.fillKeyColor(i + 3, ...color);
      await delay(100);
    }
  }
}


export async function getFileCRC32(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    let crc = 0;

    stream.on('data', (chunk) => {
      crc = crc32(chunk, crc);
    });

    stream.on('end', () => {
      // Convert to 8-digit hex string
      resolve(crc.toString(16).padStart(8, '0'));
    });

    stream.on('error', reject);
  });
}

async function saveImagesToFile(images: ImageFrame[], filePath: string) {
  const dir = path.join(process.cwd(), 'cache');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const encoded = images.map(img => ({
    delay: img.delay,
    buffer: img.buffer.toString('base64'),
  }));
  await fs.promises.writeFile(filePath, JSON.stringify(encoded));
}

async function loadImagesFromFile(filePath: string): Promise<ImageFrame[]> {
  const json = await fs.promises.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(json) as { delay: number; buffer: string }[];
  return parsed.map(p => ({
    delay: p.delay,
    buffer: Buffer.from(p.buffer, 'base64'),
  }));
}

async function demo(port: any) {
  // const colors = ["FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000", "FF0000"];
  const colors = ["000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000", "000000"];
  const player1Top = ["FF0000", "FF0000", "FF0000", "FF0000"];
  const player1Bottom = ["FF0000", "FF0000", "FF0000", "FF0000"];
  const p1StartSelect = ["FFFFFF", "FFFFFF"];
  const player2Top = ["0000FF", "0000FF", "0000FF", "0000FF"];
  const player2Bottom = ["0000FF", "0000FF", "0000FF", "0000FF"];
  const p2StartSelect = ["FFFFFF", "FFFFFF"];
  await delay(1000);
  sendButtonColors(port, colors);
  await delay(100);
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
      await delay(500);
    }
    await delay(2000);
    swap = !swap;
  }

}