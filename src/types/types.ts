import type { IPty } from '@lydell/node-pty'
import type xterm from 'xterm-headless'

export type RestartType = 'always' | 'error' | 'never'

export type ProcessId = number | string

export type ProcessConfig = {
    readonly name: string
    readonly delay?: number
    readonly cmd: string[] | string
    readonly deps: string[] | string
    readonly cwd?: string
    readonly timeout?: number
    readonly shell?: string
    readonly wait?: boolean
    readonly autostart?: boolean
    readonly ignoreParams?: boolean
    readonly env?: NodeJS.ProcessEnv
    readonly inheritEnv?: boolean
    readonly restart: RestartType
}

export type ProcessBuffer = string | React.JSX.Element | React.JSX.Element[]

export type Process = {
    handle?: IPty
    terminal?: xterm.Terminal
    config: ProcessConfig
    isDependency?: boolean
    isStopped?: boolean
    exitCode?: number
    signal?: number
    buf: ProcessBuffer
    title?: string
    scrollTop: number
    scrollBottom: number
    length: number
}

export type EventListener<E> = (event: E) => void

export type InferFromArray<T> = T extends Array<infer T> ? T : never
export type InferFromEventListener<E> =
    E extends EventListener<infer E> ? E : never

export type ProcessEventListeners = {
    onTitleChange: Array<EventListener<{ title: string }>>
    onBufferChange: Array<EventListener<{ buf: ProcessBuffer; length: number }>>
    onScroll: Array<EventListener<{ top: number; bottom: number }>>
}

export type AppOptions = {
    exitWhenAllStopped?: 'always' | 'onSuccess' | false
}

export type AppConfig = {
    readonly procs: Record<ProcessId, ProcessConfig>
    readonly options?: AppOptions
}

export type LockFile = {
    readonly pid: number
}

export type ProcessStatus =
    | 'starting'
    | 'stopping'
    | 'running'
    | 'restarting'
    | 'delayed'
    | 'waiting'
    | 'exit'
    | 'error'

export const StartableProcessStatuses: ProcessStatus[] = [
    'delayed',
    'waiting',
    'exit',
    'error',
]

export const StoppableProcessStatuses: ProcessStatus[] = ['running']

export type ProcessState = {
    readonly status: ProcessStatus
    readonly handle?: number
    readonly error?: string
    readonly exitCode?: number
    readonly restartCount?: number
    readonly startTime?: number
    readonly stopTime?: number
    readonly errorTime?: number
}

export type ProcessManagerState = {
    readonly processes: Record<ProcessId, ProcessState>
}

export type Disposable = {
    dispose(): void
}

export type ActionType =
    | 'appExit'
    | 'focusNext'
    | 'navigationEnter'
    | 'navigationUp'
    | 'navigationDown'
    | 'logsPageUp'
    | 'logsPageDown'
    | 'logsScrollUp'
    | 'logsScrollDown'
    | 'procsExitAll'
    | 'procsExitSelected'
    | 'procsStartAll'
    | 'procsStartSelected'

export type KeyPress = {
    name: string
    ctrl: boolean
    meta: boolean
    shift: boolean
    option: boolean
    code?: string
    raw?: string
}

export type KeyMapping =
    | string
    | Partial<KeyPress>
    | Array<string | Partial<KeyPress>>

export type Mapping = {
    desc: string
    key: KeyMapping
    hide?: boolean
}

export type Event<T> = (listener: (event: T) => any) => Disposable
