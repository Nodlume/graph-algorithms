import { describe, it, expect } from "vitest";
import { Graph } from "@quokkaquery/graph";
import {
  bellmanFord,
  bellmanFordPath,
  floydWarshall,
  reconstructPath,
  kruskal,
  prim,
  stronglyConnectedComponents,
  condensation,
  findBridges,
  findArticulationPoints,
  pageRank,
  betweennessCentrality,
  closenessCentrality,
  degreeCentrality,
  astar,
  maxFlow,
  bipartiteCheck,
  cooccurrenceMatrix,
  pmi,
  ppmi,
  jaccardSimilarity,
  allJaccardSimilarities,
  cosineSimilarity,
  commonNeighbors,
  adamicAdar,
  preferentialAttachment,
  resourceAllocation,
  localClusteringCoefficient,
  clusteringCoefficients,
  globalClusteringCoefficient,
  triangleCount,
  labelPropagation,
  extractCommunities,
  louvain,
  modularity,
} from "./index.js";

// ── Bellman-Ford ─────────────────────────────────────────────────

describe("bellmanFord", () => {
  it("finds shortest paths from source", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b", 1).addEdge("b", "c", 2).addEdge("a", "c", 5).addEdge("c", "d", 1);
    const { distances } = bellmanFord(g, "a");
    expect(distances.get("a")).toBe(0);
    expect(distances.get("b")).toBe(1);
    expect(distances.get("c")).toBe(3); // a→b→c
    expect(distances.get("d")).toBe(4); // a→b→c→d
  });

  it("handles negative weights", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b", 4).addEdge("a", "c", 2).addEdge("c", "b", -3);
    const { distances } = bellmanFord(g, "a");
    expect(distances.get("b")).toBe(-1); // a→c→b
  });

  it("throws on negative cycle", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b", 1).addEdge("b", "c", -3).addEdge("c", "a", 1);
    expect(() => bellmanFord(g, "a")).toThrow("negative-weight cycle");
  });
});

describe("bellmanFordPath", () => {
  it("returns path and distance", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b", 2).addEdge("b", "c", 3);
    const result = bellmanFordPath(g, "a", "c");
    expect(result).toEqual({ distance: 5, path: ["a", "b", "c"] });
  });

  it("returns undefined for unreachable", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "");
    expect(bellmanFordPath(g, "a", "b")).toBeUndefined();
  });
});

// ── Floyd-Warshall ───────────────────────────────────────────────

describe("floydWarshall", () => {
  it("computes all-pairs shortest paths", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b", 1).addEdge("b", "c", 2).addEdge("a", "c", 5);
    const { distances, nextHop } = floydWarshall(g);
    expect(distances.get("a")!.get("c")).toBe(3); // a→b→c
    expect(distances.get("a")!.get("b")).toBe(1);

    const path = reconstructPath(nextHop, "a", "c");
    expect(path).toEqual(["a", "b", "c"]);
  });

  it("returns undefined path for unreachable", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "");
    const { nextHop } = floydWarshall(g);
    expect(reconstructPath(nextHop, "a", "b")).toBeUndefined();
  });

  it("throws on negative cycle", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "");
    g.addEdge("a", "b", -1).addEdge("b", "a", -1);
    expect(() => floydWarshall(g)).toThrow("negative-weight cycle");
  });
});

// ── MST ──────────────────────────────────────────────────────────

describe("kruskal", () => {
  it("finds minimum spanning tree", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b", 1).addEdge("b", "c", 2).addEdge("c", "d", 3).addEdge("a", "d", 10).addEdge("a", "c", 4);
    const mst = kruskal(g);
    const totalWeight = mst.reduce((sum, e) => sum + e.weight, 0);
    expect(totalWeight).toBe(6); // a-b(1) + b-c(2) + c-d(3)
    expect(mst).toHaveLength(3);
  });

  it("returns forest for disconnected graph", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b", 1).addEdge("c", "d", 2);
    const mst = kruskal(g);
    expect(mst).toHaveLength(2);
  });
});

