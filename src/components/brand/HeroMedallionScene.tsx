'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Group, Mesh, PerspectiveCamera, Points, Scene, WebGLRenderer } from 'three';
import Image from 'next/image';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function HeroMedallionScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  useEffect(() => {
    if (reducedMotion || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    let animationFrameId: number | undefined;
    let renderer: WebGLRenderer | undefined;
    let scene: Scene | undefined;
    let camera: PerspectiveCamera | undefined;
    let medallionGroup: Group | undefined;
    let ringOuter: Mesh | undefined;
    let ringInner: Mesh | undefined;
    let particlesMesh: Points | undefined;
    const eventController = new AbortController();

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 440;

    let isMounted = true;

    async function initThree() {
      try {
        const THREE = await import('three');

        if (!isMounted) return;

        // 1. Scene setup
        scene = new THREE.Scene();

        // 2. Camera setup
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 7.5);

        // 3. Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        if (!container || !isMounted) return;
        container.appendChild(renderer.domElement);

        // 4. Lighting setup
        const ambientLight = new THREE.AmbientLight(0x0b172d, 2.5);
        scene.add(ambientLight);

        // Main Gold Key Light
        const goldKeyLight = new THREE.DirectionalLight(0xf4e4c1, 3.5);
        goldKeyLight.position.set(5, 6, 6);
        scene.add(goldKeyLight);

        // Sapphire Fill Light
        const sapphireFillLight = new THREE.DirectionalLight(0x2f7bff, 3.0);
        sapphireFillLight.position.set(-5, -4, 4);
        scene.add(sapphireFillLight);

        // Rim Gold Light
        const goldRimLight = new THREE.PointLight(0xddbc83, 4.0, 10);
        goldRimLight.position.set(0, 4, -3);
        scene.add(goldRimLight);

        // 5. Build 3D Medallion Group
        medallionGroup = new THREE.Group();

        // A. Bezel Gold Ring (Outer Rim)
        const rimGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.35, 64);
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xddbc83,
          metalness: 0.85,
          roughness: 0.2,
        });
        const rimMesh = new THREE.Mesh(rimGeo, goldMat);
        rimMesh.rotation.x = Math.PI / 2;
        medallionGroup.add(rimMesh);

        // B. Sapphire Inner Face (Front & Back)
        const faceGeo = new THREE.CylinderGeometry(1.9, 1.9, 0.38, 64);
        const sapphireMat = new THREE.MeshStandardMaterial({
          color: 0x0a1326,
          metalness: 0.5,
          roughness: 0.3,
        });
        const faceMesh = new THREE.Mesh(faceGeo, sapphireMat);
        faceMesh.rotation.x = Math.PI / 2;
        medallionGroup.add(faceMesh);

        // C. Central Monogram Emblem / Star Geometric Feature
        const starShape = new THREE.Shape();
        const numPoints = 8;
        const outerRadius = 1.1;
        const innerRadius = 0.55;
        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i / (numPoints * 2)) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) starShape.moveTo(x, y);
          else starShape.lineTo(x, y);
        }
        starShape.closePath();

        const extrudeSettings = {
          depth: 0.12,
          bevelEnabled: true,
          bevelSegments: 4,
          steps: 1,
          bevelSize: 0.04,
          bevelThickness: 0.04,
        };
        const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
        starGeo.center();

        const goldStarMat = new THREE.MeshStandardMaterial({
          color: 0xf4e4c1,
          metalness: 0.9,
          roughness: 0.15,
        });

        // Front Emblem
        const frontStar = new THREE.Mesh(starGeo, goldStarMat);
        frontStar.position.z = 0.22;
        medallionGroup.add(frontStar);

        // Back Emblem
        const backStar = new THREE.Mesh(starGeo, goldStarMat);
        backStar.position.z = -0.22;
        backStar.rotation.y = Math.PI;
        medallionGroup.add(backStar);

        scene.add(medallionGroup);

        // 6. Concentric Orbital Rings
        const ringOuterGeo = new THREE.TorusGeometry(2.9, 0.02, 16, 100);
        const ringGoldMat = new THREE.MeshBasicMaterial({
          color: 0xddbc83,
          transparent: true,
          opacity: 0.45,
        });
        ringOuter = new THREE.Mesh(ringOuterGeo, ringGoldMat);
        scene.add(ringOuter);

        const ringInnerGeo = new THREE.TorusGeometry(3.4, 0.015, 16, 100);
        const ringSapphireMat = new THREE.MeshBasicMaterial({
          color: 0x2f7bff,
          transparent: true,
          opacity: 0.35,
        });
        ringInner = new THREE.Mesh(ringInnerGeo, ringSapphireMat);
        ringInner.rotation.x = Math.PI / 3;
        scene.add(ringInner);

        // 7. Ambient Particle Field
        const particlesCount = 180;
        const posArray = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount * 3; i++) {
          posArray[i] = (Math.random() - 0.5) * 10;
        }
        const particlesGeo = new THREE.BufferGeometry();
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMat = new THREE.PointsMaterial({
          size: 0.035,
          color: 0xddbc83,
          transparent: true,
          opacity: 0.6,
        });
        particlesMesh = new THREE.Points(particlesGeo, particlesMat);
        scene.add(particlesMesh);

        // Mouse interaction tracking
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const handleMouseMove = (event: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          targetX = (x / rect.width) * 0.6;
          targetY = (y / rect.height) * 0.6;
        };

        window.addEventListener('mousemove', handleMouseMove, {
          signal: eventController.signal,
        });

        // Handle Resize
        const handleResize = () => {
          if (!camera || !renderer) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize, {
          signal: eventController.signal,
        });

        // 8. Animation loop
        const timer = new THREE.Clock();
        const animate = () => {
          if (!isMounted) return;
          animationFrameId = requestAnimationFrame(animate);

          const elapsedTime = timer.getElapsedTime();

          // Smooth lerp mouse rotation
          mouseX += (targetX - mouseX) * 0.05;
          mouseY += (targetY - mouseY) * 0.05;

          if (medallionGroup) {
            medallionGroup.rotation.y = elapsedTime * 0.35 + mouseX;
            medallionGroup.rotation.x = Math.sin(elapsedTime * 0.5) * 0.12 + mouseY;
          }

          if (ringOuter) {
            ringOuter.rotation.z = elapsedTime * 0.15;
            ringOuter.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;
          }

          if (ringInner) {
            ringInner.rotation.z = -elapsedTime * 0.2;
            ringInner.rotation.y = Math.cos(elapsedTime * 0.25) * 0.2;
          }

          if (particlesMesh) {
            particlesMesh.rotation.y = elapsedTime * 0.04;
          }

          if (renderer && scene && camera) renderer.render(scene, camera);
        };

        animate();
      } catch (err) {
        console.warn('WebGL initialization failed, falling back to 2D image:', err);
        if (isMounted) setWebglSupported(false);
      }
    }

    void initThree();

    return () => {
      isMounted = false;
      eventController.abort();
      if (animationFrameId !== undefined) cancelAnimationFrame(animationFrameId);
      if (renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, [reducedMotion]);

  if (reducedMotion || !webglSupported) {
    return (
      <div className="w-full max-w-lg relative group animate-medallion">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#2f7bff] via-[#ddbc83] to-[#0e3d83] rounded-3xl blur-xl opacity-35"></div>
        <div className="relative card-solid p-3 rounded-3xl overflow-hidden border border-[#ddbc83]/40 bg-[#05070d]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ddbc83] via-[#f4e4c1] to-[#ddbc83]" />
          <div className="relative overflow-hidden rounded-2xl border border-[#ddbc83]/20">
            <Image
              src="/banner_hero.webp"
              alt="Notorius Medallion"
              width={1200}
              height={675}
              priority
              quality={95}
              className="w-full h-auto object-cover rounded-2xl"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[480px] h-[440px] flex items-center justify-center">
      {/* Background Ornate Glow */}
      <div className="absolute w-[360px] h-[360px] bg-radial from-[#2f7bff]/20 via-[#ddbc83]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
