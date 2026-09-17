/**
 * IU01 서비스소개 `/about/service` — 시안 2026-09-17 (리디자인/10 · 18 · 24)
 *
 *  히어로 "선수의 가능성에 브랜드를 PICK하다" + 직접 PICK / 추천 PICK 카드
 *  → "선수의 가능성과 브랜드의 성장을 연결합니다" 4가치(오프라인 후원슬롯 · 디지털 파트너 구독 · 팬 참여·팬온도 · 성과·ROI 리포트)
 *     + 선수·브랜드·팬 연결 다이어그램
 *  → 핵심 기능 5가지 → 시작 방식 3카드(직접 PICK · 추천 PICK · 디지털 파트너 월 구독)
 *  → 브랜드 가치 / 선수 가치 / 팬 가치 탭 (사례가 있으면 사례 카드, 없으면 가치 설명)
 *  → 공식 인스타그램 → 최종 CTA
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Search, CalendarCheck, FileSignature, ShieldCheck, BarChart3, Target, Sparkles, Building2, User, Heart,
  Trophy, Monitor, Users, LineChart, Crosshair, Wand2, CalendarDays, ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, VerifiedBadge, Skeleton, visitorKey, InstagramStrip } from '../../components/about/AboutShell';

const FEATURES = [
  { icon: Search, title: '선수 탐색', desc: '다양한 종목의 선수를 쉽게 검색하고 비교' },
  { icon: CalendarCheck, title: '후원슬롯', desc: '선수의 후원 가능 슬롯과 노출 영역 확인' },
  { icon: FileSignature, title: '계약 · 실행', desc: '온라인 계약으로 간편하게 후원 시작' },
  { icon: ShieldCheck, title: '노출 검증', desc: '후원 노출 내용을 이미지로 증빙' },
  { icon: BarChart3, title: '성과 리포트', desc: '데이터 기반 성과 리포트로 효과를 한눈에' },
];

const VALUES = [
  { icon: Trophy, title: '오프라인 후원슬롯', desc: '대회·경기복 중심의\n짧고 강한 노출' },
  { icon: Monitor, title: '디지털 파트너 구독', badge: 'NEW', desc: '12개월 온라인·팬스토어·\n등록매장 파트너십' },
  { icon: Users, title: '팬 참여 · 팬온도', desc: '추천과 구매가\n선수의 가치로' },
  { icon: LineChart, title: '성과 · ROI 리포트', desc: '노출 · 클릭 · QR · 구매 확인' },
];

const STARTS = [
  { icon: Crosshair, title: '직접 PICK', desc: '선수와 후원위치를 직접 선택', to: '/sponsor/direct', cta: 'direct_pick' },
  { icon: Wand2, title: '스폰픽 추천 PICK', desc: '목표와 예산에 맞는 조합 추천', to: '/sponsor/recommended', cta: 'recommended_pick' },
  { icon: CalendarDays, title: '디지털 파트너 월 구독', desc: '12개월 파트너십으로 지속 노출', to: '/digital-partner', cta: 'digital_partner' },
];

const AUDIENCE = [
  { key: 'brand', label: '브랜드 가치', icon: Building2, values: [
    { title: '목표에 맞는 선수 매칭', desc: '업종·예산·목표를 입력하면 적합한 선수와 후원 방식을 제안합니다.' },
    { title: '집행부터 검증까지', desc: '계약·실행·노출 검증·성과 리포트를 한 곳에서 관리합니다.' },
    { title: '성과 기준 합의', desc: '적용 상품은 계약서에 성과 기준과 보완 지원을 명시합니다.' },
  ] },
  { key: 'player', label: '선수 가치', icon: User, values: [
    { title: '후원 기회 확대', desc: '프로필과 슬롯을 등록하면 브랜드 제안을 받을 수 있습니다.' },
    { title: '조건을 직접 승인', desc: '모든 제안은 선수 승인 후에만 계약으로 이어집니다.' },
    { title: '활동이 자산이 되는 구조', desc: '경기 기록과 팬 활동이 후원 제안의 근거가 됩니다.' },
  ] },
  { key: 'fan', label: '팬 가치', icon: Heart, values: [
    { title: '응원이 기회로', desc: '투표·커뮤니티 활동이 팬온도로 쌓여 선수를 브랜드에 소개합니다.' },
    { title: '참여한 만큼 혜택', desc: '활동에 따라 팬포인트가 적립되고 팬스토어에서 사용합니다.' },
    { title: '선수와 브랜드 연결', desc: '팬이 추천한 브랜드가 실제 협업 검토로 이어집니다.' },
  ] },
];

/** 선수 · 브랜드 · 팬 연결 다이어그램 (시안 18 중앙) */
function Diagram() {
  const node = (label: string, I: any, cls: string) => (
    <div className={`absolute ${cls} w-[88px] h-[88px] rounded-full bg-white border-2 border-emerald-100 shadow-[0_8px_24px_-14px_rgba(16,185,129,0.6)] flex flex-col items-center justify-center gap-1`}>
      <I className="w-6 h-6 text-emerald-600" />
      <span className="text-[12.5px] font-extrabold text-slate-800">{label}</span>
    </div>
  );
  return (
    <div className="relative mx-auto w-[300px] h-[250px]" aria-label="선수 · 브랜드 · 팬을 잇는 SPONPIK">
      <svg viewBox="0 0 300 250" className="absolute inset-0 w-full h-full">
        <circle cx="150" cy="135" r="98" fill="none" stroke="#d1fae5" strokeWidth="2" strokeDasharray="4 6" />
        <line x1="150" y1="60" x2="150" y2="135" stroke="#6ee7b7" strokeWidth="2" />
        <line x1="60" y1="190" x2="150" y2="135" stroke="#6ee7b7" strokeWidth="2" />
        <line x1="240" y1="190" x2="150" y2="135" stroke="#6ee7b7" strokeWidth="2" />
      </svg>
      {node('선수', User, 'left-1/2 -translate-x-1/2 top-2')}
      {node('브랜드', Building2, 'left-2 bottom-4')}
      {node('팬', Users, 'right-2 bottom-4')}
      <div className="absolute left-1/2 top-[135px] -translate-x-1/2 -translate-y-1/2 w-[64px] h-[64px] rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-[0_12px_30px_-12px_rgba(5,150,105,0.9)]">
        <img src="/logo-64.png" alt="SPONPIK" className="w-9 h-9 rounded-full" />
      </div>
    </div>
  );
}

