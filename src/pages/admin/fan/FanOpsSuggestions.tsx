/**
 * A11 팬 브랜드 추천 파이프라인 (핸드오프 v1.0 §9.1 · §18.2)
 * 이해관계가 표시된 추천은 검토 단계를 건너뛰고 전달할 수 없다.
 */
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  Panel, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/fanadmin/FanAdminShell';

const COL_TONE: Record<string, string> = {
  RECEIVED: 'border-t-slate-300', REVIEWING: 'border-t-sky-400', DELIVERED: 'border-t-violet-400',
  INTERESTED: 'border-t-amber-400', ADOPTED: 'border-t-emerald-400', HOLD: 'border-t-slate-200',
};

export default function FanOpsSuggestions() {
  const guard = useAdminGuard();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanSuggestionBoard()
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/fan/brand-suggestions'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setNote(''); setError(null); setMsg(null);
    api.getFanSuggestion(selected).then((r) => setDetail(r.data)).catch(() => setDetail(null));
  }, [selected]);

  const move = async (status: string) => {
    if (!selected) return;
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.moveFanSuggestion(selected, { status, note: note || undefined });
      setDetail(r.data.suggestion);
      setMsg(r.data.point?.earned > 0 ? `단계를 이동했습니다 · 추천 팬에게 ${r.data.point.earned}P 적립` : '단계를 이동했습니다');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '단계 이동에 실패했습니다');
    } finally { setBusy(false); }
  };

  const i = data?.insights;

  return (
    <FanAdminShell title="팬 브랜드 추천 파이프라인" desc="팬이 제안한 브랜드를 검토하고 브랜드에 전달합니다."
      breadcrumb={['팬 운영', '브랜드 추천']}>
      {loading && !data ? <Loading /> : !data ? <Empty title="파이프라인을 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          {/* 칸반 */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {data.columns.map((c: any) => (
              <div key={c.code} className={`rounded-2xl border border-slate-200 border-t-4 bg-white ${COL_TONE[c.code] ?? 'border-t-slate-200'}`}>
                <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-800">{c.label}</span>
                  <span className="text-[12px] font-extrabold text-slate-500 tabular-nums">{c.total}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[440px] overflow-y-auto">
                  {c.cards.length ? c.cards.map((card: any) => (
                    <button key={card.id} onClick={() => setSelected(card.id)}
                      className={`w-full text-left rounded-xl border p-2.5 transition ${
                        selected === card.id ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-300'
                      }`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[12px] font-bold text-slate-800 truncate">{card.athlete?.name ?? '—'}</span>
                        {card.interest !== 'NONE' && (
                          <span className="inline-flex items-center h-4 px-1 rounded bg-amber-100 text-amber-700 text-[9px] font-bold">
                            이해관계
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-semibold text-slate-700 truncate">{card.brandName ?? card.category}</p>
                      <p className="text-[12.5px] text-slate-500 mt-1">{card.category}</p>
                      <p className="text-[12.5px] text-slate-300 mt-1">{fmtDate(card.createdAt)}</p>
                    </button>
                  )) : (
                    <p className="text-[12px] text-slate-300 text-center py-6">없음</p>
                  )}
                  {c.total > c.cards.length && (
                    <p className="text-[12px] text-slate-500 text-center py-1">+{c.total - c.cards.length}건 더</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* 인사이트 + 보상 */}
            <div className="space-y-4">
              <Panel title="파이프라인 인사이트">
                <div className="p-5 grid grid-cols-3 gap-3">
                  {[
                    { l: '접수', v: nf(i.received) },
                    { l: '채택', v: nf(i.adopted) },
                    { l: '채택률', v: i.adoptRate === null ? '집계 중' : `${i.adoptRate}%` },
                  ].map((r) => (
                    <div key={r.l} className="text-center">
                      <p className="text-[19px] font-extrabold text-slate-900 tabular-nums">{r.v}</p>
                      <p className="text-[12px] text-slate-500 mt-1">{r.l}</p>
                    </div>
                  ))}
                </div>
                <p className="px-5 pb-4 text-[12px] text-slate-500">{i.window} 기준</p>
              </Panel>

              <Panel title="리워드 자동 지급 규칙">
                <div className="p-4 space-y-2">
                  {data.rewardRules.map((r: any) => (
                    <div key={r.code} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                      <span className="text-[12px] font-semibold text-slate-700">{r.label}</span>
                      <span className="text-[13px] font-extrabold text-emerald-600 tabular-nums">+{r.points}P</span>
                    </div>
                  ))}
                </div>
                <p className="px-4 pb-4 text-[12px] text-slate-500 leading-relaxed">{data.notice}</p>
              </Panel>
            </div>

            {/* 상세 */}
            <Panel className="lg:col-span-2" title="추천 상세"
              right={detail && (
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}>
              {!detail ? (
                <Empty title="카드를 선택하세요" desc="추천 상세와 단계 이동은 이곳에서 처리합니다." />
              ) : (
                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusTag label={detail.statusLabel} tone={detail.status === 'ADOPTED' ? 'emerald' : 'sky'} />
                    <span className="text-[13px] font-bold text-slate-900">{detail.athlete?.name}</span>
                    <span className="ml-auto text-[12px] text-slate-500 tabular-nums">
                      접수 {fmtDate(detail.createdAt, true)}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-500 mb-1">추천 브랜드</p>
                      <p className="font-bold text-slate-800">{detail.brandName ?? '(브랜드명 미입력)'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-500 mb-1">카테고리</p>
                      <p className="font-semibold text-slate-700">{detail.category}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-500 mb-1">이해관계</p>
                      <p className={`font-semibold ${detail.interest === 'NONE' ? 'text-slate-700' : 'text-amber-700'}`}>
                        {detail.interestLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-500 mb-1">중복 추천</p>
                      <p className="font-semibold text-slate-700 tabular-nums">{nf(detail.duplicates)}건</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-slate-500 mb-1.5">팬 작성 추천 이유</p>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{detail.reason}</p>
                    </div>
                  </div>

                  {detail.conflictWarning && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-amber-700 leading-relaxed">{detail.conflictWarning}</p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 px-4 py-3 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-slate-500">{detail.privacyNotice}</p>
                  </div>

                  {/* 단계 이동 */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[12px] font-bold text-slate-500 mb-2">단계 이동</p>
                    <input value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="이동 사유 (선택)"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 mb-2.5 focus:outline-none focus:border-slate-400" />
                    <div className="flex flex-wrap gap-2">
                      {detail.stages.filter((s: any) => s.code !== detail.status).map((s: any) => (
                        <button key={s.code} disabled={busy} onClick={() => move(s.code)}
                          className={`h-9 px-3.5 rounded-xl text-[13px] font-bold border transition inline-flex items-center gap-1 ${
                            s.code === 'ADOPTED'
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                          }`}>
                          {s.label} <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </FanAdminShell>
  );
}
