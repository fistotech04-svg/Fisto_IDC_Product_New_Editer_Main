import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

/**
 * Hook to manage animation clip playback, synchronizing timeScale, and notifying parent.
 */
export function useModelAnimations({
    scene,
    animations,
    isAnimationPlaying,
    onHasAnimationsChange
}) {
    const mixerRef = useRef(null);
    const onHasAnimationsChangeRef = useRef(onHasAnimationsChange);
    useEffect(() => {
        onHasAnimationsChangeRef.current = onHasAnimationsChange;
    });

    const lastHasAnimRef = useRef(null);
    const notifyHasAnimations = useCallback((val) => {
        const boolVal = Boolean(val);
        if (lastHasAnimRef.current !== boolVal) {
            lastHasAnimRef.current = boolVal;
            onHasAnimationsChangeRef.current?.(boolVal);
        }
    }, []);

    // Reset animations state on unmount
    useEffect(() => {
        return () => {
            if (lastHasAnimRef.current) {
                lastHasAnimRef.current = false;
                onHasAnimationsChangeRef.current?.(false);
            }
        };
    }, []);

    useEffect(() => {
        if (!scene) {
            notifyHasAnimations(false);
            return;
        }

        // Stop any existing mixer
        if (mixerRef.current) {
            try {
                mixerRef.current.stopAllAction();
                mixerRef.current.uncacheRoot(scene);
            } catch (_) { }
            mixerRef.current = null;
        }

        // Collect all AnimationClips from every possible source
        const allClips = [];
        const seen = new Set();
        const add = (c) => {
            if (!c || !Array.isArray(c.tracks) || c.tracks.length === 0) return;
            const id = c.uuid || c.name || Math.random().toString();
            if (seen.has(id)) return;
            seen.add(id);
            allClips.push(c);
        };

        // 1. Directly passed animations prop
        if (Array.isArray(animations)) animations.forEach(add);
        // 2. Animations stored on the scene root (set by GLBModel / FBXModel)
        if (Array.isArray(scene.animations)) scene.animations.forEach(add);
        // 3. Animations stored on any child node
        scene.traverse(child => {
            if (Array.isArray(child.animations)) child.animations.forEach(add);
        });

        const hasClips = allClips.length > 0;
        notifyHasAnimations(hasClips);

        if (!hasClips) return;

        // Capture untouched local bind transforms for all hierarchy nodes before animations begin modifying them
        scene.traverse((child) => {
            if (!child.userData.__bindPos) {
                child.userData.__bindPos = [child.position.x, child.position.y, child.position.z];
                child.userData.__bindQuat = [child.quaternion.x, child.quaternion.y, child.quaternion.z, child.quaternion.w];
                child.userData.__bindScale = [child.scale.x, child.scale.y, child.scale.z];
            }
        });

        // Ensure all animated and skinned meshes never get culled when moving
        scene.traverse((child) => {
            if (child.isMesh || child.isSkinnedMesh) {
                child.frustumCulled = false;
            }
        });

        const mixer = new THREE.AnimationMixer(scene);
        mixer.timeScale = isAnimationPlaying ? 1 : 0;

        // Smart clip conflict filter:
        const targetedProperties = new Set();
        const clipsToPlay = [];

        for (const clip of allClips) {
            let hasConflict = false;
            const currentClipProps = new Set();
            for (const track of clip.tracks) {
                const propKey = track.name;
                if (targetedProperties.has(propKey)) {
                    hasConflict = true;
                    break;
                }
                currentClipProps.add(propKey);
            }

            if (clipsToPlay.length === 0 || !hasConflict) {
                clipsToPlay.push(clip);
                currentClipProps.forEach(p => targetedProperties.add(p));
            }
        }

        clipsToPlay.forEach(clip => {
            try {
                const action = mixer.clipAction(clip);
                action.reset();
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.clampWhenFinished = false;
                action.enabled = true;
                action.setEffectiveTimeScale(1);
                action.setEffectiveWeight(1);
                action.play();
            } catch (e) {
                console.warn("[GenericModel] Could not play animation clip:", clip.name, e);
            }
        });

        mixerRef.current = mixer;

        return () => {
            try {
                mixer.stopAllAction();
                mixer.uncacheRoot(scene);
            } catch (_) { }
            mixerRef.current = null;
        };
    }, [scene, animations, notifyHasAnimations]);

    // Sync mixer playback state dynamically when toggle changes
    useEffect(() => {
        if (mixerRef.current) {
            mixerRef.current.timeScale = isAnimationPlaying ? 1 : 0;
        }
    }, [isAnimationPlaying]);

    return {
        mixerRef
    };
}
