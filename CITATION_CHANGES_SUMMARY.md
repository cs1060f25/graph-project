# Citation-Related Changes Summary

## Overview

I made two major improvements to how citations are handled in the graph visualization: fixing citation count display accuracy and implementing citation-based edge creation. These changes ensure that citation data is properly extracted, displayed, and used to create meaningful connections between papers in the graph.

## Citation Count Display Fix

Previously, citation counts were showing incorrectly for single-layer queries. When a paper had 45 citations according to the source website, the graph would display only 1 citation. This happened because the code was using truthy/falsy checks that converted undefined values to 0, and then 0 values were being treated as falsy in display logic, causing them to default to 1.

I fixed this by changing how citation counts are preserved throughout the data transformation pipeline. Instead of using `paper.citationCount || 0`, I now use explicit `undefined` and `null` checks to properly preserve citation counts even when they are 0. I also added the `citationCount` field directly to nodes for compatibility and updated the tooltip display logic to show citations even when the value is 0. This ensures that citation counts are accurately displayed for both single-layer and multi-layer queries, showing the actual number of citations (like 45) instead of defaulting to 1.

The changes were made in `graphDataTransformer.js` to preserve citation counts properly, and in `GraphVisualization.jsx` to fix the tooltip display logic. This fix was committed as `8415a51 GRAPH-85: Fix citation count display for single-layer queries`.

## Citation-Based Edge Creation

The second major change addresses how edges are created between papers in the graph. Previously, the graph would create edges as a simple sequential chain, connecting papers in the order they appeared (Paper 0 → Paper 1 → Paper 2 → Paper 3), regardless of whether those papers actually cited each other. This was happening because the OpenAlex API wasn't extracting citation relationship data, so the graph had no information about which papers cited which other papers.

I implemented citation-based edge creation by extracting the `referenced_works` field from OpenAlex API responses. The OpenAlex API provides this field which contains an array of work IDs representing papers that each paper cites. I modified the API handler to request this field using the `select` parameter and extract it into a `references` array stored in each paper object. Then, in the graph data transformer, I updated the edge creation logic to check if papers have `references` arrays and create edges from citing papers to cited papers, but only when both papers are present in the graph.

Now, when Paper A cites Paper B and both papers are in your search results, you'll see an edge from A to B representing that actual citation relationship. The graph only falls back to the sequential chain approach if no citation relationships are found between papers in the graph. This creates a much more meaningful visualization that shows the actual citation network structure rather than arbitrary sequential connections.

The changes were made in `OpenAlexAPI.js` to extract and store citation relationships, and in `graphDataTransformer.js` to create edges based on those relationships. This was committed as `0735ad4 GRAPH-85: Extract citation relationships from OpenAlex API for edge creation`.

## Impact

These changes significantly improve the accuracy and usefulness of the graph visualization. Citation counts now reflect the actual number of citations for each paper, and edges represent real citation relationships between papers. This makes the graph a more accurate representation of the academic citation network, allowing users to see which papers cite which other papers in their search results, rather than just seeing papers connected in an arbitrary sequence.
