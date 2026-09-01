/**
 * IA01 소개 운영 대시보드 (핸드오프 v1.0 §20)
 * 게시상태 · 오래된 콘텐츠 · 권리 · 링크 · 보장 예외를 한 화면에서 본다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {Plus, FileEdit, ShieldCheck} from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  KpiCard, Panel, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

const PRIORITY_TONE: Record<string, string> = {
  긴급: 'bg-rose-50 text-rose-600 border-rose-200',
  높음: 'bg-orange-50 text-orange-600 border-orange-200',
  보통: 'bg-amber-50 text-amber-700 border-amber-200',
  낮음: 'bg-slate-50 text-slate-500 border-slate-200',
};

const LEVEL_TONE: Record<string, string> = {
  정상: 'text-emerald-600', 주의: 'text-amber-600', 경고: 'text-rose-600',
};

export default function AboutOpsDashboard() {
  const guard = useAdminGuard();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAboutAdminDashboard()
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/about'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AboutAdminShell title="소개 운영 대시보드" desc="소개 콘텐츠의 게시 상태와 처리할 일을 한눈에 확인하세요."
      breadcrumb={['소개 운영', '대시보드']}
      actions={
        <>
          <Link to="/admin/about/cases"
            className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> 사례 관리
          </Link>
          <Link to="/admin/about/pages"
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:border-slate-400 transition inline-flex items-center gap-1.5">
            <FileEdit className="w-4 h-4" /> 페이지 편집
          </Link>
          <Link to="/admin/about/policies"
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:border-slate-400 transition inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> 정책 관리
          </Link>
        </>
      }>
      {loading ? <Loading /> : !data ? <Empty title="대시보드를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {data.kpis.map((k: any) => (
              <KpiCard key={k.key} label={k.label} value={k.value} unit={k.unit} sub={k.sub}
                tone={k.key === 'evidence' && k.value > 0 ? 'danger' : ['rights', 'stale', 'guarantee'].includes(k.key) && k.value > 0 ? 'warn' : 'default'} />
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* 발행 상태 */}
            <Panel title="콘텐츠 발행 상태">
              <div className="p-5 space-y-3">
                {data.pipeline.map((p: any) => (
                  <div key={p.code}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-slate-700">
                        {p.label} <span className="text-[11px] text-slate-400 font-mono">({p.code})</span>
                      </span>
                      <span className="text-[13px] font-extrabold text-slate-900 tabular-nums">
                        {nf(p.count)}
                        <span className="text-[11px] text-slate-400 ml-1.5">
                          {p.percent === null ? '' : `${p.percent}%`}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-slate-900/85" style={{ width: `${p.percent ?? 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* 오늘 처리할 일 */}
            <Panel className="lg:col-span-2" title="오늘 처리할 일"
              right={
                <span className="inline-flex h-6 px-2 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-bold">
                  {nf(data.todoTotal)}건
                </span>
              }>
              {data.todo.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                        <th className="text-left font-semibold px-5 py-2.5">우선순위</th>
                        <th className="text-left font-semibold py-2.5">업무</th>
                        <th className="text-left font-semibold py-2.5">소유자</th>
                        <th className="text-left font-semibold py-2.5">마감일</th>
                        <th className="text-right font-semibold px-5 py-2.5">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.todo.map((t: any) => (
                        <tr key={t.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center h-5 px-1.5 rounded-md border text-[11px] font-extrabold ${PRIORITY_TONE[t.priority] ?? PRIORITY_TONE['보통']}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-3 font-semibold text-slate-800 max-w-[280px] truncate">{t.task}</td>
                          <td className="py-3 text-slate-500 whitespace-nowrap">{t.owner}</td>
                          <td className="py-3 text-slate-500 tabular-nums whitespace-nowrap">{fmtDate(t.dueAt)}</td>
                          <td className="px-5 py-3 text-right">
                            <Link to={t.to}
                              className="inline-flex h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400 items-center">
                              {t.action}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="처리할 일이 없습니다" desc="권리 만료·승인 대기·데이터 지연이 생기면 이곳에 표시됩니다." />
              )}
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* 운영 헬스 */}
            <Panel title="운영 헬스 체크">
              <div className="divide-y divide-slate-50">
                {data.health.map((h: any) => (
                  <div key={h.key} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13.5px] font-semibold text-slate-800">{h.label}</span>
                      <span className="flex items-center gap-2">
                        <span className={`text-[15px] font-extrabold tabular-nums ${LEVEL_TONE[h.level]}`}>{nf(h.count)}건</span>
                        <span className={`inline-flex h-5 px-1.5 rounded-md text-[10.5px] font-bold ${
                          h.level === '정상' ? 'bg-emerald-50 text-emerald-600'
                            : h.level === '주의' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'
                        }`}>{h.level}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${
                        h.level === '정상' ? 'bg-emerald-400' : h.level === '주의' ? 'bg-amber-400' : 'bg-rose-400'
                      }`} style={{ width: h.count === 0 ? '4%' : `${Math.min(100, (h.count / Math.max(1, h.threshold || 5)) * 100)}%` }} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">임계값 {h.threshold}건</p>
                  </div>
                ))}
              </div>
            </Panel>

            {/* 최근 활동 */}
            <Panel title="최근 게시 활동">
              {data.activities.length ? (
                <div className="divide-y divide-slate-50">
                  {data.activities.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-[11px] text-slate-400 tabular-nums w-24 shrink-0">{fmtDate(a.at, true)}</span>
                      <span className="inline-flex h-6 px-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold shrink-0">
                        {({
                          CONTENT_PAGE: '페이지', MATCHING_CASE: '사례', PARTNER_BRAND: '브랜드',
                          GUARANTEE_POLICY: '정책', RIGHTS_GRANT: '권리',
                        } as any)[a.target] ?? a.target}
                      </span>
                      <p className="text-[13px] text-slate-700 truncate flex-1">{a.reason || a.action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="기록된 활동이 없습니다" desc="관리자 조치가 발생하면 감사 로그와 함께 표시됩니다." />
              )}
            </Panel>
          </div>

          <p className="text-[11px] text-slate-400 px-1">{data.notice}</p>
        </div>
      )}
    </AboutAdminShell>
  );
}
