/**
 * IU05 성과보장 소개 (핸드오프 v1.0 §7.1 · §7.2)
 * "매출 보장"·"무조건 환급"으로 쓰지 않는다. 무엇을 보장하고 무엇은 보장하지 않는지 먼저 밝힌다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Handshake, Play, BarChart3, Scale, LifeBuoy, ShieldCheck,
  AlertCircle, ChevronDown, ArrowRight, Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, visitorKey } from '../../components/about/AboutShell';

const STEP_ICON: Record<string, any> = {
  AGREE: Handshake, EXECUTE: Play, MEASURE: BarChart3, JUDGE: Scale, REMEDY: LifeBuoy,
};

export default function GuaranteeIntro() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api.trackAboutEvent({ event: 'intro_view', pageSlug: 'guarantee', visitorKey: visitorKey() }).catch(() => null);
    api.getGuaranteePolicyPublic()
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const rules = (data?.policy?.metricRules as any[]) ?? [];

  return (
    <AboutShell current="성과보장프로그램">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {loading ? (
          <div className="py-10 space-y-4"><Skeleton className="h-[200px] rounded-3xl" /><Skeleton className="h-[300px] rounded-3xl" /></div>
        ) : !data ? (
          <div className="py-20"><StateNotice kind="error" title="정책을 불러오지 못했습니다" /></div>
        ) : (
          <>
            {/* 히어로 + 흐름 */}
            <div className="mt-8 grid lg:grid-cols-[minmax(0,420px)_1fr] gap-8 items-start">
              <div>
                <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.15]">
                  성과보장<br />프로그램
                </h1>
                <p className="mt-5 text-[17px] font-bold text-slate-800 leading-snug">
                  {data.hero.title}
                </p>
                <p className="mt-3 text-[13.5px] text-slate-500 leading-relaxed break-keep">
                  {data.hero.desc}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {data.flow.map((s: any) => {
                  const I = STEP_ICON[s.code] ?? Handshake;
                  return (
                    <div key={s.code} className="rounded-3xl border border-slate-200 bg-white p-4 text-center">
                      <span className="inline-flex w-7 h-7 rounded-full bg-emerald-600 text-white text-[12px] font-bold items-center justify-center mb-3">
                        {s.step}
                      </span>
                      <span className="mx-auto mb-2.5 w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <I className="w-5 h-5" />
                      </span>
                      <p className="text-[13.5px] font-bold text-slate-900">{s.label}</p>
                      <p className="mt-1.5 text-[11.5px] text-slate-400 leading-relaxed">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 grid lg:grid-cols-3 gap-4">
              {/* 적용 상품 */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-[17px] font-extrabold text-slate-900 mb-4">어떤 상품에 적용되나요?</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 text-center">
                    <span className="inline-flex h-6 px-2 rounded-lg bg-slate-900 text-white text-[10px] font-bold items-center mb-3">SPONPIK 추천</span>
                    <p className="text-[17px] font-extrabold text-slate-900">PICK</p>
                    <p className="mt-2 text-[12.5px] font-bold text-slate-700">SPONPIK 추천 PICK</p>
                    <span className="mt-2 inline-block"><Tag tone="emerald">성과보장 적용</Tag></span>
                    <p className="mt-2.5 text-[11.5px] text-slate-400 leading-relaxed">
                      스폰픽이 엄선한 선수·구단과 함께 성과까지 보장받는 상품입니다.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 text-center">
                    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-lg border border-emerald-300 text-emerald-700 text-[10px] font-bold mb-3">
                      <ShieldCheck className="w-3 h-3" /> GUARANTEE
                    </span>
                    <p className="text-[15px] font-extrabold text-slate-900 mt-1.5">보장 적용 패키지</p>
                    <span className="mt-2 inline-block"><Tag tone="emerald">성과보장 적용</Tag></span>
                    <p className="mt-2.5 text-[11.5px] text-slate-400 leading-relaxed">
                      상품 상세에 보장 적용 표시가 있는 패키지에 한해 적용됩니다.
                    </p>
                  </div>
                </div>
                <Link to="/sponsor/available"
                  onClick={() => api.trackAboutEvent({ event: 'guarantee_check', pageSlug: 'guarantee', visitorKey: visitorKey() }).catch(() => null)}
                  className="mt-4 h-12 rounded-2xl bg-emerald-600 text-white text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition">
                  적용 상품 확인 <ArrowRight className="w-4 h-4" />
                </Link>
              </section>

              {/* KPI 예시 */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-extrabold text-slate-900">KPI 예시</h2>
                  {data.policy?.version && <Tag>{data.policy.version}</Tag>}
                </div>
                {rules.length ? (
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                        <th className="text-left font-semibold py-2">지표</th>
                        <th className="text-right font-semibold py-2">기준</th>
                        <th className="text-left font-semibold py-2 pl-4">출처</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.slice(0, 5).map((r: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="py-3 font-semibold text-slate-800">{r.label ?? r.code}</td>
                          <td className="py-3 text-right tabular-nums text-slate-700">
                            {r.target}{r.unit} {r.operator === 'gte' ? '이상' : ''}
                          </td>
                          <td className="py-3 pl-4 text-slate-500">{r.source ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[13px] text-slate-400 py-6 text-center leading-relaxed">
                    공개된 KPI 예시가 아직 없습니다.<br />정책이 발행되면 이곳에 표시됩니다.
                  </p>
                )}
                <p className="mt-4 text-[11.5px] text-slate-400 leading-relaxed">
                  ※ KPI와 기준, 측정 방법과 출처는 계약 상품에 따라 다를 수 있으며, 모든 내용은 계약서에 명시됩니다.
                </p>
              </section>

              {/* 제외 사항 */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-[17px] font-extrabold text-slate-900 mb-4">적용 제외 사항</h2>
                <ul className="space-y-3">
                  {data.exclusions.map((e: any) => (
                    <li key={e.code} className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <span className="text-[13px] text-slate-600 leading-relaxed">{e.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* 보완지원 안내 */}
            {data.policy?.remedyRules && (
              <section className="mt-4 rounded-3xl border border-violet-200 bg-violet-50/50 p-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-white text-violet-600 flex items-center justify-center">
                      <LifeBuoy className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-[15px] font-bold text-slate-900">미달 시 보완 지원</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">계약서에 약정된 방식으로 제공됩니다</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-5 ml-auto">
                    {[
                      { l: '지원 비율', v: (data.policy.remedyRules as any).ratio ? `최대 ${(data.policy.remedyRules as any).ratio}%` : '계약별' },
                      { l: '지원 한도', v: (data.policy.remedyRules as any).cap ? `${((data.policy.remedyRules as any).cap).toLocaleString('ko-KR')}원` : '계약별' },
                      { l: '사용 기한', v: (data.policy.remedyRules as any).validMonths ? `${(data.policy.remedyRules as any).validMonths}개월` : '계약별' },
                    ].map((r) => (
                      <div key={r.l}>
                        <p className="text-[11px] text-slate-400 font-semibold">{r.l}</p>
                        <p className="text-[16px] font-extrabold text-violet-700 tabular-nums">{r.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-violet-200/60 flex flex-wrap gap-2">
                  <Tag tone="rose">현금 환급 아님</Tag>
                  <Tag tone="rose">양도 불가</Tag>
                  <span className="text-[12px] text-slate-500">
                    보완지원은 차기 후원 시 사용할 수 있는 지원이며, 계약 브랜드에 한해 사용 가능합니다.
                  </span>
                </div>
              </section>
            )}

            {data.policyMissing && (
              <div className="mt-4">
                <StateNotice kind="partial" title="공개 정책 버전이 아직 없습니다" desc={data.policyMissing} />
              </div>
            )}

            {/* FAQ */}
            <section className="mt-10">
              <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">자주 묻는 질문</h2>
              <div className="rounded-3xl border border-slate-200 bg-white divide-y divide-slate-100">
                {data.faq.map((f: any, i: number) => (
                  <div key={i}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                      <span className="text-[14px] font-bold text-slate-800">{f.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === i && (
                      <p className="px-5 pb-4 text-[13.5px] text-slate-600 leading-relaxed">{f.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 고지 + CTA */}
            <section className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
              <ul className="space-y-1.5">
                {data.disclaimers.map((d: string, i: number) => (
                  <li key={i} className="text-[12px] text-slate-500 leading-relaxed pl-3 relative">
                    <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-slate-300" />{d}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6 grid sm:grid-cols-2 gap-2.5">
              <Link to="/sponsor/available"
                className="h-13 py-4 rounded-2xl border border-emerald-200 text-emerald-700 text-[15px] font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition">
                <Sparkles className="w-4 h-4" /> 적용 상품 확인
              </Link>
              <Link to="/about/my-guarantees"
                className="h-13 py-4 rounded-2xl bg-slate-900 text-white text-[15px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition">
                <BarChart3 className="w-4 h-4" /> 내 계약 결과 보기
              </Link>
            </section>
          </>
        )}
      </div>
    </AboutShell>
  );
}
