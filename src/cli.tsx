#!/usr/bin/env node
import React from 'react'
import ReactCurse from 'react-curse'
import meow from 'meow'
import Main from './main.js'
import { store } from './store.js'
import { Provider } from 'react-redux'

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

ReactCurse.render(
    <Provider store={store}>
        <Main
            autorun={cli.flags.auto}
            configFile={cli.flags.config}
            exclude={cli.flags.exclude}
            deps={cli.flags.deps}
            input={cli.flags.param}
        />
    </Provider>,
)
