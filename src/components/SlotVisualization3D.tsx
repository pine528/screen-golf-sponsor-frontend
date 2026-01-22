import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';

interface SlotVisualization3DProps {
  slotType: 'SHIRT_FRONT' | 'SHIRT_BACK' | 'SHIRT_SLEEVE' | 'CAP_FRONT' | 'CAP_SIDE';
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_LOGO = '/ccubelogo.png';

// 티셔츠 형태 Shape (2D 실루엣)
function createShirtShape() {
  const shape = new THREE.Shape();

  // 티셔츠 윤곽선 (왼쪽 아래에서 시작, 시계방향)
  shape.moveTo(-0.6, -1.0);   // 왼쪽 아래
  shape.lineTo(-0.6, 0.3);    // 왼쪽 허리
  shape.lineTo(-1.1, 0.5);    // 왼쪽 소매 아래
  shape.lineTo(-1.1, 0.8);    // 왼쪽 소매 끝
  shape.lineTo(-0.7, 0.9);    // 왼쪽 어깨
  shape.lineTo(-0.25, 1.0);   // 왼쪽 목
  shape.lineTo(0, 0.85);      // 목 중앙 (V넥)
  shape.lineTo(0.25, 1.0);    // 오른쪽 목
  shape.lineTo(0.7, 0.9);     // 오른쪽 어깨
  shape.lineTo(1.1, 0.8);     // 오른쪽 소매 끝
  shape.lineTo(1.1, 0.5);     // 오른쪽 소매 아래
  shape.lineTo(0.6, 0.3);     // 오른쪽 허리
  shape.lineTo(0.6, -1.0);    // 오른쪽 아래
  shape.lineTo(-0.6, -1.0);   // 아래 닫기

  return shape;
}

// 모자 크라운 Shape
function createCapCrownShape() {
  const shape = new THREE.Shape();

  // 6각형 기반의 모자 크라운
  const segments = 32;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI;
    const x = Math.cos(angle) * 0.9;
    const y = Math.sin(angle) * 0.6;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.lineTo(-0.9, 0);

  return shape;
}

// 로고 텍스처 컴포넌트
function LogoPlane({ logoUrl, width, height }: { logoUrl: string; width: number; height: number }) {
  const texture = useLoader(THREE.TextureLoader, logoUrl || DEFAULT_LOGO);

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

// 티셔츠 3D
function Shirt3D({ logoPosition, logoUrl }: { logoPosition: 'front' | 'back' | 'sleeve'; logoUrl?: string }) {
  const shirtShape = useMemo(() => createShirtShape(), []);
  const isBack = logoPosition === 'back';

  const extrudeSettings = {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  };

  return (
    <group rotation={[0, isBack ? Math.PI : 0, 0]}>
      {/* 셔츠 본체 */}
      <mesh position={[0, 0, -0.04]}>
        <extrudeGeometry args={[shirtShape, extrudeSettings]} />
        <meshPhysicalMaterial
          color="#f1f5f9"
          transparent
          opacity={0.6}
          roughness={0.3}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 로고 - 정면 가슴 */}
      {logoPosition === 'front' && (
        <group position={[-0.25, 0.35, 0.06]}>
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.35} height={0.28} />
        </group>
      )}

      {/* 로고 - 등판 */}
      {logoPosition === 'back' && (
        <group position={[0, 0.1, 0.06]}>
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.6} height={0.45} />
        </group>
      )}

      {/* 로고 - 소매 */}
      {logoPosition === 'sleeve' && (
        <group position={[-0.9, 0.65, 0.06]}>
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.22} height={0.18} />
        </group>
      )}
    </group>
  );
}

// 모자 3D
function Cap3D({ logoPosition, logoUrl }: { logoPosition: 'front' | 'side'; logoUrl?: string }) {
  const crownShape = useMemo(() => createCapCrownShape(), []);

  return (
    <group rotation={[0.15, logoPosition === 'side' ? -0.6 : 0, 0]} position={[0, 0.2, 0]}>
      {/* 모자 크라운 (반구형) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
        <extrudeGeometry args={[crownShape, { depth: 0.7, bevelEnabled: false }]} />
        <meshPhysicalMaterial
          color="#1e3a5f"
          transparent
          opacity={0.7}
          roughness={0.4}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 모자 챙 */}
      <mesh position={[0, 0, 0.6]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.6]} />
        <meshPhysicalMaterial
          color="#1e3a5f"
          transparent
          opacity={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* 챙 끝 라운드 */}
      <mesh position={[0, 0, 0.88]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 32, 1, false, 0, Math.PI]} />
        <meshPhysicalMaterial
          color="#1e3a5f"
          transparent
          opacity={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* 모자 밴드 */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88, 0.05, 8, 32, Math.PI]} />
        <meshPhysicalMaterial
          color="#0f172a"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 로고 - 정면 */}
      {logoPosition === 'front' && (
        <group position={[0, 0.5, 0.55]} rotation={[-0.3, 0, 0]}>
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.45} height={0.35} />
        </group>
      )}

      {/* 로고 - 측면 */}
      {logoPosition === 'side' && (
        <group position={[0.7, 0.45, 0.2]} rotation={[0, Math.PI / 2.5, 0]}>
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.35} height={0.28} />
        </group>
      )}
    </group>
  );
}

// 로딩 폴백
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="#e2e8f0" transparent opacity={0.5} />
    </mesh>
  );
}

// 메인 컴포넌트
export default function SlotVisualization3D({ slotType, logoUrl, size = 'md' }: SlotVisualization3DProps) {
  const sizeClasses = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64',
  };

  const isCap = slotType.startsWith('CAP');
  const logoPosition = slotType.includes('FRONT')
    ? 'front'
    : slotType.includes('BACK')
    ? 'back'
    : slotType.includes('SLEEVE')
    ? 'sleeve'
    : 'side';

  const getSlotLabel = () => {
    switch (slotType) {
      case 'CAP_FRONT':
        return '모자 정면';
      case 'CAP_SIDE':
        return '모자 측면';
      case 'SHIRT_FRONT':
        return '셔츠 정면';
      case 'SHIRT_BACK':
        return '셔츠 등판';
      case 'SHIRT_SLEEVE':
        return '셔츠 소매';
      default:
        return slotType;
    }
  };

  return (
    <div className={`w-full ${sizeClasses[size]} bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg overflow-hidden relative`}>
      <Canvas
        camera={{ position: [0, 0, isCap ? 2.8 : 3.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 5]} intensity={0.5} />
          <directionalLight position={[-3, 3, -3]} intensity={0.3} />

          {isCap ? (
            <Cap3D logoPosition={logoPosition as 'front' | 'side'} logoUrl={logoUrl} />
          ) : (
            <Shirt3D logoPosition={logoPosition as 'front' | 'back' | 'sleeve'} logoUrl={logoUrl} />
          )}

          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.3}
            scale={4}
            blur={2}
            far={2}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate
            autoRotateSpeed={0.6}
          />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 shadow-sm">
        {getSlotLabel()}
      </div>

      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-slate-500">
        드래그로 회전
      </div>
    </div>
  );
}
