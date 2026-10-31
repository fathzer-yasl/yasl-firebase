import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// Reads the current commit short sha from .git without spawning a process
function gitShortSha() {
  try {
    const head = readFileSync('.git/HEAD', 'utf8').trim();
    const sha = head.startsWith('ref:') ? refSha(head.slice(4).trim()) : head;
    return sha ? sha.slice(0, 7) : null;
  } catch {
    return null;
  }
}

function refSha(ref) {
  try {
    return readFileSync(`.git/${ref}`, 'utf8').trim();
  } catch {
    // The ref may only exist in packed-refs
    try {
      const packed = readFileSync('.git/packed-refs', 'utf8');
      const line = packed.split('\n').find(l => l.endsWith(` ${ref}`));
      return line ? line.split(' ')[0] : null;
    } catch {
      return null;
    }
  }
}

// Injected version: APP_RELEASE env var at release time, 'dev-<sha>' otherwise
function appRelease() {
  if (process.env.APP_RELEASE) return process.env.APP_RELEASE;
  const sha = gitShortSha();
  return sha ? `dev-${sha}` : 'dev';
}

export default defineConfig({
  define: {
    __APP_RELEASE__: JSON.stringify(appRelease()),
  },
  root: 'web',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 8080,
  },
});
