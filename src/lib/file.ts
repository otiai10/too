import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as child_process from 'child_process';
import Command from './command';
import build from './build';

interface ITooFile {
    version: number;
    include: string[];
    env?: Record<string, string>;
    var?: Record<string, IVarPicker>;
    prep?: ISequential;
    main: IParallel;
    post?: ISequential;
}
interface ISequential {
    steps: {
        name: string;
        run: string;
        ignore_error?: boolean;
    }[];
}
interface IParallel {
    jobs: {
        name: string;
        label: string;
        run: string;
    }[];
}
interface IVarPicker {
    use?: string;
    generate: string;
    pick?: "stdout" | "stderr";
}

export class Too {
  version: number = 0;
  env: Record<string, string> = {};
  var: Record<string, VarGenerator> = {};
  _prep: Command[] = [];
  _main: Command[] = [];
  _post: Command[] = [];
  constructor(data: ITooFile) {
    this.version = data.version;
    this.env = data.env || {};
    this.var = Object.fromEntries(Object.entries(data.var || {}).map(([k, v]) => [k, new VarGenerator(v.generate, v.pick)]));
    this._prep = data.prep?.steps.map((step, index) => build(step.run, index)) || [];
    this._main = data.main.jobs.map((job, index) => build(job.run, index)) || [];
    this._post = data.post?.steps.map((step, index) => build(step.run, index)) || [];
  }
  static async parse(fpath: string): Promise<Too> {
    const data = await fs.readFile(fpath);
    const obj = yaml.load(data.toString());
    const too = new Too(obj as ITooFile);
    for (const k in too.var) {
      const v = await too.var[k].value();
      console.log(`${k}=${v}`);
    }
    return too;
  }

  async prep(): Promise<void> {
    console.log("STAGE [prep]", process.cwd())
    const env = { ...this.env };
    for (const key of Object.keys(this.var)) {
      env[key] = await this.var[key].value();
    }
    for (const cmd of this._prep) {
      await cmd.exec(env);
    }
  }

  async main(): Promise<child_process.ChildProcess[]> {
    console.log("STAGE [main]", process.cwd())
    const env = { ...this.env };
    for (const key of Object.keys(this.var)) {
      env[key] = await this.var[key].value();
    }
    const subprocesses: child_process.ChildProcess[] = await Promise.all(this._main.map((cmd) => cmd.start(env)));
    return subprocesses;
  }

  async post(): Promise<void> {
    console.log("STAGE [post]")
    const env = { ...this.env };
    for (const key of Object.keys(this.var)) {
      env[key] = await this.var[key].value();
    }
    for (const cmd of this._post) {
      await cmd.exec(env);
    }
  }
}

class VarGenerator {
  private __value?: string;
  constructor(
    private generate: string,
    private pick: "stdout" | "stderr" = "stdout",
    // private use: string = "bash",
  ) { }
  async value(): Promise<string> {
    if (this.__value) { return this.__value; }
    return new Promise((resolve, reject) => {
      child_process.exec(this.generate, (err, stdout, stderr) => {
        if (err) { return reject(err); }
        this.__value = (this.pick === "stdout" ? stdout : stderr).trim();
        resolve(this.__value);
      });
    })
  }
}
