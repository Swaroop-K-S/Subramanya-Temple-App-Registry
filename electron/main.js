const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// Get the correct base path (handles packaged vs dev mode)
const getBasePath = () => {
    return app.isPackaged
        ? path.dirname(app.getPath('exe'))
        : __dirname;
};

// Start the FastAPI backend
function startBackend() {
    const basePath = getBasePath();
    const backendPath = app.isPackaged
        ? path.join(process.resourcesPath, 'temple-backend.exe')
        : path.join(basePath, 'resources', 'temple-backend.exe');

    console.log('Starting backend from:', backendPath);

    backendProcess = spawn(backendPath, [], {
        cwd: path.dirname(backendPath),
        shell: true,
        windowsHide: true
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

// Stop the backend when app closes
function stopBackend() {
    if (backendProcess) {
        backendProcess.kill('SIGTERM');
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
        }
    }
}

function createWindow() {
    const basePath = getBasePath();

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        title: 'Temple Management Suite',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
        show: false,
        backgroundColor: '#1e293b'
    });

    // Load the React app - use correct path for packaged app
    if (app.isPackaged) {
        // In packaged mode, files are in app.asar
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        mainWindow.loadFile(path.join(basePath, 'dist', 'index.html'));
    }

    // Open DevTools in dev mode for debugging
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle load failures
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });

    // Open external links in default browser (for WhatsApp)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle
app.whenReady().then(() => {
    startBackend();

    // Wait for backend to start
    setTimeout(() => {
        createWindow();
    }, 3000);
});

app.on('window-all-closed', () => {
    stopBackend();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    stopBackend();
});
