export async function chainUntilSettled(promises: Array<() => Promise<any>>) {
    let chain = Promise.resolve()
    while (promises.length > 0) {
        chain = chain.finally(promises.shift())
    }

    return chain
}
