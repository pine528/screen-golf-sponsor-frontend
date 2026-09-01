/**
 * IU02 매칭사례 목록 (핸드오프 v1.0 §5.1)
 * 필터: 종목·투어·후원방식·업종. 카드에는 대표 성과 1~2개와 검증 상태만 노출한다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, RotateCcw, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { VerifiedBadge, StateNotice, Skeleton, visitorKey } from '../../components/about/AboutShell';

const FILTER_KEYS = [
  { key: 'sport', label: '종목' },
  { key: 'tour', label: '투어' },
  { key: 'sponsorType', label: '후원방식' },
  { key: 'category', label: '업종' },
] as const;

export default function CaseList() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('RECOMMENDED');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.listMatchingCases({ ...filters, sort, limit: 12 })
      .then((r) => {
        setData(r.data);
        api.trackAboutEvent({
          event: 'case_filter_apply', pageSlug: 'cases', visitorKey: visitorKey(),
          params: { filters, resultCount: r.data?.total ?? 0 },
        }).catch(() => null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [filters, sort]);

  useEffect(() => {
    api.trackAboutEvent({ event: 'intro_view', pageSlug: 'cases', visitorKey: visitorKey() }).catch(() => null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k: string, v: string) =>
    setFilters((f) => (f[k] === v ? { ...f, [k]: '' } : { ...f, [k]: v }));
  const activeCount = Object.values(filters).filter(Boolean).length;

  const FilterRow = () => (
    <div className="space-y-4">
      {FILTER_KEYS.map((f) => {
        const options = data?.facets?.[f.key] ?? [];
        if (!options.length) return null;
        return (
          <div key={f.key}>
            <p className="text-[12px] font-bold text-slate-400 mb-2">{f.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {options.map((o: any) => (
                <button key={o.code} onClick={() => setFilter(f.key, o.code)}
                  className={`h-8 px-3 rounded-full text-[12.5px] font-semibold border transition ${
                    filters[f.key] === o.code
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}>
                  {o.label} <span className="opacity-60 tabular-nums">{o.count}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <AboutShell current="매칭사례" title="매칭사례"
      desc="브랜드 목표가 실제 후원과 성과로 이어진 사례">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {/* 데스크톱 필터 */}
        <div className="mt-8 hidden lg:block rounded-3xl border border-slate-200 bg-white p-5">
          <FilterRow />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <button onClick={() => setFilters({})}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-500 hover:border-slate-300">
              <RotateCcw className="w-3.5 h-3.5" /> 조건 초기화
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 focus:outline-none focus:border-slate-400">
              {(data?.sorts ?? []).map((s: any) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* 모바일 필터 트리거 (§14.2) */}
        <div className="mt-6 lg:hidden flex items-center gap-2">
          <button onClick={() => setSheet(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700">
            <SlidersHorizontal className="w-4 h-4" /> 필터
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] items-center justify-center">{activeCount}</span>
            )}
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 focus:outline-none">
            {(data?.sorts ?? []).map((s: any) => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
          <span className="ml-auto text-[13px] text-slate-400 tabular-nums">
            {loading ? '' : `${data?.total ?? 0}건`}
          </span>
        </div>

        {/* 목록 */}
        <div className="mt-6">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[380px] rounded-3xl" />)}
            </div>
          ) : data?.cases?.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.cases.map((c: any) => (
                <article key={c.slug} className="rounded-3xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                  <div className="grid grid-cols-2 h-[150px]">
                    <div className="bg-slate-100">
                      {c.heroImageUrl && <img src={c.heroImageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="bg-slate-50 flex items-center justify-center p-4">
                      {c.brandLogoUrl
                        ? <img src={c.brandLogoUrl} alt={`${c.brandName} 로고`} className="max-h-12 max-w-full object-contain" />
                        : <span className="text-[14px] font-bold text-slate-600 text-center">{c.brandName}</span>}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-[16px] font-extrabold text-slate-900 truncate">
                        {c.athleteName} <span className="text-slate-300 mx-0.5">×</span> {c.brandName}
                      </p>
                      {c.verified && <VerifiedBadge label="" />}
                    </div>

                    <dl className="space-y-2 text-[12.5px] mb-4">
                      {c.summary && (
                        <div className="flex gap-2.5">
                          <dt className="text-slate-400 w-14 shrink-0">목표</dt>
                          <dd className="text-slate-700 line-clamp-2">{c.summary}</dd>
                        </div>
                      )}
                      {c.sponsorTypes?.length > 0 && (
                        <div className="flex gap-2.5">
                          <dt className="text-slate-400 w-14 shrink-0">후원방식</dt>
                          <dd className="text-slate-700">{c.sponsorTypes.join(' · ')}</dd>
                        </div>
                      )}
                      {(c.periodFrom || c.periodTo) && (
                        <div className="flex gap-2.5">
                          <dt className="text-slate-400 w-14 shrink-0">후원기간</dt>
                          <dd className="text-slate-700 tabular-nums">
                            {c.periodFrom ? new Date(c.periodFrom).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' }) : ''}
                            {c.periodTo ? ` ~ ${new Date(c.periodTo).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' })}` : ''}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {/* 대표 성과 — 값을 볼 수 없으면 사유를 그대로 쓴다 */}
                    {c.highlights?.length > 0 && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 mb-4">
                        {c.highlights.slice(0, 1).map((h: any) => (
                          <div key={h.id} className="flex items-center gap-2.5">
                            <span className="text-[11px] font-bold text-slate-400 shrink-0">검증 성과</span>
                            {h.restricted ? (
                              <span className="text-[12.5px] text-slate-400">{h.restrictedReason}</span>
                            ) : (
                              <>
                                <span className="text-[19px] font-extrabold text-emerald-600 tabular-nums">{h.display}</span>
                                <span className="text-[12px] text-slate-500 truncate">{h.label}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <Link to={`/about/cases/${c.slug}`}
                        className="h-11 rounded-2xl border border-slate-200 text-[13.5px] font-bold text-slate-700 flex items-center justify-center hover:border-slate-400 transition">
                        사례 보기
                      </Link>
                      <Link to="/sponsor/recommended"
                        className="h-11 rounded-2xl bg-emerald-600 text-white text-[13.5px] font-bold flex items-center justify-center hover:bg-emerald-700 transition">
                        비슷한 후원 시작
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <StateNotice kind="empty"
              title={data?.emptyGuide?.title ?? '선택한 조건에 맞는 사례가 없습니다.'}
              desc={data?.emptyGuide?.desc}
              action={
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setFilters({})}
                    className="h-10 px-4 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-600">
                    조건 초기화
                  </button>
                  <Link to="/sponsor/recommended"
                    className="h-10 px-4 rounded-2xl bg-slate-900 text-white text-[13px] font-bold inline-flex items-center gap-1.5">
                    추천 PICK 받기 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              } />
          )}
        </div>
      </div>

      {/* 모바일 bottom sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end bg-slate-900/40" onClick={() => setSheet(false)}>
          <div className="w-full max-h-[80vh] overflow-y-auto rounded-t-[28px] bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[17px] font-extrabold text-slate-900 inline-flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" /> 필터
              </h2>
              <button onClick={() => setSheet(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <FilterRow />
            <div className="sticky bottom-0 bg-white pt-4 mt-6 flex gap-2">
              <button onClick={() => setFilters({})}
                className="h-12 px-5 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600">
                초기화
              </button>
              <button onClick={() => setSheet(false)}
                className="flex-1 h-12 rounded-2xl bg-slate-900 text-white text-[14px] font-bold">
                {loading ? '조회 중…' : `결과 ${data?.total ?? 0}건 보기`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AboutShell>
  );
}
