// src/components/GalaxyMap.tsx
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as THREE from 'three';

/* ========= tipos ========= */
export type GalaxyNode = {
  id: string;
  name: string;
  color: string;
  size: number;
  systems?: number; // cantidad de sistemas (opcional)
};
type NodeWithPos = GalaxyNode & { position: [number, number, number] };

/* ========= utils ========= */
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
function layoutNodes(nodes: GalaxyNode[], radius = 8): NodeWithPos[] {
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

/* ========= fondo/estrellas/nebulosa ========= */
function makeStars(count: number, spread: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = spread * (0.7 + Math.random() * 0.6);
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return g;
}
function makeRadialAlphaTexture(size = 192) {
  const data = new Uint8Array(size * size);
  const cx = size / 2, cy = size / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy) / maxR;
      const a = Math.max(0, 1 - Math.pow(d, 1.6));
      data[y * size + x] = Math.floor(a * 255);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.AlphaFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}
function NebulaBillboards({ radius }: { radius: number }) {
  const alpha = useMemo(() => makeRadialAlphaTexture(224), []);
  const planes = useMemo(() => {
    const c1 = new THREE.Color('#16234d');
    const c2 = new THREE.Color('#1b1652');
    const c3 = new THREE.Color('#0e1b3c');
    return [
      { color: c1, scale: radius * 6.0, z: -radius * 0.7, opacity: 0.70 },
      { color: c2, scale: radius * 7.8, z: -radius * 1.15, opacity: 0.55 },
      { color: c3, scale: radius * 9.6, z: -radius * 1.7, opacity: 0.40 },
    ];
  }, [radius]);
  return (
    <group>
      {planes.map((p, i) => (
        <NebulaPlane key={i} color={p.color} scale={p.scale} z={p.z} opacity={p.opacity} alpha={alpha} />
      ))}
    </group>
  );
}
function NebulaPlane({ color, scale, z, opacity, alpha }:{
  color: THREE.Color; scale: number; z: number; opacity: number; alpha: THREE.DataTexture;
}) {
  const { camera } = useThree();
  const m = useRef<THREE.Mesh>(null!);
  useFrame((_s, dt) => {
    if (!m.current) return;
    m.current.quaternion.copy((camera as THREE.PerspectiveCamera).quaternion);
    m.current.rotation.z += dt * 0.02;
  });
  return (
    <mesh ref={m} position={[0, 0, z]} renderOrder={-10}>
      <planeGeometry args={[scale, scale, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} alphaMap={alpha} />
    </mesh>
  );
}
function Vignette({ radius }: { radius: number }) {
  const { camera } = useThree();
  const alpha = useMemo(() => makeRadialAlphaTexture(256), []);
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(() => { if (meshRef.current) meshRef.current.quaternion.copy((camera as THREE.PerspectiveCamera).quaternion); });
  return (
    <mesh ref={meshRef} position={[0, 0, -radius * 0.65]} renderOrder={20}>
      <planeGeometry args={[radius * 7, radius * 7]} />
      <meshBasicMaterial color={'black'} transparent opacity={0.25} alphaMap={alpha} depthWrite={false} />
    </mesh>
  );
}
function StarfieldLayers({ spread }: { spread: number }) {
  const g1 = useMemo(() => makeStars(2800, spread * 1.1), [spread]);
  const g2 = useMemo(() => makeStars(2000, spread * 1.7), [spread]);
  const g3 = useMemo(() => makeStars(1600, spread * 2.4), [spread]);
  const m1 = useRef<THREE.PointsMaterial>(null!);
  const m2 = useRef<THREE.PointsMaterial>(null!);
  const m3 = useRef<THREE.PointsMaterial>(null!);
  const r1 = useRef<THREE.Points>(null!);
  const r2 = useRef<THREE.Points>(null!);
  const r3 = useRef<THREE.Points>(null!);
  useFrame((_s, t) => {
    if (r1.current) r1.current.rotation.y += 0.002;
    if (r2.current) r2.current.rotation.y -= 0.0012;
    if (r3.current) r3.current.rotation.y += 0.0007;
    if (m1.current) m1.current.opacity = 0.95 + 0.15 * Math.sin(t * 0.9);
    if (m2.current) m2.current.opacity = 0.8 + 0.18 * Math.sin(t * 0.7 + 1.3);
    if (m3.current) m3.current.opacity = 0.7 + 0.18 * Math.sin(t * 0.6 + 2.1);
  });
  return (
    <group renderOrder={-5}>
      <points ref={r1}><primitive attach="geometry" object={g1} /><pointsMaterial ref={m1} color="#e7f0ff" size={0.07} sizeAttenuation transparent depthWrite={false} /></points>
      <points ref={r2}><primitive attach="geometry" object={g2} /><pointsMaterial ref={m2} color="#cddcff" size={0.09} sizeAttenuation transparent depthWrite={false} /></points>
      <points ref={r3}><primitive attach="geometry" object={g3} /><pointsMaterial ref={m3} color="#a9bfff" size={0.11} sizeAttenuation transparent depthWrite={false} /></points>
    </group>
  );
}
function ParallaxBackplate({ radius }: { radius: number }) {
  const { camera } = useThree();
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!g.current) return;
    g.current.position.x = -camera.position.x * 0.06;
    g.current.position.y = -camera.position.y * 0.04;
  });
  return (
    <group ref={g} position={[0, 0, -radius * 1.3]} renderOrder={-15}>
      <mesh><planeGeometry args={[radius * 10, radius * 10]} /><meshBasicMaterial color="#0a183a" transparent opacity={0.2} depthWrite={false} /></mesh>
      <mesh><planeGeometry args={[radius * 9, radius * 9]} /><meshBasicMaterial color="#0e1b4b" transparent opacity={0.13} depthWrite={false} /></mesh>
    </group>
  );
}

