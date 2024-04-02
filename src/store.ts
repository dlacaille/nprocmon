import { configureStore } from '@reduxjs/toolkit'
import configSlice from './reducers/config-slice.js'
import processesSlice from './reducers/processes-slice.js'

export const store = configureStore({
    reducer: {
        config: configSlice,
        processes: processesSlice,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
