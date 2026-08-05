/**
 * the GUYS 팬스토어 메인 (/fan-store/the-guys) — 사용자 제공 시안 기준
 *
 * [그린 히어로: 염돈웅 × the GUYS + CTA + 협업 일정 칩 + 선수 사진 + 내 혜택 패널]
 * [혜택 타일 5종] [추천 스토어 상품 6종] [이렇게 구매해요 | 팬을 위한 특별한 혜택]
 *
 * 전시용 카탈로그(`data/guysStore.ts`) — 실구매는 상품 등록 후 연결한다.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Calendar,
  CalendarClock,
  Check,
  Coins,
  Copy,
  CreditCard,
  Flag,
  Gift,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket,
  UserRound,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { GUYS_PRODUCTS, GUYS_STORE } from '../../data/guysStore';

export default function FanStoreGuys() {
  const [copied, setCopied] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: pointData } = useQuery({
    queryKey: ['my-point-balance'],
    queryFn: () => api.getMyPointBalance(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const balance = (pointData as any)?.data?.balance;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(GUYS_STORE.fanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 코드가 화면에 보이므로 무시 */
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* ── 그린 히어로 ── */}
      <section className="px-5 sm:px-8 pt-2 pb-6">
        <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 border border-emerald-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,40%)_minmax(0,220px)] gap-6 items-center p-6 sm:p-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold">팬 전용</span>
                <span className="text-[12px] font-bold text-slate-500">
                  SPONPIK <span className="text-slate-300">×</span> {GUYS_STORE.brandName}
                </span>
              </div>
              <h1 className="flex items-center flex-wrap gap-2.5 mb-3">
                <span className="text-[26px] sm:text-3xl font-black text-slate-900">{GUYS_STORE.athleteName}</span>
                <span className="text-slate-300 font-bold">×</span>
                <img src={GUYS_STORE.brandLogo} alt={GUYS_STORE.brandName} className="h-10 object-contain" />
                <span className="text-[26px] sm:text-3xl font-black text-slate-900">팬 스토어</span>
              </h1>
              <p className="text-sm text-slate-500 break-keep leading-relaxed mb-5">{GUYS_STORE.tagline}</p>

              <div className="flex flex-wrap gap-2 mb-5">
                <a
                  href="#products"
                  className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700"
                >
                  스토어 입장 <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  onClick={copyCode}
                  className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50"
                >
                  {copied ? <Check className="w-4 h-4" /> : null} {copied ? '코드 복사됨' : '코드 받기'}
                </button>
                <Link
                  to={`${GUYS_STORE.path}/ar`}
                  className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50"
                >
                  AR 보기
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {GUYS_STORE.milestones.map((m, i) => (
                  <div key={m.date} className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                    {i === 0 ? <Calendar className="w-4 h-4 text-slate-400" /> : <Flag className="w-4 h-4 text-slate-400" />}
                    <div className="leading-tight">
                      <div className="text-[12px] font-bold text-slate-900">{m.date}</div>
                      <div className="text-[11px] text-slate-400">{m.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 선수 사진 + 브랜드 로고 */}
            <div className="relative hidden lg:flex items-end justify-center gap-4">
              <div className="w-[220px] aspect-[3/4] rounded-2xl overflow-hidden">
                <img
                  src={GUYS_STORE.athletePhoto}
                  alt={`${GUYS_STORE.athleteName} 프로`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex flex-col items-center gap-1 pb-6">
                <img src={GUYS_STORE.brandLogo} alt={GUYS_STORE.brandName} className="h-14 object-contain" />
                <span className="text-slate-300 font-bold my-1">×</span>
                <span className="text-[13px] font-bold text-slate-700">{GUYS_STORE.athleteName} 프로</span>
              </div>
            </div>

            {/* 내 혜택 패널 */}
            <div className="hidden lg:block rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="text-[13px] font-extrabold text-slate-900 mb-3">내 혜택</div>
              <div className="rounded-xl border border-slate-100 px-3 py-2.5 mb-2">
                <div className="text-[11px] text-slate-400 mb-0.5">팬포인트</div>
                <div className="text-[16px] font-black text-slate-900 tabular-nums">
                  {typeof balance === 'number' ? `${balance.toLocaleString()}P` : '로그인 후 확인'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 px-3 py-2.5 mb-3">
                <div className="text-[11px] text-slate-400 mb-1">팬 할인코드</div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black tracking-wide">{GUYS_STORE.fanCode}</span>
                  <span className="text-[11px] font-bold text-emerald-700">{GUYS_STORE.fanDiscountPct}%</span>
                </div>
              </div>
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="w-full h-9 inline-flex items-center justify-center rounded-lg bg-emerald-700 text-white text-[12px] font-bold hover:bg-emerald-800"
              >
                {isAuthenticated ? '마이페이지' : '로그인'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 혜택 타일 ── */}
      <section className="px-5 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-3">
          <button onClick={copyCode} className="text-left rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3 hover:border-emerald-300 transition-colors">
            <Ticket className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">팬 할인코드</div>
              <div className="text-[13px] font-extrabold text-slate-900 inline-flex items-center gap-1">
                {GUYS_STORE.fanCode} {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-300" />}
              </div>
            </div>
          </button>
          <BenefitTile icon={Coins} title="팬포인트" desc="사용 가능" />
          <BenefitTile icon={CreditCard} title="SPON Pay /" desc="일반결제 가능" />
          <BenefitTile icon={CalendarClock} title="기간 한정 혜택" desc="놓치지 마세요" />
          <Link to={`${GUYS_STORE.path}/ar`} className="rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3 hover:border-emerald-300 transition-colors">
            <Box className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-extrabold text-slate-900">AR 선수 이미지 보기</div>
              <div className="text-[11px] text-slate-400">AR 체험 가능</div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 추천 스토어 상품 ── */}
      <section id="products" className="px-5 sm:px-8 pb-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4">추천 스토어 상품</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {GUYS_PRODUCTS.map((p) => {
              const off = p.listPrice ? Math.round((1 - p.price / p.listPrice) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  to={`${GUYS_STORE.path}/${p.id}`}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 transition-colors flex flex-col"
                >
                  <div className="relative aspect-square bg-slate-50 flex items-center justify-center p-4">
                    <span className="text-[11px] text-slate-400 text-center break-keep leading-relaxed">{p.name}</span>
                    {p.isNew && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">NEW</span>
                    )}
                    {off > 0 && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">{off}%</span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <div className="text-[12px] text-slate-600 line-clamp-2 min-h-[2.1rem] mb-1.5">{p.name}</div>
                    <div className="flex items-baseline gap-1.5 mb-2.5">
                      {p.listPrice && (
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">{p.listPrice.toLocaleString()}원</span>
                      )}
                      <span className="text-[15px] font-black text-slate-900 tabular-nums">{p.price.toLocaleString()}원</span>
                    </div>
                    <span className="mt-auto inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-emerald-600 text-emerald-700 text-[12px] font-bold">
                      <ShoppingCart className="w-3.5 h-3.5" /> 구매하기
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 이렇게 구매해요 + 팬 혜택 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,46%)_minmax(0,1fr)] gap-4 items-stretch">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">이렇게 구매해요</h2>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              {[
                { t: '코드 받기', d: '스토어 입장 후 할인 코드를 받아주세요.', icon: Ticket },
                { t: '팬포인트/결제수단 선택', d: '팬포인트 또는 SPON Pay, 일반결제 중 선택하세요.', icon: CreditCard },
                { t: '할인 구매 완료', d: '할인 적용된 금액으로 특별한 상품을 즐기세요!', icon: ShoppingCart },
              ].map((s, i, arr) => (
                <div key={s.t} className="flex items-center gap-3 flex-1">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-900">{s.t}</div>
                      <p className="text-[11px] text-slate-500 break-keep leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="hidden sm:block w-4 h-4 text-slate-300 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">팬을 위한 특별한 혜택</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FanBenefit icon={Sparkles} title="팬포인트 적립" desc="구매 금액을 팬포인트로 적립" />
              <FanBenefit icon={Star} title="팬전용 한정 혜택" desc="기간 한정 상품 & 이벤트" />
              <FanBenefit icon={UserRound} title="선수 × 브랜드 스토리" desc={`${GUYS_STORE.athleteName} 프로와 ${GUYS_STORE.brandName}의 스토리를 확인하세요.`} />
              <Link to={`${GUYS_STORE.path}/ar`} className="block">
                <FanBenefit icon={Gift} title="AR 이미지 체험" desc="선수 스튜디오 이미지를 AR로 만나보세요." />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BenefitTile({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
      <Icon className="w-5 h-5 text-emerald-600 shrink-0" />
      <div className="min-w-0">
        <div className="text-[13px] font-extrabold text-slate-900">{title}</div>
        <div className="text-[11px] text-slate-400">{desc}</div>
      </div>
    </div>
  );
}

function FanBenefit({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="text-center px-1">
      <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="text-[12px] font-bold text-slate-900 break-keep">{title}</div>
      <p className="text-[10px] text-slate-400 break-keep leading-snug mt-0.5">{desc}</p>
    </div>
  );
}
