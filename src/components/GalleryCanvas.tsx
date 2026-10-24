// Importe Suspense (chargement asynchrone des modèles 3D) et useRef (référence mutable sans re-render)
import { Suspense, useRef, useEffect } from 'react';
// Importe Canvas (conteneur WebGL Three.js) et useFrame (hook exécuté à chaque frame pour animer)
import { Canvas, useFrame } from '@react-three/fiber';
// GSAP pour l'animation du rail
import gsap from 'gsap';
// Importe ContactShadows et Environment pour ombres et reflets
import { ContactShadows } from '@react-three/drei';
// Importe toute la librairie Three.js (types, géométries, matériaux, lumières)
import * as THREE from 'three';
// Importe le composant qui affiche un tableau (image texturée ou modèle GLB)
import ArtworkFrame from './ArtworkFrame';
// Importe le composant qui affiche une statue GLB blanche
import Statue from './Statue';
// Importe le sol en vieux bois texturé
import WoodenFloor from './WoodenFloor';
import BeigeWall from './BeigeWall';
import WallBaseboard from './WallBaseboard';
// Importe le type TypeScript Artwork pour typer les tableaux
import type { Artwork } from '../types';

// Interface des props du canvas principal de la galerie
interface GalleryCanvasProps {
  artworks: Artwork[];
  activeIndex: number;
}

// Petit loader affiché pendant le chargement des modèles 3D
function CanvasLoader() {
  return (
    // Mesh simple au centre de la scène
    <mesh position={[0, 0, 0]}>
      {/* Barre fine dorée semi-transparente pour indiquer le chargement */}
      <planeGeometry args={[0.6, 0.02]} />
      <meshBasicMaterial color="#D2A02A" transparent opacity={0.18} />
    </mesh>
  );
}

// Tableaux fixes sur le mur — la caméra se déplace pour next/prev, le tableau s'anime au clic
// Clic : avance (ease in-out) → rotation 360° → pause 1s → glisse gauche (30% desktop) / haut (50% mobile)
function InteractiveFrames({
  artworks,
  activeIndex,
  revealRef,
  onFrameClick,
  paintingRefs,
}: {
  artworks: Artwork[];
  activeIndex: number;
  revealRef: React.MutableRefObject<{ z: number; rotY: number; slideX: number; slideY: number }>;
  onFrameClick?: (index: number) => void;
  paintingRefs: React.MutableRefObject<(THREE.Group | null)[]>;
}) {
  const SPACING = 8;
  const WALL_Z = -0.6;
  const FRAME_Z = WALL_Z + 0.02;
  const groupRefs = paintingRefs;

  useFrame(() => {
    groupRefs.current.forEach((g, i) => {
      if (!g) return;
      const baseX = i * SPACING;
      const isActive = i === activeIndex;
      let x = baseX;
      let z = FRAME_Z;
      let rotY = 0;
      let y = 0.62;
      if (isActive) {
        x += revealRef.current.slideX;
        y += revealRef.current.slideY;
        z += revealRef.current.z;
        rotY = revealRef.current.rotY;
      }
      g.position.x = x;
      g.position.y = y;
      g.position.z = z;
      g.rotation.y = rotY;
    });
  });

  return (
    <>
      {artworks.map((art, i) => (
        <group
          key={art.id}
          ref={(el) => { groupRefs.current[i] = el; }}
          position={[i * SPACING, 0.62, FRAME_Z]}
          onClick={(e) => {
            e.stopPropagation();
            if (i === activeIndex) {
              onFrameClick?.(i);
            }
          }}
          onPointerOver={() => { if (i === activeIndex) document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = ''; }}
        >
          {/* Hitbox invisible pour capter le clic même si le GLB n'a pas de géométrie pickable */}
          <mesh visible={false} position={[0, 0, 0.15]}>
            <planeGeometry args={[2.2, 2.6]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <ArtworkFrame artwork={art} />
        </group>
      ))}
    </>
  );
}

// Caméra qui glisse le long du mur vers le tableau actif
// Délai 1s, puis 2s lent→rapide→lent + dézoom (fov 40→58→40)
function CameraRail({ activeIndex }: { activeIndex: number }) {
  const SPACING = 8;
  const target = useRef({ x: activeIndex * SPACING });
  const zoom = useRef({ fov: 40 });
  const prevRef = useRef(activeIndex);

  useEffect(() => {
    target.current.x = activeIndex * SPACING;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeIndex === prevRef.current) return;
    prevRef.current = activeIndex;
    gsap.killTweensOf(target.current);
    gsap.killTweensOf(zoom.current);
    gsap.to(target.current, {
      x: activeIndex * SPACING,
      duration: 2,
      delay: 1,
      ease: 'power2.inOut',
      overwrite: true,
    });
    // Dézoom : 40 → 58 au milieu du trajet → 40 à l'arrivée
    gsap.set(zoom.current, { fov: 40 });
    gsap.to(zoom.current, {
      fov: 58,
      duration: 1,
      delay: 1,
      ease: 'power2.out',
      overwrite: true,
      onComplete: () => {
        gsap.to(zoom.current, { fov: 40, duration: 1, ease: 'power2.inOut', overwrite: true });
      },
    });
  }, [activeIndex]);

  useFrame(({ camera }) => {
    camera.position.x = target.current.x;
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      persp.fov = zoom.current.fov;
      persp.updateProjectionMatrix();
    }
    camera.lookAt(target.current.x, 0.2, -0.6);
  });
  return null;
}

