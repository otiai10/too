#! /usr/bin/env node
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Args } from "../lib/args.js";
import { DefaultLogger } from "../lib/logger.js";
import { specs } from "../lib/specs.js";
import { Too } from "../lib/too.js";

const __main__ = async () => {
  const args = new Args(specs);
  const rest = args.parse(process.argv);
  if (args.get("version").length > 0 || rest[0] == "version") {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgpath = resolve(__dirname, "../../package.json");
    const {version} = JSON.parse(readFileSync(pkgpath, "utf8"));
    console.log(`(too) version ${version}`);
    process.exit(0);
  }
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
