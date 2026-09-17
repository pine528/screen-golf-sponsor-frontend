/**
 * IU05 성과보장 프로그램 `/about/performance-guarantee` — 시안 2026-09-17 (리디자인/10 · 16 · 32)
 *
 *  "후원은 실행에서 끝나지 않습니다" → 5단계(기준 합의 · 실행 · 측정 · 판정 · 보완 지원, 마지막 강조)
 *  → 무엇을 확인하나요? (방송 노출 · SNS 활동 · 콘텐츠 반응 · 팬·방문 전환)  |  기준에 미달하면? 차기 후원금 최대 n% 보정 지원(정책 값, 없으면 '계약별')
 *  → 예시로 보는 보정 지원 흐름 4
 *  → 어떤 상품에 적용되나요? · KPI 예시(정책 metricRules) · 적용 제외 사항 → FAQ → CTA
 *  "매출 보장"·"무조건 환급"으로 쓰지 않는다. 정책이 없으면 수치를 지어내지 않고 '계약별'로 둔다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Handshake, Play, BarChart3, Scale, LifeBuoy, ShieldCheck, AlertCircle, ChevronDown, Sparkles, ChevronRight,
  Tv, Hash, MessageSquareHeart, Users, Target, AlertTriangle, Info,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, visitorKey, nf } from '../../components/about/AboutShell';

const STEP_ICON: Record<string, any> = { AGREE: Handshake, EXECUTE: Play, MEASURE: BarChart3, JUDGE: Scale, REMEDY: LifeBuoy };
const CHECKS = [
  { icon: Tv, label: '방송 노출' }, { icon: Hash, label: 'SNS 활동' }, { icon: MessageSquareHeart, label: '콘텐츠 반응' }, { icon: Users, label: '팬 · 방문 전환' },
];
const EXAMPLE_FLOW = [
  { icon: Target, k: '목표', v: '방송 10초' }, { icon: Hash, k: '실행', v: 'SNS 2건' }, { icon: AlertTriangle, k: '결과', v: '일부 미달', tone: 'rose' }, { icon: ShieldCheck, k: '다음 후원', v: '보정 검토', tone: 'amber' },
];

export default function GuaranteeIntro() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api.trackAboutEvent({ event: 'intro_view', pageSlug: 'guarantee', visitorKey: visitorKey() }).catch(() => null);
    api.getGuaranteePolicyPublic().then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  const rules = (data?.policy?.metricRules as any[]) ?? [];
  const remedy = (data?.policy?.remedyRules as any) ?? null;

  return (
    <AboutShell current="guarantee">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {loading ? (
          <div className="py-10 space-y-4"><Skeleton className="h-[200px] rounded-3xl" /><Skeleton className="h-[300px] rounded-3xl" /></div>
        ) : !data ? (
          <div className="py-20"><StateNotice kind="error" title="정책을 불러오지 못했습니다" /></div>
        ) : (
          <>
            {/* 히어로 */}
            <div className="mt-10 text-center">
              <h1 className="text-[30px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-[1.15]">후원은 실행에서 끝나지 않습니다</h1>
              <p className="mt-3 text-[15px] sm:text-[17px] text-slate-600 break-keep">약정한 활동을 확인하고, 합의한 성과기준까지 투명하게 관리합니다.</p>
            </div>

            {/* 5단계 */}
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
              <ol className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {data.flow.map((s: any, i: number) => {
                  const I = STEP_ICON[s.code] ?? Handshake;
                  const last = i === data.flow.length - 1;
                  return (
                    <li key={s.code} className={`relative rounded-2xl p-4 text-center ${last ? 'bg-amber-50 border border-amber-200' : ''}`}>
                      <span className={`inline-flex w-7 h-7 rounded-full text-white text-[12px] font-bold items-center justify-center ${last ? 'bg-amber-500' : 'bg-emerald-600'}`}>{s.step}</span>
                      <span className={`mx-auto mt-3 mb-3 w-16 h-16 rounded-full flex items-center justify-center ${last ? 'bg-white text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}><I className="w-7 h-7" /></span>
                      <p className={`text-[15px] font-extrabold ${last ? 'text-amber-700' : 'text-slate-900'}`}>{s.label}</p>
                      <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed break-keep">{s.desc}</p>
                      {!last && <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* 무엇을 확인 · 기준 미달 시 */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4">
              <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-[19px] font-extrabold">무엇을 확인하나요?</h2>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHECKS.map((c) => { const I = c.icon; return (
                    <div key={c.label} className="rounded-2xl border border-slate-200 p-3 flex flex-col items-center gap-2 text-center"><span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><I className="w-5 h-5" /></span><span className="text-[13px] font-bold text-slate-800">{c.label}</span></div>
                  ); })}
                </div>
                <p className="mt-3 text-[12px] text-slate-500 break-keep">확인 항목과 측정 방법은 계약 상품에 따라 다르며, 계약서에 명시됩니다.</p>
              </section>
              <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 relative overflow-hidden">
                <ShieldCheck aria-hidden className="absolute right-4 bottom-2 w-28 h-28 text-emerald-100" />
                <p className="text-[15px] font-bold text-slate-700">기준에 미달하면?</p>
                <p className="mt-2 text-[22px] sm:text-[28px] font-extrabold leading-tight break-keep">차기 후원금 <span className="text-emerald-700 text-[34px] sm:text-[42px]">{remedy?.ratio ? `최대 ${remedy.ratio}%` : '계약별 비율'}</span> 보정 지원</p>
                <p className="mt-2 text-[13px] text-slate-600 break-keep">사전 합의한 기준과 프로그램 적용조건에 따라 지원범위가 결정됩니다.{remedy?.cap ? ` 지원 한도 ${nf(remedy.cap)}원.` : ''}{remedy?.validMonths ? ` 사용 기한 ${remedy.validMonths}개월.` : ''}</p>
                <div className="mt-3 flex flex-wrap gap-1.5"><Tag tone="rose">현금 환급 아님</Tag><Tag tone="rose">양도 불가</Tag>{data.policy?.version && <Tag>정책 {data.policy.version}</Tag>}</div>
              </section>
            </div>

            {/* 예시 흐름 */}
            <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
              <p className="text-[15px] font-extrabold leading-snug">예시로 보는<br />보정 지원 흐름</p>
              <ol className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {EXAMPLE_FLOW.map((e, i) => { const I = e.icon; return (
                  <li key={e.k} className={`relative rounded-2xl border p-3.5 flex items-center gap-3 ${e.tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}>
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${e.tone === 'rose' ? 'bg-rose-50 text-rose-500' : e.tone === 'amber' ? 'bg-white text-amber-600' : 'bg-slate-50 text-slate-700'}`}><I className="w-5 h-5" /></span>
                    <span><span className="block text-[11.5px] text-slate-500">{e.k}</span><span className="block text-[14px] font-extrabold">{e.v}</span></span>
                    {i < EXAMPLE_FLOW.length - 1 && <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
                  </li>
                ); })}
              </ol>
            </section>

            <div className="mt-6 grid lg:grid-cols-3 gap-4">
              <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-[17px] font-extrabold text-slate-900 mb-4">어떤 상품에 적용되나요?</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 text-center">
                    <span className="inline-flex h-6 px-2 rounded-lg bg-slate-900 text-white text-[12px] font-bold items-center mb-3">SPONPIK 추천</span>
                    <p className="text-[20px] font-black text-emerald-700">PICK</p>
                    <p className="mt-2 text-[12.5px] font-bold text-slate-700">SPONPIK 추천 PICK</p>
                    <span className="mt-2 inline-block"><Tag tone="emerald">성과보장프로그램 적용</Tag></span>
                    <p className="mt-2.5 text-[12px] text-slate-500 leading-relaxed break-keep">스폰픽이 엄선한 선수·구단과 함께 성과까지 보장받는 프리미엄 상품입니다.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 text-center">
                    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-lg border border-emerald-300 text-emerald-700 text-[12px] font-bold mb-3"><ShieldCheck className="w-3 h-3" /> GUARANTEE</span>
                    <p className="text-[15px] font-extrabold text-slate-900 mt-1.5">보장 적용 패키지</p>
                    <span className="mt-2 inline-block"><Tag tone="emerald">성과보장프로그램 적용</Tag></span>
                    <p className="mt-2.5 text-[12px] text-slate-500 leading-relaxed break-keep">상품 상세에 보장 적용 마크가 표시된 패키지에 한해 적용됩니다.</p>
                  </div>
                </div>
                <Link to="/sponsor/available?guarantee=1" onClick={() => api.trackAboutEvent({ event: 'guarantee_check', pageSlug: 'guarantee', visitorKey: visitorKey() }).catch(() => null)}
                  className="mt-4 h-12 rounded-xl bg-emerald-700 text-white text-[14px] font-extrabold flex items-center justify-center gap-1.5 hover:bg-emerald-800 transition">
                  적용 상품 확인 {data.eligibleOffers > 0 && <span className="text-emerald-200 tabular-nums">({data.eligibleOffers})</span>} <ChevronRight className="w-4 h-4" />
                </Link>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-[17px] font-extrabold text-slate-900 inline-flex items-center gap-1">KPI 예시 <Info className="w-3.5 h-3.5 text-slate-400" /></h2>{data.policy?.version && <Tag>{data.policy.version}</Tag>}</div>
                {rules.length ? (
                  <table className="w-full text-[12.5px]">
                    <thead><tr className="text-[12px] text-slate-500 bg-slate-50"><th className="text-left font-semibold py-2 px-2 rounded-l-lg">지표</th><th className="text-right font-semibold py-2 px-2">기준 (예시)</th><th className="text-left font-semibold py-2 pl-3 rounded-r-lg">출처</th></tr></thead>
                    <tbody>
                      {rules.slice(0, 5).map((r: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="py-3 px-2 font-semibold text-slate-800">{r.label ?? r.code}</td>
                          <td className="py-3 px-2 text-right tabular-nums text-slate-700">{r.target}{r.unit} {r.operator === 'gte' ? '이상' : ''}</td>
                          <td className="py-3 pl-3 text-slate-500 inline-flex items-center gap-1">{r.source ?? '—'} <ShieldCheck className="w-3 h-3 text-emerald-500" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[13px] text-slate-500 py-6 text-center leading-relaxed break-keep">공개된 KPI 예시가 아직 없습니다.<br />정책이 발행되면 이곳에 표시됩니다.</p>
                )}
                <p className="mt-4 text-[12px] text-slate-500 leading-relaxed break-keep">※ KPI와 기준, 측정 방법과 출처는 계약 상품에 따라 다를 수 있으며, 모든 내용은 계약서에 명시됩니다.</p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-[17px] font-extrabold text-slate-900 mb-4">적용 제외 사항</h2>
                <ul className="space-y-3">
                  {data.exclusions.map((e: any) => (
                    <li key={e.code} className="flex items-start gap-2.5"><AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /><span className="text-[13px] text-slate-600 leading-relaxed break-keep">{e.label}</span></li>
                  ))}
                </ul>
                <a href="#faq" className="mt-4 inline-flex items-center gap-0.5 text-[13px] font-bold text-slate-700 hover:text-slate-900">자세히 보기 <ChevronRight className="w-3.5 h-3.5" /></a>
              </section>
            </div>

            {data.policyMissing && <div className="mt-4"><StateNotice kind="partial" title="공개 정책 버전이 아직 없습니다" desc={data.policyMissing} /></div>}

            {/* FAQ — 시안: 가로 4열 아코디언 */}
            <section id="faq" className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">자주 묻는 질문</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {data.faq.map((f: any, i: number) => (
                  <div key={i} className={`rounded-2xl border ${openFaq === i ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left">
                      <span className="text-[13.5px] font-bold text-slate-800 break-keep">{f.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === i && <p className="px-4 pb-4 text-[13px] text-slate-600 leading-relaxed break-keep">{f.a}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
              <ul className="space-y-1.5">{data.disclaimers.map((d: string, i: number) => <li key={i} className="text-[12px] text-slate-500 leading-relaxed pl-3 relative break-keep"><span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-slate-300" />{d}</li>)}</ul>
            </section>

            <section className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/contact" className="h-13 py-4 px-8 rounded-xl bg-emerald-700 text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-800 transition">성과보장 적용 상담하기 <ChevronRight className="w-4 h-4" /></Link>
              <a href="#faq" className="h-13 py-4 px-6 text-[15px] font-bold text-slate-700 inline-flex items-center gap-1 hover:text-slate-900">운영기준 자세히 <ChevronRight className="w-4 h-4" /></a>
              <Link to="/about/my-guarantees" className="h-13 py-4 px-6 rounded-xl border border-emerald-300 text-emerald-700 text-[15px] font-bold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition"><BarChart3 className="w-4 h-4" /> 내 계약 결과 보기</Link>
            </section>
            <p className="mt-4 text-center text-[12px] text-slate-400 inline-flex items-center gap-1 w-full justify-center"><Sparkles className="w-3.5 h-3.5" /> 매출을 보장하는 제도가 아니라, 계약서에 합의한 기준을 측정하고 약정된 보완 지원을 제공하는 프로그램입니다.</p>
          </>
        )}
      </div>
    </AboutShell>
  );
}
