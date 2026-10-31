/**
 * Connectivity structure of a graph: strongly connected components and their
 * condensation DAG, bridges, articulation points, and bipartiteness.
 *
 * The SCC, bridge and articulation-point searches use recursive DFS, so call
 * depth grows with the longest DFS path and very deep graphs can exhaust the
 * JavaScript call stack.
 */
import { Graph as GraphClass, type NodeId } from "@quokkaquery/graph";
import type { Graph } from "@quokkaquery/graph";

// ── Strongly Connected Components ────────────────────────────────

/**
 * Tarjan's algorithm for strongly connected components.
 * Throws if the graph is undirected.
 *
 * @returns Array of components, each being an array of node ids.
 *          Components are in reverse topological order.
 */
export function stronglyConnectedComponents<T, E>(
  graph: Graph<T, E>
): NodeId[][] {
  if (!graph.directed) {
    throw new Error("Strongly connected components requires a directed graph");
  }

  let index = 0;
  const nodeIndex = new Map<NodeId, number>();
  const lowLink = new Map<NodeId, number>();
  const onStack = new Set<NodeId>();
  const stack: NodeId[] = [];
  const components: NodeId[][] = [];

  function strongConnect(v: NodeId): void {
    nodeIndex.set(v, index);
    lowLink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of graph.neighbors(v)) {
      if (!nodeIndex.has(w)) {
        strongConnect(w);
        lowLink.set(v, Math.min(lowLink.get(v)!, lowLink.get(w)!));
      } else if (onStack.has(w)) {
        lowLink.set(v, Math.min(lowLink.get(v)!, nodeIndex.get(w)!));
      }
    }

    if (lowLink.get(v) === nodeIndex.get(v)) {
      const component: NodeId[] = [];
      let w: NodeId;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      components.push(component);
    }
  }

  for (const id of graph.nodeIds()) {
    if (!nodeIndex.has(id)) {
      strongConnect(id);
    }
  }

  return components;
}

/**
 * Condensation graph: collapse each SCC into a single node.
 * The resulting DAG has SCC indices as node ids and data as the component members.
 * Edges between different SCCs are preserved (deduplicated).
 */
export function condensation<T, E>(
  graph: Graph<T, E>
): { components: NodeId[][]; dag: GraphClass<NodeId[], void> } {
  const components = stronglyConnectedComponents(graph);
  const nodeToComp = new Map<NodeId, number>();
  for (let i = 0; i < components.length; i++) {
    for (const id of components[i]) {
      nodeToComp.set(id, i);
    }
  }

  const dag = new GraphClass<NodeId[], void>({ directed: true });
  for (let i = 0; i < components.length; i++) {
    dag.addNode(i, components[i]);
  }

  const seenEdges = new Set<string>();
  for (const e of graph.edges()) {
    const from = nodeToComp.get(e.from)!;
    const to = nodeToComp.get(e.to)!;
    if (from !== to) {
      const key = `${from}->${to}`;
      if (!seenEdges.has(key)) {
        seenEdges.add(key);
        dag.addEdge(from, to);
      }
    }
  }

  return { components, dag };
}

// ── Bridges & Articulation Points ────────────────────────────────

/**
 * Find all bridges (cut edges) in an undirected graph.
 * A bridge is an edge whose removal disconnects the graph.
 *
 * Uses Tarjan's bridge-finding algorithm.
 *
 * @returns Array of [parent, child] pairs in DFS-tree orientation, which
 *          may be the reverse of the edge's stored from/to.
 */
export function findBridges<T, E>(graph: Graph<T, E>): [NodeId, NodeId][] {
  let timer = 0;
  const disc = new Map<NodeId, number>();
  const low = new Map<NodeId, number>();
  const visited = new Set<NodeId>();
  const bridges: [NodeId, NodeId][] = [];

  function dfs(u: NodeId, parent: NodeId | null): void {
    visited.add(u);
    disc.set(u, timer);
    low.set(u, timer);
    timer++;

    for (const v of graph.neighbors(u)) {
      if (!visited.has(v)) {
        dfs(v, u);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        if (low.get(v)! > disc.get(u)!) {
          bridges.push([u, v]);
        }
      } else if (v !== parent) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
  }

  for (const id of graph.nodeIds()) {
    if (!visited.has(id)) {
      dfs(id, null);
    }
  }

  return bridges;
}

/**
 * Find all articulation points (cut vertices) in an undirected graph.
 * An articulation point is a vertex whose removal disconnects the graph.
 *
 * @returns Array of node ids that are articulation points.
 */
export function findArticulationPoints<T, E>(graph: Graph<T, E>): NodeId[] {
  let timer = 0;
  const disc = new Map<NodeId, number>();
  const low = new Map<NodeId, number>();
  const visited = new Set<NodeId>();
  const ap = new Set<NodeId>();

  function dfs(u: NodeId, parent: NodeId | null): void {
    visited.add(u);
    disc.set(u, timer);
    low.set(u, timer);
    timer++;
    let children = 0;

    for (const v of graph.neighbors(u)) {
      if (!visited.has(v)) {
        children++;
        dfs(v, u);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));

        if (parent === null && children > 1) ap.add(u);
        if (parent !== null && low.get(v)! >= disc.get(u)!) ap.add(u);
      } else if (v !== parent) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
  }

  for (const id of graph.nodeIds()) {
    if (!visited.has(id)) {
      dfs(id, null);
    }
  }

  return [...ap];
}

// ── Bipartite ────────────────────────────────────────────────────

/**
 * Check if a graph is bipartite (2-colorable).
 * Uses BFS coloring.
 *
 * @returns The two partitions if bipartite, or null if not.
 */
export function bipartiteCheck<T, E>(
  graph: Graph<T, E>
): { partA: NodeId[]; partB: NodeId[] } | null {
  const color = new Map<NodeId, 0 | 1>();
  const ids = graph.nodeIds();

  for (const start of ids) {
    if (color.has(start)) continue;
    color.set(start, 0);
    const queue: NodeId[] = [start];

    while (queue.length > 0) {
      const u = queue.shift()!;
      const uColor = color.get(u)!;
      const nextColor: 0 | 1 = uColor === 0 ? 1 : 0;

      for (const v of graph.neighbors(u)) {
        if (!color.has(v)) {
          color.set(v, nextColor);
          queue.push(v);
        } else if (color.get(v) === uColor) {
          return null;
        }
      }

      if (graph.directed) {
        for (const v of graph.predecessors(u)) {
          if (!color.has(v)) {
            color.set(v, nextColor);
            queue.push(v);
          } else if (color.get(v) === uColor) {
            return null;
          }
        }
      }
    }
  }

  const partA: NodeId[] = [];
  const partB: NodeId[] = [];
  for (const [id, c] of color) {
    if (c === 0) partA.push(id);
    else partB.push(id);
  }

  return { partA, partB };
}
