export const getParentName = (item, itemsById) => {
  const parentId = item.parents?.[0]
  if (!parentId) return null
  return itemsById.get(parentId)?.name
}

export const computeDiff = (prevSnapshot, currSnapshot) => {
  const prevStack = new Set(prevSnapshot?.stack || [])
  const currStack = new Set(currSnapshot?.stack || [])

  const stackAdded = [...currStack].filter((id) => !prevStack.has(id))
  const stackRemoved = [...prevStack].filter((id) => !currStack.has(id))

  const prevProviders = new Set(prevSnapshot?.providers || [])
  const currProviders = new Set(currSnapshot?.providers || [])
  const providersAdded = [...currProviders].filter((p) => !prevProviders.has(p))
  const providersRemoved = [...prevProviders].filter((p) => !currProviders.has(p))

  const prevSubs = prevSnapshot?.subsystems || {}
  const currSubs = currSnapshot?.subsystems || {}

  const prevSubIds = new Set(Object.keys(prevSubs))
  const currSubIds = new Set(Object.keys(currSubs))

  const subsystemsAdded = [...currSubIds]
    .filter((id) => !prevSubIds.has(id))
    .map((id) => ({ id, name: currSubs[id]?.name || id }))

  const subsystemsRemoved = [...prevSubIds]
    .filter((id) => !currSubIds.has(id))
    .map((id) => ({ id, name: prevSubs[id]?.name || id }))

  const subsystemsChanged = [...currSubIds]
    .filter((id) => prevSubIds.has(id))
    .map((id) => {
      const prev = prevSubs[id] || {}
      const curr = currSubs[id] || {}
      const prevAdd = new Set(prev.additions || [])
      const currAdd = new Set(curr.additions || [])
      const prevExcl = new Set(prev.exclusions || [])
      const currExcl = new Set(curr.exclusions || [])

      const additionsAdded = [...currAdd].filter((x) => !prevAdd.has(x))
      const additionsRemoved = [...prevAdd].filter((x) => !currAdd.has(x))
      const exclusionsAdded = [...currExcl].filter((x) => !prevExcl.has(x))
      const exclusionsRemoved = [...prevExcl].filter((x) => !currExcl.has(x))

      if (!additionsAdded.length && !additionsRemoved.length && !exclusionsAdded.length && !exclusionsRemoved.length) {
        return null
      }
      return { id, name: curr.name || id, additionsAdded, additionsRemoved, exclusionsAdded, exclusionsRemoved }
    })
    .filter(Boolean)

  return { stackAdded, stackRemoved, providersAdded, providersRemoved, subsystemsAdded, subsystemsRemoved, subsystemsChanged }
}

export const resolveItemName = (id, itemsById) => {
  const item = itemsById.get(id)
  return item ? `${item.name} (${item.type})` : id
}

export const formatTimeAgo = (timestamp) => {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
