import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const files = readdirSync('dist/assets').filter((file) => file.endsWith('.js'));
const size = files.reduce((sum, file) => sum + gzipSync(readFileSync(`dist/assets/${file}`)).length, 0);
if (size > 200 * 1024) throw new Error(`Client JavaScript is ${(size / 1024).toFixed(1)} KiB gzip; limit is 200 KiB`);
console.log(`Client JavaScript: ${(size / 1024).toFixed(1)} KiB gzip`);
