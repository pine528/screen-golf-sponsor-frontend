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
 * 모자 측면 뷰 - 실제 야구모자 형태
 */
function CapSideView({
  bodyPart,
  brandLogo,
  className,
}: Omit<SlotVisualizationProps, 'brandName'>) {
  const isLeft = bodyPart === 'CAP_SIDE_LEFT';

  return (
    <div className={cn('relative flex justify-center', className)}>
      <svg
        viewBox="0 0 512 400"
        className="w-full h-auto"
        style={{ maxWidth: '300px' }}
      >
        <defs>
          <linearGradient id="capSideGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="brimSideGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* 배경 */}
        <rect width="512" height="400" fill="#f1f5f9" rx="24" />

        {/* 모자 본체 - 측면 뷰 */}
        <g transform={isLeft ? 'translate(30, 0)' : 'translate(482, 0) scale(-1, 1)'}>
          {/* 크라운 (측면) - 둥근 반구 형태 */}
          <path
            d="M120 240
               C120 180 150 120 220 95
               C290 70 360 85 400 130
               C430 165 445 210 440 250
               C435 290 400 320 350 335
               C300 350 240 352 180 340
               C140 330 120 290 120 240 Z"
            fill="url(#capSideGrad)"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* 챙 - 앞으로 뻗어나가는 자연스러운 형태 */}
          <path
            d="M120 240
               C110 245 90 250 60 260
               C40 268 25 280 30 295
               C35 310 60 318 100 320
               C140 322 170 315 180 305
               C185 298 175 280 150 265
               C135 255 125 248 120 240 Z"
            fill="url(#brimSideGrad)"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* 챙 상단 라인 */}
          <path
            d="M120 240 C100 248 70 258 50 270"
            fill="none"
            stroke="#64748b"
            strokeWidth="1"
            strokeOpacity="0.2"
          />

          {/* 패널 구분선 */}
          <path d="M220 100 C230 150 235 200 230 340" fill="none" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
          <path d="M310 90 C315 140 315 200 310 340" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />
          <path d="M390 120 C400 170 400 230 385 335" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />

          {/* 버튼 */}
          <circle cx="310" cy="82" r="10" fill="#cbd5e1" />
          <circle cx="310" cy="82" r="10" fill="none" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="2" />

          {/* 아일릿 */}
          <circle cx="280" cy="150" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="370" cy="165" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

          {/* 부착 위치 표시 (측면) */}
          <rect
            x="170"
            y="160"
            width="100"
            height="60"
            fill="rgba(16, 185, 129, 0.15)"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="8,4"
            rx="8"
          />

          {/* 로고 */}
          <image
            href={brandLogo}
            x="180"
            y="170"
            width="80"
            height="40"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* 위치 설명 라벨 */}
        <rect
          x="180"
          y="350"
          width="150"
          height="32"
          fill="#10b981"
          rx="16"
        />
        <text
          x="255"
          y="366"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="18"
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
 * 모자 정면 뷰 - 실제 야구모자 형태
 */
