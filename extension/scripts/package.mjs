import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(extensionDir, '..');
const manifest = JSON.parse(await readFile(join(extensionDir, 'manifest.json'), 'utf8'));
const archive = join(repoDir, 'dist', `spoilsport-extension-${manifest.version}.zip`);
const stagingDir = await mkdtemp(join(tmpdir(), 'spoilsport-package-'));
const runtimeFiles = [
  'manifest.json', 'background.js', 'content.js', 'content.css',
  'sync.js', 'popup.html', 'popup.js', 'lib/detect.js',
];

try {
  for (const file of runtimeFiles) {
    await mkdir(dirname(join(stagingDir, file)), { recursive: true });
    await copyFile(join(extensionDir, file), join(stagingDir, file));
  }
  await mkdir(dirname(archive), { recursive: true });
  await rm(archive, { force: true });
  execFileSync('zip', ['-q', '-r', archive, '.'], { cwd: stagingDir });
  console.log(archive);
} finally {
  await rm(stagingDir, { recursive: true, force: true });
}
