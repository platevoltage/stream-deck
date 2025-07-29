
import sharp from 'sharp';
import { openStreamDeck, listStreamDecks } from "@elgato-stream-deck/node";
import fs from "fs"
import gifFrames from "gif-frames";

const ROTATE = 0;


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

export async function stillIcon(iconPath: string, label: string = "", sizePercentage: number = 100): Promise<Buffer[]> {
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


  return [combined];
}

export async function animatedIcon(gifPath: string, label: string = "", sizePercentage: number = 100, cumulative = true) {
  const width = 80 * (sizePercentage / 100);

  const frameData = await gifFrames({ url: gifPath, frames: "all", outputType: "png", cumulative });




  const buffers = await Promise.all(
    frameData.map(async (frame) => {
      const chunks: Buffer[] = [];

      return new Promise<{ buffer: Buffer, delay: number }>((resolve, reject) => {
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
          top: Math.round((80 - width) / (label.length > 0 ? 3 : 2)),
          left: Math.round((80 - width) / 2)
        },
        { input: text, top: 0, left: 0 }
      ])
      .raw()
      .toBuffer();
    images.push({ buffer: combined, delay: _buffer.delay });
  }

  return images;
}