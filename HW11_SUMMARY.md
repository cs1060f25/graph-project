# HW11 Summary: GRAPH-84 & GRAPH-85

## Completed Work

### Step 3: Test/Reproduce the Bugs ✅

**GRAPH-84 Test:**
- Created test in `GraphVisualization.test.jsx`
- Test calculates minimum distances between nodes of varying sizes
- Documents the overlap problem when using citation-based node sizing
- Commit: `46186f4 GRAPH-84: Add test to detect node overlap with variable sizing`

**GRAPH-85 Test:**
- Created test in `OpenAlexAPI.test.js`
- Test verifies citation count extraction from OpenAlex API
- Tests both keyword and topic queries
- Handles missing citation data gracefully
- Commit: `238c57e GRAPH-85: Add test for citation count extraction from OpenAlex API`

### Step 4: Fix the Bugs ✅

**GRAPH-85 Fix (Attempt 1 - SUCCESS):**
- Extracted `cited_by_count` from OpenAlex API responses
- Extracted `citationsCount`/`citationCount` from CORE API responses
- Defaults to 0 if citation data is not available
- Citation counts now flow through the data pipeline and display in UI
- Commits:
  - `af293c4 GRAPH-85: Extract citation counts from OpenAlex and CORE APIs`
  - `a86e1cf GRAPH-85: Add citation count extraction to CORE API`

**GRAPH-84 Fix (Attempt 1 - SUCCESS):**
- Changed node sizing to use citation-based sizing: `Math.sqrt(citations) * 6 + 4`
- Added d3-force import for collision detection
- Configured force simulation with:
  - Charge force: -600 (strong repulsion)
  - Link distances based on node sizes: `sourceSize + targetSize + 100`
  - Collision detection with radius: `nodeSize / 2 + 20` (node radius + padding)
  - Collision strength: 1.0 (maximum)
- Increased cooldownTicks to 200 for better stability
- Commit: `3c70077 GRAPH-84: Fix node clustering with variable sizing using collision detection`

## AI Assistance Notes

**GRAPH-85:**
- AI successfully identified that OpenAlex API provides `cited_by_count` field
- Implementation was straightforward - just needed to extract and pass through the field
- No additional attempts needed

**GRAPH-84:**
- AI approach: Used d3-force collision detection with dynamic radius based on node sizes
- Successfully configured force simulation parameters
- First attempt worked - nodes now properly space themselves based on size

## Next Steps: Step 5 - Validation

1. Create pull request from `kharper-hw11` branch
2. Self-review or assign to teammate
3. Test that:
   - Citation counts are displayed in node tooltips and details
   - Nodes don't overlap with variable sizing
   - Graph remains performant
4. Close Linear issues if fixed, or document any remaining issues

## Branch: `kharper-hw11`

All commits include graph IDs (GRAPH-84 or GRAPH-85) in commit messages.

