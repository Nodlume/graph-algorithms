/**
 * Shared result, lookup-table and callback types for the graph algorithms,
 * all keyed by `NodeId` from `@quokkaquery/graph`. Type-only: no runtime code.
 */
import type { NodeId } from "@quokkaquery/graph";

/** Result of a shortest-path algorithm. */
export interface ShortestPathResult {
  distance: number;
  path: NodeId[];
}

/** Distance map from a single source to all reachable nodes. */
export type DistanceMap = Map<NodeId, number>;

/** Predecessor map for reconstructing paths. */
export type PredecessorMap = Map<NodeId, NodeId | null>;

/** All-pairs distance matrix: source → target → distance. */
export type DistanceMatrix = Map<NodeId, Map<NodeId, number>>;

/** All-pairs next-hop matrix for path reconstruction. */
export type NextHopMatrix = Map<NodeId, Map<NodeId, NodeId | null>>;

/** Heuristic function for A*. Estimates cost from a node to the goal. */
export type Heuristic = (node: NodeId, goal: NodeId) => number;

/** Result of a max-flow computation. */
export interface MaxFlowResult {
  maxFlow: number;
  flow: Map<string, number>; // "from->to" → flow value
}

/** A pair of node ids with an associated score. */
export interface NodePairScore {
  a: NodeId;
  b: NodeId;
  score: number;
}
