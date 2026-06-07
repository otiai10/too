import { Too } from "../src/lib/too";

// Too.parse() resolves the file's `var` generators, and example/too.local.yaml's
// `var.DATE` runs `date '+...'` (POSIX shell syntax), so this is POSIX-only.
const itPosix = process.platform === "win32" ? it.skip : it;

describe("Too.parse include.env_files (#533)", () => {
  itPosix("loads the example's declared env files into the environment", async () => {
    const too = await Too.parse("example/too.local.yaml");
    // From example/secrets.env
    expect(too.env.API_TOKEN).toBe("replace-me");
    expect(too.env.SLACK_WEBHOOK).toBe("https://example.invalid/hook");
    // Static env: still present alongside the included values
    expect(too.env.PROJECT_ID).toBe("triax-football");
    // And propagated to the stages, so jobs can see them
    expect(too.main.env.API_TOKEN).toBe("replace-me");
  });
});
