import Args from "../src/lib/args";
import specs from "../src/lib/flags";
import interactive from "../src/lib/interactive";
import Stream from "./mocks/stream";

describe("interactive", () => {
  it("should build commands interactively", async () => {
    const stdin = new Stream();
    const stdout = new Stream();
    const args = new Args(specs.slice(0));
    await interactive(args, { stdin, stdout });
    expect(args.get("cmd")[0]).toBe("echo 2000");
  });
});
