export function arrayMove<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const result = list.slice()
  const [item] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, item)
  return result
}
