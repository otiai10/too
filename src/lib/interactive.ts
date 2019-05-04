import { createInterface } from 'readline';
import Args from './args';

const interactive = (args: Args): Promise<Args> => {
    return new Promise(resolve => {
        const r = createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> ',
        });
        r.prompt();
        r.on('line', line => {
            if (line.trim().length == 0) {
                resolve(args);
                r.close();
            } else {
                args.add('cmd', line);
                r.prompt();
            }
        });
    });
};

export default interactive;
