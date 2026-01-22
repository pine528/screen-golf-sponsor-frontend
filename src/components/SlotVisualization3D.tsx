import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Environment, ContactShadows, RoundedBox } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

interface SlotVisualization3DProps {
  slotType: 'SHIRT_FRONT' | 'SHIRT_BACK' | 'SHIRT_SLEEVE' | 'CAP_FRONT' | 'CAP_SIDE';
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

// 기하학적 야구 모자 컴포넌트
function Cap3D({ logoPosition }: { logoPosition: 'front' | 'side' }) {
  const capRef = useRef<THREE.Group>(null);
  const capColor = '#1e3a5f';
  const accentColor = '#0f2744';

  return (
    <group ref={capRef} rotation={[0.15, logoPosition === 'side' ? -0.8 : 0.2, 0]} position={[0, -0.2, 0]}>
      {/* 모자 크라운 - 6개 패널로 구성된 돔 */}
      {/* 메인 크라운 베이스 */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.8, 6, 1, false]} />
        <meshStandardMaterial color={capColor} roughness={0.7} flatShading />
      </mesh>

      {/* 크라운 상단 (돔 형태) */}
      <mesh position={[0, 0.9, 0]}>
        <coneGeometry args={[0.9, 0.5, 6]} />
        <meshStandardMaterial color={capColor} roughness={0.7} flatShading />
      </mesh>

      {/* 모자 밴드 */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 0.08, 32]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>

      {/* 모자 챙 (Bill) - 곡선형 */}
      <mesh position={[0, 0.08, 0.85]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.6, 0.08, 0.8]} />
        <meshStandardMaterial color={capColor} roughness={0.6} />
      </mesh>

      {/* 챙 둥근 끝부분 */}
      <mesh position={[0, 0.08, 1.2]} rotation={[-0.25, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.08, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={capColor} roughness={0.6} />
      </mesh>

      {/* 챙 아래면 */}
      <mesh position={[0, 0.02, 0.85]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.58, 0.02, 0.78]} />
        <meshStandardMaterial color="#2d4a66" roughness={0.5} />
      </mesh>

      {/* 모자 꼭대기 버튼 */}
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <meshStandardMaterial color={accentColor} roughness={0.4} />
      </mesh>

      {/* 패널 구분선 (스티칭) */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={`stitch-${i}`}
          position={[
            Math.sin((i * Math.PI) / 3) * 0.92,
            0.7,
            Math.cos((i * Math.PI) / 3) * 0.92,
          ]}
          rotation={[0, -(i * Math.PI) / 3, 0]}
        >
          <boxGeometry args={[0.02, 0.6, 0.02]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>
      ))}

      {/* 로고 영역 - 정면 */}
      {logoPosition === 'front' && (
        <group position={[0, 0.55, 0.95]} rotation={[-0.15, 0, 0]}>
          {/* 로고 배경 패널 */}
          <mesh>
            <planeGeometry args={[0.8, 0.55]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 로고 테두리 */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[0.85, 0.6]} />
            <meshStandardMaterial
              color="#10b981"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.18}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            LOGO
          </Text>
        </group>
      )}

      {/* 로고 영역 - 측면 */}
      {logoPosition === 'side' && (
        <group position={[0.95, 0.6, 0.3]} rotation={[0, Math.PI / 2.5, 0.1]}>
          {/* 로고 배경 패널 */}
          <mesh>
            <planeGeometry args={[0.55, 0.4]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 로고 테두리 */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[0.6, 0.45]} />
            <meshStandardMaterial
              color="#10b981"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.14}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            LOGO
          </Text>
        </group>
      )}
    </group>
  );
}

