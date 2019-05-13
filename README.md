# too

[![CircleCI](https://circleci.com/gh/otiai10/too.js.svg?style=svg)](https://circleci.com/gh/otiai10/too.js)
[![codecov](https://codecov.io/gh/otiai10/too.js/branch/master/graph/badge.svg)](https://codecov.io/gh/otiai10/too.js)
[![npm version](https://badge.fury.io/js/too.svg)](https://badge.fury.io/js/too)

The opposite of `tee` command, combining stdout/stderr from multiple commands and kill them with one signal (Ctrl+C).

```
-> command 1 stream ─┐
-> command 2 stream ─┤
                     └─ stdout/stderr/SIGINT to kill both
```

This is JavaScript implementation of [`too`](https://github.com/otiai10/too).

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

# Install

```sh
% npm install too
```
