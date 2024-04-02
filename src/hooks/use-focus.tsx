import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import useMappings from './use-mappings.js'

export type FocusContextType = {
    focused?: string
    focusables: string[]
    setFocused(id?: string): void
    focusNext(): void
    focusPrevious(): void
    focus(id?: string): void
    register(id?: string): void
    unregister(id?: string): void
}

const focusContext = createContext<FocusContextType>({
    focusables: [],
    setFocused() {},
    focusNext() {},
    focusPrevious() {},
    focus() {},
    register() {},
    unregister() {},
})

export function FocusProvider({ children }: { readonly children: any }) {
    const [focused, setFocused] = useState<string | undefined>()
    const [focusables, setFocusables] = useState<string[]>([])

    const focusablesRef = useRef(focusables)
    useEffect(() => {
        focusablesRef.current = focusables
    }, [focusables])

    const focusPrevious = useCallback(() => {
        setFocused((f) => {
            const index = f ? focusablesRef.current.indexOf(f) : -1
            return focusablesRef.current[
                index < 1 ? focusablesRef.current.length - 1 : index - 1
            ]
        })
    }, [setFocused])

    const focusNext = useCallback(() => {
        setFocused((f) => {
            const index = f ? focusablesRef.current.indexOf(f) : -1
            return focusablesRef.current[
                (index + 1) % focusablesRef.current.length
            ]
        })
    }, [setFocused])

    const register = useCallback(
        (id: string) => {
            setFocusables((f) => [...f, id])
        },
        [setFocusables],
    )

    const unregister = useCallback(
        (id: string) => {
            setFocusables((f) => {
                const index = f.indexOf(id)
                if (index >= 0)
                    return [...f.slice(0, index), ...f.slice(index + 1)]

                return f
            })
        },
        [setFocusables],
    )

    useMappings({
        focusNext,
    })

    const focusContextValue = useMemo<FocusContextType>(
        () => ({
            focused,
            setFocused,
            focusables,
            focus: setFocused,
            focusNext,
            focusPrevious,
            register,
            unregister,
        }),
        [
            focused,
            setFocused,
            focusNext,
            focusPrevious,
            focusables,
            register,
            unregister,
        ],
    )

    return (
        <focusContext.Provider value={focusContextValue}>
            {children}
        </focusContext.Provider>
    )
}

export function useFocusManager() {
    const { focused, setFocused, focus, focusNext, focusPrevious } =
        useContext(focusContext)

    return useMemo(
        () => ({ focused, setFocused, focus, focusNext, focusPrevious }),
        [focused, setFocused, focus, focusNext, focusPrevious],
    )
}

type Options = {
    id: string
    autoFocus?: boolean
}

export default function useFocus(options: string | Options) {
    const id = typeof options === 'string' ? options : options.id
    const autoFocus = Boolean(typeof options === 'object' && options.autoFocus)

    const {
        focused,
        setFocused,
        focus,
        focusNext,
        focusPrevious,
        register,
        unregister,
    } = useContext(focusContext)

    useEffect(() => {
        if (autoFocus) setFocused(id)
    }, [id, setFocused, autoFocus])

    useEffect(() => {
        register(id)
        return () => {
            unregister(id)
        }
    }, [id, register, unregister, setFocused])

    return {
        isFocused: focused === id,
        setFocused,
        focused,
        focus,
        focusNext,
        focusPrevious,
    }
}
