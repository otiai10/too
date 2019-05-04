
export interface Spec {
    name: string;
    flags: string[];
    value: any[],
    add: (val: any, flag: any, next: any) => void,
};

export default class Args {

    private raw: string[] = [];
    constructor(private specs: Spec[]) {}

    parse(argv: string[]) {
        this.raw = argv.slice(2);
        this.raw.reduce<string[]>((prev, curr) => {
            if (/=/.test(curr)) return prev.concat(curr.split('='));
            return prev.concat([curr]);
        }, []).map((e: string, i: number, all: string[]) => {
            const spec = this.findApplicableSpec(e);
            if (!spec) return;
            spec.add(spec.value, all[i], all[i+1]);
        });
    }

    findApplicableSpec(key: string) {
        for (let i in this.specs) {
            const spec = this.specs[i];
            if (spec.flags && spec.flags.indexOf(key) >= 0) {
                return spec;
            }
        }
        return;
    }

    getSpecByName(key: string) {
        for (let i in this.specs) {
            const spec = this.specs[i];
            if (spec.name == key) {
                return spec;
            }
        }
        return;
    }

    get(key: string): string[] {
        const spec = this.getSpecByName(key);
        if (!spec) return [];
        return spec.value;
    }

    add(key: string, value: any) {
        const spec = this.getSpecByName(key);
        if (!spec) return;
        spec.add(spec.value, spec.name, value);    
    }

}
