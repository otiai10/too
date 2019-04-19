#! /usr/bin/env node

const spawn = require('child_process').spawn;
const Args = require('../src/args');
const specs = require('../src/flags');
const build = require('../src/build');

const __main__ = async () => {
  const args = new Args(specs);
  args.parse(process.argv);
  const subprocesses = args.get('cmd').map(build).map(cmd => cmd.start());
  Promise.all(subprocesses).catch(err => {
    console.error(err.msg);
    process.exit(err.code);
  });
};

__main__();
