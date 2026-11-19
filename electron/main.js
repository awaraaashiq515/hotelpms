/**
 * GuestFlow PMS — Electron Main Process
 * 
 * OFFLINE CAPABLE VERSION
 * - Local Next.js server start karta hai (internet ki zaroorat nahi)
 * - SQLite database local PC pe store hoti hai
 * - Jab internet aaye to data cloud pe sync hota hai
 */

const { app, BrowserWindow, Menu, dialog, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { startLocalServer, stopLocalServer, checkInternetConnection } = require('./server-manager');

let mainWindow;
let splashWindow;
let localServerUrl = null;
let syncCheckInterval = null;

// ─────────────────────────────────────────────
// 1. SPLASH SCREEN (Loading ke waqt dikhega)
// ─────────────────────────────────────────────
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Inline HTML splash screen
  splashWindow.loadURL(`data:text/html;charset=utf-8,
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          border-radius: 12px;
          border: 1px solid #334155;
        }
        .logo { font-size: 48px; margin-bottom: 16px; }
        h1 { font-size: 24px; font-weight: 700; color: #f1f5f9; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 32px; }
        .status {
          font-size: 13px;
          color: #60a5fa;
          margin-bottom: 20px;
          min-height: 20px;
        }
        .progress-bar {
          width: 300px;
          height: 4px;
          background: #1e3a5f;
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 2px;
          animation: loading 2s ease-in-out infinite;
        }
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .version { 
          position: absolute; bottom: 16px; 
          font-size: 11px; color: #475569; 
        }
      </style>
    </head>
    <body>
      <div class="logo">🏨</div>
      <h1>GuestFlow PMS</h1>
      <p class="subtitle">Hotel Management System</p>
      <p class="status" id="status">Starting local embedded server...</p>
      <div class="progress-bar"><div class="progress-fill"></div></div>
      <p class="version">v1.0.0 — Offline-First Architecture</p>
    </body>
    </html>
  `);
}

// ─────────────────────────────────────────────
// 2. MAIN WINDOW
// ─────────────────────────────────────────────
function createMainWindow(startUrl) {
  const iconPath = fs.existsSync(path.join(__dirname, 'icon-512.png'))
    ? path.join(__dirname, 'icon-512.png')
    : path.join(__dirname, '../public/icon-512.png');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    show: false, // Pehle hide rakho, server ready hone pe dikhao
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: iconPath,
    title: 'GuestFlow PMS',
    autoHideMenuBar: false,
  });

  mainWindow.loadURL(startUrl);

  // Jab page load ho jaye tab show karo aur splash band karo
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    // Offline sync monitoring shuru karo
    startSyncMonitor();
  });

  // Connection error handle karo
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc, validatedUrl) => {
    console.error('[Main] Page load fail hua:', errorCode, errorDesc);
    
    // Agar local server down ho gaya to retry karo
    if (validatedUrl && validatedUrl.includes('localhost')) {
      showOfflineErrorPage();
    }
  });

  // URL save karo jab bhi change ho
  mainWindow.webContents.on('did-navigate', (event, url) => {
    saveLastUrl(url);
  });

  buildApplicationMenu();
}

// ─────────────────────────────────────────────
// 3. OFFLINE ERROR PAGE
// ─────────────────────────────────────────────
function showOfflineErrorPage() {
  if (!mainWindow) return;
  mainWindow.loadURL(`data:text/html;charset=utf-8,
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          background: #0a0a0a; color: white;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100vh; font-family: sans-serif; text-align: center;
          margin: 0;
        }
        h1 { color: #ef4444; font-size: 28px; margin-bottom: 12px; }
        p { color: #94a3b8; margin: 8px 0; }
        .btn {
          margin-top: 24px; padding: 12px 28px;
          background: #2563eb; color: white;
          border: none; border-radius: 8px;
          cursor: pointer; font-size: 15px;
          margin-right: 8px;
        }
        .btn:hover { background: #1d4ed8; }
        .btn.secondary { background: #374151; }
        .status { margin-top: 20px; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div style="font-size:64px;margin-bottom:16px">⚡</div>
      <h1>Local Server Not Responding</h1>
      <p>The GuestFlow PMS embedded server is temporarily unavailable.</p>
      <p>Click below to retry the connection.</p>
      <div>
        <button class="btn" onclick="window.location.href='http://localhost:3000/login'">
          🔄 Retry Connection
        </button>
      </div>
      <p class="status">If this persists, please restart the application.</p>
    </body>
    </html>
  `);
}

// ─────────────────────────────────────────────
// 4. SYNC MONITOR (Internet Aane Pe Auto Sync)
// ─────────────────────────────────────────────
let wasOffline = false;

function startSyncMonitor() {
  // Har 15 second mein internet check karo
  syncCheckInterval = setInterval(async () => {
    const online = await checkInternetConnection();

    if (!online && !wasOffline) {
      // Abhi offline hua
      wasOffline = true;
      console.log('[Sync] ⚠️ Offline ho gaye — data local save ho raha hai');
      
      // Window mein offline notification bhejo
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          window.__guestflow_offline = true;
          window.dispatchEvent(new CustomEvent('guestflow-offline'));
          console.log('[GuestFlow] Offline mode active');
        `).catch(() => {});
      }
    }

    if (online && wasOffline) {
      // Wapas online aa gaye
      wasOffline = false;
      console.log('[Sync] ✅ Wapas online! Sync shuru ho rahi hai...');
      
      // Window mein online event bhejo (sync trigger karega)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          window.__guestflow_offline = false;
          window.dispatchEvent(new CustomEvent('guestflow-online'));
          console.log('[GuestFlow] Back online — syncing...');
        `).catch(() => {});
      }

      // Sync notification dikhao
      showSyncNotification();
    }
  }, 15000);
}

