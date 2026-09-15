/**
 * 팬 VOTE 만들기 `/fan/vote/create` — 시안 2026-09-15 "투표 만들기"
 *
 *  유형 선택(일반 OX / 4지선다 / 경기예측 / 브랜드 설문 / 팬선정) → 대상 선수(검색, 선택) → 질문·설명
 *  → 선택지(OX 고정 · 예측형 프리셋 · 나머지 2~6개) → 마감(1일/3일/7일/직접) → 규칙 확인 → 만들기.
 *  한도와 적립 규칙은 서버가 준다(하루 5개 · 최소 1시간 뒤 마감 · 참여자당 +1P, 일 20건·투표당 50명).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Coins, Info, Loader2, Minus, Plus, Search, Vote, X } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const TYPE_DESC: Record<string, string> = {
  OX: 'O/X 한 가지 질문. 가장 빠르게 참여할 수 있어요.',
  MULTI: '2~6개 선택지 중 하나를 고르는 선호·의견 투표.',
  PREDICT: '순위·기록 범위를 맞히는 예측. 마감 후 정답을 입력하면 정답자에게 보너스가 적립돼요.',
  BRAND: '제품·협업 선호를 묻는 설문. 브랜드가 참고합니다.',
  PICK: '응원 문구·콘텐츠 등 팬이 직접 뽑는 투표.',
};
const CLOSE_PRESETS = [{ label: '1일', h: 24 }, { label: '3일', h: 72 }, { label: '7일', h: 168 }];

export default function FanVoteCreate() {
  const navigate = useNavigate();
  const [opts, setOpts] = useState<any>(null);
  const [type, setType] = useState('OX');
  const [athlete, setAthlete] = useState<any>(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [closeH, setCloseH] = useState<number | null>(72);
  const [closeCustom, setCloseCustom] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api.getFanVoteCreateOptions().then((r: any) => setOpts(r?.data || null)).catch(() => setOpts(null)); }, []);
  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { const r: any = await api.getPickAthletes({ q: q.trim(), limit: 6 }); setResults(r?.data?.athletes || []); } catch { setResults([]); } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const types: any[] = opts?.types || [];
  const rules = opts?.rules;
  const presets: string[][] = opts?.presets?.[type] || [];
  const closeAt = useMemo(() => (closeH ? new Date(Date.now() + closeH * 3600_000) : closeCustom ? new Date(closeCustom) : null), [closeH, closeCustom]);
  const needOptions = type !== 'OX';
  const filled = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = title.trim().length >= 5 && !!closeAt && (!needOptions || filled.length >= 2) && agree && !busy && (opts?.remainingToday ?? 1) > 0;

  const submit = async () => {
    if (!canSubmit || !closeAt) return;
    setBusy(true); setErr(null);
    try {
      const r: any = await api.createFanVote({ type, title: title.trim(), description: desc.trim() || undefined, options: needOptions ? filled : undefined, athleteId: athlete?.id, closeAt: closeAt.toISOString() });
      navigate(`/fan/vote/${r.data.id}`, { replace: true });
    } catch (e: any) { setErr(e?.response?.data?.error?.message || '투표를 만들지 못했습니다'); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#f3faf6] text-slate-900 pb-24">
      <PublicHeader />
      <div className="max-w-[1180px] mx-auto px-5 pt-5">
        <div className="flex items-center gap-3">
          <Link to="/fan/vote" aria-label="뒤로" className="w-9 h-9 rounded-xl border border-slate-200 bg-white inline-flex items-center justify-center text-slate-600"><ArrowLeft className="w-4 h-4" /></Link>
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
            <Link to="/fan" className="text-slate-500 hover:text-slate-700">팬 참여</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/fan/vote" className="text-slate-500 hover:text-slate-700">Fan VOTE</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">투표 만들기</span>
          </nav>
        </div>
        <h1 className="mt-5 text-[26px] sm:text-[32px] font-extrabold tracking-[-0.03em]">투표 만들기</h1>
        <p className="mt-1.5 text-[13.5px] text-slate-600 break-keep">관심 선수, 경기 예측, 브랜드 설문 등 팬이 직접 투표를 열 수 있어요. 다른 팬이 참여하면 팬포인트가 적립됩니다.</p>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div className="space-y-3">
            <Field n={1} label="투표 유형">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {types.map((t: any) => (
                  <button key={t.code} onClick={() => { setType(t.code); setOptions(t.code === 'OX' ? ['', ''] : ['', '']); }} aria-pressed={type === t.code} className={`rounded-xl border p-3 text-left ${type === t.code ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                    <span className="block text-[13.5px] font-extrabold">{t.label}</span>
                    <span className="block mt-0.5 text-[11.5px] text-slate-500">{t.desc}</span>
                    <span className="block mt-1 text-[11.5px] font-bold text-emerald-700 inline-flex items-center gap-1"><Coins className="w-3 h-3" /> 참여 {t.earn}P{t.correctBonus ? ` · 정답 +${t.correctBonus}P` : ''}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[12.5px] text-slate-600 break-keep">{TYPE_DESC[type]}</p>
            </Field>

            <Field n={2} label="대상 선수" hint="(선택 · 지정하면 팬온도에 반영)">
              {athlete ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                  <span className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100">{athlete.profileImageUrl && <img src={athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[14px] font-extrabold">{athlete.name} 프로</span><span className="block text-[12px] text-slate-500">{[athlete.tour, athlete.region?.split(' ')[0]].filter(Boolean).join(' · ')}</span></span>
                  <button onClick={() => setAthlete(null)} aria-label="선수 해제" className="w-8 h-8 rounded-full text-slate-500 hover:bg-white inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-slate-200 bg-white focus-within:border-emerald-400">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="선수 이름으로 검색" className="flex-1 min-w-0 text-[13.5px] outline-none bg-transparent" />
                    {searching && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                  </label>
                  {results.length > 0 && (
                    <ul className="mt-2 grid sm:grid-cols-2 gap-1.5">
                      {results.map((a: any) => (
                        <li key={a.id}>
                          <button onClick={() => { setAthlete(a); setQ(''); setResults([]); }} className="w-full flex items-center gap-2.5 rounded-xl border border-slate-100 px-2.5 py-2 text-left hover:border-emerald-300">
                            <span className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0">{a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}</span>
                            <span className="min-w-0"><span className="block text-[13px] font-bold truncate">{a.name} 프로</span><span className="block text-[11.5px] text-slate-500 truncate">{[a.tour, a.region?.split(' ')[0]].filter(Boolean).join(' · ')}</span></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Field>

            <Field n={3} label="질문" hint={`(5~${rules?.titleMax ?? 80}자)`}>
              <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, rules?.titleMax ?? 80))} placeholder={type === 'PREDICT' ? '예) 배진리 프로의 이번 대회 TOP10 진입, 가능할까요?' : '예) 염도웅 프로에게 가장 기대되는 장면은?'} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[14.5px] font-bold focus:outline-none focus:border-emerald-400" />
              <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 300))} rows={2} placeholder="설명 (선택, 300자)" className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13px] focus:outline-none focus:border-emerald-400 resize-none" />
            </Field>

            <Field n={4} label="선택지" hint={type === 'OX' ? '(O / X 고정)' : `(${rules?.minOptions ?? 2}~${rules?.maxOptions ?? 6}개)`}>
              {type === 'OX' ? (
                <div className="grid grid-cols-2 gap-2">{['O', 'X'].map((o) => <span key={o} className="h-12 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center text-[18px] font-extrabold text-slate-700">{o}</span>)}</div>
              ) : (
                <div>
                  {presets.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className="text-[12px] text-slate-500 self-center">프리셋</span>
                      {presets.map((p) => <button key={p.join('|')} onClick={() => setOptions([...p])} className="h-8 px-3 rounded-full border border-slate-200 bg-white text-[12px] font-bold text-slate-700 hover:border-emerald-300">{p.join(' / ')}</button>)}
                    </div>
                  )}
                  <div className="space-y-2">
                    {options.map((o, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-slate-100 text-[12px] font-bold text-slate-600 inline-flex items-center justify-center shrink-0">{i + 1}</span>
                        <input value={o} onChange={(e) => setOptions((arr) => arr.map((x, j) => (j === i ? e.target.value.slice(0, 30) : x)))} placeholder={`선택지 ${i + 1}`} className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-[13.5px] focus:outline-none focus:border-emerald-400" />
                        <button onClick={() => setOptions((arr) => arr.filter((_, j) => j !== i))} disabled={options.length <= (rules?.minOptions ?? 2)} aria-label="선택지 삭제" className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 inline-flex items-center justify-center disabled:opacity-30"><Minus className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  {options.length < (rules?.maxOptions ?? 6) && (
                    <button onClick={() => setOptions((arr) => [...arr, ''])} className="mt-2 h-10 px-3.5 rounded-xl border border-dashed border-slate-300 text-[12.5px] font-bold text-slate-600 inline-flex items-center gap-1.5 hover:border-emerald-400"><Plus className="w-4 h-4" /> 선택지 추가</button>
                  )}
                </div>
              )}
            </Field>

            <Field n={5} label="마감 시간" hint={`(최소 ${rules?.minCloseHours ?? 1}시간 · 최대 ${rules?.maxCloseDays ?? 30}일)`}>
              <div className="flex flex-wrap gap-2">
                {CLOSE_PRESETS.map((p) => <button key={p.h} onClick={() => { setCloseH(p.h); setCloseCustom(''); }} aria-pressed={closeH === p.h} className={`h-10 px-4 rounded-xl border text-[13px] font-bold ${closeH === p.h ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}>{p.label} 뒤</button>)}
                <input type="datetime-local" value={closeCustom} onChange={(e) => { setCloseCustom(e.target.value); setCloseH(null); }} className={`h-10 px-3 rounded-xl border text-[13px] font-bold bg-white ${closeH === null && closeCustom ? 'border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-700'}`} />
              </div>
              {closeAt && <p className="mt-2 text-[12.5px] text-slate-600">마감: <b>{closeAt.toLocaleString('ko-KR')}</b>{type === 'PREDICT' && ' · 마감 후 정답을 입력해야 정답자에게 보너스가 적립됩니다'}</p>}
            </Field>

            <label className="flex items-start gap-2.5 rounded-2xl bg-white border border-slate-200 p-4 text-[13px] text-slate-700 break-keep cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600" />
              <span>1인 1표 원칙과 커뮤니티 기준(연락처·금전 요구·비방 금지)을 지킵니다. 예측형은 마감 후 공식 기록을 기준으로 정답을 입력합니다.</span>
            </label>
            {err && <p className="text-[13px] font-bold text-rose-600 break-keep">{err}</p>}
          </div>

          {/* 우측: 미리보기 · 규칙 */}
          <aside className="space-y-3 lg:sticky lg:top-20">
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[13px] font-bold text-slate-500">미리보기</p>
              <div className="mt-2 flex items-start gap-3">
                <span className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-50 text-emerald-500 inline-flex items-center justify-center shrink-0">{athlete?.profileImageUrl ? <img src={athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" /> : <Vote className="w-5 h-5" />}</span>
                <div className="min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">{types.find((t: any) => t.code === type)?.label || type}</span>
                  <p className="mt-1 text-[14px] font-extrabold break-keep">{title.trim() || '질문이 여기에 표시됩니다'}</p>
                  <p className="text-[12px] text-slate-500">{athlete ? `${athlete.name} 프로 · ` : ''}{closeAt ? `${closeAt.toLocaleDateString('ko-KR')} 마감` : '마감 미정'}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {(type === 'OX' ? ['O', 'X'] : filled.length ? filled : ['선택지 1', '선택지 2']).map((o, i) => <li key={i} className="h-9 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[13px] font-bold inline-flex items-center w-full">{o}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-4 text-[12.5px] text-slate-700 space-y-2">
              <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5"><Info className="w-4 h-4 text-emerald-600" /> 만들기 규칙</p>
              <p className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" /> 오늘 만들 수 있는 투표 <b className="tabular-nums">{opts ? `${opts.remainingToday}/${rules?.maxDailyCreates}` : '—'}</b>개</p>
              <p className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" /> 다른 팬이 참여할 때마다 <b>+{opts?.hostRule?.points ?? 1}P</b> 적립 ({opts?.hostRule?.limit ?? '일 20건 · 투표당 50명'})</p>
              <p className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" /> 내가 만든 투표에는 내가 참여할 수 없어요</p>
              <p className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" /> 참여자가 생기면 취소할 수 없고, 결과는 종료 후 공개돼요</p>
            </div>
            <button onClick={submit} disabled={!canSubmit} className="hidden lg:inline-flex w-full h-12 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold items-center justify-center gap-1.5 hover:bg-emerald-700 disabled:opacity-40">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 투표 만들기
            </button>
          </aside>
        </div>
      </div>

      <div className="lg:hidden fixed inset-x-0 bottom-14 z-30 bg-white border-t border-slate-200 px-4 py-2.5">
        <button onClick={submit} disabled={!canSubmit} className="w-full h-12 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 투표 만들기
        </button>
      </div>
    </div>
  );
}

/* 컴포넌트 밖에 둔다 — 안에서 정의하면 렌더마다 새 타입이 되어 입력 중 포커스가 끊긴다 */
function Field({ n, label, hint, children }: { n: number; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[12px] font-extrabold inline-flex items-center justify-center">{n}</span>
        <p className="text-[15px] font-extrabold">{label}</p>
        {hint && <p className="text-[12px] text-slate-500 ml-1">{hint}</p>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
