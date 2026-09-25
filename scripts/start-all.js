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
  console.log('[LifeBook] Starting Python FastAPI backend service on port 8787...');
  const path = require('path');
  const serviceDir = path.join(__dirname, '..', 'microservices', 'domain-2', 'service-b');
  const rootDir = path.join(__dirname, '..');

  const env = {
    ...process.env,
    PYTHONPATH: `${serviceDir}:${rootDir}`,
  };

  const proc = spawn('python3', ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8787'], {
    cwd: serviceDir,
    stdio: 'inherit',
    env,
  });

  proc.on('error', (err) => {
    console.error('[LifeBook] Python FastAPI backend error:', err.message);
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[LifeBook] FastAPI backend exited with code ${code}. Trying root backend fallback...`);
      // Try root backend
      const fallbackProc = spawn('python3', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '0.0.0.0', '--port', '8787'], {
        cwd: rootDir,
        stdio: 'inherit',
        env,
      });
      fallbackProc.on('error', (e) => console.error('[LifeBook] Root backend error:', e.message));
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
