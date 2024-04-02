import processManagerService, {
    type ProcessManagerService,
} from '../services/process-manager-service.js'
import type { AppConfig, ProcessId } from '../types/types.js'
import type { AppDispatch } from '../store.js'
import useAppDispatch from './use-app-dispatch.js'
import useConfig from './use-config.js'

let processManagerSingleton: ProcessManagerService | undefined

export function useProcessManager() {
    const config = useConfig()
    const dispatch = useAppDispatch()

    if (!processManagerSingleton)
        processManagerSingleton = processManagerService(config, dispatch)

    return processManagerSingleton
}
