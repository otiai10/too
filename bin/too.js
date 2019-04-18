#! /usr/bin/env node

const spawn = require('child_process').spawn;

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
}

const __main__ = () => {
    const args = new Args([
        {
            name: 'cmd',
            flags: ['-c', '--cmd'],
            value: [],
            add: (val, flag, next) => { val.push(next); },
        },
    ]);
    args.parse(process.argv);
    args.get('cmd').map((cmd) => {
        const [spell, ...arg] = cmd.split(' ');
        spawn(spell, arg, {
            killSignal: 'SIGTERM',
            detached: false,
            stdio: ['inherit', 'inherit', 'inherit'],
            env: process.env, // TODO: additional env
        });
    });
};

__main__();
