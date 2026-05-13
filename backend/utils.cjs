const path = require('path');
const fs = require('fs');

/**
 * Ensures an executable file is available on the physical filesystem.
 * When packaged with asarUnpack, the file resides in app.asar.unpacked.
 * @param {string} fileName The name of the executable (e.g., 'monitor.exe')
 * @param {string} dirname The __dirname of the calling module
 * @param {boolean} isPackaged Whether the app is packaged (app.isPackaged)
 * @param {function} logFn Optional logging function
 * @returns {string} The physical path to the executable
 */
function extractExecutable(fileName, dirname, isPackaged, logFn = console.log) {
  const sourcePath = path.join(dirname, fileName);

  try {
    if (isPackaged) {
      // In a packaged app, __dirname will be inside app.asar. 
      // We mapped the executable to be unpacked, so we replace 'app.asar' with 'app.asar.unpacked'
      const unpackedPath = sourcePath.replace('app.asar', 'app.asar.unpacked');
      
      if (logFn) logFn(`Resolving unwrapped executable path: ${unpackedPath}`);
      
      if (fs.existsSync(unpackedPath)) {
        return unpackedPath;
      } else {
        if (logFn) logFn(`Warning: Executable not found at ${unpackedPath}. Falling back to default.`);
      }
    }
  } catch (err) {
    if (logFn) logFn(`Error resolving ${fileName}: ${err.message}`);
  }
  
  return sourcePath;
}

module.exports = {
  extractExecutable
};
