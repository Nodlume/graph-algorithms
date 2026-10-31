/**
 * Public entry point for the graph-algorithms package. Re-exports the shared
 * result types and every algorithm family (shortest paths, spanning trees,
 * connectivity, centrality, max flow, co-occurrence, similarity, clustering)
 * from one place. Documentation for each symbol lives in its source module;
 * anything not listed here is internal to the package.
 */
export type {
  ShortestPathResult,
  DistanceMap,
  PredecessorMap,
  DistanceMatrix,
  NextHopMatrix,
  Heuristic,
  MaxFlowResult,
  NodePairScore,
} from "./types.js";

// Shortest paths
export { bellmanFord, bellmanFordPath, floydWarshall, reconstructPath, astar } from "./shortest-path.js";

// Spanning trees
export { kruskal, prim } from "./spanning-tree.js";

// Connectivity
export { stronglyConnectedComponents, condensation, findBridges, findArticulationPoints, bipartiteCheck } from "./connectivity.js";

// Centrality
export { pageRank, betweennessCentrality, closenessCentrality, degreeCentrality } from "./centrality.js";

// Flow
export { maxFlow } from "./flow.js";

// Co-occurrence
export { cooccurrenceMatrix, pmi, ppmi } from "./cooccurrence.js";

// Similarity
export { jaccardSimilarity, allJaccardSimilarities, cosineSimilarity, commonNeighbors, adamicAdar, preferentialAttachment, resourceAllocation } from "./similarity.js";

// Clustering
export { localClusteringCoefficient, clusteringCoefficients, globalClusteringCoefficient, triangleCount, labelPropagation, extractCommunities, louvain, modularity } from "./clustering.js";
