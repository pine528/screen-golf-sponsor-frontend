/**
 * IU08 · IU09 이용방법 (핸드오프 v1.0 §9)
 * 01~04 절차를 한꺼번에 늘어놓지 않는다. 브랜드·선수·팬을 먼저 고르면 그 사람의 단계만 보여준다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, User, Heart, Search, Star, FileText, Handshake, CreditCard,
  Target, BarChart3, Sliders, ShoppingBag, Monitor, CalendarClock,
  ShieldCheck, Lock, Users, ArrowRight, ChevronRight, Megaphone,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, visitorKey } from '../../components/about/AboutShell';

const AUDIENCE = [
  { key: 'brand', label: '브랜드', icon: Building2 },
  { key: 'player', label: '선수', icon: User },
  { key: 'fan', label: '팬', icon: Heart },
];

/** 브랜드 4가지 경로 (§9.2) */
const BRAND_PATHS = [
  {
    no: 1, title: '직접 PICK', icon: Search, tone: 'emerald',
    desc: '원하는 선수를 직접 탐색하고 조건을 구성해 후원 제안을 보냅니다.',
    steps: [
      { icon: Search, label: '선수 탐색' }, { icon: Star, label: '슬롯 PICK' },
      { icon: FileText, label: '조건 구성' }, { icon: Handshake, label: '승인 · 계약' },
      { icon: CreditCard, label: '결제' },
    ],
    meta: [
      { l: '추천 대상', v: '후원 방향과 선수를 구체적으로 정한 브랜드' },
      { l: '예상 소요', v: '평균 3~7일 (선수 응답 상황에 따라 상이)' },
      { l: '로그인 필요 시점', v: '슬롯 PICK 및 제안서 전송 시' },
    ],
    cta: { label: '직접 PICK 시작', to: '/sponsor/direct' },
  },
  {
    no: 2, title: 'SPONPIK 추천 PICK', icon: Target, tone: 'orange', badge: 'Recommended',
    desc: '목표와 예산을 입력하면 스폰픽이 최적의 선수를 추천해 드립니다.',
    steps: [
      { icon: Target, label: '목표 입력' }, { icon: BarChart3, label: '분석' },
      { icon: FileText, label: '추천안' }, { icon: Sliders, label: '수정' },
      { icon: Handshake, label: '선수 승인' }, { icon: CreditCard, label: '결제' },
    ],
    meta: [
      { l: '추천 대상', v: '최적의 매칭이 필요하거나 시간이 부족한 브랜드' },
      { l: '예상 소요', v: '평균 1~3일' },
      { l: '로그인 필요 시점', v: '추천안 확인 및 선수 승인 시' },
    ],
    cta: { label: '추천 받기', to: '/sponsor/recommended' },
  },
  {
    no: 3, title: '지금 가능한 후원상품', icon: ShoppingBag, tone: 'emerald',
    desc: '등록된 후원상품을 확인하고 바로 구매하거나 장바구니에 담을 수 있습니다.',
    steps: [
      { icon: ShoppingBag, label: '상품 탐색' }, { icon: FileText, label: '상세 확인' },
      { icon: CreditCard, label: '담기 또는 바로구매' },
    ],
    meta: [
      { l: '추천 대상', v: '즉시 진행 가능한 스폰서십을 찾는 브랜드' },
      { l: '예상 소요', v: '즉시 구매 가능' },
      { l: '로그인 필요 시점', v: '구매 및 결제 시' },
    ],
    cta: { label: '상품 보기', to: '/sponsor/available' },
  },
  {
    no: 4, title: '디지털 파트너십 구독', icon: Monitor, tone: 'sky', badge: 'Online Only',
    desc: '선수와 구성 플랜을 선택하고 월 구독으로 지속적인 파트너가 되어보세요.',
    steps: [
      { icon: Users, label: '선수 · 구성 선택' }, { icon: CalendarClock, label: '월 구독' },
    ],
    meta: [
      { l: '추천 대상', v: '지속적인 디지털 노출과 콘텐츠 협업을 원하는 브랜드' },
      { l: '예상 소요', v: '즉시 구독 가능' },
      { l: '로그인 필요 시점', v: '구독 및 결제 시' },
    ],
    cta: { label: '구독 알아보기', to: '/digital-partner' },
  },
];

