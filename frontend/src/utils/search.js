export const toggleInList = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

export const buildSearchText = (item, categoryById) => {
  const parts = [
    item.name,
    item.type,
    item.description,
    ...(item.synonyms || []),
    ...(item.tags || []),
    categoryById.get(item.category)?.name || ''
  ]
  return parts.join(' ').toLowerCase()
}
