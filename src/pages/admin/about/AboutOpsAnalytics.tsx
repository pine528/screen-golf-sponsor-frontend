/**
 * IA12 분석 · SEO (핸드오프 v1.0 §13)
 * 개인 식별자를 쓰지 않는 가명 이벤트만 집계한다. 데이터가 없으면 비율을 만들지 않는다.
 */
import { useCallback, useEffect, useState } from 'react';
import {RefreshCw, CheckCircle2, AlertTriangle} from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  KpiCard, Panel, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

export default function AboutOpsAnalytics() {
  const guard = useAdminGuard();
  const [from, setFrom] = useState(new Date(Date.now() - 28 * 86400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.getAboutAnalytics({ from, to })
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/about/analytics'))
      .finally(() => setLoading(false));
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const maxFunnel = data ? Math.max(1, ...data.funnel.map((f: any) => f.value)) : 1;

  return (
    <AboutAdminShell title="소개 성과" desc="소개 영역의 유입과 전환, SEO 상태를 확인합니다."
      breadcrumb={['분석', '소개 성과']}
      actions={
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
          <span className="text-slate-300">~</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
          <button onClick={load} className="h-10 px-3 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-400 flex items-center">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }>
      {loading && !data ? <Loading /> : !data ? <Empty title="분석 데이터를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {data.notice && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-[13px] text-slate-600">
              {data.notice}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {data.kpis.map((k: any) => (
              <KpiCard key={k.key} label={k.label} value={k.value} unit={k.unit}
                sub={k.delta === null ? '이전 기간 비교 없음' : `이전 기간 대비 ${k.delta > 0 ? '+' : ''}${k.delta}%`} />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* 퍼널 */}
            <Panel title="소개 전환 퍼널">
              <div className="p-5 space-y-3">
                {data.funnel.map((f: any) => (
                  <div key={f.step}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-slate-700">
                        <span className="inline-flex w-5 h-5 rounded-md bg-slate-100 text-slate-500 text-[12px] font-bold items-center justify-center mr-2">
                          {f.step}
                        </span>
                        {f.label}
                      </span>
                      <span className="text-[13px] font-extrabold text-slate-900 tabular-nums">
                        {nf(f.value)}
                        {f.ofTotal !== null && <span className="text-[12px] text-slate-500 ml-1.5">({f.ofTotal}%)</span>}
                      </span>
                    </div>
                    <div className="h-7 rounded-lg bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-lg bg-emerald-500/85 transition-[width]"
                        style={{ width: `${Math.max(2, (f.value / maxFunnel) * 100)}%` }} />
                    </div>
                    {f.dropRate !== null && (
                      <p className="mt-1 text-[12px] text-slate-500">
                        전환율 {f.stepRate === null ? '집계 중' : `${f.stepRate}%`}
                        <span className="text-rose-400 ml-2">이탈 {f.dropRate}%</span>
                      </p>
                    )}
                  </div>
                ))}
                {data.funnel.every((f: any) => f.value === 0) && (
                  <p className="text-[12.5px] text-slate-500 text-center py-4">
                    선택 기간에 수집된 이벤트가 없습니다.
                  </p>
                )}
              </div>
            </Panel>

            <div className="space-y-4">
              {/* 페이지 성과 */}
              <Panel title="주요 페이지 성과">
                {data.pages.length ? (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[12px] text-slate-500 border-b border-slate-100">
                        <th className="text-left font-semibold px-5 py-2.5">페이지</th>
                        <th className="text-right font-semibold px-5 py-2.5">조회</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pages.map((p: any) => (
                        <tr key={p.slug} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3 font-mono text-[12.5px] text-slate-700">/{p.slug}</td>
                          <td className="px-5 py-3 text-right tabular-nums font-semibold">{nf(p.views)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Empty title="페이지별 조회 기록이 없습니다" />
                )}
              </Panel>

              {/* SEO */}
              <Panel title="SEO 건강 상태">
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: '게시 페이지', v: data.seo.publishedPages },
                      { l: '게시 사례', v: data.seo.publishedCases },
                    ].map((r) => (
                      <div key={r.l} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[12px] text-slate-500 font-semibold">{r.l}</p>
                        <p className="text-[19px] font-extrabold text-slate-900 tabular-nums">{nf(r.v)}</p>
                      </div>
                    ))}
                  </div>
                  {data.seo.checks.map((c: any) => (
                    <div key={c.key} className="flex items-center gap-2.5">
                      {c.ok
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span className="text-[13px] font-semibold text-slate-700">{c.label}</span>
                      <span className={`ml-auto text-[12.5px] ${c.ok ? 'text-slate-500' : 'text-amber-600 font-semibold'}`}>
                        {c.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          <p className="text-[12.5px] text-slate-500 px-1">
            집계 기간 {fmtDate(data.period.from)} ~ {fmtDate(data.period.to)} ({data.period.days}일) ·
            분석 ID는 내부 사용자 ID가 아닌 가명 ID를 사용합니다.
          </p>
        </div>
      )}
    </AboutAdminShell>
  );
}
