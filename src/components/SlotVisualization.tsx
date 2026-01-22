import { cn } from '../utils';
import { lazy, Suspense, useState } from 'react';

// 3D 컴포넌트 동적 로드 (번들 최적화)
const SlotVisualization3D = lazy(() => import('./SlotVisualization3D'));

interface SlotVisualizationProps {
  bodyPart: string;
  brandLogo?: string;
  brandName?: string;
  className?: string;
  use3D?: boolean;
}

/**
 * 슬롯 부착 위치 시각화 컴포넌트
 * - 골프 셔츠/모자 도안에 로고 부착 위치 표시
 * - use3D=true로 3D 시각화 사용 (기본값: true)
 */
export function SlotVisualization({
  bodyPart,
  brandLogo,
  brandName = 'LOGO',
  className,
  use3D = true,
}: SlotVisualizationProps) {
  const [show3D, setShow3D] = useState(use3D);
  const isCap = bodyPart?.startsWith('CAP_');

  // bodyPart를 3D 컴포넌트의 slotType으로 매핑
  const mapBodyPartToSlotType = (part: string): 'SHIRT_FRONT' | 'SHIRT_BACK' | 'SHIRT_SLEEVE' | 'CAP_FRONT' | 'CAP_SIDE' => {
    if (part === 'CAP_BACK' || part === 'CAP_FRONT') return 'CAP_FRONT';
    if (part?.startsWith('CAP_')) return 'CAP_SIDE';
    if (part === 'SHIRT_BACK') return 'SHIRT_BACK';
    if (part?.includes('SLEEVE')) return 'SHIRT_SLEEVE';
    return 'SHIRT_FRONT';
  };

  // 3D 렌더링
  if (show3D) {
    return (
      <div className={cn('relative', className)}>
        <Suspense
          fallback={
            <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center">
              <div className="text-slate-400 text-sm">3D 로딩 중...</div>
            </div>
          }
        >
          <SlotVisualization3D
            slotType={mapBodyPartToSlotType(bodyPart)}
            logoUrl={brandLogo}
            size="md"
          />
        </Suspense>
        {/* 2D/3D 토글 버튼 */}
        <button
          onClick={() => setShow3D(false)}
          className="absolute top-2 left-2 bg-white/80 hover:bg-white px-2 py-1 rounded text-xs text-slate-600 transition-colors"
        >
          2D 보기
        </button>
      </div>
    );
  }

  // 기존 2D 렌더링
  const content = isCap ? (
    <CapVisualization
      bodyPart={bodyPart}
      brandLogo={brandLogo}
      brandName={brandName}
      className={className}
    />
  ) : (
    <ShirtVisualization
      bodyPart={bodyPart}
      brandLogo={brandLogo}
      brandName={brandName}
      className={className}
    />
  );

  return (
    <div className={cn('relative', className)}>
      {content}
      {/* 2D/3D 토글 버튼 */}
      <button
        onClick={() => setShow3D(true)}
        className="absolute top-2 left-2 bg-white/80 hover:bg-white px-2 py-1 rounded text-xs text-slate-600 transition-colors"
      >
        3D 보기
      </button>
    </div>
  );
}

/**
 * 골프 셔츠 시각화
 */
