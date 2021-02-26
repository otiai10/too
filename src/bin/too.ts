#! /usr/bin/env node
import Args from "../lib/args";
import build from "../lib/build";
import Command from "../lib/command";
import specs from "../lib/flags";
import interactive from "../lib/interactive";

const main = async () => {
  const args = new Args(specs);
  args.parse(process.argv);
  if (args.get("cmd").length === 0) { await interactive(args); }
  const subprocesses = args.get("cmd").map((cmd, index) => {
    return build(cmd, index);
  }).map((cmd: Command) => cmd.start());
  Promise.all(subprocesses).catch((err) => {
    console.error(err.msg);
    process.exit(err.code);
  });
};

main();
