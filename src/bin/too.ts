#! /usr/bin/env node
// import { type ChildProcess } from "child_process";
import Args from "../lib/args";
// import build from "../lib/build";
// import Command from "../lib/command";
import specs from "../lib/flags";
// import interactive from "../lib/interactive";
import { Too } from "../lib/too";

const __main__ = async () => {
  const args = new Args(specs);
  const rest = args.parse(process.argv);
  let too: Too;
  if (rest.length == 1) {
    too = await Too.parse(rest[0]);
  }
  const code = await __run__(too!);
  process.exit(code);
  // if (args.get("cmd").length === 0) { await interactive(args); }
  // let subprocesses: ChildProcess[] = [];
  // try {
  //   subprocesses = await Promise.all(args.get("cmd").map((cmd, index) => {
  //     return build(cmd, index);
  //   }).map((cmd: Command) => cmd.start()));
  // } catch (err) {
  //   console.error((err as Error).message);
  //   Command.cleanup(subprocesses, "SIGTERM").then(() => process.exit(1));
  // }
  // process.on("SIGINT", () => {
  //   process.stdout.write("\n");
  //   Command.cleanup(subprocesses, "SIGINT").then(() => process.exit(2));
  // });
};

const __run__ = async (too: Too): Promise<number> => {
  process.on("SIGINT", async () => {
    await too.main.cleanup("SIGINT");
    await too.post.run();
  });
  try {
    await too.prep.run();
    await too.main.run();
  } catch (e) {
    await too.post.run();
    console.log("DEBUG 1001", e);
    return 1; // TODO
  }
  try {
    await too.post.run();
  } catch (e) {
    console.log("DEBUG 1002", e);
    return 1; // TODO
  }
  return 0;
};

__main__();
