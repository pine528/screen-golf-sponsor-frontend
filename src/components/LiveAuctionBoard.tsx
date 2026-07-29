/**
 * 메인 라이브 경매 현황판
 *
 * 좌: 진행 중 경매 도넛 + 경매 상태 요약 + 참여 지표 + 최고가 경매 하이라이트
 * 우: 순위 · 선수/슬롯 · 경매 현황(진행률 바) · 참여 브랜드 · 남은 시간 표
 * 하단: 최근 낙찰 / 실시간 갱신 표시
 *
 * 모든 수치는 서버 집계 실값이다. 입찰이 없으면 0으로 그대로 보여주고
 * 활동이 있는 것처럼 꾸미지 않는다 (개편 LEG-06 — 미검증 수치 노출 금지).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Flame, Gavel } from 'lucide-react';
import { api } from '../services/api';

const krw = (v: any) => `₩${Number(v || 0).toLocaleString()}`;

function remain(endAt: string, now: number) {
  const ms = new Date(endAt).getTime() - now;
  if (ms <= 0) return { text: '마감', urgent: true };
  const d = Math.floor(ms / 86400000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = pad(Math.floor((ms % 86400000) / 3600000));
  const m = pad(Math.floor((ms % 3600000) / 60000));
  const s = pad(Math.floor((ms % 60000) / 1000));
  return { text: d > 0 ? `${d}일 ${h}:${m}:${s}` : `${h}:${m}:${s}`, urgent: ms <= 3600_000 };
}

/** 경매 상태 라벨 — 실제 입찰 수·남은 시간에서만 도출한다 */
function statusOf(a: any, urgent: boolean) {
  if (urgent) return { label: '마감 임박', bar: 'bg-rose-500', text: 'text-rose-600' };
  if (a.brandCount >= 2) return { label: '경쟁 입찰 중', bar: 'bg-amber-500', text: 'text-amber-600' };
  if (a.bidCount > 0) return { label: '입찰 진행 중', bar: 'bg-emerald-500', text: 'text-emerald-600' };
  return { label: '입찰 대기', bar: 'bg-slate-300', text: 'text-slate-400' };
}

/** 시작~마감 구간에서 현재 위치(%) */
function progress(a: any, now: number) {
  const s = new Date(a.startAt).getTime();
  const e = new Date(a.endAt).getTime();
  if (!(e > s)) return 0;
  return Math.min(100, Math.max(2, Math.round(((now - s) / (e - s)) * 100)));
}

const RANK_STYLE = [
  'bg-amber-400 text-white',
  'bg-slate-300 text-white',
  'bg-orange-300 text-white',
];

