/**
 * IU08 · IU09 이용방법 `/about/how-it-works` — 시안 2026-09-17 (리디자인/10 · 20 · 38 · 40)
 *
 *  "원하는 후원방식부터 선택하세요" → 3가지 방식(직접 PICK · 추천 PICK · 디지털 파트너 월 구독) → 4단계 흐름
 *  → 브랜드 / 선수 / 팬 탭 (?role=)
 *     브랜드: 4카드(단계 아이콘 흐름 · 추천 대상 · 예상 소요 · 로그인 필요 시점 · CTA) + "비로그인도 탐색 가능" 스트립
 *     선수·팬: 선수 이용방법 5단계 / 팬 이용방법 4단계 + "한 해의 응원이 광고가 됩니다" + 역할·안전·로그인 안내 3
 *  → 대상별 안내 3카드 + "어디서 시작할지 모르겠다면?"
 */
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2, User, Heart, Search, Star, FileText, Handshake, CreditCard, Target, BarChart3, Sliders, ShoppingBag, Monitor,
  CalendarClock, ShieldCheck, Lock, Users, ArrowRight, ChevronRight, Megaphone, MousePointerClick, UserCog, FileCheck2,
  TrendingUp, Crosshair, Wand2, HelpCircle, LayoutGrid, Eye, ClipboardCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, visitorKey } from '../../components/about/AboutShell';

const AUDIENCE = [
  { key: 'brand', label: '브랜드', icon: Building2 },
  { key: 'player', label: '선수', icon: User },
  { key: 'fan', label: '팬', icon: Heart },
];

/** 방식 3 (시안 20 상단) */
const WAYS = [
  { icon: Crosshair, title: '직접 PICK', desc: '경기복·후원슬롯 직접 선택', chips: ['자유로운 구성'], to: '/sponsor/direct' },
  { icon: Wand2, title: '추천 PICK', desc: '목표·예산 기반 조합', chips: ['전문가 추천'], to: '/sponsor/recommended' },
  { icon: Monitor, title: '디지털 파트너 월 구독', badge: 'NEW', desc: '12개월 온라인 · 등록매장 활용', chips: ['월 구독형', '온라인 확산'], note: '경기복 부착 미포함', to: '/digital-partner' },
];
const FLOW = [
  { no: 1, icon: MousePointerClick, title: '방식 선택', desc: null, chips: ['직접 PICK', '추천 PICK'] },
  { no: 2, icon: UserCog, title: '선수 · 상품 구성', desc: '선수 · 슬롯 · 기간 · 활동 선택' },
  { no: 3, icon: FileCheck2, title: '계약 · 선수 승인', desc: '표준계약 · 전자확인 · 선수 승인' },
  { no: 4, icon: TrendingUp, title: '실행 · 성과 확인', desc: '노출집행 · 성과 분석 · ROI 리포트' },
];

