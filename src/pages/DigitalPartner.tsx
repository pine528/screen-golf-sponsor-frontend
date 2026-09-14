/**
 * 디지털 파트너 — 랜딩 `/digital-partner`
 * UI/UX 통합 가이드 v1.0 §9 · 통합 핸드오프 v2.1 §9
 *
 *  - 오프라인 패치의 저가형이 아니라, 경기복·대회 현장 부착 없이 12개월 동안
 *    WEB · SNS · FAN STORE · STORE POP 에서 선수와 브랜드를 연결하는 별도 구독 상품.
 *  - 첫 화면에 "경기복·대회 현장 부착 미포함"을 명시하고 사용처 4개를 아이콘으로 보여준다.
 *  - 가격은 월액 + 12개월 약정 + 연간 총액 + VAT 를 동시에 표시한다.
 *  - 플랜 금액은 출시 권장 기본값(S4). 운영 Pricing Config로 옮기는 것은 백로그 C8.
 */
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Check, ChevronRight, Globe, Info, Share2, Store, ShoppingBag, XCircle,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const PLANS = [
  {
    name: 'START', monthly: 49000,
    includes: ['선수 승인 공식 디지털 배지', '팬스토어 기본 입점', '웹 배너 3종', '기본 리포트'],
    excludes: ['SNS 게시', '매장 POP', '업종 독점'],
  },
  {
    name: 'GROW', monthly: 99000, recommended: true,
    includes: ['START 전체 포함', 'SNS 템플릿 제공', '등록 매장 POP', '할인코드 · QR 리포트'],
    excludes: ['선수 개인 계정 게시', '매장 방문'],
  },
  {
    name: 'PLUS', monthly: 199000,
    includes: ['GROW 전체 포함', '분기 소재 리프레시', '동일 업종 제한', '상세 리포트'],
    excludes: ['출연 · 촬영', '경기복 부착'],
  },
];

const USES = [
  { icon: Globe, title: 'WEB', desc: '브랜드 사이트 · 상세페이지에 공식 파트너 배지와 배너' },
  { icon: Share2, title: 'SNS', desc: '브랜드 채널에 선수 템플릿 콘텐츠 게시 (GROW 이상)' },
  { icon: ShoppingBag, title: 'FAN STORE', desc: '선수 팬스토어 입점과 할인코드로 판매 전환' },
  { icon: Store, title: 'STORE POP', desc: '등록 매장의 POP · QR 홍보물 (GROW 이상)' },
];

const STEPS = ['선수 · 플랜 선택', '선수 승인', '구독 결제', '자산 발급 · 사용', '월간 리포트'];

