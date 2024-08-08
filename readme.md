# nprocmon [![npm version](https://img.shields.io/npm/v/nprocmon.svg?style=flat)](https://www.npmjs.com/package/nprocmon)

Execute multiple tasks in parallel and start, stop, or restart them easily using a TUI interface and keyboard shortcuts.

![image](https://github.com/dlacaille/nprocmon/assets/6683854/bebfc08f-449c-4259-bda8-24541542f763)

## Install

```bash
$ npm install --global nprocmon
```

## CLI

```
Usage
  $ nprocmon

Options
  --config       The configuration file to use
  --no-auto      Disable autorun for all processes
  --no-deps      Disable dependencies
  --exclude, -e  Exclude processes that match this pattern (supports wildcards)

Examples
  $ nprocmon
  Will open nprocmon with the default config nprocmon.yaml

  $ nprocmon --config=./myconfig.yaml
  Will open nprocmon with a different config file

  $ nprocmon -e build*
  Excludes all processes starting with build
```