const PLAYER_STEPS = [
  { no: 1, icon: ShieldCheck, title: '등록 · 인증', desc: '간단한 정보 등록과 본인 인증' },
  { no: 2, icon: User, title: '프로필 · 슬롯 설정', desc: '프로필 완성 및 스폰서 슬롯 설정' },
  { no: 3, icon: FileText, title: '제안 승인', desc: '브랜드의 제안 확인 및 승인' },
  { no: 4, icon: Handshake, title: '계약 실행', desc: '계약 체결 및 캠페인 진행' },
  { no: 5, icon: BarChart3, title: '성과 · 정산', desc: '성과 확인 및 정산 지급' },
];

const FAN_STEPS = [
  { no: 1, icon: Star, title: '관심 선수 선택', desc: '응원하고 싶은 선수 찾기' },
  { no: 2, icon: Heart, title: 'VOTE · 커뮤니티 · 응원편지', desc: '투표, 커뮤니티 활동, 응원편지 작성' },
  { no: 3, icon: BarChart3, title: '팬온도 · 팬포인트', desc: '활동이 쌓여 팬온도와 포인트로' },
  { no: 4, icon: ShoppingBag, title: '팬스토어 · 브랜드 추천', desc: '포인트로 굿즈 구매 및 브랜드 추천' },
];

/** 로그인 게이트 (§9.5) */
const LOGIN_GATE = [
  { action: '서비스 · 절차 열람', guest: true, when: '불필요' },
  { action: '선수 · 상품 탐색', guest: true, when: '상세 민감정보 열람·저장 시' },
  { action: '추천 입력', guest: true, when: '분석 저장·추천 결과 확인 전' },
  { action: '상품 담기', guest: true, when: '장바구니 동기화·결제 전' },
  { action: '팬 활동', guest: false, when: '투표·글쓰기·포인트 전' },
];

