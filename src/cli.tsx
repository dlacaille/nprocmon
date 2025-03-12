#!/usr/bin/env node
import React from 'react'
import ReactCurse from 'react-curse'
import fs from 'node:fs'
import meow from 'meow'
import Main from './main.js'
import { store } from './store.js'
import { Provider } from 'react-redux'
import { checkOrCreateLockFile } from './utils/lockfile.js'

const cli = meow(
    `
    Usage
      $ nprocmon

    Options
      --config, -c   The configuration file to use
      --no-auto      Disable autorun for all processes
      --no-deps      Disable dependencies
      --exclude, -e  Exclude processes that match this pattern (supports wildcards)
      --param, -p    Add extra parameters to every command

    Examples
      $ nprocmon
      Will open nprocmon with the default config nprocmon.yaml

      $ nprocmon --config=./myconfig.yaml
      Will open nprocmon with a different config file

      $ nprocmon -e build*
      Excludes all processes starting with build

      $ nprocmon -p=--no-build
      Adds a parameter to all commands
    `,
    {
        importMeta: import.meta,
        flags: {
            config: {
                type: 'string',
                shortFlag: 'c',
            },
            exclude: {
                type: 'string',
                shortFlag: 'e',
                isMultiple: true,
            },
            deps: {
                type: 'boolean',
                default: true,
            },
            auto: {
                type: 'boolean',
                default: true,
            },
            param: {
                type: 'string',
                shortFlag: 'p',
                isMultiple: true,
            },
        },
    },
)

// Check for config file
var configFiles = cli.flags.config
    ? [cli.flags.config]
    : ['nprocmon.yaml', 'nprocmon.yml', '.nprocmon.yaml', '.nprocmon.yml']
var configFile = configFiles.find((file) => fs.existsSync(file!))
if (!configFile) {
    console.error(
        'None of the following files could be found in current directory: ' +
            configFiles.join(', '),
    )
    process.exit(2)
}

// Check for lockfile
checkOrCreateLockFile(configFile)

// Set title
process.title = 'nprocmon - ' + configFile

ReactCurse.render(
    <Provider store={store}>
        <Main
            autorun={cli.flags.auto}
            configFile={configFile}
            exclude={cli.flags.exclude}
            deps={cli.flags.deps}
            input={cli.flags.param}
        />
    </Provider>,
)
