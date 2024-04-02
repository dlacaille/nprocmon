/* eslint-disable */
// Adapted from https://github.com/enquirer/enquirer/blob/70bdb0fedc3ed355d9d8fe4f00ac9b3874f94f61/lib/keypress.js

import { KeyPress } from '../types/types.js'

const metaKeyCodeRe = /^(?:\u001b)([a-zA-Z0-9])$/
const fnKeyRe =
    /^(?:\u001b+)(O|N|\[|\[\[)(?:(\d+)(?:;(\d+))?([~^$])|(?:1;)?(\d+)?([a-zA-Z]))/

const keyName: Record<string, string> = {
    /* Xterm/gnome ESC O letter */
    OP: 'f1',
    OQ: 'f2',
    OR: 'f3',
    OS: 'f4',
    /* Xterm/rxvt ESC [ number ~ */
    '[11~': 'f1',
    '[12~': 'f2',
    '[13~': 'f3',
    '[14~': 'f4',
    /* From Cygwin and used in libuv */
    '[[A': 'f1',
    '[[B': 'f2',
    '[[C': 'f3',
    '[[D': 'f4',
    '[[E': 'f5',
    /* Common */
    '[15~': 'f5',
    '[17~': 'f6',
    '[18~': 'f7',
    '[19~': 'f8',
    '[20~': 'f9',
    '[21~': 'f10',
    '[23~': 'f11',
    '[24~': 'f12',
    /* Xterm ESC [ letter */
    '[A': 'up',
    '[B': 'down',
    '[C': 'right',
    '[D': 'left',
    '[E': 'clear',
    '[F': 'end',
    '[H': 'home',
    /* Xterm/gnome ESC O letter */
    OA: 'up',
    OB: 'down',
    OC: 'right',
    OD: 'left',
    OE: 'clear',
    OF: 'end',
    OH: 'home',
    /* Xterm/rxvt ESC [ number ~ */
    '[1~': 'home',
    '[2~': 'insert',
    '[3~': 'delete',
    '[4~': 'end',
    '[5~': 'pageup',
    '[6~': 'pagedown',
    /* Putty */
    '[[5~': 'pageup',
    '[[6~': 'pagedown',
    /* Rxvt */
    '[7~': 'home',
    '[8~': 'end',
    /* Rxvt keys with modifiers */
    '[a': 'up',
    '[b': 'down',
    '[c': 'right',
    '[d': 'left',
    '[e': 'clear',

    '[2$': 'insert',
    '[3$': 'delete',
    '[5$': 'pageup',
    '[6$': 'pagedown',
    '[7$': 'home',
    '[8$': 'end',

    Oa: 'up',
    Ob: 'down',
    Oc: 'right',
    Od: 'left',
    Oe: 'clear',

    '[2^': 'insert',
    '[3^': 'delete',
    '[5^': 'pageup',
    '[6^': 'pagedown',
    '[7^': 'home',
    '[8^': 'end',
    /* Misc. */
    '[Z': 'tab',
}

function isShiftKey(code: string) {
    return [
        '[a',
        '[b',
        '[c',
        '[d',
        '[e',
        '[2$',
        '[3$',
        '[5$',
        '[6$',
        '[7$',
        '[8$',
        '[Z',
    ].includes(code)
}

function isCtrlKey(code: string) {
    return [
        'Oa',
        'Ob',
        'Oc',
        'Od',
        'Oe',
        '[2^',
        '[3^',
        '[5^',
        '[6^',
        '[7^',
        '[8^',
    ].includes(code)
}

export function stringFromBuffer(s: Buffer | string): string {
    if (Buffer.isBuffer(s)) {
        if (s[0] && s[0] > 127 && s[1] === undefined) {
            s[0] -= 128
            s = '\u001b' + String(s)
        } else {
            s = String(s)
        }
    } else if (s !== undefined && typeof s !== 'string') {
        s = String(s)
    } else if (!s) {
        s = ''
    }

    return s
}

function keypress(s: Buffer | string = ''): KeyPress {
    let parts
    s = stringFromBuffer(s)

    let key: KeyPress = {
        name: '',
        ctrl: false,
        meta: false,
        shift: false,
        option: false,
        raw: s,
    }

    if (s === '\r') {
        // carriage return
        key.raw = undefined
        key.name = 'return'
    } else if (s === '\n') {
        // enter, should have been called linefeed
        key.name = 'enter'
    } else if (s === '\t') {
        // tab
        key.name = 'tab'
    } else if (
        s === '\b' ||
        s === '\x7f' ||
        s === '\x1b\x7f' ||
        s === '\x1b\b'
    ) {
        // backspace or ctrl+h
        key.name = 'backspace'
        key.meta = s.charAt(0) === '\x1b'
    } else if (s === '\x1b' || s === '\x1b\x1b') {
        // escape key
        key.name = 'escape'
        key.meta = s.length === 2
    } else if (s === ' ' || s === '\x1b ') {
        key.name = 'space'
        key.meta = s.length === 2
    } else if (s <= '\x1a') {
        // ctrl+letter
        key.name = String.fromCharCode(s.charCodeAt(0) + 'a'.charCodeAt(0) - 1)
        key.ctrl = true
    } else if (s.length === 1 && s >= '0' && s <= '9') {
        // number
        key.name = 'number'
    } else if (s.length === 1 && s >= 'a' && s <= 'z') {
        // lowercase letter
        key.name = s
    } else if (s.length === 1 && s >= 'A' && s <= 'Z') {
        // shift+letter
        key.name = s.toLowerCase()
        key.shift = true
    } else if ((parts = metaKeyCodeRe.exec(s))) {
        // meta+character key
        key.meta = true
        key.shift = /^[A-Z]$/.test(parts[1]!)
    } else if ((parts = fnKeyRe.exec(s))) {
        const segs = [...s]

        if (segs[0] === '\u001b' && segs[1] === '\u001b') {
            key.option = true
        }

        // Ansi escape sequence
        // reassemble the key code leaving out leading \x1b's,
        // the modifier key bitflag and any meaningless "1;" sequence
        const code = [parts[1], parts[2], parts[4], parts[6]]
            .filter(Boolean)
            .join('')

        const modifier = ((parts[3] || parts[5] || 1) as number) - 1

        // Parse the key modifier
        key.ctrl = Boolean(modifier & 4)
        key.meta = Boolean(modifier & 10)
        key.shift = Boolean(modifier & 1)
        key.code = code

        key.name = keyName[code] || ''
        key.shift = isShiftKey(code) || key.shift
        key.ctrl = isCtrlKey(code) || key.ctrl
    }
    return key
}

export default keypress
