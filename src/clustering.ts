import type { Graph, NodeId } from "@quokkaquery/graph";

/**
 * Local clustering coefficient for a single node.
 * Measures how close a node's neighbors are to forming a clique.
 *
 * C(v) = 2 * triangles(v) / (degree(v) * (degree(v) - 1))
 *
 * Returns 0 for nodes with degree < 2.
 */
export function localClusteringCoefficient<T, E>(
  graph: Graph<T, E>,
  node: NodeId
): number {
  const neighbors = graph.neighbors(node);
  const k = neighbors.length;
  if (k < 2) return 0;

  const neighborSet = new Set(neighbors);
  let triangles = 0;
  for (let i = 0; i < neighbors.length; i++) {
    for (let j = i + 1; j < neighbors.length; j++) {
      if (graph.hasEdge(neighbors[i], neighbors[j]) || graph.hasEdge(neighbors[j], neighbors[i])) {
        triangles++;
      }
    }
  }

  return (2 * triangles) / (k * (k - 1));
}

/**
 * Clustering coefficient for all nodes.
 */
export function clusteringCoefficients<T, E>(
  graph: Graph<T, E>
): Map<NodeId, number> {
  const result = new Map<NodeId, number>();
  for (const id of graph.nodeIds()) {
    result.set(id, localClusteringCoefficient(graph, id));
  }
  return result;
}

/**
 * Global clustering coefficient (average of local coefficients).
 */
export function globalClusteringCoefficient<T, E>(
  graph: Graph<T, E>
): number {
  const coeffs = clusteringCoefficients(graph);
  if (coeffs.size === 0) return 0;
  let sum = 0;
  for (const c of coeffs.values()) sum += c;
  return sum / coeffs.size;
}

/**
 * Count the number of triangles each node participates in.
 */
export function triangleCount<T, E>(
  graph: Graph<T, E>
): Map<NodeId, number> {
  const ids = graph.nodeIds();
  const counts = new Map<NodeId, number>();
  for (const id of ids) counts.set(id, 0);

  const neighborSets = new Map<NodeId, Set<NodeId>>();
  for (const id of ids) {
    neighborSets.set(id, new Set(graph.neighbors(id)));
  }

  for (const u of ids) {
    const neighborsU = graph.neighbors(u);
    for (let i = 0; i < neighborsU.length; i++) {
      const v = neighborsU[i];
      // Only count where u < v to avoid duplicates at this level
      if (String(v) <= String(u)) continue;
      const setV = neighborSets.get(v)!;
      for (let j = i + 1; j < neighborsU.length; j++) {
        const w = neighborsU[j];
        if (String(w) <= String(u)) continue;
        if (setV.has(w)) {
          counts.set(u, counts.get(u)! + 1);
          counts.set(v, counts.get(v)! + 1);
          counts.set(w, counts.get(w)! + 1);
        }
      }
    }
  }

  return counts;
}

/**
 * Label Propagation community detection.
 * Each node starts with its own label, then iteratively adopts
 * the most frequent label among its neighbors.
 *
 * @param maxIterations - Maximum iterations before stopping (default 100).
 * @returns Map of node id → community label (a node id).
 */
export function labelPropagation<T, E>(
  graph: Graph<T, E>,
  maxIterations = 100
): Map<NodeId, NodeId> {
  const ids = graph.nodeIds();
  const labels = new Map<NodeId, NodeId>();

  // Initialize: each node is its own community
  for (const id of ids) labels.set(id, id);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Process nodes in random order
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const node of shuffled) {
      const neighbors = graph.neighbors(node);
      if (neighbors.length === 0) continue;

      // Count neighbor labels
      const labelCounts = new Map<NodeId, number>();
      for (const n of neighbors) {
        const lbl = labels.get(n)!;
        labelCounts.set(lbl, (labelCounts.get(lbl) ?? 0) + 1);
      }

      // Find max label (break ties by smallest label)
      let maxCount = 0;
      let maxLabel = labels.get(node)!;
      for (const [lbl, count] of labelCounts) {
        if (count > maxCount || (count === maxCount && String(lbl) < String(maxLabel))) {
          maxCount = count;
          maxLabel = lbl;
        }
      }

      if (maxLabel !== labels.get(node)) {
        labels.set(node, maxLabel);
        changed = true;
      }
    }

    if (!changed) break;
  }

  return labels;
}

/**
 * Extract communities from label propagation results.
 * @returns Array of communities, each being an array of node ids.
 */
export function extractCommunities(labels: Map<NodeId, NodeId>): NodeId[][] {
  const communities = new Map<NodeId, NodeId[]>();
  for (const [node, label] of labels) {
    if (!communities.has(label)) communities.set(label, []);
    communities.get(label)!.push(node);
  }
  return [...communities.values()];
}

