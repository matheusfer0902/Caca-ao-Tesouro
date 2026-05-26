import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationSlice } from '@/context/SimulationSliceContext.jsx';
import {
  pointToWorld,
  gridToWorld,
  getPlatformY,
  interpolateShipWorld,
} from '@/utils/tileVisuals.js';
import {
  CELL_TYPES,
  GAME_PHASES,
  TILE_RADIUS,
  PLATFORM_THICKNESS,
} from '@/utils/constants.js';
import { getDepthLinks } from '@/algorithms/graph.js';

function PirateShip() {
  const group = useRef();
  const mainSailRef = useRef();
  const jibSailRef = useRef();
  const flagRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.rotation.z = Math.sin(t * 1.8) * 0.05;
      group.current.rotation.x = Math.sin(t * 1.3) * 0.025;
      group.current.position.y = 0.12 + Math.sin(t * 2.2) * 0.05;
    }
    if (mainSailRef.current) {
      mainSailRef.current.rotation.y = Math.sin(t * 1.5) * 0.08;
    }
    if (jibSailRef.current) {
      jibSailRef.current.rotation.y = Math.sin(t * 1.5 + 0.6) * 0.1;
    }
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(t * 3) * 0.35;
    }
  });

  const hullColor = '#4a2a14';
  const hullTrim = '#7a4a23';
  const deckColor = '#a06a3a';
  const sailColor = '#f4ead2';
  const ironColor = '#2a2a2a';
  const goldColor = '#d4a017';

  return (
    <group ref={group} position={[0, 0.18, 0]} scale={1.15}>
      {/* Hull bottom (rounded keel) */}
      <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.52, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={hullColor} roughness={0.75} />
      </mesh>
      {/* Hull main body (port + starboard plank look) */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.5, 0.16, 0.26]} />
        <meshStandardMaterial color={hullColor} roughness={0.8} />
      </mesh>
      {/* Bow taper */}
      <mesh position={[0.27, 0.04, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.13, 0.18, 4, 1, false, Math.PI / 4]} />
        <meshStandardMaterial color={hullColor} roughness={0.8} />
      </mesh>
      {/* Stern taper */}
      <mesh position={[-0.27, 0.04, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.13, 0.16, 4, 1, false, Math.PI / 4]} />
        <meshStandardMaterial color={hullColor} roughness={0.8} />
      </mesh>
      {/* Gold trim band along hull */}
      <mesh position={[0, 0.11, 0.131]}>
        <boxGeometry args={[0.46, 0.025, 0.005]} />
        <meshStandardMaterial color={goldColor} metalness={0.7} roughness={0.3} emissive={goldColor} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.11, -0.131]}>
        <boxGeometry args={[0.46, 0.025, 0.005]} />
        <meshStandardMaterial color={goldColor} metalness={0.7} roughness={0.3} emissive={goldColor} emissiveIntensity={0.2} />
      </mesh>
      {/* Cannon ports */}
      {[-0.15, 0, 0.15].map((x) => (
        <group key={`port-${x}`}>
          <mesh position={[x, 0.04, 0.132]}>
            <circleGeometry args={[0.018, 12]} />
            <meshStandardMaterial color={ironColor} />
          </mesh>
          <mesh position={[x, 0.04, -0.132]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.018, 12]} />
            <meshStandardMaterial color={ironColor} />
          </mesh>
        </group>
      ))}
      {/* Deck */}
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.48, 0.02, 0.24]} />
        <meshStandardMaterial color={deckColor} roughness={0.7} />
      </mesh>
      {/* Stern castle (raised aft deck) */}
      <mesh position={[-0.18, 0.18, 0]}>
        <boxGeometry args={[0.14, 0.1, 0.22]} />
        <meshStandardMaterial color={hullTrim} roughness={0.75} />
      </mesh>
      {/* Stern lantern */}
      <mesh position={[-0.27, 0.26, 0]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshStandardMaterial color="#ffd47a" emissive="#ffaa33" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[-0.27, 0.26, 0]} color="#ffaa33" intensity={0.3} distance={1.2} />
      {/* Bowsprit (forward pole) */}
      <mesh position={[0.32, 0.13, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.015, 0.02, 0.2, 6]} />
        <meshStandardMaterial color={hullTrim} roughness={0.6} />
      </mesh>
      {/* Main mast */}
      <mesh position={[0.02, 0.42, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.6, 8]} />
        <meshStandardMaterial color={hullTrim} roughness={0.6} />
      </mesh>
      {/* Crow's nest */}
      <mesh position={[0.02, 0.62, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.04, 10]} />
        <meshStandardMaterial color={hullTrim} roughness={0.7} />
      </mesh>
      {/* Main yard (cross beam) */}
      <mesh position={[0.02, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.4, 6]} />
        <meshStandardMaterial color={hullTrim} />
      </mesh>
      {/* Main sail */}
      <group ref={mainSailRef} position={[0.02, 0.36, 0]}>
        <mesh>
          <planeGeometry args={[0.38, 0.32, 8, 6]} />
          <meshStandardMaterial
            color={sailColor}
            side={THREE.DoubleSide}
            roughness={0.85}
            emissive="#3a3020"
            emissiveIntensity={0.1}
          />
        </mesh>
        {/* Sail stripe */}
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[0.38, 0.04]} />
          <meshStandardMaterial color="#b22020" side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
      </group>
      {/* Jib (front sail) — attached from mast to bowsprit */}
      <group ref={jibSailRef} position={[0.22, 0.35, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh rotation={[0, 0, -0.25]}>
          <planeGeometry args={[0.22, 0.28]} />
          <meshStandardMaterial color={sailColor} side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
      </group>
      {/* Flag pole tip + pirate flag */}
      <group ref={flagRef} position={[0.02, 0.7, 0]}>
        <mesh position={[0.06, 0, 0]}>
          <planeGeometry args={[0.12, 0.08]} />
          <meshStandardMaterial color="#0a0a0a" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
        {/* Skull dot */}
        <mesh position={[0.06, 0.005, 0.002]}>
          <circleGeometry args={[0.018, 12]} />
          <meshStandardMaterial color={sailColor} emissive={sailColor} emissiveIntensity={0.2} />
        </mesh>
      </group>
      {/* Helm wheel (decorative) */}
      <mesh position={[-0.18, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.035, 0.008, 6, 12]} />
        <meshStandardMaterial color={hullTrim} roughness={0.6} />
      </mesh>
    </group>
  );
}

