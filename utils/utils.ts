
import sharp from 'sharp';
import { openStreamDeck, listStreamDecks } from "@elgato-stream-deck/node";
import fs from "fs"
import { fileURLToPath } from 'url';
import gifFrames from "gif-frames";
import { crc32 } from 'crc';
import path from "path";

const ROTATE = 0;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ImageFrame = {
  buffer: Buffer;
  delay?: number;
};

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


export async function stillPanel(iconPath: string): Promise<Buffer> {

  const icon = await sharp(iconPath)
    .resize(240, 160, { fit: 'contain' }) // upper part for the icon
    .removeAlpha() // <-- strips alpha
    .raw()
    .toBuffer();

  return icon
}

export async function stillIcon(iconPath: string, label: string = "", sizePercentage: number = 100): Promise<ImageFrame[]> {
  const crc = await getFileCRC32(iconPath);
  console.log(path.basename(iconPath), 'CRC32:', crc);

  try {
    const file = await loadImagesFromFile(path.join(__dirname, "../", "cache", crc + ".json"));
    if (file) {
      console.log("found");
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
          font-family: sans-serif;
          font-weight: 700;
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
        top: Math.round((80 - width) / (label.length > 0 ? 3 : 2)),
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
      console.log("found");
      return file;
    }
  } catch (e) {
    console.log("not found");
  }


  const width = 80 * (sizePercentage / 100);

  const frameData = await gifFrames({ url: gifPath, frames: "all", outputType: "png", cumulative });




  const buffers = await Promise.all(
    frameData.map(async (frame) => {
      const chunks: Buffer[] = [];

      return new Promise<ImageFrame>((resolve, reject) => {
        frame.getImage()
          .on("data", chunk => chunks.push(chunk))
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
          top: Math.round((80 - width) / (label.length > 0 ? 4 : 2)),
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
  await deck.fillKeyColor(0, 255, 0, 0);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(1, 255, 255, 0);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(2, 255, 0, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(3, 0, 255, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(4, 0, 0, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(5, 0, 255, 0);
  await new Promise(resolve => setTimeout(resolve, 50));
  // await deck.fillKeyColor(0, 0, 0, 0);
  await deck.fillKeyBuffer(0, images[currentPage][0][0].buffer, { format: 'rgba' });
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyBuffer(1, images[currentPage][1][0].buffer, { format: 'rgba' });
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyBuffer(2, images[currentPage][2][0].buffer, { format: 'rgba' });
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyBuffer(3, images[currentPage][3][0].buffer, { format: 'rgba' });
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyBuffer(4, images[currentPage][4][0].buffer, { format: 'rgba' });
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyBuffer(5, images[currentPage][5][0].buffer, { format: 'rgba' });
  await new Promise(resolve => setTimeout(resolve, 50));
}

export async function loadingAnimation(deck: any) {
  await deck.fillKeyColor(0, 255, 0, 0);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(1, 255, 0, 0);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(2, 255, 0, 0);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(3, 255, 0, 0);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(4, 255, 0, 0);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(5, 255, 0, 0);
  await new Promise(resolve => setTimeout(resolve, 50));

  await deck.fillKeyColor(0, 0, 0, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(1, 0, 0, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(2, 0, 0, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(3, 0, 0, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(4, 0, 0, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
  await deck.fillKeyColor(5, 0, 0, 255);
  await new Promise(resolve => setTimeout(resolve, 50));
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