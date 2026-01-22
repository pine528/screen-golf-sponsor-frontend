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

// 모자 챙(Bill) 형태 생성 - 곡선형
function createBillShape() {
  const shape = new THREE.Shape();

  // 챙의 2D 형태 (위에서 본 모양) - 반원형으로 앞으로 뻗어나감
  shape.moveTo(-0.65, 0);
  shape.quadraticCurveTo(-0.7, 0.5, 0, 0.8);  // 왼쪽 곡선
  shape.quadraticCurveTo(0.7, 0.5, 0.65, 0);   // 오른쪽 곡선
  shape.lineTo(-0.65, 0);

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

// 6패널 스티칭 라인 생성
function PanelSeams({ radius, height }: { radius: number; height: number }) {
  const seams = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const panels = 6;

    for (let i = 0; i < panels; i++) {
      const angle = (i / panels) * Math.PI * 2;
      const points: THREE.Vector3[] = [];

      // 아래에서 꼭대기 버튼까지 곡선
      for (let t = 0; t <= 1; t += 0.1) {
        const currentRadius = radius * Math.cos(t * Math.PI / 2);
        const y = height * Math.sin(t * Math.PI / 2);
        const x = Math.sin(angle) * currentRadius;
        const z = Math.cos(angle) * currentRadius;
        points.push(new THREE.Vector3(x, y, z));
      }
      lines.push(points);
    }
    return lines;
  }, [radius, height]);

  return (
    <>
      {seams.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#94a3b8"
          lineWidth={1}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  );
}

// 모자 3D - 실제 야구 모자 형태
function Cap3D({ logoPosition, logoUrl }: { logoPosition: 'front' | 'side'; logoUrl?: string }) {
  const billShape = useMemo(() => createBillShape(), []);

  const crownRadius = 0.7;
  const crownHeight = 0.55;

  // 모자 머티리얼 (흰색 반투명)
  const capMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.5,
    roughness: 0.4,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  const seamMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#cbd5e1',
    transparent: true,
    opacity: 0.7,
  }), []);

  return (
    <group rotation={[0.2, logoPosition === 'side' ? -0.5 : 0, 0]} position={[0, -0.1, 0]}>
      {/* 크라운 (반구형 돔) - 6패널 구조 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[crownRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={capMaterial} />
      </mesh>

      {/* 크라운 살짝 압축된 느낌 (위쪽 약간 평평하게) */}
      <mesh position={[0, 0, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[crownRadius * 0.98, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={capMaterial} />
      </mesh>

      {/* 6패널 스티칭 라인 */}
      <group position={[0, 0, 0]}>
        <PanelSeams radius={crownRadius} height={crownHeight} />
      </group>

      {/* 꼭대기 버튼 */}
      <mesh position={[0, crownHeight + 0.02, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
        <meshPhysicalMaterial
          color="#e2e8f0"
          transparent
          opacity={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* 버튼 테두리 */}
      <mesh position={[0, crownHeight + 0.025, 0]}>
        <torusGeometry args={[0.045, 0.008, 8, 16]} />
        <primitive object={seamMaterial} />
      </mesh>

      {/* 통풍구 (아일릿) - 각 패널에 하나씩 */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const eyeletY = crownHeight * 0.6;
        const eyeletRadius = crownRadius * 0.85;
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
            <torusGeometry args={[0.025, 0.006, 8, 16]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.5} />
          </mesh>
        );
      })}

      {/* 챙 (Bill) - 곡선형 */}
      <group position={[0, -0.02, crownRadius * 0.7]} rotation={[-0.25, 0, 0]}>
        {/* 챙 본체 */}
        <mesh>
          <extrudeGeometry
            args={[
              billShape,
              {
                depth: 0.035,
                bevelEnabled: true,
                bevelThickness: 0.01,
                bevelSize: 0.01,
                bevelSegments: 2,
              },
            ]}
          />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 챙 아래 면 (약간 어둡게) */}
        <mesh position={[0, 0, -0.01]} rotation={[Math.PI, 0, 0]}>
          <extrudeGeometry
            args={[
              billShape,
              {
                depth: 0.01,
                bevelEnabled: false,
              },
            ]}
          />
          <meshPhysicalMaterial
            color="#f1f5f9"
            transparent
            opacity={0.4}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 챙 가장자리 스티칭 라인 */}
        <mesh position={[0, 0, 0.02]}>
          <extrudeGeometry
            args={[
              billShape,
              {
                depth: 0.002,
                bevelEnabled: false,
              },
            ]}
          />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={0.4} wireframe />
        </mesh>
      </group>

      {/* 스웨트밴드 (안쪽 밴드) */}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[crownRadius - 0.02, 0.04, 8, 32]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.5}
          roughness={0.6}
        />
      </mesh>

      {/* 뒤쪽 조절 스트랩 힌트 */}
      <mesh position={[0, 0.08, -crownRadius * 0.85]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.25, 0.06, 0.02]} />
        <meshPhysicalMaterial
          color="#e2e8f0"
          transparent
          opacity={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* 로고 - 정면 */}
      {logoPosition === 'front' && (
        <group position={[0, crownHeight * 0.5, crownRadius * 0.72]} rotation={[-0.15, 0, 0]}>
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.35} height={0.28} />
        </group>
      )}

      {/* 로고 - 측면 */}
      {logoPosition === 'side' && (
        <group
          position={[crownRadius * 0.7, crownHeight * 0.5, crownRadius * 0.3]}
          rotation={[0, Math.PI / 3, 0]}
        >
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.3} height={0.24} />
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
