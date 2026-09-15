/**
 * 공통 AthleteCard — 선수 메뉴 핸드오프 v1.0 §2.1·§2.2 / §4.4
 *
 * 목록(선수 찾기)·추천(나에게 맞는 선수)·관심 선수·직접 PICK에서 같은 카드를 쓴다 (화면별 복제 금지).
 * 기본 신호: 사진 · 상태 배지 1개 · 이름/투어/지역 · 팬온도 · TOP10(최근 5경기) · 특징 chip ≤2
 * 맥락별 추가: extra(추천 이유 / 최근 변경 1줄). 행동은 선수정보 / 관심 / 비교 + primary CTA 1개.
 * 미수집 값은 "집계 중"·"성적 확인 필요" (LEG-06).
 */
import { Link } from 'react-router-dom';
import { Flame, Heart, Trophy } from 'lucide-react';
import { FAN_TEMP_NOTE } from '../fanhub/FanKit';

export const BADGE: Record<string, { label: string; cls: string }> = {
  RECOMMENDED: { label: '추천 선수', cls: 'bg-emerald-500' },
  POPULAR: { label: '인기 선수', cls: 'bg-amber-500' },
  NEW: { label: '신규 등록', cls: 'bg-sky-500' },
  OPEN: { label: '후원 가능', cls: 'bg-rose-500' },
  GROWTH: { label: '성장형', cls: 'bg-violet-500' },
  UPDATED: { label: '업데이트', cls: 'bg-emerald-500' },
  FAN_UP: { label: '팬온도 상승', cls: 'bg-sky-500' },
  NEW_SLOT: { label: '신규 슬롯', cls: 'bg-violet-500' },
};

export const ACTIVITY_LABELS: Record<string, string> = {
  tour1: '대회 출전', tour2: '2부 투어', gtour: 'G투어', lesson: '레슨',
  proAm: '프로암', sns: 'SNS 콘텐츠', youtube: '유튜브', etc: '기타',
};

/** 카드 상태 배지 — 우선순위 1개만 (§4.4) */
export function badgeOf(a: any): string | null {
  if (a.badge && BADGE[a.badge]) return a.badge;
  if (a.isRecommended) return 'RECOMMENDED';
  if (a.isNew || a.dataStatus === 'NEW') return 'NEW';
  if (a.availability === 'OPEN') return 'OPEN';
  return null;
}

/** 특징 chip — 실데이터에서만 만든다 */
export function tagsOf(a: any): string[] {
  if (Array.isArray(a.tags) && a.tags.length) return a.tags.slice(0, 2);
  const t: string[] = [];
  const acts: string[] = Array.isArray(a.activities) ? a.activities : [];
  if (acts.includes('sns') || acts.includes('youtube')) t.push('#SNS활발');
  if (acts.includes('lesson')) t.push('#레슨');
  if (acts.includes('proAm')) t.push('#프로암');
  if (a.modes?.includes('온라인 전용')) t.push('#온라인후원');
  if (a.slotOpen > 0) t.push('#후원가능');
  return t.slice(0, 2);
}

export type AthleteCardProps = {
  a: any;
  fav: boolean;
  comparing: boolean;
  compareFull: boolean;
  onInfo: () => void;
  onFav: () => void;
  onCompare: () => void;
  /** primary CTA — 기본은 후원슬롯보기(직접 PICK) */
  primary?: { label: string; to?: string; onClick?: () => void };
  /** 맥락 한 줄 (추천 이유 · 최근 변경) */
  extra?: React.ReactNode;
  badgeKey?: string | null;
  /** 모바일 가로형(사진 좌) 유지 여부 */
  layout?: 'grid' | 'row';
};

