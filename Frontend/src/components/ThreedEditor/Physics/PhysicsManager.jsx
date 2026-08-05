// PhysicsManager.jsx - Multi-engine R3F Physics Controller (Rapier, Cannon-es, Ammo.js)
import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CannonPhysicsAdapter } from './CannonPhysicsAdapter';
import { RapierPhysicsAdapter } from './RapierPhysicsAdapter';
import { AmmoPhysicsAdapter } from './AmmoPhysicsAdapter';

export default function PhysicsManager({
    physicsEngine = 'none', // 'rapier' | 'cannon' | 'ammo' | 'none'
    isSimulating = false,
    gravity = [0, -9.81, 0],
    bodyType = 'dynamic', // 'dynamic' | 'static' | 'kinematic'
    colliderShape = 'cuboid', // 'cuboid' | 'sphere' | 'cylinder' | 'trimesh'
    mass = 1.0,
    friction = 0.5,
    restitution = 0.3,
    resetTrigger = 0,
    sceneRef,
    children
}) {
    const adapterRef = useRef(null);
    const [engineReady, setEngineReady] = useState(false);

    // Initialize Physics Adapter when engine changes
    useEffect(() => {
        let isMounted = true;
        setEngineReady(false);

        if (adapterRef.current) {
            adapterRef.current.clear();
            adapterRef.current = null;
        }

        if (physicsEngine === 'none') return;

        const createAdapter = async () => {
            let adapter;
            if (physicsEngine === 'rapier') {
                adapter = new RapierPhysicsAdapter(gravity);
            } else if (physicsEngine === 'ammo') {
                adapter = new AmmoPhysicsAdapter(gravity);
            } else {
                // Default Cannon.js / Cannon-es
                adapter = new CannonPhysicsAdapter(gravity);
            }

            await adapter.init();

            if (isMounted) {
                adapterRef.current = adapter;
                setEngineReady(true);
            }
        };

        createAdapter();

        return () => {
            isMounted = false;
            if (adapterRef.current) {
                adapterRef.current.clear();
                adapterRef.current = null;
            }
        };
    }, [physicsEngine]);

    // Update Gravity
    useEffect(() => {
        if (adapterRef.current) {
            adapterRef.current.setGravity(gravity);
        }
    }, [gravity]);

    // Add Scene Meshes / Model Groups to Physics World
    useEffect(() => {
        if (!engineReady || !adapterRef.current || !sceneRef?.current) return;

        adapterRef.current.clear();

        const root = sceneRef.current;
        root.traverse((obj) => {
            if (obj.isMesh || (obj.isGroup && obj.name && obj.name !== 'Scene')) {
                adapterRef.current.addBody(obj, {
                    bodyType,
                    colliderShape,
                    mass,
                    friction,
                    restitution
                });
            }
        });
    }, [engineReady, sceneRef, bodyType, colliderShape, mass, friction, restitution]);

    // Reset Simulation Position & Velocity
    useEffect(() => {
        if (adapterRef.current && resetTrigger > 0) {
            adapterRef.current.reset();
        }
    }, [resetTrigger]);

    // Step physics world on every frame
    useFrame((_, delta) => {
        if (isSimulating && engineReady && adapterRef.current) {
            adapterRef.current.step(Math.min(delta, 0.1));
        }
    });

    return <>{children}</>;
}
