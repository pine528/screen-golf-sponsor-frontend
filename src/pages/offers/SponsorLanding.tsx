/**
 * 후원하기 허브 `/sponsor` — UI/UX 통합 가이드 v1.0 §5, 통합 핸드오프 v2.1 §2·§8.1
 *
 * 메인에서 생략한 "4가지 후원 시작 방식의 차이"를 설명하는 유일한 화면이다.
 *  - 2×2: 직접 PICK(Green) · 추천 PICK(Coral)을 상단에, 지금 가능한 후원 · 디지털 파트너는 neutral.
 *  - 카드마다 핵심 질문 → 한 줄 설명 → 주 CTA 1개. 상품 목록은 여기서 보여주지 않는다.
 */
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarCheck, ChevronRight, Clock, Crosshair, LogIn, ShoppingBag, Sparkles, Users,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';

type Tone = 'green' | 'coral' | 'neutral';

const PATHS: {
  key: string; tone: Tone; icon: typeof Crosshair; title: string; question: string; desc: string;
  cta: string; to: string; badge?: string; meta: { icon: typeof Users; k: string; v: string }[]; note?: string;
}[] = [
  {
    key: 'direct', tone: 'green', icon: Crosshair, title: '직접 PICK',
    question: '누구에게 무엇을 후원할까?',
    desc: '선수·위치·기간·활동을 직접 구성합니다. 원하는 선수가 정해졌거나 후원 위치를 직접 고르고 싶을 때.',
    cta: '직접 PICK 시작', to: '/sponsor/direct/athletes',
    meta: [
      { icon: Users, k: '이런 브랜드', v: '후원 방향과 선수를 구체적으로 정한 브랜드' },
      { icon: Clock, k: '예상 소요', v: '3~7일 (선수 응답에 따라)' },
      { icon: LogIn, k: '로그인 시점', v: '견적함 담기 · 승인 요청 시' },
    ],
  },
  {
    key: 'recommended', tone: 'coral', icon: Sparkles, title: '스폰픽 추천 PICK', badge: 'SPONPIK RECOMMENDED',
    question: '내 목표에 맞는 조합은?',
    desc: '목표·예산·타깃을 입력하면 실행 가능한 후원안을 1~3개 조합해 드립니다. 선수 순위가 아니라 실제로 진행할 수 있는 안입니다.',
    cta: '추천 받기', to: '/sponsor/recommended',
    meta: [
      { icon: Users, k: '이런 브랜드', v: '최적의 매칭이 필요하거나 시간이 부족한 브랜드' },
      { icon: Clock, k: '예상 소요', v: '1~3일' },
      { icon: LogIn, k: '로그인 시점', v: '추천안 확인 · 선수 승인 시' },
    ],
  },
  {
    key: 'available', tone: 'neutral', icon: ShoppingBag, title: '지금 가능한 후원',
    question: '지금 바로 살 수 있는 것은?',
    desc: '선수와 스폰픽이 미리 구성한 후원상품을 비교·검토·구매합니다. 핵심 구성은 고정, 허용된 옵션만 바꿉니다.',
    cta: '후원상품 보기', to: '/sponsor/available',
    meta: [
      { icon: Users, k: '이런 브랜드', v: '즉시 진행 가능한 스폰서십을 찾는 브랜드' },
      { icon: Clock, k: '예상 소요', v: '바로 구매 상품은 즉시' },
      { icon: LogIn, k: '로그인 시점', v: '구매 · 결제 시' },
    ],
  },
  {
    key: 'digital', tone: 'neutral', icon: CalendarCheck, title: '디지털 파트너',
    question: '작은 예산으로 장기 연결하려면?',
    desc: '경기복·대회 현장 부착 없이 12개월 동안 웹·SNS·팬스토어·등록매장 POP에서 선수의 공식 디지털 파트너가 됩니다.',
    cta: '월 구독 보기', to: '/digital-partner',
    note: '경기복 · 대회 현장 부착은 포함되지 않는 별도 구독 상품입니다.',
    meta: [
      { icon: Users, k: '이런 브랜드', v: '지속적인 디지털 노출과 판매 전환을 원하는 브랜드' },
      { icon: Clock, k: '예상 소요', v: '선수 승인 후 즉시' },
      { icon: LogIn, k: '로그인 시점', v: '구독 신청 시' },
    ],
  },
];

