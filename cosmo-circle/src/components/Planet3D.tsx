import React, { useMemo, useRef, useState } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

export type Planet3DProps = {
  /** color base del planeta; si no viene usamos un azul */
  baseColor?: string;
  /** lista de lunas: color y radio de órbita */
  moons?: { color?: string; radius?: number }[];
  /** tamaño del viewport */
  height?: number;
  /** velocidad de auto-rotación */
  autoRotate?: boolean;
  /** intensidad (0-1) de las luces */
  intensity?: number;
};

function hexToThree(color?: string) {
  try {
    return new THREE.Color(color || '#5bd1f3');
  } catch {
    return new THREE.Color('#5bd1f3');
  }
}

function PlanetMesh({ baseColor = '#5bd1f3', rotateY = 0 }:{ baseColor?: string; rotateY: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.002 + rotateY; // leve rotate + delta manual de gesto
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color={hexToThree(baseColor)} metalness={0.15} roughness={0.6} />
    </mesh>
  );
}

function Moons({ list = [] as { color?: string; radius?: number }[] }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const radius = (child as any).userData.radius || (1.6 + i * 0.35);
      const speed = 0.4 + i * 0.1;
      child.position.x = Math.cos(t * speed + i) * radius;
      child.position.z = Math.sin(t * speed + i) * radius;
    });
  });

  return (
    <group ref={groupRef}>
      {list.map((m, i) => (
        <mesh key={i} userData={{ radius: m.radius ?? (1.6 + i * 0.35) }}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial color={hexToThree(m.color || '#cccccc')} metalness={0.1} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export default function Planet3D({
  baseColor,
  moons = [],
  height = 260,
  autoRotate = true,
  intensity = 0.95,
}: Planet3DProps) {
  // PanResponder para “rotar” con el dedo (simple: sólo eje Y)
  const [dragDelta, setDragDelta] = useState(0);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => setDragDelta(g.dx * 0.0008),
      onPanResponderRelease: () => setDragDelta(0),
    })
  ).current;

  return (
    <View style={{ height }} {...pan.panHandlers}>
      <Canvas
        frameloop="always"
        camera={{ position: [0, 0, 3.5], fov: 55 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 0); // transparente (para que se vea tu fondo cósmico)
        }}
      >
        {/* Luces */}
        <ambientLight intensity={0.3 * intensity} />
        <directionalLight position={[5, 5, 5]} intensity={0.8 * intensity} />
        <pointLight position={[-4, -2, -3]} intensity={0.6 * intensity} />

        {/* Planeta */}
        <PlanetMesh baseColor={baseColor} rotateY={autoRotate ? dragDelta : dragDelta + 0.002} />

        {/* Lunas */}
        <Moons list={moons} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});