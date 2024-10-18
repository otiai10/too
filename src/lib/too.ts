import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as child_process from 'child_process';
import { IParallel, ISequential, ITooFile } from './file';
import * as path from 'path';
import { lookpath } from 'lookpath';
import { CYAN, getColorByIndex, RESET, UNDERLINE } from './colors';

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
}

class VarGenerator {
  private __value?: string;
  constructor(
    private generate: string,
    private collect: "stdout" | "stderr" = "stdout",
  ) { }
  async value(): Promise<string> {
    if (this.__value) { return this.__value; }
    return new Promise((resolve, reject) => {
      child_process.exec(this.generate, (err, stdout, stderr) => {
        if (err) { return reject(err); }
        this.__value = (this.collect === "stdout" ? stdout : stderr).trim();
        resolve(this.__value);
      });
    })
  }
}

class SequentialExecutor {
  public steps: Command[] = [];
  constructor(
    public definition: ISequential = { steps: [] },
    public env: Record<string, string> = {},
  ) {
    for (let i = 0; i < definition.steps.length; i++) {
      const step = definition.steps[i];
      const cmd = new Command(step.run, env, getColorByIndex(i), step.label);
      this.steps.push(cmd);
    }
  }
  async run() {
    for (const step of this.steps) {
      step.env = { ...step.env, ...this.env };
      await step.exec();
    }
  }
}

class ParallelExecutor {
  jobs: Command[] = [];
  procs: child_process.ChildProcess[] = [];
  constructor(
    public definition: IParallel,
    public env: Record<string, string> = {},
  ) {
    for (let i = 0; i < definition.jobs.length; i++) {
      const job = definition.jobs[i];
      const cmd = new Command(job.run, env, getColorByIndex(i), job.label);
      this.jobs.push(cmd);
    }
  }
  async run() {
    for (const job of this.jobs) {
      job.env = { ...job.env, ...this.env };
      this.procs.push(await job.start());
    }
    await this.wait();
  }
  public async cleanup(signal: NodeJS.Signals): Promise<boolean[]> {
    const promises: Promise<boolean>[] = [];
    this.procs.forEach((proc) => {
      promises.push(new Promise((resolve) => {
        try {
          if (proc.pid) process.kill(-proc.pid, signal);
        } catch (err) {
          const error = err as { code?: string, message?: string };
          if (error.code === "ESRCH") return resolve(true);
          console.error((err as { message?: string }).message);
          resolve(false);
        }
        proc.on("close", () => resolve(true));
      }));
    });
    return Promise.all(promises);
  }
  private wait() {
    return Promise.all(this.procs.map((proc) => {
      return new Promise((resolve, reject) => {
        proc.on("exit", (code, signal) => {
          if (code !== 0) reject({ code, signal });
          else resolve(code);
        });
      });
    }));
  }
}

class Command {

  public stdout: NodeJS.WritableStream = process.stdout;
  public stderr: NodeJS.WritableStream = process.stderr;
  public label: string;

  private command: string;
  private args: string[];

  constructor(
    public oneliner: string,
    public env: Record<string, string> = {},
    public color: string = CYAN,
    label?: string,
  ) {
    const [c, ...a] = this.oneliner.split(" ");
    this.command = c;
    this.args = a;
    this.label = label || this.command;
  }

  public async start(): Promise<child_process.ChildProcess> {
  
    const bin = await lookpath(this.command, { include: this.path() });
    if (!bin) { return Promise.reject({msg: `command not found: ${this.command}`, code: 127}); }
  
    this.greet();

    const stream = child_process.spawn(this.command, this.args, {
      detached: true,
      env: {
        ...process.env, ...this.env,
        PATH: this.path().join(path.delimiter),
      },
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    stream.stdout.on("data", (chunk: Buffer) => {
      this.print(this.stdout, chunk);
    });
    stream.stderr.on("data", (chunk: Buffer) => {
      this.print(this.stderr, chunk);
    });
    stream.on("close", (code: number , signal: NodeJS.Signals) => {
      this.print(this.stdout, `exit code ${code !== null ? code : signal}`);
    });
    return stream;
  }

  private path() {
    const additionals = [];
    const cwd = process.cwd();
    if ((path.join(cwd, "package.json"))) {
      additionals.push(path.join(cwd, "node_modules", ".bin"));
    }
    return [process.env.PATH || "", ...additionals];
  }

  /**
   * Execute the command synchronously.
   */
  public async exec(env = this.env): Promise<number> {
    const bin = await lookpath(this.command, { include: this.path() });
    if (!bin) { return Promise.reject({ msg: `command not found: ${this.command}`, code: 127 }); }

    this.greet();

    return new Promise((resolve, reject) => {
      child_process.exec(this.oneliner, {
        env: {
          ...process.env,
          ...env,
        },
      }, (err, stdout, stderr) => {
        if (err) return reject(err);
        if (stdout) this.print(this.stdout, stdout);
        if (stderr) this.print(this.stderr, stderr);
        return resolve(0);
      });
    });
  }

  // TODO: たぶん外もっていったほうがいい
  public greet(): void {
    this.stdout.write(`${this.color}[${this.label}] ${UNDERLINE}${this.oneliner}${RESET}\n`);
  }
  public head(): string {
    return `${this.color}[${this.label}]${RESET}`;
  }
  public print(target: NodeJS.WritableStream, text: Buffer | string): void {
    text.toString().trim().split("\n").map((line: string) => {
      target.write(`${this.head()}\t${line}\n`);
    });
  }
}