describe("prim", () => {
  it("finds minimum spanning tree", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b", 1).addEdge("b", "c", 2).addEdge("c", "d", 3).addEdge("a", "d", 10);
    const mst = prim(g, "a");
    const totalWeight = mst.reduce((sum, e) => sum + e.weight, 0);
    expect(totalWeight).toBe(6);
    expect(mst).toHaveLength(3);
  });

  it("returns empty for empty graph", () => {
    const g = new Graph<string>({ directed: false });
    expect(prim(g)).toEqual([]);
  });
});

// ── SCC ──────────────────────────────────────────────────────────

describe("stronglyConnectedComponents", () => {
  it("finds SCCs in a directed graph", () => {
    // Classic example: a→b→c→a (one SCC), d is separate
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a").addEdge("c", "d");
    const sccs = stronglyConnectedComponents(g);
    // Should have 2 SCCs: {a,b,c} and {d}
    expect(sccs).toHaveLength(2);
    const sizes = sccs.map((c) => c.length).sort();
    expect(sizes).toEqual([1, 3]);
  });

  it("each node is its own SCC in a DAG", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c");
    const sccs = stronglyConnectedComponents(g);
    expect(sccs).toHaveLength(3);
  });

  it("throws for undirected graph", () => {
    const g = new Graph<string>({ directed: false });
    expect(() => stronglyConnectedComponents(g)).toThrow("directed");
  });
});

describe("condensation", () => {
  it("produces a DAG from SCC collapse", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a").addEdge("c", "d");
    const { components, dag } = condensation(g);
    expect(components).toHaveLength(2);
    expect(dag.hasCycle()).toBe(false);
    expect(dag.edgeCount).toBe(1);
  });
});

// ── Bridges & Articulation Points ────────────────────────────────

describe("findBridges", () => {
  it("finds bridges in an undirected graph", () => {
    // a - b - c - d, with b-c being a bridge if a-b and c-d have no alternatives
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "d");
    const bridges = findBridges(g);
    // All edges are bridges in a path graph
    expect(bridges).toHaveLength(3);
  });

  it("finds no bridges in a cycle", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    expect(findBridges(g)).toHaveLength(0);
  });
});

describe("findArticulationPoints", () => {
  it("finds articulation points", () => {
    // Star graph: center is an articulation point
    const g = new Graph<string>({ directed: false });
    g.addNode("center", "").addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("center", "a").addEdge("center", "b").addEdge("center", "c");
    const aps = findArticulationPoints(g);
    expect(aps).toEqual(["center"]);
  });

  it("finds no articulation points in a complete graph", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("a", "c");
    expect(findArticulationPoints(g)).toHaveLength(0);
  });
});

// ── Centrality ───────────────────────────────────────────────────

describe("pageRank", () => {
  it("ranks sum to approximately 1", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    const ranks = pageRank(g);
    const sum = [...ranks.values()].reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("highly linked node gets higher rank", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("hub", "");
    g.addEdge("a", "hub").addEdge("b", "hub").addEdge("c", "hub");
    g.addEdge("hub", "a"); // hub links back to one
    const ranks = pageRank(g);
    expect(ranks.get("hub")!).toBeGreaterThan(ranks.get("a")!);
    expect(ranks.get("hub")!).toBeGreaterThan(ranks.get("b")!);
  });
});

describe("betweennessCentrality", () => {
  it("center of a star has highest betweenness", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("center", "").addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("center", "a").addEdge("center", "b").addEdge("center", "c");
    const bc = betweennessCentrality(g);
    expect(bc.get("center")!).toBeGreaterThan(0);
    expect(bc.get("a")!).toBe(0);
  });
});