/**
 * Louvain community detection (modularity optimization).
 * Greedy agglomerative method that maximizes modularity.
 *
 * @returns Map of node id → community id (number).
 */
export function louvain<T, E>(graph: Graph<T, E>): Map<NodeId, number> {
  const ids = graph.nodeIds();
  const community = new Map<NodeId, number>();
  let communityId = 0;
  for (const id of ids) {
    community.set(id, communityId++);
  }

  // Precompute total edge weight (2m for undirected)
  let totalWeight = 0;
  for (const e of graph.edges()) {
    totalWeight += e.weight;
  }
  if (!graph.directed) totalWeight *= 2;
  if (totalWeight === 0) return community;

  // Weighted degree (sum of edge weights)
  const weightedDeg = new Map<NodeId, number>();
  for (const id of ids) {
    let deg = 0;
    for (const e of graph.outEdges(id)) deg += e.weight;
    if (!graph.directed) {
      // outEdges already includes both directions for undirected
      weightedDeg.set(id, deg);
    } else {
      for (const e of graph.inEdges(id)) deg += e.weight;
      weightedDeg.set(id, deg);
    }
  }

  // Compute sum of weights within each community (Σ_in) and
  // sum of weights incident to each community (Σ_tot)
  const sigmaIn = new Map<number, number>();
  const sigmaTot = new Map<number, number>();
  for (const id of ids) {
    const c = community.get(id)!;
    sigmaIn.set(c, 0);
    sigmaTot.set(c, weightedDeg.get(id)!);
  }

  // Weight between node and neighbors in a given community
  function weightToComm(node: NodeId, comm: number): number {
    let w = 0;
    for (const e of graph.outEdges(node)) {
      if (community.get(e.to) === comm) w += e.weight;
    }
    return w;
  }

  // Phase 1: Local moves
  let improved = true;
  let maxPasses = 20;
  while (improved && maxPasses-- > 0) {
    improved = false;
    for (const node of ids) {
      const nodeCom = community.get(node)!;
      const ki = weightedDeg.get(node)!;

      // Remove node from its community
      const kiIn = weightToComm(node, nodeCom);
      sigmaIn.set(nodeCom, (sigmaIn.get(nodeCom) ?? 0) - kiIn);
      sigmaTot.set(nodeCom, (sigmaTot.get(nodeCom) ?? 0) - ki);

      // Find best community among neighbors
      let bestCom = nodeCom;
      let bestDelta = 0;

      const neighborComms = new Set<number>();
      for (const n of graph.neighbors(node)) {
        neighborComms.add(community.get(n)!);
      }

      for (const c of neighborComms) {
        const kiC = weightToComm(node, c);
        const stot = sigmaTot.get(c) ?? 0;
        const delta = kiC - (stot * ki) / totalWeight;
        if (delta > bestDelta) {
          bestDelta = delta;
          bestCom = c;
        }
      }

      // Move to best community
      community.set(node, bestCom);
      const kiNew = weightToComm(node, bestCom);
      sigmaIn.set(bestCom, (sigmaIn.get(bestCom) ?? 0) + kiNew);
      sigmaTot.set(bestCom, (sigmaTot.get(bestCom) ?? 0) + ki);

      if (bestCom !== nodeCom) improved = true;
    }
  }

  // Normalize community ids to 0..n
  const uniqueComms = [...new Set(community.values())];
  const remap = new Map<number, number>();
  uniqueComms.forEach((c, i) => remap.set(c, i));
  for (const [node, c] of community) {
    community.set(node, remap.get(c)!);
  }

  return community;
}

/**
 * Modularity score for a given community assignment.
 * Q = (1/2m) Σ [A_ij - (k_i * k_j)/(2m)] * δ(c_i, c_j)
 *
 * @returns Modularity value between -0.5 and 1.
 */
export function modularity<T, E>(
  graph: Graph<T, E>,
  communities: Map<NodeId, number>
): number {
  let totalWeight = 0;
  for (const e of graph.edges()) totalWeight += e.weight;
  if (totalWeight === 0) return 0;

  const m2 = graph.directed ? totalWeight : totalWeight * 2;

  let q = 0;
  const ids = graph.nodeIds();
  for (const i of ids) {
    for (const j of ids) {
      if (communities.get(i) !== communities.get(j)) continue;
      const edge = graph.getEdge(i, j);
      const aij = edge ? edge.weight : 0;
      const ki = weightedDegree(graph, i);
      const kj = weightedDegree(graph, j);
      q += aij - (ki * kj) / m2;
    }
  }

  return q / m2;
}

function weightedDegree<T, E>(graph: Graph<T, E>, node: NodeId): number {
  let deg = 0;
  for (const e of graph.outEdges(node)) deg += e.weight;
  if (graph.directed) {
    for (const e of graph.inEdges(node)) deg += e.weight;
  }
  return deg;
}
