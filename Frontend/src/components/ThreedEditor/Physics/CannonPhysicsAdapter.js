// CannonPhysicsAdapter.js - Lightweight Cannon.js / Cannon-es Physics Engine Driver for Three.js
import * as THREE from 'three';

export class CannonPhysicsAdapter {
    constructor(gravity = [0, -9.81, 0]) {
        this.gravity = gravity;
        this.bodies = new Map(); // uuid -> { body, mesh, initialTransform }
        this.world = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        try {
            // Import CANNON dynamically or use global/fallback engine
            const CANNON = await import('cannon-es').catch(() => null);
            if (CANNON) {
                this.CANNON = CANNON;
                this.world = new CANNON.World();
                this.world.gravity.set(this.gravity[0], this.gravity[1], this.gravity[2]);
                this.world.broadphase = new CANNON.NaiveBroadphase();
                this.world.solver.iterations = 10;
                this.initialized = true;
                return;
            }
        } catch (e) {
            console.warn("Cannon-es module load fallback:", e);
        }

        // Custom JS Physics Simulation Fallback if module is pending
        this.createFallbackWorld();
        this.initialized = true;
    }

    createFallbackWorld() {
        this.world = {
            gravity: new THREE.Vector3(...this.gravity),
            step: (dt) => {
                this.bodies.forEach(({ body, mesh }) => {
                    if (body.type === 'dynamic') {
                        body.velocity.y += this.gravity[1] * dt;
                        mesh.position.x += body.velocity.x * dt;
                        mesh.position.y += body.velocity.y * dt;
                        mesh.position.z += body.velocity.z * dt;

                        // Simple Ground Collision (Y = 0)
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
        if (this.world && this.world.gravity) {
            if (this.world.gravity.set) {
                this.world.gravity.set(gravity[0], gravity[1], gravity[2]);
            } else {
                this.world.gravity.set(...gravity);
            }
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

        if (this.CANNON && this.world && this.world.addBody) {
            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            let shape;
            if (colliderShape === 'sphere') {
                const radius = Math.max(size.x, size.y, size.z) / 2;
                shape = new this.CANNON.Sphere(radius || 0.5);
            } else if (colliderShape === 'cylinder') {
                shape = new this.CANNON.Cylinder(size.x / 2 || 0.5, size.x / 2 || 0.5, size.y || 1, 16);
            } else {
                // Default Cuboid
                shape = new this.CANNON.Box(new this.CANNON.Vec3(size.x / 2 || 0.5, size.y / 2 || 0.5, size.z / 2 || 0.5));
            }

            const bodyMass = bodyType === 'static' ? 0 : mass;
            const body = new this.CANNON.Body({
                mass: bodyMass,
                shape: shape,
                material: new this.CANNON.Material({ friction, restitution })
            });

            body.position.copy(mesh.position);
            body.quaternion.copy(mesh.quaternion);

            this.world.addBody(body);
            this.bodies.set(mesh.uuid, { body, mesh, initialTransform, bodyType, restitution });
        } else {
            // Fallback body representation
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

        if (this.CANNON && this.world.step) {
            this.world.step(dt);
            this.bodies.forEach(({ body, mesh }) => {
                if (body.mass > 0) {
                    mesh.position.copy(body.position);
                    mesh.quaternion.copy(body.quaternion);
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

            if (body && body.position) {
                body.position.copy(initialTransform.position);
                body.quaternion.copy(initialTransform.quaternion);
                if (body.velocity) body.velocity.set(0, 0, 0);
                if (body.angularVelocity) body.angularVelocity.set(0, 0, 0);
            }
        });
    }

    clear() {
        if (this.world && this.CANNON) {
            this.bodies.forEach(({ body }) => {
                this.world.removeBody(body);
            });
        }
        this.bodies.clear();
    }
}
