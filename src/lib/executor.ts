import * as child_process from 'child_process';
import { IParallel, ISequential } from './file.js';
import { getColorByIndex } from './colors.js';
import { Command } from './command.js';
import { DefaultLogger, Logger } from './logger.js';

export class SequentialExecutor {
  public steps: Command[] = [];
  constructor(
    public state: string,
    public definition: ISequential = { steps: [] },
    public env: Record<string, string> = {},
    public logger: Logger = new DefaultLogger(),
  ) {
    for (let i = 0; i < definition.steps.length; i++) {
      const step = definition.steps[i];
      const cmd = new Command(step.run, env, getColorByIndex(i), logger, step.label);
      this.steps.push(cmd);
    }
    const maxWidth = this.steps.reduce((max, cmd) => Math.max(max, cmd.label.length), 0);
    this.logger.maxLabelWidth = Math.max(this.logger.maxLabelWidth, maxWidth);
  }
  async run() {
    if (this.steps.length === 0) return;
    this.logger.stage(this.state);
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
    public state: string,
    public definition: IParallel,
    public env: Record<string, string> = {},
    public logger: Logger = new DefaultLogger(),
  ) {
    for (let i = 0; i < definition.jobs.length; i++) {
      const job = definition.jobs[i];
      const cmd = new Command(job.run, env, getColorByIndex(i), logger, job.label);
      this.jobs.push(cmd);
    }
    const maxWidth = this.jobs.reduce((max, cmd) => Math.max(max, cmd.label.length), 0);
    this.logger.maxLabelWidth = Math.max(this.logger.maxLabelWidth, maxWidth);
  }
  async run() {
    this.logger.stage(this.state);
    for (const job of this.jobs) {
      job.env = { ...job.env, ...this.env };
      this.procs.push(await job.start());
    }
    await this.wait();
  }
  public async cleanup(signal: NodeJS.Signals): Promise<boolean[]> {
    const promises: Promise<boolean>[] = this.procs.map((proc) => {
      return new Promise<boolean>((resolve) => {
        // Already exited (e.g. the job that triggered the failure): nothing to kill.
        if (proc.exitCode !== null || proc.signalCode !== null) return resolve(true);
        // Resolve only once the child has actually closed, so callers can await teardown.
        proc.on("close", () => resolve(true));
        try {
          // Negative pid signals the whole process group (requires detached children).
          if (proc.pid) process.kill(-proc.pid, signal);
          else resolve(true);
        } catch (err) {
          const error = err as { code?: string, message?: string };
          if (error.code === "ESRCH") return resolve(true);
          console.error(error.message);
          resolve(false);
        }
      });
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
