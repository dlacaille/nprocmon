import React, { createContext } from 'react'
import processManagerService, {
    ProcessManagerService,
} from '../services/process-manager-service'
import useConfig from '../hooks/use-config'
import useAppDispatch from '../hooks/use-app-dispatch'

export const ProcessManagerContext = createContext<
    ProcessManagerService | undefined
>(undefined)

let processManagerSingleton: ProcessManagerService | undefined

type Props = {
    input?: string[]
    children: React.ReactNode
}

export default function ProcessManagerProvider({ children, input }: Props) {
    const config = useConfig()
    const dispatch = useAppDispatch()

    if (!processManagerSingleton)
        processManagerSingleton = processManagerService(config, dispatch, input)

    return (
        <ProcessManagerContext.Provider value={processManagerSingleton}>
            {children}
        </ProcessManagerContext.Provider>
    )
}
