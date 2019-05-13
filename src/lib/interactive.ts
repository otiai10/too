import { createInterface } from "readline";
import Args from "./args";

export interface IO {
    stdin?: NodeJS.ReadableStream;
    stdout?: NodeJS.WritableStream;
}

const interactive = (args: Args, io: IO = {
    stdin: process.stdin,
    stdout: process.stdout,
}): Promise<Args> => {
    return new Promise((resolve) => {
        const r = createInterface({
            input: io.stdin || process.stdin,
            output: io.stdout || process.stdout,
            prompt: "> ",
        });
        r.prompt();
        r.on("line", (line) => {
            if (line.trim().length === 0) {
                resolve(args);
                r.close();
            } else {
                args.add("cmd", line);
                r.prompt();
            }
        });
    });
};

export default interactive;
