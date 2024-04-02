import React from 'react'
import useAppSelector from '../hooks/use-app-selector.js'
import type { ProcessConfig, ProcessStatus } from '../types/types.js'
import { Text } from 'react-curse'

type Props = {
    readonly id: string
    readonly config: ProcessConfig
    readonly isSelected: boolean
}

const colors = {
    delayed: 'yellow',
    running: 'green',
    starting: 'yellow',
    exit: 'cyan',
    stopping: 'yellow',
    restarting: 'yellow',
    waiting: 'yellow',
    error: 'red',
    default: 'white',
}

function statusColor(status: ProcessStatus | undefined): string | undefined {
    return colors[status!] ?? colors.default
}

const icons = {
    delayed: '',
    running: '',
    starting: '󰐍',
    exit: '',
    stopping: '',
    restarting: '󰮍',
    waiting: '',
    error: '',
    default: '',
}

function statusFormat(
    status: ProcessStatus | undefined,
    name: string,
): string | undefined {
    return `${icons[status!] ?? icons.default} ${name}`
}

export default function ProcessName({ id, config, isSelected }: Props) {
    const status = useAppSelector(
        (state) => state.processes.processes[id]?.status,
    )

    return (
        <Text block inverse={isSelected} color={statusColor(status)}>
            {statusFormat(status, config.name)}
        </Text>
    )
}
