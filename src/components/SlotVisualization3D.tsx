import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

interface SlotVisualization3DProps {
  slotType: 'SHIRT_FRONT' | 'SHIRT_BACK' | 'SHIRT_SLEEVE' | 'CAP_FRONT' | 'CAP_SIDE';
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

// 반투명 유리 느낌 머티리얼
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#e2e8f0',
  transparent: true,
  opacity: 0.35,
  roughness: 0.1,
  metalness: 0,
  clearcoat: 0.3,
  clearcoatRoughness: 0.2,
  side: THREE.DoubleSide,
});

const glassAccentMaterial = new THREE.MeshPhysicalMaterial({
  color: '#cbd5e1',
  transparent: true,
  opacity: 0.5,
  roughness: 0.2,
  metalness: 0,
  side: THREE.DoubleSide,
});

// 야구모자
function Cap3D({ logoPosition }: { logoPosition: 'front' | 'side' }) {
  return (
    <group rotation={[0.1, logoPosition === 'side' ? -0.5 : 0.15, 0]} position={[0, 0.1, 0]}>
      {/* 크라운 - 둥근 돔 */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* 모자 밴드 */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88, 0.08, 16, 32]} />
        <primitive object={glassAccentMaterial} attach="material" />
      </mesh>

      {/* 모자 챙 - 곡면 */}
      <mesh position={[0, 0.05, 0.7]} rotation={[-0.15, 0, 0]}>
        <capsuleGeometry args={[0.08, 1.2, 4, 16]} />
        <primitive object={glassAccentMaterial} attach="material" />
      </mesh>

      {/* 꼭대기 버튼 */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <primitive object={glassAccentMaterial} attach="material" />
      </mesh>

      {/* 로고 영역 - 정면 */}
      {logoPosition === 'front' && (
        <group position={[0, 0.55, 0.78]} rotation={[-0.35, 0, 0]}>
          <mesh>
            <planeGeometry args={[0.6, 0.4]} />
            <meshPhysicalMaterial
              color="#10b981"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.12}
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
        <group position={[0.78, 0.5, 0.15]} rotation={[0.05, Math.PI / 2.3, 0]}>
          <mesh>
            <planeGeometry args={[0.45, 0.35]} />
            <meshPhysicalMaterial
              color="#10b981"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.1}
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

// 폴로셔츠
function Shirt3D({ logoPosition }: { logoPosition: 'front' | 'back' | 'sleeve' }) {
  const isBack = logoPosition === 'back';

  return (
    <group position={[0, -0.1, 0]} rotation={[0, isBack ? Math.PI : 0, 0]}>
      {/* 몸통 - 부드러운 실린더 */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 1.6, 32, 1, true]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* 어깨 */}
      <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.15, 1.4, 8, 16]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* 목 */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.2, 24]} />
        <primitive object={glassAccentMaterial} attach="material" />
      </mesh>

      {/* 칼라 */}
      <mesh position={[0, 0.95, 0.1]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.2]} />
        <primitive object={glassAccentMaterial} attach="material" />
      </mesh>

      {/* 왼쪽 소매 */}
      <mesh position={[-0.9, 0.55, 0]} rotation={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.15, 0.2, 0.5, 16]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* 오른쪽 소매 */}
      <mesh position={[0.9, 0.55, 0]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.15, 0.2, 0.5, 16]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* 하단 */}
      <mesh position={[0, -0.85, 0]}>
        <torusGeometry args={[0.78, 0.05, 8, 32]} />
        <primitive object={glassAccentMaterial} attach="material" />
      </mesh>

      {/* 로고 영역 - 정면 가슴 */}
      {logoPosition === 'front' && (
        <group position={[-0.25, 0.3, 0.68]}>
          <mesh>
            <planeGeometry args={[0.45, 0.35]} />
            <meshPhysicalMaterial
              color="#10b981"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.1}
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
        <group position={[0, 0.15, 0.68]}>
          <mesh>
            <planeGeometry args={[0.8, 0.55]} />
            <meshPhysicalMaterial
              color="#10b981"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.15}
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
        <group position={[-0.95, 0.55, 0.18]} rotation={[0, 0, 0.6]}>
          <mesh>
            <planeGeometry args={[0.3, 0.25]} />
            <meshPhysicalMaterial
              color="#10b981"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.07}
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
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#e2e8f0" transparent opacity={0.5} />
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
        camera={{ position: [0, 0.3, isCap ? 2.5 : 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* 조명 */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 5]} intensity={0.6} />
          <directionalLight position={[-3, 3, -3]} intensity={0.3} />
          <pointLight position={[0, 2, 2]} intensity={0.4} color="#ffffff" />

          {isCap ? (
            <Cap3D logoPosition={logoPosition as 'front' | 'side'} />
          ) : (
            <Shirt3D logoPosition={logoPosition as 'front' | 'back' | 'sleeve'} />
          )}

          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.25}
            scale={5}
            blur={2}
            far={2}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate
            autoRotateSpeed={0.8}
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
