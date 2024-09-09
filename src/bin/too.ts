#! /usr/bin/env node
import { type ChildProcess } from "child_process";
import Args from "../lib/args";
import build from "../lib/build";
import Command from "../lib/command";
import specs from "../lib/flags";
import interactive from "../lib/interactive";

const main = async () => {
  const args = new Args(specs);
  args.parse(process.argv);
  if (args.get("cmd").length === 0) { await interactive(args); }
  let subprocesses: ChildProcess[] = [];
  try {
    subprocesses = await Promise.all(args.get("cmd").map((cmd, index) => {
      return build(cmd, index);
    }).map((cmd: Command) => cmd.start()));
  } catch (err) {
    console.error((err as Error).message);
    Command.cleanup(subprocesses, "SIGTERM").then(() => process.exit(1));
  }
  process.on("SIGINT", () => {
    process.stdout.write("\n");
    Command.cleanup(subprocesses, "SIGINT").then(() => process.exit(2));
  });
};

main();
