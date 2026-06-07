import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ParallelExecutor, SequentialExecutor } from "../src/lib/executor";
import { Logger } from "../src/lib/logger";
import { Too } from "../src/lib/too";

class NoopLogger extends Logger {
  stage(): void { /* noop */ }
  accept(): void { /* noop */ }
  output(): void { /* noop */ }
}

const logger = new NoopLogger();

// Records what reached the logger, so tests can assert which steps ran / were logged.
class RecordingLogger extends Logger {
  public outputs: string[] = [];
  stage(): void { /* noop */ }
  accept(): void { /* noop */ }
  output(_label: string, _color: string, stdout: Buffer | string, stderr: Buffer | string): void {
    this.outputs.push(`${stdout}${stderr}`);
  }
}

// These tests spawn real POSIX shells and rely on process-group signalling
// (process.kill(-pid), `cmd &`, SIGTERM). That model is POSIX-only, so skip on Windows.
const itPosix = process.platform === "win32" ? it.skip : it;

/** Returns true if a process with the given pid is still alive. */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as { code?: string }).code !== "ESRCH";
  }
}

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((r) => setTimeout(r, 50));
  }
}

describe("ParallelExecutor.cleanup", () => {
  itPosix("terminates the whole process tree, not just the direct child (#529)", async () => {
    const pidfile = path.join(os.tmpdir(), `too-grandchild-${process.pid}.pid`);
    if (fs.existsSync(pidfile)) fs.unlinkSync(pidfile);

    // The shell backgrounds a `sleep` grandchild and records its pid, then waits.
    const ex = new ParallelExecutor(
      "MAIN",
      { jobs: [{ run: `sleep 30 & echo $! > ${pidfile}; wait` }] },
      {},
      logger,
    );
    // run() rejects once the job is killed by a signal (wait() sees a non-zero exit);
    // attach the catch synchronously so there is never an unhandled-rejection window.
    const running = ex.run().catch(() => undefined);

    await waitFor(() => fs.existsSync(pidfile) && fs.readFileSync(pidfile, "utf8").trim().length > 0);
    const grandchildPid = parseInt(fs.readFileSync(pidfile, "utf8").trim(), 10);
    expect(alive(grandchildPid)).toBe(true);

    await ex.cleanup("SIGTERM");
    await running;

    await waitFor(() => !alive(grandchildPid));
    expect(alive(grandchildPid)).toBe(false);

    fs.unlinkSync(pidfile);
  }, 20000);

  itPosix("resolves immediately for already-exited processes", async () => {
    const ex = new ParallelExecutor("MAIN", { jobs: [{ run: "true" }] }, {}, logger);
    await ex.run(); // job exits 0 on its own
    await expect(ex.cleanup("SIGTERM")).resolves.toEqual([true]);
  }, 10000);
});

describe("Too failure path", () => {
  itPosix("tears down surviving sibling jobs when one job fails (#530)", async () => {
    const too = await Too.direct(['node -e "process.exit(1)"', "sleep 30"]);
    too.logger = logger;
    too.main.logger = logger;

    const code = await too.run();
    expect(code).toBe(1);

    const sleepProc = too.main.procs.find((p) => /sleep/.test((p.spawnargs || []).join(" ")));
    expect(sleepProc?.pid).toBeDefined();
    await waitFor(() => !alive(sleepProc!.pid!));
    expect(alive(sleepProc!.pid!)).toBe(false);
  }, 20000);
});

describe("SequentialExecutor ignore_error (#531)", () => {
  // The exec() of each step is stubbed so the branch logic is tested deterministically
  // and cross-platform (no real spawning / shell-quoting concerns).
  function executorWith(
    steps: { label: string; ignore_error?: boolean }[],
    behaviors: (() => Promise<number>)[],
    rec: RecordingLogger,
  ): SequentialExecutor {
    const def = { steps: steps.map((s) => ({ run: `cmd-${s.label}`, label: s.label, ignore_error: s.ignore_error })) };
    const ex = new SequentialExecutor("PREP", def, {}, rec);
    ex.steps.forEach((cmd, i) => { cmd.exec = behaviors[i]; });
    return ex;
  }

  it("continues the stage when an ignored step fails, and logs it", async () => {
    const rec = new RecordingLogger();
    const second = jest.fn(async () => 0);
    const ex = executorWith(
      [{ label: "boom", ignore_error: true }, { label: "ok" }],
      [async () => { throw { code: 3, message: "boom failed" }; }, second],
      rec,
    );
    await expect(ex.run()).resolves.toBeUndefined();
    expect(second).toHaveBeenCalled();
    expect(rec.outputs.some((o) => /ignored error/.test(o))).toBe(true);
  });

  it("still aborts the stage when a non-ignored step fails", async () => {
    const rec = new RecordingLogger();
    const second = jest.fn(async () => 0);
    const ex = executorWith(
      [{ label: "boom" }, { label: "ok" }],
      [async () => { throw { code: 3, message: "boom failed" }; }, second],
      rec,
    );
    await expect(ex.run()).rejects.toMatchObject({ code: 3 });
    expect(second).not.toHaveBeenCalled();
  });

  it("ignores a command-not-found (127) failure too", async () => {
    const rec = new RecordingLogger();
    const second = jest.fn(async () => 0);
    const ex = executorWith(
      [{ label: "missing", ignore_error: true }, { label: "ok" }],
      [async () => { throw { code: 127, msg: "command not found: nope" }; }, second],
      rec,
    );
    await expect(ex.run()).resolves.toBeUndefined();
    expect(second).toHaveBeenCalled();
    expect(rec.outputs.some((o) => /command not found/.test(o))).toBe(true);
  });
});
