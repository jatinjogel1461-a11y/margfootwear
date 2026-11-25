import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Html,
  useProgress,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { LogoMark } from "./Logo";
import { useIsMobile } from "../hooks/use-mobile";
import { getShoeVariant, FALLBACK_SHOE_MODEL } from "../lib/shoeModels";
import type { Product } from "../lib/products";
import type { ShoeDimensions } from "../lib/shoeDimensions";

useGLTF.preload(FALLBACK_SHOE_MODEL);

/** Shared mm -> scene-unit scale factor (300 mm shoe = 2.0 scene units) */
const MM_TO_SCENE = 2.0 / 300;

function CompareShoeMesh({
  product,
  dims,
  positionX,
  label,
  accentColor,
}: {
  product: Product;
  dims: ShoeDimensions;
  positionX: number;
  label: string;
  accentColor: string;
}) {
  const { model: modelUrl, variant } = getShoeVariant(product.id);
  const { scene } = useGLTF(modelUrl);
  const colorHex = product.colors[0]?.hex ?? "#ff6a00";

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    const baseColor = new THREE.Color(colorHex);
    const varTint = variant?.tint ? new THREE.Color(variant.tint) : null;

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            const hsl = { h: 0, s: 0, l: 0 };
            baseColor.getHSL(hsl);
            if (variant?.name === "mono") hsl.s = 0;
            const target = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
            if (varTint) target.multiply(varTint);
            m.color.set(target);
            m.needsUpdate = true;
          }
        });
      }
    });
  }, [clonedScene, colorHex, variant]);

  // Scale each axis so the bounding box matches true physical dims * MM_TO_SCENE
  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const lengthIsX = size.x >= size.z;
    const rawLen = Math.max(lengthIsX ? size.x : size.z, 0.001);
    const rawWid = Math.max(lengthIsX ? size.z : size.x, 0.001);
    const rawHei = Math.max(size.y, 0.001);

    const targetLen = dims.length * MM_TO_SCENE;
    const targetWid = dims.width * MM_TO_SCENE;
    const targetHei = dims.height * MM_TO_SCENE;

    const sLen = targetLen / rawLen;
    const sWid = targetWid / rawWid;
    const sHei = targetHei / rawHei;

    const sx = lengthIsX ? sLen : sWid;
    const sz = lengthIsX ? sWid : sLen;
    const sy = sHei;

    const floorY = -0.35;
    return {
      scale: [sx, sy, sz] as [number, number, number],
      pos: [
        positionX - center.x * sx,
        floorY - box.min.y * sy,
        -center.z * sz,
      ] as [number, number, number],
      labelY: floorY + targetHei + 0.22,
    };
  }, [clonedScene, dims.length, dims.width, dims.height, positionX]);

  return (
    <group>
      <group
        position={transform.pos}
        scale={transform.scale}
        rotation={[0, variant?.rotateY || 0, 0]}
      >
        <primitive object={clonedScene} />
      </group>
      <Html position={[positionX, transform.labelY, 0]} center zIndexRange={[30, 0]}>
        <div
          style={{
            color: "#f8fafc",
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            background: "rgba(12, 12, 16, 0.88)",
            padding: "3px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            border: `1px solid ${accentColor}`,
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function SharedTurntable({
  autoRotate,
  isInteracting,
  children,
}: {
  autoRotate: boolean;
  isInteracting: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useFrame((_, dt) => {
    if (autoRotate && !isInteracting && !reducedMotion && ref.current) {
      ref.current.rotation.y += dt * 0.25;
    }
  });

  return <group ref={ref}>{children}</group>;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <LogoMark className="h-10 w-10 animate-spin-slow" glow />
        <div className="text-xs tracking-[0.3em] text-muted-foreground whitespace-nowrap">
          {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

export default function CompareLabViewer({
  productA,
  productB,
  sizeA,
  sizeB,
  dimsA,
  dimsB,
}: {
  productA: Product;
  productB: Product;
  sizeA: number;
  sizeB: number;
  dimsA: ShoeDimensions;
  dimsB: ShoeDimensions;
}) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 1.8, 5.2], fov: 40 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <ambientLight intensity={0.28} />
        <directionalLight position={[5, 7, 4]} intensity={1.5} color="#fff5e6" castShadow />
        <directionalLight position={[-4, 3, -3]} intensity={0.45} color="#a0c4ff" />
        <Environment preset="studio" />

        {/* Ground grid for scale */}
        <gridHelper args={[10, 20, "#ff6a00", "#2b2d38"]} position={[0, -0.35, 0]} />

        <Suspense fallback={<Loader />}>
          <SharedTurntable autoRotate={autoRotate} isInteracting={isInteracting}>
            <CompareShoeMesh
              product={productA}
              dims={dimsA}
              positionX={-1.25}
              label={`A · ${productA.name} (UK ${sizeA})`}
              accentColor="#ff6a00"
            />
            <CompareShoeMesh
              product={productB}
              dims={dimsB}
              positionX={1.25}
              label={`B · ${productB.name} (UK ${sizeB})`}
              accentColor="#38bdf8"
            />
          </SharedTurntable>
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom
          enableDamping={!isMobile}
          minDistance={3}
          maxDistance={9}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          onStart={() => setIsInteracting(true)}
          onEnd={() => setIsInteracting(false)}
        />
      </Canvas>

      <button
        type="button"
        onClick={() => setAutoRotate((a) => !a)}
        aria-pressed={autoRotate}
        aria-label={autoRotate ? "Pause auto-rotation" : "Start auto-rotation"}
        className="absolute bottom-3 right-3 glass text-foreground px-3 py-1.5 text-xs tracking-wider rounded-full hover:bg-neon hover:text-neon-foreground transition z-10"
      >
        {autoRotate ? "PAUSE" : "AUTO-ROTATE"}
      </button>
    </div>
  );
}
