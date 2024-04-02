import React, { createContext, useContext } from 'react'

type CursorContextType = {
    readonly isFocused?: boolean
    readonly isRunning?: boolean
}

const cursorContext = createContext<CursorContextType>({})

export default function useCursorContext() {
    return useContext(cursorContext)
}

export function CursorContextProvider({
    children,
    ...contextValue
}: CursorContextType & { readonly children?: any }) {
    return (
        <cursorContext.Provider value={contextValue}>
            {children}
        </cursorContext.Provider>
    )
}
