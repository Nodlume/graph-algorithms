# @quokkaquery/graph-algorithms

> Built and maintained by [QuokkaQuery](https://quokkaquery.com). Source on [GitHub](https://github.com/Nodlume/graph-algorithms).

Advanced graph algorithms built on [`@quokkaquery/graph`](../graph). Covers shortest paths, spanning trees, connectivity, centrality, network flow, similarity, co-occurrence, and community detection.

## Install

```bash
npm install @quokkaquery/graph-algorithms
```

Depends on `@quokkaquery/graph` via `file:../graph`. Rebuild `graph` first if you've modified it.

## Usage

```ts
import { Graph } from "@quokkaquery/graph";
import { pageRank, louvain, bellmanFord, kruskal } from "@quokkaquery/graph-algorithms";

const g = new Graph<string, void>();
g.addNode("a", "A");
g.addNode("b", "B");
g.addNode("c", "C");
g.addEdge("a", "b", undefined, 1);
g.addEdge("b", "c", undefined, 2);
g.addEdge("a", "c", undefined, 5);

// Shortest paths
const { distances } = bellmanFord(g, "a");

// Centrality
const ranks = pageRank(g);

// Community detection
const communities = louvain(g);

// Minimum spanning tree
const mstEdges = kruskal(g);
```

## Algorithms

| Category | Functions |
|---|---|
| **Shortest Paths** | `bellmanFord`, `bellmanFordPath`, `floydWarshall`, `reconstructPath`, `astar` |
| **Spanning Trees** | `kruskal`, `prim` |
| **Connectivity** | `stronglyConnectedComponents`, `condensation`, `findBridges`, `findArticulationPoints`, `bipartiteCheck` |
| **Centrality** | `pageRank`, `betweennessCentrality`, `closenessCentrality`, `degreeCentrality` |
| **Flow** | `maxFlow` (Edmonds-Karp) |
| **Co-occurrence** | `cooccurrenceMatrix`, `pmi`, `ppmi` |
| **Similarity** | `jaccardSimilarity`, `allJaccardSimilarities`, `cosineSimilarity`, `commonNeighbors`, `adamicAdar`, `preferentialAttachment`, `resourceAllocation` |
| **Clustering** | `localClusteringCoefficient`, `clusteringCoefficients`, `globalClusteringCoefficient`, `triangleCount`, `labelPropagation`, `extractCommunities`, `louvain`, `modularity` |

See [API.md](./API.md) for full type signatures and parameter details.

## Build & Test

```bash
npm run build       # tsc → dist/
npm test            # vitest run
npm run test:watch  # vitest watch mode
```

## Gotchas

- **Requires `@quokkaquery/graph` as peer**: must be built first (`cd graph && npm run build`).
- **Edge weights**: algorithms read `weight` from edge data. If edges have no `weight` property, behavior depends on the algorithm (some default to 1, some to 0).
- **Negative cycles**: `bellmanFord` and `floydWarshall` throw on negative cycles rather than returning partial results.
- **Directed vs undirected**: `stronglyConnectedComponents` and `condensation` are for directed graphs. Similarity/clustering functions treat edges as undirected neighbors.
- **`closenessCentrality` is unweighted**: uses BFS hop count, not edge weights.
- **`pageRank` scores sum to ~1**, not to the node count.
- **Pairwise functions** (`jaccardSimilarity`, `cosineSimilarity`) return `undefined` for degenerate inputs (isolated nodes), not 0.

## Common Patterns

### Find shortest path with A*

```ts
import { astar } from "@quokkaquery/graph-algorithms";

// Use a zero heuristic for Dijkstra-like behavior on non-negative graphs
const result = astar(graph, "start", "end", () => 0);
if (result) console.log(result.distance, result.path);
```

### Detect communities and measure quality

```ts
import { louvain, modularity } from "@quokkaquery/graph-algorithms";

const communities = louvain(graph);
const q = modularity(graph, communities);
console.log(`Found communities with modularity Q=${q.toFixed(3)}`);
```

### Rank nodes by importance

```ts
import { pageRank, betweennessCentrality } from "@quokkaquery/graph-algorithms";

const pr = pageRank(graph);
const bc = betweennessCentrality(graph);
// Sort by PageRank descending
const ranked = [...pr.entries()].sort((a, b) => b[1] - a[1]);
```

## License

MIT © [QuokkaQuery](https://quokkaquery.com)

---

Part of the open-source tooling behind [QuokkaQuery](https://quokkaquery.com).
