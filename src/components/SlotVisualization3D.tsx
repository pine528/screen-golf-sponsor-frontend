import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, ContactShadows, Grid } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

interface SlotVisualization3DProps {
  slotType: 'SHIRT_FRONT' | 'SHIRT_BACK' | 'SHIRT_SLEEVE' | 'CAP_FRONT' | 'CAP_SIDE';
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

// 와이어프레임 머티리얼
const wireMaterial = new THREE.MeshBasicMaterial({
  color: '#64748b',
  wireframe: true,
  transparent: true,
  opacity: 0.6,
});

const wireAccentMaterial = new THREE.MeshBasicMaterial({
  color: '#475569',
  wireframe: true,
  transparent: true,
  opacity: 0.8,
});

// 로고 영역 머티리얼
const logoAreaMaterial = new THREE.MeshBasicMaterial({
  color: '#10b981',
  transparent: true,
  opacity: 0.15,
  side: THREE.DoubleSide,
});

const logoBorderMaterial = new THREE.MeshBasicMaterial({
  color: '#10b981',
  wireframe: true,
  transparent: true,
  opacity: 0.8,
});

// 와이어프레임 야구모자
function Cap3D({ logoPosition }: { logoPosition: 'front' | 'side' }) {
  return (
    <group rotation={[0.1, logoPosition === 'side' ? -0.6 : 0.15, 0]} position={[0, 0, 0]}>
      {/* 크라운 - 반구 형태 */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={wireMaterial} attach="material" />
      </mesh>

      {/* 모자 밴드 */}
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.06, 8, 24]} />
        <primitive object={wireAccentMaterial} attach="material" />
      </mesh>

      {/* 모자 챙 */}
      <mesh position={[0, 0, 0.9]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[1.5, 0.05, 0.7]} />
        <primitive object={wireMaterial} attach="material" />
      </mesh>

      {/* 챙 끝 라운드 */}
      <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.05, 16, 1, false, 0, Math.PI]} />
        <primitive object={wireMaterial} attach="material" />
      </mesh>

      {/* 꼭대기 버튼 */}
      <mesh position={[0, 1.02, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <primitive object={wireAccentMaterial} attach="material" />
      </mesh>

      {/* 로고 영역 - 정면 */}
      {logoPosition === 'front' && (
        <group position={[0, 0.5, 0.88]} rotation={[-0.3, 0, 0]}>
          {/* 로고 배경 (반투명) */}
          <mesh>
            <planeGeometry args={[0.7, 0.5]} />
            <primitive object={logoAreaMaterial} attach="material" />
          </mesh>
          {/* 로고 테두리 (와이어프레임) */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.7, 0.5]} />
            <primitive object={logoBorderMaterial} attach="material" />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.15}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            LOGO
          </Text>
        </group>
      )}

      {/* 로고 영역 - 측면 */}
      {logoPosition === 'side' && (
        <group position={[0.9, 0.45, 0.2]} rotation={[0.1, Math.PI / 2.2, 0]}>
          <mesh>
            <planeGeometry args={[0.5, 0.4]} />
            <primitive object={logoAreaMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.5, 0.4]} />
            <primitive object={logoBorderMaterial} attach="material" />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.12}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            LOGO
          </Text>
        </group>
      )}
    </group>
  );
}

// 와이어프레임 폴로셔츠
function Shirt3D({ logoPosition }: { logoPosition: 'front' | 'back' | 'sleeve' }) {
  const isBack = logoPosition === 'back';

  return (
    <group position={[0, -0.2, 0]} rotation={[0, isBack ? Math.PI : 0, 0]}>
      {/* 몸통 */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.6, 1.8, 0.4]} />
        <primitive object={wireMaterial} attach="material" />
      </mesh>

      {/* 어깨 라인 */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.0, 0.2, 0.35]} />
        <primitive object={wireMaterial} attach="material" />
      </mesh>

      {/* 목 부분 */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.15, 12]} />
        <primitive object={wireAccentMaterial} attach="material" />
      </mesh>

      {/* 칼라 */}
      <mesh position={[0, 1.15, 0.15]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.7, 0.1, 0.25]} />
        <primitive object={wireAccentMaterial} attach="material" />
      </mesh>

      {/* 왼쪽 소매 */}
      <mesh position={[-1.15, 0.85, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.6, 0.5, 0.35]} />
        <primitive object={wireMaterial} attach="material" />
      </mesh>

      {/* 오른쪽 소매 */}
      <mesh position={[1.15, 0.85, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.6, 0.5, 0.35]} />
        <primitive object={wireMaterial} attach="material" />
      </mesh>

      {/* 하단 곡선 */}
      <mesh position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.4, 16, 1, false, 0, Math.PI]} />
        <primitive object={wireMaterial} attach="material" />
      </mesh>

      {/* 로고 영역 - 정면 가슴 */}
      {logoPosition === 'front' && (
        <group position={[-0.4, 0.5, 0.21]}>
          <mesh>
            <planeGeometry args={[0.55, 0.45]} />
            <primitive object={logoAreaMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.55, 0.45]} />
            <primitive object={logoBorderMaterial} attach="material" />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.12}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            LOGO
          </Text>
        </group>
      )}

      {/* 로고 영역 - 등판 */}
      {logoPosition === 'back' && (
        <group position={[0, 0.3, 0.21]}>
          <mesh>
            <planeGeometry args={[1.0, 0.7]} />
            <primitive object={logoAreaMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.0, 0.7]} />
            <primitive object={logoBorderMaterial} attach="material" />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.18}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            LOGO
          </Text>
        </group>
      )}

      {/* 로고 영역 - 소매 */}
      {logoPosition === 'sleeve' && (
        <group position={[-1.25, 0.85, 0.19]} rotation={[0, 0, 0.4]}>
          <mesh>
            <planeGeometry args={[0.4, 0.3]} />
            <primitive object={logoAreaMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.4, 0.3]} />
            <primitive object={logoBorderMaterial} attach="material" />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.09}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            LOGO
          </Text>
        </group>
      )}
    </group>
  );
}

// 로딩 폴백
function LoadingFallback() {
  return (
    <mesh rotation={[0.5, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#e2e8f0" wireframe />
    </mesh>
  );
}

// 메인 컴포넌트
export default function SlotVisualization3D({ slotType, size = 'md' }: SlotVisualization3DProps) {
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
        camera={{ position: [0, 0.5, isCap ? 3 : 3.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* 은은한 조명 */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.3} />

          {isCap ? (
            <Cap3D logoPosition={logoPosition as 'front' | 'side'} />
          ) : (
            <Shirt3D logoPosition={logoPosition as 'front' | 'back' | 'sleeve'} />
          )}

          {/* 바닥 그리드 */}
          <Grid
            position={[0, -1, 0]}
            args={[10, 10]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#cbd5e1"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#94a3b8"
            fadeDistance={8}
            fadeStrength={1}
            infiniteGrid
          />

          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.2}
            scale={6}
            blur={2}
            far={3}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate
            autoRotateSpeed={0.6}
          />
        </Suspense>
      </Canvas>

      {/* 슬롯 타입 라벨 */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 shadow-sm">
        {getSlotLabel()}
      </div>

      {/* 3D 인터랙션 힌트 */}
      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-slate-500">
        드래그로 회전
      </div>
    </div>
  );
}
