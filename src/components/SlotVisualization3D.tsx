import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Line } from '@react-three/drei';
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

// 모자 챙(Bill) 형태 생성 - 부드러운 곡선형 (bezierCurve)
function createBillShape() {
  const shape = new THREE.Shape();

  // 더 자연스러운 곡선 (bezierCurveTo 사용)
  shape.moveTo(-0.58, 0);
  shape.bezierCurveTo(-0.62, 0.25, -0.45, 0.55, 0, 0.72);
  shape.bezierCurveTo(0.45, 0.55, 0.62, 0.25, 0.58, 0);
  shape.lineTo(-0.58, 0);

  return shape;
}

// 크라운 파라미터
const CROWN = {
  radius: 0.65,
  height: 0.48,
  squash: 0.88,
  segments: 48,
};

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

// 6패널 스티칭 라인 생성 (은은하게)
function PanelSeams({ radius, height, squash }: { radius: number; height: number; squash: number }) {
  const seams = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const panels = 6;

    for (let i = 0; i < panels; i++) {
      const angle = (i / panels) * Math.PI * 2;
      const points: THREE.Vector3[] = [];

      // 아래에서 꼭대기 버튼까지 곡선 (압축 적용)
      for (let t = 0; t <= 1; t += 0.08) {
        const currentRadius = radius * Math.cos(t * Math.PI / 2);
        const y = height * Math.sin(t * Math.PI / 2) * squash;
        const x = Math.sin(angle) * currentRadius;
        const z = Math.cos(angle) * currentRadius;
        points.push(new THREE.Vector3(x, y, z));
      }
      lines.push(points);
    }
    return lines;
  }, [radius, height, squash]);

  return (
    <>
      {seams.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#E8E8E6"
          lineWidth={0.8}
          transparent
          opacity={0.4}
        />
      ))}
    </>
  );
}

// 모자 3D - 반투명 패브릭 스타일 베이스볼 캡
function Cap3D({ logoPosition, logoUrl }: { logoPosition: 'front' | 'side'; logoUrl?: string }) {
  const billShape = useMemo(() => createBillShape(), []);

  // 패브릭 반투명 머티리얼 - 플라스틱 방지
  const fabricMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#F4F4F2',           // 아이보리 화이트
    transparent: true,
    opacity: 0.65,              // 0.55~0.75 범위
    roughness: 0.82,            // 0.75~0.9 (무광 패브릭)
    metalness: 0,
    transmission: 0,            // 플라스틱 방지
    ior: 1.0,
    sheen: 0.15,                // 패브릭 광택
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color('#FAFAFA'),
    side: THREE.DoubleSide,
    depthWrite: false,
    alphaTest: 0.01,
  }), []);

  // 챙 머티리얼 (약간 더 불투명)
  const brimMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#F4F4F2',
    transparent: true,
    opacity: 0.72,
    roughness: 0.78,
    metalness: 0,
    sheen: 0.12,
    sheenRoughness: 0.85,
    sheenColor: new THREE.Color('#FAFAFA'),
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  const crownHeightAdjusted = CROWN.height * CROWN.squash;

  return (
    <group rotation={[0.2, logoPosition === 'side' ? -0.5 : 0, 0]} position={[0, -0.1, 0]}>
      {/* 크라운 (반구형 돔) - Y축 압축으로 자연스러운 형태 */}
      <mesh position={[0, 0, 0]} scale={[1, CROWN.squash, 1]}>
        <sphereGeometry args={[CROWN.radius, CROWN.segments, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={fabricMaterial} />
      </mesh>

      {/* 6패널 스티칭 라인 (은은하게) */}
      <group position={[0, 0, 0]}>
        <PanelSeams radius={CROWN.radius} height={CROWN.height} squash={CROWN.squash} />
      </group>

      {/* 꼭대기 버튼 */}
      <mesh position={[0, crownHeightAdjusted + 0.015, 0]}>
        <cylinderGeometry args={[0.038, 0.042, 0.025, 16]} />
        <meshPhysicalMaterial
          color="#F0F0EE"
          transparent
          opacity={0.85}
          roughness={0.7}
          metalness={0}
        />
      </mesh>
      {/* 버튼 중앙 디테일 */}
      <mesh position={[0, crownHeightAdjusted + 0.028, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.005, 12]} />
        <meshBasicMaterial color="#E8E8E6" transparent opacity={0.6} />
      </mesh>

      {/* 통풍구 (아일릿) - 4개로 축소, 크기 감소 */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const eyeletY = crownHeightAdjusted * 0.65;
        const eyeletRadius = CROWN.radius * 0.82;
        return (
          <mesh
            key={i}
            position={[
              Math.sin(angle) * eyeletRadius,
              eyeletY,
              Math.cos(angle) * eyeletRadius,
            ]}
            rotation={[0, -angle, 0]}
          >
            <torusGeometry args={[0.018, 0.004, 6, 12]} />
            <meshBasicMaterial color="#D4D4D2" transparent opacity={0.6} />
          </mesh>
        );
      })}

      {/* 챙 (Bill) - 곡선형, 아래로 휘어짐 */}
      <group position={[0, -0.02, CROWN.radius * 0.68]} rotation={[-0.18, 0, 0]}>
        {/* 챙 본체 */}
        <mesh>
          <extrudeGeometry
            args={[
              billShape,
              {
                depth: 0.028,
                bevelEnabled: true,
                bevelThickness: 0.008,
                bevelSize: 0.008,
                bevelSegments: 2,
              },
            ]}
          />
          <primitive object={brimMaterial} />
        </mesh>
        {/* 챙 테두리 스티칭 */}
        <mesh position={[0, 0, 0.015]}>
          <extrudeGeometry
            args={[
              billShape,
              {
                depth: 0.002,
                bevelEnabled: false,
              },
            ]}
          />
          <meshBasicMaterial color="#E8E8E6" transparent opacity={0.35} wireframe />
        </mesh>
      </group>

      {/* 스웨트밴드 (안쪽 밴드) - 얇게 */}
      <mesh position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CROWN.radius - 0.015, 0.032, 8, 32]} />
        <meshPhysicalMaterial
          color="#FAFAF8"
          transparent
          opacity={0.55}
          roughness={0.75}
          metalness={0}
        />
      </mesh>

      {/* 로고 - 정면 */}
      {logoPosition === 'front' && (
        <group position={[0, crownHeightAdjusted * 0.55, CROWN.radius * 0.68]} rotation={[-0.12, 0, 0]}>
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.32} height={0.26} />
        </group>
      )}

      {/* 로고 - 측면 */}
      {logoPosition === 'side' && (
        <group
          position={[CROWN.radius * 0.68, crownHeightAdjusted * 0.55, CROWN.radius * 0.28]}
          rotation={[0, Math.PI / 3, 0]}
        >
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.28} height={0.22} />
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
          {/* 부드러운 조명 (하이라이트 최소화) */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 4, 3]} intensity={0.35} />
          <directionalLight position={[-2, 2, -2]} intensity={0.2} />

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
