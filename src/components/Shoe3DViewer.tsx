import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  useProgress,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { LogoMark } from "./Logo";
import { useIsMobile } from "../hooks/use-mobile";

// ---------------------------------------------------------------------------
// Single shared GLTF model path
// ---------------------------------------------------------------------------
import { FALLBACK_SHOE_MODEL } from "../lib/shoeModels";

// Preload the fallback
useGLTF.preload(FALLBACK_SHOE_MODEL);

function SneakerModel({
  color,
  autoRotate,
  isResetting,
  modelUrl = FALLBACK_SHOE_MODEL,
  variant,
}: {
  color: string;
  autoRotate: boolean;
  isResetting?: boolean;
  modelUrl?: string;
  variant?: { tint: string | null; rotateY: number; name?: string };
}) {
  const { scene } = useGLTF(modelUrl);
  const group = useRef<THREE.Group>(null!);

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
      }
    });
    return clone;
  }, [scene]);

  const startRot = useRef(0);
  const targetRot = useRef(0);
  const progress = useRef(0);

  useEffect(() => {
    if (isResetting && group.current) {
      startRot.current = group.current.rotation.y;
      const base = variant?.rotateY || 0;
      const revs = Math.round((startRot.current - base) / (Math.PI * 2));
      targetRot.current = revs * (Math.PI * 2) + base;
      progress.current = 0;
    }
  }, [isResetting, variant]);

  // Apply initial rotation from variant
  useEffect(() => {
    if (group.current) {
      group.current.rotation.y = variant?.rotateY || 0;
    }
  }, [variant]);

  useFrame((_, dt) => {
    if (isResetting && group.current) {
      progress.current += dt / 0.75; // 750ms duration
      if (progress.current >= 1) progress.current = 1;

      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress.current, 3);
      group.current.rotation.y = THREE.MathUtils.lerp(startRot.current, targetRot.current, ease);
    } else if (autoRotate && group.current) {
      group.current.rotation.y += dt * 0.5;
    }
  });

  const fitTransform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 2;
    const s = maxDim > 0 ? targetSize / maxDim : 1;
    const yOffset = -(box.min.y * s);
    return {
      scale: s,
      offset: [-center.x * s, yOffset - 0.35, -center.z * s] as [number, number, number],
    };
  }, [clonedScene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    const baseColor = new THREE.Color(color);
    const varTint = variant?.tint ? new THREE.Color(variant.tint) : null;

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            const hsl = { h: 0, s: 0, l: 0 };
            baseColor.getHSL(hsl);
            
            if (variant?.name === "mono") {
              hsl.s = 0; // Grayscale
            }
            
            const targetColor = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
            if (varTint) {
               targetColor.multiply(varTint);
            }
            
            m.color.set(targetColor);
            m.needsUpdate = true;
          }
        });
      }
    });
  }, [clonedScene, color, variant]);

  return (
    <group ref={group} position={fitTransform.offset} scale={fitTransform.scale}>
      <primitive object={clonedScene} />
    </group>
  );
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

function AdaptiveDpr({ isCard }: { isCard: boolean }) {
  const { gl, size } = useThree();
  useEffect(() => {
    const target = isCard ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
    gl.setPixelRatio(target);
  }, [gl, size, isCard]);
  return null;
}

function CameraController({
  controlsRef,
  isResetting,
  setIsResetting,
}: {
  controlsRef: React.MutableRefObject<any>;
  isResetting: boolean;
  setIsResetting: (v: boolean) => void;
}) {
  const { camera } = useThree();
  const initialPos = useMemo(() => new THREE.Vector3(3.5, 1.8, 3.5), []);
  const initialTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const progress = useRef(0);

  useEffect(() => {
    if (isResetting) {
      startPos.current.copy(camera.position);
      if (controlsRef.current) {
        startTarget.current.copy(controlsRef.current.target);
      }
      progress.current = 0;
    }
  }, [isResetting, camera, controlsRef]);

  useFrame((_, dt) => {
    if (isResetting && controlsRef.current) {
      // 750ms duration
      progress.current += dt / 0.75;
      if (progress.current >= 1) progress.current = 1;

      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress.current, 3);

      camera.position.lerpVectors(startPos.current, initialPos, ease);
      controlsRef.current.target.lerpVectors(startTarget.current, initialTarget, ease);
      controlsRef.current.update();

      if (progress.current === 1) {
        setIsResetting(false);
      }
    }
  });

  return null;
}

