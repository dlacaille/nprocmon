import type {
    Disposable,
    EventListener,
    InferFromArray,
    InferFromEventListener,
} from '../types/types.js'

export class EventManager<T extends Record<string, Array<EventListener<any>>>> {
    constructor(private readonly events: T) {}

    trigger<N extends keyof T>(
        name: N,
        event: InferFromEventListener<InferFromArray<T[N]>>,
    ) {
        for (const listener of this.events[name] ?? []) listener(event)
    }

    addEventListener<K extends keyof T>(
        name: keyof T,
        listener: EventListener<InferFromArray<T[K]>>,
    ): Disposable {
        const index = this.events[name].push(listener) - 1
        return {
            dispose: () => {
                this.events[name].splice(index, 1)
            },
        }
    }
}
