export const buildTree = (categoryItems) => {
  const nodes = new Map(
    categoryItems.map((item) => [item.id, { item, children: [] }])
  )

  const roots = []

  nodes.forEach((node) => {
    const parentId = (node.item.parents || []).find((id) => nodes.has(id))
    if (parentId) {
      nodes.get(parentId).children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodeList) => {
    nodeList.sort((a, b) => a.item.name.localeCompare(b.item.name))
    nodeList.forEach((node) => sortNodes(node.children))
  }

  sortNodes(roots)
  return roots
}

export const flattenTree = (nodes, depth = 0) =>
  nodes.flatMap((node) => [
    { item: node.item, depth },
    ...flattenTree(node.children, depth + 1)
  ])
