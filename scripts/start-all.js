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
  console.log('[LifeBook] Starting backend service on port 8787...');
  let proc;
  const fs = require('fs');
  const path = require('path');

  const microserviceTs = path.join(__dirname, '..', 'microservices', 'domain-2', 'service-b', 'src', 'server.ts');
  const serverPath = fs.existsSync(microserviceTs) ? microserviceTs : path.join(__dirname, '..', 'backend', 'src', 'server.ts');

  console.log(`[LifeBook] Using Node TS backend server on port 8787 (${serverPath})...`);
  proc = spawn('npx', ['tsx', serverPath], {
    stdio: 'inherit',
    env: process.env,
  });

  proc.on('error', (err) => {
    console.error('[LifeBook] Backend error:', err.message);
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
