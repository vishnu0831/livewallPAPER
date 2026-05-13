const cp = require('child_process');
const fs = require('fs');

const npm = 'c:\\Users\\visha\\Downloads\\script\\livewall\\.node\\node-v20.18.0-win-x64\\npm.cmd';

const child = cp.spawn('c:\\Users\\visha\\Downloads\\wallpaper project\\livewall\\.node\\node-v20.18.0-win-x64\\npm.cmd', ['install', '--no-package-lock'], {
  cwd: 'c:\\Users\\visha\\Downloads\\wallpaper project\\livewall',
  env: { 
    ...process.env, 
    PATH: 'c:\\Users\\visha\\Downloads\\wallpaper project\\livewall\\.node\\node-v20.18.0-win-x64;' + process.env.PATH 
  }
});

fs.writeFileSync('npm_out.txt', 'Started.\n');
fs.writeFileSync('npm_err.txt', 'Started.\n');

child.stdout.on('data', d => fs.appendFileSync('npm_out.txt', d));
child.stderr.on('data', d => fs.appendFileSync('npm_err.txt', d));
child.on('error', e => fs.appendFileSync('npm_err.txt', 'Spawn Error: ' + e.message + '\n'));
child.on('close', code => fs.appendFileSync('npm_out.txt', `\nExited with ${code}`));
