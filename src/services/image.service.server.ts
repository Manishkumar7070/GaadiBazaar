import sharp from 'sharp';
import path from 'path';

export const imageProcessor = {
  async optimize(buffer: Buffer): Promise<{ data: Buffer; info: sharp.OutputInfo }> {
    return sharp(buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
  }
};
