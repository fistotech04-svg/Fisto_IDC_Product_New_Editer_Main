import React, { Suspense } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { TransformControls, Environment } from "@react-three/drei";
import { DirectionalSunLight, SceneEnvironmentController } from "./SceneEnvironmentController";
import RenderModel from "./ModelLoaders";
import FloorRenderer from "./FloorRenderer";
import SmoothOrbitControls from "./SmoothOrbitControls";
import AnimatedGizmo from "./AnimatedGizmo";
import Hotspot3DOverlay from "./Hotspot3DOverlay";
import { builtInHdris } from "../../../data/hdriData";

export default function ThreedCanvasViewport({
  models,
  isPlacingHotspot,
  navMode,
  isSyncing,
  handleCanvasPointerDown,
  handlePointerMissed,
  glInstanceRef,
  cameraInstanceRef,
  sceneInstanceRef,
  isCapturing,
  materialSettings,
  sceneWrapperRef,
  modelRef,
  modelRefs,
  settings,
  xrayMode,
  xrayMaterials,
  handleSetModelStats,
  handleSetMaterialList,
  selectedMaterial,
  handleSelectMaterial,
  hotspots,
  activeHotspotId,
  transformMode,
  rootTransform,
  transformValues,
  meshTransformsState,
  customizedMaterials,
  hiddenMaterials,
  deletedMaterials,
  handleMaterialSync,
  selectedTexture,
  resetKey,
  sceneResetTrigger,
  uvUnwrapTrigger,
  handleTextureApplied,
  handleTextureIdentified,
  handleTransformStart,
  handleTransformEnd,
  handleTransformChange,
  handleModelReady,
  handleModelProgress,
  isAnimationPlaying,
  handleHasAnimationsChange,
  showGridLines,
  showAxis,
  lastHotspotClickTimeRef,
  isHotspotFocusingRef,
  canvasPointerDownPosRef,
  setSelectedMaterial,
  controlsRef,
  autoRotate,
  autoRotateSpeed,
  autoRotateAxis,
  autoRotateRange,
  handleControlsChange,
  isTextureOpen,
  showHotspotModal,
  handleHotspotClick,
  handleDeleteHotspot,
  setEditingHotspot,
  setShowHotspotModal,
  setIsPlacingHotspot,
  isPlacingHotspotRef,
  activeLeftTab = "model",
  cameraBgType = "transparent",
  cameraBgColor = "#F3F3F3"
}) {
  const rawX = materialSettings.lightPosition?.x ?? 10;
  const rawY = materialSettings.lightPosition?.y ?? 10;
  const rawZ = materialSettings.lightPosition?.z ?? 10;

  const sunX = Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawX;
  const sunY = Math.max(1.5, rawZ);
  const sunZ = -(Math.abs(rawX) < 0.001 && Math.abs(rawY) < 0.001 ? 0.01 : rawY);

  return (
    <div className={`flex-1 h-full w-full relative ${isPlacingHotspot ? "cursor-crosshair" : navMode === "pan" ? "cursor-grab active:cursor-grabbing" : ""}`}>
      {!isSyncing && (
        <Canvas
          camera={{ position: [2.0, 1.8, 2.7], fov: 45, near: 0.05, far: 1000 }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMissed={handlePointerMissed}
          dpr={[1, 1.5]}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
          shadows={{ type: THREE.PCFShadowMap }}
          onCreated={({ gl, camera, scene }) => {
            glInstanceRef.current = gl;
            cameraInstanceRef.current = camera;
            sceneInstanceRef.current = scene;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          {activeLeftTab !== "camera" && !isCapturing && (
            <color attach="background" args={['#1e2025']} />
          )}

          <ambientLight intensity={0.4 + (100 - (materialSettings.shadowDensity ?? materialSettings.shadow ?? 50)) / 250} />

          <DirectionalSunLight
            position={[sunX, sunY, sunZ]}
            specular={materialSettings.specular}
            softness={materialSettings.softness ?? materialSettings.shadowSoftness ?? 50}
            color={materialSettings.lightColor || "#ffffff"}
            intensity={materialSettings.lightIntensity ?? 100}
            shadowDensity={materialSettings.shadowDensity ?? materialSettings.shadow ?? 100}
          />

          <directionalLight
            position={[-sunX * 0.4, Math.max(sunY * 0.6, 4), -sunZ * 0.4]}
            intensity={0.35 * ((materialSettings.lightIntensity ?? 100) / 100)}
            color={materialSettings.lightColor || "#ffffff"}
            castShadow={false}
          />

          <Suspense fallback={null}>
            <group ref={sceneWrapperRef}>
              {models.map((model, index) => {
                const defaultOffset = index === 0
                  ? rootTransform
                  : { position: { x: (index % 2 === 1 ? 1 : -1) * Math.ceil(index / 2) * 3.5, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
                const modelRootTransform = model.transform || defaultOffset;
                return (
                  <RenderModel
                    key={model.id}
                    modelId={model.id}
                    ref={(r) => {
                      if (index === 0) modelRef.current = r;
                      if (r) modelRefs.current.set(model.id, r);
                      else modelRefs.current.delete(model.id);
                    }}
                    type={model.type}
                    url={model.url}
                    wireframe={settings.wireframe}
                    xrayMode={xrayMode}
                    xrayMaterials={xrayMaterials}
                    setModelStats={(stats) => handleSetModelStats(model.id, stats)}
                    setMaterialList={(list, dataMap) => handleSetMaterialList(model.id, list, dataMap)}
                    selectedMaterial={selectedMaterial}
                    onSelectMaterial={handleSelectMaterial}
                    activeHotspotMeshUuid={hotspots.find(h => h.id === activeHotspotId)?.meshUuid || null}
                    activeHotspotMeshName={hotspots.find(h => h.id === activeHotspotId)?.meshName || null}
                    modelName={model.name}
                    transformMode={transformMode}
                    rootTransform={modelRootTransform}
                    transformValues={transformValues}
                    meshTransforms={meshTransformsState}
                    materialSettings={materialSettings}
                    customizedMaterials={customizedMaterials}
                    hiddenMaterials={hiddenMaterials}
                    deletedMaterials={deletedMaterials}
                    onUpdateMaterialSetting={handleMaterialSync}
                    selectedTexture={selectedTexture}
                    resetKey={resetKey}
                    sceneResetTrigger={sceneResetTrigger}
                    uvUnwrapTrigger={uvUnwrapTrigger}
                    onTextureApplied={handleTextureApplied}
                    onTextureIdentified={handleTextureIdentified}
                    onTransformStart={handleTransformStart}
                    onTransformEnd={handleTransformEnd}
                    onTransformChange={handleTransformChange}
                    onModelReady={(bounds) => handleModelReady(model.id, bounds)}
                    onProgress={(pct, stage) => handleModelProgress(model.id, pct, stage)}
                    isAnimationPlaying={isAnimationPlaying}
                    onHasAnimationsChange={(hasAnim) => handleHasAnimationsChange(model.id, hasAnim)}
                  />
                );
              })}
            </group>

            {transformMode && (selectedMaterial?.name === "Scene") && (
              <TransformControls
                object={sceneWrapperRef.current}
                mode={transformMode}
                size={0.8}
                onMouseDown={handleTransformStart}
                onChange={() => {
                  if (handleTransformChange && sceneWrapperRef.current) {
                    handleTransformChange({
                      position: sceneWrapperRef.current.position,
                      rotation: sceneWrapperRef.current.rotation,
                      scale: sceneWrapperRef.current.scale
                    });
                  }
                }}
                onMouseUp={handleTransformEnd}
              />
            )}
          </Suspense>

          <FloorRenderer
            floorType={materialSettings?.floorType || (settings.base ? "solid" : "grid")}
            floorColor={materialSettings?.floorColor || settings.baseColor || "#1a1a20"}
            floorRoughness={materialSettings?.floorRoughness ?? 20}
            floorReflectivity={materialSettings?.floorReflectivity ?? 65}
            floorBlur={materialSettings?.floorBlur ?? 50}
            showGridLines={showGridLines}
            showAxis={showAxis}
            shadowDensity={materialSettings?.shadowDensity ?? materialSettings?.shadow ?? 100}
            isCapturing={isCapturing}
            activeLeftTab={activeLeftTab}
            onFloorClick={(e) => {
              if (e.intersections && e.intersections.length > 0 && e.intersections[0].object !== e.object) {
                return;
              }
              if (canvasPointerDownPosRef.current) {
                const dx = Math.abs(e.clientX - canvasPointerDownPosRef.current.x);
                const dy = Math.abs(e.clientY - canvasPointerDownPosRef.current.y);
                if (dx > 6 || dy > 6) return;
              }
              if (Date.now() - lastHotspotClickTimeRef.current < 200) return;
              if (isHotspotFocusingRef.current) return;
              if (selectedMaterial) {
                setSelectedMaterial(null);
              }
            }}
          />

          <SmoothOrbitControls
            ref={controlsRef}
            sceneWrapperRef={sceneWrapperRef}
            autoRotate={autoRotate}
            autoRotateSpeed={(autoRotateSpeed || 1.0) * 2.0}
            autoRotateAxis={autoRotateAxis}
            autoRotateRange={autoRotateRange}
            dampingFactor={0.08}
            momentumFriction={0.95}
            rotateSpeed={1.0}
            minDistance={0.5}
            maxDistance={100}
            navMode={navMode}
            onChange={handleControlsChange}
          />

          {models.length > 0 && !isCapturing && (
            <AnimatedGizmo
              isTextureOpen={isTextureOpen}
              activeTab={activeLeftTab || "properties"}
            />
          )}

          {models.length > 0 && !isCapturing && !showHotspotModal && (
            <Hotspot3DOverlay
              hotspots={hotspots}
              activeHotspotId={activeHotspotId}
              onHotspotClick={handleHotspotClick}
              onDeleteHotspot={handleDeleteHotspot}
              onEditHotspot={(hs) => {
                setEditingHotspot(hs);
                setShowHotspotModal(true);
              }}
              sceneWrapperRef={sceneWrapperRef}
            />
          )}

          <Suspense fallback={null}>
            <Environment
              files={
                materialSettings?.environment?.startsWith('builtin_')
                  ? (builtInHdris.find(h => `builtin_${h.id}` === materialSettings?.environment || h.aliases?.some(a => `builtin_${a}` === materialSettings?.environment))?.file || null)
                  : (materialSettings?.environment?.startsWith('custom_') || (!materialSettings?.environment && (materialSettings?.customEnvMap || materialSettings?.maps?.envMap)))
                    ? (materialSettings?.customEnvMap || materialSettings?.maps?.envMap || null)
                    : null
              }
              preset={
                (materialSettings?.environment?.startsWith('builtin_') || materialSettings?.environment?.startsWith('custom_') || (!materialSettings?.environment && (materialSettings?.customEnvMap || materialSettings?.maps?.envMap)))
                  ? null
                  : (materialSettings?.environment || 'studio')
              }
              background={!isCapturing && activeLeftTab !== "camera"}
              blur={(materialSettings?.worldBlur ?? 0) / 100}
              environmentIntensity={(materialSettings?.reflection ?? 50) <= 50 ? ((materialSettings?.reflection ?? 50) / 50) : 1.0 + (((materialSettings?.reflection ?? 50) - 50) / 50) * 2.0}
            />
            <SceneEnvironmentController
              envRotation={materialSettings?.envRotation || 0}
              worldOpacity={materialSettings?.worldOpacity ?? 0}
              worldBlur={materialSettings?.worldBlur ?? 0}
              reflection={materialSettings?.reflection ?? 50}
              isCapturing={isCapturing}
              isCameraTab={activeLeftTab === "camera"}
              customBgColor={null}
            />
          </Suspense>
        </Canvas>
      )}

      {isPlacingHotspot && (
        <div className="absolute top-[1.2vw] left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-[0.7vw] bg-neutral-900/90 backdrop-blur-md px-[1.2vw] py-[0.55vw] rounded-full shadow-2xl border border-indigo-500/50 text-white text-[0.8vw]">
            <span className="relative flex h-[0.7vw] w-[0.7vw]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-[0.7vw] w-[0.7vw] bg-indigo-500"></span>
            </span>
            <span className="font-semibold text-white/95">Click anywhere on model to place hotspot pin</span>
            <button
              type="button"
              onClick={() => {
                setIsPlacingHotspot(false);
                if (isPlacingHotspotRef) isPlacingHotspotRef.current = false;
              }}
              className="ml-[0.3vw] px-[0.6vw] py-[0.2vw] rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[0.72vw] font-medium transition-colors cursor-pointer"
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
