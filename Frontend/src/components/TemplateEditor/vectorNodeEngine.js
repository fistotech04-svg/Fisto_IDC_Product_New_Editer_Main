/**
 * vectorNodeEngine.js
 * Extracted vector path manipulation, node editing, line deduplication,
 * meeting-node cleanup utilities, handle calculations, and vector path actions.
 */

export const getPaperSegments = (paperPath) => {
  if (!paperPath) return [];
  if (paperPath.children && paperPath.children.length > 0) {
    return paperPath.children.flatMap(c => c.segments || []);
  }
  return paperPath.segments || [];
};

export const getPaperCurves = (paperPath) => {
  if (!paperPath) return [];
  if (paperPath.children && paperPath.children.length > 0) {
    return paperPath.children.flatMap(c => c.curves || []);
  }
  return paperPath.curves || [];
};

export const cleanPaperPathData = (paperPath) => {
  if (!paperPath) return '';
  const contours = (paperPath.children && paperPath.children.length > 0)
    ? paperPath.children
    : [paperPath];

  const seenEdges = new Set();
  const cleanSubpathDs = [];

  contours.forEach(child => {
    if (!child.segments || child.segments.length === 0) return;
    const n = child.segments.length;
    const first = child.segments[0].point;
    let d = `M ${Math.round(first.x * 100) / 100} ${Math.round(first.y * 100) / 100}`;
    const count = child.closed ? n : Math.max(0, n - 1);

    for (let i = 0; i < count; i++) {
      const seg1 = child.segments[i];
      const seg2 = child.segments[(i + 1) % n];
      const p1 = seg1.point;
      const p2 = seg2.point;

      // Remove in-between line if two points meet at exact same position (0-length line)
      const pointDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pointDist < 0.5) {
        continue;
      }

      const isLine = (!seg1.handleOut || seg1.handleOut.isZero()) && (!seg2.handleIn || seg2.handleIn.isZero());

      if (isLine) {
        const x1 = Math.round(p1.x * 10) / 10, y1 = Math.round(p1.y * 10) / 10;
        const x2 = Math.round(p2.x * 10) / 10, y2 = Math.round(p2.y * 10) / 10;

        const edgeKey = x1 < x2 || (x1 === x2 && y1 < y2)
          ? `${x1},${y1}_${x2},${y2}`
          : `${x2},${y2}_${x1},${y1}`;

        if (seenEdges.has(edgeKey)) {
          // Remove duplicate line segment between the exact same two points
          d += ` M ${Math.round(p2.x * 100) / 100} ${Math.round(p2.y * 100) / 100}`;
          continue;
        }
        seenEdges.add(edgeKey);
        d += ` L ${Math.round(p2.x * 100) / 100} ${Math.round(p2.y * 100) / 100}`;
      } else {
        const c1 = p1.add(seg1.handleOut);
        const c2 = p2.add(seg2.handleIn);
        d += ` C ${Math.round(c1.x * 100) / 100} ${Math.round(c1.y * 100) / 100} ${Math.round(c2.x * 100) / 100} ${Math.round(c2.y * 100) / 100} ${Math.round(p2.x * 100) / 100} ${Math.round(p2.y * 100) / 100}`;
      }
    }
    if (child.closed) d += ' Z';
    cleanSubpathDs.push(d);
  });

  return cleanSubpathDs.join(' ');
};

export const mergeMeetingNodes = (paperPath, paperScope) => {
  if (!paperPath) return;
  try {
    if (paperScope) paperScope.activate();
    const contours = (paperPath.children && paperPath.children.length > 0)
      ? paperPath.children.slice()
      : [paperPath];

    contours.forEach(child => {
      if (!child.segments) return;

      // If all points in this contour have merged to the same location, remove contour
      if (child.segments.length > 1) {
        const firstPt = child.segments[0].point;
        const allMerged = child.segments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 1.5);
        if (allMerged) {
          child.remove();
          return;
        }
      }

      // If an open 2-point line segment meets at the exact same location, remove the line subpath completely
      if (!child.closed && child.segments.length === 2) {
        const seg1 = child.segments[0];
        const seg2 = child.segments[1];
        if (seg1 && seg2 && Math.hypot(seg1.point.x - seg2.point.x, seg1.point.y - seg2.point.y) < 1.5) {
          child.remove();
          return;
        }
      }

      // Loop backwards to remove duplicate meeting segments
      for (let i = child.segments.length - 1; i >= 0; i--) {
        if (child.segments.length <= 1) break;
        const nextIdx = (i + 1) % child.segments.length;
        if (!child.closed && nextIdx === 0) continue;
        const seg1 = child.segments[i];
        const seg2 = child.segments[nextIdx];
        if (seg1 && seg2) {
          const dist = Math.hypot(seg1.point.x - seg2.point.x, seg1.point.y - seg2.point.y);
          if (dist < 1.5) {
            child.removeSegment(nextIdx);
          }
        }
      }

      if (child.segments.length <= 1) {
        child.remove();
      }
    });
  } catch (e) {}
};

