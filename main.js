const { app, BrowserWindow, shell, Menu, ipcMain, net } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    title: 'eMERYTURA', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false }
  });
  // popups: blank export windows stay in the app, real links open in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url || url === 'about:blank') return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true } };
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

// live quote from Yahoo Finance (same feed many charting sites use, ~real-time / up to 15 min delay)
ipcMain.handle('quote', async (_e, symbol) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  const res = await net.fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const m = (await res.json()).chart.result[0].meta;
  return { price: m.regularMarketPrice, prevClose: m.chartPreviousClose ?? m.previousClose,
           currency: m.currency, time: m.regularMarketTime * 1000, state: m.marketState || '' };
});

Menu.setApplicationMenu(null);
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
