/**
 * Minimum spanning tree algorithms. Both return the selected edges
 * rather than a new graph; edge weights are read from `Edge.weight`.
 */
import type { Graph, NodeId, Edge } from "@quokkaquery/graph";

/**
 * Kruskal's minimum spanning tree / forest.
 * Works on undirected graphs. For directed graphs, operates on
 * edges as if they were undirected.
 *
 * @returns Array of edges forming the MST, sorted by weight.
 */
export function kruskal<T, E>(graph: Graph<T, E>): Edge<E>[] {
  const parent = new Map<NodeId, NodeId>();
  const rank = new Map<NodeId, number>();

  for (const id of graph.nodeIds()) {
    parent.set(id, id);
    rank.set(id, 0);
  }

  function find(x: NodeId): NodeId {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!); // path compression
      x = parent.get(x)!;
    }
    return x;
  }

  function union(a: NodeId, b: NodeId): boolean {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    const rankA = rank.get(ra)!;
    const rankB = rank.get(rb)!;
    if (rankA < rankB) {
      parent.set(ra, rb);
    } else if (rankA > rankB) {
      parent.set(rb, ra);
    } else {
      parent.set(rb, ra);
      rank.set(ra, rankA + 1);
    }
    return true;
  }

  const edges = [...graph.edges()].sort((a, b) => a.weight - b.weight);
  const mst: Edge<E>[] = [];

  for (const e of edges) {
    if (union(e.from, e.to)) {
      mst.push(e);
    }
  }

  return mst;
}

/**
 * Prim's minimum spanning tree starting from a given node.
 * Works on undirected graphs. Only edges returned by `outEdges` are
 * followed, so on a directed graph the tree covers just the nodes
 * reachable from `start` along edge direction.
 *
 * Unlike {@link kruskal}, this does not produce a forest: on a
 * disconnected graph the result spans only the start node's component.
 *
 * @param start Root of the tree; defaults to the first id from `graph.nodeIds()`.
 * @returns Edges in the order they were added to the tree (not globally
 *   sorted by weight); empty for a graph with no nodes.
 */
export function prim<T, E>(graph: Graph<T, E>, start?: NodeId): Edge<E>[] {
  const ids = graph.nodeIds();
  if (ids.length === 0) return [];

  const startNode = start ?? ids[0];
  const inMST = new Set<NodeId>();
  const mst: Edge<E>[] = [];
  const candidates: Edge<E>[] = [];

  inMST.add(startNode);
  for (const e of graph.outEdges(startNode)) {
    candidates.push(e);
  }

  while (candidates.length > 0 && inMST.size < ids.length) {
    candidates.sort((a, b) => a.weight - b.weight);
    let picked = -1;
    for (let i = 0; i < candidates.length; i++) {
      if (!inMST.has(candidates[i].to)) {
        picked = i;
        break;
      }
    }
    if (picked === -1) break;

    const edge = candidates.splice(picked, 1)[0];
    inMST.add(edge.to);
    mst.push(edge);

    for (const e of graph.outEdges(edge.to)) {
      if (!inMST.has(e.to)) {
        candidates.push(e);
      }
    }
  }

  return mst;
}