/**
 * Drag and adjust control handles according to active node curve mode (smooth, balanced, custom, sharp).
 */
export const applyHandleDrag = (seg, handleSide, mousePoint, isAltKey) => {
  if (!seg) return;
  if (isAltKey) {
    seg.nodeType = 'custom';
  }

  let nodeType = seg.nodeType;
  if (!nodeType) {
    if (seg.handleIn.isZero() && seg.handleOut.isZero()) {
      nodeType = 'sharp';
    } else if (!seg.handleIn.isZero() && !seg.handleOut.isZero()) {
      const dot = seg.handleIn.normalize().dot(seg.handleOut.normalize());
      if (dot < -0.95) {
        const lenDiff = Math.abs(seg.handleIn.length - seg.handleOut.length);
        nodeType = lenDiff < 1.5 ? 'balanced' : 'smooth';
      } else {
        nodeType = 'custom';
      }
    } else {
      nodeType = 'custom';
    }
    seg.nodeType = nodeType;
  }

  const mouseVec = mousePoint.subtract(seg.point);

  if (handleSide === 'in') {
    seg.handleIn = mouseVec;
    if (nodeType === 'balanced') {
      seg.handleOut = mouseVec.multiply(-1);
    } else if (nodeType === 'smooth') {
      const outLen = (!seg.handleOut.isZero()) ? seg.handleOut.length : mouseVec.length;
      if (!mouseVec.isZero()) {
        seg.handleOut = mouseVec.normalize(-outLen);
      }
    }
  } else if (handleSide === 'out') {
    seg.handleOut = mouseVec;
    if (nodeType === 'balanced') {
      seg.handleIn = mouseVec.multiply(-1);
    } else if (nodeType === 'smooth') {
      const inLen = (!seg.handleIn.isZero()) ? seg.handleIn.length : mouseVec.length;
      if (!mouseVec.isZero()) {
        seg.handleIn = mouseVec.normalize(-inLen);
      }
    }
  }
};

/**
 * Execute vector path property action (sharp, smooth, balanced, custom, join, split, add-point, curve-line).
 */
