/**
 * 메인 — 리디자인 v2.0 (핸드오프 §2, 시안 2026-08-31)
 *
 * 첫 화면은 "직접 PICK / 추천 PICK" 두 경로만 주 CTA로 제시한다 (P-01).
 * 기존 경매 현황판·성장마켓·VOTE 장문 섹션·01~04 단계는 메인에서 제거하고
 * 전용 목록(/auctions 등)과 소개 페이지로 이동 (§2.1 삭제/이동).
 * 스크롤 구성은 §2.2: 히어로 → 지금 후원 가능한 선수 → 진행 중 후원기회
 * → 한 줄 소개 → 브랜드 로고 → 최종 CTA. 데이터 없는 섹션은 자동 숨김.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ChevronRight,
  Crosshair,
  Gavel,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { ServiceAnnouncementModal } from '../components/ServiceAnnouncementModal';
import PublicHeader from '../components/PublicHeader';

const BODY_PART_LABEL: Record<string, string> = {
  CAP_FRONT: '모자 정면', CAP_SIDE_R: '모자 우측', CAP_SIDE_L: '모자 좌측', CAP_BACK: '모자 뒷면',
  CAP_BRIM_TOP: '모자챙 상단',
  CHEST_CENTER: '상의 중앙', CHEST_L: '상의 좌측', CHEST_R: '상의 우측',
  COLLAR_L: '카라 좌측', COLLAR_R: '카라 우측',
  SLEEVE_L: '소매 좌측', SLEEVE_R: '소매 우측',
  SHOULDER_L: '어깨 좌측', SHOULDER_R: '어깨 우측',
  WAIST_BACK: '허리 뒷면', PANTS_SIDE: '바지 측면',
};

/* 히어로 핫스폿 — 실사 위 후원 위치 안내 (클릭은 직접 PICK 예고 툴팁, §2.1) */
const HOTSPOTS: { key: string; label: string; x: number; y: number; side: 'left' | 'right'; mobile?: boolean }[] = [
  { key: 'visor', label: '바이저', x: 47, y: 12, side: 'left', mobile: true },
  { key: 'collar', label: '카라', x: 47.5, y: 27, side: 'left' },
  { key: 'sleeve', label: '소매', x: 76, y: 19.5, side: 'right', mobile: true },
  { key: 'top', label: '상의', x: 46, y: 43, side: 'left', mobile: true },
];

