/**
 * IU10 함께하는 브랜드 목록 (핸드오프 v1.0 §10.1)
 * 로고는 alt 를 반드시 넣고, 권리가 만료된 로고는 텍스트로 대체한다 (§10.4 · §17.1).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Store, FileText, Handshake } from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, nf, visitorKey } from '../../components/about/AboutShell';

export default function BrandList() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [hasStore, setHasStore] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.listPartnerBrands({
      q: q || undefined, category: category || undefined,
      hasStore: hasStore || undefined, page, limit: 12,
    })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [q, category, hasStore, page]);

  useEffect(() => {
    api.trackAboutEvent({ event: 'intro_view', pageSlug: 'brands', visitorKey: visitorKey() }).catch(() => null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <AboutShell current="함께하는 브랜드"
      hero={
        <div>
          <h1 className="text-[28px] sm:text-[38px] font-extrabold tracking-[-0.03em] leading-tight">
            선수와 함께 성장하는 브랜드
          </h1>
          <p className="mt-3 text-[14px] text-slate-500 leading-relaxed break-keep max-w-xl">
            스폰픽과 함께하는 브랜드는 선수의 가치와 팬의 열정을 연결합니다.
            신뢰할 수 있는 파트너십으로 지속 가능한 성장을 만들어갑니다.
          </p>
        </div>
      }>

      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {/* 필터 */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-300" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="브랜드 검색"
              className="w-full h-11 pl-10 pr-3 rounded-2xl border border-slate-200 text-[14px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
          </div>
          <label className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-500">업종</span>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="h-11 px-3 rounded-2xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-slate-400">
              <option value="">전체</option>
              {(data?.categories ?? []).map((c: any) => (
                <option key={c.code} value={c.code}>{c.label} ({c.count})</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-500">팬스토어</span>
            <select value={hasStore} onChange={(e) => { setHasStore(e.target.value); setPage(1); }}
              className="h-11 px-3 rounded-2xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-slate-400">
              <option value="">전체</option>
              <option value="true">보유</option>
            </select>
          </label>
        </div>

        {/* 목록 */}
        <div className="mt-6">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-[190px] rounded-3xl" />)}
            </div>
          ) : data?.brands?.length ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.brands.map((b: any) => (
                  <article key={b.slug} className="rounded-3xl border border-slate-200 bg-white p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="h-12 flex items-center">
                        {b.logoUrl
                          ? <img src={b.logoUrl} alt={b.logoAlt} className="max-h-11 max-w-[150px] object-contain" />
                          : <span className="text-[16px] font-extrabold text-slate-800">{b.name}</span>}
                      </div>
                      <Tag tone={b.status === 'ACTIVE_PARTNER' ? 'emerald' : 'slate'}>{b.statusLabel}</Tag>
                    </div>

                    <p className="text-[12.5px] text-slate-500 mb-1.5">{b.category}</p>
                    <p className="text-[12.5px] text-slate-500">
                      선수 <b className="text-slate-800 tabular-nums">{nf(b.athletes)}</b>명
                      <span className="text-slate-300 mx-1.5">·</span>
                      프로젝트 <b className="text-slate-800 tabular-nums">{nf(b.projects)}</b>건
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-slate-500">
                        <FileText className="w-3 h-3" /> 매칭사례
                      </span>
                      {b.hasStore && (
                        <span className="inline-flex items-center gap-1 text-[12.5px] text-slate-500">
                          <Store className="w-3 h-3" /> 팬스토어
                        </span>
                      )}
                      <Link to={`/about/brands/${b.slug}`}
                        onClick={() => api.trackAboutEvent({ event: 'brand_view', pageSlug: 'brands', visitorKey: visitorKey(), params: { brand: b.slug } }).catch(() => null)}
                        className="ml-auto inline-flex items-center gap-0.5 h-8 px-3 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400 transition">
                        브랜드 상세 <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-[13px] text-slate-500 tabular-nums">전체 {nf(data.total)}개 브랜드</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                      className="h-9 px-3.5 rounded-xl border border-slate-200 text-[13px] font-semibold disabled:opacity-40">이전</button>
                    <span className="text-[13px] text-slate-500 tabular-nums px-1">{page} / {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                      className="h-9 px-3.5 rounded-xl border border-slate-200 text-[13px] font-semibold disabled:opacity-40">다음</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <StateNotice kind="empty" title="조건에 맞는 브랜드가 없습니다"
              desc={'검색어나 업종 필터를 조정해보세요.'} />
          )}
        </div>

        {/* CTA */}
        <section className="mt-12 rounded-[28px] bg-slate-900 px-6 sm:px-10 py-10 text-center">
          <Handshake className="w-9 h-9 text-white/70 mx-auto mb-4" />
          <h2 className="text-[22px] sm:text-[28px] font-extrabold text-white tracking-[-0.02em]">
            브랜드로 함께하시겠어요?
          </h2>
          <p className="mt-3 text-[14px] text-white/60">
            선수의 가치와 팬의 열정을 브랜드 성장으로 연결해드립니다.
          </p>
          <Link to="/contact"
            className="mt-6 inline-flex h-12 px-6 rounded-2xl bg-white text-slate-900 text-[15px] font-bold items-center gap-1.5 hover:bg-slate-100 transition">
            협업 문의 <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </AboutShell>
  );
}
