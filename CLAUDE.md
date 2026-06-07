# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`too` is the opposite of the `tee` command: it runs multiple child processes in parallel, multiplexes their stdout/stderr into one labeled, colorized stream, and tears them all down with a single `Ctrl+C` (SIGINT). The main use case is running several long-lived dev processes (e.g. a server + a bundler) from one `npm` script. Published to npm as `too`; the binary is `dist/bin/too.js`.

## Commands

```sh
npm run build      # tsc -> dist/
npm run lint       # eslint over ./src and ./tests
npm test           # jest (ts-jest, collects coverage from src/lib)
npm run test:bin   # build, then smoke-test the real binary with sample -c commands
make build         # lint + build + test + test:bin + chmod the binary (full gate)
```

Run a single test file or test:
```sh
npx jest tests/args.spec.ts
npx jest -t "name of the test case"
```

Try the CLI locally without installing:
```sh
node ./dist/bin/too.js -c 'echo foo' -c 'sleep 2' -c 'echo bar'
```

ESLint/TypeScript/Jest all expect ESM (`"type": "module"`). Note the jest `moduleNameMapper` rewrites `.js` import specifiers back to source — this is why all internal imports are written as `./foo.js` even though the files are `.ts`.

## Three ways to invoke (resolved in `src/bin/too.ts`)

1. **YAML file**: `too ./too.local.yaml` — first non-flag arg → `Too.parse()`.
2. **Direct flags**: `too -c 'cmd1' -c 'cmd2'` (`-c`/`--cmd`, repeatable) → `Too.direct()`.
3. **Interactive**: bare `too` → `Too.interactive()` reads commands from a readline prompt, one per line, until a blank line.

`-V`/`--version` (or `version` subcommand) prints the version from `package.json` and exits.

## Architecture

The pipeline is **prep → main → post**, modeled on the `ITooFile` shape (`src/lib/file.ts`):

- **`Too`** (`src/lib/too.ts`) — top-level orchestrator. Builds three executors from a parsed too-file, resolves `var` generators and `include.env_files` into the shared `env`, then runs the stages in order. Installs the `SIGINT` handler that calls `main.cleanup("SIGINT")` then `post.run()`. A non-zero exit in prep or main short-circuits to post and returns the failing code.
- **`SequentialExecutor`** (prep, post) — runs steps one-by-one via `Command.exec()` (buffered `child_process.exec`).
- **`ParallelExecutor`** (main) — `start()`s every job concurrently via `Command.start()` (streaming `child_process.spawn`), then `wait()`s on all exits. `cleanup()` kills the whole process group of each child (`process.kill(-pid, signal)`), tolerating `ESRCH`.
- **`Command`** (`src/lib/command.ts`) — wraps one shell one-liner. `start()` streams stdout/stderr chunk-by-chunk to the logger; `exec()` runs to completion and logs buffered output. The binary to check existence is the first whitespace token; resolution uses `lookpath` with `<cwd>/node_modules/.bin` prepended to PATH so project-local bins work. Commands run with `shell: true`.
- **`VarGenerator`** (`src/lib/var.ts`) — a `var:` entry whose `generate` shell command is run once, its `stdout` (or `stderr`) memoized and injected into `env` (e.g. `CURRENT_DATE: { generate: "date +%Y" }`).
- **`Args`/`specs`** (`src/lib/args.ts`, `src/lib/specs.ts`) — tiny custom flag parser. Each `Spec` declares `flags`, a `name`, an accumulator `value` array, and an `add` callback. Supports `--flag=value` and `--flag value`; unmatched tokens are returned as `rest`.
- **`Logger`/`DefaultLogger`** (`src/lib/logger.ts`) — abstract sink for `stage`/`accept`/`output`. Labels are padded to `maxLabelWidth` (computed by each executor over its commands) and colorized via `getColorByIndex` (`src/lib/colors.ts`, round-robin palette). To change output format (e.g. JSON), subclass `Logger` and assign `too.logger`.

## too-file format (YAML)

Top-level keys: `version`, `env` (static vars), `var` (generated vars), `include.env_files` (KEY=VALUE files merged into env), `prep`/`post` (`{ steps: [{ run, label?, name?, ignore_error? }] }`), and `main` (`{ jobs: [{ run, label?, name? }] }`). `${VAR}` expansion in `run` strings is handled by the shell at spawn time, not by `too`. See `example/simple-01.yaml` for a working file and `example/too.local.yaml` for the full feature surface (some commented-out keys there are aspirational, not yet implemented).
