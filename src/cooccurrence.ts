import type { Graph, NodeId } from "@quokkaquery/graph";
import type { NodePairScore } from "./types.js";

/**
 * Co-occurrence matrix from shared neighbors.
 * For each pair (a, b), counts how many neighbors they share.
 * Only returns pairs with count > 0.
 *
 * For directed graphs, uses outgoing neighbors.
 */
export function cooccurrenceMatrix<T, E>(
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
      let count = 0;
      for (const n of setA) {
        if (setB.has(n)) count++;
      }
      if (count > 0) {
        pairs.push({ a, b, score: count });
      }
    }
  }

  return pairs;
}

/**
 * Pointwise Mutual Information (PMI) for node co-occurrence.
 * Measures how much more often two nodes share neighbors than expected by chance.
 *
 * PMI(a, b) = log2(P(a,b) / (P(a) * P(b)))
 * where P(a,b) = shared neighbors / total nodes,
 *       P(a) = degree(a) / total nodes.
 *
 * Only returns pairs with positive PMI (co-occur more than expected).
 */
export function pmi<T, E>(graph: Graph<T, E>): NodePairScore[] {
  const ids = graph.nodeIds();
  const n = ids.length;
  if (n === 0) return [];

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

      let shared = 0;
      for (const x of setA) {
        if (setB.has(x)) shared++;
      }
      if (shared === 0) continue;

      const pAB = shared / n;
      const pA = setA.size / n;
      const pB = setB.size / n;
      if (pA === 0 || pB === 0) continue;

      const score = Math.log2(pAB / (pA * pB));
      if (score > 0) {
        pairs.push({ a, b, score });
      }
    }
  }

  return pairs;
}

/**
 * Positive PMI (PPMI) — same as PMI but clamps negative values to 0.
 * Returns all pairs with PMI >= 0.
 */
export function ppmi<T, E>(graph: Graph<T, E>): NodePairScore[] {
  const ids = graph.nodeIds();
  const n = ids.length;
  if (n === 0) return [];

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

      let shared = 0;
      for (const x of setA) {
        if (setB.has(x)) shared++;
      }
      if (shared === 0) continue;

      const pAB = shared / n;
      const pA = setA.size / n;
      const pB = setB.size / n;
      if (pA === 0 || pB === 0) continue;

      const score = Math.max(0, Math.log2(pAB / (pA * pB)));
      if (score > 0) {
        pairs.push({ a, b, score });
      }
    }
  }

  return pairs;
}
