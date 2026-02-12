import type { EnrichedItem, TreeNode, FlattenedNode } from "../types";

export const buildTree = (categoryItems: EnrichedItem[]): TreeNode[] => {
  const nodes = new Map<string, TreeNode>(
    categoryItems.map((item) => [item.id, { item, children: [] }])
  );

  const roots: TreeNode[] = [];

  nodes.forEach((node) => {
    const parentId = (node.item.parents || []).find((id) => nodes.has(id));
    if (parentId) {
      nodes.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodeList: TreeNode[]): void => {
    nodeList.sort((a, b) => a.item.name.localeCompare(b.item.name));
    nodeList.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
};

export const flattenTree = (nodes: TreeNode[], depth: number = 0): FlattenedNode[] =>
  nodes.flatMap((node) => [{ item: node.item, depth }, ...flattenTree(node.children, depth + 1)]);
