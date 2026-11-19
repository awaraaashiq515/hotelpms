/**
 * GuestFlow PMS - Local Server Manager
 * 
 * Manages the embedded Next.js server lifecycle within the Electron desktop client.
 * Runs completely locally without requiring active internet connectivity.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

let nextServerProcess = null;
const LOCAL_PORT = 3000;
const MAX_WAIT_MS = 60000; // Wait up to 60 seconds for server startup

/**
 * Check if the target port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '127.0.0.1');
  });
}

/**
 * Poll internal health endpoint until server responds
 */
function waitForServer(port, maxWaitMs) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function tryConnect() {
      if (Date.now() - startTime > maxWaitMs) {
        reject(new Error(`Server failed to start on port ${port} within ${maxWaitMs}ms`));
        return;
      }

      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode < 500) {
          resolve(true);
        } else {
          setTimeout(tryConnect, 1000);
        }
      });

      req.on('error', () => {
        setTimeout(tryConnect, 1000);
      });

      req.setTimeout(2000, () => {
        req.destroy();
        setTimeout(tryConnect, 1000);
      });
    }

    tryConnect();
  });
}

/**
 * Resolve root application path (packaged vs development mode)
 */
function getAppPath(app) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app');
  } else {
    return path.join(__dirname, '..');
  }
}

/**
 * Ensure database file is placed in the persistent user data directory
 */
function setupDatabasePath(app) {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'guestflow.db');
  const sourceDbPath = path.join(getAppPath(app), 'dev.db');

  if (!fs.existsSync(dbPath)) {
    console.log('[ServerManager] Initializing local database file...');
    if (fs.existsSync(sourceDbPath)) {
      fs.copyFileSync(sourceDbPath, dbPath);
      console.log('[ServerManager] Database initialized at:', dbPath);
    } else {
      console.log('[ServerManager] Source database not found; a new database will be created at:', dbPath);
    }
  } else {
    console.log('[ServerManager] Existing database detected:', dbPath);
  }

  return dbPath;
}

/**
 * Start the local Next.js server instance
 */
async function startLocalServer(app) {
  const appPath = getAppPath(app);
  const dbPath = setupDatabasePath(app);
  const userDataPath = app.getPath('userData');

  console.log('[ServerManager] Application path:', appPath);
  console.log('[ServerManager] Database path:', dbPath);

  // Check if port is already running
  const portFree = await isPortAvailable(LOCAL_PORT);
  if (!portFree) {
    console.log(`[ServerManager] Port ${LOCAL_PORT} is already in use; reusing active instance.`);
    return `http://localhost:${LOCAL_PORT}`;
  }

  const env = {
    ...process.env,
    DATABASE_URL: `file:${dbPath}`,
    JWT_SECRET: process.env.JWT_SECRET || 'guestflow-offline-secret-key-change-me',
    NEXT_PUBLIC_APP_URL: `http://localhost:${LOCAL_PORT}`,
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_ENV: 'production',
    PORT: String(LOCAL_PORT),
    OFFLINE_MODE: 'true',
    LOG_DIR: path.join(userDataPath, 'logs'),
  };

  const logDir = path.join(userDataPath, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'nextjs-server.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  console.log('[ServerManager] Spawning Next.js server...');

  let command, args;

  if (app.isPackaged) {
    const standalonePath = path.join(appPath, '.next', 'standalone', 'server.js');
    if (!fs.existsSync(standalonePath)) {
      const msg = `[ServerManager] ❌ server.js not found at: ${standalonePath}\n` +
        `   Please build the project first: npm run build\n` +
        `   Or run scripts/build-electron.sh`;
      console.error(msg);
      throw new Error(
        `Next.js standalone server not found at:\n${standalonePath}\n\nPlease run: npm run build`
      );
    }
    command = process.execPath;
    args = [standalonePath];

    const envFilePath = path.join(appPath, '.env');
    if (fs.existsSync(envFilePath)) {
      const envFileLines = fs.readFileSync(envFilePath, 'utf8').split('\n');
      for (const line of envFileLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (key && !(key in env)) {
              env[key] = val;
            }
          }
        }
      }
    }
  } else {
    const isWindows = process.platform === 'win32';
    command = isWindows ? 'npx.cmd' : 'npx';
    args = ['next', 'start', '--port', String(LOCAL_PORT)];
  }

  nextServerProcess = spawn(command, args, {
    cwd: appPath,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  nextServerProcess.stdout.on('data', (data) => {
    const msg = data.toString();
    logStream.write(`[${new Date().toISOString()}] STDOUT: ${msg}`);
    console.log('[NextJS]', msg.trim());
  });

  nextServerProcess.stderr.on('data', (data) => {
    const msg = data.toString();
    logStream.write(`[${new Date().toISOString()}] STDERR: ${msg}`);
    console.error('[NextJS ERROR]', msg.trim());
  });

  nextServerProcess.on('exit', (code) => {
    console.log(`[ServerManager] Next.js server stopped (exit code: ${code})`);
    logStream.write(`[${new Date().toISOString()}] Server exited with code ${code}\n`);
    nextServerProcess = null;
  });

  nextServerProcess.on('error', (err) => {
    console.error('[ServerManager] Server process error:', err);
  });

  try {
    await waitForServer(LOCAL_PORT, MAX_WAIT_MS);
    console.log(`[ServerManager] ✅ Server is ready: http://localhost:${LOCAL_PORT}`);
    return `http://localhost:${LOCAL_PORT}`;
  } catch (err) {
    console.error('[ServerManager] ❌ Server failed to start:', err.message);
    throw err;
  }
}

/**
 * Stop the local server process
 */
function stopLocalServer() {
  if (nextServerProcess) {
    console.log('[ServerManager] Stopping local server...');
    nextServerProcess.kill('SIGTERM');

    setTimeout(() => {
      if (nextServerProcess) {
        nextServerProcess.kill('SIGKILL');
      }
    }, 5000);

    nextServerProcess = null;
  }
}

/**
 * Get the last 50 lines of the Next.js server log
 */
function getServerLogs(app) {
  try {
    const userDataPath = app.getPath('userData');
    const logFile = path.join(userDataPath, 'logs', 'nextjs-server.log');
    if (!fs.existsSync(logFile)) {
      return '[ServerManager] Log file not found: ' + logFile;
    }
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');
    return lines.slice(-50).join('\n');
  } catch (e) {
    return '[ServerManager] Error reading log file: ' + e.message;
  }
}

/**
 * Test internet reachability
 */
function checkInternetConnection() {
  return new Promise((resolve) => {
    const req = http.get('http://www.google.com', { timeout: 5000 }, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

module.exports = {
  startLocalServer,
  stopLocalServer,
  checkInternetConnection,
  getAppPath,
  setupDatabasePath,
  getServerLogs,
};
