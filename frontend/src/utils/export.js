export const technologyTypes = new Set([
  'Capability',
  'Technique',
  'Pattern',
  'Practice',
  'Methodology',
  'Test Type',
  'Standard'
])

export const toolTypes = new Set([
  'Tool',
  'Service',
  'Platform',
  'Framework',
  'Library',
  'Language',
  'Runtime',
  'DataStore'
])

export const buildExportData = (selectedIds, itemsById, categories) => {
  const selectedItems = selectedIds
    .map((id) => itemsById.get(id))
    .filter(Boolean)

  const categoriesPayload = categories
    .map((category) => {
      const categoryItems = selectedItems.filter(
        (item) => item.category === category.id
      )

      if (!categoryItems.length) return null

      const technologies = categoryItems
        .filter((item) => technologyTypes.has(item.type))
        .map((item) => ({ name: item.name, type: item.type }))
        .sort((a, b) => a.name.localeCompare(b.name))

      const tools = categoryItems
        .filter((item) => toolTypes.has(item.type))
        .map((item) => ({ name: item.name, type: item.type }))
        .sort((a, b) => a.name.localeCompare(b.name))

      return {
        name: category.name,
        technologies,
        tools
      }
    })
    .filter(Boolean)

  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    categories: categoriesPayload
  }
}

export const formatExport = (data, format) => {
  if (!data.categories.length) {
    return 'No items selected yet. Use the list to build a standardized stack.'
  }

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  const lines = [`# Standardized Stack`, `Generated: ${data.generatedAt}`, '']
  data.categories.forEach((category) => {
    lines.push(`## ${category.name}`)
    if (category.technologies.length) {
      lines.push(
        `- Technologies: ${category.technologies
          .map((item) => item.name)
          .join('; ')}`
      )
    }
    if (category.tools.length) {
      lines.push(
        `- Tools: ${category.tools.map((item) => item.name).join('; ')}`
      )
    }
    lines.push('')
  })
  return lines.join('\n')
}
