# Pull Request: GRAPH-84 & GRAPH-85 Fixes

## Summary
Fixes two bugs identified in user interviews:
- **GRAPH-84**: Node clustering/overlap when using variable node sizes
- **GRAPH-85**: Missing citation counts in graph visualization

## Changes

### GRAPH-84: Node Sizing with Collision Detection
- Changed node sizing from fixed (6px) to citation-based: `Math.sqrt(citations) * 6 + 4`
- Added d3-force collision detection with dynamic radius based on node sizes
- Configured force simulation:
  - Charge force: -600 (strong repulsion)
  - Link distances: `sourceSize + targetSize + 100` (prevents overlap)
  - Collision radius: `nodeSize / 2 + 20` (node radius + padding)
  - Collision strength: 1.0 (maximum)
- Increased cooldownTicks to 200 for better layout stability

### GRAPH-85: Citation Count Extraction
- Extract `cited_by_count` from OpenAlex API responses
- Extract `citationsCount`/`citationCount` from CORE API responses
- Default to 0 if citation data is not available
- Citation counts now display in node tooltips and details panel

## Tests
- Added test for node overlap detection (GRAPH-84)
- Added test for citation count extraction (GRAPH-85)

## Validation Checklist
- [ ] Citation counts are extracted from OpenAlex API
- [ ] Citation counts are extracted from CORE API (if available)
- [ ] Citation counts are displayed in node tooltips
- [ ] Citation counts are displayed in node details panel
- [ ] Nodes don't overlap with variable sizing
- [ ] Graph remains interactive and readable
- [ ] No performance degradation
- [ ] Tests pass

## Commits
- `46186f4` GRAPH-84: Add test to detect node overlap with variable sizing
- `238c57e` GRAPH-85: Add test for citation count extraction from OpenAlex API
- `af293c4` GRAPH-85: Extract citation counts from OpenAlex and CORE APIs
- `a86e1cf` GRAPH-85: Add citation count extraction to CORE API
- `3c70077` GRAPH-84: Fix node clustering with variable sizing using collision detection

## Related Issues
Closes GRAPH-84
Closes GRAPH-85

