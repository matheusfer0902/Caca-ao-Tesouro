import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function OceanFloor({ gridWidth, gridHeight }) {
  const ref = useRef();
  const size = Math.max(gridWidth, gridHeight) + 12;

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity = 0.75 + Math.sin(clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color="#06283d"
        transparent
        opacity={0.8}
        roughness={0.2}
        metalness={0.35}
      />
    </mesh>
  );
}