export default function LiveAuctionBoard() {
  const { data } = useQuery({
    queryKey: ['live-auction-board'],
    queryFn: () => api.getLiveAuctionBoard(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
  const board: any = (data?.data as any) || null;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!board || board.summary.liveCount === 0) return null;

  const s = board.summary;
  const auctions: any[] = board.auctions || [];
  const settlements: any[] = board.recentSettlements || [];
  const top = auctions[0];

  // 도넛: 진행 중 경매 가운데 24시간 내 마감 비중
  const soonRatio = s.liveCount > 0 ? s.endingSoonCount / s.liveCount : 0;
  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    /* 폭·좌우 여백을 히어로 섹션(max-w-7xl px-5)과 맞추고 위 간격은 좁게 */
    <section className="max-w-7xl mx-auto px-5 pt-2 pb-10">
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-extrabold tracking-wide shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              LIVE
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">라이브 경매 현황</h2>
          </div>
          <Link to="/auctions" className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            전체 경매 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr]">
          {/* ── 좌: 요약 ── */}
          <div className="p-5 sm:p-6 lg:border-r border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-4">
              {/* 도넛 */}
              <div className="relative w-[104px] h-[104px] shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r={R} fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${C * (1 - soonRatio)} ${C}`}
                  />
                  {s.endingSoonCount > 0 && (
                    <circle
                      cx="50" cy="50" r={R} fill="none" stroke="#f43f5e" strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${C * soonRatio} ${C}`}
                      strokeDashoffset={-C * (1 - soonRatio)}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 leading-none mb-0.5">진행 중</span>
                  <span className="text-3xl font-black text-slate-900 leading-none tabular-nums">{s.liveCount}</span>
                </div>
              </div>

              {/* 상태 요약 */}
              <dl className="flex-1 min-w-0 space-y-1.5">
                <SumRow label="24시간 내 마감" value={s.endingSoonCount} danger={s.endingSoonCount > 0} />
                <SumRow label="낙찰 완료" value={s.endedCount} />
                <SumRow label="유찰" value={s.unsoldCount} />
                <SumRow label="시작 예정" value={s.scheduledCount} />
              </dl>
            </div>

            {/* 참여 지표 */}
            <div className="grid grid-cols-2 gap-2 mt-5">
              <Metric label="참여 브랜드" value={s.participatingBrands} unit="곳" />
              <Metric label="누적 입찰" value={s.totalBids} unit="건" />
            </div>

            {/* 최고가 경매 하이라이트 */}
            {top && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 mb-0.5">
                  <Flame className="w-3.5 h-3.5" /> 현재 최고가 경매
                </div>
                <div className="text-xs text-amber-900 font-semibold truncate">
                  {top.athleteName} · {top.slotName}
                </div>
                <div className="text-sm font-extrabold text-amber-900 tabular-nums">{krw(top.currentPrice)}</div>
              </div>
            )}

            <Link
              to="/auctions"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
            >
              <Gavel className="w-4 h-4" /> 경매 참여하기
            </Link>
          </div>

          {/* ── 우: 표 ── */}
          <div className="p-3 sm:p-4">
            <div className="hidden md:grid grid-cols-[36px_1.5fr_1.6fr_0.9fr_0.9fr] gap-3 px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wide">
              <span className="text-center">순위</span>
              <span>선수 · 슬롯</span>
              <span>경매 현황</span>
              <span className="text-center">참여 브랜드</span>
              <span className="text-right">남은 시간</span>
            </div>

            <ul className="divide-y divide-slate-50">
              {auctions.map((a, i) => {
                const t = remain(a.endAt, now);
                const st = statusOf(a, t.urgent);
                const pct = progress(a, now);
                // 서버가 rank를 주지 않아도 목록 순서로 표시한다 (배포 시차 대비)
                const rank = a.rank ?? i + 1;
                return (
                  <li key={a.id}>
                    <Link
                      to={`/auctions/${a.id}`}
                      className="grid grid-cols-[28px_1fr_auto] md:grid-cols-[36px_1.5fr_1.6fr_0.9fr_0.9fr] gap-x-3 gap-y-2 items-center px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      {/* 순위 */}
                      <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-[11px] font-extrabold tabular-nums ${RANK_STYLE[rank - 1] || 'bg-slate-100 text-slate-500'}`}>
                        {rank}
                      </span>

                      {/* 선수 · 슬롯 */}
                      <div className="min-w-0 flex items-center gap-2.5">
                        {a.athleteImage ? (
                          <img src={a.athleteImage} alt="" className="w-8 h-10 rounded-md object-cover bg-slate-100 shrink-0" />
                        ) : (
                          <span className="w-8 h-10 rounded-md bg-slate-100 shrink-0" />
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-slate-900 truncate">{a.athleteName}</span>
                          <span className="block text-[11px] text-slate-400 truncate">
                            {a.athleteTour ? `${a.athleteTour} · ` : ''}{a.slotName}
                          </span>
                        </span>
                      </div>

                      {/* 모바일: 남은 시간 (첫 줄 오른쪽) */}
                      <span className={`md:hidden text-[11px] font-bold tabular-nums text-right whitespace-nowrap ${t.urgent ? 'text-rose-600' : 'text-slate-500'}`}>
                        {t.text}
                      </span>

                      {/* 경매 현황 */}
                      <div className="col-span-3 md:col-span-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[11px] font-bold ${st.text}`}>{st.label}</span>
                          <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                            {a.bidCount > 0 ? `${a.bidCount}건 입찰` : krw(a.currentPrice)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${st.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {/* 참여 브랜드 */}
                      <div className="hidden md:flex items-center justify-center gap-1">
                        {a.brandCount === 0 ? (
                          <span className="text-[11px] text-slate-300">—</span>
                        ) : (
                          <>
                            {a.brandInitials.map((c: string, i: number) => (
                              <span key={i} className="w-6 h-6 rounded-full bg-slate-100 border border-white text-[10px] font-bold text-slate-600 inline-flex items-center justify-center -ml-1.5 first:ml-0">
                                {c}
                              </span>
                            ))}
                            {a.brandCount > a.brandInitials.length && (
                              <span className="text-[10px] font-bold text-slate-400 ml-0.5">+{a.brandCount - a.brandInitials.length}</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* 남은 시간 */}
                      <span className={`hidden md:block text-xs font-bold tabular-nums text-right whitespace-nowrap ${t.urgent ? 'text-rose-600' : 'text-slate-600'}`}>
                        {t.text}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* 하단 바 */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5 border-t border-slate-100 bg-slate-50/60">
          <div className="min-w-0 text-[11px] text-slate-500 truncate">
            {settlements.length > 0 ? (
              <>
                <span className="font-bold text-slate-700 mr-1.5">최근 낙찰</span>
                {settlements[0].athleteName} · {settlements[0].slotName}{' '}
                <b className="text-slate-800">{krw(settlements[0].price)}</b>
              </>
            ) : (
              <>아직 낙찰 사례가 없습니다. 첫 입찰의 주인공이 되어보세요.</>
            )}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            실시간 업데이트 중
          </span>
        </div>
      </div>
    </section>
  );
}

function SumRow({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[11px] text-slate-500 break-keep">{label}</dt>
      <dd className={`text-sm font-bold tabular-nums shrink-0 ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{value ?? 0}</dd>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5">
      <div className="text-lg font-extrabold text-slate-900 tabular-nums leading-none">
        {Number(value).toLocaleString()}
        <span className="text-[11px] font-semibold text-slate-400 ml-0.5">{unit}</span>
      </div>
      <div className="text-[10px] text-slate-500 mt-1">{label}</div>
    </div>
  );
}