const TONE: Record<string, { ring: string; icon: string; btn: string }> = {
  emerald: { ring: 'border-emerald-200', icon: 'bg-emerald-50 text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  orange: { ring: 'border-orange-200', icon: 'bg-orange-50 text-orange-500', btn: 'bg-orange-500 hover:bg-orange-600' },
  sky: { ring: 'border-sky-200', icon: 'bg-sky-50 text-sky-600', btn: 'bg-sky-600 hover:bg-sky-700' },
};

export default function HowItWorks() {
  const [tab, setTab] = useState('brand');

  useEffect(() => {
    api.trackAboutEvent({ event: 'intro_view', pageSlug: 'how-it-works', visitorKey: visitorKey() }).catch(() => null);
  }, []);

  useEffect(() => {
    api.trackAboutEvent({
      event: 'intro_section_view', pageSlug: 'how-it-works', visitorKey: visitorKey(),
      params: { section: tab },
    }).catch(() => null);
  }, [tab]);

  return (
    <AboutShell current="이용방법"
      hero={
        <div className="text-center">
          <h1 className="text-[28px] sm:text-[38px] font-extrabold tracking-[-0.03em] leading-tight">
            나에게 맞는 후원 방법을 확인하세요
          </h1>
          <p className="mt-3 text-[14px] text-slate-500">
            브랜드 · 선수 · 팬 중 해당하는 역할을 선택하면 필요한 단계만 보여드립니다.
          </p>
        </div>
      }>

      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {/* 대상 선택 — 모바일에서 sticky (§14.2) */}
        <div className="mt-8 sticky top-0 z-20 bg-white/95 backdrop-blur py-3 -mx-5 px-5 sm:static sm:bg-transparent sm:py-0 sm:mx-0 sm:px-0">
          <div className="max-w-xl mx-auto grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100">
            {AUDIENCE.map((a) => {
              const I = a.icon;
              const on = tab === a.key;
              return (
                <button key={a.key} onClick={() => setTab(a.key)}
                  className={`h-11 rounded-xl text-[14px] font-bold inline-flex items-center justify-center gap-1.5 transition ${
                    on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <I className="w-4 h-4" /> {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 브랜드 */}
        {tab === 'brand' && (
          <div className="mt-8 grid lg:grid-cols-2 gap-4">
            {BRAND_PATHS.map((p) => {
              const I = p.icon;
              const t = TONE[p.tone];
              return (
                <section key={p.no} className={`rounded-3xl border ${t.ring} bg-white p-6`}>
                  <div className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                      {p.no}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[18px] font-extrabold text-slate-900">{p.title}</h2>
                        {p.badge && <Tag tone={p.tone === 'orange' ? 'amber' : 'sky'}>{p.badge}</Tag>}
                      </div>
                      <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">{p.desc}</p>
                    </div>
                    <span className={`w-14 h-14 rounded-2xl ${t.icon} hidden sm:flex items-center justify-center shrink-0`}>
                      <I className="w-6 h-6" />
                    </span>
                  </div>

                  {/* 단계 */}
                  <ol className="mt-5 flex flex-wrap items-center gap-1.5">
                    {p.steps.map((s, i) => {
                      const SI = s.icon;
                      return (
                        <li key={s.label} className="flex items-center gap-1.5">
                          <div className="text-center w-[62px]">
                            <span className="mx-auto mb-1 w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                              <SI className="w-4 h-4" />
                            </span>
                            <span className="block text-[10.5px] text-slate-500 leading-tight">{s.label}</span>
                          </div>
                          {i < p.steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-200 shrink-0" />}
                        </li>
                      );
                    })}
                  </ol>

                  {/* 메타 */}
                  <dl className="mt-5 space-y-2">
                    {p.meta.map((m) => (
                      <div key={m.l} className="flex gap-3 text-[12.5px]">
                        <dt className="inline-flex items-center h-6 px-2 rounded-lg bg-slate-50 text-slate-500 font-semibold shrink-0 w-[104px]">
                          {m.l}
                        </dt>
                        <dd className="text-slate-600 leading-6">{m.v}</dd>
                      </div>
                    ))}
                  </dl>

                  <Link to={p.cta.to}
                    onClick={() => api.trackAboutEvent({ event: 'intro_cta_click', pageSlug: 'how-it-works', visitorKey: visitorKey(), params: { cta: p.cta.to } }).catch(() => null)}
                    className={`mt-5 h-12 rounded-2xl ${t.btn} text-white text-[14px] font-bold flex items-center justify-center gap-1.5 transition`}>
                    {p.cta.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                </section>
              );
            })}
          </div>
        )}

        {/* 선수 */}
        {tab === 'player' && (
          <div className="mt-8 grid lg:grid-cols-2 gap-4">
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-sky-50/50 to-white p-6">
              <div className="flex items-center gap-2.5 mb-1.5">
                <User className="w-5 h-5 text-sky-600" />
                <h2 className="text-[19px] font-extrabold text-slate-900">선수 이용방법</h2>
              </div>
              <p className="text-[13px] text-slate-500 mb-5">스폰픽으로 새로운 기회를 만드세요</p>
              <ol className="space-y-2">
                {PLAYER_STEPS.map((s) => {
                  const I = s.icon;
                  return (
                    <li key={s.no} className="flex items-center gap-3.5 rounded-2xl bg-white border border-slate-100 px-4 py-3.5">
                      <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-[12px] font-bold flex items-center justify-center shrink-0">
                        {s.no}
                      </span>
                      <I className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold text-slate-900">{s.title}</span>
                        <span className="block text-[12px] text-slate-400 mt-0.5">{s.desc}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link to="/register"
                  className="h-12 rounded-2xl bg-sky-600 text-white text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-sky-700 transition">
                  선수 등록하기 <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/dashboard"
                  className="h-12 rounded-2xl border border-slate-200 text-slate-700 text-[14px] font-bold flex items-center justify-center hover:border-slate-400 transition">
                  제안함 보기
                </Link>
              </div>
              <p className="mt-4 text-[11.5px] text-slate-400 leading-relaxed">
                승인 전 공개되는 정보와 계약 당사자에게만 보이는 정보는 구분해 관리됩니다.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-violet-50/50 to-white p-6">
              <div className="flex items-center gap-2.5 mb-1.5">
                <Heart className="w-5 h-5 text-violet-600" />
                <h2 className="text-[19px] font-extrabold text-slate-900">팬 이용방법</h2>
              </div>
              <p className="text-[13px] text-slate-500 mb-5">응원이 모이면 선수가 더 빛납니다</p>
              <ol className="space-y-2">
                {FAN_STEPS.map((s) => {
                  const I = s.icon;
                  return (
                    <li key={s.no} className="flex items-center gap-3.5 rounded-2xl bg-white border border-slate-100 px-4 py-3.5">
                      <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-[12px] font-bold flex items-center justify-center shrink-0">
                        {s.no}
                      </span>
                      <I className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold text-slate-900">{s.title}</span>
                        <span className="block text-[12px] text-slate-400 mt-0.5">{s.desc}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <Link to="/fan"
                className="mt-5 h-12 rounded-2xl bg-violet-600 text-white text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-violet-700 transition">
                팬 참여 시작 <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="mt-4 rounded-2xl bg-white border border-slate-100 px-4 py-3.5 flex items-start gap-3">
                <Megaphone className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-slate-800">한 해의 응원이 광고가 됩니다</p>
                  <p className="mt-1 text-[11.5px] text-slate-400 leading-relaxed">
                    팬 활동이 활발한 선수는 연말에 참여 팬들의 이름으로 응원 광고를 지원받을 수 있어요.
                    (예산·매체 확정 시 진행되는 시즌형 캠페인입니다)
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === 'fan' && (
          <div className="mt-8 max-w-3xl mx-auto">
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-violet-50/50 to-white p-6">
              <h2 className="text-[19px] font-extrabold text-slate-900 mb-1.5">팬 이용방법</h2>
              <p className="text-[13px] text-slate-500 mb-5">관심 선수를 고르고 응원하면, 그 활동이 선수의 기회가 됩니다.</p>
              <ol className="space-y-2">
                {FAN_STEPS.map((s) => {
                  const I = s.icon;
                  return (
                    <li key={s.no} className="flex items-center gap-3.5 rounded-2xl bg-white border border-slate-100 px-4 py-4">
                      <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-[13px] font-bold flex items-center justify-center shrink-0">
                        {s.no}
                      </span>
                      <I className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-bold text-slate-900">{s.title}</span>
                        <span className="block text-[12.5px] text-slate-400 mt-0.5">{s.desc}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link to="/fan" className="h-12 rounded-2xl bg-violet-600 text-white text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-violet-700 transition">
                  팬 참여 시작 <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/athletes" className="h-12 rounded-2xl border border-slate-200 text-slate-700 text-[14px] font-bold flex items-center justify-center hover:border-slate-400 transition">
                  관심선수 찾기
                </Link>
              </div>
            </section>
          </div>
        )}

        {/* 로그인 게이트 */}
        <section className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-[16px] font-extrabold text-slate-900">비로그인도 탐색 가능</h2>
            <span className="text-[12.5px] text-slate-500">저장·계약·결제는 로그인 후 이용할 수 있습니다.</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[11px] text-slate-400 border-b border-emerald-200/60">
                  <th className="text-left font-semibold py-2">행동</th>
                  <th className="text-left font-semibold py-2">비로그인</th>
                  <th className="text-left font-semibold py-2">로그인 필요 시점</th>
                </tr>
              </thead>
              <tbody>
                {LOGIN_GATE.map((g) => (
                  <tr key={g.action} className="border-b border-emerald-100/60 last:border-0">
                    <td className="py-2.5 font-semibold text-slate-800">{g.action}</td>
                    <td className="py-2.5">
                      {g.guest
                        ? <Tag tone="emerald">허용</Tag>
                        : <span className="inline-flex items-center gap-1 text-[12px] text-slate-500"><Lock className="w-3 h-3" /> 일부만</span>}
                    </td>
                    <td className="py-2.5 text-slate-500">{g.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AboutShell>
  );
}
