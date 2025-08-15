// src/components/GalaxyMap.tsx
import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei/native';
import * as THREE from 'three';

export type GalaxyNode = {
  id: string;
  name: string;
  color: string;
  size: number;
};
type NodeWithPos = GalaxyNode & { position: [number, number, number] };

function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function layoutNodes(nodes: GalaxyNode[], radius = 6): NodeWithPos[] {
  const N = Math.max(1, nodes.length);
  const golden = Math.PI * (3 - Math.sqrt(5));
  return nodes.map((n, i) => {
    const rnd = mulberry32(hash32(n.id));
    const y = 1 - (i / (N - 1 || 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = i * golden;
    const jitter = 0.35 * (rnd() - 0.5);
    const R = radius + jitter;
    const x = Math.cos(theta) * r * R;
    const z = Math.sin(theta) * r * R;
    return { ...n, position: [x, y * R, z] };
  });
}

/** ✅ Starfield seguro en RN: sin <bufferAttribute/> declarativo */
function Starfield({ count = 1500, spread = 60 }: { count?: number; spread?: number }) {
  const geom = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = spread * (0.75 + Math.random() * 0.25);
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [count, spread]);

  return (
    <points>
      <primitive attach="geometry" object={geom} />
      <pointsMaterial size={0.06} sizeAttenuation color="#bcd2ff" transparent opacity={0.8} />
    </points>
  );
}

function Nebula({ radius = 28 }: { radius?: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshBasicMaterial color="#0a0f1f" side={THREE.BackSide} transparent opacity={0.75} />
    </mesh>
  );
}
function Halo({ color = '#22d3ee', radius = 0.5 }: { color?: string; radius?: number }) {
  return (
    <mesh>
      <ringGeometry args={[radius * 1.18, radius * 1.28, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
}
function SphereNode({
  node, selected, onPress,
}: { node: NodeWithPos; selected?: boolean; onPress?: () => void; }) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hover, setHover] = useState(false);
  useFrame((_s, dt) => {
    if (!ref.current) return;
    const target = hover || selected ? 1.08 : 1.0;
    const s = ref.current.scale.x + (target - ref.current.scale.x) * Math.min(1, dt * 8);
    ref.current.scale.setScalar(s);
  });
  const baseRadius = node.size * 0.28;
  return (
    <group position={node.position}>
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh
          ref={ref}
          onClick={onPress}
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
          onPointerOut={() => setHover(false)}
          castShadow receiveShadow
        >
          <sphereGeometry args={[baseRadius, 32, 32]} />
          <meshStandardMaterial color={node.color} roughness={0.35} metalness={0.15} />
        </mesh>
        <group rotation-x={Math.PI / 2}>
          <Halo color={node.color} radius={baseRadius} />
        </group>
        <mesh position={[baseRadius * 1.7, 0, 0]}>
          <sphereGeometry args={[baseRadius * 0.12, 16, 16]} />
          <meshBasicMaterial color={node.color} />
        </mesh>
      </Float>
    </group>
  );
}
function CameraRig() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_state, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.05; });
  return <group ref={ref} />;
}

export default function GalaxyMap({
  nodes, onSelect, radius = 8, height = 360,
}: { nodes: GalaxyNode[]; onSelect?: (id: string) => void; radius?: number; height?: number; }) {
  const layout = useMemo(() => layoutNodes(nodes, radius), [nodes, radius]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden' }}>
      {/* 🔑 Fuerza remount si cambia el número de nodos (evita reconciliaciones raras) */}
      <Canvas
        key={`map-${nodes.length}`}
        shadows
        camera={{ position: [0, radius * 1.6, radius * 1.9], fov: 52, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
      >
        <Nebula radius={radius * 3.5} />
        <Starfield count={1600} spread={radius * 5} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
        <directionalLight position={[-5, -6, -3]} intensity={0.3} />

        <CameraRig />

        {layout.map((n) => (
          <SphereNode
            key={n.id}
            node={n}
            selected={selectedId === n.id}
            onPress={() => { setSelectedId(n.id); onSelect?.(n.id); }}
          />
        ))}

        <OrbitControls enablePan enableZoom enableRotate makeDefault />
      </Canvas>
    </View>
  );
}