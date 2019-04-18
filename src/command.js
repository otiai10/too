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
      this.print(process.stdout, data);
    });
    stream.stderr.on('data', data => {
      this.print(process.stderr, data);
    });
  }
  print(target, text) {
    text.toString().trim().split('\n').map(line => {
      target.write(`${this.head()}\t${line}\n`);
    })
  }
  head() {
    return `${this.color}[${this.index}] ${this.spell}${RESET}`
  }
  // body(message) {
  //   return message;
  // }
}

module.exports = Command;
