import React, { useEffect, useState } from 'react'
import { Text } from 'react-curse'
import type { Modifier } from 'react-curse/screen'
import useCursorContext from '../hooks/use-cursor-context.jsx'

type Props = {
    readonly children?: any
    readonly isBlink?: boolean
} & Modifier

const blinkInterval = 500

export default function EmulatedCursor({
    children,
    isBlink,
    ...otherProps
}: Props) {
    const { isFocused, isRunning } = useCursorContext()
    const [isBlinkOn, setIsBlinkOn] = useState(true)

    const isShowCursor = isFocused && isRunning

    useEffect(() => {
        if (!isShowCursor || !isBlink) return

        const interval = setInterval(() => {
            setIsBlinkOn((b) => !b)
        }, blinkInterval)

        return () => {
            setIsBlinkOn(true)
            clearInterval(interval)
        }
    }, [isBlink, isShowCursor])

    return (
        <Text
            {...otherProps}
            inverse={isShowCursor ? isBlinkOn : otherProps.inverse}
        >
            {children}
        </Text>
    )
}
