/**
 * 메인 라이브 경매 현황판
 *
 * 표시하는 수치는 모두 서버 집계 실값이다. 입찰이 없으면 0으로 그대로 보여주고
 * 활동이 있는 것처럼 꾸미지 않는다 (개편 LEG-06 — 미검증 수치 노출 금지).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Gavel } from 'lucide-react';
import { api } from '../services/api';

const krw = (v: any) => `₩${Number(v || 0).toLocaleString()}`;

/** 남은 시간 D일 HH:MM:SS */
function remain(endAt: string, now: number) {
  const ms = new Date(endAt).getTime() - now;
  if (ms <= 0) return { text: '마감', urgent: true };
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    text: d > 0 ? `${d}일 ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`,
    urgent: ms <= 3600_000,
  };
}

export default function LiveAuctionBoard() {
  const { data } = useQuery({
    queryKey: ['live-auction-board'],
    queryFn: () => api.getLiveAuctionBoard(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
  const board: any = (data?.data as any) || null;

  // 남은 시간 카운트다운
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!board || board.summary.liveCount === 0) return null;

  const s = board.summary;
  const auctions: any[] = board.auctions || [];
  const settlements: any[] = board.recentSettlements || [];
  const noBidsYet = s.totalBids === 0;

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
      <div className="rounded-3xl bg-slate-900 text-white overflow-hidden shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-[10px] font-extrabold tracking-wide shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              LIVE
            </span>
            <h2 className="text-base sm:text-lg font-extrabold truncate">라이브 경매 현황</h2>
          </div>
          <Link to="/auctions" className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
            전체 경매 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-px bg-white/10">
          {/* 좌: 요약 */}
          <div className="bg-slate-900 p-5 sm:p-6">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black leading-none tabular-nums">{s.liveCount}</span>
              <span className="text-sm text-slate-400 mb-1">건 진행 중</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-5">지금 입찰할 수 있는 경매</p>

            <dl className="space-y-2.5">
              <Stat label="24시간 내 마감" value={`${s.endingSoonCount}건`} highlight={s.endingSoonCount > 0} />
              <Stat label="누적 입찰" value={`${s.totalBids}건`} />
              <Stat label="참여 브랜드" value={`${s.participatingBrands}곳`} />
              <Stat label="진행 중 경매 현재가 합계" value={krw(s.startingPriceSum)} />
            </dl>

            {noBidsYet && (
              <p className="mt-5 text-[11px] leading-relaxed text-slate-400 break-keep border-t border-white/10 pt-4">
                아직 첫 입찰이 등록되지 않았습니다. 지금 참여하시면 최초 입찰자가 됩니다.
              </p>
            )}

            <Link
              to="/auctions"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-bold transition-colors"
            >
              <Gavel className="w-4 h-4" /> 경매 참여하기
            </Link>
          </div>

          {/* 우: 마감 임박순 목록 */}
          <div className="bg-slate-900 p-3 sm:p-4">
            {/* 데스크톱 헤더 */}
            <div className="hidden sm:grid grid-cols-[1.6fr_0.9fr_0.7fr_1fr] gap-3 px-3 pb-2 text-[10px] font-bold text-slate-500 tracking-wide">
              <span>선수 · 슬롯</span>
              <span className="text-right">현재가</span>
              <span className="text-right">입찰</span>
              <span className="text-right">남은 시간</span>
            </div>

            <ul className="space-y-1">
              {auctions.map((a) => {
                const t = remain(a.endAt, now);
                return (
                  <li key={a.id}>
                    <Link
                      to={`/auctions/${a.id}`}
                      className="grid grid-cols-2 sm:grid-cols-[1.6fr_0.9fr_0.7fr_1fr] gap-x-3 gap-y-1 items-center px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="col-span-2 sm:col-span-1 min-w-0 flex items-center gap-2.5">
                        {a.athleteImage ? (
                          <img src={a.athleteImage} alt="" className="w-8 h-10 rounded-md object-cover bg-slate-800 shrink-0" />
                        ) : (
                          <span className="w-8 h-10 rounded-md bg-slate-800 shrink-0" />
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-bold truncate">{a.athleteName}</span>
                          <span className="block text-[11px] text-slate-400 truncate">
                            {a.athleteTour ? `${a.athleteTour} · ` : ''}{a.slotName}
                          </span>
                        </span>
                      </div>

                      <span className="text-sm font-extrabold tabular-nums sm:text-right">{krw(a.currentPrice)}</span>

                      <span className="text-[11px] text-slate-400 tabular-nums sm:text-right">
                        {a.bidCount > 0 ? `${a.bidCount}건 · ${a.brandCount}곳` : '입찰 대기'}
                      </span>

                      <span className={`text-xs font-bold tabular-nums text-right ${t.urgent ? 'text-rose-400' : 'text-slate-300'}`}>
                        {t.text}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {settlements.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10 px-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">최근 낙찰</span>
                <span>
                  {settlements[0].athleteName} · {settlements[0].slotName} {krw(settlements[0].price)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[11px] text-slate-400 break-keep">{label}</dt>
      <dd className={`text-sm font-bold tabular-nums shrink-0 ${highlight ? 'text-rose-400' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
