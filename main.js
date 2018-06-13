// This is free and unencumbered software released into the public domain.
// See LICENSE for details

const {app, BrowserWindow, Menu, protocol, ipcMain, dialog} = require('electron');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
const version = app.getVersion();

autoUpdater.autoDownload=false;

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');
log.info(version);

//-------------------------------------------------------------------
// Define the menu
//
// THIS SECTION IS NOT REQUIRED
//-------------------------------------------------------------------
let template = []
if (process.platform === 'darwin') {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  })
}


//-------------------------------------------------------------------
// Open a window that displays the version
//
// THIS SECTION IS NOT REQUIRED
//
// This isn't required for auto-updates to work, but it's easier
// for the app to show a window than to have to click "About" to see
// that updates are working.
//-------------------------------------------------------------------
let win;

function sendStatusToWindow(text) {
  log.info(text);
  win.webContents.send('message', text);
}
function createDefaultWindow() {
  win = new BrowserWindow();
  win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });
  win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);

  return win;
}
autoUpdater.on('checking-for-update', () => {
  console.log("Checking for update");
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Download update', 'Later'],
    defaultId: 0,
    message: 'Would you like to download update to this app?',
    detail: 'A new version of ' + app.getName() + ' is available to download. Would you like to download it?'
  }, response => {
    if (response === 0) {
      setTimeout(() => autoUpdater.downloadUpdate(), 1);
    }
  });
})
autoUpdater.on('update-not-available', (info) => {
  console.log("Update not available");
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
// autoUpdater.on('update-downloaded', (info) => {
//   sendStatusToWindow('Update downloaded');
// });
app.on('ready', function() {
  // Create the Menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createDefaultWindow();
});
app.on('window-all-closed', () => {
  app.quit();
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  let message = app.getName() + ' ' + releaseName + ' is now available. It will be installed the next time you restart the application.';
  if (releaseNotes) {
    const splitNotes = releaseNotes.split(/[^\r]\n/);
    message += '\n\nRelease notes:\n';
    splitNotes.forEach(notes => {
      message += notes + '\n\n';
    });
  }
  // Ask user to update the app
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Install and Relaunch', 'Later'],
    defaultId: 0,
    message: 'A new version of ' + app.getName() + ' has been downloaded',
    detail: message
  }, response => {
    if (response === 0) {
      setTimeout(() => autoUpdater.quitAndInstall(), 1);
    }
  });
});

//
// CHOOSE one of the following options for Auto updates
//

//-------------------------------------------------------------------
// Auto updates - Option 1 - Simplest version
//
// This will immediately download an update, then install when the
// app quits.
//-------------------------------------------------------------------
app.on('ready', function()  {
  autoUpdater.checkForUpdatesAndNotify();
});

//-------------------------------------------------------------------
// Auto updates - Option 2 - More control
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
// app.on('ready', function()  {
//   autoUpdater.checkForUpdates();
// });
// autoUpdater.on('checking-for-update', () => {
// })
// autoUpdater.on('update-available', (info) => {
// })
// autoUpdater.on('update-not-available', (info) => {
// })
// autoUpdater.on('error', (err) => {
// })
// autoUpdater.on('download-progress', (progressObj) => {
// })
// autoUpdater.on('update-downloaded', (info) => {
//   autoUpdater.quitAndInstall();  
// })
