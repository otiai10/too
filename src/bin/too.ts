#! /usr/bin/env node
import Args from "../lib/args";
import specs from "../lib/flags";
import { Too } from "../lib/too";

const __main__ = async () => {
  const args = new Args(specs);
  const rest = args.parse(process.argv);
  let too: Too;
  if (rest.length > 0) {
    too = await Too.parse(rest[0]);
  } else if (args.get("cmd").length > 0) {
    too = await Too.direct(args.get("cmd"));
  } else {
    too = await Too.interactive();
  }
  const code = await __run__(too!);
  process.exit(code);
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