/** 브랜드 4가지 경로 (§9.2 · 시안 38) */
const BRAND_PATHS = [
  { no: 1, title: '직접 PICK', icon: Search, tone: 'emerald', desc: '원하는 선수를 직접 탐색하고\n조건을 구성해 후원 제안을 보냅니다.',
    steps: [{ icon: Search, label: '선수 탐색' }, { icon: Star, label: '슬롯 PICK' }, { icon: FileText, label: '조건 구성' }, { icon: Handshake, label: '승인 · 계약' }, { icon: CreditCard, label: '결제' }],
    meta: [{ l: '추천 대상', v: '후원 방향과 선수를 구체적으로 정한 브랜드' }, { l: '예상 소요', v: '평균 3~7일 (선수 응답 상황에 따라 상이)' }, { l: '로그인 필요 시점', v: '슬롯 PICK 및 제안서 전송 시' }],
    cta: { label: '직접 PICK 시작', to: '/sponsor/direct' } },
  { no: 2, title: '스폰픽 추천 PICK', icon: Target, tone: 'emerald', badge: 'Recommended', desc: '목표와 예산을 입력하면 스폰픽이\n최적의 선수를 추천해 드립니다.',
    steps: [{ icon: Target, label: '목표 입력' }, { icon: BarChart3, label: '분석' }, { icon: FileText, label: '추천안' }, { icon: Sliders, label: '수정' }, { icon: Handshake, label: '선수 승인' }, { icon: CreditCard, label: '결제' }],
    meta: [{ l: '추천 대상', v: '최적의 매칭이 필요하거나 시간이 부족한 브랜드' }, { l: '예상 소요', v: '평균 1~3일' }, { l: '로그인 필요 시점', v: '추천안 확인 및 선수 승인 시' }],
    cta: { label: '추천 받기', to: '/sponsor/recommended' } },
  { no: 3, title: '지금 가능한 후원상품', icon: ShoppingBag, tone: 'emerald', desc: '등록된 후원상품을 확인하고\n바로 구매하거나 장바구니에 담을 수 있습니다.',
    steps: [{ icon: LayoutGrid, label: '상품 탐색' }, { icon: FileText, label: '상세 확인' }, { icon: ShoppingBag, label: '담기 또는\n바로 구매' }],
    meta: [{ l: '추천 대상', v: '즉시 진행 가능한 스폰서십을 찾는 브랜드' }, { l: '예상 소요', v: '즉시 구매 가능' }, { l: '로그인 필요 시점', v: '구매 및 결제 시' }],
    cta: { label: '상품 보기', to: '/sponsor/available' } },
  { no: 4, title: '디지털 파트너십 구독', icon: Monitor, tone: 'emerald', badge: 'Online Only', desc: '선수와 구성 플랜을 선택하고\n월 구독으로 지속적인 파트너가 되어보세요.',
    steps: [{ icon: Users, label: '선수 · 구성 선택' }, { icon: CalendarClock, label: '월 구독' }],
    meta: [{ l: '추천 대상', v: '지속적인 디지털 노출과 콘텐츠 협업을 원하는 브랜드' }, { l: '예상 소요', v: '즉시 구독 가능' }, { l: '로그인 필요 시점', v: '구독 및 결제 시' }],
    cta: { label: '구독 알아보기', to: '/digital-partner' } },
];

const PLAYER_STEPS = [
  { no: 1, icon: ShieldCheck, title: '등록 · 인증', desc: '간단한 정보 등록과 본인 인증', to: '/register' },
  { no: 2, icon: User, title: '프로필 · 슬롯 설정', desc: '프로필 완성 및 스폰서 슬롯 설정', to: '/dashboard' },
  { no: 3, icon: FileText, title: '제안 승인', desc: '브랜드의 제안 확인 및 승인', to: '/athlete/requests' },
  { no: 4, icon: Handshake, title: '계약 실행', desc: '계약 체결 및 캠페인 진행', to: '/dashboard' },
  { no: 5, icon: BarChart3, title: '성과 · 정산', desc: '성과 확인 및 정산 지급', to: '/dashboard' },
];
const FAN_STEPS = [
  { no: 1, icon: Star, title: '관심 선수 선택', desc: '응원하고 싶은 선수 찾기', to: '/athletes/search' },
  { no: 2, icon: Heart, title: 'VOTE · 커뮤니티 · 응원편지', desc: '투표, 커뮤니티 활동, 응원편지 작성', to: '/fan/vote' },
  { no: 3, icon: BarChart3, title: '팬온도 · 팬포인트', desc: '활동이 쌓여 팬온도와 포인트로', to: '/fan/points' },
  { no: 4, icon: ShoppingBag, title: '팬스토어 · 브랜드 추천', desc: '포인트로 굿즈 구매 및 브랜드 추천', to: '/fan/store' },
];
const FOOTNOTES = [
  { icon: ShieldCheck, t: '명확한 역할과 권한', d: '선수, 팬, 브랜드는 각자의 역할에 맞는 기능만 이용할 수 있어요.' },
  { icon: Lock, t: '안전한 활동 보장', d: '본인 인증과 커뮤니티 가이드를 통해 안전한 환경을 제공합니다.' },
  { icon: Users, t: '로그인 후 이용 가능', d: '모든 기능은 로그인 후 이용하실 수 있습니다.' },
];
const ROLE_CARDS = [
  { icon: Building2, title: '브랜드 · 광고주', desc: '우리 브랜드에 맞는\n후원을 시작하세요.', link: '브랜드 이용안내', role: 'brand', img: null },
  { icon: User, title: '선수 · 매니지먼트', desc: '나에게 맞는 후원을\n구성해보세요.', link: '선수 이용안내', role: 'player', img: '/hero-golfer.jpg' },
  { icon: Users, title: '팬', desc: '좋아하는 선수를\n응원하고 참여하세요.', link: '팬 참여 안내', role: 'fan', img: null },
];

