const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

function killStalePort(port) {
  try {
    const out = execSync(`ss -lptn "sport = :${port}" 2>/dev/null`, { encoding: 'utf8' });
    const matches = out.match(/pid=(\d+)/g);
    if (matches) {
      for (const m of matches) {
        const pid = parseInt(m.replace('pid=', ''), 10);
        if (pid && pid !== process.pid) {
          try {
            process.kill(pid, 'SIGKILL');
            console.log(`[LifeBook] Cleaned up stale process ${pid} on port ${port}`);
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
}

function checkBackend(port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      if (res.statusCode === 200) return resolve(true);
      resolve(false);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const mode = process.argv[2] === 'start' ? 'start' : 'dev';
  const backendPort = process.env.BACKEND_PORT || 8787;
  const webPort = process.env.PORT || 3000;

  console.log(`[LifeBook] Initializing services in '${mode}' mode...`);

  const microserviceTs = path.join(__dirname, '..', 'microservices', 'domain-2', 'service-b', 'src', 'server.ts');
  const serverPath = fs.existsSync(microserviceTs) ? microserviceTs : path.join(__dirname, '..', 'backend', 'src', 'server.ts');

  const tsxCli = path.join(__dirname, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const tsxBin = fs.existsSync(tsxCli) 
    ? tsxCli 
    : path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');

  const webDir = path.join(__dirname, '..', 'clients', 'web');
  const nextBin = path.join(webDir, 'node_modules', 'next', 'dist', 'bin', 'next');

  // Check if backend is already healthy
  const backendHealthy = await checkBackend(backendPort, 500);
  let backendProc = null;

  if (!backendHealthy) {
    killStalePort(backendPort);
    console.log(`[LifeBook] Starting backend service on port ${backendPort}...`);

    const backendArgs = fs.existsSync(tsxBin)
      ? [tsxBin, serverPath]
      : ['tsx', serverPath];

    const backendCmd = fs.existsSync(tsxBin) ? process.execPath : 'npx';

    backendProc = spawn(backendCmd, backendArgs, {
      stdio: 'inherit',
      env: process.env,
    });

    backendProc.on('error', (err) => {
      console.error('[LifeBook] Backend process error:', err.message);
    });

    backendProc.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.warn(`[LifeBook] Backend stopped (code=${code}, signal=${signal})`);
      }
    });
  } else {
    console.log(`[LifeBook] Backend is already active on port ${backendPort}.`);
  }

  // Ensure port 3000 is clean before Next.js attempts to bind
  killStalePort(webPort);

  console.log(`[LifeBook] Starting Next.js web client on port ${webPort}...`);

  const nextArgs = fs.existsSync(nextBin)
    ? [nextBin, mode, '-p', String(webPort), '-H', '0.0.0.0']
    : ['run', mode, '--workspace=web'];

  const nextCmd = fs.existsSync(nextBin) ? process.execPath : 'npm';

  const webProc = spawn(nextCmd, nextArgs, {
    cwd: fs.existsSync(nextBin) ? webDir : path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  webProc.on('error', (err) => {
    console.error('[LifeBook] Next.js process error:', err.message);
  });

  let isExiting = false;
  const cleanup = () => {
    if (isExiting) return;
    isExiting = true;
    console.log('[LifeBook] Shutting down services...');
    if (backendProc) {
      try { backendProc.kill('SIGTERM'); } catch (_) {}
    }
    if (webProc) {
      try { webProc.kill('SIGTERM'); } catch (_) {}
    }
  };

  webProc.on('exit', (code, signal) => {
    console.log(`[LifeBook] Web client exited (code=${code}, signal=${signal})`);
    cleanup();
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  process.on('exit', cleanup);
}

main().catch((err) => {
  console.error('[LifeBook] Fatal startup error:', err);
  process.exit(1);
});
