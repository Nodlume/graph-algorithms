import type { Graph, NodeId } from "@quokkaquery/graph";
import type { NodePairScore } from "./types.js";

/**
 * Jaccard similarity between two nodes based on shared neighbors.
 * J(a,b) = |N(a) ∩ N(b)| / |N(a) ∪ N(b)|
 *
 * @returns Score between 0 and 1, or undefined if both nodes have no neighbors.
 */
export function jaccardSimilarity<T, E>(
  graph: Graph<T, E>,
  a: NodeId,
  b: NodeId
): number | undefined {
  const setA = new Set(graph.neighbors(a));
  const setB = new Set(graph.neighbors(b));
  if (setA.size === 0 && setB.size === 0) return undefined;

  let intersection = 0;
  for (const n of setA) {
    if (setB.has(n)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Jaccard similarity for all pairs with score > 0.
 */
export function allJaccardSimilarities<T, E>(
  graph: Graph<T, E>
): NodePairScore[] {
  const ids = graph.nodeIds();
  const neighborSets = new Map<NodeId, Set<NodeId>>();
  for (const id of ids) {
    neighborSets.set(id, new Set(graph.neighbors(id)));
  }

  const pairs: NodePairScore[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const setA = neighborSets.get(a)!;
      const setB = neighborSets.get(b)!;
      if (setA.size === 0 && setB.size === 0) continue;

      let intersection = 0;
      for (const n of setA) {
        if (setB.has(n)) intersection++;
      }
      if (intersection === 0) continue;

      const union = setA.size + setB.size - intersection;
      pairs.push({ a, b, score: intersection / union });
    }
  }

  return pairs;
}

/**
 * Cosine similarity between two nodes' neighbor vectors.
 * Treats the adjacency row as a binary vector.
 *
 * cos(a,b) = |N(a) ∩ N(b)| / (√|N(a)| * √|N(b)|)
 */
export function cosineSimilarity<T, E>(
  graph: Graph<T, E>,
  a: NodeId,
  b: NodeId
): number | undefined {
  const setA = new Set(graph.neighbors(a));
  const setB = new Set(graph.neighbors(b));
  if (setA.size === 0 || setB.size === 0) return undefined;

  let intersection = 0;
  for (const n of setA) {
    if (setB.has(n)) intersection++;
  }
  return intersection / (Math.sqrt(setA.size) * Math.sqrt(setB.size));
}

/**
 * Common neighbors count between two nodes.
 */
export function commonNeighbors<T, E>(
  graph: Graph<T, E>,
  a: NodeId,
  b: NodeId
): NodeId[] {
  const setB = new Set(graph.neighbors(b));
  return graph.neighbors(a).filter((n) => setB.has(n));
}

/**
 * Adamic-Adar index: weighted common neighbors.
 * Weights each shared neighbor by 1/log(degree), giving more weight
 * to neighbors that are themselves less connected (more "specific").
 *
 * AA(a,b) = Σ_{z ∈ N(a) ∩ N(b)} 1 / log(|N(z)|)
 */
export function adamicAdar<T, E>(
  graph: Graph<T, E>,
  a: NodeId,
  b: NodeId
): number {
  const setB = new Set(graph.neighbors(b));
  let score = 0;
  for (const z of graph.neighbors(a)) {
    if (setB.has(z)) {
      const deg = graph.neighbors(z).length;
      if (deg > 1) {
        score += 1 / Math.log(deg);
      }
    }
  }
  return score;
}

/**
 * Preferential attachment score: product of degrees.
 * PA(a,b) = |N(a)| * |N(b)|
 *
 * Higher for nodes that are both well-connected.
 */
export function preferentialAttachment<T, E>(
  graph: Graph<T, E>,
  a: NodeId,
  b: NodeId
): number {
  return graph.neighbors(a).length * graph.neighbors(b).length;
}

/**
 * Resource Allocation index.
 * RA(a,b) = Σ_{z ∈ N(a) ∩ N(b)} 1 / |N(z)|
 *
 * Similar to Adamic-Adar but without the log.
 */
export function resourceAllocation<T, E>(
  graph: Graph<T, E>,
  a: NodeId,
  b: NodeId
): number {
  const setB = new Set(graph.neighbors(b));
  let score = 0;
  for (const z of graph.neighbors(a)) {
    if (setB.has(z)) {
      const deg = graph.neighbors(z).length;
      if (deg > 0) {
        score += 1 / deg;
      }
    }
  }
  return score;
}