describe("closenessCentrality", () => {
  it("center of a star has highest closeness", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("center", "").addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("center", "a").addEdge("center", "b").addEdge("center", "c");
    const cc = closenessCentrality(g);
    expect(cc.get("center")!).toBeGreaterThan(cc.get("a")!);
  });
});

describe("degreeCentrality", () => {
  it("normalizes by n-1", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("a", "c");
    const dc = degreeCentrality(g);
    expect(dc.get("a")).toBe(1); // connected to both others = 2/(3-1) = 1
    expect(dc.get("b")).toBe(0.5);
  });
});

// ── A* ───────────────────────────────────────────────────────────

describe("astar", () => {
  it("finds shortest path with heuristic", () => {
    // Grid-like: coordinates as node data
    const g = new Graph<{ x: number; y: number }>({ directed: false });
    g.addNode("0,0", { x: 0, y: 0 });
    g.addNode("1,0", { x: 1, y: 0 });
    g.addNode("1,1", { x: 1, y: 1 });
    g.addNode("0,1", { x: 0, y: 1 });
    g.addEdge("0,0", "1,0", 1).addEdge("1,0", "1,1", 1);
    g.addEdge("0,0", "0,1", 1).addEdge("0,1", "1,1", 1);

    // Manhattan distance heuristic
    const h = (a: string | number, b: string | number) => {
      const na = g.getNode(a)!.data;
      const nb = g.getNode(b)!.data;
      return Math.abs(na.x - nb.x) + Math.abs(na.y - nb.y);
    };

    const result = astar(g, "0,0", "1,1", h);
    expect(result).toBeDefined();
    expect(result!.distance).toBe(2);
    expect(result!.path).toHaveLength(3);
  });

  it("returns undefined for unreachable", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "");
    expect(astar(g, "a", "b", () => 0)).toBeUndefined();
  });
});

// ── Max Flow ─────────────────────────────────────────────────────

describe("maxFlow", () => {
  it("computes maximum flow", () => {
    // Classic: s → a(10), s → b(10), a → b(2), a → t(8), b → t(10)
    const g = new Graph<string>({ directed: true });
    g.addNode("s", "").addNode("a", "").addNode("b", "").addNode("t", "");
    g.addEdge("s", "a", 10).addEdge("s", "b", 10);
    g.addEdge("a", "b", 2).addEdge("a", "t", 8).addEdge("b", "t", 10);
    const result = maxFlow(g, "s", "t");
    expect(result.maxFlow).toBe(18); // 8 through a→t, 10 through b→t (2 from a→b)
  });

  it("returns 0 when no path exists", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("s", "").addNode("t", "");
    const result = maxFlow(g, "s", "t");
    expect(result.maxFlow).toBe(0);
  });
});

// ── Bipartite ────────────────────────────────────────────────────

describe("bipartiteCheck", () => {
  it("detects bipartite graph", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b").addEdge("c", "d").addEdge("a", "d");
    const result = bipartiteCheck(g);
    expect(result).not.toBeNull();
    expect(result!.partA.length + result!.partB.length).toBe(4);
  });

  it("detects non-bipartite (odd cycle)", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    expect(bipartiteCheck(g)).toBeNull();
  });

  it("handles empty graph", () => {
    const g = new Graph<string>({ directed: false });
    const result = bipartiteCheck(g);
    expect(result).toEqual({ partA: [], partB: [] });
  });
});

// ── Co-occurrence ────────────────────────────────────────────────

describe("cooccurrenceMatrix", () => {
  it("counts shared neighbors", () => {
    // a→c, b→c  ⇒  a and b share neighbor c
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "c").addEdge("b", "c");
    const pairs = cooccurrenceMatrix(g);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].score).toBe(1);
  });

  it("returns empty when no shared neighbors", () => {
    const g = new Graph<string>({ directed: true });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "c").addEdge("b", "d");
    expect(cooccurrenceMatrix(g)).toHaveLength(0);
  });

  it("counts multiple shared neighbors", () => {
    // a and b both connect to c and d
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "c").addEdge("a", "d").addEdge("b", "c").addEdge("b", "d");
    const pairs = cooccurrenceMatrix(g);
    const abPair = pairs.find(
      (p) => (p.a === "a" && p.b === "b") || (p.a === "b" && p.b === "a")
    );
    expect(abPair).toBeDefined();
    expect(abPair!.score).toBe(2);
  });
});

