import type xterm from 'xterm-headless'

function getFgStyle(cell: xterm.IBufferCell) {
    const color = cell.getFgColor()

    if (cell.isFgRGB()) {
        return [
            38,
            2,
            (color >>> 16) & 0xff,
            (color >>> 8) & 0xff,
            color & 0xff,
        ]
    }

    if (cell.isFgPalette()) {
        if (color >= 16) {
            return [38, 5, color]
        }

        return [color & 8 ? 90 + (color & 7) : 30 + (color & 7)]
    }

    return [39]
}

function getBgStyle(cell: xterm.IBufferCell) {
    const color = cell.getBgColor()

    if (cell.isBgRGB()) {
        return [
            48,
            2,
            (color >>> 16) & 0xff,
            (color >>> 8) & 0xff,
            color & 0xff,
        ]
    }

    if (cell.isBgPalette()) {
        if (color >= 16) {
            return [48, 5, color]
        }

        return [color & 8 ? 100 + (color & 7) : 40 + (color & 7)]
    }

    return [49]
}

function* getFlagsStyle(cell: xterm.IBufferCell, oldCell: xterm.IBufferCell) {
    if (cell.isInverse() !== oldCell.isInverse()) {
        yield cell.isInverse() ? 7 : 27
    }

    if (cell.isBold() !== oldCell.isBold()) {
        yield cell.isBold() ? 1 : 22
    }

    if (cell.isUnderline() !== oldCell.isUnderline()) {
        yield cell.isUnderline() ? 4 : 24
    }

    if (cell.isOverline() !== oldCell.isOverline()) {
        yield cell.isOverline() ? 53 : 55
    }

    if (cell.isBlink() !== oldCell.isBlink()) {
        yield cell.isBlink() ? 5 : 25
    }

    if (cell.isInvisible() !== oldCell.isInvisible()) {
        yield cell.isInvisible() ? 8 : 28
    }

    if (cell.isItalic() !== oldCell.isItalic()) {
        yield cell.isItalic() ? 3 : 23
    }

    if (cell.isDim() !== oldCell.isDim()) {
        yield cell.isDim() ? 2 : 22
    }

    if (cell.isStrikethrough() !== oldCell.isStrikethrough()) {
        yield cell.isStrikethrough() ? 9 : 29
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
): number[] {
    const sgrSeq: number[] = []
    const fgChanged = !equalFg(cell, oldCell)
    const bgChanged = !equalBg(cell, oldCell)
    const flagsChanged = !equalFlags(cell, oldCell)

    if (fgChanged || bgChanged || flagsChanged) {
        if (cell.isAttributeDefault()) {
            if (!oldCell.isAttributeDefault()) {
                sgrSeq.push(0)
            }
        } else {
            if (fgChanged) {
                sgrSeq.push(...getFgStyle(cell))
            }

            if (bgChanged) {
                sgrSeq.push(...getBgStyle(cell))
            }

            if (flagsChanged) {
                sgrSeq.push(...getFlagsStyle(cell, oldCell))
            }
        }
    }

    return sgrSeq
}

export default function terminalSerializer(terminal: xterm.Terminal) {
    const out: string[] = []
    const buffer = terminal.buffer.active
    for (let y = 0; y < buffer.length - 1; y++) {
        if (y > buffer.viewportY) {
            out.push('\n')
        }

        const line = buffer.getLine(y)!

        let oldCell = buffer.getNullCell()
        for (let x = 0; x < line.length; x++) {
            const cell = line.getCell(x)!

            // A width 0 cell don't need to be count because it is just a placeholder after a CJK character
            const isPlaceholderCell = cell.getWidth() === 0
            if (isPlaceholderCell) continue

            // Get the cell's content
            const chars = cell.getChars()

            // Empty cells have no content, but they should still print a space
            const isEmptyCell = chars === ''

            // Print out cell style, we only need to change the style if it is differnet
            const styleDiff = diffStyle(cell, oldCell)
            if (styleDiff.length > 0) {
                out.push(`\u001b[${styleDiff.join(';')}m`)
            }

            // Print the characters
            out.push(isEmptyCell ? ' ' : chars)
            oldCell = cell
        }
    }

    return out.join('')
}
