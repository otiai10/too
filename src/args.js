
class Args {
    constructor(spec) {
        this.spec = spec;
    }
    parse(argv) {
        this._raw = argv.slice(2);
        this._raw.reduce((prev, curr) => {
            if (/=/.test(curr)) return prev.concat(curr.split('='));
            return prev.concat([curr]);
        }, []).map((e, i, all) => {
            const spec = this.findApplicableSpec(e);
            if (!spec) return;
            spec.add(spec.value, all[i], all[i+1]);
        });
    }
    findApplicableSpec(key) {
        for (let i in this.spec) {
            const spec = this.spec[i];
            if (spec.flags && spec.flags.indexOf(key) >= 0) {
                return spec;
            }
        }
        return;
    }
    getSpecByName(key) {
        for (let i in this.spec) {
            const spec = this.spec[i];
            if (spec.name == key) {
                return spec;
            }
        }
        return;
    }
    get(key) {
        const spec = this.getSpecByName(key);
        if (!spec) return;
        return spec.value;
    }
    add(key, value) {
        const spec = this.getSpecByName(key);
        if (!spec) return;
        spec.add(spec.value, spec.name, value);    
    }
}

module.exports = Args;
