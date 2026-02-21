import { RESET, UNDERLINE } from "./colors.js";

export abstract class Logger {
    maxLabelWidth: number = 0;
    abstract stage(stage: string): void;
    abstract accept(label: string, color: string, oneliner: string): void;
    abstract output(label: string, color: string, stdout: Buffer | string, stderr: Buffer | string): void;
}

export class DefaultLogger extends Logger {
    constructor(
        public verbose: boolean = true,
        private readonly stdout: NodeJS.WritableStream = process.stdout,
        private readonly stderr: NodeJS.WritableStream = process.stderr,
    ) { super(); }
    stage(stage: string): void {
        this.stdout.write(`\n✅ ${stage}\n`);
    }
    accept(label: string, color: string, oneliner: string): void {
        const padded = label.padEnd(this.maxLabelWidth);
        this.stdout.write(`${color}[${padded}]${RESET} ${UNDERLINE}${oneliner.trim()}${RESET}\n`);
    }
    output(label: string, color: string, stdout: Buffer | string, stderr: Buffer | string): void {
        const padded = label.padEnd(this.maxLabelWidth);
        if (stdout.length) stdout.toString().trim().split("\n").map((line: string) => {
            this.stdout.write(`${color}[${padded}]${RESET} ${line}\n`);
        });
        if (stderr.length) stderr.toString().trim().split("\n").map((line: string) => {
            this.stderr.write(`${color}[${padded}]${RESET} ${line}\n`);
        });
    }
}

// export class JsonRowsLogger implements Logger { }