const TONE: Record<Tone, { card: string; icon: string; btn: string; q: string }> = {
  green: {
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white',
    icon: 'bg-emerald-500 text-white', btn: 'bg-emerald-600 text-white hover:bg-emerald-700', q: 'text-emerald-700',
  },
  coral: {
    card: 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-white',
    icon: 'bg-rose-500 text-white', btn: 'bg-rose-500 text-white hover:bg-rose-600', q: 'text-rose-600',
  },
  neutral: {
    card: 'border-slate-200 bg-white',
    icon: 'bg-slate-100 text-slate-700', btn: 'border border-slate-300 text-slate-800 hover:border-slate-500', q: 'text-slate-500',
  },
};

export default function SponsorLanding() {
  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      <PublicHeader />

      <div className="max-w-[1180px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">후원하기</span>
        </nav>

        <header className="mt-7 sm:mt-9 max-w-2xl">
          <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-[-0.02em] leading-tight break-keep">
            어떤 방식으로 후원을 시작할까요?
          </h1>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed break-keep">
            네 가지 시작 방식은 서로 다른 질문에 답합니다. 상황에 맞는 하나를 고르면 이후 승인·계약·결제는 같은 흐름으로 이어집니다.
          </p>
        </header>

        <div className="mt-8 grid md:grid-cols-2 gap-4 sm:gap-5">
          {PATHS.map((p) => {
            const t = TONE[p.tone];
            const I = p.icon;
            return (
              <article key={p.key} className={`rounded-3xl border ${t.card} p-6 sm:p-7 flex flex-col`}>
                <div className="flex items-start gap-4">
                  <span className={`w-14 h-14 rounded-2xl ${t.icon} inline-flex items-center justify-center shrink-0`}>
                    <I className="w-6 h-6" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {p.badge && (
                      <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[12.5px] font-black tracking-wide">
                        {p.badge}
                      </span>
                    )}
                    <p className={`text-[13.5px] font-bold ${t.q}`}>{p.question}</p>
                    <h2 className="mt-0.5 text-[22px] sm:text-[24px] font-extrabold tracking-tight">{p.title}</h2>
                  </div>
                </div>

                <p className="mt-4 text-[14.5px] text-slate-600 leading-relaxed break-keep">{p.desc}</p>
                {p.note && (
                  <p className="mt-2 text-[13px] font-semibold text-amber-700 break-keep">{p.note}</p>
                )}

                <dl className="mt-5 grid gap-2 text-[13px]">
                  {p.meta.map((m) => {
                    const MI = m.icon;
                    return (
                      <div key={m.k} className="flex items-start gap-2.5">
                        <MI className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <dt className="w-[74px] shrink-0 text-slate-500">{m.k}</dt>
                        <dd className="font-semibold text-slate-700 break-keep">{m.v}</dd>
                      </div>
                    );
                  })}
                </dl>

                <Link
                  to={p.to}
                  className={`mt-6 h-12 sm:h-[52px] inline-flex items-center justify-center gap-2 rounded-2xl text-[15px] font-bold transition-colors ${t.btn}`}
                >
                  {p.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            );
          })}
        </div>

        {/* 공통 흐름 안내 — 네 방식이 같은 코어로 합류한다 (v2.1 §5) */}
        <section className="mt-10 rounded-3xl bg-slate-50 border border-slate-200 px-6 sm:px-8 py-6">
          <p className="text-[13px] font-bold text-slate-500">어느 방식을 골라도 이후 단계는 같습니다</p>
          <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[14px] font-bold text-slate-800">
            {['선수 승인', '계약', '결제', '캠페인 실행', '성과 리포트'].map((s, i, arr) => (
              <li key={s} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200">{s}</span>
                {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] text-slate-500 break-keep">
            가격은 공급가 · VAT · 총액을 항상 분리해 표시합니다. 선수 승인 전에는 결제가 진행되지 않습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
