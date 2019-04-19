const { spawn } = require('child_process');
const { colors, RESET, UNDERLINE } = require('./colors');
const lookpath = require('lookpath');

class Command {
  constructor(index, spell, args, opt) {
    this.index = index;
    this.spell = spell;
    this.args = args;
    this.color = colors[index % colors.length];
    this.opt = opt;
  }
  async start() {
    const bin = await lookpath(this.spell, {path: this.opt.path || []});
    if (!bin) return Promise.reject({msg: `command not found: ${this.spell}`, code: 127});
    this.greet();
    const stream = spawn(this.spell, this.args, {
      killSignal: 'SIGTERM',
      detached: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: process.env.PATH + ':' + this.opt.path.join(':'),
      },
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
  /**
   * Show what is actually accepted.
   */
  greet() {
    process.stdout.write(`${this.color}[${this.index}] ${UNDERLINE}${[this.spell, ...this.args].join(' ')}${RESET}\n`);
  }
}

module.exports = Command;
