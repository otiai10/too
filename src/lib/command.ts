import * as child_process from 'child_process';
import * as path from 'path';
import { lookpath } from 'lookpath';
import { CYAN, RESET, UNDERLINE } from './colors';

export class Command {

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
    // FIXME: 乱暴な分割なので、スペースを含む引数に対応する
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
      if (code !== 0) {
        this.print(this.stdout, `exit code ${code !== null ? code : signal}`);
      }
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