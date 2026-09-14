/**
 * IU03 매칭사례 상세 + IU04 성과 근거 레이어 (핸드오프 v1.0 §5.2 · §5.3)
 * 성과 수치는 측정기간·출처·검증상태와 함께 표시하고, 볼 수 없는 값은 사유를 밝힌다.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {ArrowLeft, Sparkles, Target, X, ShieldCheck, Lock, ExternalLink, Calendar, Database, Info, ArrowRight} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, VerifiedBadge, StateNotice, Skeleton, visitorKey } from '../../components/about/AboutShell';

/* 성과 근거 레이어 (IU04) */
function EvidenceLayer({ metricId, onClose }: { metricId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMetricEvidence(metricId)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [metricId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-full overflow-y-auto rounded-[28px] bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold text-slate-900">성과 근거 상세</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
        ) : !data ? (
          <div className="p-6"><StateNotice kind="error" title="근거를 불러오지 못했습니다" /></div>
        ) : data.restricted ? (
          <div className="p-6">
            <StateNotice kind="restricted" title="이 지표는 공개 범위 밖입니다" desc={data.reason} />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-500">성과 지표</p>
                <p className="text-[16px] font-bold text-slate-900">{data.metric.label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[26px] font-extrabold text-emerald-600 tabular-nums leading-none">{data.metric.display}</p>
                <p className="mt-1.5">
                  <Tag tone={data.verification.status === 'FINAL' ? 'emerald' : 'sky'}>
                    {data.verification.status === 'FINAL' ? '최종 검증' : data.verification.status === 'VERIFIED' ? '검증 완료' : '수집 값'}
                  </Tag>
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                { icon: Info, label: '성과 정의', value: data.definition ?? '정의가 등록되지 않았습니다' },
                { icon: Calendar, label: '측정 기간', value: data.period.start && data.period.end
                  ? `${new Date(data.period.start).toLocaleDateString('ko-KR')} – ${new Date(data.period.end).toLocaleDateString('ko-KR')}`
                  : '기간 정보 없음' },
                { icon: Database, label: '데이터 출처', value: data.source.name ?? '출처 미등록' },
                { icon: ShieldCheck, label: '마지막 검증일', value: data.verification.verifiedAt
                  ? new Date(data.verification.verifiedAt).toLocaleDateString('ko-KR')
                  : '검증 기록 없음' },
              ].map((r) => {
                const I = r.icon;
                return (
                  <div key={r.label} className="rounded-2xl border border-slate-200 p-4">
                    <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500 mb-1.5">
                      <I className="w-3.5 h-3.5 text-slate-500" /> {r.label}
                    </p>
                    <p className="text-[13px] text-slate-700 leading-relaxed">{r.value}</p>
                  </div>
                );
              })}
            </div>

            {data.aggregationNote && (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[12px] font-bold text-slate-500 mb-1.5">집계 기준</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{data.aggregationNote}</p>
              </div>
            )}

            <div className="rounded-2xl bg-emerald-50 px-4 py-3.5 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-emerald-800 leading-relaxed">{data.notice}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {data.rawReportUri ? (
                <a href={data.rawReportUri} target="_blank" rel="noopener noreferrer"
                  className="h-12 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-slate-400">
                  원본 리포트 보기 <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="h-12 rounded-2xl bg-slate-50 text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4" /> {data.rawReportNotice}
                </div>
              )}
              <button onClick={onClose}
                className="h-12 rounded-2xl bg-slate-900 text-white text-[14px] font-bold hover:bg-slate-800 transition">
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const { slug = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getMatchingCase(slug)
      .then((r) => {
        setData(r.data);
        api.trackAboutEvent({
          event: 'case_view', pageSlug: 'case-detail', visitorKey: visitorKey(),
          params: { caseId: r.data?.id },
        }).catch(() => null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const openEvidence = (m: any) => {
    if (m.restricted) return;
    setEvidenceId(m.id);
    api.trackAboutEvent({
      event: 'evidence_open', pageSlug: 'case-detail', visitorKey: visitorKey(),
      params: { metricCode: m.metricCode, visibility: m.visibility },
    }).catch(() => null);
  };

  if (loading) {
    return (
      <AboutShell current="매칭사례">
        <div className="max-w-[1280px] mx-auto px-5 py-10 space-y-4">
          <Skeleton className="h-[220px] rounded-3xl" /><Skeleton className="h-[300px] rounded-3xl" />
        </div>
      </AboutShell>
    );
  }
  if (!data) {
    return (
      <AboutShell current="매칭사례">
        <div className="max-w-2xl mx-auto px-5 py-20">
          <StateNotice kind="error" title="사례를 찾을 수 없습니다"
            action={<Link to="/about/cases" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">목록으로</Link>} />
        </div>
      </AboutShell>
    );
  }

  const execution = (data.execution as any[]) ?? [];
  const timeline = (data.timeline as any[]) ?? [];

  return (
    <AboutShell current="매칭사례">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        <Link to="/about/cases" className="inline-flex items-center gap-1 mt-6 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> 매칭사례
        </Link>

        {data.archived && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[13px] text-amber-800">
            보관된 사례입니다. 최신 정보와 다를 수 있습니다.
          </div>
        )}

        {/* 히어로 */}
        <div className="mt-5 grid lg:grid-cols-[1fr_460px] gap-6 items-center">
          <div>
            <h1 className="text-[28px] sm:text-[38px] font-extrabold tracking-[-0.03em] leading-tight">
              {data.athleteName} <span className="text-slate-300 mx-1">×</span> {data.brand.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {data.verified && <VerifiedBadge />}
              {data.tour && <Tag tone="sky">{data.tour}</Tag>}
              {data.sponsorTypes?.map((t: string) => <Tag key={t} tone="violet">{t}</Tag>)}
            </div>
            {data.background && (
              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 flex gap-4">
                <span className="w-10 h-10 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shrink-0">
                  <Target className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <p className="text-[12px] font-bold text-slate-500 mb-1.5">브랜드 목표</p>
                  <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-line">{data.background}</p>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-[28px] overflow-hidden bg-slate-100 aspect-[4/3]">
            {data.heroImageUrl && <img src={data.heroImageUrl} alt="" className="w-full h-full object-cover" />}
          </div>
        </div>

        {/* 실행 요약 */}
        {execution.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">실행 요약</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {execution.map((b: any, i: number) => (
                <div key={i} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-[14px] font-bold text-slate-900">{b.title}</p>
                  <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed whitespace-pre-line">{b.desc}</p>
                  {b.badge && <span className="mt-3 inline-block"><Tag tone="emerald">{b.badge}</Tag></span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 진행 과정 */}
        {timeline.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">진행 과정</h2>
            <ol className="flex flex-col sm:flex-row gap-3">
              {timeline.map((t: any, i: number) => (
                <li key={i} className="flex-1 flex items-center gap-3">
                  <div className="flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-4">
                    <span className="inline-flex w-8 h-8 rounded-full bg-emerald-600 text-white text-[13px] font-bold items-center justify-center mb-2.5">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] font-bold text-slate-900">{t.label}</p>
                    <p className="text-[12.5px] text-slate-500 mt-1 tabular-nums">{t.date}</p>
                  </div>
                  {i < timeline.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 hidden sm:block" />}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 성과 지표 */}
        <section className="mt-12">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-[18px] font-extrabold text-slate-900">성과 지표</h2>
            <p className="text-[12px] text-slate-500">지표를 누르면 측정 근거를 볼 수 있습니다</p>
          </div>

          {data.metrics?.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.metrics.map((m: any) => (
                <button key={m.id} onClick={() => openEvidence(m)} disabled={m.restricted}
                  className={`text-left rounded-3xl border p-5 transition ${
                    m.restricted ? 'border-slate-100 bg-slate-50/60 cursor-default' : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}>
                  <p className="text-[12.5px] font-bold text-slate-500">{m.label}</p>
                  {m.restricted ? (
                    <>
                      <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
                        <Lock className="w-3.5 h-3.5" /> 비공개
                      </p>
                      <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed">{m.restrictedReason}</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2.5 text-[26px] font-extrabold text-slate-900 tabular-nums leading-none">
                        {m.display}
                        {m.approximate && <span className="ml-1.5 text-[12px] font-bold text-slate-500">근사</span>}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                        {m.periodStart && m.periodEnd && (
                          <p className="text-[12px] text-slate-500">
                            측정 기간 {new Date(m.periodStart).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })} ~ {new Date(m.periodEnd).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                          </p>
                        )}
                        {m.evidence?.sourceName && (
                          <p className="text-[12px] text-slate-500 truncate">출처 {m.evidence.sourceName}</p>
                        )}
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <StateNotice kind="partial" title="공개된 성과 지표가 없습니다"
              desc={'검증이 끝난 지표만 공개합니다. 집계가 완료되면 이곳에 표시됩니다.'} />
          )}
          <p className="mt-3 text-[12.5px] text-slate-500">{data.evidenceNotice}</p>
        </section>

        {/* 후기 */}
        {data.quotes?.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">승인된 후기</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.quotes.map((q: any, i: number) => (
                <blockquote key={i} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-[14px] text-slate-700 leading-[1.75]">“{q.content}”</p>
                  <footer className="mt-4 flex items-center gap-2.5">
                    {q.avatarUrl
                      ? <img src={q.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <span className="w-8 h-8 rounded-full bg-slate-100" />}
                    <span className="text-[12.5px]">
                      <b className="text-slate-800">{q.authorName}</b>
                      {q.authorRole && <span className="text-slate-500 ml-1.5">{q.authorRole}</span>}
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* 관련 사례 */}
        {data.related?.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">같은 브랜드의 다른 사례</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {data.related.map((r: any) => (
                <Link key={r.slug} to={`/about/cases/${r.slug}`}
                  className="rounded-3xl border border-slate-200 overflow-hidden bg-white hover:border-slate-300 transition">
                  <div className="aspect-[16/9] bg-slate-100">
                    {r.heroImageUrl && <img src={r.heroImageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <p className="text-[13.5px] font-bold text-slate-900 truncate">{r.athleteName}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-12">
          <Link to={data.cta?.to ?? '/sponsor/recommended'}
            onClick={() => api.trackAboutEvent({ event: 'intro_cta_click', pageSlug: 'case-detail', visitorKey: visitorKey(), params: { cta: 'similar' } }).catch(() => null)}
            className="w-full h-14 rounded-2xl bg-emerald-600 text-white text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
            <Sparkles className="w-5 h-5" /> {data.cta?.label ?? '비슷한 후원 추천받기'}
          </Link>
          {data.brand.slug && (
            <Link to={`/about/brands/${data.brand.slug}`}
              className="mt-2.5 w-full h-12 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600 flex items-center justify-center hover:border-slate-400 transition">
              {data.brand.name} 브랜드 보기
            </Link>
          )}
        </section>
      </div>

      {evidenceId && <EvidenceLayer metricId={evidenceId} onClose={() => setEvidenceId(null)} />}
    </AboutShell>
  );
}
