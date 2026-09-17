/**
 * IU11 브랜드 상세 `/about/brands/:slug` — 시안 2026-09-17 (리디자인/10 · 44)
 *
 *  헤더(로고 · 업종 · 활동 파트너 · 홈페이지 · 소개 · 협업 문의 / 비슷한 브랜드 사례)
 *  → 함께한 선수(사진 · 종목 · 협업 유형 · 프로필) · 협업 사례 주요 성과(검증 완료 지표 · 협업 기간) · 현재 이용 가능한 상품(팬스토어)
 *  → 후원 방식 칩 · 함께 만든 상품(팬스토어 상품) · 관련 매칭 사례 · 브랜드 담당자 한마디 · 검증 고지
 *  사례가 없으면 협업 분야만 보여준다. 로고 권리가 만료되면 텍스트로 대체한다.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Users, FileText, Store, ShieldCheck, MessageSquare, ArrowRight, Instagram, ChevronRight, Trophy, ShoppingBag,
  Gift, Quote, Shirt, CheckCircle2, BarChart3,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, visitorKey, ym, nf } from '../../components/about/AboutShell';

export default function BrandDetail() {
  const { slug = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getPartnerBrand(slug)
      .then((r) => { setData(r.data); api.trackAboutEvent({ event: 'brand_view', pageSlug: 'brand-detail', visitorKey: visitorKey(), params: { brand: slug, category: r.data?.category } }).catch(() => null); })
      .catch(() => setData(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <AboutShell current="brands"><div className="max-w-[1280px] mx-auto px-5 py-10 space-y-4"><Skeleton className="h-[220px] rounded-3xl" /><Skeleton className="h-[300px] rounded-3xl" /></div></AboutShell>;
  }
  if (!data) {
    return <AboutShell current="brands"><div className="max-w-2xl mx-auto px-5 py-20"><StateNotice kind="error" title="브랜드를 찾을 수 없습니다" action={<Link to="/about/brands" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">목록으로</Link>} /></div></AboutShell>;
  }

  const highlights: any[] = (data.cases ?? []).flatMap((c: any) => (c.highlights ?? []).filter((h: any) => !h.restricted).map((h: any) => ({ ...h, caseSlug: c.slug, athleteName: c.athleteName }))).slice(0, 3);
  const products: any[] = (data.stores ?? []).flatMap((s: any) => s.products.map((p: any) => ({ ...p, storeSlug: s.slug })));
  const featuredProduct = products[0];
  const Sub = ({ icon: I, title, right }: { icon: any; title: string; right?: any }) => (
    <div className="flex items-center justify-between gap-2 mb-3"><h2 className="inline-flex items-center gap-1.5 text-[15px] font-extrabold text-slate-900"><I className="w-4 h-4 text-slate-500" /> {title}</h2>{right}</div>
  );

  return (
    <AboutShell current="brands" crumb={[{ label: '함께하는 브랜드', to: '/about/brands' }, { label: data.name }]}>
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        <Link to="/about/brands" className="inline-flex items-center gap-1 mt-5 text-[13px] font-semibold text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> 함께하는 브랜드</Link>

        {/* 헤더 */}
        <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_220px] gap-6 items-center">
          <div className="flex items-center justify-center rounded-3xl bg-slate-50 p-8 min-h-[160px]">
            {data.logoUrl ? <img src={data.logoUrl} alt={data.logoAlt} className="max-h-24 max-w-full object-contain" /> : (
              <div className="text-center"><p className="text-[24px] font-extrabold text-slate-800">{data.name}</p>{data.logoBlocked && <p className="mt-2 text-[12px] text-slate-500">로고 사용권 확인 중</p>}</div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold text-slate-900 tracking-[-0.02em]">{data.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2"><Tag>{data.category}</Tag><Tag tone={data.status === 'ACTIVE_PARTNER' ? 'emerald' : 'slate'}><ShieldCheck className="w-3 h-3" /> {data.statusLabel}</Tag>{data.partnerSince && <span className="text-[12px] text-slate-500">협업 {ym(data.partnerSince)} ~</span>}</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {data.website && <a href={data.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 hover:underline">{data.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3.5 h-3.5" /></a>}
              {data.instagram && <a href={data.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800"><Instagram className="w-3.5 h-3.5" /> 인스타그램</a>}
            </div>
            <p className="mt-3 text-[14px] text-slate-600 leading-[1.8] whitespace-pre-line break-keep">{data.description || '브랜드 소개가 등록되면 이곳에 표시됩니다.'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/contact" className="h-12 rounded-xl bg-emerald-800 text-white text-[14px] font-extrabold flex items-center justify-center gap-1.5 hover:bg-emerald-900 transition"><MessageSquare className="w-4 h-4" /> 협업 문의</Link>
            <Link to={`/about/cases?category=${encodeURIComponent(data.category)}`} className="h-12 rounded-xl border border-slate-200 text-slate-700 text-[14px] font-bold flex items-center justify-center gap-1 hover:border-slate-400 transition">비슷한 브랜드 사례 <ChevronRight className="w-4 h-4" /></Link>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 함께한 선수 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <Sub icon={Users} title="함께한 선수" right={<span className="text-[12px] text-slate-500 tabular-nums">{nf(data.stats?.athletes ?? data.athletes?.length ?? 0)}명</span>} />
            {data.athletes?.length ? (
              <div className="space-y-3">
                {data.athletes.slice(0, 3).map((a: any, i: number) => (
                  <div key={a.id ?? i} className="flex gap-3.5">
                    <div className="w-[88px] h-[104px] rounded-2xl bg-slate-100 overflow-hidden shrink-0">{a.profileImageUrl ? <img src={a.profileImageUrl} alt={a.name} className="w-full h-full object-cover object-top" /> : <span className="w-full h-full flex items-center justify-center text-[22px] font-extrabold text-slate-400">{(a.name ?? '?').slice(0, 1)}</span>}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-extrabold inline-flex items-center gap-1">{a.name} 프로 <ShieldCheck className="w-4 h-4 text-emerald-500" /></p>
                      <dl className="mt-1.5 text-[12.5px] space-y-1">
                        <div className="flex gap-3"><dt className="text-slate-500 w-14 shrink-0">종목</dt><dd className="text-slate-700">{a.sportType && a.sportType !== 'GOLF' ? a.sportType : '골프'}{a.tour ? ` · ${a.tour}` : ''}</dd></div>
                        <div className="flex gap-3"><dt className="text-slate-500 w-14 shrink-0">협업 유형</dt><dd className="text-slate-700">{a.sponsorTypes?.length ? a.sponsorTypes.join(' · ') : '선수 후원'}</dd></div>
                      </dl>
                      {a.id && <Link to={`/athletes/${a.id}`} className="mt-2 inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 hover:border-slate-400">선수 프로필 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>}
                    </div>
                  </div>
                ))}
                {data.athletes.length > 3 && <p className="text-[12px] text-slate-500">외 {data.athletes.length - 3}명</p>}
              </div>
            ) : <p className="text-[13px] text-slate-500 py-4">공개된 협업 선수 정보가 없습니다.</p>}
          </section>

          {/* 협업 사례 주요 성과 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <Sub icon={FileText} title="협업 사례" right={data.stats?.verified > 0 ? <Tag tone="emerald"><CheckCircle2 className="w-3 h-3" /> 검증 완료 {data.stats.verified}건</Tag> : undefined} />
            {highlights.length ? (
              <>
                <p className="text-[12.5px] text-slate-600 mb-2">주요 성과 (검증 완료)</p>
                <div className="grid grid-cols-1 gap-2">
                  {highlights.map((h) => (
                    <Link key={h.id} to={`/about/cases/${h.caseSlug}`} className="rounded-2xl border border-slate-200 p-3 flex items-center gap-3 hover:border-emerald-300">
                      <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Trophy className="w-4 h-4" /></span>
                      <span className="min-w-0"><span className={`block font-extrabold text-slate-900 tabular-nums break-keep ${h.qualitative ? 'text-[13px]' : 'text-[17px]'}`}>{h.display}</span><span className="block text-[11.5px] text-slate-500 truncate">{h.label} · {h.athleteName}</span></span>
                    </Link>
                  ))}
                </div>
              </>
            ) : data.cases?.length ? (
              <p className="text-[13px] text-slate-500 py-4 break-keep">공개된 성과 지표는 없고, 사례 {data.cases.length}건이 게시되어 있습니다.</p>
            ) : (
              <StateNotice kind="empty" title="공개된 협업 사례가 없습니다" desc={'사례가 등록되고 당사자 승인이 끝나면 이곳에 표시됩니다.'} />
            )}
            {data.partnerSince && <p className="mt-4 text-[12.5px] text-slate-600"><span className="text-slate-500">협업 기간</span> <b>{ym(data.partnerSince)} ~ 현재</b></p>}
          </section>

          {/* 현재 이용 가능한 상품 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <Sub icon={ShoppingBag} title="현재 이용 가능한 상품" />
            {featuredProduct ? (
              <div className="rounded-2xl border border-slate-200 p-3 flex gap-3">
                <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300">{featuredProduct.imageUrl ? <img src={featuredProduct.imageUrl} alt={featuredProduct.name} className="w-full h-full object-cover" /> : <Store className="w-7 h-7" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold truncate">{featuredProduct.name}</p>
                  <p className="text-[12px] text-slate-500 line-clamp-2 break-keep">{featuredProduct.description}</p>
                  <p className="mt-1.5 text-[14px] font-black tabular-nums">{nf(featuredProduct.price)}원</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold"><CheckCircle2 className="w-3 h-3" /> 구매 가능</span>
                </div>
              </div>
            ) : <p className="text-[13px] text-slate-500 py-4 break-keep">팬스토어에 등록된 상품이 없습니다.</p>}
            {featuredProduct && <Link to={`/fan/store/product/${featuredProduct.id}`} className="mt-3 h-10 w-full rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-700 inline-flex items-center justify-center gap-1 hover:border-slate-400">상품 자세히 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>}
          </section>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 후원 방식 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <Sub icon={Shirt} title="후원 방식" />
            {data.sponsorTypes?.length ? <div className="flex flex-wrap gap-2">{data.sponsorTypes.map((t: string) => <span key={t} className="h-9 px-3 rounded-lg border border-emerald-200 bg-emerald-50/60 text-[13px] font-bold text-emerald-800 inline-flex items-center">{t}</span>)}</div>
              : <p className="text-[13px] text-slate-500 py-2">게시된 사례의 후원 방식이 이곳에 표시됩니다.</p>}
          </section>

          {/* 함께 만든 상품 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <Sub icon={Gift} title="함께 만든 상품" right={data.storeUrl ? <Link to={data.storeUrl} className="text-[12px] font-bold text-slate-500 hover:text-slate-900">팬스토어</Link> : undefined} />
            {products.length ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {products.slice(0, 3).map((p) => (
                    <Link key={p.id} to={`/fan/store/product/${p.id}`} className="group">
                      <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition" /> : <ShoppingBag className="w-6 h-6" />}</div>
                      <p className="mt-1.5 text-[11.5px] font-bold text-slate-700 truncate">{p.name}</p>
                    </Link>
                  ))}
                </div>
                {data.storeUrl && <Link to={data.storeUrl} className="mt-3 h-10 w-full rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-700 inline-flex items-center justify-center gap-1 hover:border-slate-400">상품 전체 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>}
              </>
            ) : <p className="text-[13px] text-slate-500 py-2 break-keep">협업 상품이 팬스토어에 등록되면 이곳에 표시됩니다.</p>}
          </section>

          {/* 관련 매칭 사례 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <Sub icon={BarChart3} title="관련 매칭 사례" right={data.cases?.length > 0 ? <Link to={`/about/cases?brand=${data.slug}`} className="text-[12px] font-bold text-slate-500 hover:text-slate-900">전체 보기</Link> : undefined} />
            {data.cases?.length ? (
              <div className="space-y-2">
                {data.cases.slice(0, 3).map((c: any) => (
                  <Link key={c.slug} to={`/about/cases/${c.slug}`} className="rounded-2xl border border-slate-200 p-3 flex items-center gap-3 hover:border-emerald-300">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">{c.heroImageUrl && <img src={c.heroImageUrl} alt="" className="w-full h-full object-cover object-top" />}</div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10.5px] font-bold text-slate-600">{data.category}</span>
                      <p className="mt-0.5 text-[13.5px] font-extrabold truncate">{c.athleteName} 프로 × {data.name}</p>
                      <p className="text-[11.5px] text-slate-500 truncate">{[c.tour, c.sponsorTypes?.join(' · ')].filter(Boolean).join(' · ')}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : <p className="text-[13px] text-slate-500 py-2">공개된 사례가 아직 없습니다.</p>}
          </section>
        </div>

        {/* 담당자 한마디 + 검증 고지 */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
          {data.quote ? (
            <blockquote className="rounded-3xl border border-slate-200 bg-white p-6 relative">
              <Quote className="absolute left-5 top-5 w-5 h-5 text-emerald-200" />
              <p className="pl-7 text-[14px] font-extrabold text-slate-900">브랜드 담당자 한마디</p>
              <p className="pl-7 mt-2 text-[14px] text-slate-700 leading-[1.8] break-keep">{data.quote.content}</p>
              <footer className="pl-7 mt-3 text-[12.5px] text-slate-500">{data.quote.authorName}{data.quote.authorRole ? ` · ${data.quote.authorRole}` : ''}</footer>
            </blockquote>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-[13px] text-slate-500 break-keep">브랜드 담당자의 승인된 코멘트가 등록되면 이곳에 표시됩니다.</div>
          )}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 flex items-start gap-3 self-start">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-[13px] text-slate-600 leading-relaxed break-keep">{data.notice}</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/sponsor/recommended" className="h-12 px-8 rounded-xl bg-emerald-700 text-white text-[14.5px] font-extrabold inline-flex items-center gap-1.5 hover:bg-emerald-800">이 브랜드처럼 시작하기 <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </AboutShell>
  );
}
