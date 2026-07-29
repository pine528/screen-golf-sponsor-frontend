/**
 * 개편 Phase 2 (WF-04 §7.5) — 슬롯 인벤토리 도식
 *
 * 실루엣과 슬롯 마커를 하나의 SVG 좌표계 안에서 그린다.
 * (마커를 CSS %로 따로 얹으면 SVG 레터박스 때문에 그림과 어긋난다 — 2026-07-29 수정)
 *
 * viewBox 75×100 = 컨테이너 3:4 비율과 동일하므로 여백 없이 정확히 채워진다.
 * 좌표는 백분율(x%, y%)로 저장되며 svgX = x% × 0.75, svgY = y% 로 매핑한다.
 */

export type SlotStatusKind = 'AVAILABLE' | 'AUCTION_ACTIVE' | 'HELD' | 'SOLD' | 'RESTRICTED' | 'PENDING_APPROVAL' | 'UNAVAILABLE';

export const STATUS_META: Record<string, { label: string; dot: string; fill: string; text: string; selectable: boolean }> = {
  AVAILABLE: { label: '구매 가능', dot: 'bg-emerald-500', fill: '#10b981', text: 'text-emerald-700', selectable: true },
  AUCTION_ACTIVE: { label: '경매 진행중', dot: 'bg-amber-500', fill: '#f59e0b', text: 'text-amber-700', selectable: true },
  HELD: { label: '예약중', dot: 'bg-slate-400', fill: '#94a3b8', text: 'text-slate-500', selectable: false },
  SOLD: { label: '판매완료', dot: 'bg-slate-300', fill: '#cbd5e1', text: 'text-slate-400', selectable: false },
  RESTRICTED: { label: '제한', dot: 'bg-rose-400', fill: '#fb7185', text: 'text-rose-600', selectable: false },
  PENDING_APPROVAL: { label: '승인 대기', dot: 'bg-violet-400', fill: '#a78bfa', text: 'text-violet-600', selectable: false },
  UNAVAILABLE: { label: '판매 안함', dot: 'bg-slate-300', fill: '#cbd5e1', text: 'text-slate-400', selectable: false },
};

export type DiagramSlot = {
  id: string;
  code: string;
  name: string;
  x: number | null;
  y: number | null;
  status: string;
  price: number | null;
};

/** 백분율 좌표 → SVG 좌표 (viewBox 75×100) */
const sx = (xPct: number) => xPct * 0.75;

export default function SlotDiagram({
  slots,
  selectedId,
  onSelect,
}: {
  slots: DiagramSlot[];
  selectedId?: string | null;
  onSelect: (slot: DiagramSlot) => void;
}) {
  const placed = slots.filter((s) => s.x != null && s.y != null);
  const unplaced = slots.filter((s) => s.x == null || s.y == null);

  return (
    <div>
      {/* 도식을 조금 키워 마커가 작아져도 누르기 쉽게 한다 */}
      <div className="relative w-full max-w-[360px] mx-auto aspect-[3/4] rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <svg viewBox="0 0 75 100" className="w-full h-full" role="img" aria-label="선수 착장 슬롯 도식">
          {/* 착장 도식 — 3:4 비율 이미지라 viewBox를 그대로 채운다.
              마커 좌표는 이 이미지 기준으로 측정한 값(slot-display-coords.ts)과 짝을 이룬다. */}
          <image href="/slots/figure-front.png" x="0" y="0" width="75" height="100" preserveAspectRatio="xMidYMid meet" />

          {/* 슬롯 마커 */}
          {placed.map((s) => {
            const meta = STATUS_META[s.status] || STATUS_META.UNAVAILABLE;
            const active = s.id === selectedId;
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                aria-label={`${s.name} ${meta.label}`}
                aria-pressed={active}
                onClick={() => onSelect(s)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(s);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                {active && <circle cx={sx(s.x!)} cy={s.y!} r={2.8} fill="#0f172a" opacity={0.12} />}
                {/* 마커는 작게 그리되 누르는 범위는 넓게 둔다.
                    모자처럼 슬롯이 몰린 곳에서 서로 겹치거나 얼굴까지 덮지 않도록 한 것. */}
                <circle cx={sx(s.x!)} cy={s.y!} r={2.6} fill="transparent" />
                <circle
                  cx={sx(s.x!)}
                  cy={s.y!}
                  r={active ? 1.7 : 1.2}
                  fill={meta.fill}
                  stroke="#ffffff"
                  strokeWidth={active ? 0.6 : 0.45}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-3">
        {['AVAILABLE', 'AUCTION_ACTIVE', 'HELD', 'SOLD'].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className={`w-2 h-2 rounded-full ${STATUS_META[k].dot}`} />
            {STATUS_META[k].label}
          </span>
        ))}
      </div>

      {unplaced.length > 0 && (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          도식 미표기 슬롯 {unplaced.length}개는 아래 목록에서 선택할 수 있습니다.
        </p>
      )}
    </div>
  );
}