export default function AthleteCard({ a, fav, comparing, compareFull, onInfo, onFav, onCompare, primary, extra, badgeKey, layout = 'grid' }: AthleteCardProps) {
  const temp = typeof a.fanTemp === 'number' && a.fanTemp > 0 ? a.fanTemp : null;
  const hasResults = (a.recentResults?.length ?? 0) > 0 || a.recentAvgRank != null;
  const badge = BADGE[badgeKey ?? badgeOf(a) ?? ''] || null;
  const tags = tagsOf(a);
  const pr = primary || { label: '후원슬롯보기', to: `/sponsor/direct/build/${a.id}` };
  const row = layout === 'row';

  return (
    <article className={`rounded-2xl bg-white border overflow-hidden flex ${row ? '' : 'sm:flex-col'} transition-all ${comparing ? 'border-emerald-400 shadow-[0_12px_28px_-14px_rgba(16,185,129,0.4)]' : 'border-slate-200 hover:border-emerald-300 hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.18)]'}`}>
      <button onClick={onInfo} className={`relative ${row ? 'w-[34%]' : 'w-[40%] sm:w-full'} aspect-[3/4] ${row ? '' : 'sm:aspect-[16/11]'} bg-slate-100 shrink-0 text-left overflow-hidden`}>
        {a.profileImageUrl
          ? <img src={a.profileImageUrl} alt={`${a.name} 프로필 사진`} loading="lazy" className="w-full h-full object-cover object-top" />
          : <span className="w-full h-full flex items-center justify-center text-[36px] font-extrabold text-slate-300">{a.name?.slice(0, 1)}</span>}
        {badge && <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-extrabold text-white ${badge.cls}`}>{badge.label}</span>}
      </button>
      <div className="p-3.5 flex-1 flex flex-col min-w-0">
        <div className="flex items-start gap-2">
          <button onClick={onInfo} className="min-w-0 flex-1 text-left">
            <p className="text-[15px] font-extrabold truncate">{a.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
            <p className="mt-0.5 text-[12px] text-slate-500 truncate">{[a.tour, a.region?.split(' ')[0]].filter(Boolean).join(' · ') || '선수'}</p>
          </button>
          <button onClick={onFav} aria-pressed={fav} aria-label={fav ? '관심 선수 해제' : '관심 선수 등록'} className={`shrink-0 w-9 h-9 -mr-1 -mt-1 rounded-full inline-flex items-center justify-center ${fav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}>
            <Heart className={`w-[18px] h-[18px] ${fav ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[12.5px]">
          <span className="inline-flex items-center gap-1 font-bold tabular-nums" title={FAN_TEMP_NOTE}>
            <Flame className="w-3.5 h-3.5 text-emerald-600" />
            {temp !== null ? `${temp.toFixed(1)}℃` : <span className="text-slate-500 font-semibold">집계 중</span>}
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-slate-700 tabular-nums" title="최근 5경기 기준">
            <Trophy className="w-3.5 h-3.5 text-slate-400" />
            {hasResults ? `Top 10 ${a.top10Count ?? 0}회` : <span className="text-slate-500 font-semibold">성적 확인 필요</span>}
          </span>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-600">{t}</span>)}
          </div>
        )}
        {extra && <div className="mt-2">{extra}</div>}
        <div className="mt-auto pt-3 grid grid-cols-3 gap-1.5">
          <button onClick={onInfo} className="h-8 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-slate-400 whitespace-nowrap">선수정보</button>
          {pr.to
            ? <Link to={pr.to} className="h-8 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center justify-center hover:bg-emerald-700 whitespace-nowrap tracking-tight">{pr.label}</Link>
            : <button onClick={pr.onClick} className="h-8 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center justify-center hover:bg-emerald-700 whitespace-nowrap tracking-tight">{pr.label}</button>}
          <button onClick={onCompare} disabled={!comparing && compareFull} className={`h-8 rounded-lg border text-[11px] font-bold whitespace-nowrap ${comparing ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-700 hover:border-slate-400 disabled:opacity-40'}`}>
            {comparing ? '비교 중' : '비교하기'}
          </button>
        </div>
      </div>
    </article>
  );
}
