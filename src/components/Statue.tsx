// Importe useMemo (mémorise le clone pour éviter de le recalculer) et memo (évite re-render inutile)
import { useMemo, memo } from 'react';
// Importe useGLTF : charge un fichier .glb/.gltf et donne accès à sa scène 3D
import { useGLTF } from '@react-three/drei';
// Importe Three.js pour Box3 (boîte englobante), Vector3, Mesh, matériaux
import * as THREE from 'three';

// Props de la statue : URL du modèle et position dans la galerie
interface StatueProps {
  modelUrl: string; // Chemin vers le .glb (ex: /models/statut1.glb)
  position: [number, number, number]; // Position [x, y, z] dans la scène
}

// Composant interne qui affiche une statue blanche
function StatueInner({ modelUrl, position }: StatueProps) {
  const encodedUrl = useMemo(() => encodeURI(modelUrl), [modelUrl]);
  const { scene } = useGLTF(encodedUrl); // Charge le modèle GLB et récupère sa scène racine

  // Clone et prépare le modèle une seule fois (mémorisé tant que scene ne change pas)
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetMax = 1.65;
    const scale = targetMax / maxDim;
    clone.scale.setScalar(scale);

    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.x = -center.x * scale;
    clone.position.z = -center.z * scale;
    clone.position.y = -box.min.y * scale; // Pose directement la base de la statue au sol

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m: THREE.Material) => {
            const std = m as THREE.MeshStandardMaterial;
            if (std.color) std.color.set('#8a8a8a');
            if (std.roughness !== undefined) std.roughness = 0.35;
            if (std.metalness !== undefined) std.metalness = 0.85;
          });
        }
      }
    });

    return clone;
  }, [scene]); // Recalcule seulement si le modèle source change

  return (
    // Groupe positionné dans la galerie (ex: [-3.2, -1.2, 0.5] à gauche)
    <group position={position}>
      <primitive object={cloned} /> {/* Affiche directement l'objet Three.js cloné */}
    </group>
  );
}

// Exporte mémorisé pour éviter re-render si props identiques
export default memo(StatueInner);