export default function HowItWorks() {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('role') || 'brand';
  const tab = ['brand', 'player', 'fan'].includes(raw) ? raw : 'brand';
  const setTab = (k: string) => setSp(k === 'brand' ? {} : { role: k }, { replace: true });

  useEffect(() => { api.trackAboutEvent({ event: 'intro_view', pageSlug: 'how-it-works', visitorKey: visitorKey() }).catch(() => null); }, []);
  useEffect(() => { api.trackAboutEvent({ event: 'intro_section_view', pageSlug: 'how-it-works', visitorKey: visitorKey(), params: { section: tab } }).catch(() => null); }, [tab]);
  const cta = (to: string) => api.trackAboutEvent({ event: 'intro_cta_click', pageSlug: 'how-it-works', visitorKey: visitorKey(), params: { cta: to } }).catch(() => null);

  return (
    <AboutShell current="how"
      hero={
        <div className="text-center">
          <h1 className="text-[28px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">
            {tab === 'brand' ? '원하는 후원방식부터 선택하세요' : '선수와 팬도 쉽게 시작하세요'}
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15px] text-slate-500 break-keep">
            {tab === 'brand' ? '오프라인 노출, 추천 조합, 월 구독 중 목적에 맞는 방식으로 시작할 수 있습니다.' : '역할을 선택하면 필요한 단계만 보여드립니다.'}
          </p>
        </div>
      }>
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {/* 대상 선택 */}
        <div className="mt-8 sticky top-0 z-20 bg-white/95 backdrop-blur py-3 -mx-5 px-5 sm:static sm:bg-transparent sm:py-0 sm:mx-0 sm:px-0">
          <div className="max-w-2xl mx-auto grid grid-cols-3 gap-1 p-1 rounded-full border border-slate-200 bg-white">
            {AUDIENCE.map((a) => { const I = a.icon; const on = tab === a.key; return (
              <button key={a.key} onClick={() => setTab(a.key)} aria-pressed={on}
                className={`h-12 rounded-full text-[14.5px] font-bold inline-flex items-center justify-center gap-2 transition ${on ? 'bg-emerald-600 text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.8)]' : 'text-slate-600 hover:text-slate-900'}`}>
                <I className="w-4 h-4" /> {a.label}
              </button>
            ); })}
          </div>
        </div>

        {tab === 'brand' && (
          <>
            {/* 방식 3 → 4단계 (시안 20) */}
            <section className="mt-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-[1080px] mx-auto">
                {WAYS.map((w) => { const I = w.icon; return (
                  <Link key={w.title} to={w.to} onClick={() => cta(w.to)} className="rounded-3xl border border-slate-200 bg-white p-5 flex gap-4 hover:border-emerald-300 transition">
                    <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><I className="w-7 h-7" /></span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-[17px] font-extrabold">{w.title}{w.badge && <span className="px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-black">{w.badge}</span>}</span>
                      <span className="block text-[13px] text-slate-500 mt-0.5">{w.desc}</span>
                      <span className="mt-2.5 flex flex-wrap gap-1.5">{w.chips.map((c) => <span key={c} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11.5px] font-bold">{c}</span>)}</span>
                      {w.note && <span className="block mt-2 text-[11.5px] text-slate-400">{w.note}</span>}
                    </span>
                  </Link>
                ); })}
              </div>
              <div aria-hidden className="hidden md:block max-w-[1080px] mx-auto h-8 border-x border-b border-emerald-200 rounded-b-3xl mx-[16%]" style={{ marginLeft: '16%', marginRight: '16%' }} />
              <ol className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                {FLOW.map((f, i) => { const I = f.icon; return (
                  <li key={f.no} className="relative rounded-3xl border border-slate-200 bg-white p-5 text-center">
                    <span className="absolute left-4 top-4 w-7 h-7 rounded-full bg-emerald-600 text-white text-[12.5px] font-extrabold flex items-center justify-center">{f.no}</span>
                    <I className="w-10 h-10 mx-auto text-emerald-600 mt-2" strokeWidth={1.6} />
                    <p className="mt-3 text-[17px] font-extrabold">{f.title}</p>
                    {f.desc && <p className="mt-1 text-[12.5px] text-slate-500 break-keep">{f.desc}</p>}
                    {f.chips && <div className="mt-2 flex justify-center gap-1.5">{f.chips.map((c) => <span key={c} className="px-2 py-1 rounded-md border border-emerald-200 text-emerald-700 text-[11.5px] font-bold">{c}</span>)}</div>}
                    {i < FLOW.length - 1 && <ArrowRight className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 bg-white rounded-full" />}
                  </li>
                ); })}
              </ol>
            </section>

            {/* 4가지 경로 상세 (시안 38) */}
            <div className="mt-10 grid lg:grid-cols-2 gap-4">
              {BRAND_PATHS.map((p) => { const I = p.icon; return (
                <section key={p.no} className="rounded-3xl border border-slate-200 bg-white p-6 relative">
                  <span className="absolute left-4 top-4 w-8 h-8 rounded-full bg-emerald-600 text-white text-[13px] font-extrabold flex items-center justify-center">{p.no}</span>
                  <div className="flex gap-5">
                    <span className="hidden sm:flex w-[120px] h-[120px] rounded-2xl bg-emerald-50 text-emerald-600 items-center justify-center shrink-0 mt-2"><I className="w-14 h-14" strokeWidth={1.5} /></span>
                    <div className="min-w-0 flex-1 pl-8 sm:pl-0">
                      <div className="flex flex-wrap items-center gap-2"><h2 className="text-[19px] font-extrabold text-slate-900">{p.title}</h2>{p.badge && <Tag tone="emerald">{p.badge}</Tag>}</div>
                      <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed whitespace-pre-line">{p.desc}</p>
                      <ol className="mt-4 flex flex-wrap items-start gap-1">
                        {p.steps.map((s, i) => { const SI = s.icon; return (
                          <li key={s.label} className="flex items-start gap-1">
                            <div className="text-center w-[64px]">
                              <span className="mx-auto mb-1 w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center"><SI className="w-5 h-5" /></span>
                              <span className="block text-[11.5px] text-slate-600 leading-tight whitespace-pre-line">{s.label}</span>
                            </div>
                            {i < p.steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-3.5" />}
                          </li>
                        ); })}
                      </ol>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col sm:flex-row sm:items-end gap-4">
                    <dl className="flex-1 space-y-1.5">
                      {p.meta.map((m) => (
                        <div key={m.l} className="flex gap-3 text-[12.5px]">
                          <dt className="inline-flex items-center h-6 px-2 rounded-md bg-slate-100 text-slate-600 font-bold shrink-0 w-[104px]">{m.l}</dt>
                          <dd className="text-slate-600 leading-6 break-keep">{m.v}</dd>
                        </div>
                      ))}
                    </dl>
                    <Link to={p.cta.to} onClick={() => cta(p.cta.to)} className="h-12 px-6 rounded-xl bg-emerald-600 text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition shrink-0">
                      {p.cta.label} <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </section>
              ); })}
            </div>

            {/* 비로그인도 탐색 가능 (시안 38 하단) */}
            <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0"><ShieldCheck className="w-6 h-6" /></span>
                <div><p className="text-[16px] font-extrabold text-slate-900">비로그인도 탐색 가능</p><p className="text-[12.5px] text-slate-600">저장·계약·결제는 로그인 후 이용할 수 있습니다.</p></div>
              </div>
              <div className="flex flex-wrap gap-2 lg:ml-auto">
                {[{ icon: Search, l: '선수 탐색', to: '/athletes/search' }, { icon: Eye, l: '후원상품 확인', to: '/sponsor/available' }, { icon: ClipboardCheck, l: '추천 방식 살펴보기', to: '/sponsor/recommended' }].map((x) => { const I = x.icon; return (
                  <Link key={x.l} to={x.to} className="h-10 px-4 rounded-full bg-white border border-emerald-100 text-[13px] font-bold text-slate-700 inline-flex items-center gap-1.5 hover:border-emerald-300"><I className="w-4 h-4 text-emerald-600" /> {x.l}</Link>
                ); })}
                <span className="self-center text-[12.5px] font-bold text-emerald-700">회원가입 없이 자유롭게 둘러보세요!</span>
              </div>
            </section>
          </>
        )}

        {tab !== 'brand' && (
          <>
            <div className="mt-10 grid lg:grid-cols-2 gap-4">
              {/* 선수 */}
              <section className={`rounded-3xl border bg-gradient-to-b from-sky-50/70 to-white p-6 ${tab === 'player' ? 'border-sky-300 ring-2 ring-sky-100' : 'border-slate-200'}`}>
                <div className="flex gap-5">
                  <div className="hidden sm:block w-[150px] shrink-0 rounded-2xl overflow-hidden bg-sky-100 relative min-h-[300px]">
                    <img src="/hero-golfer.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1"><User className="w-5 h-5 text-sky-600" /><h2 className="text-[20px] font-extrabold text-slate-900">선수 이용방법</h2></div>
                    <p className="text-[13px] text-slate-500 mb-4">스폰픽으로 새로운 기회를 만드세요</p>
                    <ol className="space-y-2">
                      {PLAYER_STEPS.map((s) => { const I = s.icon; return (
                        <li key={s.no}><Link to={s.to} className="flex items-center gap-3.5 rounded-2xl bg-white border border-slate-100 px-4 py-3 hover:border-sky-300 transition">
                          <span className="w-7 h-7 rounded-full bg-sky-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">{s.no}</span>
                          <I className="w-5 h-5 text-sky-500 shrink-0" />
                          <span className="min-w-0 flex-1"><span className="block text-[14px] font-bold text-slate-900">{s.title}</span><span className="block text-[12px] text-slate-500 mt-0.5">{s.desc}</span></span>
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        </Link></li>
                      ); })}
                    </ol>
                  </div>
                </div>
                <Link to="/register" onClick={() => cta('/register')} className="mt-5 h-12 px-6 rounded-full bg-sky-600 text-white text-[14.5px] font-extrabold inline-flex items-center gap-2 hover:bg-sky-700 transition">선수 등록하기 <ArrowRight className="w-4 h-4" /></Link>
              </section>

              {/* 팬 */}
              <section className={`rounded-3xl border bg-gradient-to-b from-violet-50/70 to-white p-6 ${tab === 'fan' ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2.5 mb-1"><Users className="w-5 h-5 text-violet-600" /><h2 className="text-[20px] font-extrabold text-slate-900">팬 이용방법</h2></div>
                <p className="text-[13px] text-slate-500 mb-4">응원이 모이면 선수가 더 빛납니다</p>
                <ol className="space-y-2">
                  {FAN_STEPS.map((s) => { const I = s.icon; return (
                    <li key={s.no}><Link to={s.to} className="flex items-center gap-3.5 rounded-2xl bg-white border border-slate-100 px-4 py-3 hover:border-violet-300 transition">
                      <span className="w-7 h-7 rounded-full bg-violet-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">{s.no}</span>
                      <I className="w-5 h-5 text-violet-500 shrink-0" />
                      <span className="min-w-0 flex-1"><span className="block text-[14px] font-bold text-slate-900">{s.title}</span><span className="block text-[12px] text-slate-500 mt-0.5">{s.desc}</span></span>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </Link></li>
                  ); })}
                </ol>
                <Link to="/fan" onClick={() => cta('/fan')} className="mt-5 h-12 px-6 rounded-full bg-violet-600 text-white text-[14.5px] font-extrabold inline-flex items-center gap-2 hover:bg-violet-700 transition">팬 참여 시작 <ArrowRight className="w-4 h-4" /></Link>
                <p aria-hidden className="mt-4 text-right font-script text-[26px] text-violet-300 leading-none select-none">Fighting!</p>
              </section>
            </div>

            <section className="mt-6 max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white p-5 flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><Megaphone className="w-7 h-7" /></span>
              <div className="min-w-0"><p className="text-[16px] font-extrabold">한 해의 응원이 광고가 됩니다</p><p className="mt-1 text-[12.5px] text-slate-500 leading-relaxed break-keep">팬 활동이 활발한 선수는 연말, 참여 팬들의 이름으로 응원 광고(지하철·전광판 등)를 지원받을 수 있어요.</p></div>
              <Link to="/fan/campaign" className="hidden sm:inline-flex h-9 px-3.5 rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-700 items-center shrink-0 hover:border-slate-400">자세히</Link>
            </section>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 rounded-3xl border border-slate-200 bg-slate-50/60">
              {FOOTNOTES.map((f) => { const I = f.icon; return (
                <div key={f.t} className="p-5 flex gap-3"><I className="w-6 h-6 text-slate-500 shrink-0" /><div><p className="text-[13.5px] font-extrabold">{f.t}</p><p className="mt-1 text-[12px] text-slate-500 break-keep">{f.d}</p></div></div>
              ); })}
            </div>
          </>
        )}

        {/* 대상별 안내 3 + 어디서 시작할지 (시안 20 하단) */}
        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLE_CARDS.map((r) => { const I = r.icon; return (
            <button key={r.role} type="button" onClick={() => { setTab(r.role); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="relative text-left rounded-3xl border border-slate-200 bg-white overflow-hidden min-h-[190px] hover:border-emerald-300 transition">
              {r.img && <img src={r.img} alt="" className="absolute right-0 top-0 h-full w-[46%] object-cover object-top" />}
              <div className="relative p-5 max-w-[60%]">
                <span className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><I className="w-5 h-5" /></span>
                <p className="mt-3 text-[16px] font-extrabold">{r.title}</p>
                <p className="mt-1 text-[12.5px] text-slate-500 whitespace-pre-line leading-relaxed">{r.desc}</p>
                <span className="mt-3 inline-flex items-center gap-0.5 text-[12.5px] font-bold text-emerald-700">{r.link} <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </button>
          ); })}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 flex flex-col">
            <span className="w-11 h-11 rounded-full bg-white text-emerald-600 flex items-center justify-center"><HelpCircle className="w-5 h-5" /></span>
            <p className="mt-3 text-[16px] font-extrabold">어디서 시작할지 모르겠다면?</p>
            <p className="mt-1 text-[12.5px] text-slate-600 break-keep">선택이 고민될 때 추천 PICK으로 빠르고 쉽게 시작할 수 있어요.</p>
            <Link to="/sponsor/recommended" onClick={() => cta('/sponsor/recommended')} className="mt-auto pt-4"><span className="h-12 w-full rounded-xl bg-emerald-700 text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-800">스폰픽 추천 PICK 시작하기 <ChevronRight className="w-4 h-4" /></span></Link>
          </div>
        </section>
      </div>
    </AboutShell>
  );
}