/* ========= nodos ========= */
function Halo({ color = '#22d3ee', radius = 0.5 }: { color?: string; radius?: number }) {
  return (
    <mesh rotation-x={Math.PI / 2}>
      <ringGeometry args={[radius * 1.15, radius * 1.32, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} />
    </mesh>
  );
}
function Moon({ color, r, speed = 1 }: { color: string; r: number; speed?: number }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_s, dt) => { if (g.current) g.current.rotation.y += dt * speed; });
  return (
    <group ref={g}>
      <mesh position={[r, 0, 0]}>
        <sphereGeometry args={[Math.max(0.08, r * 0.18), 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
function GalaxyDot({
  node, selected, onPress,
}: { node: NodeWithPos; selected?: boolean; onPress?: () => void }) {
  const ref = useRef<THREE.Mesh>(null!);
  const seed = hash32(node.id);
  const rand = mulberry32(seed);
  const baseR = node.size * 0.28;
  const moonOrbit = baseR * (1.5 + rand());
  const moonSpeed = 0.6 + rand() * 0.6;

  useFrame((_s, t) => {
    if (!ref.current) return;
    const k = selected ? 1.12 : 1.02;
    const s = 1 + Math.sin(t * 2 + seed) * 0.02;
    ref.current.scale.setScalar(k * s);
    ref.current.rotation.y += 0.15 * 0.016;
  });

  return (
    <group position={node.position}>
      <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.5}>
        <mesh ref={ref} onClick={onPress} castShadow receiveShadow>
          <sphereGeometry args={[baseR, 32, 32]} />
          <meshStandardMaterial color={node.color} roughness={0.35} metalness={0.15} />
        </mesh>
        <Halo color={node.color} radius={baseR} />
        <Moon color={node.color} r={moonOrbit} speed={moonSpeed} />
      </Float>
    </group>
  );
}
function CameraDrift() {
  const g = useRef<THREE.Group>(null!);
  useFrame((_s, dt) => { if (g.current) g.current.rotation.y += dt * 0.04; });
  return <group ref={g} />;
}

/* ========= shooting stars ========= */
type StarDesc = { id: number; pos: THREE.Vector3; vel: THREE.Vector3; ttl: number; color: string };
function StarInstance({ desc, onDone }: { desc: StarDesc; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Mesh>(null!);
  const trailRef = useRef<THREE.Mesh>(null!);
  const life = useRef(0);
  useFrame((_s, dt) => {
    life.current += dt;
    if (!ref.current || !trailRef.current || !headRef.current) return;
    desc.pos.addScaledVector(desc.vel, dt);
    ref.current.position.copy(desc.pos);
    const dir = desc.vel.clone().normalize();
    const lookAt = desc.pos.clone().add(dir);
    ref.current.lookAt(lookAt);
    const k = Math.max(0, 1 - life.current / desc.ttl);
    (trailRef.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * k;
    (headRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * k;
    const len = 0.9 + desc.vel.length() * 0.12;
    trailRef.current.scale.set(len, 1, 1);
    if (life.current > desc.ttl) onDone(desc.id);
  });
  return (
    <group ref={ref}>
      <mesh ref={trailRef} position={[-0.4, 0, 0]}>
        <planeGeometry args={[0.8, 0.04]} />
        <meshBasicMaterial color={desc.color} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={headRef}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={desc.color} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
function ShootingStars({ radius }: { radius: number }) {
  const [stars, setStars] = useState<StarDesc[]>([]);
  const nextSpawn = useRef(0);
  const idRef = useRef(1);
  const remove = useCallback((id: number) => setStars(s => s.filter(st => st.id !== id)), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (t >= nextSpawn.current) {
      nextSpawn.current = t + 3 + Math.random() * 3;
      const startX = (Math.random() * 2 - 1) * radius * 1.2;
      const startY = radius * (0.6 + Math.random() * 0.6);
      const startZ = -radius * (0.2 + Math.random() * 0.6);
      const speed = 6 + Math.random() * 6;
      const dir = new THREE.Vector3(-0.6 - Math.random() * 0.6, -0.5 - Math.random() * 0.5, 0.1 * (Math.random() * 2 - 1))
        .normalize().multiplyScalar(speed);
      const desc: StarDesc = {
        id: idRef.current++,
        pos: new THREE.Vector3(startX, startY, startZ),
        vel: dir,
        ttl: 1.8 + Math.random() * 1.2,
        color: ['#a6c8ff', '#ffd1a6', '#ffc2c2'][Math.floor(Math.random() * 3)],
      };
      setStars(s => (s.length > 2 ? [...s.slice(1), desc] : [...s, desc]));
    }
  });
  return <group renderOrder={5}>{stars.map(st => <StarInstance key={st.id} desc={st} onDone={remove} />)}</group>;
}

/* ========= proyector (dentro del Canvas) ========= */
type Projected = { x: number; y: number; visible: boolean } | null;

function TooltipProjector({
  target,
  onProject,
}: {
  target: THREE.Vector3 | null;
  onProject: (p: Projected) => void;
}) {
  const { camera, size } = useThree();
  useFrame(() => {
    if (!target) { onProject(null); return; }
    const v = target.clone().project(camera as THREE.Camera);
    const x = (v.x * 0.5 + 0.5) * size.width;
    const y = (1 - (v.y * 0.5 + 0.5)) * size.height;
    onProject({ x, y, visible: v.z < 1 });
  });
  return null;
}

/* ========= overlay nativo ========= */
function TooltipOverlay({
  pos,
  label,
  height,
}: {
  pos: Projected;
  label?: string;
  height: number;
}) {
  if (!pos || !pos.visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={{
        position: 'absolute',
        left: Math.max(8, pos.x + 10),
        top: Math.max(8, Math.min(pos.y - 18, height - 40)),
        backgroundColor: 'rgba(10,14,28,0.9)',
        borderColor: '#24304f',
        borderWidth: 1,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
      }}>
        <Text style={{ color: '#fff', fontWeight: '800' }} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/* ========= componente principal ========= */
export default function GalaxyMap({
  nodes,
  onSelect,
  radius = 8,
  height = 360,
}: {
  nodes: GalaxyNode[];
  onSelect?: (id: string) => void;
  radius?: number;
  height?: number;
}) {
  const layout = useMemo(() => layoutNodes(nodes, radius), [nodes, radius]);

  const [selected, setSelected] = useState<{
    id: string; pos: THREE.Vector3; label: string;
  } | null>(null);

  const [projected, setProjected] = useState<Projected>(null);

  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden' }}>
      {/* backdrop RN */}
      <LinearGradient
        colors={['#0b1226', '#0a1020', '#0a0f1b']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Canvas
        key={`galaxy-map-${nodes.length}`}
        shadows
        camera={{ position: [0, radius * 1.6, radius * 1.9], fov: 52, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: true }}
        style={{ backgroundColor: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          gl.toneMappingExposure = 1.05;
        }}
      >
        <ParallaxBackplate radius={radius} />
        <NebulaBillboards radius={radius} />
        <StarfieldLayers spread={radius * 6.5} />
        <Vignette radius={radius} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
        <directionalLight position={[-5, -6, -3]} intensity={0.35} />
        <CameraDrift />

        {layout.map((n) => (
          <GalaxyDot
            key={n.id}
            node={n}
            selected={selected?.id === n.id}
            onPress={() => {
              const world = new THREE.Vector3(...n.position);
              const systems = n.systems ?? 0;
              const label = `${n.name} · ${systems} sistema${systems === 1 ? '' : 's'}`;
              setSelected({ id: n.id, pos: world, label });
              onSelect?.(n.id);
            }}
          />
        ))}

        <ShootingStars radius={radius} />

        {/* Proyección a 2D para el overlay */}
        <TooltipProjector
          target={selected?.pos ?? null}
          onProject={setProjected}
        />

        <OrbitControls enablePan enableZoom enableRotate makeDefault />
      </Canvas>

      {/* Capa de tooltip por encima del Canvas */}
      <TooltipOverlay pos={projected} label={selected?.label} height={height} />
    </View>
  );
}