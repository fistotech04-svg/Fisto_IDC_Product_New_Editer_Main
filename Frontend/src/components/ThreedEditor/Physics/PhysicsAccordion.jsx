// PhysicsAccordion.jsx - UI Controls for Rapier, Cannon-es, Ammo.js Physics Engine
import React from 'react';
import { Icon } from '@iconify/react';

export default function PhysicsAccordion({
    isOpen,
    onToggle,
    physicsEngine,
    setPhysicsEngine,
    isSimulating,
    setIsSimulating,
    gravity,
    setGravity,
    bodyType,
    setBodyType,
    colliderShape,
    setColliderShape,
    mass,
    setMass,
    friction,
    setFriction,
    restitution,
    setRestitution,
    onResetPhysics,
    onSpawnDemo
}) {
    return (
        <div className="bg-white rounded-[0.75vw] shadow-sm border border-gray-100 overflow-hidden mb-[0.75vw] transition-all duration-200 hover:shadow-md">
            {/* Header */}
            <div
                className={`flex items-center justify-between px-[1vw] py-[0.85vw] bg-white cursor-pointer select-none transition-colors duration-200 ${
                    isOpen ? 'border-b border-gray-100' : ''
                }`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-[0.75vw] text-gray-800 font-semibold text-[0.85vw]">
                    <Icon icon="solar:atom-bold" width="1.04vw" height="1.04vw" className="text-[#5d5efc]" />
                    <span>Physics & Dynamics</span>
                </div>
                <div className="flex items-center gap-[0.5vw]">
                    {physicsEngine !== 'none' && (
                        <span className="text-[0.6vw] font-bold px-[0.4vw] py-[0.15vw] rounded bg-indigo-50 text-[#5d5efc] uppercase">
                            {physicsEngine}
                        </span>
                    )}
                    <Icon
                        icon="heroicons:chevron-down"
                        className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        width="0.85vw"
                        height="0.85vw"
                    />
                </div>
            </div>

            {/* Accordion Content */}
            <div
                className={`bg-white transition-[max-height] duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="p-[0.75vw] space-y-[0.85vw]">
                    
                    {/* Physics Engine Selector */}
                    <div>
                        <label className="text-[0.68vw] font-medium text-gray-600 mb-[0.35vw] block">
                            Physics Engine
                        </label>
                        <select
                            value={physicsEngine}
                            onChange={(e) => setPhysicsEngine(e.target.value)}
                            className="w-full px-[0.6vw] py-[0.4vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.75vw] font-medium text-gray-700 focus:outline-none focus:border-[#5d5efc]"
                        >
                            <option value="none">Disabled (No Physics)</option>
                            <option value="rapier">Rapier 3D (WASM - Recommended)</option>
                            <option value="cannon">Cannon-es (Fast JS Engine)</option>
                            <option value="ammo">Ammo.js (Bullet Physics WASM)</option>
                        </select>
                    </div>

                    {/* Drop Test Demo Quick Spawn Button */}
                    <div>
                        <button
                            onClick={onSpawnDemo}
                            className="w-full py-[0.45vw] px-[0.75vw] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-[0.4vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.35vw] transition-colors"
                        >
                            <Icon icon="solar:box-minimalistic-bold" width="0.85vw" height="0.85vw" />
                            Spawn Drop Test Demo Shapes
                        </button>
                    </div>

                    {physicsEngine !== 'none' && (
                        <>
                            {/* Simulation Controls (Play / Pause / Reset) */}
                            <div className="flex items-center gap-[0.5vw]">
                                <button
                                    onClick={() => setIsSimulating(!isSimulating)}
                                    className={`flex-1 py-[0.45vw] px-[0.75vw] rounded-[0.4vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.35vw] transition-colors ${
                                        isSimulating
                                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                                            : 'bg-[#5d5efc] text-white hover:bg-[#4b4acf]'
                                    }`}
                                >
                                    <Icon
                                        icon={isSimulating ? 'solar:pause-bold' : 'solar:play-bold'}
                                        width="0.85vw"
                                        height="0.85vw"
                                    />
                                    {isSimulating ? 'Pause Simulation' : 'Start Simulation'}
                                </button>
                                <button
                                    onClick={onResetPhysics}
                                    className="py-[0.45vw] px-[0.6vw] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[0.4vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.25vw] transition-colors"
                                    title="Reset Positions"
                                >
                                    <Icon icon="ix:reset" width="0.85vw" height="0.85vw" />
                                    Reset
                                </button>
                            </div>

                            {/* Rigid Body Type */}
                            <div>
                                <label className="text-[0.68vw] font-medium text-gray-600 mb-[0.35vw] block">
                                    Rigid Body Type
                                </label>
                                <div className="grid grid-cols-3 gap-[0.35vw]">
                                    {['dynamic', 'static', 'kinematic'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setBodyType(type)}
                                            className={`py-[0.35vw] text-[0.65vw] font-semibold rounded-[0.35vw] capitalize border transition-all ${
                                                bodyType === type
                                                    ? 'bg-indigo-50 border-[#5d5efc] text-[#5d5efc]'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Collider Shape */}
                            <div>
                                <label className="text-[0.68vw] font-medium text-gray-600 mb-[0.35vw] block">
                                    Collider Geometry
                                </label>
                                <select
                                    value={colliderShape}
                                    onChange={(e) => setColliderShape(e.target.value)}
                                    className="w-full px-[0.6vw] py-[0.4vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.75vw] font-medium text-gray-700 focus:outline-none focus:border-[#5d5efc]"
                                >
                                    <option value="cuboid">Cuboid (Bounding Box)</option>
                                    <option value="sphere">Sphere</option>
                                    <option value="cylinder">Cylinder</option>
                                    <option value="trimesh">Trimesh (Complex Mesh)</option>
                                </select>
                            </div>

                            {/* Gravity Y Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-[0.25vw]">
                                    <span className="text-[0.68vw] font-medium text-gray-600">Gravity Y (m/s²)</span>
                                    <span className="text-[0.65vw] font-mono font-semibold text-gray-800">{gravity[1]}</span>
                                </div>
                                <input
                                    type="range"
                                    min="-30"
                                    max="10"
                                    step="0.5"
                                    value={gravity[1]}
                                    onChange={(e) => setGravity([gravity[0], parseFloat(e.target.value), gravity[2]])}
                                    className="w-full accent-[#5d5efc] h-[0.3vw] cursor-pointer"
                                />
                            </div>

                            {/* Mass Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-[0.25vw]">
                                    <span className="text-[0.68vw] font-medium text-gray-600">Mass (kg)</span>
                                    <span className="text-[0.65vw] font-mono font-semibold text-gray-800">{mass}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="50"
                                    step="0.5"
                                    value={mass}
                                    onChange={(e) => setMass(parseFloat(e.target.value))}
                                    className="w-full accent-[#5d5efc] h-[0.3vw] cursor-pointer"
                                />
                            </div>

                            {/* Friction Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-[0.25vw]">
                                    <span className="text-[0.68vw] font-medium text-gray-600">Friction</span>
                                    <span className="text-[0.65vw] font-mono font-semibold text-gray-800">{Math.round(friction * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={friction}
                                    onChange={(e) => setFriction(parseFloat(e.target.value))}
                                    className="w-full accent-[#5d5efc] h-[0.3vw] cursor-pointer"
                                />
                            </div>

                            {/* Bounciness / Restitution Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-[0.25vw]">
                                    <span className="text-[0.68vw] font-medium text-gray-600">Bounciness (Restitution)</span>
                                    <span className="text-[0.65vw] font-mono font-semibold text-gray-800">{Math.round(restitution * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={restitution}
                                    onChange={(e) => setRestitution(parseFloat(e.target.value))}
                                    className="w-full accent-[#5d5efc] h-[0.3vw] cursor-pointer"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
