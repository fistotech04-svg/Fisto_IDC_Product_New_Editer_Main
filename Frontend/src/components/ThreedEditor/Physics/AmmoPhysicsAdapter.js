// AmmoPhysicsAdapter.js - Ammo.js (Bullet Physics WASM Port) Driver for Three.js
import * as THREE from 'three';

export class AmmoPhysicsAdapter {
    constructor(gravity = [0, -9.81, 0]) {
        this.gravity = gravity;
        this.bodies = new Map();
        this.world = null;
        this.initialized = false;
        this.Ammo = null;
    }

    async init() {
        if (this.initialized) return;
        try {
            // Attempt Ammo.js WASM load or window.Ammo check
            let AmmoModule = window.Ammo;
            if (!AmmoModule) {
                const ammoImport = await import('ammo.js').catch(() => null);
                if (ammoImport) AmmoModule = ammoImport.default || ammoImport;
            }

            if (AmmoModule) {
                this.Ammo = typeof AmmoModule === 'function' ? await AmmoModule() : AmmoModule;
                
                const collisionConfiguration = new this.Ammo.btDefaultCollisionConfiguration();
                const dispatcher = new this.Ammo.btCollisionDispatcher(collisionConfiguration);
                const overlappingPairCache = new this.Ammo.btDbvtBroadphase();
                const solver = new this.Ammo.btSequentialImpulseConstraintSolver();

                this.world = new this.Ammo.btDiscreteDynamicsWorld(
                    dispatcher,
                    overlappingPairCache,
                    solver,
                    collisionConfiguration
                );

                this.world.setGravity(new this.Ammo.btVector3(this.gravity[0], this.gravity[1], this.gravity[2]));
                this.initialized = true;
                return;
            }
        } catch (e) {
            console.warn("Ammo.js module load fallback:", e);
        }

        // Custom JS Physics Fallback
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
        if (this.Ammo && this.world && this.world.setGravity) {
            this.world.setGravity(new this.Ammo.btVector3(gravity[0], gravity[1], gravity[2]));
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

        if (this.Ammo && this.world && this.world.addRigidBody) {
            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            let shape;
            if (colliderShape === 'sphere') {
                shape = new this.Ammo.btSphereShape(Math.max(size.x, size.y, size.z) / 2 || 0.5);
            } else if (colliderShape === 'cylinder') {
                shape = new this.Ammo.btCylinderShape(new this.Ammo.btVector3(size.x / 2 || 0.5, size.y / 2 || 0.5, size.z / 2 || 0.5));
            } else {
                shape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(size.x / 2 || 0.5, size.y / 2 || 0.5, size.z / 2 || 0.5));
            }

            const transform = new this.Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new this.Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
            transform.setRotation(new this.Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w));

            const motionState = new this.Ammo.btDefaultMotionState(transform);

            const localInertia = new this.Ammo.btVector3(0, 0, 0);
            const bodyMass = bodyType === 'static' ? 0 : mass;
            if (bodyMass > 0) {
                shape.calculateLocalInertia(bodyMass, localInertia);
            }

            const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(bodyMass, motionState, shape, localInertia);
            const body = new this.Ammo.btRigidBody(rbInfo);

            body.setFriction(friction);
            body.setRestitution(restitution);

            this.world.addRigidBody(body);
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

        if (this.Ammo && this.world.stepSimulation) {
            this.world.stepSimulation(dt, 10);
            
            const transform = new this.Ammo.btTransform();
            this.bodies.forEach(({ body, mesh }) => {
                if (body.getMotionState) {
                    body.getMotionState().getWorldTransform(transform);
                    const origin = transform.getOrigin();
                    const rotation = transform.getRotation();

                    mesh.position.set(origin.x(), origin.y(), origin.z());
                    mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
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

            if (this.Ammo && body && body.getMotionState) {
                const transform = new this.Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new this.Ammo.btVector3(initialTransform.position.x, initialTransform.position.y, initialTransform.position.z));
                transform.setRotation(new this.Ammo.btQuaternion(initialTransform.quaternion.x, initialTransform.quaternion.y, initialTransform.quaternion.z, initialTransform.quaternion.w));
                
                body.getMotionState().setWorldTransform(transform);
                body.setCenterOfMassTransform(transform);
                
                const zeroVec = new this.Ammo.btVector3(0, 0, 0);
                body.setLinearVelocity(zeroVec);
                body.setAngularVelocity(zeroVec);
                body.activate();
            } else if (body && body.velocity) {
                body.velocity.set(0, 0, 0);
            }
        });
    }

    clear() {
        if (this.Ammo && this.world) {
            this.bodies.forEach(({ body }) => {
                this.world.removeRigidBody(body);
            });
        }
        this.bodies.clear();
    }
}
