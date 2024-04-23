import React, { useEffect, useMemo } from 'react'
import useConfig from '../hooks/use-config.js'
import ProcessName from './process-name.js'
import useMappings from '../hooks/use-mappings.js'
import { Frame, Text } from 'react-curse'
import useFocus from '../hooks/use-focus.jsx'
import useAppSelector from '../hooks/use-app-selector.js'
import { useProcessManager } from '../hooks/use-process-manager.jsx'

type Props = {
    readonly autorun?: boolean
    readonly deps?: boolean
    readonly width: number
    readonly height: number
    readonly selected: string
    setSelectedIndex(value: number | ((value: number) => void)): void
}

export default function ProcessSelector({
    autorun,
    deps,
    width,
    height,
    selected,
    setSelectedIndex,
}: Props) {
    const config = useConfig()
    const { startProcess, startAllAutostart, stopProcess, stopAll } =
        useProcessManager()
    const { isFocused, focus } = useFocus({ id: 'proc', autoFocus: true })
    const selectedStatus = useAppSelector(
        (state) => state.processes.processes[selected]?.status,
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
            isActive:
                isFocused && (!selectedStatus || selectedStatus === 'exit'),
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
        { isActive: isFocused && selectedStatus === 'running' },
    )

    const processes = useMemo(
        () =>
            Object.entries(config?.procs).map(([id, config]) => ({
                id,
                config,
            })) ?? [],
        [config],
    )

    useMappings(
        {
            navigationUp() {
                setSelectedIndex((s) => (s > 0 ? s - 1 : processes.length - 1))
            },
            navigationDown() {
                setSelectedIndex((s) => (s + 1) % processes.length)
            },
            appExit() {
                stopAll().then(() => {
                    process.stdout.write('\u001bc')
                    process.exit(0)
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
                {processes.map(({ id, config }) => (
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
        </Text>
    )
}
