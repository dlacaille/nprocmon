import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import type {
    ActionType,
    KeyMapping,
    KeyPress,
    Mapping,
} from '../types/types.js'
import mappings from '../mappings/mappings.js'
import keypress from '../utils/keypress.js'
import crypto from 'node:crypto'

function matchKeypress(key: KeyMapping, pressed: KeyPress): boolean {
    if (typeof key === 'string') {
        // When the key is a string, match the name or raw value
        return pressed.name === key || pressed.raw === key
    }

    if (typeof key === 'object' && Array.isArray(key)) {
        // When the key is an array, any of the keys can match
        return key.some((k) => matchKeypress(k, pressed))
    }

    return (
        // Match modifiers exactly
        Boolean(key.ctrl) === Boolean(pressed.ctrl) &&
        Boolean(key.shift) === Boolean(pressed.shift) &&
        Boolean(key.meta) === Boolean(pressed.meta) &&
        Boolean(key.option) === Boolean(pressed.option) &&
        // When raw, name or code is specified, match it's value
        (key.raw === undefined || key.raw === pressed.raw) &&
        (key.name === undefined || key.name === pressed.name) &&
        (key.code === undefined || key.code === pressed.code)
    )
}

export type MappingContextType = {
    isCaptured: boolean
    activeMappingsById: Record<string, ActionType[]>
    setIsCaptured(captured: boolean): void
    registerActiveMappings(mappings: ActionType[]): string
    unregisterActiveMappings(id: string): void
}

const mappingContext = createContext<MappingContextType>({
    isCaptured: false,
    setIsCaptured() {},
    activeMappingsById: {},
    registerActiveMappings() {
        return ''
    },
    unregisterActiveMappings() {},
})

export function MappingProvider({ children }: { readonly children: any }) {
    const [isCaptured, setIsCaptured] = useState(false)
    const [activeMappingsById, setActiveMappingsById] = useState<
        Record<string, ActionType[]>
    >({})

    const registerActiveMappings = useCallback(
        (mappings: ActionType[]) => {
            const uuid = crypto.randomUUID()
            setActiveMappingsById((m) => ({ ...m, [uuid]: mappings }))
            return uuid
        },
        [setActiveMappingsById],
    )

    const unregisterActiveMappings = useCallback(
        (id: string) => {
            setActiveMappingsById((m) => {
                const { [id]: _omit, ...rest } = m
                return rest
            })
        },
        [setActiveMappingsById],
    )

    const mappingContextValue = useMemo<MappingContextType>(
        () => ({
            isCaptured,
            setIsCaptured,
            activeMappingsById,
            registerActiveMappings,
            unregisterActiveMappings,
        }),
        [
            isCaptured,
            setIsCaptured,
            activeMappingsById,
            registerActiveMappings,
            unregisterActiveMappings,
        ],
    )

    return (
        <mappingContext.Provider value={mappingContextValue}>
            {children}
        </mappingContext.Provider>
    )
}

type Options = {
    isActive?: boolean
    capture?: boolean
}

export default function useMappings(
    actionMappings: Partial<Record<ActionType, () => void>>,
    options?: Options,
) {
    const isActive = options?.isActive ?? true
    const capture = options?.capture ?? false
    const actionMappingsRef = useRef(actionMappings)

    const {
        isCaptured,
        setIsCaptured: setCaptured,
        registerActiveMappings,
        unregisterActiveMappings,
    } = useContext(mappingContext)

    const shouldListen = isActive && (capture || !isCaptured)

    useEffect(() => {
        actionMappingsRef.current = actionMappings
    }, [actionMappings, registerActiveMappings, unregisterActiveMappings])

    useEffect(() => {
        if (!shouldListen) return
        const id = registerActiveMappings(
            Object.keys(actionMappings) as ActionType[],
        )
        return () => {
            unregisterActiveMappings(id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldListen, registerActiveMappings, unregisterActiveMappings])

    useEffect(() => {
        if (isCaptured || !capture) return
        setCaptured(true)
        return () => {
            setCaptured(false)
        }
    }, [isCaptured, setCaptured, capture])

    useEffect(() => {
        if (!shouldListen) return

        const listener = (data: Buffer | string) => {
            const pressed = keypress(data)
            const { current } = actionMappingsRef

            for (const [k, action] of Object.entries(current)) {
                const { key } = mappings[k as ActionType]
                if (matchKeypress(key, pressed)) action()
            }
        }

        process.stdin.on('data', listener)
        return () => {
            process.stdin.off('data', listener)
        }
    }, [shouldListen])
}

export function useActiveMappings(): Partial<Record<ActionType, Mapping>> {
    const { activeMappingsById } = useContext(mappingContext)
    return useMemo(() => {
        const result: Partial<Record<ActionType, Mapping>> = {}
        for (const activeMappings of Object.values(activeMappingsById)) {
            for (const actionType of activeMappings) {
                if (!result[actionType]) {
                    result[actionType] = mappings[actionType]
                }
            }
        }

        return result
    }, [activeMappingsById])
}
