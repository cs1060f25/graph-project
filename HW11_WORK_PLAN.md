# HW11 Work Plan: GRAPH-84 & GRAPH-85

## Overview
Working on two bugs for HW11:
- **GRAPH-84**: Node Sizing Causes Graph Clustering/Overlap
- **GRAPH-85**: Missing Citation Counts in Graph Visualization

---

## Step 3: Test/Reproduce the Bugs (15 points: 10 for Bug 1, 5 for Bug 2)

### GRAPH-84: Node Sizing Test

**Test File:** `client/graph-project-react-app/src/components/GraphVisualization.test.jsx`

**Test to Create:**
```javascript
describe('GRAPH-84: Node sizing with variable sizes', () => {
  it('should detect node overlap when using citation-based sizing', () => {
    // Create graph data with nodes of varying sizes
    const graphData = {
      nodes: [
        { id: '1', value: 1, citations: 1 },    // Small node
        { id: '2', value: 10, citations: 10 },   // Medium node
        { id: '3', value: 50, citations: 50 },   // Large node
        { id: '4', value: 100, citations: 100 }, // Very large node
      ],
      links: [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
        { source: '3', target: '4' },
      ]
    };
    
    // Render graph
    // Check for node overlap by measuring distances between node centers
    // vs their combined radii
    // Test should fail if nodes overlap
  });
});
```

**Commit Message:** `GRAPH-84: Add test to detect node overlap with variable sizing`

---

### GRAPH-85: Citation Counts Test

**Test File:** `client/graph-project-react-app/src/handlers/api-handler/OpenAlexAPI.test.js`

**Test to Create:**
```javascript
describe('GRAPH-85: Citation count extraction', () => {
  it('should extract cited_by_count from OpenAlex API response', async () => {
    const mockResponse = {
      results: [{
        id: 'https://openalex.org/W123456',
        display_name: 'Test Paper',
        cited_by_count: 45,
        // ... other fields
      }]
    };
    
    // Mock fetch to return mockResponse
    // Call API handler
    // Verify citationCount is extracted and included in result
    expect(result[0].citationCount).toBe(45);
  });
  
  it('should display citation counts in graph node tooltip', () => {
    // Test that nodeLabel includes citation count when available
  });
});
```

**Commit Message:** `GRAPH-85: Add test for citation count extraction and display`

---

## Step 4: Try to Fix the Bugs (15 points: 10+5)

### GRAPH-84: Fix Node Sizing/Clustering

**Approach 1: Configure Force Simulation**
- Add collision detection with node-size-aware radius
- Adjust charge force based on node sizes
- Increase link distances based on combined node sizes

**Approach 2: Use d3-force collision**
- Import d3-force
- Add forceCollide with dynamic radius based on node size
- Configure strength and iterations

**Approach 3: Manual spacing algorithm**
- Pre-calculate minimum distances
- Adjust force simulation parameters dynamically

**AI Prompt for Fix:**
```
I need to fix node overlap in a react-force-graph-2d visualization. 
When nodes have variable sizes based on citation counts, they cluster together.
Current code uses fixed size (6px). I need to:
1. Use variable node sizes based on citations
2. Configure force simulation to prevent overlap
3. Ensure nodes maintain minimum distance based on their sizes

Here's the current getNodeSize function: [paste code]
Here's the ForceGraph2D component: [paste code]
```

**Expected Fix Location:** `client/graph-project-react-app/src/components/GraphVisualization.jsx`

---

### GRAPH-85: Fix Missing Citation Counts

**Approach 1: Extract from OpenAlex API**
- OpenAlex provides `cited_by_count` field
- Update OpenAlexAPI.js to extract and return this field

**Approach 2: Extract from CORE API**
- Check if CORE API provides citation data
- Extract if available, use fallback if not

**Approach 3: Display in UI**
- Ensure citation counts are passed through graphDataTransformer
- Verify nodeLabel displays citations
- Add to node details panel

**AI Prompt for Fix:**
```
I need to extract citation counts from API responses and display them in a graph visualization.
OpenAlex API provides 'cited_by_count' in responses. I need to:
1. Extract cited_by_count from OpenAlex API responses
2. Pass citationCount through the data transformation pipeline
3. Display citation counts in node tooltips and details

Here's the OpenAlexAPI.js file: [paste code]
Here's the graphDataTransformer.js: [paste code]
```

**Expected Fix Locations:**
- `client/graph-project-react-app/src/handlers/api-handler/OpenAlexAPI.js`
- `client/graph-project-react-app/src/handlers/api-handler/CoreAPI.js`
- `client/graph-project-react-app/src/components/GraphVisualization.jsx`

---

## Step 5: Validation (5 points: 3+2)

### Create Pull Request
1. Create feature branch: `hw11-graph-84-85-fixes`
2. Include both test commits and fix commits
3. Create PR with description linking to Linear issues
4. Assign for review (self-review or teammate)

### PR Description Template:
```
## GRAPH-84 & GRAPH-85 Fixes

### Changes
- GRAPH-84: Fixed node clustering/overlap with variable node sizes
- GRAPH-85: Added citation count extraction and display

### Tests
- Added test for node overlap detection (GRAPH-84)
- Added test for citation count extraction (GRAPH-85)

### Validation
- [ ] Nodes no longer overlap with variable sizing
- [ ] Citation counts are extracted from OpenAlex API
- [ ] Citation counts are displayed in node tooltips
- [ ] Graph remains performant

Closes GRAPH-84
Closes GRAPH-85
```

---

## Current State Analysis

### GRAPH-84 (Node Sizing)
**Current Code:**
- `getNodeSize` uses fixed size (6px) - line 110 in GraphVisualization.jsx
- No force simulation configuration for variable sizes
- Previous attempts caused clustering

**What Needs to Happen:**
1. Change `getNodeSize` to use citation-based sizing
2. Configure d3-force collision detection
3. Adjust charge force and link distances
4. Test that nodes don't overlap

### GRAPH-85 (Citation Counts)
**Current Code:**
- APIs don't extract citation counts (grep found no matches)
- `graphDataTransformer.js` expects `citationCount` but gets 0 (line 19)
- Node tooltip shows citations if available (line 260) but they're always 0

**What Needs to Happen:**
1. Extract `cited_by_count` from OpenAlex API
2. Extract citation data from CORE API if available
3. Pass through transformation pipeline
4. Display in UI (already set up, just needs data)

---

## Next Steps

1. **Create tests first** (Step 3)
   - Write test for GRAPH-84 (node overlap detection)
   - Write test for GRAPH-85 (citation extraction)
   - Commit with issue numbers

2. **Attempt fixes with AI** (Step 4)
   - Try fixing GRAPH-84 with AI (up to 3 attempts)
   - Try fixing GRAPH-85 with AI (up to 3 attempts)
   - Document attempts in Linear issues

3. **Manual fixes if needed**
   - If AI fails, attempt manual fixes
   - Document process

4. **Create PR and validate** (Step 5)
   - Create pull request
   - Self-review or assign to teammate
   - Close issues if fixed, or explain why not

