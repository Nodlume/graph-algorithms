/**
 * Maximum flow over a weighted directed graph. The residual network is built
 * in local maps keyed by `from->to` strings, so the input graph is only read,
 * never mutated.
 */
import type { Graph, NodeId } from "@quokkaquery/graph";
import type { MaxFlowResult } from "./types.js";

/**
 * Edmonds-Karp maximum flow algorithm (BFS-based Ford-Fulkerson).
 * Edge weights are treated as capacities.
 *
 * @returns Maximum flow value and per-edge flow map.
 */
export function maxFlow<T, E>(
  graph: Graph<T, E>,
  source: NodeId,
  sink: NodeId
): MaxFlowResult {
  const capacity = new Map<string, number>();
  const adj = new Map<NodeId, Set<NodeId>>();

  function key(u: NodeId, v: NodeId): string {
    return `${u}->${v}`;
  }

  function ensureAdj(id: NodeId): void {
    if (!adj.has(id)) adj.set(id, new Set());
  }

  for (const id of graph.nodeIds()) {
    ensureAdj(id);
  }

  for (const e of graph.edges()) {
    const k = key(e.from, e.to);
    capacity.set(k, (capacity.get(k) ?? 0) + e.weight);
    if (!capacity.has(key(e.to, e.from))) {
      capacity.set(key(e.to, e.from), 0);
    }
    adj.get(e.from)!.add(e.to);
    adj.get(e.to)!.add(e.from);
  }

  let totalFlow = 0;

  function bfs(): NodeId[] | null {
    const parent = new Map<NodeId, NodeId>();
    const visited = new Set<NodeId>([source]);
    const queue: NodeId[] = [source];

    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const v of adj.get(u) ?? []) {
        if (!visited.has(v) && (capacity.get(key(u, v)) ?? 0) > 0) {
          visited.add(v);
          parent.set(v, u);
          if (v === sink) {
            const path: NodeId[] = [sink];
            let cur = sink;
            while (cur !== source) {
              cur = parent.get(cur)!;
              path.unshift(cur);
            }
            return path;
          }
          queue.push(v);
        }
      }
    }
    return null;
  }

  let path: NodeId[] | null;
  while ((path = bfs()) !== null) {
    let bottleneck = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      bottleneck = Math.min(bottleneck, capacity.get(key(path[i], path[i + 1]))!);
    }

    for (let i = 0; i < path.length - 1; i++) {
      const fwd = key(path[i], path[i + 1]);
      const rev = key(path[i + 1], path[i]);
      capacity.set(fwd, capacity.get(fwd)! - bottleneck);
      capacity.set(rev, (capacity.get(rev) ?? 0) + bottleneck);
    }

    totalFlow += bottleneck;
  }

  const flow = new Map<string, number>();
  for (const e of graph.edges()) {
    const k = key(e.from, e.to);
    const originalCap = e.weight;
    const residual = capacity.get(k) ?? 0;
    const edgeFlow = originalCap - residual;
    if (edgeFlow > 0) {
      flow.set(k, (flow.get(k) ?? 0) + edgeFlow);
    }
  }

  return { maxFlow: totalFlow, flow };
}
