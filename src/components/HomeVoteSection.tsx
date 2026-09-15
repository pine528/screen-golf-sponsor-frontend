/**
 * 메인 "진행 중인 투표" 섹션
 *
 * 카드에 선택지별 득표 비율을 보여준다. 비율은 서버 집계(optionTally) 실값으로만 계산하며,
 * 참여가 없으면 0%로 그대로 표시한다 (개편 LEG-06 — 임의 수치 노출 금지).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Info, ShieldCheck, Trophy, Users } from 'lucide-react';
import { api } from '../services/api';

type Filter = 'ALL' | 'OPEN' | 'SOON' | 'RESULT';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'OPEN', label: '진행중' },
  { key: 'SOON', label: '마감임박' },
  { key: 'RESULT', label: '결과보기' },
];

const dday = (closeAt?: string) => {
  if (!closeAt) return '';
  const ms = new Date(closeAt).getTime() - Date.now();
  if (ms <= 0) return '마감';
  const d = Math.floor(ms / 86400000);
  if (d >= 1) return `D-${d}`;
  const h = Math.floor(ms / 3600000);
  return h >= 1 ? `${h}시간 남음` : `${Math.max(1, Math.floor(ms / 60000))}분 남음`;
};

const isSoon = (closeAt?: string) => {
  if (!closeAt) return false;
  const ms = new Date(closeAt).getTime() - Date.now();
  return ms > 0 && ms <= 24 * 3600000;
};

/** 선택지 + 득표 비율 (집계 실값) */
function optionRows(v: any) {
  const opts: any[] = Array.isArray(v.options) ? v.options : [];
  const tally: Record<string, number> = v.optionTally || {};
  const total = Object.values(tally).reduce((a: number, b: any) => a + Number(b || 0), 0);
  return opts.slice(0, 5).map((o: any, i: number) => {
    const key = String(o.id ?? o.value ?? i);
    const count = Number(tally[key] || 0);
    return {
      label: o.label ?? o.name ?? `선택 ${i + 1}`,
      count,
      pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });
}

export default function HomeVoteSection() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data } = useQuery({
    queryKey: ['home-votes-v2'],
    queryFn: async () => {
      const [open, settled] = await Promise.all([
        api.getVotes({ status: 'OPEN', pageSize: 8 }),
        api.getVotes({ status: 'SETTLED', pageSize: 4 }),
      ]);
      return { open: (open.data as any) || [], settled: (settled.data as any) || [] };
    },
    staleTime: 60_000,
  });

  const open: any[] = data?.open || [];
  const settled: any[] = data?.settled || [];

  const cards =
    filter === 'RESULT'
      ? settled
      : filter === 'SOON'
        ? open.filter((v) => isSoon(v.closeAt))
        : filter === 'OPEN'
          ? open.filter((v) => !isSoon(v.closeAt))
          : [...open, ...settled];

  if (open.length === 0 && settled.length === 0) return null;

  return (
    /* 폭·들여쓰기를 슬롯 섹션과 동일하게 — 바깥 테두리 카드로 감싸지 않고 내용이 바로 놓인다.
       (감싸면 안쪽 padding만큼 제목·카드가 더 들어가 위 섹션과 끝선이 어긋난다) */
    <section className="px-5 pt-2 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 inline-flex items-center gap-2">
            진행 중인 투표
            <span title="팬 투표는 선수의 노출 기회와 후원 논의에 참고 자료로 활용됩니다.">
              <Info className="w-4 h-4 text-slate-300" />
            </span>
          </h2>
          <Link to="/fan/vote" className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
            전체 보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-sm text-slate-500 mb-4 break-keep">
          여러분의 한 표가 선수의 기회와 스포츠 후원 문화를 만듭니다.
        </p>

        {/* 필터 */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                filter === f.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 카드 — 모바일은 세로 스택 대신 가로 스와이프 (모바일 전면 개편 2026-08-11) */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory -mx-5 px-5 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
          {cards.slice(0, 3).map((v: any) => (
            <div key={v.id} className="snap-start shrink-0 w-[82%] sm:w-auto sm:shrink">
              <VoteCard vote={v} />
            </div>
          ))}
          <div className="snap-start shrink-0 w-[82%] sm:w-auto sm:shrink">
            <GuideCard />
          </div>
        </div>

        {cards.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-8">해당 조건의 투표가 없습니다.</p>
        )}

        {/* 하단 안내 */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          공정한 투표 운영을 위해 부정 투표를 모니터링하고 있습니다.
          <Link to="/guide" className="font-semibold text-slate-700 hover:underline inline-flex items-center gap-0.5">
            투표 정책 안내 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function VoteCard({ vote }: { vote: any }) {
  const settled = vote.status === 'SETTLED';
  const soon = !settled && isSoon(vote.closeAt);
  const rows = optionRows(vote);
  const participants = vote._count?.participations ?? vote.participants ?? 0;
  const totalVotes = rows.reduce((a, r) => a + r.count, 0);
  const top = rows.slice().sort((a, b) => b.count - a.count)[0];

  const badge = settled
    ? { text: '결과보기 가능', cls: 'bg-violet-100 text-violet-700' }
    : soon
      ? { text: '마감임박', cls: 'bg-amber-100 text-amber-700' }
      : { text: '진행중', cls: 'bg-emerald-100 text-emerald-700' };
  const accent = settled ? 'violet' : soon ? 'amber' : 'emerald';

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
      <span className={`self-start px-2 py-0.5 rounded-md text-[12.5px] font-extrabold mb-2 ${badge.cls}`}>{badge.text}</span>

      <h3 className="text-sm font-extrabold text-slate-900 leading-snug break-keep mb-2 line-clamp-2 min-h-[2.5rem]">
        {vote.title}
      </h3>

      <div className="flex items-center gap-2 text-[12px] text-slate-500 mb-3">
        {!settled && <span className={`font-bold text-${accent}-600`}>{dday(vote.closeAt)}</span>}
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3" />
          참여 {Number(participants).toLocaleString()}명
        </span>
      </div>

      {settled && top && totalVotes > 0 ? (
        <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-3 text-center mb-3">
          <Trophy className="w-4 h-4 text-violet-500 mx-auto mb-1" />
          <div className="text-sm font-extrabold text-slate-900 truncate">{top.label}</div>
          <div className="text-xl font-black text-violet-700 tabular-nums">{top.pct}%</div>
          <div className="text-[12.5px] text-slate-500">총 {totalVotes.toLocaleString()}표</div>
        </div>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {rows.map((r, i) => (
            <li key={i} className="relative overflow-hidden rounded-lg border border-slate-100 px-2.5 py-1.5">
              <span
                className={`absolute inset-y-0 left-0 ${settled ? 'bg-violet-100' : soon ? 'bg-amber-100' : 'bg-emerald-100'}`}
                style={{ width: `${r.pct}%` }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-slate-700 truncate">{r.label}</span>
                <span className="text-[12px] font-bold text-slate-900 tabular-nums shrink-0">{r.pct}%</span>
              </span>
            </li>
          ))}
          {rows.length === 0 && <li className="text-[12px] text-slate-500">선택지 정보가 없습니다</li>}
        </ul>
      )}

      <Link
        to={`/fan/vote/${vote.id}`}
        className={`mt-auto inline-flex items-center justify-center h-9 rounded-xl text-xs font-bold transition-colors ${
          settled
            ? 'border border-violet-200 text-violet-700 hover:bg-violet-50'
            : soon
              ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {settled ? '결과 자세히 보기' : '투표하기'}
      </Link>

      {!settled && <p className="mt-1.5 text-center text-[12.5px] text-slate-500">1인 1회 투표 가능</p>}
    </div>
  );
}

function GuideCard() {
  const items = ['텍스트형 보기 선택', '누구나 참여 가능', '투표 결과는 실시간 집계', '브랜드 스폰서십에 반영 가능'];
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-extrabold text-slate-900 mb-3">투표는 어떻게 진행되나요?</h3>
      <ul className="space-y-2 mb-4">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-1.5">
            <span className="mt-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold inline-flex items-center justify-center shrink-0">
              ✓
            </span>
            <span className="text-[12px] text-slate-600 break-keep">{t}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/guide"
        className="mt-auto inline-flex items-center justify-center h-9 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors"
      >
        투표 가이드 보기
      </Link>
    </div>
  );
}
