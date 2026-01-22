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

// 캡 크라운 BufferGeometry 생성 (앞뒤 비대칭 - 앞 낮고 뒤 높음)
function createCapCrownGeometry() {
  const geometry = new THREE.BufferGeometry();

  // 파라미터
  const segments = 32;      // 둘레 분할
  const rings = 16;         // 높이 분할
  const baseRadius = 0.48;  // 머리 둘레 반경
  const height = 0.35;      // 크라운 높이

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  // 정점 생성
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;  // 0 ~ 1 (아래 → 위)

    // 높이에 따른 반경 변화 (위로 갈수록 좁아짐)
    const radius = baseRadius * (1 - t * 0.45);

    for (let seg = 0; seg <= segments; seg++) {
      const angle = (seg / segments) * Math.PI * 2;

      // 앞뒤 비대칭: 앞쪽(z>0)은 낮게, 뒤쪽(z<0)은 높게
      const frontBackFactor = -Math.cos(angle) * 0.2;  // z 방향 (앞이 +z)
      const adjustedHeight = height * (1 + frontBackFactor * t);
      const y = adjustedHeight * Math.pow(t, 0.75);  // 비선형 높이

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      vertices.push(x, y, z);

      // 노멀 계산 (대략적)
      const nx = Math.sin(angle) * (1 - t * 0.3);
      const ny = t * 0.5;
      const nz = Math.cos(angle) * (1 - t * 0.3);
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      normals.push(nx / len, ny / len, nz / len);

      // UV
      uvs.push(seg / segments, t);
    }
  }

  // 인덱스 생성 (삼각형 연결)
  for (let ring = 0; ring < rings; ring++) {
    for (let seg = 0; seg < segments; seg++) {
      const curr = ring * (segments + 1) + seg;
      const next = curr + segments + 1;

      indices.push(curr, next, curr + 1);
      indices.push(curr + 1, next, next + 1);
    }
  }

  // 꼭대기 캡 (마지막 링을 중앙점과 연결)
  const topCenterIndex = vertices.length / 3;
  vertices.push(0, height * 0.92, 0);  // 꼭대기 중앙
  normals.push(0, 1, 0);
  uvs.push(0.5, 1);

  const lastRingStart = rings * (segments + 1);
  for (let seg = 0; seg < segments; seg++) {
    indices.push(lastRingStart + seg, lastRingStart + seg + 1, topCenterIndex);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// 캡 챙(Brim) BufferGeometry 생성 - 앞으로 돌출 + 아래로 휘어짐
function createCapBrimGeometry() {
  const geometry = new THREE.BufferGeometry();

  // 파라미터
  const width = 0.50;        // 챙 폭 (크라운 연결부)
  const length = 0.38;       // 챙 길이 (앞으로 돌출)
  const curve = 0.12;        // 아래로 휘는 정도
  const thickness = 0.025;   // 두께
  const segX = 16;           // 폭 방향 분할
  const segZ = 12;           // 길이 방향 분할

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  // 상면 생성
  for (let zi = 0; zi <= segZ; zi++) {
    const zT = zi / segZ;  // 0 ~ 1 (크라운에서 앞쪽으로)
    const z = zT * length;

    // 폭: 뒤쪽은 넓고 앞쪽은 좁게
    const currentWidth = width * (1 - zT * 0.2);

    // 아래로 휘는 곡률 (앞으로 갈수록)
    const curveY = -curve * Math.pow(zT, 1.4);

    for (let xi = 0; xi <= segX; xi++) {
      const xT = (xi / segX - 0.5) * 2;  // -1 ~ 1
      const x = xT * currentWidth * 0.5;

      // 가장자리는 더 아래로 (챙의 컵 형태)
      const edgeCurve = Math.abs(xT) * Math.abs(xT) * 0.04;

      vertices.push(x, curveY - edgeCurve, z);
      normals.push(0, 1, 0);
      uvs.push(xi / segX, zi / segZ);
    }
  }

  const topVertexCount = (segZ + 1) * (segX + 1);

  // 하면 생성 (상면보다 thickness만큼 아래)
  for (let zi = 0; zi <= segZ; zi++) {
    const zT = zi / segZ;
    const z = zT * length;
    const currentWidth = width * (1 - zT * 0.2);
    const curveY = -curve * Math.pow(zT, 1.4);

    for (let xi = 0; xi <= segX; xi++) {
      const xT = (xi / segX - 0.5) * 2;
      const x = xT * currentWidth * 0.5;
      const edgeCurve = Math.abs(xT) * Math.abs(xT) * 0.04;

      vertices.push(x, curveY - edgeCurve - thickness, z);
      normals.push(0, -1, 0);
      uvs.push(xi / segX, zi / segZ);
    }
  }

  // 상면 인덱스
  for (let zi = 0; zi < segZ; zi++) {
    for (let xi = 0; xi < segX; xi++) {
      const curr = zi * (segX + 1) + xi;
      const next = curr + segX + 1;

      indices.push(curr, curr + 1, next);
      indices.push(curr + 1, next + 1, next);
    }
  }

  // 하면 인덱스 (역방향)
  for (let zi = 0; zi < segZ; zi++) {
    for (let xi = 0; xi < segX; xi++) {
      const curr = topVertexCount + zi * (segX + 1) + xi;
      const next = curr + segX + 1;

      indices.push(curr, next, curr + 1);
      indices.push(curr + 1, next, next + 1);
    }
  }

  // 앞쪽 테두리 (끝부분)
  for (let xi = 0; xi < segX; xi++) {
    const topFront = segZ * (segX + 1) + xi;
    const bottomFront = topVertexCount + segZ * (segX + 1) + xi;

    indices.push(topFront, bottomFront, topFront + 1);
    indices.push(topFront + 1, bottomFront, bottomFront + 1);
  }

  // 좌우 테두리
  for (let zi = 0; zi < segZ; zi++) {
    // 왼쪽
    const topLeft = zi * (segX + 1);
    const bottomLeft = topVertexCount + zi * (segX + 1);
    const topLeftNext = (zi + 1) * (segX + 1);
    const bottomLeftNext = topVertexCount + (zi + 1) * (segX + 1);

    indices.push(topLeft, topLeftNext, bottomLeft);
    indices.push(bottomLeft, topLeftNext, bottomLeftNext);

    // 오른쪽
    const topRight = zi * (segX + 1) + segX;
    const bottomRight = topVertexCount + zi * (segX + 1) + segX;
    const topRightNext = (zi + 1) * (segX + 1) + segX;
    const bottomRightNext = topVertexCount + (zi + 1) * (segX + 1) + segX;

    indices.push(topRight, bottomRight, topRightNext);
    indices.push(bottomRight, bottomRightNext, topRightNext);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// 크라운 파라미터 (새로운 값)
const CROWN = {
  baseRadius: 0.48,
  height: 0.35,
  segments: 32,
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

// 6패널 스티칭 라인 생성 (은은하게) - 새 크라운 형태에 맞춤
function PanelSeams({ radius, height, squash }: { radius: number; height: number; squash: number }) {
  const seams = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const panels = 6;

    for (let i = 0; i < panels; i++) {
      const angle = (i / panels) * Math.PI * 2;
      const points: THREE.Vector3[] = [];

      // 아래에서 꼭대기까지 곡선 (새 크라운 형태에 맞춤)
      for (let t = 0; t <= 1; t += 0.06) {
        // 위로 갈수록 반경 감소
        const currentRadius = radius * (1 - t * 0.45);

        // 앞뒤 비대칭 적용
        const frontBackFactor = -Math.cos(angle) * 0.2;
        const adjustedHeight = height * (1 + frontBackFactor * t);
        const y = adjustedHeight * Math.pow(t, 0.75) * squash;

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

// 모자 3D - 반투명 패브릭 스타일 베이스볼 캡 (BufferGeometry 사용)
function Cap3D({ logoPosition, logoUrl }: { logoPosition: 'front' | 'side'; logoUrl?: string }) {
  // 커스텀 BufferGeometry 생성
  const crownGeometry = useMemo(() => createCapCrownGeometry(), []);
  const brimGeometry = useMemo(() => createCapBrimGeometry(), []);

  // 패브릭 반투명 머티리얼 - 플라스틱 방지
  const fabricMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#F6F6F2',           // 아이보리 화이트
    transparent: true,
    opacity: 0.65,              // 0.55~0.75 범위
    roughness: 0.80,            // 0.75~0.9 (무광 패브릭)
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
    transmission: 0,
    sheen: 0.12,
    sheenRoughness: 0.85,
    sheenColor: new THREE.Color('#FAFAFA'),
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  const crownHeight = CROWN.height;

  return (
    <group rotation={[0.15, logoPosition === 'side' ? -0.5 : 0, 0]} position={[0, -0.05, 0]}>
      {/* 크라운 (커스텀 BufferGeometry - 앞뒤 비대칭) */}
      <mesh geometry={crownGeometry}>
        <primitive object={fabricMaterial} />
      </mesh>

      {/* 6패널 스티칭 라인 (은은하게) */}
      <group position={[0, 0, 0]}>
        <PanelSeams radius={CROWN.baseRadius} height={CROWN.height} squash={1.0} />
      </group>

      {/* 꼭대기 버튼 */}
      <mesh position={[0, crownHeight * 0.92 + 0.015, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.022, 16]} />
        <meshPhysicalMaterial
          color="#F0F0EE"
          transparent
          opacity={0.85}
          roughness={0.7}
          metalness={0}
        />
      </mesh>
      {/* 버튼 중앙 디테일 */}
      <mesh position={[0, crownHeight * 0.92 + 0.027, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.004, 12]} />
        <meshBasicMaterial color="#E8E8E6" transparent opacity={0.6} />
      </mesh>

      {/* 통풍구 (아일릿) - 4개 */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const eyeletY = crownHeight * 0.55;
        const eyeletRadius = CROWN.baseRadius * 0.78;
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
            <torusGeometry args={[0.016, 0.004, 6, 12]} />
            <meshBasicMaterial color="#D4D4D2" transparent opacity={0.6} />
          </mesh>
        );
      })}

      {/* 챙 (Brim) - BufferGeometry로 앞으로 돌출 */}
      <mesh geometry={brimGeometry} position={[0, -0.01, CROWN.baseRadius * 0.95]}>
        <primitive object={brimMaterial} />
      </mesh>

      {/* 스웨트밴드 (안쪽 밴드) */}
      <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CROWN.baseRadius - 0.015, 0.028, 8, 32]} />
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
        <group position={[0, crownHeight * 0.45, CROWN.baseRadius * 0.52]} rotation={[-0.08, 0, 0]}>
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.30} height={0.24} />
        </group>
      )}

      {/* 로고 - 측면 */}
      {logoPosition === 'side' && (
        <group
          position={[CROWN.baseRadius * 0.60, crownHeight * 0.45, CROWN.baseRadius * 0.25]}
          rotation={[0, Math.PI / 3, 0]}
        >
          <LogoPlane logoUrl={logoUrl || DEFAULT_LOGO} width={0.26} height={0.20} />
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
