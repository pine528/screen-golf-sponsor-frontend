/**
 * 팬 참여 공용 UI 킷 (핸드오프 v1.0 §18.3)
 *  - 팬온도는 숫자보다 "의미와 최근 변화 요인"을 함께 보여준다.
 *  - 측정되지 않은 값은 추정하지 않고 "집계 중"으로 비운다 (LEG-06).
 */
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Info } from 'lucide-react';

/* 온도 팔레트 — 낮음(청록)에서 열광(자홍)까지 한 축으로 잇는다 */
export const TEMP_COLORS: Record<string, { from: string; to: string; text: string; bg: string; ring: string }> = {
  새싹: { from: '#7DD3C0', to: '#4FB3A0', text: 'text-teal-700', bg: 'bg-teal-50', ring: 'ring-teal-100' },
  따뜻함: { from: '#FFD68A', to: '#FFA53D', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-100' },
  활발함: { from: '#FF9F5A', to: '#FF6B4A', text: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-100' },
  뜨거움: { from: '#FF6B6B', to: '#F2415B', text: 'text-rose-700', bg: 'bg-rose-50', ring: 'ring-rose-100' },
  열광: { from: '#F2415B', to: '#7C5CFF', text: 'text-fuchsia-700', bg: 'bg-fuchsia-50', ring: 'ring-fuchsia-100' },
};

export const tempColor = (tier?: string) => TEMP_COLORS[tier || '새싹'] || TEMP_COLORS['새싹'];

export const nf = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : n.toLocaleString('ko-KR');

/** 페이지 상단 — 큰 제목 + 한 줄 설명 */
export function FanHeader({ eyebrow, title, desc, right }: {
  eyebrow?: string; title: string; desc?: string; right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase mb-1.5">{eyebrow}</div>
        )}
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-[-0.02em] leading-tight">{title}</h1>
        {desc && <p className="mt-2 text-[15px] text-slate-500 leading-relaxed">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

/** 섹션 제목 + 더보기 */
export function SectionTitle({ title, sub, to, action }: {
  title: string; sub?: string; to?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3.5">
      <div>
        <h2 className="text-[17px] font-bold text-slate-900 tracking-[-0.01em]">{title}</h2>
        {sub && <p className="text-[13px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {to ? (
        <Link to={to} className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-0.5">
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ) : action}
    </div>
  );
}

export function Card({ children, className = '', as, to }: {
  children: ReactNode; className?: string; as?: 'div' | 'link'; to?: string;
}) {
  const cls = `rounded-3xl border border-slate-200/80 bg-white ${className}`;
  if (as === 'link' && to) {
    return <Link to={to} className={`${cls} block transition hover:border-slate-300 hover:shadow-[0_6px_24px_-12px_rgba(15,23,42,0.25)]`}>{children}</Link>;
  }
  return <div className={cls}>{children}</div>;
}

export function Chip({ children, tone = 'slate', size = 'sm' }: {
  children: ReactNode; tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky'; size?: 'sm' | 'xs';
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-700',
    sky: 'bg-sky-50 text-sky-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${tones[tone]} ${
      size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]'
    }`}>{children}</span>
  );
}

/** 팬온도 게이지 — 반원 아크. 표본이 적으면 숫자 대신 상태를 말한다 */
export function TempGauge({ score, tier, lowSample, size = 168 }: {
  score: number; tier?: string; lowSample?: boolean; size?: number;
}) {
  const c = tempColor(tier);
  const r = size / 2 - 12;
  const cx = size / 2, cy = size / 2;
  const circ = Math.PI * r; // 반원 길이
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const id = `g${(tier || 'x').length}${Math.round(score)}`;

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.from} /><stop offset="100%" stopColor={c.to} />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#EEF1F6" strokeWidth={12} strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={`url(#${id})`} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div className="absolute inset-x-0 top-[38%] text-center">
        <div className="text-[34px] font-extrabold text-slate-900 tabular-nums leading-none tracking-[-0.03em]">
          {lowSample ? '—' : score.toFixed(1)}
          {!lowSample && <span className="text-[16px] font-bold text-slate-400 ml-0.5">℃</span>}
        </div>
        <div className={`mt-1 text-[12px] font-bold ${c.text}`}>{lowSample ? '데이터 축적 중' : tier}</div>
      </div>
    </div>
  );
}

/** 온도 막대 — 목록·카드용 컴팩트 버전 */
export function TempBar({ score, tier, lowSample }: { score: number; tier?: string; lowSample?: boolean }) {
  const c = tempColor(tier);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${lowSample ? 0 : Math.min(100, score)}%`, background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} />
      </div>
      <span className={`text-[12px] font-bold tabular-nums ${lowSample ? 'text-slate-400' : c.text}`}>
        {lowSample ? '집계 중' : `${score.toFixed(1)}℃`}
      </span>
    </div>
  );
}

export function AthleteAvatar({ athlete, size = 44 }: { athlete: any; size?: number }) {
  const initial = (athlete?.name || '?').slice(0, 1);
  return athlete?.profileImageUrl ? (
    <img src={athlete.profileImageUrl} alt={athlete.name}
      className="rounded-full object-cover bg-slate-100 shrink-0"
      style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}>{initial}</div>
  );
}

/** 남은 시간 — 마감 임박이면 붉게 */
export function Countdown({ ms, closed }: { ms: number; closed?: boolean }) {
  if (closed) return <Chip size="xs">종료</Chip>;
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  const label = d >= 1 ? `${d}일 남음` : h >= 1 ? `${h}시간 남음` : `${Math.max(1, Math.floor(ms / 60000))}분 남음`;
  return <Chip size="xs" tone={h < 24 ? 'rose' : 'slate'}>{label}</Chip>;
}

export function EmptyState({ icon, title, desc, action }: {
  icon?: ReactNode; title: string; desc?: string; action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-3 w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">{icon}</div>}
      <p className="text-[15px] font-bold text-slate-700">{title}</p>
      {desc && <p className="mt-1.5 text-[13px] text-slate-400 leading-relaxed whitespace-pre-line">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** 정책·고지 — 팬 화면은 고지를 숨기지 않는다 (§10 · §16) */
export function Notice({ items, title }: { items: string[]; title?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[12px] font-bold text-slate-500">{title || '안내'}</span>
      </div>
      <ul className="space-y-1">
        {items.map((t, i) => (
          <li key={i} className="text-[12px] text-slate-400 leading-relaxed pl-2.5 relative">
            <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-slate-300" />{t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 모바일 하단 고정 CTA */
export function StickyCTA({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="h-24 lg:hidden" />
      <div className="fixed lg:static bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-0">
        {children}
      </div>
    </>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = 'button', full }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; full?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${full ? 'w-full' : ''} h-12 px-6 rounded-2xl font-bold text-[15px] text-white transition
        bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
        active:scale-[0.99]`}>
      {children}
    </button>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}
