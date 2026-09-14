/**
 * 직접 PICK 공통 스텝바 — UI/UX 통합 가이드 v1.0 §6.1
 * 사용자에게는 5단계(선수 → 후원 위치 → 구성 → 검토 → 승인)만 보여준다.
 * 내부 9단계 번호(현 페이지들이 넘기는 값)는 5단계로 접어서 표시한다.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Home, Save } from 'lucide-react';

export const DIRECT_STEPS = ['선수', '후원 위치', '구성', '검토', '승인'] as const;

/** 내부 단계(1~9) → 표시 단계(1~5). 결제·완료는 승인 이후이므로 모두 완료로 표시한다. */
const FOLD: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 6 };

export default function DirectStepBar({
  current,
  crumbs = [],
  backTo,
  backLabel = '이전 단계',
  onSaveDraft,
}: {
  /** 내부 단계 1~9 */
  current: number;
  crumbs?: { label: string; to?: string }[];
  backTo?: string;
  backLabel?: string;
  onSaveDraft?: () => void;
}) {
  const shown = FOLD[current] ?? current;
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

        <ol className="mt-3 flex items-center gap-1 overflow-x-auto pb-1" aria-label="진행 단계">
          {DIRECT_STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < shown;
            const active = n === shown;
            return (
              <li key={s} className="flex items-center gap-1.5 shrink-0">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={`w-7 h-7 rounded-full text-[12px] font-black flex items-center justify-center ${
                    done ? 'bg-emerald-100 text-emerald-700'
                      : active ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : n}
                </span>
                <span className={`text-[13px] font-bold whitespace-nowrap ${
                  active ? 'text-emerald-700' : done ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {s}
                </span>
                {n < DIRECT_STEPS.length && (
                  <span className={`w-6 h-px mx-1.5 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                )}
              </li>
            );
          })}
        </ol>

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
