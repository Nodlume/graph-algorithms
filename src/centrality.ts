/**
 * Node centrality measures (PageRank, betweenness, closeness, degree).
 * Each returns a score for every node in the graph. None of them read edge
 * data: every edge counts as one unweighted hop.
 */
import type { Graph, NodeId } from "@quokkaquery/graph";

/**
 * PageRank algorithm.
 * Rank held by nodes with no outgoing edges is spread evenly across all
 * nodes each iteration, so it is not lost from the total.
 *
 * @param dampingFactor - Probability of following an edge (default 0.85).
 * @param iterations - Maximum number of power iterations (default 100);
 *   stops earlier once converged.
 * @param tolerance - Converged when no node's score changes by this much
 *   or more in one iteration (default 1e-6).
 * @returns Map of node id → PageRank score (sums to ~1).
 */
export function pageRank<T, E>(
  graph: Graph<T, E>,
  dampingFactor = 0.85,
  iterations = 100,
  tolerance = 1e-6
): Map<NodeId, number> {
  const ids = graph.nodeIds();
  const n = ids.length;
  if (n === 0) return new Map();

  const rank = new Map<NodeId, number>();
  const base = (1 - dampingFactor) / n;

  for (const id of ids) rank.set(id, 1 / n);

  for (let iter = 0; iter < iterations; iter++) {
    const newRank = new Map<NodeId, number>();
    for (const id of ids) newRank.set(id, base);

    // Distribute rank along outgoing edges
    let danglingSum = 0;
    for (const id of ids) {
      const outDeg = graph.outDegree(id);
      if (outDeg === 0) {
        danglingSum += rank.get(id)!;
      } else {
        const share = rank.get(id)! / outDeg;
        for (const neighbor of graph.neighbors(id)) {
          newRank.set(neighbor, newRank.get(neighbor)! + dampingFactor * share);
        }
      }
    }

    // Distribute dangling node rank evenly
    const danglingShare = dampingFactor * danglingSum / n;
    for (const id of ids) {
      newRank.set(id, newRank.get(id)! + danglingShare);
    }

    // Check convergence
    let maxDelta = 0;
    for (const id of ids) {
      maxDelta = Math.max(maxDelta, Math.abs(newRank.get(id)! - rank.get(id)!));
      rank.set(id, newRank.get(id)!);
    }
    if (maxDelta < tolerance) break;
  }

  return rank;
}

/**
 * Betweenness centrality using Brandes' algorithm.
 * Measures how often a node lies on shortest paths between other nodes.
 *
 * @returns Map of node id → betweenness centrality score.
 */
export function betweennessCentrality<T, E>(
  graph: Graph<T, E>
): Map<NodeId, number> {
  const ids = graph.nodeIds();
  const cb = new Map<NodeId, number>();
  for (const id of ids) cb.set(id, 0);

  for (const s of ids) {
    const stack: NodeId[] = [];
    const pred = new Map<NodeId, NodeId[]>();
    const sigma = new Map<NodeId, number>(); // # of shortest paths
    const dist = new Map<NodeId, number>();
    const delta = new Map<NodeId, number>();

    for (const v of ids) {
      pred.set(v, []);
      sigma.set(v, 0);
      dist.set(v, -1);
      delta.set(v, 0);
    }
    sigma.set(s, 1);
    dist.set(s, 0);

    // BFS
    const queue: NodeId[] = [s];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      const dv = dist.get(v)!;
      for (const w of graph.neighbors(v)) {
        // w found for the first time?
        if (dist.get(w)! < 0) {
          queue.push(w);
          dist.set(w, dv + 1);
        }
        // shortest path to w via v?
        if (dist.get(w) === dv + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    // Accumulation
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        delta.set(
          v,
          delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!)
        );
      }
      if (w !== s) {
        cb.set(w, cb.get(w)! + delta.get(w)!);
      }
    }
  }

  // For undirected graphs, each pair is counted twice
  if (!graph.directed) {
    for (const id of ids) {
      cb.set(id, cb.get(id)! / 2);
    }
  }

  return cb;
}

/**
 * Closeness centrality.
 * Defined as r / sum(shortest distances to the r nodes reachable from it),
 * so unreachable nodes are ignored rather than penalised.
 * Returns 0 for nodes that cannot reach any other node.
 *
 * Uses unweighted BFS distances.
 */
export function closenessCentrality<T, E>(
  graph: Graph<T, E>
): Map<NodeId, number> {
  const ids = graph.nodeIds();
  const cc = new Map<NodeId, number>();

  for (const s of ids) {
    const dist = new Map<NodeId, number>();
    dist.set(s, 0);
    const queue: NodeId[] = [s];
    while (queue.length > 0) {
      const v = queue.shift()!;
      for (const w of graph.neighbors(v)) {
        if (!dist.has(w)) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
      }
    }

    let totalDist = 0;
    let reachable = 0;
    for (const [id, d] of dist) {
      if (id !== s) {
        totalDist += d;
        reachable++;
      }
    }

    cc.set(s, reachable > 0 ? reachable / totalDist : 0);
  }

  return cc;
}

/**
 * Degree centrality.
 * Normalized by n-1 (maximum possible connections).
 */
export function degreeCentrality<T, E>(
  graph: Graph<T, E>
): Map<NodeId, number> {
  const ids = graph.nodeIds();
  const n = ids.length;
  const dc = new Map<NodeId, number>();
  const denom = n > 1 ? n - 1 : 1;
  for (const id of ids) {
    dc.set(id, graph.degree(id) / denom);
  }
  return dc;
}
