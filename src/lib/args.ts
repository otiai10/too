
export interface Spec {
    name: string;
    flags: string[];
    value: any[];
    add: (val: any, flag: any, next: any) => void;
}

export default class Args {

    private raw: string[] = [];
    constructor(private specs: Spec[]) {}

    public parse(argv: string[]) {
        this.raw = argv.slice(2);
        this.raw.reduce<string[]>((prev, curr) => {
            if (/=/.test(curr)) { return prev.concat(curr.split("=")); }
            return prev.concat([curr]);
        }, []).map((e: string, i: number, all: string[]) => {
            const spec = this.findApplicableSpec(e);
            if (!spec) { return; }
            spec.add(spec.value, all[i], all[i + 1]);
        });
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
        if (!spec) { return []; }
        return spec.value;
    }

    public add(key: string, value: any) {
        const spec = this.getSpecByName(key);
        if (!spec) { return; }
        spec.add(spec.value, spec.name, value);
    }

}
