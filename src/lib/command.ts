// import { type ChildProcess, exec, spawn } from "child_process";
// import { lookpath } from "lookpath";
// import { RESET, UNDERLINE } from "./colors";
// import * as path from "path";

// const delimiter = path.delimiter;

// export interface CommandOption {
//   include: string[]; // Additional path
// }

// export default class Command {
//   public color: string;
//   public stdout: NodeJS.WritableStream = process.stdout;
//   public stderr: NodeJS.WritableStream = process.stderr;
//   constructor(
//     private index: number,
//     private spell: string,
//     private args: string[],
//     private opt: CommandOption = { include: [] },
//   ) {
//     this.color = colors[index % colors.length];
//   }
//   public async start(env = {}): Promise<ChildProcess> {
//     const bin = await lookpath(this.spell, {include: this.opt.include || []});
//     if (!bin) { return Promise.reject({msg: `command not found: ${this.spell}`, code: 127}); }
//     this.greet();
//     const stream = spawn(this.spell, this.args, {
//       detached: true,
//       env: {
//         ...process.env,
//         ...env,
//         PATH: [process.env.PATH, ...this.opt.include].join(delimiter),
//       },
//       shell: true,
//       stdio: ["pipe", "pipe", "pipe"],
//     });
//     stream.stdout.on("data", (chunk: Buffer) => {
//       this.print(this.stdout, chunk);
//     });
//     stream.stderr.on("data", (chunk: Buffer) => {
//       this.print(this.stderr, chunk);
//     });
//     stream.on("close", (code: number , signal: NodeJS.Signals) => {
//       this.print(this.stdout, `exit code ${code !== null ? code : signal}`);
//     });
//     return stream;
//   }
//   public print(target: NodeJS.WritableStream, text: Buffer | string): void {
//     text.toString().trim().split("\n").map((line: string) => {
//       target.write(`${this.head()}\t${line}\n`);
//     });
//   }
//   public head(): string {
//     return `${this.color}[${this.index}] ${this.spell}${RESET}`;
//   }

//   /**
//    * Execute the command synchronously.
//    */
//   public async exec(env = {}): Promise<number> {
//     const bin = await lookpath(this.spell, {include: this.opt.include || []});
//     if (!bin) { return Promise.reject({msg: `command not found: ${this.spell}`, code: 127}); }
//     this.greet();
//     const cmd = [this.spell, ...this.args].join(" ");
//     return new Promise((resolve, reject) => {
//       exec(cmd, {
//         env: {
//           ...process.env,
//           ...env,
//         },
//       }, (err, stdout, stderr) => {
//         if (err) return reject(err);
//         if (stdout) this.print(this.stdout, stdout);
//         if (stderr) this.print(this.stderr, stderr);
//         return resolve(0);
//       });
//     });
//   }

//   /**
//    * Show what is actually accepted.
//    */
//   public greet(): void {
//     this.stdout.write(`${this.color}[${this.index}] ${UNDERLINE}${[this.spell, ...this.args].join(" ")}${RESET}\n`);
//   }
//   public static async cleanup(subprocesses: ChildProcess[], signal: NodeJS.Signals): Promise<boolean[]> {
//     const promises: Promise<boolean>[] = [];
//     subprocesses.forEach((proc) => {
//       promises.push(new Promise((resolve) => {
//         try {
//           if (proc.pid) process.kill(-proc.pid, signal);
//         } catch (err) {
//           const error = err as { code?: string, message?: string };
//           if (error.code === "ESRCH") return resolve(true);
//           console.error((err as { message?: string }).message);
//           resolve(false);
//         }
//         proc.on("close", () => resolve(true));
//       }));
//     });
//     return Promise.all(promises);
//   }
// }
