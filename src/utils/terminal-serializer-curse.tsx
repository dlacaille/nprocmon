import React from 'react'
import { Text } from 'react-curse'
import type { TextProps } from 'react-curse/components/Text'
import type { Color, Modifier } from 'react-curse/screen'
import type xterm from 'xterm-headless'
import EmulatedCursor from '../components/emulated-cursor.js'

function padStart(
    target: string,
    targetLength: number,
    padString = ' ',
): string {
    targetLength = Math.trunc(targetLength)
    if (target.length > targetLength) {
        return target
    }

    targetLength -= target.length
    if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length)
    }

    return padString.slice(0, targetLength) + target
}

const colorNames = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
]

function getColor(
    color: number,
    isRgb: boolean,
    isPalette: boolean,
): Color | undefined {
    if (isRgb) {
        const rgb = [(color >> 16) & 255, (color >> 8) & 255, color & 255]
        return '#' + rgb.map((x) => padStart(x.toString(16), 2, '0')).join('')
    }

    if (isPalette) {
        if (color >= 16) {
            return color
        }

        return color & 8
            ? colorNames[color & 7]
            : 'bright' + colorNames[color & 7]
    }

    return undefined
}

function getCellModifier(cell: xterm.IBufferCell): Modifier {
    return {
        color: getColor(cell.getFgColor(), cell.isFgRGB(), cell.isFgPalette()),
        background: getColor(
            cell.getBgColor(),
            cell.isBgRGB(),
            cell.isBgPalette(),
        ),
        inverse: Boolean(cell.isInverse()),
        bold: Boolean(cell.isBold()),
        underline: Boolean(cell.isUnderline()),
        blinking: Boolean(cell.isBlink()),
        italic: Boolean(cell.isItalic()),
        dim: Boolean(cell.isDim()),
        strikethrough: Boolean(cell.isStrikethrough()),
        // Not supported by react-curse
        // overline: Boolean(cell.isOverline()),
        // invisible: Boolean(cell.isInvisible()),
    }
}

function equalFg(cell1: xterm.IBufferCell, cell2: xterm.IBufferCell): boolean {
    return (
        cell1.getFgColorMode() === cell2.getFgColorMode() &&
        cell1.getFgColor() === cell2.getFgColor()
    )
}

function equalBg(cell1: xterm.IBufferCell, cell2: xterm.IBufferCell): boolean {
    return (
        cell1.getBgColorMode() === cell2.getBgColorMode() &&
        cell1.getBgColor() === cell2.getBgColor()
    )
}

function equalFlags(
    cell1: xterm.IBufferCell,
    cell2: xterm.IBufferCell,
): boolean {
    return (
        cell1.isInverse() === cell2.isInverse() &&
        cell1.isBold() === cell2.isBold() &&
        cell1.isUnderline() === cell2.isUnderline() &&
        cell1.isOverline() === cell2.isOverline() &&
        cell1.isBlink() === cell2.isBlink() &&
        cell1.isInvisible() === cell2.isInvisible() &&
        cell1.isItalic() === cell2.isItalic() &&
        cell1.isDim() === cell2.isDim() &&
        cell1.isStrikethrough() === cell2.isStrikethrough()
    )
}

function diffStyle(
    cell: xterm.IBufferCell,
    oldCell: xterm.IBufferCell,
): boolean {
    return (
        !equalFg(cell, oldCell) ||
        !equalBg(cell, oldCell) ||
        !equalFlags(cell, oldCell)
    )
}

type TextBuf = {
    props: TextProps
    isCursor?: boolean
    contentBuf: string[]
}

let textBuf: TextBuf[] = []
function nextText() {
    const newText: TextBuf = { props: {}, contentBuf: [] }
    textBuf.push(newText)
    return newText
}

export default function terminalSerializer(terminal: xterm.Terminal) {
    const out: React.JSX.Element[] = []
    const buffer = terminal.buffer.active

    for (let y = buffer.viewportY; y < buffer.viewportY + terminal.rows; y++) {
        const line = buffer.getLine(y)!

        textBuf = []
        let current = nextText()

        let oldCell = buffer.getNullCell()
        let oldIsCursor = false
        for (let x = 0; x < line.length; x++) {
            const cell = line.getCell(x)!

            // A width 0 cell don't need to be count because it is just a placeholder after a CJK character
            const isPlaceholderCell = cell.getWidth() === 0
            if (isPlaceholderCell) continue

            // Get the cell's content
            const chars = cell.getChars()

            // Empty cells have no content, but they should still print a space
            const isEmptyCell = chars === ''

            // Check if the current cell is the cursor
            const isCursor = buffer.cursorY === y && buffer.cursorX === x

            // Check if the style is different
            if (diffStyle(cell, oldCell) || isCursor !== oldIsCursor) {
                current = nextText()
                const modifier = getCellModifier(cell)
                Object.assign(current.props, modifier)
                current.isCursor = isCursor
            }

            // Print the characters
            current.contentBuf.push(isEmptyCell ? ' ' : chars)
            oldCell = cell
            oldIsCursor = isCursor
        }

        out.push(
            <Text key={y} block color="brightWhite">
                {textBuf.map(({ props, contentBuf, isCursor }, index) => {
                    if (isCursor) {
                        return (
                            <EmulatedCursor
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                isBlink={Boolean(terminal.options.cursorBlink)}
                                {...props}
                            >
                                {contentBuf.join('')}
                            </EmulatedCursor>
                        )
                    }

                    return (
                        // eslint-disable-next-line react/no-array-index-key
                        <Text key={index} {...props}>
                            {contentBuf.join('')}
                        </Text>
                    )
                })}
            </Text>,
        )
    }

    return out
}
