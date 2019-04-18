const { spawn } = require('child_process');
const { colors, RESET } = require('./colors');

class Command {
  constructor(index, spell, args) {
    this.index = index;
    this.spell = spell;
    this.args = args;
    this.color = colors[index % colors.length];
  }
  start() {
    const stream = spawn(this.spell, this.args, {
      killSignal: 'SIGTERM',
      detached: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env, // TODO: additional env
    });
    stream.stdout.on('data', data => {
      process.stdout.write(`${this.color}[${this.index}]${RESET}\t${data}`);
    });
    stream.stderr.on('data', data => {
      process.stderr.write(`${this.color}[${this.index}]${RESET}\t${data}`);
    });
  }
}

module.exports = Command;
