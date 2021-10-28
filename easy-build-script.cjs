// this file builds the game, since doing this manually is a pain and if the lud jam judges
// need to build it, this may assist them. obviously, this does not affect the game itself.

const child_process = require('child_process');
const fse = require('fs-extra');

fse.removeSync('build');
fse.copySync('static', 'build');

child_process.execSync('yarn vite build ./src/builtversion/ --outDir ../../build');

fse.moveSync('build/cursor.png', 'build/assets/cursor.png');
fse.moveSync('build/cursor-red.png', 'build/assets/cursor-red.png');
fse.moveSync('build/carlito-bold.ttf', 'build/assets/carlito-bold.ttf');
fse.moveSync('build/AlfaSlabOne-Regular.ttf', 'build/assets/AlfaSlabOne-Regular.ttf');

child_process.execSync('node generatefinal.mjs');

const str = fse.readFileSync('build/index.html').toString();
fse.writeFileSync('build/index.html', str.replace(/\/assets/g, './assets'));

console.log('build done. host the ./build folder somewhere.');
