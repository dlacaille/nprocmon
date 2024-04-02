import fs from 'node:fs'
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AppConfig, ProcessConfig } from '../types/types.js'
import YAML from 'yaml'

export const processConfigDefaults: Partial<ProcessConfig> = {
    inheritEnv: true,
}

const initialState: AppConfig = {
    procs: {},
}

export const configSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        setConfig(_state, action: PayloadAction<AppConfig>) {
            return action.payload
        },
        loadConfig(_state, action: PayloadAction<string>) {
            const data = fs.readFileSync(action.payload, 'utf8')
            const parsed = YAML.parse(data) as AppConfig
            const procs = {}
            for (const [id, config] of Object.entries(parsed.procs)) {
                procs[id] = {
                    ...processConfigDefaults,
                    ...config,
                }
            }

            return {
                procs,
            }
        },
    },
})

export const { setConfig, loadConfig } = configSlice.actions

export default configSlice.reducer
