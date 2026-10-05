import React, { useCallback, useRef } from "react";
import * as THREE from "three";

export function useThreedHotspots({
  hotspots,
  setHotspots,
  activeHotspotId,
  setActiveHotspotId,
  selectedMaterial,
  setSelectedMaterial,
  editingHotspot,
  setEditingHotspot,
  showHotspotModal,
  setShowHotspotModal,
  isPlacingHotspot,
  setIsPlacingHotspot,
  setRightPanelMode,
  sceneWrapperRef,
  cameraInstanceRef,
  controlsRef,
  glInstanceRef,
  setTargetPosition,
  commitHistoryNow,
  buildSnapshot,
  toast
}) {
  const isPlacingHotspotRef = useRef(false);
  const isHotspotFocusingRef = useRef(false);
  const lastHotspotClickTimeRef = useRef(0);
  const cameraAnimFrameRef = useRef(null);

  const getMeshSurfacePosition = useCallback((meshUuid, clickPoint) => {
    if (clickPoint && typeof clickPoint.x === "number") {
      return [
        parseFloat(clickPoint.x.toFixed(3)),
        parseFloat(clickPoint.y.toFixed(3)),
        parseFloat(clickPoint.z.toFixed(3))
      ];
    }
    if (!meshUuid || !sceneWrapperRef.current) return [0, 1.2, 0];
    let foundMesh = null;
    sceneWrapperRef.current.traverse((child) => {
      if (child.uuid === meshUuid) {
        foundMesh = child;
      }
    });
    if (foundMesh) {
      try {
        const box = new THREE.Box3().setFromObject(foundMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        return [
          parseFloat(center.x.toFixed(3)),
          parseFloat(box.max.y.toFixed(3)),
          parseFloat(center.z.toFixed(3))
        ];
      } catch (_) { }
    }
    return [0, 1.2, 0];
  }, [sceneWrapperRef]);

  // Smooth spherical camera navigation to show that specific mesh in FRONT VIEW (facing clicked hotspot surface)
  const focusHotspot = useCallback((hotspot) => {
    if (!hotspot) return;
    const camera = cameraInstanceRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // 1. Locate the specific mesh object in the 3D scene
    let targetMeshObj = null;
    if (sceneWrapperRef.current) {
      sceneWrapperRef.current.traverse((child) => {
        if (
          (hotspot.meshUuid && child.uuid === hotspot.meshUuid) ||
          (hotspot.meshName && child.name === hotspot.meshName)
        ) {
          targetMeshObj = child;
        }
      });
    }

    const hsPos = Array.isArray(hotspot.position)
      ? new THREE.Vector3(...hotspot.position)
      : new THREE.Vector3(0, 1, 0);

    let targetCenter = hsPos.clone();
    let meshRadius = 0.8;

    if (targetMeshObj) {
      const box = new THREE.Box3().setFromObject(targetMeshObj);
      if (!box.isEmpty() && isFinite(box.min.x)) {
        const size = new THREE.Vector3();
        box.getCenter(targetCenter);
        box.getSize(size);
        meshRadius = Math.max(0.25, size.length() / 2);
      }
    }

    // 2. Compute camera distance to fit the full mesh in view based on FOV and aspect ratio
    const fov = camera.fov || 45;
    const canvasEl = glInstanceRef.current?.domElement;
    const aspect = (canvasEl && canvasEl.clientHeight > 0)
      ? (canvasEl.clientWidth / canvasEl.clientHeight)
      : (camera.aspect || 1.6);

    const vFOVRad = THREE.MathUtils.degToRad(fov) / 2;
    const hFOVRad = Math.atan(Math.tan(vFOVRad) * aspect);

    const distV = meshRadius / Math.sin(vFOVRad);
    const distH = meshRadius / Math.sin(hFOVRad);
    const fitDistance = Math.max(distV, distH);

    const framingDistance = Math.max(1.15, fitDistance * 1.28);

    // 3. Compute FRONT VIEW vector directly facing the clicked hotspot surface:
    let frontDir = new THREE.Vector3();

    if (hotspot.normal && Array.isArray(hotspot.normal) && (Math.abs(hotspot.normal[0]) > 0.001 || Math.abs(hotspot.normal[1]) > 0.001 || Math.abs(hotspot.normal[2]) > 0.001)) {
      frontDir.set(hotspot.normal[0], hotspot.normal[1], hotspot.normal[2]).normalize();
    } else {
      frontDir.subVectors(hsPos, targetCenter);
      if (frontDir.lengthSq() > 0.0001) {
        frontDir.normalize();
      } else {
        frontDir.set(0, 0.2, 1).normalize();
      }
    }

    if (frontDir.y > 0.82) {
      const fallbackZ = Math.abs(frontDir.z) > 0.1 ? frontDir.z : 0.45;
      frontDir.set(frontDir.x * 0.4, 0.85, fallbackZ).normalize();
    } else if (frontDir.y < -0.82) {
      const fallbackZ = Math.abs(frontDir.z) > 0.1 ? frontDir.z : 0.45;
      frontDir.set(frontDir.x * 0.4, -0.85, fallbackZ).normalize();
    } else {
      frontDir.y = Math.max(-0.4, Math.min(0.5, frontDir.y + 0.1));
      frontDir.normalize();
    }

    const lookTarget = targetCenter.clone().lerp(hsPos, 0.4);
    const endCamPos = lookTarget.clone().add(frontDir.multiplyScalar(framingDistance));

    const startCamPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();
    const duration = 540;

    if (cameraAnimFrameRef.current) {
      cancelAnimationFrame(cameraAnimFrameRef.current);
      cameraAnimFrameRef.current = null;
    }

    const vStart = new THREE.Vector3().subVectors(startCamPos, startTarget);
    const vEnd = new THREE.Vector3().subVectors(endCamPos, lookTarget);

    const distStart = Math.max(0.1, vStart.length());
    const distEnd = Math.max(0.1, vEnd.length());

    const dirStart = vStart.clone().normalize();
    const dirEnd = vEnd.clone().normalize();

    const dot = Math.max(-1, Math.min(1, dirStart.dot(dirEnd)));
    const angle = Math.acos(dot);
    let rotationAxis = new THREE.Vector3();

    if (dot < -0.9999) {
      rotationAxis.set(0, 1, 0).cross(dirStart);
      if (rotationAxis.lengthSq() < 0.001) rotationAxis.set(1, 0, 0).cross(dirStart);
      rotationAxis.normalize();
    } else if (dot > 0.9999) {
      rotationAxis.set(0, 1, 0);
    } else {
      rotationAxis.crossVectors(dirStart, dirEnd).normalize();
    }

    const wasControlsEnabled = controls.enabled;
    controls.enabled = false;
    isHotspotFocusingRef.current = true;

    const animateFocus = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      const curDir = dirStart.clone().applyAxisAngle(rotationAxis, angle * ease).normalize();
      const curDist = THREE.MathUtils.lerp(distStart, distEnd, ease);
      const curTarget = new THREE.Vector3().lerpVectors(startTarget, lookTarget, ease);

      camera.position.copy(curTarget).addScaledVector(curDir, curDist);
      controls.target.copy(curTarget);
      camera.lookAt(curTarget);

      if (progress < 1) {
        cameraAnimFrameRef.current = requestAnimationFrame(animateFocus);
      } else {
        cameraAnimFrameRef.current = null;
        camera.position.copy(endCamPos);
        controls.target.copy(lookTarget);
        camera.lookAt(lookTarget);
        controls.enabled = wasControlsEnabled;
        controls.update();
        if (typeof controls.saveState === 'function') {
          controls.saveState();
        }
        setTargetPosition({
          x: parseFloat(lookTarget.x.toFixed(2)),
          y: parseFloat(lookTarget.y.toFixed(2)),
          z: parseFloat(lookTarget.z.toFixed(2))
        });
        setTimeout(() => {
          isHotspotFocusingRef.current = false;
        }, 120);
      }
    };

    cameraAnimFrameRef.current = requestAnimationFrame(animateFocus);
  }, [cameraInstanceRef, controlsRef, sceneWrapperRef, glInstanceRef, setTargetPosition]);

  const handleHotspotClick = useCallback((hotspot) => {
    if (!hotspot) return;
    lastHotspotClickTimeRef.current = Date.now();
    const hsId = hotspot.id;

    if (String(activeHotspotId || '') === String(hsId || '')) {
      setActiveHotspotId(null);
      return;
    }

    setActiveHotspotId(hsId);
    setRightPanelMode('hotspot');
    focusHotspot(hotspot);
  }, [activeHotspotId, setActiveHotspotId, setRightPanelMode, focusHotspot]);

  const handleOpenAddHotspot = useCallback((mesh = null, directOpen = false) => {
    setRightPanelMode('hotspot');
    const targetMesh = mesh || selectedMaterial;
    if (directOpen && targetMesh && targetMesh.isMesh && targetMesh.clickPoint) {
      setEditingHotspot(null);
      setShowHotspotModal(true);
      return;
    }
    setIsPlacingHotspot(true);
    isPlacingHotspotRef.current = true;
    toast.info("Click anywhere on the 3D model to place a hotspot pin");
  }, [selectedMaterial, setRightPanelMode, setEditingHotspot, setShowHotspotModal, setIsPlacingHotspot, toast]);

  const handleSaveHotspot = useCallback(({ label, description, color }) => {
    const targetMesh = selectedMaterial;

    const clickNormalArr = targetMesh?.clickNormal
      ? [parseFloat(targetMesh.clickNormal.x.toFixed(4)), parseFloat(targetMesh.clickNormal.y.toFixed(4)), parseFloat(targetMesh.clickNormal.z.toFixed(4))]
      : null;

    if (editingHotspot) {
      const existingIndex = hotspots.findIndex(h => h.id === editingHotspot.id);
      if (existingIndex !== -1) {
        const existing = hotspots[existingIndex];
        const newPos = targetMesh?.clickPoint
          ? getMeshSurfacePosition(targetMesh.meshUuid || targetMesh.uuid, targetMesh.clickPoint)
          : existing.position;

        const updatedHs = {
          ...existing,
          label,
          description,
          color: color || "#5d5efc",
          position: newPos,
          normal: clickNormalArr || existing.normal || null,
          meshUuid: targetMesh?.meshUuid || targetMesh?.uuid || existing.meshUuid,
          meshName: targetMesh?.name || targetMesh?.meshName || existing.meshName
        };

        const nextHotspots = [...hotspots];
        nextHotspots[existingIndex] = updatedHs;
        setHotspots(nextHotspots);
        commitHistoryNow(buildSnapshot({ hotspots: nextHotspots }));
        toast.success(`Hotspot "${updatedHs.label}" updated`);

        setTimeout(() => {
          handleHotspotClick(updatedHs);
        }, 50);
      }
    } else {
      const pos = getMeshSurfacePosition(targetMesh?.meshUuid || targetMesh?.uuid, targetMesh?.clickPoint);
      const newHs = {
        id: `hs_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        label,
        description,
        color: color || "#5d5efc",
        position: pos,
        normal: clickNormalArr,
        meshUuid: targetMesh?.meshUuid || targetMesh?.uuid || "",
        meshName: targetMesh?.name || targetMesh?.meshName || "Mesh",
        createdAt: Date.now()
      };
      const nextHotspots = [...hotspots, newHs];
      setHotspots(nextHotspots);
      commitHistoryNow(buildSnapshot({ hotspots: nextHotspots }));
      toast.success(`Hotspot "${newHs.label}" added to "${newHs.meshName}"`);

      setTimeout(() => {
        handleHotspotClick(newHs);
      }, 50);
    }
    setShowHotspotModal(false);
    setEditingHotspot(null);
  }, [editingHotspot, hotspots, selectedMaterial, getMeshSurfacePosition, commitHistoryNow, buildSnapshot, toast, handleHotspotClick, setHotspots, setShowHotspotModal, setEditingHotspot]);

  const handleDeleteHotspot = useCallback((hotspotId) => {
    const nextHotspots = hotspots.filter(h => h.id !== hotspotId);
    setHotspots(nextHotspots);
    if (activeHotspotId === hotspotId) {
      setActiveHotspotId(null);
    }
    commitHistoryNow(buildSnapshot({ hotspots: nextHotspots }));
    toast.success("Hotspot deleted");
  }, [hotspots, activeHotspotId, setHotspots, setActiveHotspotId, commitHistoryNow, buildSnapshot, toast]);

  return {
    isPlacingHotspotRef,
    isHotspotFocusingRef,
    lastHotspotClickTimeRef,
    getMeshSurfacePosition,
    focusHotspot,
    handleHotspotClick,
    handleOpenAddHotspot,
    handleSaveHotspot,
    handleDeleteHotspot
  };
}
