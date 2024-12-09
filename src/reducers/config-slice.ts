import fs from 'node:fs'
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AppConfig, ProcessConfig } from '../types/types.js'
import YAML from 'yaml'
import wildcardRegex from '../utils/wildcard-regex.js'

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
        loadConfig(
            _state,
            action: PayloadAction<{ config: string; exclude?: string[] }>,
        ) {
            const { config, exclude } = action.payload
            const data = fs.readFileSync(config, 'utf8')
            const parsed = YAML.parse(data) as AppConfig
            const procs = {}
            const excludeRegex = exclude?.map((e) => wildcardRegex(e))
            for (const [id, config] of Object.entries(parsed.procs)) {
                if (excludeRegex?.some((r) => r.test(id))) continue
                procs[id] = {
                    ...processConfigDefaults,
                    ...config,
                }
            }

            return {
                procs,
                options: parsed.options,
            }
        },
    },
})

export const { setConfig, loadConfig } = configSlice.actions

export default configSlice.reducer
