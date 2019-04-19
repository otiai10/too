#! /usr/bin/env node
const Args = require('../src/args');
const interactive = require('../src/interactive');
const specs = require('../src/flags');
const build = require('../src/build');

const __main__ = async () => {
  const args = new Args(specs);
  args.parse(process.argv);
  if (args.get('cmd').length == 0) await interactive(args);
  const subprocesses = args.get('cmd').map(build).map(cmd => cmd.start());
  Promise.all(subprocesses).catch(err => {
    console.error(err.msg);
    process.exit(err.code);
  });
};

__main__();