function ShirtVisualization({
  bodyPart,
  brandLogo,
  brandName,
  className,
}: SlotVisualizationProps) {
  // 부착 위치별 좌표
  const positions: Record<string, { x: number; y: number; label: string }> = {
    SHIRT_CHEST_LEFT: { x: 95, y: 95, label: '왼쪽 가슴' },
    SHIRT_CHEST_RIGHT: { x: 155, y: 95, label: '오른쪽 가슴' },
    SHIRT_SLEEVE_LEFT: { x: 45, y: 85, label: '왼쪽 소매' },
    SHIRT_SLEEVE_RIGHT: { x: 205, y: 85, label: '오른쪽 소매' },
    SHIRT_BACK: { x: 125, y: 120, label: '등판' },
    PANTS_BELT: { x: 125, y: 185, label: '벨트' },
  };

  const pos = positions[bodyPart] || positions.SHIRT_CHEST_LEFT;

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 250 220"
        className="w-full h-auto"
        style={{ maxWidth: '300px' }}
      >
        {/* 배경 */}
        <rect width="250" height="220" fill="#f8fafc" rx="12" />

        {/* 셔츠 본체 */}
        <path
          d="M125 30 L90 45 L60 35 L40 70 L60 80 L60 180 L190 180 L190 80 L210 70 L190 35 L160 45 L125 30"
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 칼라 */}
        <path
          d="M90 45 L125 60 L160 45"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 소매 디테일 */}
        <path d="M60 80 L40 70" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M190 80 L210 70" fill="none" stroke="#cbd5e1" strokeWidth="1" />

        {/* 중앙선 */}
        <line x1="125" y1="60" x2="125" y2="180" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />

        {/* 부착 위치 표시 영역 (빨간 점선 사각형) */}
        <rect
          x={pos.x - 25}
          y={pos.y - 15}
          width="50"
          height="30"
          fill="rgba(16, 185, 129, 0.1)"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="4,2"
          rx="4"
        />

        {/* 로고 또는 브랜드명 */}
        {brandLogo ? (
          <image
            href={brandLogo}
            x={pos.x - 20}
            y={pos.y - 12}
            width="40"
            height="24"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#10b981"
            fontSize="10"
            fontWeight="bold"
          >
            {brandName}
          </text>
        )}

        {/* 위치 설명 라벨 */}
        <rect
          x={pos.x - 30}
          y={pos.y + 20}
          width="60"
          height="18"
          fill="#10b981"
          rx="9"
        />
        <text
          x={pos.x}
          y={pos.y + 29}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="9"
          fontWeight="500"
        >
          {pos.label}
        </text>
      </svg>

      {/* 범례 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-emerald-500 border-dashed rounded" />
          <span>부착 위치</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 골프 모자 시각화
 */
function CapVisualization({
  bodyPart,
  brandLogo,
  brandName,
  className,
}: SlotVisualizationProps) {
  const isBack = bodyPart === 'CAP_BACK';

  if (isBack) {
    return (
      <CapBackView
        brandLogo={brandLogo}
        brandName={brandName}
        className={className}
      />
    );
  }

  return (
    <CapSideView
      bodyPart={bodyPart}
      brandLogo={brandLogo}
      brandName={brandName}
      className={className}
    />
  );
}

/**
 * 모자 측면 뷰
 */
function CapSideView({
  bodyPart,
  brandLogo,
  brandName,
  className,
}: SlotVisualizationProps) {
  const isLeft = bodyPart === 'CAP_SIDE_LEFT';

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 250 180"
        className="w-full h-auto"
        style={{ maxWidth: '300px' }}
      >
        {/* 배경 */}
        <rect width="250" height="180" fill="#f8fafc" rx="12" />

        {/* 모자 본체 - 측면 뷰 */}
        <g transform={isLeft ? '' : 'translate(250, 0) scale(-1, 1)'}>
          {/* 챙 */}
          <ellipse
            cx="85"
            cy="130"
            rx="70"
            ry="15"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* 모자 크라운 */}
          <path
            d="M40 130 Q40 60 125 50 Q180 55 180 90 Q180 130 180 130 L40 130"
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* 모자 패널 구분선 */}
          <path d="M80 55 Q90 90 85 130" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          <path d="M130 52 Q135 90 130 130" fill="none" stroke="#cbd5e1" strokeWidth="1" />

          {/* 버튼 */}
          <circle cx="125" cy="50" r="5" fill="#94a3b8" />

          {/* 부착 위치 표시 (측면) */}
          <rect
            x="55"
            y="70"
            width="50"
            height="25"
            fill="rgba(16, 185, 129, 0.1)"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4,2"
            rx="4"
          />

          {/* 로고 또는 브랜드명 */}
          {brandLogo ? (
            <image
              href={brandLogo}
              x="60"
              y="73"
              width="40"
              height="19"
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <text
              x="80"
              y="83"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#10b981"
              fontSize="10"
              fontWeight="bold"
            >
              {brandName}
            </text>
          )}
        </g>

        {/* 위치 설명 라벨 */}
        <rect
          x="95"
          y="150"
          width="60"
          height="18"
          fill="#10b981"
          rx="9"
        />
        <text
          x="125"
          y="159"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="9"
          fontWeight="500"
        >
          {isLeft ? '모자 측면(좌)' : '모자 측면(우)'}
        </text>
      </svg>

      {/* 범례 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-emerald-500 border-dashed rounded" />
          <span>부착 위치</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 모자 후면 뷰
 */
function CapBackView({
  brandLogo,
  brandName,
  className,
}: Omit<SlotVisualizationProps, 'bodyPart'>) {
  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 250 180"
        className="w-full h-auto"
        style={{ maxWidth: '300px' }}
      >
        {/* 배경 */}
        <rect width="250" height="180" fill="#f8fafc" rx="12" />

        {/* 모자 본체 - 후면 뷰 */}
        {/* 크라운 */}
        <ellipse
          cx="125"
          cy="70"
          rx="80"
          ry="50"
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 모자 밴드 */}
        <ellipse
          cx="125"
          cy="115"
          rx="75"
          ry="20"
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 조절 스트랩 */}
        <rect x="100" y="108" width="50" height="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" rx="2" />

        {/* 패널 구분선 */}
        <path d="M75 30 Q75 70 75 115" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M175 30 Q175 70 175 115" fill="none" stroke="#cbd5e1" strokeWidth="1" />

        {/* 부착 위치 표시 (후면) */}
        <rect
          x="100"
          y="50"
          width="50"
          height="25"
          fill="rgba(16, 185, 129, 0.1)"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="4,2"
          rx="4"
        />

        {/* 로고 또는 브랜드명 */}
        {brandLogo ? (
          <image
            href={brandLogo}
            x="105"
            y="53"
            width="40"
            height="19"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <text
            x="125"
            y="63"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#10b981"
            fontSize="10"
            fontWeight="bold"
          >
            {brandName}
          </text>
        )}

        {/* 위치 설명 라벨 */}
        <rect
          x="95"
          y="145"
          width="60"
          height="18"
          fill="#10b981"
          rx="9"
        />
        <text
          x="125"
          y="154"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="9"
          fontWeight="500"
        >
          모자 후면
        </text>
      </svg>

      {/* 범례 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-emerald-500 border-dashed rounded" />
          <span>부착 위치</span>
        </div>
      </div>
    </div>
  );
}

export default SlotVisualization;
