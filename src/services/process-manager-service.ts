import os from 'node:os'
import { spawn } from '@lydell/node-pty'
import kill from 'tree-kill'
import {
    type AppConfig,
    type Disposable,
    type Process,
    type ProcessConfig,
    type ProcessId,
    type EventListener,
    type ProcessBuffer,
    type ProcessEventListeners,
    type InferFromArray,
} from '../types/types.js'
import xterm from 'xterm-headless'
import terminalSerializer from '../utils/terminal-serializer-curse.js'
import type { AppDispatch } from '../store.js'
import {
    processError,
    processExited,
    processExiting,
    processRunning,
    processStarting,
} from '../reducers/processes-slice.js'
import { chainUntilSettled } from '../utils/chain-until-settled.js'
import { EventManager } from '../utils/event-manager.js'
import open from 'open'

export default function processManagerService(
    config: AppConfig,
    dispatch: AppDispatch,
    input: string[] = [],
) {
    let size: [number, number] = [100, 100]
    const processes: Record<ProcessId, Process> = {}
    const processEvents: Record<
        ProcessId,
        EventManager<ProcessEventListeners>
    > = {}

    function getCols() {
        return size[0]
    }

    function getRows() {
        return size[1]
    }

    async function startAllAutostart(
        opts: { skipDependencies?: boolean } = {},
    ) {
        const autostartProcs = Object.entries(config.procs).filter(
            ([_id, proc]) => proc.autostart,
        )

        for (const [id] of autostartProcs) {
            dispatch(processStarting({ id, isWaiting: true }))
        }

        return chainUntilSettled(
            autostartProcs.map(
                ([id, proc]) =>
                    async () =>
                        startProcess(id, proc, opts),
            ),
        )
    }

    const onScroll = (
        id: ProcessId,
        listener: EventListener<{ top: number; bottom: number }>,
    ) => onProcessEvent(id, 'onScroll', listener)

    const onTitleChange = (
        id: ProcessId,
        listener: EventListener<{ title: string }>,
    ) => onProcessEvent(id, 'onTitleChange', listener)

    const onBufferChange = (
        id: ProcessId,
        listener: EventListener<{ buf: ProcessBuffer; length: number }>,
    ) => onProcessEvent(id, 'onBufferChange', listener)

    function getDefaultOptions() {
        const [cols, rows] = size
        return {
            name: 'xterm-color',
            cwd: process.cwd,
            cols,
            rows,
        }
    }

    function resize(cols: number, rows: number) {
        size = [cols, rows]
        for (const process of Object.values(processes)) {
            if (process.terminal) {
                process.terminal.resize(cols, rows)
            }

            if (process.handle) {
                process.handle.resize(cols, rows)
            }
        }
    }

    function shouldRestartProcess(id: ProcessId) {
        const process = processes[id]
        if (!process) return false

        if (process.isStopped) {
            // Process was stopped manually, don't restart
            return false
        }

        if (process.isStopped) {
            // Process was started as a dependency, don't restart
            return false
        }

        const restartPolicy = process.config.restart
        if (process.exitCode !== 0 && restartPolicy === 'error') {
            // Process had an error, restart
            return true
        }

        // Only restart if the policy is to restart on successful exit
        return restartPolicy === 'always'
    }

    const getProcess = (id: ProcessId) => processes[id]

    function write(id: ProcessId, data: Buffer | string) {
        const process = processes[id]
        if (!process?.handle) return
        process.handle.write(data as string)
    }

    async function stopAll() {
        const running = Object.entries(processes).filter(
            ([_id, process]) => process.exitCode === undefined,
        )
        if (running.length === 0) return
        return Promise.allSettled(running.map(async ([id]) => stopProcess(id)))
    }

    async function stopProcess(id: ProcessId) {
        // Get the process pid
        const process = processes[id]
        const pid = process?.handle?.pid
        if (!pid) {
            // This should not happen, either way signal that the process is exited
            dispatch(processExited({ id, exitCode: -1 }))

            return
        }

        // Signal that the process is exiting
        process.isStopped = true
        dispatch(processExiting(id))

        // Kill the process
        return new Promise((resolve) => kill(pid, resolve))
    }

    function onExit(id: ProcessId, exitCode: number, signal?: number) {
        const { isStopped, config: processConfig } = getProcess(id) ?? {}

        // Signal that the process is exited
        dispatch(
            processExited({
                id,
                exitCode,
                signal,
                isStopped,
            }),
        )

        // Restart the process if it has a restart policy
        if (shouldRestartProcess(id)) {
            startProcess(id, processConfig, { isRestart: true })
        }

        // When the processes are all exited we might want to exit ourselves
        const { exitWhenAllStopped } = config.options || {}
        if (exitWhenAllStopped) {
            const runningProcesses = Object.keys(processes).filter(
                (id) => processes[id].handle,
            )
            if (runningProcesses.length === 0) {
                const hasErrors = Object.keys(processes).some(
                    (id) => (processes[id].exitCode || 0) !== 0,
                )
                if (!hasErrors || exitWhenAllStopped === 'always') {
                    process.stdout.write('\u001bc')
                    process.exit(0)
                }
            }
        }
    }

    async function startProcess(
        id: ProcessId,
        proc: ProcessConfig,
        opts: {
            isRestart?: boolean
            isDependency?: boolean
            skipDependencies?: boolean
        } = {},
    ) {
        try {
            const { isRestart, isDependency, skipDependencies } = opts
            const {
                cwd,
                env,
                inheritEnv,
                delay,
                deps,
                wait,
                launch,
                launchDelay,
            } = proc
            const { procs } = config

            // Do not start again if already started
            if (isDependency && getProcess(id)) return

            // Delay starting this process by n milliseconds
            if (delay) {
                await new Promise((resolve) => {
                    setTimeout(resolve, delay)
                })
            }

            // Get dependencies
            const depsArray: string[] = []
            if (!skipDependencies) {
                if (deps && Array.isArray(deps)) depsArray.push(...deps)
                else if (deps) depsArray.push(deps)
            }

            // Signal that the process is starting
            dispatch(
                processStarting({
                    id,
                    isDelayed: Boolean(delay),
                    isRestart,
                    isWaiting: depsArray.length > 0,
                }),
            )

            // Start all dependencies and wait for them to be done
            await Promise.all(
                depsArray
                    .filter((depId) => procs[depId]) // Filter out any invalid dependency
                    .map(async (depId) =>
                        startProcess(depId, procs[depId], {
                            isDependency: true,
                        }),
                    ),
            )

            // Spawn the process
            const [cols, rows] = size

            const cmdArray = Array.isArray(proc.cmd) ? proc.cmd : [proc.cmd]
            const cmd = cmdArray[0]
            const args = cmdArray.slice(1)
            if (!proc.ignoreParams) args.push(...input)

            const child = spawn(cmd, args, {
                ...getDefaultOptions(),
                env: {
                    ...(inheritEnv ? process.env : {}),
                    ...env,
                },
                cwd,
            })

            // Create a virtual terminal
            const terminal = new xterm.Terminal({
                rows,
                cols,
                windowsPty: {
                    backend: 'conpty',
                },
                allowProposedApi: true,
            })

            // If a terminal existed for this process, dispose it
            if (processes[id]?.terminal) processes[id].terminal?.dispose()

            // Create a mutable state for our process
            const childProcess: Process = {
                handle: child,
                isDependency,
                terminal,
                buf: '',
                config: proc,
                scrollTop: 0,
                scrollBottom: rows,
                length: rows,
            }
            processes[id] = childProcess

            // Create an event manager for our process
            const childEvents = new EventManager<ProcessEventListeners>({
                onBufferChange: [],
                onTitleChange: [],
                onScroll: [],
            })
            processEvents[id] = childEvents

            // Forward process data to the terminal
            const event = child.onData((data) => {
                terminal.write(data, () => {
                    const buf = terminalSerializer(terminal)
                    const { length } = terminal.buffer.active
                    childProcess.buf = buf
                    childProcess.length = length
                    childEvents.trigger('onBufferChange', { buf, length })
                })
            })

            // Listen to title changes
            terminal.onTitleChange((title: string) => {
                childProcess.title = title
                childEvents.trigger('onTitleChange', { title })
            })

            // Listen to viewport changes
            terminal.onScroll((scroll: number) => {
                const scrollTop = scroll
                const scrollBottom = scroll + terminal.rows
                childProcess.scrollTop = scrollTop
                childProcess.scrollBottom = scrollBottom
                childEvents.trigger('onScroll', {
                    top: scrollTop,
                    bottom: scrollBottom,
                })
                const buf = terminalSerializer(terminal)
                const { length } = terminal.buffer.active
                childProcess.buf = buf
                childProcess.length = length
                childEvents.trigger('onBufferChange', { buf, length })
            })

            // Return a promise which resolves when the process is started or exited
            await new Promise<void>((resolve, reject) => {
                child.onExit(({ exitCode, signal }) => {
                    childProcess.handle = undefined
                    childProcess.exitCode = exitCode
                    childProcess.signal = exitCode

                    event.dispose()

                    onExit(id, exitCode, signal)

                    // We were asked to wait and process is exited, we can resolve or reject depending on exit code.
                    if (wait) {
                        if (exitCode === 0) {
                            resolve()
                        } else {
                            reject(exitCode)
                        }
                    }
                })

                // Signal that the process is running
                dispatch(processRunning({ id, handle: child.pid }))

                // Launch if needed
                if (launch) {
                    setTimeout(() => {
                        // Check if process is running
                        if (childProcess.handle) open(launch)
                    }, launchDelay || 0)
                }

                // No need to wait, process is started, we can resolve.
                if (!wait) {
                    resolve()
                }
            })
        } catch (error) {
            // An error has occurred while starting the process
            const { message, name, stack } = error as Error
            dispatch(processError({ id, error: { message, name, stack } }))
        }
    }

    function onProcessEvent<N extends keyof ProcessEventListeners>(
        id: ProcessId,
        name: N,
        listener: InferFromArray<ProcessEventListeners[N]>,
    ): Disposable {
        if (!processEvents[id]) {
            console.log('no process with id ' + id)
            return {
                dispose() {},
            }
        }

        return processEvents[id].addEventListener(
            name,
            listener as EventListener<any>,
        )
    }

    return {
        getCols,
        getRows,
        startProcess,
        stopProcess,
        startAllAutostart,
        getProcess,
        onScroll,
        onTitleChange,
        onBufferChange,
        resize,
        shouldRestartProcess,
        write,
        stopAll,
    } as const
}

export type ProcessManagerService = ReturnType<typeof processManagerService>
