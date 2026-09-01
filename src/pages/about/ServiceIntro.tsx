/**
 * IU01 서비스소개 (핸드오프 v1.0 §4)
 * 첫 화면에서 "직접 선택 또는 추천" 구조가 5초 안에 읽혀야 한다 (§4.4).
 * 핵심 기능은 6개를 넘지 않고, 경매가 대표 기능처럼 보이지 않게 한다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Search, CalendarCheck, FileSignature, ShieldCheck, BarChart3,
  Target, Sparkles, Instagram, ExternalLink, Building2, User, Heart,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, VerifiedBadge, StateNotice, Skeleton, visitorKey } from '../../components/about/AboutShell';

/** 핵심 기능 5가지 (§4.1) — 경매는 대표 기능에 넣지 않는다 */
const FEATURES = [
  { icon: Search, title: '선수 탐색', desc: '다양한 종목의 선수를 쉽게 검색하고 비교' },
  { icon: CalendarCheck, title: '후원슬롯', desc: '선수의 후원 가능 슬롯과 노출 영역 확인' },
  { icon: FileSignature, title: '계약 · 실행', desc: '온라인 계약으로 간편하게 후원 시작' },
  { icon: ShieldCheck, title: '노출 검증', desc: '후원 노출 내용을 데이터로 증빙' },
  { icon: BarChart3, title: '성과 리포트', desc: '데이터 기반 성과 리포트로 효과를 한눈에' },
];

const AUDIENCE = [
  {
    key: 'brand', label: '브랜드 가치', icon: Building2,
    values: [
      { title: '목표에 맞는 선수 매칭', desc: '업종·예산·목표를 입력하면 적합한 선수와 후원 방식을 제안합니다.' },
      { title: '집행부터 검증까지', desc: '계약·실행·노출 검증·성과 리포트를 한 곳에서 관리합니다.' },
      { title: '성과 기준 합의', desc: '적용 상품은 계약서에 성과 기준과 보완 지원을 명시합니다.' },
    ],
  },
  {
    key: 'player', label: '선수 가치', icon: User,
    values: [
      { title: '후원 기회 확대', desc: '프로필과 슬롯을 등록하면 브랜드 제안을 받을 수 있습니다.' },
      { title: '조건을 직접 승인', desc: '모든 제안은 선수 승인 후에만 계약으로 이어집니다.' },
      { title: '활동이 자산이 되는 구조', desc: '경기 기록과 팬 활동이 후원 제안의 근거가 됩니다.' },
    ],
  },
  {
    key: 'fan', label: '팬 가치', icon: Heart,
    values: [
      { title: '응원이 기회로', desc: '투표·커뮤니티 활동이 팬온도로 쌓여 선수를 브랜드에 소개합니다.' },
      { title: '참여한 만큼 혜택', desc: '활동에 따라 팬포인트가 적립되고 팬스토어에서 사용합니다.' },
      { title: '선수와 브랜드 연결', desc: '팬이 추천한 브랜드가 실제 협업 검토로 이어집니다.' },
    ],
  },
];