function WakeRing({ delay, active }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime + delay) % 1.6;
    const progress = t / 1.6;
    const scale = 0.4 + progress * 1.6;
    ref.current.scale.set(scale, scale, scale);
    if (ref.current.material) {
      const fade = active ? (1 - progress) * 0.55 : 0;
      ref.current.material.opacity = fade;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <ringGeometry args={[0.18, 0.24, 32]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function FoamTrail({ active, headingRef }) {
  const groupRef = useRef();
  const dropsRef = useRef([]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const heading = headingRef.current || 0;
    // Place drops behind the ship along -heading direction
    dropsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = (t * 1.4 + i * 0.18) % 1;
      const dist = 0.15 + phase * 0.95;
      mesh.position.x = -Math.cos(heading) * dist;
      mesh.position.z = -Math.sin(heading) * dist;
      mesh.position.y = -0.04 + Math.sin(t * 4 + i) * 0.015;
      const fade = active ? (1 - phase) * 0.7 : 0;
      const scale = 0.55 + phase * 0.9;
      mesh.scale.set(scale, scale, scale);
      if (mesh.material) mesh.material.opacity = fade;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`drop-${i}`}
          ref={(el) => {
            dropsRef.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial
            color="#e6f7ff"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function BowSplash({ active, headingRef }) {
  const groupRef = useRef();
  const dropsRef = useRef([]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const heading = headingRef.current || 0;
    dropsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = (t * 2.8 + i * 0.32) % 1;
      const dist = 0.22 + phase * 0.35;
      const lateral = (i % 2 === 0 ? 1 : -1) * (0.05 + phase * 0.15);
      // Forward direction + lateral spread perpendicular
      const fx = Math.cos(heading) * dist;
      const fz = Math.sin(heading) * dist;
      const px = -Math.sin(heading) * lateral;
      const pz = Math.cos(heading) * lateral;
      mesh.position.x = fx + px;
      mesh.position.z = fz + pz;
      mesh.position.y = 0.05 + Math.sin(phase * Math.PI) * 0.18;
      const fade = active ? Math.sin(phase * Math.PI) * 0.85 : 0;
      const scale = 0.4 + (1 - phase) * 0.6;
      mesh.scale.set(scale, scale, scale);
      if (mesh.material) mesh.material.opacity = fade;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={`splash-${i}`}
          ref={(el) => {
            dropsRef.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ShipWake({ active, headingRef }) {
  return (
    <group>
      <WakeRing delay={0} active={active} />
      <WakeRing delay={0.55} active={active} />
      <WakeRing delay={1.1} active={active} />
      <FoamTrail active={active} headingRef={headingRef} />
      <BowSplash active={active} headingRef={headingRef} />
    </group>
  );
}

export function ShipMarker({ gridWidth, gridHeight }) {
  const groupRef = useRef();
  const prevPosRef = useRef(new THREE.Vector3());
  const headingRef = useRef(0);
  const shipPivotRef = useRef();
  const legProgressRef = useRef(1);
  const prevPathIndexRef = useRef(0);
  const slice = useSimulationSlice();
  const { start, end, phase, searchSnapshot, shipPathIndex, shipAnimating, grid } = slice;
  const route = searchSnapshot.path ?? [];

  const idleAtStart = phase === GAME_PHASES.NO_PATH || phase === GAME_PHASES.IDLE || phase === GAME_PHASES.SELECTING_END;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    let desired = null;

    if (route.length > 0 && (shipAnimating || phase === GAME_PHASES.FOUND)) {
      const index = shipAnimating
        ? Math.min(shipPathIndex, route.length - 1)
        : route.length - 1;

      if (index !== prevPathIndexRef.current) {
        legProgressRef.current = 0;
        prevPathIndexRef.current = index;
      }

      if (shipAnimating && index > 0) {
        const from = route[index - 1];
        const to = route[index];
        legProgressRef.current = Math.min(1, legProgressRef.current + delta * 2.8);
        desired = interpolateShipWorld(
          from,
          to,
          grid,
          gridWidth,
          gridHeight,
          legProgressRef.current
        );
      } else {
        desired = pointToWorld(route[index], grid, gridWidth, gridHeight);
      }
    } else if (start) {
      const cell = grid[start.i][start.j];
      desired = gridToWorld(start.i, start.j, gridWidth, gridHeight, cell.elevation ?? 0);
    }

    if (!desired) return;

    const pos = groupRef.current.position;
    prevPosRef.current.copy(pos);

    const lerpFactor = shipAnimating ? 16 : idleAtStart ? 4 : 8;
    pos.x += (desired.x - pos.x) * Math.min(delta * lerpFactor, 1);
    pos.y += (desired.y - pos.y) * Math.min(delta * lerpFactor, 1);
    pos.z += (desired.z - pos.z) * Math.min(delta * lerpFactor, 1);

    const dx = pos.x - prevPosRef.current.x;
    const dz = pos.z - prevPosRef.current.z;
    const speedSq = dx * dx + dz * dz;
    if (shipAnimating && speedSq > 1e-6) {
      const newHeading = Math.atan2(dz, dx);
      let diff = newHeading - headingRef.current;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      headingRef.current += diff * Math.min(delta * 6, 1);
    }
    if (shipPivotRef.current) {
      shipPivotRef.current.rotation.y = -headingRef.current;
    }
  });

  const initialPos = start
    ? gridToWorld(start.i, start.j, gridWidth, gridHeight, grid[start.i][start.j].elevation ?? 0)
    : null;

  if (!initialPos && route.length === 0) return null;

  const spawn = initialPos ?? pointToWorld(route[0], grid, gridWidth, gridHeight);

  return (
    <group ref={groupRef} position={[spawn.x, spawn.y, spawn.z]}>
      <pointLight color="#fce22a" intensity={0.4} distance={2} />
      <ShipWake active={shipAnimating} headingRef={headingRef} />
      <group ref={shipPivotRef}>
        <PirateShip />
      </group>
    </group>
  );
}

function TreasureChest({ color, glowing, locked = false }) {
  const lidGroupRef = useRef();
  const beamRef = useRef();
  const groupRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = 0.04 + Math.sin(t * 2) * 0.025;
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.08;
    }
    if (lidGroupRef.current) {
      const target = glowing ? -1.05 + Math.sin(t * 2.4) * 0.06 : locked ? 0.02 : 0;
      const current = lidGroupRef.current.rotation.x;
      lidGroupRef.current.rotation.x = current + (target - current) * 0.08;
    }
    if (beamRef.current && glowing) {
      beamRef.current.material.opacity = 0.25 + Math.sin(t * 3) * 0.1;
      beamRef.current.rotation.y = t * 0.4;
    }
  });

  const wood = '#6b3a14';
  const woodTrim = '#9a5a26';
  const iron = '#1f1f1f';
  const gold = '#f4c542';
  const goldDeep = '#b8860b';
  const isError = color === '#dc0000';
  const bodyColor = isError ? color : wood;
  const trimColor = isError ? color : woodTrim;

  return (
    <group ref={groupRef} position={[0, 0.04, 0]} scale={1.1}>
      {/* Soft ground glow under chest */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial
          color={glowing ? gold : color}
          transparent
          opacity={glowing ? 0.55 : 0.22}
          depthWrite={false}
        />
      </mesh>

      {/* Chest body */}
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.42, 0.24, 0.3]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={bodyColor}
          emissiveIntensity={glowing ? 0.25 : 0.08}
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>

      {/* Vertical wooden planks (visual seams) */}
      {[-0.13, 0, 0.13].map((x) => (
        <mesh key={`plank-${x}`} position={[x, 0.13, 0.151]}>
          <boxGeometry args={[0.005, 0.22, 0.005]} />
          <meshStandardMaterial color="#3a1d08" roughness={0.9} />
        </mesh>
      ))}

      {/* Iron horizontal bands */}
      {[-0.075, 0.075].map((y) => (
        <mesh key={`band-${y}`} position={[0, 0.13 + y, 0]}>
          <boxGeometry args={[0.43, 0.025, 0.31]} />
          <meshStandardMaterial color={iron} metalness={0.85} roughness={0.35} />
        </mesh>
      ))}

      {/* Corner iron caps (front 4 corners) */}
      {[
        [-0.205, 0.025, 0.15],
        [0.205, 0.025, 0.15],
        [-0.205, 0.235, 0.15],
        [0.205, 0.235, 0.15],
      ].map((p, idx) => (
        <mesh key={`cap-${idx}`} position={p}>
          <boxGeometry args={[0.025, 0.025, 0.025]} />
          <meshStandardMaterial color={iron} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}

      {/* Lock plate */}
      <mesh position={[0, 0.13, 0.155]}>
        <boxGeometry args={[0.08, 0.1, 0.012]} />
        <meshStandardMaterial color={gold} metalness={0.85} roughness={0.25} emissive={goldDeep} emissiveIntensity={0.3} />
      </mesh>
      {/* Keyhole */}
      <mesh position={[0, 0.13, 0.162]}>
        <circleGeometry args={[0.012, 12]} />
        <meshBasicMaterial color={iron} />
      </mesh>

      {/* Gold coins inside (visible when open) */}
      {glowing && (
        <group position={[0, 0.24, 0]}>
          {[
            [-0.08, 0, 0.04],
            [0.06, 0.01, -0.02],
            [-0.02, 0.02, 0.07],
            [0.1, 0, 0.05],
            [-0.1, 0.01, -0.05],
            [0.02, 0.025, 0],
          ].map((p, idx) => (
            <mesh key={`coin-${idx}`} position={p} rotation={[Math.PI / 2 + (idx % 2) * 0.4, idx * 0.7, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.008, 16]} />
              <meshStandardMaterial
                color={gold}
                metalness={0.95}
                roughness={0.15}
                emissive={gold}
                emissiveIntensity={0.45}
              />
            </mesh>
          ))}
          {/* Big gem on top of coin pile */}
          <mesh position={[0, 0.04, 0]} rotation={[0, 0.4, 0]}>
            <octahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial
              color="#ff3b6b"
              metalness={0.5}
              roughness={0.1}
              emissive="#ff3b6b"
              emissiveIntensity={0.7}
            />
          </mesh>
        </group>
      )}

      {/* Lid — pivots on back hinge */}
      <group
        ref={lidGroupRef}
        position={[0, 0.25, -0.15]}
      >
        <group position={[0, 0, 0.15]}>
          {/* Lid base */}
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.44, 0.05, 0.32]} />
            <meshStandardMaterial
              color={bodyColor}
              emissive={bodyColor}
              emissiveIntensity={glowing ? 0.3 : 0.1}
              roughness={0.55}
              metalness={0.15}
            />
          </mesh>
          {/* Raised dome ridge along the center (fakes a curved top) */}
          <mesh position={[0, 0.055, 0]}>
            <boxGeometry args={[0.44, 0.04, 0.22]} />
            <meshStandardMaterial
              color={trimColor}
              emissive={bodyColor}
              emissiveIntensity={glowing ? 0.3 : 0.1}
              roughness={0.5}
              metalness={0.2}
            />
          </mesh>
          {/* Top accent strip */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.44, 0.015, 0.1]} />
            <meshStandardMaterial color={trimColor} roughness={0.5} metalness={0.2} />
          </mesh>
          {/* Iron studs on lid */}
          {[-0.14, -0.04, 0.06, 0.16].map((x) => (
            <mesh key={`stud-${x}`} position={[x, 0.085, 0]}>
              <sphereGeometry args={[0.015, 8, 6]} />
              <meshStandardMaterial color={iron} metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
          {/* Lock latch on lid front */}
          <mesh position={[0, 0.02, 0.16]}>
            <boxGeometry args={[0.06, 0.06, 0.015]} />
            <meshStandardMaterial color={gold} metalness={0.85} roughness={0.25} emissive={goldDeep} emissiveIntensity={0.25} />
          </mesh>
        </group>
      </group>

      {/* Light beam when glowing */}
      {glowing && (
        <>
          <mesh ref={beamRef} position={[0, 1.0, 0]}>
            <cylinderGeometry args={[0.04, 0.32, 2, 16, 1, true]} />
            <meshBasicMaterial
              color="#fff3a8"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight color="#ffd966" intensity={1.2} distance={3.5} position={[0, 0.4, 0]} />
          <pointLight color="#fff3a8" intensity={0.6} distance={2} position={[0, 0.1, 0]} />
        </>
      )}
      {!glowing && isError && <pointLight color="#dc0000" intensity={0.5} distance={1.8} />}
    </group>
  );
}

export function TreasureMarker({ gridWidth, gridHeight }) {
  const slice = useSimulationSlice();
  const { end, phase, grid } = slice;

  if (!end || phase === 'idle' || phase === 'selecting_end') return null;

  const cell = grid[end.i][end.j];
  const pos = gridToWorld(end.i, end.j, gridWidth, gridHeight, cell.elevation ?? 0);
  const color = phase === 'no_path' ? '#dc0000' : '#cd8f2b';

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <TreasureChest color={color} glowing={phase === 'found'} locked={phase === 'no_path'} />
    </group>
  );
}

function IslandObstacle({ variant, surfaceY }) {
  const colors = {
    1: { trunk: '#5a8f3a', top: '#2d6a4f' },
    2: { trunk: '#906821', top: '#cd8f2b' },
    3: { trunk: '#4a0080', top: '#6b21a8' },
    4: { trunk: '#5a8f3a', top: '#16a34a' },
  };
  const c = colors[variant] || colors[1];

  return (
    <group position={[0, surfaceY + 0.2, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.25, 6]} />
        <meshStandardMaterial color={c.trunk} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.32, 0.45, 6]} />
        <meshStandardMaterial color={c.top} roughness={0.7} />
      </mesh>
      {variant === 2 && (
        <mesh position={[0, 0.55, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#fce22a" emissive="#fce22a" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}

export function ObstacleDecor({ cell, gridWidth, gridHeight }) {
  if (cell.type !== CELL_TYPES.OBSTACLE) return null;

  const surfaceY = getPlatformY(cell.elevation ?? 0);
  const { x, z } = gridToWorld(cell.i, cell.j, gridWidth, gridHeight);
  const variant = cell.obstacleVariant || 1;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, surfaceY + PLATFORM_THICKNESS / 2, 0]}>
        <cylinderGeometry args={[TILE_RADIUS * 0.85, TILE_RADIUS * 1.1, PLATFORM_THICKNESS + 0.08, 16]} />
        <meshStandardMaterial color="#906821" roughness={0.8} />
      </mesh>
      <IslandObstacle variant={variant} surfaceY={surfaceY} />
    </group>
  );
}

function Bubble({ position, phase }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2 + phase) * 0.08;
      ref.current.material.opacity = 0.4 + Math.sin(clock.elapsedTime * 3 + phase) * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="#00ffca" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
}

export function CurrentStream({ fromCell, toCell, gridWidth, gridHeight }) {
  if (fromCell.type === CELL_TYPES.OBSTACLE || toCell.type === CELL_TYPES.OBSTACLE) return null;

  const from = gridToWorld(fromCell.i, fromCell.j, gridWidth, gridHeight, fromCell.elevation ?? 0);
  const to = gridToWorld(toCell.i, toCell.j, gridWidth, gridHeight, toCell.elevation ?? 0);

  const bubbles = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const t = (i + 1) / 6;
      return {
        pos: [
          from.x + (to.x - from.x) * t,
          from.y + (to.y - from.y) * t,
          from.z + (to.z - from.z) * t,
        ],
        phase: i * 1.2,
      };
    });
  }, [from.x, from.y, from.z, to.x, to.y, to.z]);

  return (
    <group>
      {bubbles.map((b, i) => (
        <Bubble key={i} position={b.pos} phase={b.phase} />
      ))}
    </group>
  );
}

export function CurrentStreams({ grid, gridWidth, gridHeight }) {
  const links = useMemo(() => getDepthLinks(grid), [grid]);

  return (
    <>
      {links.map(({ from, to, fromCell, toCell }) => (
        <CurrentStream
          key={`c-${from.i}-${from.j}-${to.i}-${to.j}`}
          fromCell={fromCell}
          toCell={toCell}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
        />
      ))}
    </>
  );
}
