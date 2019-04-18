#! /usr/bin/env node

const spawn = require('child_process').spawn;
const Args = require('../src/args');
const specs = require('../src/flags');
const build = require('../src/build');

const __main__ = () => {
  const args = new Args(specs);
  args.parse(process.argv);
  args.get('cmd').map(build).map(cmd => cmd.start());
};

__main__();
