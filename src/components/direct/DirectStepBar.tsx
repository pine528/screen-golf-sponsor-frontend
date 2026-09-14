/**
 * 직접 PICK 공통 9단계 스텝바 — 시안 2026-09-14 (숫자 원 + 연결선 + 단계명)
 * 브레드크럼 홈 > 후원하기(/sponsor) > 직접 PICK > 현재 단계. 이전 단계 링크는 각 화면이 넘긴다.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Home, Save } from 'lucide-react';

export const DIRECT_STEPS = [
  '선수 탐색', '선수 확인', '상품 PICK', '조건 구성', '견적함',
  '승인 요청', '선수 승인', '결제', '완료',
] as const;

export default function DirectStepBar({
  current,
  crumbs = [],
  backTo,
  backLabel = '이전 단계',
  onSaveDraft,
  bare,
}: {
  /** 1~9 */
  current: number;
  crumbs?: { label: string; to?: string }[];
  backTo?: string;
  backLabel?: string;
  onSaveDraft?: () => void;
  /** 브레드크럼·이전 단계를 화면이 직접 그릴 때 스텝 표시만 */
  bare?: boolean;
}) {
  const steps = (
    <ol className="flex items-start gap-0 overflow-x-auto pb-1" aria-label="진행 단계">
      {DIRECT_STEPS.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={s} className="flex items-start shrink-0">
            <div className="flex flex-col items-center w-[64px] sm:w-[92px]">
              <span
                aria-current={active ? 'step' : undefined}
                className={`w-8 h-8 rounded-full text-[13px] font-black flex items-center justify-center ${
                  done ? 'bg-emerald-100 text-emerald-700'
                    : active ? 'bg-emerald-500 text-white shadow-[0_8px_18px_-8px_rgba(16,185,129,0.8)]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : n}
              </span>
              <span className={`mt-1.5 text-[11.5px] sm:text-[12.5px] font-bold whitespace-nowrap ${
                active ? 'text-emerald-700' : done ? 'text-slate-600' : 'text-slate-500'
              }`}>
                {s}
              </span>
            </div>
            {n < DIRECT_STEPS.length && (
              <span aria-hidden className={`mt-4 h-px w-4 sm:w-8 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );

  if (bare) return <div className="rounded-2xl bg-white border border-slate-200 px-4 py-4">{steps}</div>;

  return (
    <div className="border-b border-slate-100 bg-white">
      <div className="max-w-[1400px] mx-auto px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px] min-w-0">
            <Link to="/" className="text-slate-500 hover:text-slate-700 shrink-0" aria-label="홈">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <Link to="/sponsor" className="text-slate-500 hover:text-slate-700 shrink-0">후원하기</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <Link to="/sponsor/direct/athletes" className="text-slate-500 hover:text-slate-700 shrink-0">직접 PICK</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                {c.to
                  ? <Link to={c.to} className="text-slate-500 hover:text-slate-700 truncate">{c.label}</Link>
                  : <span className="font-bold text-emerald-700 truncate">{c.label}</span>}
              </span>
            ))}
          </nav>
          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              className="shrink-0 h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
            >
              <Save className="w-3.5 h-3.5" /> 임시저장
            </button>
          )}
        </div>

        <div className="mt-3">{steps}</div>

        {backTo && (
          <Link to={backTo} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
            <ArrowLeft className="w-4 h-4" /> {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

/** 슬롯 상태 표기 — 색상만으로 구분하지 않는다. 상태명은 UI 가이드 §6.3 고정. */
export const SLOT_STATUS: Record<string, { label: string; dot: string; fill: string; text: string; chip: string; icon: string }> = {
  AVAILABLE: { label: '선택 가능', dot: 'bg-emerald-500', fill: '#10b981', text: 'text-emerald-700', chip: 'bg-emerald-50 text-emerald-700', icon: '●' },
  NEEDS_CONFIRMATION: { label: '선수확인', dot: 'bg-amber-500', fill: '#f59e0b', text: 'text-amber-700', chip: 'bg-amber-50 text-amber-700', icon: '!' },
  HOLD: { label: '임시점유', dot: 'bg-slate-400', fill: '#94a3b8', text: 'text-slate-600', chip: 'bg-slate-100 text-slate-600', icon: '◷' },
  RESERVED: { label: '예약', dot: 'bg-violet-400', fill: '#a78bfa', text: 'text-violet-700', chip: 'bg-violet-50 text-violet-700', icon: '◷' },
  SOLD: { label: '판매완료', dot: 'bg-slate-300', fill: '#cbd5e1', text: 'text-slate-500', chip: 'bg-slate-100 text-slate-500', icon: '🔒' },
  AUCTION: { label: '경매', dot: 'bg-indigo-500', fill: '#6366f1', text: 'text-indigo-700', chip: 'bg-indigo-50 text-indigo-700', icon: '⚒' },
  BLOCKED: { label: '제한', dot: 'bg-rose-400', fill: '#fb7185', text: 'text-rose-700', chip: 'bg-rose-50 text-rose-700', icon: '⊘' },
  EXPIRED: { label: '종료', dot: 'bg-slate-300', fill: '#cbd5e1', text: 'text-slate-500', chip: 'bg-slate-100 text-slate-500', icon: '—' },
};

/** 충돌 코드 → 사용자 문구 (v2.1 §6.5) */
export const CONFLICT_LABEL: Record<string, string> = {
  SLOT_TAKEN: '다른 계약·예약과 겹칩니다',
  DATE_OVERLAP: '선수 일정이 겹칩니다',
  CATEGORY_EXCLUSIVE: '동일 업종 독점 조건과 충돌합니다',
  PRICE_CHANGED: '가격이 변경되었습니다',
  RIGHTS_CONFLICT: '요청한 사용권을 제공할 수 없습니다',
  EVENT_RULE: '대회 규정에 따라 제한됩니다',
  ATHLETE_CLOSED: '선수가 모집을 중단했습니다',
  DATA_STALE: '판매 정보 확인이 필요합니다',
  HOLD_EXPIRED: '임시 보유가 만료되었습니다',
  MIN_DURATION: '최소 계약 기간을 충족하지 않습니다',
  NEEDS_CONFIRMATION: '선수 확인이 필요합니다',
};

/** hold 남은 시간 mm:ss */
export function useCountdown(expiresAt?: string | null) {
  const ms = expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0;
  if (!expiresAt || ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