export default function Shoe3DViewer({
  color = "#ff6a00",
  interactive = true,
  showAutoRotateToggle = false,
  inView = true,
  enableZoom = true,
  modelUrl,
  variant,
}: {
  color?: string;
  interactive?: boolean;
  showAutoRotateToggle?: boolean;
  inView?: boolean;
  enableZoom?: boolean;
  modelUrl?: string;
  variant?: { tint: string | null; rotateY: number; name?: string };
}) {
  const [auto, setAuto] = useState(!showAutoRotateToggle);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const controlsRef = useRef<any>(null);

  const isCard = !interactive && !showAutoRotateToggle;
  const effectiveAutoRotate = interactive ? (auto && !isInteracting && !isResetting) : true;

  const isMobile = useIsMobile();
  const touchStateRef = useRef({ x: 0, y: 0, isDecided: false });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStateRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      isDecided: false,
    };
    if (controlsRef.current && !isResetting) {
      controlsRef.current.enabled = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStateRef.current.isDecided) return;
    
    const dx = Math.abs(e.touches[0].clientX - touchStateRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStateRef.current.y);

    // Only decide once movement crosses a 3px threshold
    if (dy > 3 || dx > 3) {
      touchStateRef.current.isDecided = true;
      // If movement is predominantly vertical, disable OrbitControls immediately
      if (dy > dx) {
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.isDecided = false;
    if (controlsRef.current && !isResetting) {
      controlsRef.current.enabled = true;
    }
  };

  return (
    <div 
      className="w-full h-full relative" 
      style={{ touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <Canvas
        shadows
        camera={{ position: [3.5, 1.8, 3.5], fov: 38 }}
        dpr={[1, 2]}
        // Switch to demand when not in view to save GPU
        frameloop={inView ? "always" : "demand"}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1, preserveDrawingBuffer: true }}
      >
        <AdaptiveDpr isCard={isCard} />

        <ambientLight intensity={0.2} />
        <directionalLight
          position={[5, 7, 4]}
          intensity={1.6}
          color="#fff5e6"
          castShadow
          shadow-mapSize={isCard ? [512, 512] : [1024, 1024]}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#a0c4ff" />
        <directionalLight position={[-2, 4, -5]} intensity={0.6} color="#ffffff" />
        <spotLight position={[0, 8, 0]} angle={0.4} penumbra={0.8} intensity={0.5} color="#ffffff" />

        <Suspense fallback={<Loader />}>
          <SneakerModel color={color} autoRotate={effectiveAutoRotate} isResetting={isResetting} modelUrl={modelUrl} variant={variant} />
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.7}
            blur={2}
            scale={6}
            far={2.5}
            color="#000000"
            // Lower resolution shadows for non-interactive views
            resolution={isCard ? 256 : 512}
          />
          <Environment preset="studio" />
        </Suspense>

        {interactive && (
          <>
            <OrbitControls
              ref={controlsRef}
              enabled={!isResetting}
              enablePan={false}
              enableZoom={enableZoom}
              enableDamping={!isMobile}
              touches={{
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
              }}
              minDistance={2.5}
              maxDistance={7}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2}
              onStart={() => {
                setIsInteracting(true);
                setIsResetting(false);
                if (showAutoRotateToggle) setAuto(false);
              }}
              onEnd={() => {
                setIsInteracting(false);
                setIsResetting(true);
              }}
            />
            <CameraController
              controlsRef={controlsRef}
              isResetting={isResetting}
              setIsResetting={setIsResetting}
            />
          </>
        )}
      </Canvas>
      {showAutoRotateToggle && (
        <button
          onClick={() => setAuto((a) => !a)}
          className="absolute bottom-3 right-3 glass px-3 py-1.5 text-xs tracking-wider rounded-full hover:bg-neon hover:text-neon-foreground transition"
        >
          {auto ? "PAUSE" : "AUTO-ROTATE"}
        </button>
      )}
    </div>
  );
}
