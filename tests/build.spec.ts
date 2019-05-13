import build from "../src/lib/build";
import Command from "../src/lib/command";

import Stream from "./mocks/stream";

describe("build", () => {
    it("should build command instance", async () => {
        const cmd = build("echo hoge", 100);
        expect(cmd).toBeInstanceOf(Command);
        cmd.stdout = new Stream();
        await cmd.start();
    });
});