export default function DigitalPartner() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />

      {/* 히어로 — 정체성과 제외 사항을 첫 화면에 */}
      <section className="bg-[#f2faf5] px-5 pt-6 pb-14 sm:pb-16">
        <div className="max-w-[1180px] mx-auto">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
            <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/sponsor" className="text-slate-500 hover:text-slate-700">후원하기</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">디지털 파트너</span>
          </nav>

          <div className="mt-8 sm:mt-10 grid lg:grid-cols-[minmax(0,1fr)_400px] gap-8 items-start">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-black tracking-wide">
                12개월 구독 · 온라인 전용
              </span>
              <h1 className="mt-4 text-[28px] sm:text-[38px] font-extrabold tracking-[-0.02em] leading-tight break-keep">
                선수의 공식 디지털 파트너가 되어보세요.
              </h1>
              <p className="mt-4 text-[15px] text-slate-600 leading-relaxed break-keep max-w-xl">
                선수가 승인한 공식 배지와 소재를 웹 · SNS · 팬스토어 · 등록 매장 홍보물에서 12개월 동안 사용합니다.
                작은 예산으로 선수와 오래 연결되고, 할인코드와 QR로 판매 전환까지 측정합니다.
              </p>
              <div className="mt-5 inline-flex items-start gap-2 rounded-2xl bg-white border border-amber-200 px-4 py-3 text-[13.5px] font-semibold text-amber-800 break-keep">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                경기복 · 대회 현장 부착은 포함되지 않습니다. 착장 후원은 직접 PICK에서 진행합니다.
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  to="/digital-partner/athletes"
                  className="h-[52px] px-7 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white text-[15px] font-bold hover:bg-emerald-700 transition-colors"
                >
                  구독 가능한 선수 보기 <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/sponsor/direct/athletes"
                  className="h-[52px] px-5 inline-flex items-center rounded-2xl border border-slate-300 bg-white text-slate-800 text-[15px] font-bold hover:border-slate-500 transition-colors"
                >
                  착장 후원은 직접 PICK
                </Link>
              </div>
            </div>

            {/* 사용처 4개 */}
            <ul className="grid grid-cols-2 gap-3">
              {USES.map((u) => {
                const I = u.icon;
                return (
                  <li key={u.title} className="rounded-2xl bg-white border border-slate-200 p-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                      <I className="w-5 h-5" />
                    </span>
                    <p className="mt-3 text-[13px] font-black tracking-wide">{u.title}</p>
                    <p className="mt-1 text-[12.5px] text-slate-600 leading-relaxed break-keep">{u.desc}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* 플랜 */}
      <section className="px-5 py-14 sm:py-16">
        <div className="max-w-[1180px] mx-auto">
          <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em]">플랜</h2>
          <p className="mt-2 text-[14px] text-slate-600">월 구독료와 12개월 약정 총액을 함께 확인하세요. 모든 금액은 VAT 별도입니다.</p>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {PLANS.map((p) => (
              <article
                key={p.name}
                className={`relative rounded-3xl border p-6 flex flex-col ${
                  p.recommended
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-[0_16px_40px_-16px_rgba(16,185,129,0.35)]'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {p.recommended && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black">
                    추천
                  </span>
                )}
                <h3 className="text-[15px] font-black tracking-widest text-slate-900">{p.name}</h3>
                <p className="mt-3 text-[28px] font-extrabold text-slate-900 leading-none tabular-nums">
                  월 {p.monthly.toLocaleString()}원
                </p>
                <dl className="mt-3 space-y-1 text-[13px] text-slate-600 tabular-nums">
                  <div className="flex justify-between"><dt>약정</dt><dd className="font-bold text-slate-800">12개월</dd></div>
                  <div className="flex justify-between"><dt>연간 총액</dt><dd className="font-bold text-slate-800">{(p.monthly * 12).toLocaleString()}원</dd></div>
                  <div className="flex justify-between"><dt>VAT</dt><dd className="font-bold text-slate-800">별도 (10%)</dd></div>
                </dl>
                <ul className="mt-5 pt-4 border-t border-slate-100 space-y-2 flex-1">
                  {p.includes.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-[2px]" /> {f}
                    </li>
                  ))}
                  {p.excludes.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-slate-500">
                      <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-[2px]" /> {f} 미포함
                    </li>
                  ))}
                </ul>
                <Link
                  to="/digital-partner/athletes"
                  className={`mt-5 h-12 inline-flex items-center justify-center gap-1.5 rounded-2xl text-[14px] font-bold transition-colors ${
                    p.recommended ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-slate-300 text-slate-800 hover:border-slate-500'
                  }`}
                >
                  {p.name} 로 선수 고르기 <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-slate-500">
            자동 갱신은 기본 꺼짐입니다. 만료 60 · 30 · 7일 전에 안내드리고, 명시적으로 동의한 경우에만 갱신됩니다.
          </p>
        </div>
      </section>

      {/* 진행 방식 · 권리 */}
      <section className="px-5 pb-16">
        <div className="max-w-[1180px] mx-auto rounded-3xl bg-slate-50 border border-slate-200 px-6 sm:px-8 py-6">
          <p className="text-[13px] font-bold text-slate-500">진행 방식</p>
          <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[14px] font-bold text-slate-800">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200">{s}</span>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-start gap-3">
            <span className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <BadgeCheck className="w-[18px] h-[18px] text-emerald-600" />
            </span>
            <p className="text-[13.5px] text-slate-600 leading-relaxed break-keep">
              선수 승인 전에는 결제와 소재 발급이 되지 않습니다. 구독이 끝나면 배지·소재 사용권도 함께 종료됩니다.
              매장 방문 · 행사 · 후기 같은 추가 활동은 기본 구독과 분리해 별도로 승인하고 가격을 정합니다.
            </p>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[13px] text-slate-500">
            <Info className="w-4 h-4" />
            도입 전 상담이 필요하면
            <Link to={`/contact?subject=${encodeURIComponent('[디지털 파트너] 도입 상담 요청')}`} className="font-bold text-emerald-700 hover:text-emerald-800">
              고객센터
            </Link>
            로 문의해 주세요.
          </p>
        </div>
      </section>
    </div>
  );
}
