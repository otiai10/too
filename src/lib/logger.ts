import { RESET, UNDERLINE } from "./colors";

export abstract class Logger {
    abstract stage(stage: string): void;
    abstract accept(label: string, color: string, oneliner: string): void;
    abstract output(label: string, color: string, stdout: Buffer | string, stderr: Buffer | string): void;
}

export class DefaultLogger implements Logger {
    constructor(
        public verbose: boolean = true,
        private readonly stdout: NodeJS.WritableStream = process.stdout,
        private readonly stderr: NodeJS.WritableStream = process.stderr,
    ) { }
    stage(stage: string): void {
        this.stdout.write(`\n✅ ${stage}\n`);
    }
    accept(label: string, color: string, oneliner: string): void {
        this.stdout.write(`${color}[${label}]${RESET} ${UNDERLINE}${oneliner.trim()}${RESET}\n`);
    }
    output(label: string, color: string, stdout: Buffer | string, stderr: Buffer | string): void {
        if (stdout.length) stdout.toString().trim().split("\n").map((line: string) => {
            this.stdout.write(`${color}[${label}]${RESET} ${line}\n`);
        });
        if (stderr.length) stderr.toString().trim().split("\n").map((line: string) => {
            this.stderr.write(`${color}[${label}]${RESET} ${line}\n`);
        });
    }
}

// export class JsonRowsLogger implements Logger { }
