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
      --config       The configuration file to use
      --no-auto      Disable autorun for all processes

    Examples
      $ nprocmon --config=./nprocmon.yaml
    `,
    {
        importMeta: import.meta,
        flags: {
            config: {
                type: 'string',
            },
            auto: {
                type: 'boolean',
                default: true,
            },
        },
    },
)

ReactCurse.render(
    <Provider store={store}>
        <Main isAutorun={cli.flags.auto} configFile={cli.flags.config} />
    </Provider>,
)
