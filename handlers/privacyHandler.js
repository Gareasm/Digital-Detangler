const { ipcMain } = require('electron');
const privacyCollector = require('../collectors/privacyInfo');

function registerPrivacyHandler() {
    ipcMain.handle(privacyCollector.name, async () => {
        return await privacyCollector.collect();
    });
}

module.exports = registerPrivacyHandler;
