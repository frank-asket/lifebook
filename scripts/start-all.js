const { spawn } = require('child_process');
const http = require('http');

function checkBackend(callback) {
  const req = http.get('http://127.0.0.1:8787/api/health', (res) => {
    if (res.statusCode === 200) return callback(true);
    callback(false);
  });
  req.on('error', () => callback(false));
  req.setTimeout(1500, () => {
    req.destroy();
    callback(false);
  });
}

function startBackend() {
  console.log('[LifeBook] Starting Python FastAPI backend on port 8787...');
  let proc = spawn('python3', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '0.0.0.0', '--port', '8787'], {
    stdio: 'inherit',
    env: process.env,
  });

  proc.on('error', (err) => {
    console.error('[LifeBook] Python backend error, falling back to Node TS server:', err.message);
    proc = spawn('npx', ['tsx', 'backend/src/server.ts'], {
      stdio: 'inherit',
      env: process.env,
    });
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[LifeBook] Backend process exited with code ${code}. Trying Node TS fallback...`);
      setTimeout(() => {
        checkBackend((alive) => {
          if (!alive) {
            spawn('npx', ['tsx', 'backend/src/server.ts'], {
              stdio: 'inherit',
              env: process.env,
            });
          }
        });
      }, 1000);
    }
  });

  return proc;
}

const mode = process.argv[2] === 'start' ? 'start' : 'dev';

checkBackend((isRunning) => {
  let backendProc = null;
  if (!isRunning) {
    backendProc = startBackend();
  } else {
    console.log('[LifeBook] Backend is active on port 8787.');
  }

  const npmArgs = mode === 'start' 
    ? ['run', 'start', '--workspace=web'] 
    : ['run', 'dev', '--workspace=web'];

  const webProc = spawn('npm', npmArgs, {
    stdio: 'inherit',
    env: process.env,
  });

  const cleanup = () => {
    if (backendProc) backendProc.kill();
    if (webProc) webProc.kill();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
});
