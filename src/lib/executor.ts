import * as child_process from 'child_process';
import { IParallel, ISequential } from './file';
import { getColorByIndex } from './colors';
import { Command } from './command';

export class SequentialExecutor {
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

export class ParallelExecutor {
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
