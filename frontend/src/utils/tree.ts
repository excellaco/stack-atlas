// Tree utilities for the "hierarchy" view mode in the editor.
//
// Items can declare parent relationships via their `parents` array. buildTree()
// constructs a forest (multiple roots) from the flat item list within a single
// category. Only the first parent present in the current filtered set is used —
// an item with parents: ["a", "b"] will be placed under "a" if it exists in the
// set, otherwise under "b". If no parent is present, the item becomes a root.
//
// flattenTree() converts the forest into a flat array with depth info, which
// the ListPanel renders as a flat list with CSS-based indentation (data-depth
// attribute → left padding). This is simpler than nested DOM elements and works
// well with virtual scrolling if needed later.
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
