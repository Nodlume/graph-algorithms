# @quokkaquery/graph-algorithms — API Reference

Advanced graph algorithms built on `@quokkaquery/graph`. All functions are generic over `Graph<T, E>`.

## Types

```ts
import type { NodeId } from "@quokkaquery/graph";

interface ShortestPathResult { distance: number; path: NodeId[] }
type DistanceMap = Map<NodeId, number>
type PredecessorMap = Map<NodeId, NodeId | null>
type DistanceMatrix = Map<NodeId, Map<NodeId, number>>
type NextHopMatrix = Map<NodeId, Map<NodeId, NodeId | null>>
type Heuristic = (node: NodeId, goal: NodeId) => number
interface MaxFlowResult { maxFlow: number; flow: Map<string, number> }
interface NodePairScore { a: NodeId; b: NodeId; score: number }
```

## Shortest Paths

```ts
bellmanFord<T, E>(graph, source): { distances: DistanceMap; predecessors: PredecessorMap }
```
Single-source shortest paths. Supports negative weights. Throws on negative cycles.

```ts
bellmanFordPath<T, E>(graph, source, target): ShortestPathResult | undefined
```
Shortest path between two nodes via Bellman-Ford.

```ts
floydWarshall<T, E>(graph): { distances: DistanceMatrix; nextHop: NextHopMatrix }
```
All-pairs shortest paths. Throws on negative cycles.

```ts
reconstructPath(nextHop: NextHopMatrix, source, target): NodeId[] | undefined
```
Reconstruct path from Floyd-Warshall next-hop matrix.

```ts
astar<T, E>(graph, start, goal, heuristic: Heuristic): ShortestPathResult | undefined
```
A* shortest path. Heuristic must be admissible for optimality.

## Spanning Trees

```ts
kruskal<T, E>(graph): Edge<E>[]
```
Kruskal's MST/forest. Returns edges sorted by weight.

```ts
prim<T, E>(graph, start?: NodeId): Edge<E>[]
```
Prim's MST from a starting node (defaults to first node).

## Connectivity

```ts
stronglyConnectedComponents<T, E>(graph): NodeId[][]
```
Tarjan's SCC algorithm. Directed graphs only. Returns components in reverse topological order.

```ts
condensation<T, E>(graph): { components: NodeId[][]; dag: Graph<NodeId[], void> }
```
Collapse each SCC into a single node, producing a DAG.

```ts
findBridges<T, E>(graph): [NodeId, NodeId][]
```
Find cut edges whose removal disconnects the graph.

```ts
findArticulationPoints<T, E>(graph): NodeId[]
```
Find cut vertices whose removal disconnects the graph.

```ts
bipartiteCheck<T, E>(graph): { partA: NodeId[]; partB: NodeId[] } | null
```
Check if graph is 2-colorable. Returns partitions or null.

## Centrality

```ts
pageRank<T, E>(graph, dampingFactor?: number, iterations?: number, tolerance?: number): Map<NodeId, number>
```
PageRank (default: d=0.85, iter=100, tol=1e-6). Handles dangling nodes. Scores sum to ~1.

```ts
betweennessCentrality<T, E>(graph): Map<NodeId, number>
```
Brandes' algorithm. Measures how often a node lies on shortest paths.

```ts
closenessCentrality<T, E>(graph): Map<NodeId, number>
```
(n-1) / sum(shortest distances). 0 for isolated nodes. Unweighted BFS.

```ts
degreeCentrality<T, E>(graph): Map<NodeId, number>
```
Degree normalized by (n-1).

## Flow

```ts
maxFlow<T, E>(graph, source, sink): MaxFlowResult
```
Edmonds-Karp (BFS Ford-Fulkerson). Edge weights = capacities.

## Co-occurrence

```ts
cooccurrenceMatrix<T, E>(graph): NodePairScore[]
```
Shared neighbor counts for all pairs (score > 0 only).

```ts
pmi<T, E>(graph): NodePairScore[]
```
Pointwise Mutual Information. Returns pairs with positive PMI only.

```ts
ppmi<T, E>(graph): NodePairScore[]
```
Positive PMI (negative values clamped to 0).

## Similarity

```ts
jaccardSimilarity<T, E>(graph, a, b): number | undefined
```
|N(a) ∩ N(b)| / |N(a) ∪ N(b)|. Undefined if both isolated.

```ts
allJaccardSimilarities<T, E>(graph): NodePairScore[]
```
Jaccard for all pairs with score > 0.

```ts
cosineSimilarity<T, E>(graph, a, b): number | undefined
```
Binary adjacency cosine. Undefined if either node is isolated.

```ts
commonNeighbors<T, E>(graph, a, b): NodeId[]
```
List of shared neighbors.

```ts
adamicAdar<T, E>(graph, a, b): number
```
Weighted common neighbors: Σ 1/log(deg(z)) for shared z.

```ts
preferentialAttachment<T, E>(graph, a, b): number
```
|N(a)| * |N(b)|.

```ts
resourceAllocation<T, E>(graph, a, b): number
```
Σ 1/deg(z) for shared neighbors z.

## Clustering

```ts
localClusteringCoefficient<T, E>(graph, node): number
```
How close a node's neighbors are to a clique. 0 for degree < 2.

```ts
clusteringCoefficients<T, E>(graph): Map<NodeId, number>
```
Local clustering coefficient for all nodes.

```ts
globalClusteringCoefficient<T, E>(graph): number
```
Average of local coefficients.

```ts
triangleCount<T, E>(graph): Map<NodeId, number>
```
Number of triangles each node participates in.

```ts
labelPropagation<T, E>(graph, maxIterations?: number): Map<NodeId, NodeId>
```
Community detection via label propagation (default max 100 iterations).

```ts
extractCommunities(labels: Map<NodeId, NodeId>): NodeId[][]
```
Group label propagation results into community arrays.

```ts
louvain<T, E>(graph): Map<NodeId, number>
```
Louvain modularity optimization. Returns node → community id.

```ts
modularity<T, E>(graph, communities: Map<NodeId, number>): number
```
Modularity score Q ∈ [-0.5, 1] for a community assignment.
