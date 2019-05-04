import * as fs from "fs";
import * as path from "path";
import Command from "./command";

const getAdditionalPATH = () => {
  const additionals = [];
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "package.json"))) {
    additionals.push(path.join(cwd, "node_modules", ".bin"));
  }
  return additionals;
};

const build = (cmdliketext: string, index: number) => {
  const [spell, ...args] = cmdliketext.split(" ");
  const additionalPath = getAdditionalPATH();
  return new Command(index, spell, args, {path: additionalPath});
};

export default build;
