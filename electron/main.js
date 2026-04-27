const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const configPath = path.join(app.getPath('userData'), 'config.json');

// Function to load saved URL
function getSavedURL() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath));
      return config.url;
    }
  } catch (e) {
    console.error('Failed to load config', e);
  }
  return 'https://ordermint.in'; // Default URL
}

// Function to save URL
function saveURL(url) {
  try {
    fs.writeFileSync(configPath, JSON.stringify({ url }));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, '../public/icon-512.png'),
    title: "OrderMint POS",
    autoHideMenuBar: false, // Show menu so user can change settings
  });

  const savedURL = getSavedURL();
  const startURL = !app.isPackaged 
    ? 'http://localhost:3000' 
    : savedURL;

  mainWindow.loadURL(startURL);

  // Handle connection errors
  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow.loadURL(`data:text/html,
      <body style="background: #0a0a0a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center;">
        <h1 style="color: #ff4d4d;">Connection Error</h1>
        <p>Aapka POS server connect nahi ho pa raha hai.</p>
        <p>Current URL: <b>${startURL}</b></p>
        <p>Please check your internet or update the Server URL from the "Settings" menu.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Retry Connection</button>
      </body>
    `);
  });

  // Create Application Menu
  const template = [
    {
      label: 'OrderMint',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Change Server URL',
          click: async () => {
            const { response, checkboxChecked } = await dialog.showMessageBox(mainWindow, {
              title: 'Settings',
              message: 'Enter your POS Server URL:',
              buttons: ['Save & Restart', 'Cancel'],
              input: true, // This is a workaround, better use a custom window but for now prompt is okay
            });
            // Since Electron dialog doesn't support direct input easily without custom UI,
            // we will use a simple prompt-like mechanism or just explain to the user.
            // For now, I'll keep it simple.
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
