import { cn } from '../utils';

const DEFAULT_LOGO = '/ccubelogo.png';

interface SlotVisualizationProps {
  bodyPart: string;
  brandLogo?: string;
  brandName?: string;
  className?: string;
}

/**
 * 슬롯 부착 위치 시각화 컴포넌트
 * - 골프 셔츠/모자 도안에 로고 부착 위치 표시
 */
export function SlotVisualization({
  bodyPart,
  brandLogo = DEFAULT_LOGO,
  brandName = 'LOGO',
  className,
}: SlotVisualizationProps) {
  const isCap = bodyPart?.startsWith('CAP_');

  return isCap ? (
    <CapVisualization
      bodyPart={bodyPart}
      brandLogo={brandLogo}
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
  className,
}: Omit<SlotVisualizationProps, 'brandName'>) {
  if (bodyPart === 'CAP_BACK') {
    return (
      <CapBackView
        brandLogo={brandLogo}
        className={className}
      />
    );
  }

  if (bodyPart === 'CAP_FRONT') {
    return (
      <CapFrontView
        brandLogo={brandLogo}
        className={className}
      />
    );
  }

  return (
    <CapSideView
      bodyPart={bodyPart}
      brandLogo={brandLogo}
      className={className}
    />
  );
}

/**
 * 모자 측면 뷰 - 실제 PNG 이미지 사용
 * 이미지 출처: pngimg.com (CC 4.0 BY-NC)
 */
function CapSideView({
  bodyPart,
  brandLogo,
  className,
}: Omit<SlotVisualizationProps, 'brandName'>) {
  const isLeft = bodyPart === 'CAP_SIDE_LEFT';

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* 모자 이미지 컨테이너 */}
      <div
        className="relative bg-slate-100 rounded-2xl p-6"
        style={{ maxWidth: '300px' }}
      >
        {/* 모자 이미지 */}
        <img
          src="/cap-side.png"
          alt="Baseball Cap Side View"
          className="w-full h-auto"
          style={{
            transform: isLeft ? 'none' : 'scaleX(-1)',
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))',
          }}
        />

        {/* 부착 위치 오버레이 */}
        <div
          className="absolute border-2 border-dashed border-emerald-500 rounded-lg bg-emerald-500/10 flex items-center justify-center overflow-hidden"
          style={{
            top: '30%',
            left: isLeft ? '35%' : '25%',
            width: '40%',
            height: '35%',
          }}
        >
          {/* 로고 */}
          <img
            src={brandLogo}
            alt="Brand Logo"
            className="max-w-[80%] max-h-[80%] object-contain"
          />
        </div>
      </div>

      {/* 위치 설명 라벨 */}
      <div className="mt-4 px-6 py-2 bg-emerald-500 text-white text-sm font-medium rounded-full">
        {isLeft ? '모자 측면(좌)' : '모자 측면(우)'}
      </div>

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
 * 모자 정면 뷰 - 실제 PNG 이미지 사용
 * 이미지 출처: pngimg.com (CC 4.0 BY-NC)
 */
function CapFrontView({
  brandLogo,
  className,
}: Omit<SlotVisualizationProps, 'bodyPart' | 'brandName'>) {
  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* 모자 이미지 컨테이너 */}
      <div
        className="relative bg-slate-100 rounded-2xl p-6"
        style={{ maxWidth: '300px' }}
      >
        {/* 모자 이미지 */}
        <img
          src="/cap-front.png"
          alt="Baseball Cap Front View"
          className="w-full h-auto"
          style={{
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))',
          }}
        />

        {/* 부착 위치 오버레이 */}
        <div
          className="absolute border-2 border-dashed border-emerald-500 rounded-lg bg-emerald-500/10 flex items-center justify-center overflow-hidden"
          style={{
            top: '25%',
            left: '25%',
            width: '50%',
            height: '35%',
          }}
        >
          {/* 로고 */}
          <img
            src={brandLogo}
            alt="Brand Logo"
            className="max-w-[80%] max-h-[80%] object-contain"
          />
        </div>
      </div>

      {/* 위치 설명 라벨 */}
      <div className="mt-4 px-6 py-2 bg-emerald-500 text-white text-sm font-medium rounded-full">
        모자 정면
      </div>

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
 * 모자 후면 뷰 - 실제 PNG 이미지 사용
 * 이미지 출처: pngimg.com (CC 4.0 BY-NC)
 */
function CapBackView({
  brandLogo,
  className,
}: Omit<SlotVisualizationProps, 'bodyPart' | 'brandName'>) {
  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* 모자 이미지 컨테이너 */}
      <div
        className="relative bg-slate-100 rounded-2xl p-6"
        style={{ maxWidth: '300px' }}
      >
        {/* 모자 이미지 */}
        <img
          src="/cap-back.png"
          alt="Baseball Cap Back View"
          className="w-full h-auto"
          style={{
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))',
          }}
        />

        {/* 부착 위치 오버레이 */}
        <div
          className="absolute border-2 border-dashed border-emerald-500 rounded-lg bg-emerald-500/10 flex items-center justify-center overflow-hidden"
          style={{
            top: '20%',
            left: '30%',
            width: '40%',
            height: '30%',
          }}
        >
          {/* 로고 */}
          <img
            src={brandLogo}
            alt="Brand Logo"
            className="max-w-[80%] max-h-[80%] object-contain"
          />
        </div>
      </div>

      {/* 위치 설명 라벨 */}
      <div className="mt-4 px-6 py-2 bg-emerald-500 text-white text-sm font-medium rounded-full">
        모자 후면
      </div>

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
