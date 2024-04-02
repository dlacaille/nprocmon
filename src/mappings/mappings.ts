import type { ActionType, Mapping } from '../types/types.js'

const mappings: Record<ActionType, Mapping> = {
    navigationEnter: {
        desc: 'Exit',
        key: 'return',
    },
    navigationUp: {
        desc: 'Up',
        hide: true,
        key: ['k', 'up'],
    },
    navigationDown: {
        desc: 'Down',
        hide: true,
        key: ['j', 'down'],
    },
    appExit: {
        desc: 'Exit',
        key: 'q',
    },
    focusNext: {
        desc: 'Toggle Focus',
        key: {
            ctrl: true,
            name: 'a',
        },
    },
    logsPageUp: {
        desc: 'Page Up',
        key: {
            ctrl: true,
            name: 'pageup',
        },
    },
    logsPageDown: {
        desc: 'Page Down',
        key: {
            ctrl: true,
            name: 'pagedown',
        },
    },
    logsScrollUp: {
        desc: 'Scroll Up',
        key: 'pageup',
    },
    logsScrollDown: {
        desc: 'Scroll Down',
        key: 'pagedown',
    },
    procsExitAll: {
        desc: 'Stop All',
        key: 'X',
    },
    procsExitSelected: {
        desc: 'Stop Selected',
        key: 'x',
    },
    procsStartAll: {
        desc: 'Start All',
        key: 'S',
    },
    procsStartSelected: {
        desc: 'Start Selected',
        key: 's',
    },
}

export default mappings
