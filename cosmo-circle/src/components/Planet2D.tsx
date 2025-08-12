import React from 'react';
import Svg, { Circle } from 'react-native-svg';

export type Planet2DProps = {
  baseColor?: string;
  moons?: { color?: string; radius?: number }[];
  height?: number;
};

export default function Planet2D({ baseColor = '#5bd1f3', moons = [], height = 200 }: Planet2DProps) {
  const size = height;
  const cx = size / 2;
  const cy = size / 2;
  const planetR = size * 0.26;

  return (
    <Svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* planeta */}
      <Circle cx={cx} cy={cy} r={planetR} fill={baseColor} opacity={0.9} />
      {/* lunas en órbitas concéntricas (estáticas en 2D) */}
      {moons.slice(0, 8).map((m, i) => {
        const r = planetR + 22 + i * 20;
        const angle = (Math.PI * 2 * i) / Math.max(moons.length, 1);
        const lx = cx + Math.cos(angle) * r;
        const ly = cy + Math.sin(angle) * r;
        return <Circle key={i} cx={lx} cy={ly} r={6} fill={m.color || '#ccc'} opacity={0.9} />;
      })}
    </Svg>
  );
}