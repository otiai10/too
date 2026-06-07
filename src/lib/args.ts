
export interface Spec {
    name: string;
    flags: string[];
    value: string[];
    add: (val: string[], flag: unknown, next: string) => void;
}

export class Args {

    private raw: string[] = [];
    constructor(private specs: Spec[]) {}

    public parse(argv: string[]): string[] {
        this.raw = argv.slice(2);
        const all = this.raw.reduce<string[]>((ctx, v) => {
            // Desugar `--flag=value` only for flag-like tokens, splitting on the
            // first `=` so command values (e.g. `-c 'vite --port=5173'`) and
            // values that themselves contain `=` pass through intact. (#295)
            if (/^-/.test(v) && v.includes("=")) {
                const i = v.indexOf("=");
                return ctx.concat([v.slice(0, i), v.slice(i + 1)]);
            }
            return ctx.concat([v]);
        }, []);
        const rest = [];
        while (all.length > 0) {
            const e = all[0];
            const spec = this.findApplicableSpec(e);
            if (spec) {
                spec.add(spec.value, e, all[0 + 1]);
                all.splice(0, 2);
            } else {
                rest.push(e);
                all.splice(0, 1);
            }
        }
        return rest;
    }

    public findApplicableSpec(key: string): Spec {
        return this.specs.filter((spec) => {
            return (spec.flags && spec.flags.indexOf(key) >= 0);
        })[0];
    }

    public getSpecByName(key: string): Spec {
        return this.specs.filter((spec) => {
            return (spec.name === key);
        })[0];
    }

    public get(key: string): string[] {
        const spec = this.getSpecByName(key);
        return spec ? spec.value : [];
    }

    public add(key: string, value: string): void {
        const spec = this.getSpecByName(key);
        if (spec) spec.add(spec.value, spec.name, value);
    }

}
