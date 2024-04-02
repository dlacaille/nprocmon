import React, { useState, useEffect } from 'react'
import type { ProcessBuffer, ProcessId } from '../types/types.js'
import useAppSelector from '../hooks/use-app-selector.js'
import useFocus from '../hooks/use-focus.jsx'
import { Frame, Scrollbar, Text, useChildrenSize, useMouse } from 'react-curse'
import keypress from '../utils/keypress.js'
import { CursorContextProvider } from '../hooks/use-cursor-context.jsx'
import type { Disposable } from '../types/types.js'
import useMappings from '../hooks/use-mappings.jsx'
import { useProcessManager } from '../hooks/use-process-manager.jsx'

type Props = {
    readonly selected: ProcessId
    readonly width: number
    readonly height: number
}

export default function LogMonitor({ width, height, selected }: Props) {
    const { isFocused, focusNext, focus } = useFocus('log')
    const [enableStdin, setEnableStdin] = useState(true)
    const [buf, setBuf] = useState<ProcessBuffer>('')
    const [title, setTitle] = useState('')
    const [length, setLength] = useState(0)
    const [scrollTop, setScrollTop] = useState(0)
    const [scrollBottom, setScrollBottom] = useState(0)
    const processManager = useProcessManager()

    const status = useAppSelector(
        (state) => state.processes.processes[selected]?.status,
    )
    const error = useAppSelector(
        (state) => state.processes.processes[selected]?.error ?? '',
    )

    const isRunning = status === 'running'
    const isStdinEnabled = isRunning && isFocused && enableStdin

    useMappings({
        logsPageUp() {
            processManager.getProcess(selected)?.terminal?.scrollPages(-1)
        },
        logsPageDown() {
            processManager.getProcess(selected)?.terminal?.scrollPages(1)
        },
        logsScrollUp() {
            processManager.getProcess(selected)?.terminal?.scrollLines(-1)
        },
        logsScrollDown() {
            processManager.getProcess(selected)?.terminal?.scrollLines(1)
        },
    })

    useEffect(() => {
        // Re-enable stdin when we gain focus
        if (isFocused) setEnableStdin(true)
    }, [isFocused])

    useEffect(() => {
        // When the application stops, lose focus
        if (!isRunning && isFocused) focus('proc')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning])

    useEffect(() => {
        if (!isStdinEnabled) return

        const listener = (data: Buffer | string) => {
            const key = keypress(data)

            // Ctrl+A
            if (key.ctrl && key.name === 'a') {
                return
            }

            // Pass input to the currently selected process
            processManager.write(selected, data)
        }

        process.stdin.on('data', listener)

        return () => {
            process.stdin.off('data', listener)
        }
    }, [isStdinEnabled, selected, focusNext, processManager])

    useEffect(() => {
        const cols = width - 3
        const rows = height - 1
        processManager.resize(cols, rows)
    }, [width, height, processManager])

    useEffect(() => {
        const process = processManager.getProcess(selected)
        setBuf(process?.buf ?? '')
        setTitle(process?.title ?? '')
        setLength(process?.length ?? 0)
        setScrollTop(process?.scrollTop ?? 0)
        setScrollBottom(process?.scrollBottom ?? 0)

        if (!process) return

        const disposables: Disposable[] = []
        disposables.push(
            processManager.onBufferChange(selected, ({ buf, length }) => {
                setBuf(buf)
                setLength(length)
            }),
            processManager.onTitleChange(selected, ({ title }) => {
                setTitle(title)
            }),
            processManager.onScroll(selected, ({ top, bottom }) => {
                setScrollTop(top)
                setScrollBottom(bottom)
            }),
        )

        return () => {
            for (const disposable of disposables) disposable.dispose()
            setBuf('')
        }
    }, [selected, status, processManager])

    useMouse(
        (event) => {
            const process = processManager.getProcess(selected)
            if (!process) return
            if (event.type === 'wheeldown') {
                process.terminal?.scrollLines(1)
            } else if (event.type === 'wheelup') {
                process.terminal?.scrollLines(-1)
            }
        },
        [selected],
    )

    const linesStr = `${Math.round((scrollBottom / length) * 100) || 0}% ${scrollTop}-${scrollBottom}/${length}`
    const linesStrSize = useChildrenSize(linesStr)

    return (
        <Text y={0} color={isFocused ? 'green' : 'blue'}>
            <Frame type="rounded" width={width - 2} height={height - 1}>
                <CursorContextProvider
                    isFocused={isFocused}
                    isRunning={isRunning}
                >
                    <Text width={width - 2} height={height - 1} color="white">
                        {error ? <Text color="red">{error}</Text> : buf}
                    </Text>
                </CursorContextProvider>
            </Frame>
            <Text bold y={0} x={2}>
                Logs
                {title && ': '}
                {title && <Text color="magenta">{title}</Text>}
            </Text>
            <Text x="100%-1" y={1} height="100%-3">
                <Text x={0} y={0}>
                    ▲
                </Text>
                <Text x={0} y={1} height="100%-2">
                    <Scrollbar
                        offset={scrollTop}
                        limit={height - 2}
                        length={length}
                    />
                </Text>
                <Text x={0} y="100%-1">
                    ▼
                </Text>
            </Text>
            <Text x={`100%-${(linesStrSize.width as number) + 2}`} y="100%-2">
                {linesStr}
            </Text>
        </Text>
    )
}
