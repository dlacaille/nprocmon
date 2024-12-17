import React, { useEffect, useLayoutEffect, useState, useMemo } from 'react'
import ProcessSelector from './components/process-selector.jsx'
import LogMonitor from './components/log-monitor.jsx'
import { loadConfig } from './reducers/config-slice.js'
import useAppDispatch from './hooks/use-app-dispatch.js'
import { useSize } from 'react-curse'
import { MappingProvider } from './hooks/use-mappings.jsx'
import { FocusProvider } from './hooks/use-focus.jsx'
import MappingsDisplay from './components/mappings-display.jsx'
import useConfig from './hooks/use-config.js'
import ProcessManagerProvider from './context/process-manager-context.jsx'

const processWidth = 50

type Props = {
    readonly configFile: string | undefined
    readonly autorun?: boolean
    readonly deps?: boolean
    readonly exclude?: string[]
    readonly input?: string[]
}

export default function Main({
    configFile = 'nprocmon.yaml',
    autorun,
    deps,
    exclude,
    input,
}: Props) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const config = useConfig()
    const selected = useMemo(
        () => Object.keys(config.procs)[selectedIndex],
        [config, selectedIndex],
    )
    const dispatch = useAppDispatch()

    const { width, height } = useSize()

    useEffect(() => {
        if (configFile) dispatch(loadConfig({ config: configFile, exclude }))
    }, [configFile, dispatch])

    useLayoutEffect(() => {
        process.stdout.write('\u001b[?25l')
    })

    if (Object.keys(config.procs).length === 0) return

    return (
        <MappingProvider>
            <FocusProvider>
                <ProcessManagerProvider input={input}>
                    <ProcessSelector
                        width={processWidth}
                        height={height - 2}
                        selected={selected}
                        setSelectedIndex={setSelectedIndex}
                        autorun={autorun}
                        deps={deps}
                        input={input}
                    />
                    <LogMonitor
                        width={width - processWidth}
                        height={height - 2}
                        selected={selected}
                    />
                </ProcessManagerProvider>
            </FocusProvider>
            <MappingsDisplay />
        </MappingProvider>
    )
}