function CapFrontView({
  brandLogo,
  className,
}: Omit<SlotVisualizationProps, 'bodyPart' | 'brandName'>) {
  return (
    <div className={cn('relative flex justify-center', className)}>
      <svg
        viewBox="0 0 512 420"
        className="w-full h-auto"
        style={{ maxWidth: '300px' }}
      >
        <defs>
          <linearGradient id="capFrontGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="brimFrontGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* 배경 */}
        <rect width="512" height="420" fill="#f1f5f9" rx="24" />

        {/* 크라운 (정면) */}
        <path
          d="M100 260
             C100 180 140 110 180 80
             C220 50 256 40 256 40
             C256 40 292 50 332 80
             C372 110 412 180 412 260
             C412 300 392 320 352 335
             C312 350 282 355 256 355
             C230 355 200 350 160 335
             C120 320 100 300 100 260 Z"
          fill="url(#capFrontGrad)"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 패널 구분선 */}
        <path d="M256 45 C256 110 256 210 256 350" fill="none" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
        <path d="M180 75 C190 140 195 240 175 345" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />
        <path d="M332 75 C322 140 317 240 337 345" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />

        {/* 버튼 */}
        <circle cx="256" cy="45" r="12" fill="#cbd5e1" />
        <circle cx="256" cy="45" r="12" fill="none" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="2" />

        {/* 챙 (정면에서 보이는 부분) */}
        <ellipse
          cx="256"
          cy="340"
          rx="155"
          ry="28"
          fill="url(#brimFrontGrad)"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 챙 상단 라인 */}
        <path
          d="M100 335 Q256 310 412 335"
          fill="none"
          stroke="#64748b"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* 부착 위치 표시 (정면 중앙) */}
        <rect
          x="176"
          y="140"
          width="160"
          height="80"
          fill="rgba(16, 185, 129, 0.15)"
          stroke="#10b981"
          strokeWidth="3"
          strokeDasharray="8,4"
          rx="8"
        />

        {/* 로고 */}
        <image
          href={brandLogo}
          x="196"
          y="155"
          width="120"
          height="50"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* 위치 설명 라벨 */}
        <rect
          x="196"
          y="378"
          width="120"
          height="32"
          fill="#10b981"
          rx="16"
        />
        <text
          x="256"
          y="394"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="16"
          fontWeight="500"
        >
          모자 정면
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
 * 모자 후면 뷰 - 실제 야구모자 형태
 */
function CapBackView({
  brandLogo,
  className,
}: Omit<SlotVisualizationProps, 'bodyPart' | 'brandName'>) {
  return (
    <div className={cn('relative flex justify-center', className)}>
      <svg
        viewBox="0 0 512 420"
        className="w-full h-auto"
        style={{ maxWidth: '300px' }}
      >
        <defs>
          <linearGradient id="capBackGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>

        {/* 배경 */}
        <rect width="512" height="420" fill="#f1f5f9" rx="24" />

        {/* 크라운 (후면) */}
        <path
          d="M130 230
             C130 150 196 95 260 95
             C332 95 396 148 410 222
             C416 256 394 282 360 296
             C326 310 292 318 260 318
             C220 318 184 308 156 294
             C140 286 125 264 130 230 Z"
          fill="url(#capBackGrad)"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 패널 구분선 */}
        <path d="M260 100 C250 150 250 200 260 316" fill="none" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
        <path d="M212 116 C230 166 238 214 236 310" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />
        <path d="M308 116 C290 166 282 214 284 310" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />

        {/* 버튼 */}
        <circle cx="260" cy="98" r="10" fill="#cbd5e1" />
        <circle cx="260" cy="98" r="10" fill="none" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="2" />

        {/* 후면 개구부 */}
        <path
          d="M192 280
             C210 306 238 320 260 320
             C282 320 310 306 328 280
             C314 272 292 266 260 266
             C228 266 206 272 192 280 Z"
          fill="#e2e8f0"
          opacity="0.9"
        />

        {/* 스트랩 */}
        <path
          d="M206 284
             C228 272 244 268 260 268
             C276 268 292 272 314 284
             C304 300 284 310 260 310
             C236 310 216 300 206 284 Z"
          fill="#cbd5e1"
          opacity="0.95"
        />

        {/* 버클 */}
        <rect x="304" y="284" width="30" height="18" rx="6" fill="#94a3b8" opacity="0.9" />
        <rect x="309" y="288" width="20" height="10" rx="4" fill="#64748b" opacity="0.9" />

        {/* 아일릿 */}
        <circle cx="205" cy="170" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="315" cy="170" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

        {/* 부착 위치 표시 (후면 상단) */}
        <rect
          x="210"
          y="140"
          width="100"
          height="50"
          fill="rgba(16, 185, 129, 0.15)"
          stroke="#10b981"
          strokeWidth="3"
          strokeDasharray="8,4"
          rx="8"
        />

        {/* 로고 */}
        <image
          href={brandLogo}
          x="220"
          y="148"
          width="80"
          height="34"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* 위치 설명 라벨 */}
        <rect
          x="200"
          y="350"
          width="120"
          height="32"
          fill="#10b981"
          rx="16"
        />
        <text
          x="260"
          y="366"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="16"
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
