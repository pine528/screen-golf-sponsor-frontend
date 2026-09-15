/**
 * 공통 CompareSelectionBar — 최대 3명 (§2.1 · §6.1). 하단 고정, 높이만큼 본문 여백은 부모가 준다(onHeight).
 * "선수 비교"는 /athletes/compare?ids= 로 간다. 2명 미만이면 비활성.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Scale, UserPlus, X } from 'lucide-react';
import { COMPARE_MAX } from './useAthleteTools';

export default function CompareBar({ compare, onRemove, onHeight, mobileCompact }: {
  compare: any[]; onRemove: (id: string) => void; onHeight?: (h: number) => void; mobileCompact?: boolean;
}) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !onHeight) return;
    const update = () => onHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight]);

  const go = () => navigate(`/athletes/compare?ids=${compare.map((a) => a.id).join(',')}`);

  return (
    <div ref={ref} className="fixed inset-x-0 bottom-14 lg:bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.25)]">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3">
        <div className="min-w-0 shrink-0">
          <p className="text-[12.5px] text-slate-500 hidden sm:block">비교할 선수를 최대 {COMPARE_MAX}명까지 선택하세요.</p>
          <p className="text-[12px] text-slate-500 sm:hidden">비교할 선수</p>
          <p className="text-[16px] font-extrabold tabular-nums"><span className="text-emerald-600">{compare.length}</span> / {COMPARE_MAX}</p>
        </div>
        <div className={`flex gap-1.5 sm:gap-2 flex-1 overflow-x-auto [scrollbar-width:none] ${open ? '' : 'hidden sm:flex'}`}>
          {Array.from({ length: COMPARE_MAX }).map((_, i) => {
            const a = compare[i];
            return a ? (
              <span key={a.id} className="h-10 sm:h-11 pl-1.5 pr-2.5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/60 shrink-0">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-slate-100">{a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}</span>
                <span className={`text-[12.5px] font-bold whitespace-nowrap ${mobileCompact ? 'hidden sm:inline' : ''}`}>{a.name}</span>
                <button onClick={() => onRemove(a.id)} aria-label={`${a.name} 비교 해제`} className="text-slate-400 hover:text-slate-700 w-6 h-6 inline-flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
              </span>
            ) : (
              <span key={i} className="h-10 sm:h-11 px-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-200 text-[12.5px] text-slate-400 whitespace-nowrap shrink-0">
                <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">선수 추가</span><span className="sm:hidden">+</span>
              </span>
            );
          })}
        </div>
        <button
          onClick={go}
          disabled={compare.length < 2}
          className="ml-auto shrink-0 h-10 sm:h-11 px-4 sm:px-5 inline-flex items-center gap-1.5 rounded-xl text-[13px] sm:text-[13.5px] font-bold bg-emerald-600 text-white disabled:bg-emerald-100 disabled:text-emerald-400"
        >
          <Scale className="w-4 h-4" /> 선수 비교
        </button>
        <button onClick={() => setOpen((v) => !v)} aria-label={open ? '비교 바 접기' : '비교 바 펼치기'} className="hidden sm:inline-flex shrink-0 w-9 h-9 rounded-full border border-slate-200 items-center justify-center text-slate-500">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
