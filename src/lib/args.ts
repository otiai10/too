
export default class Args {
    private raw: any;
    constructor(private spec: any) {}
    parse(argv: any) {
        this.raw = argv.slice(2);
        this.raw.reduce((prev: any, curr: any) => {
            if (/=/.test(curr)) return prev.concat(curr.split('='));
            return prev.concat([curr]);
        }, []).map((e: any, i: any, all: any) => {
            const spec = this.findApplicableSpec(e);
            if (!spec) return;
            spec.add(spec.value, all[i], all[i+1]);
        });
    }
    findApplicableSpec(key: any) {
        for (let i in this.spec) {
            const spec = this.spec[i];
            if (spec.flags && spec.flags.indexOf(key) >= 0) {
                return spec;
            }
        }
        return;
    }
    getSpecByName(key: any) {
        for (let i in this.spec) {
            const spec = this.spec[i];
            if (spec.name == key) {
                return spec;
            }
        }
        return;
    }
    get(key: any) {
        const spec = this.getSpecByName(key);
        if (!spec) return;
        return spec.value;
    }
    add(key: any, value: any) {
        const spec = this.getSpecByName(key);
        if (!spec) return;
        spec.add(spec.value, spec.name, value);    
    }
}
