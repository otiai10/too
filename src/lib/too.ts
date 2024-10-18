import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { createInterface } from 'readline';

import { ITooFile } from './file';
import { ParallelExecutor, SequentialExecutor } from './executor';
import { VarGenerator } from './var';

export class Too {
  version: number = 0;
  env: Record<string, string> = {};
  var: Record<string, VarGenerator> = {};
  public prep: SequentialExecutor;
  public main: ParallelExecutor;
  public post: SequentialExecutor;
  constructor(data: ITooFile) {
    this.version = data.version;
    this.env = data.env || {};
    this.var = Object.fromEntries(Object.entries(data.var || {}).map(([k, v]) => [k, new VarGenerator(v.generate, v.collect)]));
    this.prep = new SequentialExecutor(data.prep);
    this.main = new ParallelExecutor(data.main);
    this.post = new SequentialExecutor(data.post);
  }

  /**
   * Parse a file and return a Too instance.
   * Expecting a YAML file given as an argument.
   * @param fpath 
   * @returns 
   */
  static async parse(fpath: string): Promise<Too> {
    const data = await fs.promises.readFile(fpath);
    const obj = yaml.load(data.toString());
    const too = new Too(obj as ITooFile);
    for (const k in too.var) {
      const v = await too.var[k].value();
      // console.log(`${k}=${v}`);
      too.env[k] = v;
    }
    too.prep.env = { ...too.env };
    too.main.env = { ...too.env };
    too.post.env = { ...too.env };
    return too;
  }

  static async direct(cmds: string[]): Promise<Too> {
    const data = {
      version: 1,
      main: {
        jobs: cmds.map((cmd) => ({ run: cmd })),
      },
    } as ITooFile;
    return new Too(data);
  }

  static async interactive(io: {
    stdin?: NodeJS.ReadableStream;
    stdout?: NodeJS.WritableStream;
  } = {
    stdin: process.stdin,
    stdout: process.stdout,
  }): Promise<Too> {
    return new Promise((resolve) => {
      const data = { version: 0, main: { jobs: [], } } as ITooFile;
      const r = createInterface({
        input: io.stdin || process.stdin,
        output: io.stdout || process.stdout,
        prompt: "> ",
      });
      r.prompt();
      r.on("line", (line) => {
        if (line.trim().length === 0) { resolve(new Too(data)); r.close(); }
        else { data.main.jobs.push({ run: line }); r.prompt(); }
      });
    })
  }
}
