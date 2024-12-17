import { useContext } from 'react'
import { ProcessManagerContext } from '../context/process-manager-context'

export function useProcessManager() {
    return useContext(ProcessManagerContext)!
}
