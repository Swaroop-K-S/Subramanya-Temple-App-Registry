const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess = null;

const PY_DIST_FOLDER = 'subramanya_temple_app_v2'; // Folder name where PyInstaller output goes in production
const PY_MODULE = 'subramanya_temple_app_v2'; // Name of the exe

const isDev = !app.isPackaged;

function log(msg) {
    console.log(`[Electron] ${msg}`);
}

const getBackendPath = () => {
    if (!isDev) {
        // Production: Bundled within resources
        return path.join(process.resourcesPath, PY_DIST_FOLDER, `${PY_MODULE}.exe`);
    }
    // Development (Manual start or specific path - handled separately usually)
    return null;
};

function startBackend() {
    const backend = getBackendPath();
    if (!backend && isDev) {
        log('Dev mode: Assuming backend is running manually on port 8000');
        return Promise.resolve();
    }

    log(`Starting backend from: ${backend}`);
    return new Promise((resolve, reject) => {
        backendProcess = spawn(backend, [], {
            env: { ...process.env, ELECTRON_MODE: 'true' } // Signal to backend
        });

        backendProcess.stdout.on('data', (data) => {
            log(`Backend: ${data}`);
            if (data.toString().includes('Application startup complete')) {
                resolve();
            }
        });

        backendProcess.stderr.on('data', (data) => log(`Backend Error: ${data}`));

        backendProcess.on('close', (code) => {
            log(`Backend exited with code ${code}`);
            backendProcess = null;
        });

        // Fallback: Resolve after 3 seconds if no startup msg seen
        setTimeout(resolve, 3000);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "S.T.A.R. - Subramanya Temple App & Registry",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Simplifies communication for now
        },
        icon: path.join(__dirname, '../public/app_icon.ico') // Assuming icon exists
    });

    const startUrl = isDev
        ? 'http://localhost:5173' // Vite Dev Server
        : 'http://localhost:8000'; // FastAPI serving static build

    // Wait for backend port to be listening (polling)
    const checkServer = () => {
        http.get('http://localhost:8000/docs', (res) => {
            log('Backend ready. Loading window.');
            mainWindow.loadURL(startUrl);
        }).on('error', (err) => {
            log('Waiting for backend...');
            setTimeout(checkServer, 1000);
        });
    };

    if (isDev) {
        mainWindow.loadURL(startUrl); // Just load Vite
    } else {
        checkServer();
    }

    mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', async () => {
    if (!isDev) await startBackend();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (backendProcess) backendProcess.kill();
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
