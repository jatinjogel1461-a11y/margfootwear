import { useEffect, useRef, useState, useCallback } from "react";
import type * as THREE from "three";
import type { PoseLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  Camera,
  CameraOff,
  RotateCcw,
  AlertTriangle,
  SlidersHorizontal,
  Move,
  Loader2,
  Bug,
  Copy,
  Check,
} from "lucide-react";

const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// MediaPipe Pose landmark indices
const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;
const LEFT_HEEL = 29;
const RIGHT_HEEL = 30;
const LEFT_TOE = 31;
const RIGHT_TOE = 32;

const VISIBILITY_THRESHOLD = 0.5;
const SMOOTHING_ALPHA = 0.25;
const AUTO_FIT_LENGTH_RATIO = 1.15;

interface FootPoseState {
  initialized: boolean;
  x: number;
  y: number;
  angle: number;
  scale: number;
}

export interface FootTryOnViewerProps {
  productName: string;
  modelUrl?: string;
  modelRotation?: [number, number, number];
  accentColor?: string;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * t;
}

function isLandmarkVisible(
  lm: NormalizedLandmark | undefined
): lm is NormalizedLandmark {
  if (!lm) return false;
  return (lm.visibility ?? 1) >= VISIBILITY_THRESHOLD;
}

/**
 * Computes default [rx, ry, rz] so the longest bounding-box axis aligns to +X,
 * sole faces -Y, opening/ankle faces +Y, and side profile faces +Z.
 */
function computeAutoBaseRotation(
  THREE_NS: typeof THREE,
  raw: THREE.Object3D
): [number, number, number] {
  const box = new THREE_NS.Box3().setFromObject(raw);
  const size = new THREE_NS.Vector3();
  box.getSize(size);

  // Align longest axis (length) to X, and apply default -90deg X tilt
  // so an upright/top-down shoe lays on its sole (-Y) with side profile to camera (+Z).
  if (size.z >= size.x && size.z >= size.y) {
    // Length is along Z -> rotate +90deg around Y to bring Z -> X, and -90deg around X if flat
    return [-Math.PI / 2, Math.PI / 2, 0];
  }
  if (size.y >= size.x && size.y >= size.z) {
    // Length is along Y -> rotate -90deg around Z to bring Y -> X
    return [-Math.PI / 2, 0, -Math.PI / 2];
  }
  // Length is already along X -> rotate -90deg around X so sole is -Y and opening is +Y
  return [-Math.PI / 2, 0, 0];
}

/**
 * Wraps a cloned GLTF scene in a normalized Group:
 * - Applies `eulerRot` [rx, ry, rz]
 * - Scales so X length = 1.0
 * - Places the heel end (bbox.min.x) at x = 0, centered on Y & Z
 */
function buildNormalizedShoeGroup(
  THREE_NS: typeof THREE,
  rawScene: THREE.Object3D,
  eulerRot: [number, number, number],
  flipDirection: boolean
): THREE.Group {
  const pivotGroup = new THREE_NS.Group();
  const rotatedHolder = new THREE_NS.Group();
  const clone = rawScene.clone(true);

  rotatedHolder.add(clone);
  rotatedHolder.rotation.set(
    eulerRot[0],
    eulerRot[1] + (flipDirection ? Math.PI : 0),
    eulerRot[2]
  );
  rotatedHolder.updateMatrixWorld(true);

  const box = new THREE_NS.Box3().setFromObject(rotatedHolder);
  const size = new THREE_NS.Vector3();
  const center = new THREE_NS.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const lengthX = Math.max(size.x, 0.0001);
  const normScale = 1 / lengthX;

  rotatedHolder.scale.setScalar(normScale);
  // Shift so heel end (box.min.x) sits at x = 0 and toe end (box.max.x) sits at x = +1
  rotatedHolder.position.set(
    -box.min.x * normScale,
    -center.y * normScale,
    -center.z * normScale
  );

  pivotGroup.add(rotatedHolder);
  return pivotGroup;
}

