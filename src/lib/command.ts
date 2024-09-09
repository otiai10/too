import { type ChildProcess, spawn } from "child_process";
import { lookpath } from "lookpath";
import { colors, RESET, UNDERLINE } from "./colors";
import path = require("path");

const delimiter = path.delimiter;

export interface CommandOption {
  include: string[]; // Additional path
}

export default class Command {
  public color: string;
  public stdout: NodeJS.WritableStream = process.stdout;
  public stderr: NodeJS.WritableStream = process.stderr;
  constructor(
    private index: number,
    private spell: string,
    private args: string[],
    private opt: CommandOption = { include: [] },
  ) {
    this.color = colors[index % colors.length];
  }
  public async start(): Promise<ChildProcess> {
    const bin = await lookpath(this.spell, {include: this.opt.include || []});
    if (!bin) { return Promise.reject({msg: `command not found: ${this.spell}`, code: 127}); }
    this.greet();
    const stream = spawn(this.spell, this.args, {
      detached: false,
      env: {
        ...process.env,
        PATH: [process.env.PATH, ...this.opt.include].join(delimiter),
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    stream.stdout.on("data", (chunk: Buffer) => {
      this.print(this.stdout, chunk);
    });
    stream.stderr.on("data", (chunk: Buffer) => {
      this.print(this.stderr, chunk);
    });
    stream.on("close", (code: number /* , signal: any */) => {
      this.print(this.stdout, `exit code ${code}`);
    });
    stream.on("SIGINT", () => this.goodbye("SIGINT", stream));
    return stream;
  }
  public print(target: NodeJS.WritableStream, text: Buffer | string): void {
    text.toString().trim().split("\n").map((line: string) => {
      target.write(`${this.head()}\t${line}\n`);
    });
  }
  public head(): string {
    return `${this.color}[${this.index}] ${this.spell}${RESET}`;
  }
  /**
   * Show what is actually accepted.
   */
  public greet(): void {
    this.stdout.write(`${this.color}[${this.index}] ${UNDERLINE}${[this.spell, ...this.args].join(" ")}${RESET}\n`);
  }
  public goodbye(signal: NodeJS.Signals, proc: ChildProcess): void {
    this.stdout.write(`${this.color}[${this.index}] ${UNDERLINE}${signal}${RESET}\n`);
    proc.kill(signal);
  }

  public static async cleanup(subprocesses: ChildProcess[], signal: NodeJS.Signals): Promise<boolean[]> {
    return Promise.all(subprocesses.map((cmd) => cmd.kill(signal)));
  }
}