// 기하학적 폴로 셔츠 컴포넌트
function Shirt3D({ logoPosition }: { logoPosition: 'front' | 'back' | 'sleeve' }) {
  const shirtRef = useRef<THREE.Group>(null);
  const shirtColor = '#f8fafc';
  const accentColor = '#e2e8f0';
  const collarColor = '#1e3a5f';

  return (
    <group ref={shirtRef} position={[0, -0.3, 0]} rotation={[0, logoPosition === 'back' ? Math.PI : 0, 0]}>
      {/* 셔츠 몸통 - 메인 토르소 */}
      <RoundedBox args={[1.8, 2.0, 0.5]} radius={0.08} position={[0, 0.2, 0]}>
        <meshStandardMaterial color={shirtColor} roughness={0.85} />
      </RoundedBox>

      {/* 허리 라인 (슬림핏 표현) */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.7, 0.4, 0.48]} />
        <meshStandardMaterial color={shirtColor} roughness={0.85} />
      </mesh>

      {/* 셔츠 하단 곡선 */}
      <mesh position={[0, -0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.48, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={shirtColor} roughness={0.85} />
      </mesh>

      {/* 폴로 칼라 - 접힌 칼라 */}
      <group position={[0, 1.2, 0]}>
        {/* 칼라 베이스 */}
        <mesh position={[0, 0.05, 0.15]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.9, 0.15, 0.35]} />
          <meshStandardMaterial color={collarColor} roughness={0.6} />
        </mesh>
        {/* 칼라 왼쪽 날개 */}
        <mesh position={[-0.35, 0.02, 0.25]} rotation={[0.4, -0.2, -0.15]}>
          <boxGeometry args={[0.35, 0.08, 0.25]} />
          <meshStandardMaterial color={collarColor} roughness={0.6} />
        </mesh>
        {/* 칼라 오른쪽 날개 */}
        <mesh position={[0.35, 0.02, 0.25]} rotation={[0.4, 0.2, 0.15]}>
          <boxGeometry args={[0.35, 0.08, 0.25]} />
          <meshStandardMaterial color={collarColor} roughness={0.6} />
        </mesh>
        {/* 목 부분 */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.15, 16]} />
          <meshStandardMaterial color={accentColor} roughness={0.8} />
        </mesh>
      </group>

      {/* 왼쪽 소매 */}
      <group position={[-1.1, 0.75, 0]} rotation={[0, 0, 0.5]}>
        <RoundedBox args={[0.7, 0.55, 0.45]} radius={0.05}>
          <meshStandardMaterial color={shirtColor} roughness={0.85} />
        </RoundedBox>
        {/* 소매 밴드 */}
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.23, 0.25, 0.08, 16]} />
          <meshStandardMaterial color={collarColor} roughness={0.6} />
        </mesh>
      </group>

      {/* 오른쪽 소매 */}
      <group position={[1.1, 0.75, 0]} rotation={[0, 0, -0.5]}>
        <RoundedBox args={[0.7, 0.55, 0.45]} radius={0.05}>
          <meshStandardMaterial color={shirtColor} roughness={0.85} />
        </RoundedBox>
        {/* 소매 밴드 */}
        <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.23, 0.25, 0.08, 16]} />
          <meshStandardMaterial color={collarColor} roughness={0.6} />
        </mesh>
      </group>

      {/* 버튼 플래킷 (앞면만) */}
      {logoPosition === 'front' && (
        <group position={[0, 0.8, 0.26]}>
          <mesh>
            <boxGeometry args={[0.15, 0.5, 0.02]} />
            <meshStandardMaterial color={accentColor} roughness={0.7} />
          </mesh>
          {/* 버튼들 */}
          {[0.15, 0, -0.15].map((y, i) => (
            <mesh key={i} position={[0, y, 0.02]}>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* 로고 영역 - 정면 가슴 */}
      {logoPosition === 'front' && (
        <group position={[-0.45, 0.6, 0.27]}>
          {/* 로고 테두리 */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[0.65, 0.5]} />
            <meshStandardMaterial
              color="#10b981"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 로고 배경 */}
          <mesh>
            <planeGeometry args={[0.6, 0.45]} />
            <meshStandardMaterial
              color="#dcfce7"
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.14}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            LOGO
          </Text>
        </group>
      )}

      {/* 로고 영역 - 등판 */}
      {logoPosition === 'back' && (
        <group position={[0, 0.3, 0.27]}>
          {/* 로고 테두리 */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.2, 0.85]} />
            <meshStandardMaterial
              color="#10b981"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 로고 배경 */}
          <mesh>
            <planeGeometry args={[1.15, 0.8]} />
            <meshStandardMaterial
              color="#dcfce7"
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.22}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            LOGO
          </Text>
        </group>
      )}

      {/* 로고 영역 - 소매 */}
      {logoPosition === 'sleeve' && (
        <group position={[-1.25, 0.75, 0.24]} rotation={[0, 0, 0.5]}>
          {/* 로고 테두리 */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[0.45, 0.35]} />
            <meshStandardMaterial
              color="#10b981"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 로고 배경 */}
          <mesh>
            <planeGeometry args={[0.4, 0.3]} />
            <meshStandardMaterial
              color="#dcfce7"
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.1}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            LOGO
          </Text>
        </group>
      )}

      {/* 스티칭 라인 (옆선) */}
      <mesh position={[0.88, 0, 0]}>
        <boxGeometry args={[0.01, 1.8, 0.01]} />
        <meshStandardMaterial color={accentColor} />
      </mesh>
      <mesh position={[-0.88, 0, 0]}>
        <boxGeometry args={[0.01, 1.8, 0.01]} />
        <meshStandardMaterial color={accentColor} />
      </mesh>
    </group>
  );
}

// 로딩 폴백
function LoadingFallback() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e2e8f0" wireframe />
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
        camera={{ position: [0, 0.5, isCap ? 3.5 : 4], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-3, 3, -3]} intensity={0.3} />
          <pointLight position={[0, 2, 3]} intensity={0.4} />

          {isCap ? (
            <Cap3D logoPosition={logoPosition as 'front' | 'side'} />
          ) : (
            <Shirt3D logoPosition={logoPosition as 'front' | 'back' | 'sleeve'} />
          )}

          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.35}
            scale={8}
            blur={2.5}
            far={3}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate
            autoRotateSpeed={0.8}
          />

          <Environment preset="studio" />
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