/**
 * Generates a transparent PNG data URL of a sneaker silhouette tinted with `accentColor`
 * for products that do not yet have a 3D .glb model.
 */
function createFallbackShoePng(accentColor: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 260;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;

  ctx.beginPath();
  ctx.moveTo(68, 178);
  ctx.bezierCurveTo(55, 130, 82, 85, 132, 74);
  ctx.lineTo(175, 108);
  ctx.bezierCurveTo(210, 128, 250, 118, 290, 96);
  ctx.bezierCurveTo(355, 110, 415, 138, 426, 174);
  ctx.lineTo(426, 192);
  ctx.lineTo(68, 192);
  ctx.closePath();

  const grad = ctx.createLinearGradient(68, 74, 426, 192);
  grad.addColorStop(0, "#1d1d22");
  grad.addColorStop(0.65, "#2b2b33");
  grad.addColorStop(1, accentColor);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(64, 186);
  ctx.lineTo(430, 182);
  ctx.quadraticCurveTo(436, 206, 412, 212);
  ctx.lineTo(82, 214);
  ctx.quadraticCurveTo(60, 210, 64, 186);
  ctx.closePath();
  ctx.fillStyle = "#f4f4f6";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(136, 148);
  ctx.quadraticCurveTo(240, 165, 365, 145);
  ctx.lineTo(355, 162);
  ctx.quadraticCurveTo(240, 180, 130, 162);
  ctx.closePath();
  ctx.fillStyle = accentColor;
  ctx.fill();

  return canvas.toDataURL("image/png");
}

