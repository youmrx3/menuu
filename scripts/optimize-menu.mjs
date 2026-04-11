import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const inputDir = path.join(rootDir, 'public', 'menu');
const outputDir = path.join(rootDir, 'public', 'menu-lite');

const IMAGE_REGEX = /\.(jpe?g|png|webp)$/i;
const LOGO_REGEX = /^logo\./i;

async function ensureOutputDirectory() {
  await fs.mkdir(outputDir, { recursive: true });
}

function bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

async function optimizeFile(fileName) {
  const sourcePath = path.join(inputDir, fileName);
  const parsed = path.parse(fileName);
  const outputName = `${parsed.name}.webp`;
  const outputPath = path.join(outputDir, outputName);

  const sourceStats = await fs.stat(sourcePath);

  await sharp(sourcePath)
    .rotate()
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 62, effort: 4 })
    .toFile(outputPath);

  const outputStats = await fs.stat(outputPath);

  return {
    sourceName: fileName,
    outputName,
    sourceBytes: sourceStats.size,
    outputBytes: outputStats.size
  };
}

async function run() {
  await ensureOutputDirectory();

  const files = await fs.readdir(inputDir);
  const menuFiles = files.filter((name) => IMAGE_REGEX.test(name) && !LOGO_REGEX.test(name));

  if (!menuFiles.length) {
    console.log('No menu image files found in public/menu.');
    return;
  }

  menuFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const results = [];
  for (const fileName of menuFiles) {
    const result = await optimizeFile(fileName);
    results.push(result);
  }

  const totalSource = results.reduce((sum, item) => sum + item.sourceBytes, 0);
  const totalOutput = results.reduce((sum, item) => sum + item.outputBytes, 0);
  const savingsPercent = totalSource > 0 ? (((totalSource - totalOutput) / totalSource) * 100).toFixed(1) : '0.0';

  console.log('Optimized files:');
  for (const item of results) {
    console.log(
      `- ${item.sourceName} -> ${item.outputName} (${bytesToMB(item.sourceBytes)}MB -> ${bytesToMB(item.outputBytes)}MB)`
    );
  }

  console.log(`Total: ${bytesToMB(totalSource)}MB -> ${bytesToMB(totalOutput)}MB (saved ${savingsPercent}%)`);
  console.log('Output folder: public/menu-lite');
}

run().catch((error) => {
  console.error('Image optimization failed.');
  console.error(error);
  process.exit(1);
});