export const executeVectorPathAction = (paperPath, action, targetSegIndices, paperScope) => {
  if (!paperPath || !action) return;

  const Point = paperScope ? paperScope.Point : paperPath.project?.paper?.Point;

  if (action === 'sharp') {
    targetSegIndices.forEach(idx => {
      const seg = paperPath.segments[idx];
      if (seg) {
        seg.nodeType = 'sharp';
        seg.handleIn = new Point(0, 0);
        seg.handleOut = new Point(0, 0);
      }
    });
  } else if (action === 'smooth') {
    targetSegIndices.forEach(idx => {
      const seg = paperPath.segments[idx];
      if (seg) {
        seg.nodeType = 'smooth';
        const prev = paperPath.segments[(idx - 1 + paperPath.segments.length) % paperPath.segments.length];
        const next = paperPath.segments[(idx + 1) % paperPath.segments.length];

        let dir;
        if (prev && next && prev !== seg && next !== seg) {
          dir = next.point.subtract(prev.point);
        } else if (prev && prev !== seg) {
          dir = seg.point.subtract(prev.point);
        } else if (next && next !== seg) {
          dir = next.point.subtract(seg.point);
        }

        if (!dir || dir.isZero()) {
          dir = new Point(25, 0);
        }

        const outLen = (!seg.handleOut.isZero() && seg.handleOut.length > 1) ? seg.handleOut.length : 25;
        const inLen = (!seg.handleIn.isZero() && seg.handleIn.length > 1) ? seg.handleIn.length : 25;

        seg.handleOut = dir.normalize(outLen);
        seg.handleIn = dir.normalize(-inLen);
      }
    });
  } else if (action === 'balanced') {
    targetSegIndices.forEach(idx => {
      const seg = paperPath.segments[idx];
      if (seg) {
        seg.nodeType = 'balanced';
        const prev = paperPath.segments[(idx - 1 + paperPath.segments.length) % paperPath.segments.length];
        const next = paperPath.segments[(idx + 1) % paperPath.segments.length];

        let dir;
        if (prev && next && prev !== seg && next !== seg) {
          dir = next.point.subtract(prev.point);
        } else if (prev && prev !== seg) {
          dir = seg.point.subtract(prev.point);
        } else if (next && next !== seg) {
          dir = next.point.subtract(seg.point);
        }

        if (!dir || dir.isZero()) {
          dir = new Point(25, 0);
        }

        const len = Math.max(seg.handleIn.length, seg.handleOut.length, 25);

        seg.handleOut = dir.normalize(len);
        seg.handleIn = dir.normalize(-len);
      }
    });
  } else if (action === 'custom') {
    targetSegIndices.forEach(idx => {
      const seg = paperPath.segments[idx];
      if (seg) {
        seg.nodeType = 'custom';
        const prev = paperPath.segments[(idx - 1 + paperPath.segments.length) % paperPath.segments.length];
        const next = paperPath.segments[(idx + 1) % paperPath.segments.length];

        let dir;
        if (prev && next && prev !== seg && next !== seg) {
          dir = next.point.subtract(prev.point);
        } else if (prev && prev !== seg) {
          dir = seg.point.subtract(prev.point);
        } else if (next && next !== seg) {
          dir = next.point.subtract(seg.point);
        }

        if (!dir || dir.isZero()) {
          dir = new Point(25, 0);
        }

        if (seg.handleIn.isZero()) {
          seg.handleIn = dir.normalize(-25);
        }
        if (seg.handleOut.isZero()) {
          seg.handleOut = dir.normalize(25);
        }
      }
    });
  } else if (action === 'join') {
    paperPath.closed = !paperPath.closed;
  } else if (action === 'add-point') {
    const curves = [...paperPath.curves];
    curves.forEach(curve => {
      curve.divideAtTime(0.5);
    });
  } else if (action === 'curve-line') {
    paperPath.curves.forEach(curve => {
      if (curve.isStraight()) {
        const p1 = curve.segment1.point;
        const p2 = curve.segment2.point;
        const dir = p2.subtract(p1).normalize(20);
        curve.segment1.handleOut = dir;
        curve.segment2.handleIn = dir.multiply(-1);
      }
    });
  } else if (action === 'split') {
    if (targetSegIndices.length > 0) {
      const idx = targetSegIndices[0];
      if (idx > 0 && idx < paperPath.segments.length - 1) {
        paperPath.splitAt(idx);
      }
    }
  }
};

/**
 * Delete either the selected control handle point (retract handle) or center node point.
 */
export const deleteSelectedNodeOrHandle = (paperPath, targetSegIndices, selectedHandleSide, paperScope) => {
  if (!paperPath || !targetSegIndices || targetSegIndices.length === 0) return;

  const Point = paperScope ? paperScope.Point : paperPath.project?.paper?.Point;
  const segments = getPaperSegments(paperPath);

  if (selectedHandleSide === 'in' || selectedHandleSide === 'out') {
    targetSegIndices.forEach(idx => {
      const seg = segments[idx];
      if (seg) {
        if (selectedHandleSide === 'in') {
          seg.handleIn = new Point(0, 0);
        } else if (selectedHandleSide === 'out') {
          seg.handleOut = new Point(0, 0);
        }
        if (seg.handleIn.isZero() && seg.handleOut.isZero()) {
          seg.nodeType = 'sharp';
        } else {
          seg.nodeType = 'custom';
        }
      }
    });
  } else {
    const sorted = [...targetSegIndices].sort((a, b) => b - a);
    sorted.forEach(idx => {
      if (segments[idx]) {
        segments[idx].remove();
      }
    });
    mergeMeetingNodes(paperPath, paperScope);
  }
};
