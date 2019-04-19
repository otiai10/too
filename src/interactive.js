const readline = require('readline');

/**
 * @param {*} args 
 * @returns Promise<Args>
 */
const interactive = (args) => {
    return new Promise(resolve => {
        const r = readline.createInterface({
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

module.exports = interactive;
