const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { extractExecutable } = require('./utils.cjs');
const { app } = require('electron');

module.exports = {
  attachWindow: (browserWindow) => {
    return new Promise((resolve, reject) => {
        try {
            const hwndBuffer = browserWindow.getNativeWindowHandle();
            let handleValue;
            if (hwndBuffer.length === 8) {
                handleValue = hwndBuffer.readBigInt64LE(0).toString();
            } else {
                handleValue = hwndBuffer.readInt32LE(0).toString();
            }
            
            const exePath = extractExecutable('attach.exe', __dirname, app.isPackaged);
            const sudo = require('sudo-prompt');

            const runExe = () => {
                // Try running with standard exec first, fallback to sudo if it fails
                exec(`"${exePath}" ${handleValue}`, { windowsHide: true }, (error, stdout, stderr) => {
                    if (error) {
                        console.warn("Standard WorkerW attachment failed, trying elevated...");
                        sudo.exec(`"${exePath}" ${handleValue}`, { name: 'LiveWall' }, (sudoErr, sudoOut, sudoStder) => {
                            if (sudoErr) {
                                console.error("WorkerW Elevated Error:", sudoStder);
                                reject(sudoErr);
                            } else {
                                resolve(true);
                            }
                        });
                    } else {
                        resolve(true);
                    }
                });
            };

            runExe();

        } catch(e) {
            reject(e);
        }
    });
  }
};
