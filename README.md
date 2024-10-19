# too

[![Node.js CI](https://github.com/otiai10/too.js/actions/workflows/node.js.yml/badge.svg)](https://github.com/otiai10/too.js/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/otiai10/too.js/branch/main/graph/badge.svg?token=CAnYtu8IQV)](https://codecov.io/gh/otiai10/too.js)
[![Maintainability](https://api.codeclimate.com/v1/badges/7d0171c59182875438bf/maintainability)](https://codeclimate.com/github/otiai10/too.js/maintainability)
[![npm version](https://badge.fury.io/js/too.svg)](https://badge.fury.io/js/too)

The opposite of `tee` command, combining stdout/stderr from multiple commands and kill them with one signal (Ctrl+C).

```
-> command 1 stream ─┐
-> command 2 stream ─┤
                     └─ stdout/stderr/SIGINT to kill both
```

It means, you can write 2 parallel jobs in 1 npm script!!

```js
// package.json
{
    "scripts": {
        "start": "too --cmd 'rails s' --cmd 'webpack'"
        // Start server and client HMR in parallel,
        // and you can kill both by one Ctrl+C!!
    },
}
```

# Why?

Sometimes we do that,

```sh
% nohup rails server &
% nohup npm start-webpack &

# after you did some work

% pkill rails
% pkill webpack
```

I don't wanna do this any more, just wanna run multiple processes and kill them with one `Ctrl+C`!

# Usage

```sh
% too --cmd 'rails server' --cmd 'npm start-webpack'
```

Then you will get

```sh
[0] rails   # Rails log here
[1] npm     # NPM log here

# And you can kill both by one `Ctrl+C` (SIGINT)
```

# Too files

Or you can define your tasks on a yaml file

```yaml
# too.local.yaml
main:
    jobs:
    - run: rails server
    - run: npm start-webpack
```

then

```sh
% too ./too.local.yaml
```

# Install

```sh
% npm install too
```

# Issues

- https://github.com/otiai10/too.js/issues
