#! /usr/bin/env node
import Args from "../lib/args";
import { DefaultLogger } from "../lib/logger";
import specs from "../lib/spec";
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
  too.logger = new DefaultLogger();
  const code = await too.run();
  process.exit(code);
};

__main__();
