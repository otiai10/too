
export interface Spec {
    name: string;
    flags: string[];
    value: string[];
    add: (val: string[], flag: unknown, next: string) => void;
}

export default class Args {

    private raw: string[] = [];
    constructor(private specs: Spec[]) {}

    public parse(argv: string[]): string[] {
        this.raw = argv.slice(2);
        const all = this.raw.reduce<string[]>((ctx, v) => {
            if (/=/.test(v)) { return ctx.concat(v.split("=")); }
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