function showSyncNotification() {
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: 'GuestFlow PMS — Connectivity Restored 🌐',
      body: 'Synchronizing offline transactions with cloud server...',
      icon: path.join(__dirname, 'icon-512.png'),
    });
    notif.show();
  }
}

// ─────────────────────────────────────────────
// 5. LAST URL SAVE / RESTORE
// ─────────────────────────────────────────────
const configPath = path.join(app.getPath('userData'), 'config.json');

function saveLastUrl(url) {
  try {
    // Sirf local URLs save karo
    if (url && url.includes('localhost')) {
      fs.writeFileSync(configPath, JSON.stringify({ lastUrl: url }));
    }
  } catch (e) {}
}

function getLastUrl() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.lastUrl && config.lastUrl.includes('localhost')) {
        return config.lastUrl;
      }
    }
  } catch (e) {}
  return null;
}

// ─────────────────────────────────────────────
// 6. APPLICATION MENU
// ─────────────────────────────────────────────
function buildApplicationMenu() {
  const template = [
    {
      label: 'GuestFlow PMS',
      submenu: [
        {
          label: 'Version 1.0.0 (Offline Mode)',
          enabled: false,
        },
        { type: 'separator' },
        {
          label: 'Auto-Start on Windows Boot',
          type: 'checkbox',
          checked: app.getLoginItemSettings().openAtLogin,
          click: (menuItem) => {
            app.setLoginItemSettings({
              openAtLogin: menuItem.checked,
              name: 'GuestFlow PMS',
            });
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit Application' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Full Screen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'App Info / Database Location',
          click: async () => {
            const userDataPath = app.getPath('userData');
            const dbPath = path.join(userDataPath, 'guestflow.db');
            const dbSize = fs.existsSync(dbPath)
              ? (fs.statSync(dbPath).size / 1024 / 1024).toFixed(2) + ' MB'
              : 'File not found';

            await dialog.showMessageBox(mainWindow, {
              title: 'GuestFlow PMS — App Info',
              message: 'Application Information',
              detail: [
                `📁 Data Folder: ${userDataPath}`,
                `🗄️ Database: ${dbPath}`,
                `💾 DB Size: ${dbSize}`,
                `🌐 Local Server: ${localServerUrl || 'Unknown'}`,
                `💡 Mode: Offline-First (Local SQLite)`,
              ].join('\n'),
              buttons: ['OK'],
            });
          },
        },
        {
          label: 'Open Data Folder',
          click: () => {
            const { shell } = require('electron');
            shell.openPath(app.getPath('userData'));
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─────────────────────────────────────────────
// 7. APP LIFECYCLE
// ─────────────────────────────────────────────
app.on('ready', async () => {
  console.log('[Main] ✅ GuestFlow PMS shuru ho raha hai...');
  console.log('[Main] userData path:', app.getPath('userData'));

  // Splash screen dikhao
  createSplashScreen();

  try {
    // Local server start karo
    console.log('[Main] Local Next.js server start ho raha hai...');
    localServerUrl = await startLocalServer(app);
    console.log('[Main] Server ready:', localServerUrl);

    // Pichli URL ya login page pe jao
    const lastUrl = getLastUrl();
    const startUrl = lastUrl || `${localServerUrl}/login`;
    console.log('[Main] Loading URL:', startUrl);

    // Main window banao
    createMainWindow(startUrl);

  } catch (err) {
    console.error('[Main] ❌ Server start nahi hua:', err);

    // Splash band karo
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }

    // Show error dialog
    const { response } = await dialog.showMessageBox({
      type: 'error',
      title: 'GuestFlow PMS — Server Startup Error',
      message: 'Failed to initialize the local server process.',
      detail: [
        'Error: ' + err.message,
        '',
        'Troubleshooting:',
        '1. Restart the application',
        '2. Verify port 3000 is not blocked by another service',
        '',
        'Log File: ' + path.join(app.getPath('userData'), 'logs', 'nextjs-server.log'),
      ].join('\n'),
      buttons: ['Retry', 'Exit'],
    });

    if (response === 0) {
      app.relaunch();
    }
    app.quit();
  }
});

// App band hone se pehle server band karo
app.on('before-quit', () => {
  console.log('[Main] App band ho raha hai — server bhi band kar raha hoon...');
  if (syncCheckInterval) {
    clearInterval(syncCheckInterval);
  }
  stopLocalServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && localServerUrl) {
    createMainWindow(`${localServerUrl}/login`);
  }
});

// ─────────────────────────────────────────────
// 8. IPC HANDLERS (Frontend se communication)
// ─────────────────────────────────────────────
ipcMain.handle('get-app-info', () => ({
  userDataPath: app.getPath('userData'),
  dbPath: path.join(app.getPath('userData'), 'guestflow.db'),
  serverUrl: localServerUrl,
  version: app.getVersion(),
  platform: process.platform,
  offlineMode: true,
}));

ipcMain.handle('check-internet', async () => {
  return await checkInternetConnection();
});
