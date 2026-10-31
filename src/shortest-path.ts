/**
 * Weighted shortest-path algorithms over a `Graph`: Bellman-Ford for single
 * sources with negative weights, Floyd-Warshall for all pairs, and A* for
 * heuristic-guided point-to-point search. Bellman-Ford and Floyd-Warshall
 * throw on negative-weight cycles rather than returning meaningless distances.
 */
import type { Graph, NodeId } from "@quokkaquery/graph";
import type {
  ShortestPathResult,
  DistanceMap,
  PredecessorMap,
  DistanceMatrix,
  NextHopMatrix,
  Heuristic,
} from "./types.js";

// ── Bellman-Ford ─────────────────────────────────────────────────

/**
 * Bellman-Ford single-source shortest paths.
 * Supports negative edge weights. Detects negative cycles.
 *
 * @returns Distance and predecessor maps, or throws if a negative cycle is reachable.
 */
export function bellmanFord<T, E>(
  graph: Graph<T, E>,
  source: NodeId
): { distances: DistanceMap; predecessors: PredecessorMap } {
  const ids = graph.nodeIds();
  const dist: DistanceMap = new Map();
  const prev: PredecessorMap = new Map();

  for (const id of ids) {
    dist.set(id, Infinity);
    prev.set(id, null);
  }
  dist.set(source, 0);

  const allEdges = graph.edges();
  const n = ids.length;

  // Relax edges n-1 times
  for (let i = 0; i < n - 1; i++) {
    let changed = false;
    for (const e of allEdges) {
      const du = dist.get(e.from)!;
      if (du === Infinity) continue;
      const alt = du + e.weight;
      if (alt < dist.get(e.to)!) {
        dist.set(e.to, alt);
        prev.set(e.to, e.from);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Check for negative cycles
  for (const e of allEdges) {
    const du = dist.get(e.from)!;
    if (du === Infinity) continue;
    if (du + e.weight < dist.get(e.to)!) {
      throw new Error("Graph contains a negative-weight cycle");
    }
  }

  return { distances: dist, predecessors: prev };
}

/**
 * Bellman-Ford shortest path between two nodes.
 * Returns the path and distance, or undefined if unreachable.
 * Throws if a negative cycle is reachable from the source.
 */
export function bellmanFordPath<T, E>(
  graph: Graph<T, E>,
  source: NodeId,
  target: NodeId
): ShortestPathResult | undefined {
  const { distances, predecessors } = bellmanFord(graph, source);
  const d = distances.get(target);
  if (d === undefined || d === Infinity) return undefined;

  const path: NodeId[] = [];
  let cur: NodeId | null = target;
  while (cur !== null) {
    path.unshift(cur);
    cur = predecessors.get(cur) ?? null;
  }
  return { distance: d, path };
}

// ── Floyd-Warshall ───────────────────────────────────────────────

/**
 * Floyd-Warshall all-pairs shortest paths.
 * Returns distance and next-hop matrices for path reconstruction.
 *
 * @throws If the graph contains a negative cycle (detected via negative diagonal).
 */
export function floydWarshall<T, E>(
  graph: Graph<T, E>
): { distances: DistanceMatrix; nextHop: NextHopMatrix } {
  const ids = graph.nodeIds();
  const dist: DistanceMatrix = new Map();
  const next: NextHopMatrix = new Map();

  // Initialize
  for (const u of ids) {
    dist.set(u, new Map());
    next.set(u, new Map());
    for (const v of ids) {
      dist.get(u)!.set(v, u === v ? 0 : Infinity);
      next.get(u)!.set(v, null);
    }
  }

  // Seed with direct edges
  for (const e of graph.edges()) {
    const current = dist.get(e.from)!.get(e.to)!;
    if (e.weight < current) {
      dist.get(e.from)!.set(e.to, e.weight);
      next.get(e.from)!.set(e.to, e.to);
    }
  }

  // Relax through each intermediate
  for (const k of ids) {
    for (const i of ids) {
      for (const j of ids) {
        const ik = dist.get(i)!.get(k)!;
        const kj = dist.get(k)!.get(j)!;
        if (ik === Infinity || kj === Infinity) continue;
        const through = ik + kj;
        if (through < dist.get(i)!.get(j)!) {
          dist.get(i)!.set(j, through);
          next.get(i)!.set(j, next.get(i)!.get(k) ?? null);
        }
      }
    }
  }

  // Negative cycle detection
  for (const id of ids) {
    if (dist.get(id)!.get(id)! < 0) {
      throw new Error("Graph contains a negative-weight cycle");
    }
  }

  return { distances: dist, nextHop: next };
}

/**
 * Walks the `nextHop` matrix from `floydWarshall` to rebuild the node sequence
 * from `source` to `target`, inclusive. Returns undefined when `target` is
 * unreachable or either node is missing from the matrix. Also returns
 * undefined when `source === target`, because Floyd-Warshall leaves the
 * diagonal next-hop entries null.
 */
export function reconstructPath(
  nextHop: NextHopMatrix,
  source: NodeId,
  target: NodeId
): NodeId[] | undefined {
  if (nextHop.get(source)?.get(target) === null) return undefined;
  const path: NodeId[] = [source];
  let cur = source;
  while (cur !== target) {
    const hop = nextHop.get(cur)?.get(target);
    if (hop === null || hop === undefined) return undefined;
    path.push(hop);
    cur = hop;
  }
  return path;
}

// ── A* ───────────────────────────────────────────────────────────

/**
 * A* shortest path with a heuristic function.
 * Expanded nodes are closed and never reopened, so the heuristic must be
 * consistent (h(u) <= w(u,v) + h(v), which implies admissible) for the
 * result to be optimal; an admissible but inconsistent heuristic can return
 * a longer path. The open list is a plain array re-sorted on every pop, so
 * each step costs O(k log k) in the open-list size.
 *
 * @param heuristic - Estimates cost from a node to the goal; called as `heuristic(node, goal)`.
 * @returns Shortest path result, or undefined if unreachable.
 */
export function astar<T, E>(
  graph: Graph<T, E>,
  start: NodeId,
  goal: NodeId,
  heuristic: Heuristic
): ShortestPathResult | undefined {
  const gScore = new Map<NodeId, number>();
  const fScore = new Map<NodeId, number>();
  const prev = new Map<NodeId, NodeId | null>();
  const closed = new Set<NodeId>();

  const open: NodeId[] = [start];
  gScore.set(start, 0);
  fScore.set(start, heuristic(start, goal));
  prev.set(start, null);

  while (open.length > 0) {
    open.sort((a, b) => (fScore.get(a) ?? Infinity) - (fScore.get(b) ?? Infinity));
    const current = open.shift()!;

    if (current === goal) {
      const path: NodeId[] = [];
      let cur: NodeId | null = goal;
      while (cur !== null) {
        path.unshift(cur);
        cur = prev.get(cur) ?? null;
      }
      return { distance: gScore.get(goal)!, path };
    }

    closed.add(current);

    for (const edge of graph.outEdges(current)) {
      if (closed.has(edge.to)) continue;

      const tentativeG = gScore.get(current)! + edge.weight;
      const currentG = gScore.get(edge.to) ?? Infinity;

      if (tentativeG < currentG) {
        prev.set(edge.to, current);
        gScore.set(edge.to, tentativeG);
        fScore.set(edge.to, tentativeG + heuristic(edge.to, goal));
        if (!open.includes(edge.to)) {
          open.push(edge.to);
        }
      }
    }
  }

  return undefined;
}
