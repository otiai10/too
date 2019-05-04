#! /usr/bin/env node
import Args from '../lib/args';
import interactive from '../lib/interactive';
import specs from '../lib/flags';
import build from '../lib/build';

const __main__ = async () => {
  const args = new Args(specs);
  args.parse(process.argv);
  if (args.get('cmd').length == 0) await interactive(args);
  const subprocesses = args.get('cmd').map(build).map((cmd: any) => cmd.start());
  Promise.all(subprocesses).catch(err => {
    console.error(err.msg);
    process.exit(err.code);
  });
};

__main__();
