
import sharp from 'sharp';
import { openStreamDeck, listStreamDecks, StreamDeck } from "@elgato-stream-deck/node";
import fs from "fs"
import { fileURLToPath } from 'url';
/* @ts-ignore */
import gifFrames from "gif-frames";
import { crc32 } from 'crc';
import path from "path";
import { sendButtonColors } from './buttons.ts';
import { ImageFrame } from './imageFrames.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// export type ImageFrame = {
//   buffer: Buffer;
//   delay?: number;
// };

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function streamDeckSetup(onKeyPress: (key: number) => void) {

  const devices = await listStreamDecks();
  if (devices.length === 0) throw new Error("No streamdecks connected!");

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
    if (pressedKeys.has(key.index)) return;
    pressedKeys.add(key.index);
    onKeyPress(key.index);
  });


  return { deck, pressedKeys };
}

type RGBarray = [number, number, number];

function hexToRgb(hexColor: string): RGBarray {
  // Remove '#' if present and convert to lowercase for consistency
  const cleanHex = hexColor.replace('#', '').toLowerCase();

  // Validate input length (should be 3 or 6 chars)
  if (cleanHex.length !== 3 && cleanHex.length !== 6) {
    throw new Error('Invalid hex color format. Expected #RRGGBB or #RGB');
  }

  // Expand shorthand notation (e.g., #abc becomes #aabbcc)
  const expandedHex = cleanHex.length === 3
    ? `${cleanHex[0]}${cleanHex[0]}${cleanHex[1]}${cleanHex[1]}${cleanHex[2]}${cleanHex[2]}`
    : cleanHex;

  // Convert each pair of hex digits to decimal
  return [
    parseInt(expandedHex.substring(0, 2), 16),
    parseInt(expandedHex.substring(2, 4), 16),
    parseInt(expandedHex.substring(4, 6), 16)
  ];
}

export async function pageChange(deck: StreamDeck | null, images: any[], currentPage: number) {
  if (!deck) throw new Error("No Deck!");
  const colors = ["#FF0000", "#0000FF"];
  const flip = currentPage % 2 === 1 ? 1 : 0;
  for (let i = 0; i < 6; i++) {
    const color = i < 3 ? colors[0 ^ flip] : colors[1 ^ flip];
    await deck.fillKeyColor(i, ...hexToRgb(color));
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  for (let i = 0; i < 6; i++) {
    const color = i < 3 ? colors[0 ^ flip] : colors[1 ^ flip];
    await deck.fillKeyColor(i, ...hexToRgb(color));
    await delay(20);
    await deck.fillKeyBuffer(i, images[currentPage][i][0].buffer, { format: 'rgba' });
    await delay(20);
  }
}

export async function loadingAnimation(deck: StreamDeck | null) {
  if (!deck) throw new Error("No Deck!");
  const colors = ["#FF0000", "#0000FF"];

  for (const color of colors) {
    for (let i = 0; i < 6; i++) {
      await deck.fillKeyColor(i, ...hexToRgb(color));
      await delay(100);
    }
  }

  for (const color of colors) {
    for (let i = 0; i < 3; i++) {
      await deck.fillKeyColor(i, ...hexToRgb(color));
      await delay(100);
      await deck.fillKeyColor(i + 3, ...hexToRgb(color));
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

export async function saveImagesToFile(images: ImageFrame[], filePath: string) {
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

export async function loadImagesFromFile(filePath: string): Promise<ImageFrame[]> {
  const json = await fs.promises.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(json) as { delay: number; buffer: string }[];
  return parsed.map(p => ({
    delay: p.delay,
    buffer: Buffer.from(p.buffer, 'base64'),
  }));
}



async function demo(port: any) {
  // const colors = ["#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000"];
  const colors = ["#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"];
  const player1Top = ["#FF0000", "#FF0000", "#FF0000", "#FF0000"];
  const player1Bottom = ["#FF0000", "#FF0000", "#FF0000", "#FF0000"];
  const p1StartSelect = ["#FFFFFF", "#FFFFFF"];
  const player2Top = ["#0000FF", "#0000FF", "#0000FF", "#0000FF"];
  const player2Bottom = ["#0000FF", "#0000FF", "#0000FF", "#0000FF"];
  const p2StartSelect = ["#FFFFFF", "#FFFFFF"];
  await delay(1000);
  sendButtonColors(port, colors);
  await delay(100);
  // while (1) {
  // for (let i = 0; i < 48; i++) {
  //     if (i >= 0 && i < 16)
  //         colors.unshift("#0000FF");
  //     if (i >= 16 && i < 32)
  //         colors.unshift("#FFFF00");
  //     if (i >= 32 && i < 48)
  //         colors.unshift("#FF0000");
  //     colors.pop();

  //     const finalColors = [...colors];
  //     finalColors.splice(8, 0, "#FFFFFF", "#FFFFFF");
  //     finalColors.splice(18, 0, "#FFFFFF", "#FFFFFF");
  //     sendButtonColors(port, finalColors);
  //     console.log(finalColors);
  //     await new Promise(resolve => setTimeout(resolve, 20));
  // }
  // }
  let swap = false;
  while (1) {
    const color1 = swap ? ["#FF00F0", "#FF0000", "#FF0000", "#FF0000", "#FF00F0", "#FF0000", "#FF0000", "#FF0000"] : ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00"];
    const color2 = swap ? ["#0000FF", "#0000FF", "#0000FF", "#0000FF", "#0000FF", "#0000FF", "#0000FF", "#0000FF"] : ["#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00", "#FFFF00"];
    for (let i = -2; i < 24; i++) {

      player1Top[i] = color1[i];
      player1Bottom[i - 1] = color1[i - 1];
      player2Top[i - 14] = color2[i - 14];
      player2Bottom[i - 15] = color2[i - 15];

      const _player1Top = [...player1Top];
      const _player1Bottom = [...player1Bottom];
      const _player2Top = [...player2Top];
      const _player2Bottom = [...player2Bottom];
      _player1Top[i + 1] = "#FFFFFF";
      _player1Bottom[i] = "#FFFFFF";
      _player1Top[i + 2] = "#FFFFFF";
      _player1Bottom[i + 1] = "#FFFFFF";

      _player2Top[i - 13] = "#FFFFFF";
      _player2Bottom[i - 14] = "#FFFFFF";
      _player2Top[i - 12] = "#FFFFFF";
      _player2Bottom[i - 13] = "#FFFFFF";

      const finalColors = [..._player1Top.slice(0, 4), ..._player1Bottom.slice(0, 4), ...p1StartSelect, ..._player2Top.slice(0, 4), ..._player2Bottom.slice(0, 4), ...p2StartSelect];
      sendButtonColors(port, finalColors);
      await delay(500);
    }
    await delay(2000);
    swap = !swap;
  }

}

