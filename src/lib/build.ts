const path = require('path');
const fs = require('fs');
// const Command = require('./command');
import Command from './command';

const __getAdditionalPATH = () => {
  const additionals = [];
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    additionals.push(path.join(cwd, 'node_modules', '.bin'));
  }
  return additionals;
};

const build = (cmdliketext: any, index: any) => {
  const [spell, ...args] = cmdliketext.split(' ');
  const additionalPath = __getAdditionalPATH();
  return new Command(index, spell, args, {path: additionalPath});
};

export default build;
