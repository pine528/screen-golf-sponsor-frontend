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
  use3D = false,  // 기본값을 2D로 변경
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
  if (bodyPart === 'CAP_BACK') {
    return (
      <CapBackView
        brandLogo={brandLogo}
        brandName={brandName}
        className={className}
      />
    );
  }

  if (bodyPart === 'CAP_FRONT') {
    return (
      <CapFrontView
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
 * 모자 측면 뷰 - 실제 야구모자 형태
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
        viewBox="0 0 512 512"
        className="w-full h-auto"
        style={{ maxWidth: '300px' }}
      >
        <defs>
          <linearGradient id="capSideGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="brimGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* 배경 */}
        <rect width="512" height="512" fill="#f1f5f9" rx="24" />

        {/* 모자 본체 - 측면 뷰 */}
        <g transform={isLeft ? '' : 'translate(512, 0) scale(-1, 1)'}>
          {/* 챙 - 앞으로 뻗어나가는 형태 */}
          <path
            d="M90 290
               C90 300 80 310 70 315
               L70 325
               C90 330 150 335 200 325
               C220 320 250 305 260 290
               C260 285 250 278 200 280
               C150 282 100 285 90 290 Z"
            fill="url(#brimGrad)"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* 챙 하단 그림자 */}
          <path
            d="M75 318 C110 328 170 332 220 322 C240 318 255 308 258 295"
            fill="none"
            stroke="#64748b"
            strokeWidth="1"
            strokeOpacity="0.3"
          />

          {/* 크라운 (측면) */}
          <path
            d="M90 290
               C90 230 130 170 200 150
               C280 130 360 150 400 200
               C430 240 440 280 430 300
               C420 330 390 350 350 360
               C310 370 260 372 220 368
               C180 364 140 350 110 330
               C95 318 90 305 90 290 Z"
            fill="url(#capSideGrad)"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* 패널 구분선 */}
          <path d="M180 155 C195 210 200 270 195 365" fill="none" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
          <path d="M280 145 C290 200 290 260 280 360" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />
          <path d="M370 170 C380 220 380 280 365 355" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />

          {/* 버튼 */}
          <circle cx="280" cy="138" r="10" fill="#cbd5e1" />
          <circle cx="280" cy="138" r="10" fill="none" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="2" />

          {/* 아일릿 */}
          <circle cx="250" cy="200" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="340" cy="210" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

          {/* 부착 위치 표시 (측면) */}
          <rect
            x="130"
            y="200"
            width="100"
            height="60"
            fill="rgba(16, 185, 129, 0.15)"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="8,4"
            rx="8"
          />

          {/* 로고 또는 브랜드명 */}
          {brandLogo ? (
            <image
              href={brandLogo}
              x="140"
              y="212"
              width="80"
              height="36"
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <text
              x="180"
              y="230"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#10b981"
              fontSize="20"
              fontWeight="bold"
            >
              {brandName}
            </text>
          )}
        </g>

        {/* 위치 설명 라벨 */}
        <rect
          x="180"
          y="420"
          width="150"
          height="36"
          fill="#10b981"
          rx="18"
        />
        <text
          x="255"
          y="438"
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
  brandName,
  className,
}: Omit<SlotVisualizationProps, 'bodyPart'>) {
  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 512 512"
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
        <rect width="512" height="512" fill="#f1f5f9" rx="24" />

        {/* 크라운 (정면) */}
        <path
          d="M100 300
             C100 220 140 150 180 120
             C220 90 260 80 260 80
             C260 80 300 90 340 120
             C380 150 420 220 420 300
             C420 340 400 360 360 375
             C320 390 290 395 260 395
             C230 395 200 390 160 375
             C120 360 100 340 100 300 Z"
          fill="url(#capFrontGrad)"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 패널 구분선 */}
        <path d="M260 85 C260 150 260 250 260 390" fill="none" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
        <path d="M180 115 C190 180 195 280 175 385" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />
        <path d="M340 115 C330 180 325 280 345 385" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />

        {/* 버튼 */}
        <circle cx="260" cy="85" r="12" fill="#cbd5e1" />
        <circle cx="260" cy="85" r="12" fill="none" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="2" />

        {/* 챙 (정면에서 보이는 부분) */}
        <ellipse
          cx="260"
          cy="380"
          rx="160"
          ry="30"
          fill="url(#brimFrontGrad)"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 챙 상단 라인 */}
        <path
          d="M100 375 Q260 350 420 375"
          fill="none"
          stroke="#64748b"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* 부착 위치 표시 (정면 중앙) */}
        <rect
          x="180"
          y="180"
          width="160"
          height="80"
          fill="rgba(16, 185, 129, 0.15)"
          stroke="#10b981"
          strokeWidth="3"
          strokeDasharray="8,4"
          rx="8"
        />

        {/* 로고 또는 브랜드명 */}
        {brandLogo ? (
          <image
            href={brandLogo}
            x="200"
            y="195"
            width="120"
            height="50"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <text
            x="260"
            y="220"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#10b981"
            fontSize="28"
            fontWeight="bold"
          >
            {brandName}
          </text>
        )}

        {/* 위치 설명 라벨 */}
        <rect
          x="200"
          y="440"
          width="120"
          height="36"
          fill="#10b981"
          rx="18"
        />
        <text
          x="260"
          y="458"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="18"
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
  brandName,
  className,
}: Omit<SlotVisualizationProps, 'bodyPart'>) {
  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 512 512"
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
        <rect width="512" height="512" fill="#f1f5f9" rx="24" />

        {/* 크라운 (후면) */}
        <path
          d="M130 270
             C130 190 196 135 260 135
             C332 135 396 188 410 262
             C416 296 394 322 360 336
             C326 350 292 358 260 358
             C220 358 184 348 156 334
             C140 326 125 304 130 270 Z"
          fill="url(#capBackGrad)"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* 패널 구분선 */}
        <path d="M260 140 C250 190 250 240 260 356" fill="none" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
        <path d="M212 156 C230 206 238 254 236 350" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />
        <path d="M308 156 C290 206 282 254 284 350" fill="none" stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="3" strokeLinecap="round" />

        {/* 버튼 */}
        <circle cx="260" cy="138" r="10" fill="#cbd5e1" />
        <circle cx="260" cy="138" r="10" fill="none" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="2" />

        {/* 후면 개구부 */}
        <path
          d="M192 320
             C210 346 238 360 260 360
             C282 360 310 346 328 320
             C314 312 292 306 260 306
             C228 306 206 312 192 320 Z"
          fill="#e2e8f0"
          opacity="0.9"
        />

        {/* 스트랩 */}
        <path
          d="M206 324
             C228 312 244 308 260 308
             C276 308 292 312 314 324
             C304 340 284 350 260 350
             C236 350 216 340 206 324 Z"
          fill="#cbd5e1"
          opacity="0.95"
        />

        {/* 버클 */}
        <rect x="304" y="324" width="30" height="18" rx="6" fill="#94a3b8" opacity="0.9" />
        <rect x="309" y="328" width="20" height="10" rx="4" fill="#64748b" opacity="0.9" />

        {/* 아일릿 */}
        <circle cx="205" cy="210" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="315" cy="210" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

        {/* 부착 위치 표시 (후면 상단) */}
        <rect
          x="210"
          y="180"
          width="100"
          height="50"
          fill="rgba(16, 185, 129, 0.15)"
          stroke="#10b981"
          strokeWidth="3"
          strokeDasharray="8,4"
          rx="8"
        />

        {/* 로고 또는 브랜드명 */}
        {brandLogo ? (
          <image
            href={brandLogo}
            x="220"
            y="188"
            width="80"
            height="34"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <text
            x="260"
            y="205"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#10b981"
            fontSize="20"
            fontWeight="bold"
          >
            {brandName}
          </text>
        )}

        {/* 위치 설명 라벨 */}
        <rect
          x="200"
          y="400"
          width="120"
          height="36"
          fill="#10b981"
          rx="18"
        />
        <text
          x="260"
          y="418"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="18"
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
