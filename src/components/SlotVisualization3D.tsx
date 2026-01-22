import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Environment, ContactShadows } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

interface SlotVisualization3DProps {
  slotType: 'SHIRT_FRONT' | 'SHIRT_BACK' | 'SHIRT_SLEEVE' | 'CAP_FRONT' | 'CAP_SIDE';
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

// 3D 모자 컴포넌트
function Cap3D({ logoPosition }: { logoPosition: 'front' | 'side' }) {
  const capRef = useRef<THREE.Group>(null);

  return (
    <group ref={capRef} rotation={[0.1, logoPosition === 'side' ? -0.5 : 0, 0]} position={[0, 0, 0]}>
      {/* 모자 본체 - 반구형 크라운 */}
      <mesh position={[0, 0.3, 0]} scale={[1.2, 0.8, 1.1]}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a365d" roughness={0.8} />
      </mesh>

      {/* 모자 밴드 (아래 테두리) */}
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.08, 8, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>

      {/* 모자 챙 (Bill) */}
      <mesh position={[0, 0.2, 0.9]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.9]} />
        <meshStandardMaterial color="#1a365d" roughness={0.7} />
      </mesh>

      {/* 챙 곡면 (아래쪽) */}
      <mesh position={[0, 0.15, 0.9]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.38, 0.02, 0.88]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* 로고 위치 표시 */}
      {logoPosition === 'front' ? (
        // 정면 로고 영역
        <mesh position={[0, 0.65, 0.85]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.7, 0.5]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : (
        // 측면 로고 영역
        <mesh position={[1.0, 0.5, 0.2]} rotation={[0, Math.PI / 2, 0.1]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 로고 영역 라벨 */}
      <Text
        position={logoPosition === 'front' ? [0, 0.65, 0.87] : [1.02, 0.5, 0.2]}
        rotation={logoPosition === 'front' ? [-0.4, 0, 0] : [0, Math.PI / 2, 0.1]}
        fontSize={0.12}
        color="#1a365d"
        anchorX="center"
        anchorY="middle"
      >
        LOGO
      </Text>

      {/* 모자 꼭대기 버튼 */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* 통풍구 (아일렛) */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI) / 3) * 0.95,
            0.7,
            Math.sin((i * Math.PI) / 3) * 0.85,
          ]}
          rotation={[Math.PI / 4, (i * Math.PI) / 3, 0]}
        >
          <circleGeometry args={[0.04, 16]} />
          <meshStandardMaterial color="#0f172a" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// 3D 셔츠 컴포넌트
function Shirt3D({ logoPosition }: { logoPosition: 'front' | 'back' | 'sleeve' }) {
  const shirtRef = useRef<THREE.Group>(null);

  return (
    <group ref={shirtRef} position={[0, -0.5, 0]}>
      {/* 셔츠 몸통 */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 2.2, 0.6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* 칼라/목 부분 */}
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.15, 32]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.8} />
      </mesh>

      {/* 왼쪽 소매 */}
      <mesh position={[-1.3, 0.9, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.8, 0.7, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* 오른쪽 소매 */}
      <mesh position={[1.3, 0.9, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.8, 0.7, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* 셔츠 아래 테두리 */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[2.1, 0.1, 0.65]} />
        <meshStandardMaterial color="#e5e5e5" roughness={0.8} />
      </mesh>

      {/* 로고 위치에 따른 표시 */}
      {logoPosition === 'front' && (
        <>
          {/* 정면 가슴 로고 영역 */}
          <mesh position={[0, 0.6, 0.31]}>
            <planeGeometry args={[1.2, 0.8]} />
            <meshStandardMaterial
              color="#e0e7ff"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0.6, 0.32]}
            fontSize={0.15}
            color="#3730a3"
            anchorX="center"
            anchorY="middle"
          >
            LOGO
          </Text>
        </>
      )}

      {logoPosition === 'back' && (
        <>
          {/* 뒷면 등 로고 영역 */}
          <mesh position={[0, 0.5, -0.31]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.4, 1.0]} />
            <meshStandardMaterial
              color="#e0e7ff"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0.5, -0.32]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.18}
            color="#3730a3"
            anchorX="center"
            anchorY="middle"
          >
            LOGO
          </Text>
        </>
      )}

      {logoPosition === 'sleeve' && (
        <>
          {/* 소매 로고 영역 (왼쪽) */}
          <mesh position={[-1.45, 0.9, 0.26]} rotation={[0, 0, 0.4]}>
            <planeGeometry args={[0.5, 0.4]} />
            <meshStandardMaterial
              color="#e0e7ff"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[-1.46, 0.9, 0.27]}
            rotation={[0, 0, 0.4]}
            fontSize={0.1}
            color="#3730a3"
            anchorX="center"
            anchorY="middle"
          >
            LOGO
          </Text>
        </>
      )}
    </group>
  );
}

// 로딩 폴백
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" wireframe />
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
    <div className={`w-full ${sizeClasses[size]} bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg overflow-hidden relative`}>
      <Canvas
        camera={{ position: [0, 1, 4], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />

          {isCap ? (
            <Cap3D logoPosition={logoPosition as 'front' | 'side'} />
          ) : (
            <Shirt3D logoPosition={logoPosition as 'front' | 'back' | 'sleeve'} />
          )}

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            autoRotate
            autoRotateSpeed={1}
          />

          <Environment preset="studio" />
        </Suspense>
      </Canvas>

      {/* 슬롯 타입 라벨 */}
      <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-slate-700">
        {getSlotLabel()}
      </div>

      {/* 3D 인터랙션 힌트 */}
      <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-xs text-slate-500">
        드래그로 회전
      </div>
    </div>
  );
}
