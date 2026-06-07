import { Command } from "../src/lib/command";
import { Logger } from "../src/lib/logger";

class NoopLogger extends Logger {
  stage(): void { /* noop */ }
  accept(): void { /* noop */ }
  output(): void { /* noop */ }
}
const logger = new NoopLogger();

// Inline `KEY=value cmd` is POSIX shell syntax (cmd.exe uses `set ...`), so the
// execution test is POSIX-only. The label-derivation tests are pure string logic.
const itPosix = process.platform === "win32" ? it.skip : it;

describe("Command binary/label derivation", () => {
  it("derives the binary after leading env assignments (#532)", () => {
    expect(new Command("FOO=bar node app.js").label).toBe("node");
    expect(new Command("A=1 B=2 npm run dev").label).toBe("npm");
  });

  it("uses the first token when there are no assignments", () => {
    expect(new Command("echo hello world").label).toBe("echo");
  });

  it("tolerates extra whitespace between tokens", () => {
    expect(new Command("  FOO=bar   node   app.js").label).toBe("node");
  });

  it("falls back to the only token when the command is bare env-like", () => {
    // No actual command following the assignment: keep the last token.
    expect(new Command("FOO=bar").label).toBe("FOO=bar");
  });
});

describe("Command execution", () => {
  itPosix("runs a command with a leading env assignment instead of failing lookup (#532)", async () => {
    const cmd = new Command(
      `FOO=bar node -e "process.exit(process.env.FOO === 'bar' ? 0 : 1)"`,
      {},
      undefined,
      logger,
    );
    await expect(cmd.exec()).resolves.toBe(0);
  }, 10000);

  itPosix("still rejects a genuinely missing binary with code 127", async () => {
    const cmd = new Command("definitely-not-a-real-binary-xyz", {}, undefined, logger);
    await expect(cmd.exec()).rejects.toMatchObject({ code: 127 });
  }, 10000);
});
