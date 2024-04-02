import React from 'react'
import { Text } from 'react-curse'
import { useActiveMappings } from '../hooks/use-mappings.js'
import type { KeyMapping } from '../types/types.js'

function formatKey(key: KeyMapping): string {
    if (typeof key === 'string') return key
    if (typeof key === 'object' && Array.isArray(key)) {
        return key.map((k) => formatKey(k)).join(' or ')
    }

    let str = ''
    if (key.ctrl) str += 'C-'
    if (key.option) str += 'O-'
    if (key.meta) str += 'M-'
    if (key.shift) str += 'S-'
    str += key.name ?? key.code ?? key.raw
    return str
}

export default function MappingsDisplay() {
    const activeMappings = useActiveMappings()

    return (
        <Text absolute color="white" width="100%" height={1} x={0} y="100%-1">
            {Object.entries(activeMappings)
                .filter(([_a, m]) => !m.hide)
                .sort(([a], [b]) => {
                    return a.localeCompare(b)
                })
                .map(([_action, { desc, key }], index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Text key={index}>
                        {'<'}
                        <Text color="yellow">{formatKey(key)}</Text>
                        {`: ${desc}> `}
                    </Text>
                ))}
        </Text>
    )
}
