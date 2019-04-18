const Command = require('./command');

const build = (cmdliketext, index) => {
  const [spell, ...args] = cmdliketext.split(' ');
  return new Command(index, spell, args)
};

module.exports = build;
