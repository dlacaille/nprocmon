export default function wildcardRegex(wildcard: string) {
  return new RegExp(
    '^' +
    wildcard
      .replace(/\./g, '\\.')
      .replace(/\\/g, '\\\\')
      .replace(/\?/g, '.')
      .replace(/\*/g, '.*') +
    '$',
  )
}
