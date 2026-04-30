import sharp from 'sharp';
import { getFileCRC32, loadImagesFromFile, saveImagesToFile } from './utils.ts';
import path from "path";
/* @ts-ignore */
import gifFrames from "gif-frames";

const ROTATE = 180;

export type ImageFrame = {
    buffer: Buffer;
    delay?: number;
};

export async function solidColorIcon(color: string, label: string = ""): Promise<ImageFrame[]> {
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
      <rect width="100%" height="100%" fill="${color}" />
      <text x="50%" y="10%" class="label">${label}</text>
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
            channels: 3,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite([
            { input: text, top: 0, left: 0 }
        ])
        .raw()
        .toBuffer();


    return [{ buffer: combined }];
}

export async function customIcon(color: string, label: string = ""): Promise<ImageFrame[]> {
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
      <rect width="100%" height="100%" fill="${color}" />
      <rect width="50%" height="50%" fill="rgb(0, 0, 140)" />
      <text x="50%" y="10%" class="label">${label}</text>
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
            channels: 3,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
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

export async function stillIcon(iconName: string, label: string = "", sizePercentage: number = 100): Promise<ImageFrame[]> {
    const iconPath = path.resolve(path.dirname("../"), "images", iconName)

    const crc = await getFileCRC32(iconPath);
    // console.log(path.basename(iconPath), 'CRC32:', crc);

    try {
        const file = await loadImagesFromFile(path.join(path.dirname("../"), "cache", crc + ".json"));
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
      <text x="50%" y="10%" class="label">${label}</text>
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
                // top: Math.round((80 - width) / (label.length > 0 ? 6 : 2)),
                top: 0,
                left: Math.round((80 - width) / 2)
            },
            { input: text, top: 0, left: 0 }
        ])
        .raw()
        .toBuffer();

    saveImagesToFile([{ buffer: combined }], path.join(__dirname, "../", "cache", crc + ".json"));

    return [{ buffer: combined }];
}

export async function animatedIcon(gifName: string, label: string = "", sizePercentage: number = 100, cumulative = true) {
    const gifPath = path.resolve(path.dirname("../"), "images", gifName);
    const crc = await getFileCRC32(gifPath);
    const baseName = path.basename(gifPath);
    console.log(baseName, 'CRC32:', crc);

    try {
        const file = await loadImagesFromFile(path.join(path.dirname("../"), "cache", crc + ".json"));
        if (file) {
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
      <text x="50%" y="10%" class="label">${label}</text>
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
                    // top: Math.round((80 - width) / (label.length > 0 ? 2 : 1)),
                    top: 0,
                    left: Math.round((80 - width) / 2)
                },
                { input: text, top: 0, left: 0 }
            ])
            .raw()
            .toBuffer();
        images.push({ buffer: combined, delay: _buffer.delay });
    }

    saveImagesToFile(images, path.join(path.dirname("../"), "cache", crc + ".json"));

    return images;
}