export default function ServiceIntro() {
  const [cases, setCases] = useState<any[]>([]);
  const [tab, setTab] = useState('brand');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trackAboutEvent({ event: 'intro_view', pageSlug: 'service', visitorKey: visitorKey() }).catch(() => null);
    api.listMatchingCases({ limit: 3, sort: 'RECOMMENDED' }).then((r) => setCases(r.data?.cases ?? [])).catch(() => null).finally(() => setLoading(false));
  }, []);

  const track = (cta: string, target: string) =>
    api.trackAboutEvent({ event: 'intro_cta_click', pageSlug: 'service', visitorKey: visitorKey(), params: { cta, target } }).catch(() => null);

  const audience = AUDIENCE.find((a) => a.key === tab)!;

  return (
    <AboutShell current="service"
      hero={
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h1 className="text-[30px] sm:text-[44px] font-extrabold tracking-[-0.035em] leading-[1.15]">
              선수의 가능성에<br />브랜드를 <span className="text-emerald-600">PICK</span>하다
            </h1>
            <p className="mt-4 text-[15px] text-slate-500 leading-relaxed break-keep max-w-lg">
              선수와 후원방식을 선택하고,<br className="hidden sm:block" />계약부터 성과 확인까지 한 번에.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 w-full lg:w-[520px]">
            <Link to="/sponsor/direct" onClick={() => track('direct_pick', '/sponsor/direct')}
              className="group relative rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 overflow-hidden">
              <Target className="absolute right-4 top-10 w-20 h-20 text-emerald-200" strokeWidth={1.2} />
              <p className="relative text-[18px] font-extrabold text-slate-900 leading-snug">선수·후원방식<br />직접 <span className="text-emerald-600">PICK</span></p>
              <p className="relative mt-8 text-[12.5px] text-slate-500 leading-relaxed break-keep">원하는 선수와 후원방식을<br />직접 선택해 후원하세요.</p>
              <span className="relative mt-4 inline-flex w-8 h-8 rounded-full bg-emerald-600 text-white items-center justify-center group-hover:bg-emerald-700 transition ml-auto float-right"><ArrowRight className="w-4 h-4" /></span>
            </Link>
            <Link to="/sponsor/recommended" onClick={() => track('recommended_pick', '/sponsor/recommended')}
              className="group relative rounded-3xl border border-orange-200 bg-gradient-to-b from-orange-50/80 to-white p-5 transition hover:-translate-y-0.5 hover:border-orange-300 overflow-hidden">
              <span className="absolute -top-px left-5 inline-flex h-6 px-2.5 rounded-b-lg bg-orange-500 text-white text-[12px] font-bold items-center">추천</span>
              <Sparkles className="absolute right-4 top-10 w-20 h-20 text-orange-200" strokeWidth={1.2} />
              <p className="relative mt-4 text-[18px] font-extrabold text-slate-900 leading-snug">SPONPIK<br /><span className="text-orange-500">추천 PICK</span></p>
              <p className="relative mt-8 text-[12.5px] text-slate-500 leading-relaxed break-keep">스폰픽이 분석한 데이터를 통해<br />최적의 매칭을 제안해드려요.</p>
              <span className="relative mt-4 inline-flex w-8 h-8 rounded-full bg-orange-500 text-white items-center justify-center group-hover:bg-orange-600 transition ml-auto float-right"><ArrowRight className="w-4 h-4" /></span>
            </Link>
          </div>
        </div>
      }>
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {/* 가치 4 + 다이어그램 (시안 18) */}
        <section className="mt-14 text-center">
          <h2 className="text-[26px] sm:text-[36px] font-extrabold tracking-[-0.03em] leading-tight break-keep">
            <span className="text-emerald-600">선수</span>의 가능성과 <span className="text-emerald-600">브랜드</span>의 성장을 연결합니다
          </h2>
          <p className="mt-3 text-[14px] sm:text-[15px] text-slate-500 leading-relaxed break-keep">SPONPIK은 선수·브랜드·팬 데이터를 기반으로<br className="hidden sm:block" />후원을 선택하고, 실행하고, 성과까지 확인하는 스포츠 후원 플랫폼입니다.</p>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center text-left">
            <div className="grid gap-3">
              {VALUES.slice(0, 2).map((v) => { const I = v.icon; return (
                <div key={v.title} className="rounded-3xl border border-slate-200 bg-white p-5 flex items-center gap-4">
                  <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><I className="w-7 h-7" /></span>
                  <div><p className="text-[16px] font-extrabold inline-flex items-center gap-2">{v.title}{v.badge && <span className="px-1.5 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-black">{v.badge}</span>}</p><p className="mt-1 text-[13px] text-slate-500 whitespace-pre-line leading-relaxed">{v.desc}</p></div>
                </div>
              ); })}
            </div>
            <div className="py-2"><Diagram /></div>
            <div className="grid gap-3">
              {VALUES.slice(2).map((v) => { const I = v.icon; return (
                <div key={v.title} className="rounded-3xl border border-slate-200 bg-white p-5 flex items-center gap-4">
                  <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><I className="w-7 h-7" /></span>
                  <div><p className="text-[16px] font-extrabold">{v.title}</p><p className="mt-1 text-[13px] text-slate-500 whitespace-pre-line leading-relaxed">{v.desc}</p></div>
                </div>
              ); })}
            </div>
          </div>
        </section>

        {/* 핵심 기능 5가지 (시안 24) */}
        <section className="mt-14">
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-[-0.02em] mb-5">핵심 기능 5가지</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {FEATURES.map((f, i) => { const I = f.icon; return (
              <div key={f.title} className="relative rounded-3xl border border-slate-200 bg-white p-5 flex gap-3.5">
                <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><I className="w-5 h-5" /></span>
                <div className="min-w-0"><p className="text-[14.5px] font-extrabold">{f.title}</p><p className="mt-1 text-[12px] text-slate-500 leading-relaxed break-keep">{f.desc}</p></div>
                {i < FEATURES.length - 1 && <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
              </div>
            ); })}
          </div>
        </section>

        {/* 시작 방식 3 (시안 18 하단) */}
        <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3">
          {STARTS.map((s) => { const I = s.icon; return (
            <Link key={s.title} to={s.to} onClick={() => track(s.cta, s.to)}
              className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-5 flex items-center gap-4 hover:border-emerald-300 hover:bg-white transition">
              <span className="w-14 h-14 rounded-full bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><I className="w-6 h-6" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[16px] font-extrabold">{s.title}</span><span className="block text-[12.5px] text-slate-500 mt-0.5">{s.desc}</span></span>
              <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-0.5 transition" />
            </Link>
          ); })}
        </section>

        {/* 대상별 가치 (시안 24) */}
        <section className="mt-14">
          <div className="flex gap-1 border-b border-slate-200 mb-6">
            {AUDIENCE.map((a) => { const I = a.icon; const on = tab === a.key; return (
              <button key={a.key} onClick={() => setTab(a.key)}
                className={`relative inline-flex items-center gap-1.5 px-5 py-3 text-[14.5px] font-bold transition ${on ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <I className="w-4 h-4" /> {a.label}
                {on && <span className="absolute left-3 right-3 -bottom-px h-[2.5px] rounded-full bg-emerald-500" />}
              </button>
            ); })}
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[200px] rounded-3xl" />)}</div>
          ) : tab === 'brand' && cases.length ? (
            <div className="grid sm:grid-cols-3 gap-3">
              {cases.map((c) => (
                <Link key={c.slug} to={`/about/cases/${c.slug}`} className="group relative rounded-3xl overflow-hidden bg-slate-900 aspect-[16/10] min-h-[200px]">
                  {c.heroImageUrl ? <img src={c.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform" /> : <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-slate-900" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 top-4 px-4 flex gap-1.5">{c.sport && <span className="px-2 py-0.5 rounded-md bg-white/90 text-[11px] font-bold text-slate-800">{c.sport}</span>}{c.tour && <span className="px-2 py-0.5 rounded-md bg-white/90 text-[11px] font-bold text-slate-800">{c.tour}</span>}</div>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-[16px] font-extrabold leading-snug">{c.brandName} × {c.athleteName} 선수</p>
                    <p className="mt-1 text-[12.5px] text-white/85 line-clamp-2 break-keep">{c.summary || c.title}</p>
                    <span className="absolute right-4 bottom-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><ChevronRight className="w-4 h-4" /></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {audience.values.map((v) => (
                <div key={v.title} className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-[15px] font-bold text-slate-900">{v.title}</p>
                  <p className="mt-2 text-[13px] text-slate-500 leading-relaxed break-keep">{v.desc}</p>
                </div>
              ))}
            </div>
          )}
          {tab === 'brand' && cases.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[12.5px] text-slate-500 inline-flex items-center gap-1"><VerifiedBadge label="" /> 검증된 사례만 표시됩니다</p>
              <Link to="/about/cases" className="text-[13px] font-bold text-emerald-700 inline-flex items-center gap-0.5">매칭사례 전체 보기 <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          )}
          {tab !== 'brand' && (
            <div className="mt-3 text-right">
              <Link to={tab === 'player' ? '/about/how-it-works?role=player' : '/about/how-it-works?role=fan'} className="text-[13px] font-bold text-emerald-700 inline-flex items-center gap-0.5">{tab === 'player' ? '선수 이용방법' : '팬 이용방법'} 보기 <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          )}
        </section>

        <section className="mt-12"><InstagramStrip pageSlug="service" /></section>

        <section className="mt-10">
          <div className="rounded-[28px] bg-slate-900 px-6 sm:px-10 py-10 text-center">
            <h2 className="text-[24px] sm:text-[30px] font-extrabold text-white tracking-[-0.02em]">내게 맞는 후원을 시작하세요</h2>
            <p className="mt-3 text-[14px] text-white/60">비회원도 선수와 후원상품을 자유롭게 둘러볼 수 있습니다.</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <Link to="/about/how-it-works" onClick={() => track('how_it_works', '/about/how-it-works')} className="h-12 px-6 rounded-2xl bg-white text-slate-900 text-[15px] font-bold inline-flex items-center hover:bg-slate-100 transition">이용방법 보기</Link>
              <Link to="/sponsor/available" onClick={() => track('available', '/sponsor/available')} className="h-12 px-6 rounded-2xl bg-emerald-600 text-white text-[15px] font-bold inline-flex items-center gap-1.5 hover:bg-emerald-700 transition">지금 가능한 후원 보기 <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </section>
        <p className="mt-4 text-[12px] text-slate-400"><Tag>안내</Tag> 소개 화면의 사례·브랜드는 당사자 승인과 검증을 거친 것만 표시됩니다.</p>
      </div>
    </AboutShell>
  );
}
