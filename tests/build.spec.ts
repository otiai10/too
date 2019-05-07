import build from "../src/lib/build";
import Command from "../src/lib/command";

describe("build", () => {
    it("should build command instance", () => {
        const cmd = build("echo hoge", 100);
        expect(cmd).toBeInstanceOf(Command);
    });
});
