import { spawn } from "child_process";
import { lookpath } from "lookpath";
import { colors, RESET, UNDERLINE } from "./colors";

export interface CommandOption {
  path: string[];
}

export default class Command {
  public color: string;
  constructor(
    private index: number,
    private spell: string,
    private args: string[],
    private opt: CommandOption = {path: []},
  ) {
    this.color = colors[index % colors.length];
  }
  public async start() {
    const bin = await lookpath(this.spell, {path: this.opt.path || []});
    if (!bin) { return Promise.reject({msg: `command not found: ${this.spell}`, code: 127}); }
    this.greet();
    const stream = spawn(this.spell, this.args, {
      // killSignal: 'SIGTERM',
      detached: false,
      env: {
        ...process.env,
        PATH: process.env.PATH + ":" + this.opt.path.join(":"),
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    stream.stdout.on("data", (chunk: Buffer) => {
      this.print(process.stdout, chunk);
    });
    stream.stderr.on("data", (chunk: Buffer) => {
      this.print(process.stderr, chunk);
    });
    stream.on("close", (code: number, signal: string) => {
      this.print(process.stdout, `exit code ${code}`);
    });
  }
  public print(target: NodeJS.WritableStream, text: Buffer | string) {
    text.toString().trim().split("\n").map((line: string) => {
      target.write(`${this.head()}\t${line}\n`);
    });
  }
  public head() {
    return `${this.color}[${this.index}] ${this.spell}${RESET}`;
  }
  /**
   * Show what is actually accepted.
   */
  public greet() {
    process.stdout.write(`${this.color}[${this.index}] ${UNDERLINE}${[this.spell, ...this.args].join(" ")}${RESET}\n`);
  }
}
