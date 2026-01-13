/* eslint-disable no-console */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  console.log(`\n[build-client] $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function rmDir(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  const backendDir = process.cwd();
  const repoDir = path.resolve(backendDir, '..');
  const frontendDir = path.join(repoDir, 'frontend');

  if (!fs.existsSync(frontendDir)) {
    console.warn('[build-client] frontend/ não encontrado. A saltar build do cliente.');
    return;
  }

  // Instalar deps do frontend e construir
  run('npm ci', { cwd: frontendDir });
  run('npm run build', { cwd: frontendDir });

  // Copiar dist para backend/public
  const distDir = path.join(frontendDir, 'dist');
  const publicDir = path.join(backendDir, 'public');

  if (!fs.existsSync(distDir)) {
    throw new Error('[build-client] dist/ não existe após build do frontend.');
  }

  rmDir(publicDir);
  fs.mkdirSync(publicDir, { recursive: true });
  copyDir(distDir, publicDir);

  console.log(`\n[build-client] OK. Cliente copiado para: ${publicDir}`);
}

main();
