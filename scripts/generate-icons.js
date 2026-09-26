import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const iconSvgPath = path.join(publicDir, 'icon.svg');
const maskableSvgPath = path.join(publicDir, 'icon-maskable.svg');

async function generate() {
  const iconSvg = fs.readFileSync(iconSvgPath);
  const maskableSvg = fs.readFileSync(maskableSvgPath);

  // 1. 192x192 PNG
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 2. 512x512 PNG
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. 512x512 Maskable PNG
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 4. Apple Touch Icon 180x180 PNG
  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 5. Favicon 32x32 PNG
  await sharp(iconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Generated favicon-32x32.png');

  // Copy icon.svg to favicon.svg for modern browsers
  fs.copyFileSync(iconSvgPath, path.join(publicDir, 'favicon.svg'));
  console.log('Copied favicon.svg');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