export default function ServiceIntro() {
  const [cases, setCases] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [tab, setTab] = useState('brand');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trackAboutEvent({ event: 'intro_view', pageSlug: 'service', visitorKey: visitorKey() }).catch(() => null);
    Promise.all([
      api.listMatchingCases({ limit: 3, sort: 'RECOMMENDED' }).then((r) => setCases(r.data?.cases ?? [])).catch(() => null),
      api.listPartnerBrands({ limit: 8 }).then((r) => setBrands(r.data?.brands ?? [])).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  const track = (cta: string, target: string) =>
    api.trackAboutEvent({ event: 'intro_cta_click', pageSlug: 'service', visitorKey: visitorKey(), params: { cta, target } }).catch(() => null);

  const audience = AUDIENCE.find((a) => a.key === tab)!;

  return (
    <AboutShell current="서비스소개"
      hero={
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h1 className="text-[30px] sm:text-[42px] font-extrabold tracking-[-0.035em] leading-[1.15]">
              선수의 가능성에<br />브랜드를 <span className="text-emerald-600">PICK</span>하다
            </h1>
            <p className="mt-4 text-[15px] text-slate-500 leading-relaxed break-keep max-w-lg">
              원하는 선수와 후원방식을 직접 선택하거나, 목표와 예산만 입력하고 SPONPIK의 추천을 받을 수 있습니다.
              계약부터 성과 확인까지 한 번에.
            </p>
          </div>

          {/* 두 가지 시작 (§4.1 2) */}
          <div className="grid sm:grid-cols-2 gap-3 w-full lg:w-[520px]">
            <Link to="/sponsor/direct" onClick={() => track('direct_pick', '/sponsor/direct')}
              className="group rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300">
              <Target className="w-9 h-9 text-emerald-500 mb-8" />
              <p className="text-[17px] font-extrabold text-slate-900 leading-snug">
                선수·후원방식<br />직접 <span className="text-emerald-600">PICK</span>
              </p>
              <p className="mt-2 text-[12.5px] text-slate-500 leading-relaxed">
                원하는 선수와 후원방식을 직접 선택해 후원하세요.
              </p>
              <span className="mt-4 inline-flex w-8 h-8 rounded-full bg-emerald-600 text-white items-center justify-center group-hover:bg-emerald-700 transition">
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link to="/sponsor/recommended" onClick={() => track('recommended_pick', '/sponsor/recommended')}
              className="group relative rounded-3xl border border-orange-200 bg-gradient-to-b from-orange-50/70 to-white p-5 transition hover:-translate-y-0.5 hover:border-orange-300">
              <span className="absolute -top-2.5 left-5 inline-flex h-6 px-2.5 rounded-lg bg-orange-500 text-white text-[11px] font-bold items-center">추천</span>
              <Sparkles className="w-9 h-9 text-orange-400 mb-8" />
              <p className="text-[17px] font-extrabold text-slate-900 leading-snug">
                SPONPIK<br /><span className="text-orange-500">추천 PICK</span>
              </p>
              <p className="mt-2 text-[12.5px] text-slate-500 leading-relaxed">
                스폰픽이 분석한 데이터를 통해 최적의 매칭을 제안해드려요.
              </p>
              <span className="mt-4 inline-flex w-8 h-8 rounded-full bg-orange-500 text-white items-center justify-center group-hover:bg-orange-600 transition">
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      }>

      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {/* 핵심 기능 5가지 */}
        <section className="mt-14">
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-[-0.02em] mb-5">핵심 기능 5가지</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {FEATURES.map((f) => {
              const I = f.icon;
              return (
                <div key={f.title} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5">
                    <I className="w-[18px] h-[18px]" />
                  </span>
                  <p className="text-[14px] font-bold text-slate-900">{f.title}</p>
                  <p className="mt-1.5 text-[12px] text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 대상별 가치 */}
        <section className="mt-14">
          <div className="flex gap-1 border-b border-slate-200 mb-6">
            {AUDIENCE.map((a) => {
              const I = a.icon;
              const on = tab === a.key;
              return (
                <button key={a.key} onClick={() => setTab(a.key)}
                  className={`relative inline-flex items-center gap-1.5 px-4 py-3 text-[14px] font-bold transition ${
                    on ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-700'
                  }`}>
                  <I className="w-4 h-4" /> {a.label}
                  {on && <span className="absolute left-3 right-3 -bottom-px h-[2.5px] rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {audience.values.map((v) => (
              <div key={v.title} className="rounded-3xl bg-slate-50 p-5">
                <p className="text-[15px] font-bold text-slate-900">{v.title}</p>
                <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 신뢰 단서 — 대표 사례 */}
        <section className="mt-14">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-[20px] font-extrabold text-slate-900 tracking-[-0.02em]">실제 매칭 사례</h2>
              <p className="text-[13px] text-slate-400 mt-1">브랜드 목표가 실제 후원과 성과로 이어진 사례입니다.</p>
            </div>
            <Link to="/about/cases" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-0.5">
              전체보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[260px] rounded-3xl" />)}</div>
          ) : cases.length ? (
            <div className="grid sm:grid-cols-3 gap-3">
              {cases.map((c) => (
                <Link key={c.slug} to={`/about/cases/${c.slug}`}
                  className="group rounded-3xl border border-slate-200 overflow-hidden bg-white transition hover:border-slate-300">
                  <div className="aspect-[16/10] bg-slate-100 relative">
                    {c.heroImageUrl && <img src={c.heroImageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      {c.verified && <VerifiedBadge />}
                      {c.tour && <Tag tone="sky">{c.tour}</Tag>}
                    </div>
                    <p className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">
                      {c.athleteName} <span className="text-slate-300 mx-0.5">×</span> {c.brandName}
                    </p>
                    {c.highlights?.[0]?.display && (
                      <p className="mt-2.5 text-[13px] text-slate-500">
                        <span className="font-extrabold text-emerald-600 text-[15px]">{c.highlights[0].display}</span>
                        <span className="ml-1.5">{c.highlights[0].label}</span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <StateNotice kind="empty" title="공개된 매칭사례가 아직 없습니다"
              desc={'사례가 등록되고 당사자 승인이 끝나면 이곳에 표시됩니다.'} />
          )}
        </section>

        {/* 함께하는 브랜드 */}
        {brands.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-[20px] font-extrabold text-slate-900 tracking-[-0.02em]">함께하는 브랜드</h2>
              <Link to="/about/brands" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-0.5">
                전체보기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {brands.slice(0, 8).map((b) => (
                <Link key={b.slug} to={`/about/brands/${b.slug}`}
                  className="rounded-2xl border border-slate-200 bg-white h-20 flex items-center justify-center px-3 transition hover:border-slate-300">
                  {b.logoUrl
                    ? <img src={b.logoUrl} alt={b.logoAlt} className="max-h-9 max-w-full object-contain" />
                    : <span className="text-[13px] font-bold text-slate-600 text-center leading-tight">{b.name}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 공식 인스타그램 (§4.2) */}
        <section className="mt-14">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 flex items-center justify-center shrink-0">
              <Instagram className="w-6 h-6 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-slate-900">더 자세한 서비스 이야기와 최신 매칭 소식은</p>
              <p className="text-[15px] font-bold text-slate-900">공식 인스타그램에서 확인하세요</p>
            </div>
            <a href="https://www.instagram.com/sponpik_official/"
              target="_blank" rel="noopener noreferrer"
              onClick={() => api.trackAboutEvent({ event: 'instagram_click', pageSlug: 'service', visitorKey: visitorKey(), params: { placement: 'service_footer' } }).catch(() => null)}
              className="inline-flex items-center justify-center gap-1.5 h-12 px-5 rounded-2xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 transition shrink-0">
              공식 인스타그램 보기 <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 최종 CTA */}
        <section className="mt-10">
          <div className="rounded-[28px] bg-slate-900 px-6 sm:px-10 py-10 text-center">
            <h2 className="text-[24px] sm:text-[30px] font-extrabold text-white tracking-[-0.02em]">
              내게 맞는 후원을 시작하세요
            </h2>
            <p className="mt-3 text-[14px] text-white/60">
              비회원도 선수와 후원상품을 자유롭게 둘러볼 수 있습니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <Link to="/about/how-it-works" onClick={() => track('how_it_works', '/about/how-it-works')}
                className="h-12 px-6 rounded-2xl bg-white text-slate-900 text-[15px] font-bold inline-flex items-center hover:bg-slate-100 transition">
                이용방법 보기
              </Link>
              <Link to="/sponsor/available" onClick={() => track('available', '/sponsor/available')}
                className="h-12 px-6 rounded-2xl bg-emerald-600 text-white text-[15px] font-bold inline-flex items-center gap-1.5 hover:bg-emerald-700 transition">
                지금 가능한 후원 보기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AboutShell>
  );
}
