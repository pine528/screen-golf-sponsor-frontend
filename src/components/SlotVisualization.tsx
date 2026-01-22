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
        viewBox="0 0 400 300"
        className="w-full h-auto"
        style={{ maxWidth: '320px' }}
      >
        <defs>
          {/* 크라운 그라데이션 */}
          <linearGradient id="capCrownGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
          {/* 챙 그라데이션 */}
          <linearGradient id="capBrimGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
          {/* 챙 밑면 그라데이션 */}
          <linearGradient id="capBrimUnder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#64748b" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* 배경 */}
        <rect width="400" height="300" fill="#f1f5f9" rx="16" />

        {/* 모자 본체 - 측면 뷰 */}
        <g transform={isLeft ? 'translate(60, 30)' : 'translate(340, 30) scale(-1, 1)'}>

          {/* 크라운 - 둥근 돔 형태 */}
          <path
            d="M80 150
               C80 150 75 120 85 90
               C95 60 120 35 160 25
               C200 15 240 20 270 35
               C300 50 315 80 318 110
               C321 140 318 165 310 180
               C300 195 280 205 250 210
               C220 215 180 215 140 210
               C110 206 90 195 82 175
               C78 165 80 155 80 150 Z"
            fill="url(#capCrownGrad)"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* 패널 구분선 */}
          <path d="M160 28 Q165 80 162 208" fill="none" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M220 22 Q225 75 222 212" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="2" />
          <path d="M275 38 Q282 90 278 205" fill="none" stroke="#94a3b8" strokeOpacity="0.1" strokeWidth="2" />

          {/* 버튼 */}
          <ellipse cx="220" cy="22" rx="8" ry="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />

          {/* 아일릿 */}
          <circle cx="190" cy="75" r="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="250" cy="70" r="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="295" cy="95" r="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          {/* 아일릿 구멍 */}
          <circle cx="190" cy="75" r="2" fill="#94a3b8" />
          <circle cx="250" cy="70" r="2" fill="#94a3b8" />
          <circle cx="295" cy="95" r="2" fill="#94a3b8" />

          {/* 챙 - 앞으로 길게 뻗어나가며 살짝 아래로 휨 */}
          {/* 챙 밑면 (그림자) */}
          <path
            d="M80 155
               Q60 158 30 165
               Q0 172 -25 182
               Q-45 190 -55 200
               Q-60 206 -55 210
               Q-45 216 -20 218
               Q10 220 45 218
               Q70 216 85 212
               L85 205
               Q70 208 45 210
               Q15 212 -15 210
               Q-40 208 -50 204
               Q-55 200 -50 196
               Q-40 190 -20 184
               Q5 176 35 170
               Q60 165 80 162 Z"
            fill="url(#capBrimUnder)"
          />

          {/* 챙 상면 (메인) */}
          <path
            d="M80 150
               Q55 152 25 158
               Q-5 165 -30 175
               Q-50 183 -58 192
               Q-62 198 -58 203
               Q-50 210 -25 214
               Q5 218 40 216
               Q70 214 88 208
               Q95 204 92 195
               Q88 180 85 165
               Q82 155 80 150 Z"
            fill="url(#capBrimGrad)"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* 챙 끝부분 두께 */}
          <path
            d="M-58 192 Q-62 198 -58 203 Q-55 206 -55 200 Q-58 196 -58 192 Z"
            fill="#64748b"
          />

          {/* 챙 스티칭 */}
          <path
            d="M78 158 Q50 162 20 170 Q-10 180 -35 190 Q-50 198 -52 204"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4,3"
            strokeOpacity="0.4"
          />

          {/* 땀받이 밴드 */}
          <path
            d="M82 160 Q90 180 95 200 Q98 210 110 215"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* 부착 위치 표시 */}
          <rect
            x="130"
            y="80"
            width="85"
            height="55"
            fill="rgba(16, 185, 129, 0.15)"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="6,3"
            rx="6"
          />

          {/* 로고 */}
          <image
            href={brandLogo}
            x="138"
            y="88"
            width="70"
            height="40"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* 위치 설명 라벨 */}
        <rect
          x="125"
          y="255"
          width="150"
          height="28"
          fill="#10b981"
          rx="14"
        />
        <text
          x="200"
          y="269"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="14"
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
