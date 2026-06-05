const fs = require('fs');
const path = require('path');

const sizes = [16, 24, 32, 48, 64, 96, 128, 256];
const icoDir = path.join(__dirname, '..', 'build', 'icons');

const entries = [];
const imageBuffers = [];

for (const size of sizes) {
  const pngPath = path.join(icoDir, `${size}x${size}.png`);
  if (!fs.existsSync(pngPath)) continue;

  const pngData = fs.readFileSync(pngPath);
  const w = size >= 256 ? 0 : size;
  const h = size >= 256 ? 0 : size;

  entries.push({ w, h, size: pngData.length });
  imageBuffers.push(pngData);
}

const headerSize = 6;
const dirEntrySize = 16;
const dataOffset = headerSize + dirEntrySize * entries.length;

const buf = Buffer.alloc(dataOffset + imageBuffers.reduce((a, b) => a + b.length, 0));
let offset = 0;

buf.writeUInt16LE(0, offset); offset += 2;
buf.writeUInt16LE(1, offset); offset += 2;
buf.writeUInt16LE(entries.length, offset); offset += 2;

let imgOffset = dataOffset;
for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  buf.writeUInt8(e.w, offset); offset += 1;
  buf.writeUInt8(e.h, offset); offset += 1;
  buf.writeUInt8(0, offset); offset += 1;
  buf.writeUInt8(0, offset); offset += 1;
  buf.writeUInt16LE(1, offset); offset += 2;
  buf.writeUInt16LE(32, offset); offset += 2;
  buf.writeUInt32LE(e.size, offset); offset += 4;
  buf.writeUInt32LE(imgOffset, offset); offset += 4;
  imageBuffers[i].copy(buf, imgOffset);
  imgOffset += e.size;
}

fs.writeFileSync(path.join(icoDir, 'icon.ico'), buf);
console.log('Generated build/icons/icon.ico');
