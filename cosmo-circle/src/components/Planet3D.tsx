import React, { useMemo, useRef, useState } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';

/** Tipos */
export type MoonData = {
  color?: string;
  radius?: number;     // radio de la órbita (desde el centro)
  label?: string;      // texto para tooltip
};

export type Planet3DProps = {
  baseColor?: string;          // color base del planeta
  moons?: MoonData[];          // lunas con color/radio/label
  height?: number;             // alto del canvas
  autoRotate?: boolean;        // auto-rotación
  intensity?: number;          // intensidad de luces
  closenessLevel?: 0 | 1 | 2 | 3; // # de anillos (ej. “amistad cercana”)
  showRings?: boolean;         // mostrar anillos
  showOrbits?: boolean;        // mostrar órbitas de lunas
  procedural?: boolean;        // usar shader procedural
  onMoonPress?: (moon: MoonData, index: number) => void; // callback tooltip
};

/** Utils */
function hexToThree(color?: string) {
  try {
    return new THREE.Color(color || '#5bd1f3');
  } catch {
    return new THREE.Color('#5bd1f3');
  }
}

/** ==== SHADER MATERIAL (ruido Perlin simple) ==== */
const PlanetShaderMaterial = {
  uniforms: {
    u_time:   { value: 0 },
    u_color:  { value: new THREE.Color('#5bd1f3') },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vNormal = normal;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  // Ruido Perlin 2D (versión compacta)
  fragmentShader: `
    precision highp float;
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float u_time;
    uniform vec3  u_color;

    // hash y noise (versión compacta)
    vec2 hash(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
      return fract(sin(p)*43758.5453); }
    float noise(in vec2 p){
      const float K1 = 0.366025404; // (sqrt(3)-1)/2
      const float K2 = 0.211324865; // (3-sqrt(3))/6
      vec2 i = floor(p + (p.x+p.y)*K1);
      vec2 a = p - i + (i.x+i.y)*K2;
      vec2 o = (a.x>a.y) ? vec2(1.0,0.0):vec2(0.0,1.0);
      vec2 b = a - o + K2;
      vec2 c = a - 1.0 + 2.0*K2;
      vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
      vec3 n = h*h*h*h*vec3(dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
      return dot(n, vec3(70.0));
    }

    void main() {
      // mapa “spherical-ish”
      vec2 uv = vUv * 4.0; // escala del ruido
      float n = 0.0;
      float t = u_time * 0.08;

      // fractal noise
      float amp = 0.55;
      float freq = 1.0;
      for(int i=0; i<4; i++){
        n += noise(uv*freq + vec2(t, -t)) * amp;
        amp *= 0.55;
        freq *= 2.0;
      }

      // Normal-lighting fake: realzamos bordes con normal
      float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 1.2);

      // agua-tierra: threshold
      float mask = smoothstep(0.35, 0.65, n);
      vec3 sea  = vec3(0.08, 0.25, 0.45); // azul profundo
      vec3 land = u_color;                // usa color base como “continente”

      vec3 base = mix(sea, land, mask);
      base += rim*0.07;

      gl_FragColor = vec4(base, 1.0);
    }
  `,
};

/** ==== PLANETA ==== */
function PlanetMesh({
  baseColor = '#5bd1f3',
  rotateY = 0,
  procedural = true,
}: { baseColor?: string; rotateY: number; procedural?: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += 0.8 * delta + rotateY; // suave + gesto
    }
    if (procedural && matRef.current) {
      (matRef.current.uniforms as any).u_time.value += delta;
    }
  });

  if (procedural) {
    return (
      <mesh ref={ref} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        {/* Shader */}
        <shaderMaterial
          ref={matRef}
          uniforms={THREE.UniformsUtils.clone(PlanetShaderMaterial.uniforms)}
          vertexShader={PlanetShaderMaterial.vertexShader}
          fragmentShader={PlanetShaderMaterial.fragmentShader}
          transparent={false}
          depthWrite
          depthTest
        />
        {/* set color uniform una sola vez */}
        <primitive
          object={{}}
          attach={undefined}
          onUpdate={() => {
            if (matRef.current) {
              (matRef.current.uniforms as any).u_color.value = hexToThree(baseColor);
            }
          }}
        />
      </mesh>
    );
  }

  // fallback: material estándar si procedural = false
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color={hexToThree(baseColor)} metalness={0.15} roughness={0.6} />
    </mesh>
  );
}