export function FootTryOnViewer({
  productName,
  modelUrl,
  modelRotation,
  accentColor = "#ff6a00",
}: FootTryOnViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const threeRef = useRef<{
    THREE: typeof THREE;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    rawScene: THREE.Group;
    leftShoe: THREE.Group | null;
    rightShoe: THREE.Group | null;
  } | null>(null);

  const leftPoseRef = useRef<FootPoseState>({
    initialized: false,
    x: 0,
    y: 0,
    angle: 0,
    scale: 1,
  });
  const rightPoseRef = useRef<FootPoseState>({
    initialized: false,
    x: 0,
    y: 0,
    angle: 0,
    scale: 1,
  });

  // UI state
  const [cameraActive, setCameraActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feetDetected, setFeetDetected] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);

  // Debug calibration state (?debug=1 or toggled via Debug button)
  const [debugOpen, setDebugOpen] = useState(false);
  const [baseRotation, setBaseRotation] = useState<[number, number, number]>(
    modelRotation ?? [-Math.PI / 2, 0, 0]
  );
  const [flipDirection, setFlipDirection] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "1") {
      setDebugOpen(true);
    }
  }, []);

  // Manual adjustment sliders (3D mode)
  const [scaleMultiplier, setScaleMultiplier] = useState(1.0);
  const [rotationOffsetDeg, setRotationOffsetDeg] = useState(0);
  const [heightOffsetPx, setHeightOffsetPx] = useState(0);

  const adjustmentsRef = useRef({
    scaleMultiplier: 1.0,
    rotationOffsetDeg: 0,
    heightOffsetPx: 0,
  });
  useEffect(() => {
    adjustmentsRef.current = {
      scaleMultiplier,
      rotationOffsetDeg,
      heightOffsetPx,
    };
  }, [scaleMultiplier, rotationOffsetDeg, heightOffsetPx]);

  // Rebuild normalized shoe meshes whenever debug baseRotation or flipDirection changes
  useEffect(() => {
    const three = threeRef.current;
    if (!three) return;

    if (three.leftShoe) three.scene.remove(three.leftShoe);
    if (three.rightShoe) three.scene.remove(three.rightShoe);

    const rightShoe = buildNormalizedShoeGroup(
      three.THREE,
      three.rawScene,
      baseRotation,
      flipDirection
    );
    const leftShoe = buildNormalizedShoeGroup(
      three.THREE,
      three.rawScene,
      baseRotation,
      flipDirection
    );
    rightShoe.visible = false;
    leftShoe.visible = false;
    three.scene.add(rightShoe);
    three.scene.add(leftShoe);

    three.rightShoe = rightShoe;
    three.leftShoe = leftShoe;
  }, [baseRotation, flipDirection]);

  // 2D PNG fallback state (when !modelUrl)
  const [fallbackPngUrl, setFallbackPngUrl] = useState<string>("");
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [overlayScale, setOverlayScale] = useState(1);
  const [overlayRotate, setOverlayRotate] = useState(0);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    if (!modelUrl) {
      setFallbackPngUrl(createFallbackShoePng(accentColor));
    }
  }, [modelUrl, accentColor]);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (threeRef.current) {
      const { renderer, leftShoe, rightShoe } = threeRef.current;
      if (leftShoe) leftShoe.visible = false;
      if (rightShoe) rightShoe.visible = false;
      renderer.dispose();
      threeRef.current = null;
    }
    if (poseLandmarkerRef.current) {
      poseLandmarkerRef.current.close();
      poseLandmarkerRef.current = null;
    }
    leftPoseRef.current.initialized = false;
    rightPoseRef.current.initialized = false;
    setFeetDetected(false);
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Sync Three.js orthographic camera & renderer size to container
  useEffect(() => {
    if (!cameraActive || !containerRef.current) return;

    const handleResize = () => {
      const container = containerRef.current;
      const three = threeRef.current;
      if (!container || !three) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      three.renderer.setSize(w, h, false);
      three.camera.left = -w / 2;
      three.camera.right = w / 2;
      three.camera.top = h / 2;
      three.camera.bottom = -h / 2;
      three.camera.updateProjectionMatrix();
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [cameraActive]);

  const initThreeAndModel = useCallback(
    async (glbUrl: string) => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      setLoadingModel(true);
      try {
        const THREE_NS = await import("three");
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );

        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        const renderer = new THREE_NS.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h, false);
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE_NS.Scene();
        const camera = new THREE_NS.OrthographicCamera(
          -w / 2,
          w / 2,
          h / 2,
          -h / 2,
          -2000,
          2000
        );
        camera.position.set(0, 0, 500);

        const ambient = new THREE_NS.AmbientLight(0xffffff, 1.5);
        scene.add(ambient);
        const dirLight = new THREE_NS.DirectionalLight(0xffffff, 1.6);
        dirLight.position.set(200, 400, 600);
        scene.add(dirLight);
        const rimLight = new THREE_NS.DirectionalLight(0xff8833, 0.6);
        rimLight.position.set(-200, -100, 300);
        scene.add(rimLight);

        const loader = new GLTFLoader();
        const gltf = await new Promise<{ scene: THREE.Group }>(
          (resolve, reject) => {
            loader.load(
              glbUrl,
              (loaded) => resolve(loaded),
              undefined,
              (err) => reject(err)
            );
          }
        );

        const rawScene = gltf.scene;
        const initialRot =
          modelRotation ?? computeAutoBaseRotation(THREE_NS, rawScene);
        setBaseRotation(initialRot);

        const rightShoe = buildNormalizedShoeGroup(
          THREE_NS,
          rawScene,
          initialRot,
          flipDirection
        );
        const leftShoe = buildNormalizedShoeGroup(
          THREE_NS,
          rawScene,
          initialRot,
          flipDirection
        );
        rightShoe.visible = false;
        leftShoe.visible = false;
        scene.add(rightShoe);
        scene.add(leftShoe);

        threeRef.current = {
          THREE: THREE_NS,
          renderer,
          scene,
          camera,
          rawScene,
          leftShoe,
          rightShoe,
        };
      } catch (err) {
        console.error("Failed to load 3D model:", err);
        setErrorMsg(
          `Could not load 3D model for ${productName}. Please check your connection or try again.`
        );
      } finally {
        setLoadingModel(false);
      }
    },
    [flipDirection, modelRotation, productName]
  );

  const initPoseLandmarker = useCallback(async () => {
    const { FilesetResolver, PoseLandmarker: PoseLandmarkerCls } = await import(
      "@mediapipe/tasks-vision"
    );
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

    try {
      return await PoseLandmarkerCls.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    } catch {
      return await PoseLandmarkerCls.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    }
  }, []);

  const projectLandmarkToWorld = (
    lm: NormalizedLandmark,
    cw: number,
    ch: number,
    vw: number,
    vh: number
  ) => {
    const coverScale = Math.max(cw / vw, ch / vh);
    const renderedW = vw * coverScale;
    const renderedH = vh * coverScale;
    const offsetX = (cw - renderedW) / 2;
    const offsetY = (ch - renderedH) / 2;

    const px = lm.x * renderedW + offsetX;
    const py = lm.y * renderedH + offsetY;

    return {
      x: px - cw / 2,
      y: ch / 2 - py,
    };
  };

  const updateFootShoe = (
    shoe: THREE.Group | null,
    poseState: FootPoseState,
    ankle: NormalizedLandmark | undefined,
    heel: NormalizedLandmark | undefined,
    toe: NormalizedLandmark | undefined,
    mirrorZ: boolean,
    cw: number,
    ch: number,
    vw: number,
    vh: number
  ): boolean => {
    if (!shoe) return false;
    if (
      !isLandmarkVisible(ankle) ||
      !isLandmarkVisible(heel) ||
      !isLandmarkVisible(toe)
    ) {
      shoe.visible = false;
      poseState.initialized = false;
      return false;
    }

    const heelW = projectLandmarkToWorld(heel, cw, ch, vw, vh);
    const toeW = projectLandmarkToWorld(toe, cw, ch, vw, vh);

    const {
      scaleMultiplier: sMult,
      rotationOffsetDeg: rotDeg,
      heightOffsetPx: yOff,
    } = adjustmentsRef.current;

    const dx = toeW.x - heelW.x;
    const dy = toeW.y - heelW.y;
    const heelToeDist = Math.hypot(dx, dy);

    // Auto-fit: shoe length = heel->toe distance * 1.15 * user scale multiplier
    const targetScale = Math.max(24, heelToeDist * AUTO_FIT_LENGTH_RATIO * sMult);
    const targetAngle = Math.atan2(dy, dx) + (rotDeg * Math.PI) / 180;

    // Pivot is at heel end (x = 0) and normalized shoe length is 1.0 (extends to +1).
    // Center the shoe over the heel->toe segment by stepping back half of the 15% overhang:
    const midX = (heelW.x + toeW.x) / 2;
    const midY = (heelW.y + toeW.y) / 2 + yOff;
    const targetX = midX - Math.cos(targetAngle) * (targetScale * 0.5);
    const targetY = midY - Math.sin(targetAngle) * (targetScale * 0.5);

    if (!poseState.initialized) {
      poseState.x = targetX;
      poseState.y = targetY;
      poseState.angle = targetAngle;
      poseState.scale = targetScale;
      poseState.initialized = true;
    } else {
      poseState.x = lerp(poseState.x, targetX, SMOOTHING_ALPHA);
      poseState.y = lerp(poseState.y, targetY, SMOOTHING_ALPHA);
      poseState.angle = lerpAngle(poseState.angle, targetAngle, SMOOTHING_ALPHA);
      poseState.scale = lerp(poseState.scale, targetScale, SMOOTHING_ALPHA);
    }

    shoe.visible = true;
    shoe.position.set(poseState.x, poseState.y, 0);
    shoe.rotation.set(0, 0, poseState.angle);
    // Mirror along Z for left vs right foot so +X (heel->toe) & +Y (sole->ankle) never invert
    shoe.scale.set(
      poseState.scale,
      poseState.scale,
      mirrorZ ? -poseState.scale : poseState.scale
    );

    return true;
  };

  const startTrackingLoop = useCallback(() => {
    const step = () => {
      const video = videoRef.current;
      const container = containerRef.current;
      const landmarker = poseLandmarkerRef.current;
      const three = threeRef.current;

      if (
        video &&
        container &&
        landmarker &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const result = landmarker.detectForVideo(video, performance.now());
          const landmarks = result.landmarks?.[0];

          const cw = container.clientWidth;
          const ch = container.clientHeight;
          const vw = video.videoWidth;
          const vh = video.videoHeight;

          if (three) {
            if (landmarks) {
              const leftVisible = updateFootShoe(
                three.leftShoe,
                leftPoseRef.current,
                landmarks[LEFT_ANKLE],
                landmarks[LEFT_HEEL],
                landmarks[LEFT_TOE],
                true,
                cw,
                ch,
                vw,
                vh
              );
              const rightVisible = updateFootShoe(
                three.rightShoe,
                rightPoseRef.current,
                landmarks[RIGHT_ANKLE],
                landmarks[RIGHT_HEEL],
                landmarks[RIGHT_TOE],
                false,
                cw,
                ch,
                vw,
                vh
              );
              setFeetDetected(leftVisible || rightVisible);
            } else {
              if (three.leftShoe) three.leftShoe.visible = false;
              if (three.rightShoe) three.rightShoe.visible = false;
              leftPoseRef.current.initialized = false;
              rightPoseRef.current.initialized = false;
              setFeetDetected(false);
            }
            three.renderer.render(three.scene, three.camera);
          } else if (landmarks) {
            const anyFoot =
              (isLandmarkVisible(landmarks[LEFT_ANKLE]) &&
                isLandmarkVisible(landmarks[LEFT_HEEL]) &&
                isLandmarkVisible(landmarks[LEFT_TOE])) ||
              (isLandmarkVisible(landmarks[RIGHT_ANKLE]) &&
                isLandmarkVisible(landmarks[RIGHT_HEEL]) &&
                isLandmarkVisible(landmarks[RIGHT_TOE]));
            setFeetDetected(anyFoot);
          }
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, []);

  const handleStartCamera = useCallback(async () => {
    setErrorMsg(null);
    setStarting(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (envErr) {
        const name = envErr instanceof DOMException ? envErr.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          throw envErr;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      const [landmarker] = await Promise.all([
        initPoseLandmarker(),
        modelUrl ? initThreeAndModel(modelUrl) : Promise.resolve(),
      ]);

      poseLandmarkerRef.current = landmarker;
      startTrackingLoop();
    } catch (err) {
      stopCamera();
      const domName = err instanceof DOMException ? err.name : "";
      if (domName === "NotAllowedError" || domName === "PermissionDeniedError") {
        setErrorMsg(
          "Camera permission was denied. Please allow camera access in your browser settings and try again."
        );
      } else if (
        domName === "NotFoundError" ||
        domName === "DevicesNotFoundError"
      ) {
        setErrorMsg("No camera device was found on this device.");
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Unable to start camera or pose tracking."
        );
      }
    } finally {
      setStarting(false);
    }
  }, [
    initPoseLandmarker,
    initThreeAndModel,
    modelUrl,
    startTrackingLoop,
    stopCamera,
  ]);

  const handleResetAdjustments = () => {
    setScaleMultiplier(1.0);
    setRotationOffsetDeg(0);
    setHeightOffsetPx(0);
    setOverlayPos({ x: 0, y: 0 });
    setOverlayScale(1);
    setOverlayRotate(0);
  };

  const rotateAxis90 = (axis: 0 | 1 | 2) => {
    setBaseRotation((prev) => {
      const next: [number, number, number] = [...prev];
      next[axis] = Number((next[axis] + Math.PI / 2).toFixed(4));
      return next;
    });
  };

  const effectiveRotation: [number, number, number] = [
    Number(baseRotation[0].toFixed(4)),
    Number((baseRotation[1] + (flipDirection ? Math.PI : 0)).toFixed(4)),
    Number(baseRotation[2].toFixed(4)),
  ];

  const handleCopyRotation = async () => {
    const snippet = `modelRotation: [${effectiveRotation.join(", ")}]`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 1800);
    } catch {
      // Clipboard may be unavailable in non-HTTPS contexts
    }
  };

  // Pointer drag handlers for 2D PNG fallback
  const onPointerDown2D = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: overlayPos.x,
      origY: overlayPos.y,
    };
  };

  const onPointerMove2D = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    setOverlayPos({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
    });
  };

  const onPointerUp2D = () => {
    dragRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[calc(100dvh-4rem)] overflow-hidden bg-black select-none"
    >
      {/* Full-screen background camera feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          cameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Three.js transparent canvas overlay (3D GLB mode) */}
      {modelUrl && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full pointer-events-none z-10"
        />
      )}

      {/* 2D transparent PNG fallback overlay (when product has no .glb) */}
      {!modelUrl && fallbackPngUrl && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            onPointerDown={onPointerDown2D}
            onPointerMove={onPointerMove2D}
            onPointerUp={onPointerUp2D}
            onPointerCancel={onPointerUp2D}
            style={{
              transform: `translate(${overlayPos.x}px, ${overlayPos.y}px) rotate(${overlayRotate}deg) scale(${overlayScale})`,
            }}
            className="pointer-events-auto cursor-grab active:cursor-grabbing touch-none p-2 rounded-2xl border border-dashed border-neon/50 bg-black/10 backdrop-blur-[1px]"
            title="Drag to position shoe on your foot"
          >
            <img
              src={fallbackPngUrl}
              alt={`${productName} 2D try-on overlay`}
              draggable={false}
              className="w-64 sm:w-80 h-auto pointer-events-none drop-shadow-2xl"
            />
            <span className="mt-1 flex items-center justify-center gap-1 text-[10px] tracking-widest uppercase text-neon/90">
              <Move className="h-3 w-3" /> Drag · Resize · Rotate
            </span>
          </div>
        </div>
      )}

      {/* Pre-camera landing / error state */}
      {!cameraActive && !errorMsg && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-background/90 via-background/80 to-background">
          <div className="max-w-md rounded-3xl border border-border bg-surface/90 p-7 backdrop-blur-md shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neon/15 text-neon">
              <Camera className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-display font-bold">
              Virtual Foot Try-On
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Point your camera at your feet to preview{" "}
              <span className="text-foreground font-medium">{productName}</span>{" "}
              in real time.
              {!modelUrl &&
                " This product uses a 2D PNG overlay — drag, resize, and rotate to fit your foot."}
            </p>
            <button
              type="button"
              onClick={handleStartCamera}
              disabled={starting}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-neon px-6 py-3.5 text-sm font-semibold text-neon-foreground hover:opacity-90 disabled:opacity-60 transition cursor-pointer"
            >
              {starting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting camera...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Start camera
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Friendly error banner */}
      {errorMsg && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-destructive/40 bg-surface p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-display font-bold">Try-On Unavailable</h3>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
            <button
              type="button"
              onClick={handleStartCamera}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-neon px-5 py-2.5 text-sm font-semibold text-neon-foreground hover:opacity-90 cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Top HUD status */}
      {cameraActive && (
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-black/65 px-3.5 py-1.5 text-xs backdrop-blur-md">
            <span
              className={`h-2 w-2 rounded-full ${
                feetDetected ? "bg-emerald-400 animate-pulse" : "bg-neon"
              }`}
            />
            <span className="text-foreground font-medium">
              {loadingModel
                ? "Loading 3D shoe..."
                : feetDetected
                  ? "Feet tracked"
                  : "Point camera at your feet"}
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {modelUrl && (
              <button
                type="button"
                onClick={() => setDebugOpen((d) => !d)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur-md cursor-pointer ${
                  debugOpen
                    ? "border-neon bg-neon/20 text-neon"
                    : "border-border bg-black/65 text-foreground hover:border-neon"
                }`}
              >
                <Bug className="h-3.5 w-3.5" />
                Debug
              </button>
            )}
            <button
              type="button"
              onClick={() => setControlsOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-black/65 px-3.5 py-1.5 text-xs text-foreground hover:border-neon backdrop-blur-md cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-neon" />
              Adjust
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-black/65 px-3.5 py-1.5 text-xs text-foreground hover:border-destructive hover:text-destructive backdrop-blur-md cursor-pointer"
            >
              <CameraOff className="h-3.5 w-3.5" />
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Debug orientation calibration panel (?debug=1 or Debug toggle) */}
      {cameraActive && modelUrl && debugOpen && (
        <div className="absolute top-16 right-4 z-20 w-72 rounded-2xl border border-neon/40 bg-black/85 p-3.5 backdrop-blur-md text-xs shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold uppercase tracking-wider text-neon text-[10px]">
              Model Orientation Debug
            </span>
            <button
              type="button"
              onClick={handleCopyRotation}
              className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/20 cursor-pointer"
            >
              {copiedConfig ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={() => rotateAxis90(0)}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 hover:border-neon cursor-pointer"
            >
              Rotate X 90°
            </button>
            <button
              type="button"
              onClick={() => rotateAxis90(1)}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 hover:border-neon cursor-pointer"
            >
              Rotate Y 90°
            </button>
            <button
              type="button"
              onClick={() => rotateAxis90(2)}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 hover:border-neon cursor-pointer"
            >
              Rotate Z 90°
            </button>
            <button
              type="button"
              onClick={() => setFlipDirection((f) => !f)}
              className={`rounded-lg border px-2.5 py-1.5 cursor-pointer ${
                flipDirection
                  ? "border-neon bg-neon/20 text-neon"
                  : "border-border bg-surface hover:border-neon"
              }`}
            >
              Flip direction
            </button>
          </div>

          <div className="rounded-lg bg-black/60 p-2 font-mono text-[10px] text-muted-foreground break-all">
            modelRotation: [{effectiveRotation.join(", ")}]
          </div>
        </div>
      )}

      {/* Bottom manual adjustment controls */}
      {controlsOpen && (cameraActive || !modelUrl) && !errorMsg && (
        <div className="absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-lg rounded-2xl border border-border bg-black/75 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neon">
              {modelUrl ? "3D Fit Controls" : "2D PNG Overlay Controls"}
            </span>
            <button
              type="button"
              onClick={handleResetAdjustments}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          {modelUrl ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-muted-foreground">
                  <span>Scale</span>
                  <span className="text-foreground">{scaleMultiplier.toFixed(2)}x</span>
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={scaleMultiplier}
                  onChange={(e) => setScaleMultiplier(parseFloat(e.target.value))}
                  className="accent-neon"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-muted-foreground">
                  <span>Rotation</span>
                  <span className="text-foreground">{rotationOffsetDeg}°</span>
                </span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotationOffsetDeg}
                  onChange={(e) => setRotationOffsetDeg(parseInt(e.target.value, 10))}
                  className="accent-neon"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-muted-foreground">
                  <span>Height</span>
                  <span className="text-foreground">{heightOffsetPx}px</span>
                </span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={2}
                  value={heightOffsetPx}
                  onChange={(e) => setHeightOffsetPx(parseInt(e.target.value, 10))}
                  className="accent-neon"
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-muted-foreground">
                  <span>Resize</span>
                  <span className="text-foreground">{overlayScale.toFixed(2)}x</span>
                </span>
                <input
                  type="range"
                  min={0.4}
                  max={2.5}
                  step={0.05}
                  value={overlayScale}
                  onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                  className="accent-neon"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-muted-foreground">
                  <span>Rotate</span>
                  <span className="text-foreground">{overlayRotate}°</span>
                </span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={overlayRotate}
                  onChange={(e) => setOverlayRotate(parseInt(e.target.value, 10))}
                  className="accent-neon"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