describe("pmi", () => {
  it("returns positive PMI for nodes that co-occur more than expected", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "").addNode("e", "");
    // a and b share neighbors c and d, but e is isolated
    g.addEdge("a", "c").addEdge("a", "d").addEdge("b", "c").addEdge("b", "d");
    const pairs = pmi(g);
    const abPair = pairs.find(
      (p) => (p.a === "a" && p.b === "b") || (p.a === "b" && p.b === "a")
    );
    expect(abPair).toBeDefined();
    expect(abPair!.score).toBeGreaterThan(0);
  });
});

describe("ppmi", () => {
  it("never returns negative scores", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "c").addEdge("b", "c");
    const pairs = ppmi(g);
    for (const p of pairs) {
      expect(p.score).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── Similarity ───────────────────────────────────────────────────

describe("jaccardSimilarity", () => {
  it("returns 1 for identical neighbor sets", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "c").addEdge("a", "d").addEdge("b", "c").addEdge("b", "d");
    expect(jaccardSimilarity(g, "a", "b")).toBe(1);
  });

  it("returns 0 for disjoint neighbor sets", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "c").addEdge("b", "d");
    expect(jaccardSimilarity(g, "a", "b")).toBe(0);
  });

  it("returns undefined for two isolated nodes", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "");
    expect(jaccardSimilarity(g, "a", "b")).toBeUndefined();
  });
});

describe("allJaccardSimilarities", () => {
  it("returns all pairs with positive similarity", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "c").addEdge("b", "c");
    const pairs = allJaccardSimilarities(g);
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.every((p) => p.score > 0)).toBe(true);
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical neighbor sets", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "c").addEdge("a", "d").addEdge("b", "c").addEdge("b", "d");
    expect(cosineSimilarity(g, "a", "b")).toBeCloseTo(1);
  });

  it("returns undefined for isolated node", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("b", "c");
    expect(cosineSimilarity(g, "a", "b")).toBeUndefined();
  });
});

describe("commonNeighbors", () => {
  it("returns shared neighbors", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "c").addEdge("a", "d").addEdge("b", "c");
    const cn = commonNeighbors(g, "a", "b");
    expect(cn).toEqual(["c"]);
  });
});

describe("adamicAdar", () => {
  it("weights common neighbors by inverse log degree", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "").addNode("e", "");
    // c connects to a, b, and also d and e (degree 4)
    g.addEdge("a", "c").addEdge("b", "c").addEdge("c", "d").addEdge("c", "e");
    const score = adamicAdar(g, "a", "b");
    // c has degree 4 → 1/log(4)
    expect(score).toBeCloseTo(1 / Math.log(4));
  });
});

describe("preferentialAttachment", () => {
  it("returns product of degrees", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "c").addEdge("a", "d").addEdge("b", "c");
    // a has degree 2, b has degree 1
    expect(preferentialAttachment(g, "a", "b")).toBe(2);
  });
});

describe("resourceAllocation", () => {
  it("sums 1/degree of common neighbors", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    // c connects to a, b, d (degree 3)
    g.addEdge("a", "c").addEdge("b", "c").addEdge("c", "d");
    const score = resourceAllocation(g, "a", "b");
    expect(score).toBeCloseTo(1 / 3);
  });
});

// ── Clustering ───────────────────────────────────────────────────