/** ==== ÓRBITAS (líneas) ==== */
function OrbitCircle({ radius = 1.6, segments = 128, color = '#7a86b9', width = 0.6 }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius, segments]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  return (
    <line>
      <bufferGeometry attach="geometry" {...(geo as any)} />
      <lineBasicMaterial attach="material" color={color} linewidth={width} transparent opacity={0.35} />
    </line>
  );
}

/** ==== LUNAS ==== */
function Moons({
  list = [],
  showOrbits = true,
  onMoonPress,
}: {
  list: MoonData[];
  showOrbits: boolean;
  onMoonPress?: (moon: MoonData, index: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const radius = (child as any).userData.radius || (1.6 + i * 0.35);
      const speed = 0.4 + i * 0.12;
      child.position.x = Math.cos(t * speed + i) * radius;
      child.position.z = Math.sin(t * speed + i) * radius;
    });
  });

  return (
    <group ref={groupRef}>
      {list.map((m, i) => {
        const r = m.radius ?? (1.6 + i * 0.35);
        return (
          <group key={i}>
            {showOrbits && <OrbitCircle radius={r} />}
            <mesh
              userData={{ radius: r, data: m, index: i }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onMoonPress?.(m, i);
              }}
            >
              <sphereGeometry args={[0.12, 24, 24]} />
              <meshStandardMaterial color={hexToThree(m.color || '#cccccc')} metalness={0.1} roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** ==== ANILLOS (tipo Saturno) ==== */
function Rings({ count = 0, baseColor = '#a8b0d9' }: { count?: number; baseColor?: string }) {
  if (!count) return null;

  const items = new Array(count).fill(0);
  return (
    <group rotation={[Math.PI * 0.5 - 0.15, 0, 0]}>
      {items.map((_, i) => {
        const inner = 1.2 + i * 0.08;
        const outer = inner + 0.06;
        const opacity = 0.35 - i * 0.06;
        return (
          <mesh key={i}>
            <ringGeometry args={[inner, outer, 128]} />
            <meshBasicMaterial
              color={baseColor}
              transparent
              opacity={Math.max(0.08, opacity)}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** ==== MAIN ==== */
export default function Planet3D({
  baseColor,
  moons = [],
  height = 260,
  autoRotate = true,
  intensity = 0.95,
  closenessLevel = 0,
  showRings = true,
  showOrbits = true,
  procedural = true,
  onMoonPress,
}: Planet3DProps) {
  // Gestos: arrastra para “empujar” la rotación en Y
  const [dragDelta, setDragDelta] = useState(0);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => setDragDelta(g.dx * 0.001),
      onPanResponderRelease: () => setDragDelta(0),
    })
  ).current;

  return (
    <View style={{ height }} {...pan.panHandlers}>
      <Canvas
        frameloop="always"
        camera={{ position: [0, 0, 3.6], fov: 55 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 0); // transparente
        }}
      >
        {/* Luces */}
        <ambientLight intensity={0.3 * intensity} />
        <directionalLight position={[5, 5, 5]} intensity={0.8 * intensity} />
        <pointLight position={[-4, -2, -3]} intensity={0.6 * intensity} />

        {/* Planeta */}
        <PlanetMesh
          baseColor={baseColor}
          procedural={procedural}
          rotateY={autoRotate ? dragDelta : dragDelta + 0.002}
        />

        {/* Anillos (según “closenessLevel”) */}
        {showRings && closenessLevel > 0 && (
          <Rings count={closenessLevel} baseColor={baseColor ?? '#a8b0d9'} />
        )}

        {/* Lunas + órbitas */}
        <Moons list={moons} showOrbits={showOrbits} onMoonPress={onMoonPress} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});