export function Home() {
  const { isAuthenticated } = useAuth();
  const [tipKey, setTipKey] = useState<string | null>(null);

  /* ── 데이터 (기존 자산 재사용, P-07) ── */
  const { data: liveAuctions } = useQuery({
    queryKey: ['home-auctions'],
    queryFn: async () => {
      const r = await api.getAuctions({ status: 'LIVE', limit: 100 });
      return (r.data || [])
        .filter((a: any) => a.slotInstance?.athlete?.isRecommended)
        .map((a: any) => ({
          id: a.id,
          kind: 'AUCTION' as const,
          athleteId: a.slotInstance?.athleteId,
          player: a.slotInstance?.athlete?.name || '선수',
          playerImage: a.slotInstance?.athlete?.profileImageUrl || '',
          playerTour: a.slotInstance?.athlete?.tour || '',
          slotName:
            a.slotInstance?.slotTemplate?.nameKr ||
            a.slotInstance?.slotTemplate?.name ||
            BODY_PART_LABEL[a.slotInstance?.slotTemplate?.bodyPart] || '슬롯',
          price: Number(a.currentPrice || a.startPrice || 0),
          to: `/auctions/${a.id}`,
        }));
    },
    staleTime: 60_000,
  });

  const { data: directSlots } = useQuery({
    queryKey: ['home-direct-slots'],
    queryFn: async () => {
      const r = await api.getSlotInstances({ limit: 200 });
      return ((r as any)?.data || [])
        .filter((s: any) => s.status !== 'SOLD' && s.status !== 'RESERVED' && s.isActive && s.athlete?.isRecommended)
        .filter((s: any) => !s.enableAuction)
        .map((s: any) => ({
          id: s.id,
          kind: (s.enableDirectBuy ? 'DIRECT' : 'INQUIRY') as 'DIRECT' | 'INQUIRY',
          athleteId: s.athleteId,
          player: s.athlete?.name || '선수',
          playerImage: s.athlete?.profileImageUrl || '',
          playerTour: s.athlete?.tour || '',
          slotName: s.slotTemplate?.nameKr || s.slotTemplate?.name || BODY_PART_LABEL[s.slotTemplate?.bodyPart] || '슬롯',
          price: Number(s.directBuyPrice || s.reservePrice || 0),
          to: `/athletes/${s.athleteId}`,
        }));
    },
    staleTime: 60_000,
  });

  const { data: athleteItems } = useQuery({
    queryKey: ['home-athletes'],
    queryFn: async () => {
      const r = await api.listPublicAthletes({ limit: 60 });
      return ((r as any)?.data?.items || []) as any[];
    },
    staleTime: 120_000,
  });

  /* §2.2-2 지금 후원 가능한 선수 — 추천 선수 중 슬롯 보유자 최대 4명 */
  const availableAthletes = useMemo(() => {
    const all = [...(liveAuctions || []), ...(directSlots || [])];
    const byAthlete = new Map<string, { count: number; min: number }>();
    for (const s of all) {
      if (!s.athleteId) continue;
      const d = byAthlete.get(s.athleteId) || { count: 0, min: Infinity };
      d.count += 1;
      if (s.price > 0) d.min = Math.min(d.min, s.price);
      byAthlete.set(s.athleteId, d);
    }
    return (athleteItems || [])
      .filter((a) => a.isRecommended && byAthlete.has(a.id))
      .slice(0, 4)
      .map((a) => ({ ...a, slots: byAthlete.get(a.id)! }));
  }, [athleteItems, liveAuctions, directSlots]);

  /* §2.2-3 진행 중 후원기회 — 경매 우선 혼합 최대 3개 */
  const opportunities = useMemo(
    () => [...(liveAuctions || []), ...(directSlots || [])].slice(0, 3),
    [liveAuctions, directSlots],
  );

  const showTip = (key: string) => {
    setTipKey(key);
    window.setTimeout(() => setTipKey((k) => (k === key ? null : k)), 2200);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <ServiceAnnouncementModal />
      <PublicHeader fixed />

      {/* ════════════════ HERO — 두 개의 PICK (§2.1) ════════════════ */}
      <section className="relative pt-16 lg:pt-[72px] bg-[#f2faf5] overflow-hidden">
        {/* 소프트 배경 */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 bottom-[-30%] w-[720px] h-[720px] rounded-full bg-emerald-100/50" />
          <div className="absolute left-[-10%] top-[-20%] w-[420px] h-[420px] rounded-full bg-emerald-100/30 blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-5 relative">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,470px)_minmax(0,410px)] items-center gap-4 lg:gap-6 py-8 lg:py-0 lg:min-h-[620px]">
            {/* 좌: 카피 */}
            <div className="relative z-10 lg:pr-2">
              <h1 className="text-[30px] sm:text-4xl lg:text-[40px] xl:text-[44px] font-black tracking-tight leading-[1.32]">
                <span className="block whitespace-nowrap">선수를 선택하고,</span>
                <span className="block whitespace-nowrap">후원방식을 <span className="text-emerald-500">PICK</span>하고,</span>
                <span className="block whitespace-nowrap">바로 시작하세요.</span>
              </h1>
              <p className="mt-6 text-[14px] lg:text-[15px] text-slate-500 leading-relaxed break-keep">
                <span className="block">선수 후원슬롯부터 SNS 콘텐츠와</span>
                <span className="block">장기 파트너십까지, 원하는 방식으로</span>
                <span className="block">바로 시작하는 스포츠 후원 플랫폼.</span>
              </p>
            </div>

            {/* 중: 선수 실사 + 핫스폿 */}
            <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[520px] lg:self-end">
              <img
                src="/golfers/bae-jinri-cutout.png"
                alt="배진리 프로 — SPONPIK Founder Pro No.1"
                className="w-full h-auto select-none pointer-events-none"
                style={{ filter: 'drop-shadow(0 18px 30px rgba(15,23,42,0.10))' }}
              />
              {HOTSPOTS.map((h) => (
                <div
                  key={h.key}
                  className={`absolute ${h.mobile ? '' : 'hidden sm:flex'} flex items-center`}
                  style={{
                    top: `${h.y}%`,
                    ...(h.side === 'left'
                      ? { right: `${100 - h.x}%`, flexDirection: 'row' as const }
                      : { left: `${h.x}%`, flexDirection: 'row-reverse' as const }),
                  }}
                >
                  <span className="text-[12px] lg:text-[13px] font-bold text-slate-700 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-white/75 backdrop-blur-[2px]">
                    {h.label}
                  </span>
                  <span
                    aria-hidden
                    className="w-7 lg:w-14 border-t border-dashed border-emerald-400/80"
                  />
                  <button
                    onClick={() => showTip(h.key)}
                    aria-label={`${h.label} — 직접 PICK에서 선택 가능한 위치`}
                    className="relative w-[18px] h-[18px] rounded-full bg-emerald-500 border-[3px] border-white shadow-md shrink-0 hover:scale-110 transition-transform"
                  >
                    {tipKey === h.key && (
                      <span className="absolute left-1/2 -translate-x-1/2 -top-9 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap shadow-lg">
                        직접 PICK에서 선택할 수 있어요
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* 우: 두 개의 PICK CTA */}
            <div className="relative z-10 space-y-4 pb-8 lg:pb-0">
              <Link
                to="/sponsor/direct/athletes"
                className="group flex items-center gap-5 rounded-[40px] bg-gradient-to-r from-emerald-500 to-emerald-600 pl-4 pr-6 py-4 lg:py-5 shadow-[0_16px_40px_-12px_rgba(16,185,129,0.55)] hover:shadow-[0_20px_48px_-12px_rgba(16,185,129,0.7)] hover:-translate-y-0.5 transition-all"
              >
                <span className="w-[64px] h-[64px] lg:w-[72px] lg:h-[72px] rounded-full bg-white flex items-center justify-center shrink-0">
                  <Crosshair className="w-7 h-7 lg:w-8 lg:h-8 text-emerald-500" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1 text-white">
                  <span className="block text-[22px] lg:text-[25px] font-black leading-tight">직접 PICK</span>
                  <span className="block text-[12.5px] lg:text-[13px] text-emerald-50/95 mt-1">선수와 후원방식을 직접 선택</span>
                </span>
                <ChevronRight className="w-6 h-6 text-white/85 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/sponsor/recommended"
                className="group flex items-center gap-5 rounded-[40px] bg-gradient-to-r from-rose-500 to-red-500 pl-4 pr-6 py-4 lg:py-5 shadow-[0_16px_40px_-12px_rgba(244,63,94,0.5)] hover:shadow-[0_20px_48px_-12px_rgba(244,63,94,0.65)] hover:-translate-y-0.5 transition-all"
              >
                <span className="w-[64px] h-[64px] lg:w-[72px] lg:h-[72px] rounded-full bg-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-7 h-7 lg:w-8 lg:h-8 text-rose-500" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1 text-white">
                  <span className="inline-block px-2.5 py-[3px] rounded-full bg-white text-rose-500 text-[10px] font-black tracking-wide mb-1.5">
                    SPONPIK RECOMMENDED
                  </span>
                  <span className="block text-[22px] lg:text-[25px] font-black leading-tight">스폰픽 추천 PICK</span>
                  <span className="block text-[12.5px] lg:text-[13px] text-rose-50/95 mt-1">목표와 예산에 맞는 후원 조합 추천</span>
                </span>
                <ChevronRight className="w-6 h-6 text-white/85 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* 보조 링크 — 핵심 CTA와 시각 경쟁 금지 (§2.1) */}
              <div className="flex items-center justify-center gap-5 pt-1 text-[13px] font-semibold text-slate-500">
                <Link to="/auctions" className="hover:text-emerald-600 transition-colors">진행 중 후원기회</Link>
                <span className="w-px h-3 bg-slate-300" />
                <Link to="/digital-partner" className="hover:text-emerald-600 transition-colors">디지털 파트너 월 구독</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ §2.2-2 지금 후원 가능한 선수 ════════════════ */}
      {availableAthletes.length > 0 && (
        <section className="py-14 sm:py-20 px-5">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-7">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">지금 후원 가능한 선수</h2>
                <p className="text-[13px] text-slate-400 mt-1.5">판매 중인 후원슬롯이 있는 추천 선수입니다.</p>
              </div>
              <Link to="/athletes" className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-500 hover:text-emerald-600 shrink-0">
                전체 선수 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {availableAthletes.map((a) => (
                <Link
                  key={a.id}
                  to={`/athletes/${a.id}`}
                  className="group rounded-2xl border border-slate-100 bg-white overflow-hidden hover:border-emerald-200 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.14)] transition-all"
                >
                  <div className="aspect-[4/5] bg-slate-50 overflow-hidden">
                    {a.profileImageUrl && (
                      <img
                        src={a.profileImageUrl}
                        alt={a.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-3.5 sm:p-4">
                    <p className="text-[11px] font-semibold text-emerald-600 mb-0.5">{a.tour || 'PRO'}</p>
                    <h3 className="text-[15px] font-extrabold text-slate-900">{a.name} <span className="text-[12px] font-bold text-slate-400">프로</span></h3>
                    <div className="mt-2.5 flex items-center justify-between text-[12px]">
                      <span className="text-slate-400">슬롯 {a.slots.count}개</span>
                      {Number.isFinite(a.slots.min) && (
                        <span className="font-bold text-slate-700">{(a.slots.min / 10000).toLocaleString()}만원~</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ §2.2-3 진행 중 후원기회 ════════════════ */}
      {opportunities.length > 0 && (
        <section className="py-14 sm:py-20 px-5 bg-slate-50/70">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-7">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">진행 중 후원기회</h2>
                <p className="text-[13px] text-slate-400 mt-1.5">직접구매 · 경매 · 협의 방식의 모집 중 후원 상품입니다.</p>
              </div>
              <Link to="/auctions" className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-500 hover:text-emerald-600 shrink-0">
                전체 보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3.5 sm:gap-5">
              {opportunities.map((o) => (
                <Link
                  key={`${o.kind}-${o.id}`}
                  to={o.to}
                  className="group rounded-2xl border border-slate-100 bg-white p-5 hover:border-emerald-200 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.14)] transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      {o.playerImage && <img src={o.playerImage} alt="" className="w-full h-full object-cover object-top" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-slate-900 truncate">{o.player} 프로</p>
                      <p className="text-[11px] text-slate-400">{o.playerTour}</p>
                    </div>
                    <span
                      className={`ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        o.kind === 'AUCTION'
                          ? 'bg-rose-50 text-rose-600'
                          : o.kind === 'DIRECT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {o.kind === 'AUCTION' ? <Gavel className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                      {o.kind === 'AUCTION' ? '라이브 경매' : o.kind === 'DIRECT' ? '직접구매' : '협의'}
                    </span>
                  </div>
                  <p className="text-[15px] font-bold text-slate-800">{o.slotName}</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-[12px] text-slate-400">{o.kind === 'AUCTION' ? '현재가' : '판매가'}</span>
                    <span className="text-lg font-black text-slate-900">
                      {o.price > 0 ? `₩${o.price.toLocaleString()}` : '협의'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ §2.2-5 한 줄 소개 ════════════════ */}
      <section className="py-14 sm:py-20 px-5">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-8">
            선택부터 성과 확인까지, 한 흐름으로
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['선수 탐색', '상품 PICK', '계약 · 실행', '성과 리포트'].map((t, i) => (
              <div key={t} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-5">
                <span className="inline-flex w-7 h-7 rounded-full bg-emerald-500 text-white text-[13px] font-black items-center justify-center mb-2.5">
                  {i + 1}
                </span>
                <p className="text-[14px] font-bold text-slate-800">{t}</p>
              </div>
            ))}
          </div>
          <Link
            to="/how-it-works"
            className="mt-7 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-600 hover:text-emerald-700"
          >
            이용방법 자세히 보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ════════════════ §2.2-6 함께하는 브랜드 ════════════════ */}
      <section className="py-14 sm:py-20 px-5 bg-slate-50/70">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-center mb-8">함께하는 브랜드</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { src: '/brands/orex.png', name: 'OREX' },
              { src: '/brands/fau.png', name: 'FAU' },
              { src: '/brands/elensilia.png', name: 'ELENSILIA' },
              { src: '/brands/nature-republic.png', name: 'NATURE REPUBLIC' },
              { src: '/brands/kilogram-studio.png', name: 'Kilogram studio' },
              { src: '/brands/brrr-studio.png', name: 'Brrr. studio' },
              { src: '/brands/nlt1.png', name: '(주)엔엘티원 NLT1 COMPANY' },
              { src: '/brands/ahnguk-health.png', name: '안국건강' },
            ].map((b) => (
              <div
                key={b.name}
                className="flex items-center justify-center h-20 sm:h-24 bg-white rounded-2xl border border-slate-200 px-4 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <img src={b.src} alt={b.name} title={b.name} className="max-h-12 sm:max-h-14 max-w-full object-contain" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ §2.2-7 최종 CTA ════════════════ */}
      <section className="py-14 sm:py-20 px-5">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl px-8 sm:px-16 py-12 sm:py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">지금, 선수를 PICK하세요</h2>
          <p className="text-emerald-50/90 text-sm sm:text-base mb-8">
            직접 고르거나, 스폰픽이 목표와 예산에 맞게 추천해 드립니다.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/sponsor/direct/athletes"
              className="h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-white text-emerald-700 text-sm font-bold hover:bg-emerald-50 transition-colors"
            >
              <Crosshair className="w-4 h-4" /> 직접 PICK
            </Link>
            <Link
              to="/sponsor/recommended"
              className="h-12 px-7 inline-flex items-center gap-2 rounded-xl border border-white/40 text-white text-sm font-bold hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> 추천받기
            </Link>
          </div>
          {!isAuthenticated && (
            <p className="mt-6 text-[12px] text-emerald-50/70">
              가격과 선수 정보는 로그인 없이 확인할 수 있어요.
            </p>
          )}
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo-48.png" alt="" className="w-7 h-7 rounded-lg" />
                <span className="text-sm font-extrabold text-slate-900">SPONPIK</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                스크린골프 프로선수<br />마이크로 스폰서 마켓플레이스
              </p>
            </div>
            {[
              { title: '후원하기', links: [{ to: '/athletes', t: '직접 PICK' }, { to: '/sponsor/recommended', t: '추천 PICK' }, { to: '/auctions', t: '진행 중 후원기회' }, { to: '/digital-partner', t: '월 구독' }] },
              { title: '지원', links: [{ to: '/guide', t: '이용가이드' }, { to: '/faq', t: 'FAQ' }, { to: '/contact', t: '고객센터' }] },
              { title: '법적 고지', links: [{ to: '/terms', t: '이용약관' }, { to: '/privacy', t: '개인정보처리방침' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">{l.t}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            &copy; 2026 SPONPIK. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
