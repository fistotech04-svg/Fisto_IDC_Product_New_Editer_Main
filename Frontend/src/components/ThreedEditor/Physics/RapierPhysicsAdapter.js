// RapierPhysicsAdapter.js - Rapier 3D WASM / JS Physics Engine Driver for Three.js
import * as THREE from 'three';

export class RapierPhysicsAdapter {
    constructor(gravity = [0, -9.81, 0]) {
        this.gravity = gravity;
        this.bodies = new Map();
        this.world = null;
        this.initialized = false;
        this.RAPIER = null;
    }

    async init() {
        if (this.initialized) return;
        try {
            // Attempt WASM / Rapier3D import
            const RAPIER = await import('@dimforge/rapier3d-compat').catch(() => null);
            if (RAPIER) {
                await RAPIER.init();
                this.RAPIER = RAPIER;
                const grav = new RAPIER.Vector3(this.gravity[0], this.gravity[1], this.gravity[2]);
                this.world = new RAPIER.World(grav);
                this.initialized = true;
                return;
            }
        } catch (e) {
            console.warn("Rapier WASM module load fallback:", e);
        }

        // Fallback Step Simulator if Rapier WASM is pending
        this.createFallbackWorld();
        this.initialized = true;
    }

    createFallbackWorld() {
        this.world = {
            step: (dt) => {
                this.bodies.forEach(({ body, mesh }) => {
                    if (body.type === 'dynamic') {
                        body.velocity.y += this.gravity[1] * dt;
                        mesh.position.x += body.velocity.x * dt;
                        mesh.position.y += body.velocity.y * dt;
                        mesh.position.z += body.velocity.z * dt;

                        if (mesh.position.y <= 0) {
                            mesh.position.y = 0;
                            body.velocity.y = -body.velocity.y * (body.restitution || 0.3);
                        }
                    }
                });
            }
        };
    }

    setGravity(gravity) {
        this.gravity = gravity;
        if (this.RAPIER && this.world) {
            this.world.gravity = new this.RAPIER.Vector3(gravity[0], gravity[1], gravity[2]);
        }
    }

    addBody(mesh, options = {}) {
        if (!mesh) return;

        const {
            bodyType = 'dynamic',
            colliderShape = 'cuboid',
            mass = 1.0,
            friction = 0.5,
            restitution = 0.3
        } = options;

        const initialTransform = {
            position: mesh.position.clone(),
            quaternion: mesh.quaternion.clone(),
            scale: mesh.scale.clone()
        };

        if (this.RAPIER && this.world) {
            let rigidBodyDesc;
            if (bodyType === 'static') {
                rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed();
            } else if (bodyType === 'kinematic') {
                rigidBodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased();
            } else {
                rigidBodyDesc = this.RAPIER.RigidBodyDesc.dynamic();
            }

            rigidBodyDesc.setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
            rigidBodyDesc.setRotation(mesh.quaternion);

            const body = this.world.createRigidBody(rigidBodyDesc);

            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            let colliderDesc;
            if (colliderShape === 'sphere') {
                colliderDesc = this.RAPIER.ColliderDesc.ball(Math.max(size.x, size.y, size.z) / 2 || 0.5);
            } else if (colliderShape === 'cylinder') {
                colliderDesc = this.RAPIER.ColliderDesc.cylinder((size.y || 1) / 2, (size.x || 1) / 2);
            } else {
                colliderDesc = this.RAPIER.ColliderDesc.cuboid(size.x / 2 || 0.5, size.y / 2 || 0.5, size.z / 2 || 0.5);
            }

            colliderDesc.setFriction(friction);
            colliderDesc.setRestitution(restitution);
            colliderDesc.setMass(mass);

            this.world.createCollider(colliderDesc, body);
            this.bodies.set(mesh.uuid, { body, mesh, initialTransform, bodyType, restitution });
        } else {
            const body = {
                type: bodyType,
                velocity: new THREE.Vector3(0, 0, 0),
                restitution: restitution
            };
            this.bodies.set(mesh.uuid, { body, mesh, initialTransform, bodyType, restitution });
        }
    }

    step(dt = 1 / 60) {
        if (!this.world) return;

        if (this.RAPIER && this.world.step) {
            this.world.step();
            this.bodies.forEach(({ body, mesh }) => {
                if (body.isDynamic && body.isDynamic()) {
                    const translation = body.translation();
                    const rotation = body.rotation();
                    mesh.position.set(translation.x, translation.y, translation.z);
                    mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
                }
            });
        } else if (this.world.step) {
            this.world.step(dt);
        }
    }

    reset() {
        this.bodies.forEach(({ body, mesh, initialTransform }) => {
            mesh.position.copy(initialTransform.position);
            mesh.quaternion.copy(initialTransform.quaternion);
            mesh.scale.copy(initialTransform.scale);

            if (this.RAPIER && body) {
                body.setTranslation(initialTransform.position, true);
                body.setRotation(initialTransform.quaternion, true);
                body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                body.setAngvel({ x: 0, y: 0, z: 0 }, true);
            } else if (body && body.velocity) {
                body.velocity.set(0, 0, 0);
            }
        });
    }

    clear() {
        if (this.RAPIER && this.world) {
            this.bodies.forEach(({ body }) => {
                this.world.removeRigidBody(body);
            });
        }
        this.bodies.clear();
    }
}
