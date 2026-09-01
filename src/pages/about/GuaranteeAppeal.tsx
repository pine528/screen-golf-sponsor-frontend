/**
 * IU07 이의제기 · 보완지원 (핸드오프 v1.0 §7.3)
 * 예상 보완지원은 계약 스냅샷의 규칙으로만 계산하고, 현금 환급이 아님을 화면에서 못박는다.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {ArrowLeft, Upload, CheckCircle2, AlertCircle, Scale, FileSearch, Gift, ShieldCheck} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, nf } from '../../components/about/AboutShell';

const STEP_ICON: Record<string, any> = {
  RECEIVED: Upload, UNDER_REVIEW: FileSearch, DECIDED: Scale, SUPPORT_ISSUED: Gift,
};

export default function GuaranteeAppeal() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<any>(null);

  useEffect(() => {
    api.getGuaranteeAppealContext(id)
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.error?.message || '대상 계약을 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api.submitGuaranteeAppeal(id, { reason, evidenceTypes: types, attested });
      setDone(r.data);
    } catch (e: any) {
      if (e?.response?.status === 401) { nav(`/login?returnUrl=/about/my-guarantees/${id}/appeal`); return; }
      setError(e?.response?.data?.error?.message || '접수에 실패했습니다');
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <AboutShell current="성과보장프로그램">
        <div className="max-w-[1280px] mx-auto px-5 py-10 space-y-4">
          <Skeleton className="h-[160px] rounded-3xl" /><Skeleton className="h-[320px] rounded-3xl" />
        </div>
      </AboutShell>
    );
  }
  if (!data) {
    return (
      <AboutShell current="성과보장프로그램">
        <div className="max-w-2xl mx-auto px-5 py-20">
          <StateNotice kind="error" title="이의제기를 진행할 수 없습니다" desc={error ?? undefined}
            action={<Link to="/about/my-guarantees" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">내 보장 현황</Link>} />
        </div>
      </AboutShell>
    );
  }

  if (done) {
    return (
      <AboutShell current="성과보장프로그램">
        <div className="max-w-lg mx-auto px-5 py-20 text-center">
          <div className="mx-auto w-14 h-14 rounded-3xl bg-emerald-50 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">이의제기가 접수되었습니다</h1>
          <p className="mt-3 text-[14px] text-slate-500 leading-relaxed">{done.message}</p>
          <p className="mt-4 font-mono text-[13px] text-slate-400">{done.appeal.code}</p>
          {done.appeal.slaDueAt && (
            <p className="mt-1.5 text-[12px] text-slate-400">
              검토 예정 {new Date(done.appeal.slaDueAt).toLocaleDateString('ko-KR')} 까지
            </p>
          )}
          <Link to="/about/my-guarantees"
            className="mt-8 inline-flex h-12 px-6 rounded-2xl bg-slate-900 text-white text-[15px] font-bold items-center">
            내 보장 현황으로
          </Link>
        </div>
      </AboutShell>
    );
  }

  const s = data.snapshot;
  const len = reason.trim().length;
  const valid = data.canAppeal && len >= 10 && len <= 1000 && attested;

  return (
    <AboutShell current="성과보장프로그램" title="이의제기 · 보완지원"
      desc="최종 KPI 결과에 이의가 있거나, 보완지원이 필요하신 경우 아래 내용을 제출해 주세요.">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        <Link to="/about/my-guarantees" className="inline-flex items-center gap-1 mt-6 text-[13px] font-semibold text-slate-400 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> 내 성과보장 현황
        </Link>

        <div className="mt-6 grid lg:grid-cols-[1fr_400px] gap-4">
          {/* 좌: 폼 */}
          <div className="space-y-4">
            {/* 대상 계약 */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[13px] font-bold text-slate-500 mb-2.5">대상 계약</p>
              <p className="text-[17px] font-extrabold text-slate-900">
                {s.brandName} <span className="text-slate-300 mx-0.5">×</span> {s.athleteName}
              </p>

              <div className="mt-5">
                <p className="text-[13px] font-bold text-slate-500 mb-2.5">최종 KPI 결과</p>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <Tag tone="rose">{s.status}</Tag>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-slate-700 leading-relaxed">
                        {s.statusDesc}
                      </p>
                      {data.failedMetrics.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {data.failedMetrics.map((f: any, i: number) => (
                            <li key={i} className="text-[12.5px] text-rose-700">· {f.summary}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {data.appealRemainDays !== null && (
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-slate-500 font-semibold">이의제기 마감일</p>
                        <p className={`text-[22px] font-extrabold tabular-nums ${data.appealRemainDays > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {data.appealRemainDays > 0 ? `D-${data.appealRemainDays}` : '마감'}
                        </p>
                        {data.appealDueAt && (
                          <p className="text-[11px] text-slate-400 tabular-nums">
                            {new Date(data.appealDueAt).toLocaleDateString('ko-KR')} 까지
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 이의 사유 */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[13px] font-bold text-slate-500 mb-2.5">
                이의 사유 입력 <Tag tone="rose">필수</Tag>
              </p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 1000))}
                placeholder="이의 사유를 입력해 주세요." rows={6} disabled={!data.canAppeal}
                className="w-full rounded-2xl border border-slate-200 p-4 text-[14px] text-slate-700 leading-relaxed placeholder:text-slate-300 resize-none focus:outline-none focus:border-slate-400 disabled:bg-slate-50" />
              <p className="mt-1.5 text-right text-[11.5px] text-slate-400 tabular-nums">{len} / 1,000</p>

              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[13px] font-bold text-slate-500 mb-2.5">
                    증빙 자료 첨부 <Tag>선택</Tag>
                  </p>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                    <Upload className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                    <p className="text-[12.5px] text-slate-400">파일 업로드는 접수 후 담당자 안내에 따라 진행합니다.</p>
                    <p className="text-[11px] text-slate-300 mt-1">PDF, JPG, PNG (최대 10MB)</p>
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-500 mb-2.5">증빙 유형 체크</p>
                  <div className="space-y-2">
                    {data.evidenceTypes.map((t: any) => (
                      <label key={t.code} className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={types.includes(t.code)}
                          onChange={(e) => setTypes((v) => e.target.checked ? [...v, t.code] : v.filter((x) => x !== t.code))}
                          disabled={!data.canAppeal}
                          className="w-4 h-4 rounded accent-emerald-600" />
                        <span className="text-[13px] text-slate-600">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <label className="mt-5 flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5 cursor-pointer">
                <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)}
                  disabled={!data.canAppeal}
                  className="w-4 h-4 mt-0.5 rounded accent-emerald-600" />
                <span>
                  <span className="block text-[13.5px] font-bold text-slate-800">
                    상기 내용이 사실이며, 제출한 증빙자료가 진실됨을 확인합니다. <Tag tone="rose">필수</Tag>
                  </span>
                  <span className="block text-[11.5px] text-slate-400 mt-0.5">
                    허위 제출 시 서비스 이용 제한 및 법적 책임이 발생할 수 있습니다.
                  </span>
                </span>
              </label>

              {!data.canAppeal && (
                <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[12.5px] text-amber-700 leading-relaxed">
                    {data.existingAppeals.some((a: any) => ['RECEIVED', 'UNDER_REVIEW'].includes(a.status))
                      ? '이미 접수된 이의제기가 처리 중입니다.'
                      : data.appealRemainDays !== null && data.appealRemainDays <= 0
                        ? '이의제기 기간이 지났습니다.'
                        : '판정이 확정된 뒤에 이의제기를 할 수 있습니다.'}
                  </p>
                </div>
              )}

              {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}

              <div className="mt-5 grid sm:grid-cols-2 gap-2.5">
                <button disabled={!valid || busy} onClick={submit}
                  className="h-13 py-4 rounded-2xl bg-emerald-600 text-white text-[15px] font-bold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 transition">
                  {busy ? '접수 중…' : '이의제기 접수'}
                </button>
                <Link to="/contact"
                  className="h-13 py-4 rounded-2xl border border-emerald-200 text-emerald-700 text-[15px] font-bold flex items-center justify-center hover:bg-emerald-50 transition">
                  담당자 문의
                </Link>
              </div>
            </section>

            {/* 기존 이의제기 */}
            {data.existingAppeals.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-[13px] font-bold text-slate-500 mb-3">접수 이력</p>
                <div className="space-y-2">
                  {data.existingAppeals.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-mono text-[12px] text-slate-500">{a.code}</span>
                      <Tag tone={a.status === 'DECIDED' ? 'emerald' : 'sky'}>{a.status}</Tag>
                      <span className="ml-auto text-[11.5px] text-slate-400 tabular-nums">
                        {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* 우: 보완지원 안내 */}
          <aside className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[14px] font-bold text-slate-900 mb-4">보완지원 예상 안내</p>
              {data.remedyEstimate ? (
                <dl className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <dt className="text-[12.5px] text-slate-500">보완지원 자격</dt>
                    <dd className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 산정 완료
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-[12.5px] text-slate-500">차기 후원 지원</dt>
                    <dd className="text-right">
                      <p className="text-[20px] font-extrabold text-emerald-600 tabular-nums leading-none">
                        {data.remedyEstimate.ratio ? `최대 ${data.remedyEstimate.ratio}%` : '계약별'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">{data.remedyEstimate.basis}</p>
                    </dd>
                  </div>
                  {data.remedyEstimate.estimatedAmount !== null && (
                    <div className="flex items-center justify-between">
                      <dt className="text-[12.5px] text-slate-500">최대 지원 한도</dt>
                      <dd className="text-[17px] font-extrabold text-slate-900 tabular-nums">
                        ₩{nf(data.remedyEstimate.estimatedAmount)}
                      </dd>
                    </div>
                  )}
                  {data.remedyEstimate.validMonths && (
                    <div className="flex items-center justify-between">
                      <dt className="text-[12.5px] text-slate-500">사용 기한</dt>
                      <dd className="text-[13px] font-bold text-slate-800">발급일로부터 {data.remedyEstimate.validMonths}개월</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  보완지원 자격은 최종 판정이 확정된 뒤에 산정됩니다.
                </p>
              )}

              <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Tag tone="rose">현금 환급 아님</Tag>
                  <p className="text-[12px] text-slate-500 leading-relaxed flex-1">
                    보완지원은 현금 환급이 아닌, 차기 후원 시 사용할 수 있는 지원입니다.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Tag tone="rose">양도 불가</Tag>
                  <p className="text-[12px] text-slate-500 leading-relaxed flex-1">
                    보완지원은 계약 브랜드에 한해 사용 가능하며, 타 브랜드로 양도할 수 없습니다.
                  </p>
                </div>
              </div>
            </section>

            {/* 절차 */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[14px] font-bold text-slate-900 mb-4">이의제기 · 보완지원 절차</p>
              <ol className="space-y-4">
                {data.process.map((p: any, i: number) => {
                  const I = STEP_ICON[p.code] ?? Upload;
                  return (
                    <li key={p.code} className="flex gap-3.5">
                      <span className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        i === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'
                      }`}>
                        <I className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-bold text-slate-800">{p.label}</span>
                        <span className="block text-[11.5px] text-slate-400 mt-0.5">{p.desc}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-emerald-800">공정하고 투명한 검토</p>
                  <p className="mt-1 text-[12px] text-emerald-700 leading-relaxed">
                    스폰픽은 계약서 및 제출 자료를 기반으로 공정하게 검토합니다.
                    이의가 타당하다고 판단될 경우, 보완지원이 제공됩니다.
                  </p>
                </div>
              </div>
            </section>

            <ul className="space-y-1.5 px-1">
              {data.notices.map((n: string, i: number) => (
                <li key={i} className="text-[11.5px] text-slate-400 leading-relaxed pl-3 relative">
                  <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-slate-300" />{n}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </AboutShell>
  );
}
