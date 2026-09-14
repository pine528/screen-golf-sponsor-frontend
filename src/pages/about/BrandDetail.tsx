/**
 * IU11 브랜드 상세 (핸드오프 v1.0 §10.2)
 * 사례가 없으면 협업 분야만 보여준다. 로고 권리가 만료되면 텍스트로 대체한다.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Users, FileText, Store, ShieldCheck,
  MessageSquare, ArrowRight, Instagram,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, VerifiedBadge, StateNotice, Skeleton, visitorKey } from '../../components/about/AboutShell';

export default function BrandDetail() {
  const { slug = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getPartnerBrand(slug)
      .then((r) => {
        setData(r.data);
        api.trackAboutEvent({
          event: 'brand_view', pageSlug: 'brand-detail', visitorKey: visitorKey(),
          params: { brand: slug, category: r.data?.category },
        }).catch(() => null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <AboutShell current="함께하는 브랜드">
        <div className="max-w-[1280px] mx-auto px-5 py-10 space-y-4">
          <Skeleton className="h-[200px] rounded-3xl" /><Skeleton className="h-[300px] rounded-3xl" />
        </div>
      </AboutShell>
    );
  }
  if (!data) {
    return (
      <AboutShell current="함께하는 브랜드">
        <div className="max-w-2xl mx-auto px-5 py-20">
          <StateNotice kind="error" title="브랜드를 찾을 수 없습니다"
            action={<Link to="/about/brands" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">목록으로</Link>} />
        </div>
      </AboutShell>
    );
  }

  return (
    <AboutShell current="함께하는 브랜드">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        <Link to="/about/brands" className="inline-flex items-center gap-1 mt-6 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> 함께하는 브랜드
        </Link>

        {/* 헤더 */}
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-[280px] shrink-0 flex items-center justify-center rounded-3xl bg-slate-50 p-8 min-h-[140px]">
              {data.logoUrl
                ? <img src={data.logoUrl} alt={data.logoAlt} className="max-h-20 max-w-full object-contain" />
                : (
                  <div className="text-center">
                    <p className="text-[22px] font-extrabold text-slate-800">{data.name}</p>
                    {data.logoBlocked && (
                      <p className="mt-2 text-[12px] text-slate-500">로고 사용권 확인 중</p>
                    )}
                  </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h1 className="text-[26px] font-extrabold text-slate-900 tracking-[-0.02em]">{data.name}</h1>
                <Tag>{data.category}</Tag>
                <Tag tone={data.status === 'ACTIVE_PARTNER' ? 'emerald' : 'slate'}>
                  <ShieldCheck className="w-3 h-3" /> {data.statusLabel}
                </Tag>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                {data.website && (
                  <a href={data.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600 hover:underline">
                    {data.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {data.instagram && (
                  <a href={data.instagram} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800">
                    <Instagram className="w-3.5 h-3.5" /> 인스타그램
                  </a>
                )}
              </div>

              {data.description && (
                <p className="text-[14px] text-slate-600 leading-[1.8] whitespace-pre-line">{data.description}</p>
              )}
            </div>

            <div className="lg:w-[220px] shrink-0 flex flex-col gap-2">
              <Link to="/contact"
                className="h-12 rounded-2xl bg-slate-900 text-white text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition">
                <MessageSquare className="w-4 h-4" /> 협업 문의
              </Link>
              <Link to={`/about/cases?brand=${data.slug}`}
                className="h-12 rounded-2xl border border-slate-200 text-slate-700 text-[14px] font-bold flex items-center justify-center gap-1.5 hover:border-slate-400 transition">
                매칭사례 전체 <ArrowRight className="w-4 h-4" />
              </Link>
              {data.storeUrl && (
                <a href={data.storeUrl} target="_blank" rel="noopener noreferrer"
                  className="h-12 rounded-2xl border border-emerald-200 text-emerald-700 text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition">
                  <Store className="w-4 h-4" /> 팬스토어
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="mt-4 grid lg:grid-cols-3 gap-4">
          {/* 함께한 선수 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="inline-flex items-center gap-1.5 text-[15px] font-extrabold text-slate-900 mb-4">
              <Users className="w-4 h-4 text-slate-500" /> 함께한 선수
            </h2>
            {data.athletes?.length ? (
              <div className="space-y-2">
                {data.athletes.map((a: any, i: number) => (
                  <div key={a.id ?? i} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="w-9 h-9 rounded-full bg-white text-slate-500 text-[13px] font-bold flex items-center justify-center shrink-0">
                      {(a.name ?? '?').slice(0, 1)}
                    </span>
                    <span className="text-[14px] font-bold text-slate-800 truncate flex-1">{a.name}</span>
                    {a.id && (
                      <Link to={`/athletes/${a.id}`} className="text-[12px] font-bold text-slate-500 hover:text-slate-900 shrink-0">
                        프로필
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-slate-500 py-4">공개된 협업 선수 정보가 없습니다.</p>
            )}
          </section>

          {/* 협업 사례 */}
          <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="inline-flex items-center gap-1.5 text-[15px] font-extrabold text-slate-900 mb-4">
              <FileText className="w-4 h-4 text-slate-500" /> 협업 사례
            </h2>
            {data.cases?.length ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {data.cases.map((c: any) => (
                  <Link key={c.slug} to={`/about/cases/${c.slug}`}
                    className="rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition">
                    <div className="aspect-[16/9] bg-slate-100">
                      {c.heroImageUrl && <img src={c.heroImageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <p className="text-[14px] font-bold text-slate-900 truncate">{c.athleteName}</p>
                        {c.verified && <VerifiedBadge label="" />}
                      </div>
                      {c.tour && <p className="text-[12.5px] text-slate-500">{c.tour}</p>}
                      {c.highlights?.filter((h: any) => !h.restricted).slice(0, 2).map((h: any) => (
                        <p key={h.id} className="mt-2 text-[12.5px] text-slate-500">
                          <span className="font-extrabold text-emerald-600">{h.display}</span>
                          <span className="ml-1.5">{h.label}</span>
                        </p>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <StateNotice kind="empty" title="공개된 협업 사례가 없습니다"
                desc={'사례가 등록되고 당사자 승인이 끝나면 이곳에 표시됩니다.'} />
            )}
          </section>
        </div>

        <p className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-[12px] text-slate-500 leading-relaxed inline-flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          {data.notice}
        </p>
      </div>
    </AboutShell>
  );
}
