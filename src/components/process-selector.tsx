import React, { useEffect, useMemo, useState } from 'react'
import useConfig from '../hooks/use-config.js'
import ProcessName from './process-name.js'
import useMappings from '../hooks/use-mappings.js'
import { Frame, Text, Scrollbar } from 'react-curse'
import useFocus from '../hooks/use-focus.jsx'
import useAppSelector from '../hooks/use-app-selector.js'
import { useProcessManager } from '../hooks/use-process-manager.jsx'
import {
    StartableProcessStatuses,
    StoppableProcessStatuses,
} from '../types/types.js'

type Props = {
    readonly autorun?: boolean
    readonly deps?: boolean
    readonly width: number
    readonly height: number
    readonly selected: string
    readonly selectedIndex: number
    setSelectedIndex(value: number | ((value: number) => void)): void
    readonly input?: string[]
}

export default function ProcessSelector({
    autorun,
    deps,
    width,
    height,
    selected,
    selectedIndex,
    setSelectedIndex,
}: Props) {
    const config = useConfig()
    const { startProcess, startAllAutostart, stopProcess, stopAll } =
        useProcessManager()
    const [scrollTop, setScrollTop] = useState(0)
    const scrollHeight = height - 2
    const { isFocused, focus } = useFocus({ id: 'proc', autoFocus: true })
    const selectedStatus = useAppSelector(
        (state) => state.processes.processes[selected]?.status,
    )
    const isSelectedStartable = useMemo(
        () =>
            !selectedStatus ||
            StartableProcessStatuses.includes(selectedStatus),
        [selectedStatus],
    )
    const isSelectedStoppable = useMemo(
        () =>
            selectedStatus && StoppableProcessStatuses.includes(selectedStatus),
        [selectedStatus],
    )

    useEffect(() => {
        if (!autorun) return

        startAllAutostart({ skipDependencies: !deps })
    }, [config, autorun, startAllAutostart])

    useMappings(
        {
            procsStartSelected() {
                startProcess(selected, config.procs[selected], {
                    skipDependencies: !deps,
                })
            },
        },
        {
            isActive: isFocused && isSelectedStartable,
        },
    )

    useMappings(
        {
            procsExitSelected() {
                stopProcess(selected)
            },
            navigationEnter() {
                focus('log')
            },
        },
        { isActive: isFocused && isSelectedStoppable },
    )

    const processes = useMemo(
        () =>
            Object.entries(config?.procs).map(([id, config]) => ({
                id,
                config,
            })) ?? [],
        [config],
    )
    const length = processes.length

    useEffect(() => {
        // Scroll down
        if (selectedIndex > scrollHeight + scrollTop)
            setScrollTop(Math.max(selectedIndex - scrollHeight, 0))
        // Scroll up
        if (selectedIndex < scrollTop) setScrollTop(selectedIndex)
    }, [height, scrollTop, selectedIndex])

    useMappings(
        {
            navigationUp() {
                setSelectedIndex((s) => (s > 0 ? s - 1 : processes.length - 1))
            },
            navigationDown() {
                setSelectedIndex((s) => (s + 1) % processes.length)
            },
            procsStartAll() {
                startAllAutostart({ skipDependencies: !deps })
            },
            procsExitAll() {
                stopAll()
            },
            appExit() {
                stopAll().then(() => {
                    process.stdout.write('\u001bc')
                    process.exit(1) // Exit code is always 1 since we are killing the processes
                })
            },
        },
        { isActive: isFocused },
    )

    return (
        <Text
            width={width}
            height={height + 1}
            y={0}
            color={isFocused ? 'green' : 'blue'}
        >
            <Frame type="rounded" width={width - 2} height={height - 1}>
                {processes
                    .slice(scrollTop, scrollHeight + scrollTop + 1)
                    .map(({ id, config }) => (
                        <ProcessName
                            key={id}
                            config={config}
                            id={id}
                            isSelected={selected === id}
                        />
                    ))}
            </Frame>
            <Text bold y={0} x={2}>
                Processes
            </Text>
            {length > scrollHeight + 1 && (
                <Text x="100%-1" y={1} height="100%-2">
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
            )}
        </Text>
    )
}