// Composant principal : scène 3D complète de la galerie
export default function GalleryCanvas({
  artworks,
  activeIndex,
  revealRef,
  onFrameClick,
}: GalleryCanvasProps & {
  revealRef?: React.MutableRefObject<{ z: number; rotY: number; slideX: number; slideY: number }>;
  onFrameClick?: (index: number) => void;
}) {
  const defaultReveal = useRef({ z: 0, rotY: 0, slideX: 0, slideY: 0 });
  const reveal = revealRef ?? defaultReveal;
  const paintingRefs = useRef<(THREE.Group | null)[]>([]);

  const gradientBg: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(2, 1, 8, 0.6) 70%, rgba(2, 1, 8, 0.95) 100%), radial-gradient(ellipse at 85% 80%, rgba(120, 20, 80, 0.12) 0%, transparent 40%), radial-gradient(ellipse at 75% 95%, rgba(75, 30, 140, 0.22) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(55, 20, 110, 0.18) 0%, transparent 45%), radial-gradient(ellipse at 15% 90%, rgba(60, 25, 120, 0.12) 0%, transparent 40%), radial-gradient(ellipse at 40% 40%, #0A0A1E 0%, #060614 40%, #030308 70%, #010104 100%)',
    zIndex: 0,
  };

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Luxurious dark gradient background behind canvas */}
      <div style={gradientBg} />
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ position: [0, 0, 6.5], fov: 40, near: 0.01, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        {/* Transparent — CSS gradient shows through */}
        {/* Lumières muséales — 0xfff5e6 chaud, penumbra doux */}
        <ambientLight intensity={0.5} color="#fff5e6" />
        <directionalLight
          castShadow
          position={[0, 2.5, 4.5]}
          intensity={0.8}
          color="#fff5e6"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.1}
          shadow-camera-far={10}
          shadow-camera-left={-2.4}
          shadow-camera-right={2.4}
          shadow-camera-top={2.4}
          shadow-camera-bottom={-2.4}
          shadow-bias={-0.0015}
          shadow-radius={8}
        />
        <directionalLight
          castShadow
          position={[2.5, 5.5, 3]}
          intensity={0.5}
          color="#fff5e6"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={18}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-bias={-0.0012}
          shadow-radius={6}
        />
        <spotLight position={[-2, 5, 4]} angle={0.35} penumbra={0.72} intensity={0.4} color="#fff5e6" distance={15} decay={1.2} castShadow={false} />
        <spotLight position={[2, 5, 4]} angle={0.35} penumbra={0.72} intensity={0.35} color="#fff5e6" distance={15} decay={1.2} castShadow={false} />
        <spotLight position={[0, 5, 3.5]} angle={0.42} penumbra={0.62} intensity={0.3} color="#fff5e6" distance={12} decay={1.4} castShadow={false} />


        {/* Fond : mur + plinthe + sol */}
        <Suspense fallback={null}>
          <BeigeWall />
        </Suspense>
        <WallBaseboard />
        <Suspense fallback={null}>
          <WoodenFloor />
        </Suspense>

        {/* Receveurs d'ombre — sol uniquement, mur sans ombre */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.195, 0.5]} receiveShadow>
          <planeGeometry args={[128, 10]} />
          <shadowMaterial opacity={0.28} transparent />
        </mesh>
        {/* Statues — une paire par tableau, rapprochées à ±2.6 (au lieu de ±3.2) */}
        {artworks.map((_, i) => {
          const cx = i * 8;
          return (
            <group key={`statues-${i}`}>
              <ContactShadows position={[cx - 2.6, -1.18, 0.5]} opacity={0.32} scale={2.8} blur={2.6} far={2.2} color="#12081a" resolution={512} />
              <ContactShadows position={[cx + 2.6, -1.18, 0.5]} opacity={0.32} scale={2.8} blur={2.6} far={2.2} color="#12081a" resolution={512} />
            </group>
          );
        })}
        {/* Ombre portée derrière chaque tableau — directement sur le mur */}
        {artworks.map((_, i) => {
          const cx = i * 8;
          return (
            <mesh
              key={`tableau-shadow-${i}`}
              position={[cx, 0.62, -0.597]}
            >
              <planeGeometry args={[1.7, 2.2]} />
              <meshBasicMaterial color="#0a0612" transparent opacity={0.12} />
            </mesh>
          );
        })}
        {artworks.map((_, i) => {
          const cx = i * 8;
          // Statues optimisées légères pour affichage fluide sans blocage
          const STATUES = [
            '/models/statuts/statut1.glb',
            '/models/statuts/statut2.glb',
            '/models/statuts/statut5.glb',
            '/models/statuts/statut6.glb',
          ];
          const leftUrl = STATUES[(i * 2) % STATUES.length];
          const rightUrl = STATUES[(i * 2 + 1) % STATUES.length];
          return (
            <group key={`statue-mesh-${i}`}>
              <Suspense fallback={null}>
                <Statue modelUrl={leftUrl} position={[cx - 2.6, -1.2, 0.5]} />
              </Suspense>
              <Suspense fallback={null}>
                <Statue modelUrl={rightUrl} position={[cx + 2.6, -1.2, 0.5]} />
              </Suspense>
            </group>
          );
        })}

        <CameraRail activeIndex={activeIndex} />

        {/* Tableaux — fixes, caméra qui se déplace, reveal au clic */}
        <Suspense fallback={<CanvasLoader />}>
          <InteractiveFrames artworks={artworks} activeIndex={activeIndex} revealRef={reveal} onFrameClick={onFrameClick} paintingRefs={paintingRefs} />
        </Suspense>
      </Canvas>
    </div>
  );
}
