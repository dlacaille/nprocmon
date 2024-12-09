import { createSlice } from '@reduxjs/toolkit'
import {
    StartableProcessStatuses,
    type ProcessId,
    type ProcessManagerState,
    type ProcessStatus,
} from '../types/types.js'
import type { PayloadAction } from '@reduxjs/toolkit'

const initialState: ProcessManagerState = {
    processes: {},
}

export const processManagerSlice = createSlice({
    name: 'processes',
    initialState,
    reducers: {
        processStarting(
            state,
            action: PayloadAction<{
                id: ProcessId
                isDelayed?: boolean
                isRestart?: boolean
                isWaiting?: boolean
            }>,
        ) {
            let status: ProcessStatus = 'starting'
            if (action.payload.isWaiting) status = 'waiting'
            if (action.payload.isDelayed) status = 'delayed'
            if (action.payload.isRestart) status = 'restarting'
            state.processes[action.payload.id] = { status }
        },
        processRunning(
            state,
            action: PayloadAction<{ id: ProcessId; handle: number }>,
        ) {
            state.processes[action.payload.id] = {
                status: 'running',
                handle: action.payload.handle,
            }
        },
        processExiting(state, action: PayloadAction<ProcessId>) {
            state.processes[action.payload] = { status: 'stopping' }
        },
        processError(
            state,
            action: PayloadAction<{ id: ProcessId; error: Error }>,
        ) {
            const { error, id } = action.payload
            const message = (error.message ?? '') + (error.stack ?? '')
            state.processes[id] = {
                status: 'error',
                error: message,
            }
        },
        processExited(
            state,
            action: PayloadAction<{
                id: ProcessId
                exitCode: number
                signal?: number
                isStopped?: boolean
            }>,
        ) {
            const process = state.processes[action.payload.id]
            if (!process) return
            if (action.payload.isStopped) {
                process.status = 'exit'
                process.stopTime = Date.now()
            } else {
                process.status =
                    action.payload.exitCode === 0 ? 'exit' : 'error'
                process.exitCode = action.payload.exitCode
                process.stopTime = Date.now()
            }
        },
    },
})

export const {
    processStarting,
    processRunning,
    processExiting,
    processError,
    processExited,
} = processManagerSlice.actions

export default processManagerSlice.reducer
