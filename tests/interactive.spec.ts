import { Too } from "../src/lib/too";
import Stream from "./mocks/stream";

describe("interactive", () => {
  it("should build commands interactively", async () => {
    const stdin = new Stream();
    const stdout = new Stream();
    const too = await Too.interactive({ stdin, stdout });
    expect(too.main.jobs[0].oneliner).toBe("echo 2000");
  });
});