describe("localClusteringCoefficient", () => {
  it("returns 1 for a triangle", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    expect(localClusteringCoefficient(g, "a")).toBe(1);
  });

  it("returns 0 for a star center", () => {
    // center connects to a, b, c but they don't connect to each other
    const g = new Graph<string>({ directed: false });
    g.addNode("center", "").addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("center", "a").addEdge("center", "b").addEdge("center", "c");
    expect(localClusteringCoefficient(g, "center")).toBe(0);
  });

  it("returns 0 for degree < 2", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "");
    g.addEdge("a", "b");
    expect(localClusteringCoefficient(g, "a")).toBe(0);
  });
});

describe("clusteringCoefficients", () => {
  it("computes for all nodes", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    const coeffs = clusteringCoefficients(g);
    expect(coeffs.size).toBe(3);
    for (const c of coeffs.values()) expect(c).toBe(1);
  });
});

describe("globalClusteringCoefficient", () => {
  it("averages local coefficients", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    expect(globalClusteringCoefficient(g)).toBe(1);
  });
});

describe("triangleCount", () => {
  it("counts triangles per node", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    g.addEdge("a", "d"); // no triangle with d
    const counts = triangleCount(g);
    expect(counts.get("a")).toBe(1);
    expect(counts.get("b")).toBe(1);
    expect(counts.get("c")).toBe(1);
    expect(counts.get("d")).toBe(0);
  });
});

describe("labelPropagation", () => {
  it("assigns same community to connected clique", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    // Disconnected node
    g.addNode("d", "");
    const labels = labelPropagation(g);
    // a, b, c should share a label; d has its own
    expect(labels.get("a")).toBe(labels.get("b"));
    expect(labels.get("b")).toBe(labels.get("c"));
    expect(labels.get("d")).not.toBe(labels.get("a"));
  });

  it("each node is its own community when no edges", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    const labels = labelPropagation(g);
    const communities = extractCommunities(labels);
    expect(communities).toHaveLength(3);
  });
});

describe("extractCommunities", () => {
  it("groups nodes by label", () => {
    const labels = new Map<string, string>([
      ["a", "x"], ["b", "x"], ["c", "y"],
    ]);
    const comms = extractCommunities(labels);
    expect(comms).toHaveLength(2);
  });
});

describe("louvain", () => {
  it("detects communities in disconnected components", () => {
    const g = new Graph<string>({ directed: false });
    // Two cliques
    g.addNode("a", "").addNode("b", "").addNode("c", "");
    g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
    g.addNode("d", "").addNode("e", "").addNode("f", "");
    g.addEdge("d", "e").addEdge("e", "f").addEdge("f", "d");
    const comms = louvain(g);
    // Within each clique, nodes should share a community
    expect(comms.get("a")).toBe(comms.get("b"));
    expect(comms.get("b")).toBe(comms.get("c"));
    expect(comms.get("d")).toBe(comms.get("e"));
    expect(comms.get("e")).toBe(comms.get("f"));
    // Different cliques should be different communities
    expect(comms.get("a")).not.toBe(comms.get("d"));
  });

  it("handles single node", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "");
    const comms = louvain(g);
    expect(comms.get("a")).toBe(0);
  });
});

describe("modularity", () => {
  it("returns higher modularity for good partition", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "").addNode("c", "").addNode("d", "");
    g.addEdge("a", "b", 1).addEdge("c", "d", 1).addEdge("b", "c", 1);

    // Good partition: {a,b} and {c,d}
    const good = new Map<string, number>([["a", 0], ["b", 0], ["c", 1], ["d", 1]]);
    // Bad partition: {a,c} and {b,d}
    const bad = new Map<string, number>([["a", 0], ["b", 1], ["c", 0], ["d", 1]]);

    expect(modularity(g, good)).toBeGreaterThan(modularity(g, bad));
  });

  it("returns 0 for single community", () => {
    const g = new Graph<string>({ directed: false });
    g.addNode("a", "").addNode("b", "");
    g.addEdge("a", "b");
    const single = new Map<string, number>([["a", 0], ["b", 0]]);
    expect(modularity(g, single)).toBeCloseTo(0);
  });
});
