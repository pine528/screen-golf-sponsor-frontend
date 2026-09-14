/**
 * F14 브랜드 추천 — 접수 · 상태 (핸드오프 §9.1)
 * 이해관계 자가표시를 건너뛸 수 없게 하고, 추천이 계약을 보장하지 않는다는 점을 명시한다.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lightbulb, Check, CheckCircle2, AlertCircle, Lock, Globe } from 'lucide-react';
import { api } from '../../services/api';
import {
  Card, Chip, AthleteAvatar, Notice, PrimaryButton, Skeleton, EmptyState,
} from '../../components/fanhub/FanKit';

/** 파이프라인 진행 표시 */
function Pipeline({ stages, index }: { stages: any[]; index: number }) {
  if (index < 0) return null;
  return (
    <div className="flex items-center">
      {stages.map((s, i) => (
        <div key={s.code} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              i <= index ? 'bg-slate-900' : 'bg-slate-200'
            }`}>
              {i < index && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              {i === index && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <span className={`mt-1.5 text-[12.5px] whitespace-nowrap ${
              i <= index ? 'font-bold text-slate-700' : 'text-slate-500'
            }`}>{s.label}</span>
          </div>
          {i < stages.length - 1 && (
            <span className={`flex-1 h-px mx-1 -mt-4 ${i < index ? 'bg-slate-900' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function FanBrandSuggest() {
  const { athleteId = '' } = useParams();
  const nav = useNavigate();
  const [opts, setOpts] = useState<any>(null);
  const [athlete, setAthlete] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [mine, setMine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState('');
  const [brandName, setBrandName] = useState('');
  const [reason, setReason] = useState('');
  const [interest, setInterest] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getBrandSuggestOptions().then((r) => setOpts(r.data)).catch(() => null),
      athleteId ? api.getFanTemperature(athleteId).then((r) => setAthlete(r.data?.athlete)).catch(() => null) : null,
      athleteId ? api.getAthleteBrandSuggestSummary(athleteId).then((r) => setSummary(r.data)).catch(() => null) : null,
      api.getMyBrandSuggestions().then((r) => setMine(r.data)).catch(() => null),
    ]).finally(() => setLoading(false));
  }, [athleteId]);

  const submit = async () => {
    setSending(true); setError(null);
    try {
      const r = await api.createBrandSuggestion(athleteId, { category, brandName, reason, interest, isPublic });
      setDone(r.data);
    } catch (e: any) {
      if (e?.response?.status === 401) { nav(`/fan/login?redirect=/fan/brand-suggest/${athleteId}`); return; }
      setError(e?.response?.data?.error?.message || '추천을 보내지 못했습니다');
    } finally { setSending(false); }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 space-y-4"><Skeleton className="h-[120px]" /><Skeleton className="h-[320px]" /></div>;
  }

  /* 접수 완료 */
  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-3xl bg-emerald-50 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">추천이 접수됐습니다</h1>
        <p className="mt-3 text-[14px] text-slate-500 leading-relaxed whitespace-pre-line">
          {done.reviewRequired
            ? '이해관계가 표시된 추천은 운영팀 검토 후 전달됩니다.\n검토 전에는 포인트가 적립되지 않습니다.'
            : '운영팀 검토를 거쳐 브랜드에 익명으로 전달됩니다.'}
        </p>
        {done.point?.earned > 0 && (
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2">
            <span className="text-[13px] font-bold text-emerald-700">팬포인트 +{done.point.earned}P 적립 예정</span>
          </div>
        )}
        <p className="mt-4 text-[12px] text-slate-500">이번 달 남은 추천 {done.remaining}건</p>
        <div className="mt-8 flex gap-2 justify-center">
          <Link to="/fan/activity" className="h-11 px-5 rounded-2xl bg-slate-100 text-slate-700 text-[14px] font-bold flex items-center hover:bg-slate-200 transition">
            내 팬활동
          </Link>
          <Link to={`/fan/community/${athleteId}`} className="h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold flex items-center hover:bg-slate-800 transition">
            커뮤니티로
          </Link>
        </div>
      </div>
    );
  }

  const len = reason.trim().length;
  const min = opts?.reason?.min ?? 50;
  const max = opts?.reason?.max ?? 500;
  const exhausted = opts?.quota && opts.quota.remaining <= 0;
  const valid = !!category && !!interest && len >= min && len <= max && !exhausted;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to={athleteId ? `/fan/community/${athleteId}` : '/fan'}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 돌아가기
      </Link>

      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">브랜드 추천</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {opts?.quota ? `이번 달 ${opts.quota.remaining}/${opts.quota.limit}건 남음` : '월 3건까지 추천할 수 있습니다'}
          </p>
        </div>
      </div>

      {athlete && (
        <Card className="p-4 mb-4 flex items-center gap-3.5">
          <AthleteAvatar athlete={athlete} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-slate-900">{athlete.name}</p>
            <p className="text-[12px] text-slate-500">{athlete.tour || athlete.sportType || '선수'}</p>
          </div>
          {summary?.total > 0 && <Chip size="xs">누적 추천 {summary.total}건</Chip>}
        </Card>
      )}

      {exhausted && (
        <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-amber-700 leading-relaxed">
            이번 달 추천을 모두 사용했습니다. 다음 달 1일에 다시 추천할 수 있어요.
          </p>
        </div>
      )}

      {/* 카테고리 */}
      <Card className="p-5 mb-3">
        <p className="text-[13px] font-bold text-slate-500 mb-3">어떤 분야의 브랜드인가요</p>
        <div className="flex flex-wrap gap-2">
          {opts?.categories?.map((c: string) => (
            <button key={c} onClick={() => setCategory(c)} disabled={exhausted}
              className={`h-9 px-3.5 rounded-full text-[13px] font-semibold transition border ${
                category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </Card>

      {/* 브랜드명 · 이유 */}
      <Card className="p-5 mb-3">
        <p className="text-[13px] font-bold text-slate-500 mb-3">브랜드명 (선택)</p>
        <input value={brandName} onChange={(e) => setBrandName(e.target.value.slice(0, 60))}
          placeholder="예: 브랜드 이름 또는 제품명" disabled={exhausted}
          className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[14px] placeholder:text-slate-300 focus:outline-none focus:border-slate-300 mb-5" />

        <p className="text-[13px] font-bold text-slate-500 mb-3">추천 이유</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, max))}
          placeholder={`이 선수와 브랜드가 왜 어울리는지 알려주세요.\n제품 특성과 선수의 이미지·활동을 연결해서 써주시면 브랜드가 검토하기 좋습니다.`}
          rows={6} disabled={exhausted}
          className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-[14px] text-slate-700 leading-relaxed placeholder:text-slate-300 resize-none focus:outline-none focus:border-slate-300" />
        <p className={`mt-2 text-[12px] font-semibold tabular-nums ${
          len >= min ? 'text-emerald-600' : 'text-slate-500'
        }`}>
          {len} / {max}자 {len < min && `(최소 ${min}자)`}
        </p>
      </Card>

      {/* 이해관계 — 건너뛸 수 없다 */}
      <Card className="p-5 mb-3">
        <p className="text-[13px] font-bold text-slate-500 mb-1">이 브랜드와 관계가 있나요</p>
        <p className="text-[12px] text-slate-500 mb-3">공정한 검토를 위해 반드시 표시해주세요.</p>
        <div className="space-y-2">
          {opts?.interests?.map((i: any) => (
            <button key={i.code} onClick={() => setInterest(i.code)} disabled={exhausted}
              className={`w-full text-left rounded-2xl border px-4 py-3 transition flex items-start gap-3 ${
                interest === i.code ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
              <span className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                interest === i.code ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
              }`}>
                {interest === i.code && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold text-slate-900">{i.label}</span>
                <span className="block text-[12px] text-slate-500 mt-0.5">{i.desc}</span>
              </span>
            </button>
          ))}
        </div>
        {interest && interest !== 'NONE' && (
          <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-700 leading-relaxed">
              이해관계가 있는 추천은 운영팀 검토를 거친 뒤에야 브랜드에 전달되며, 검토 전에는 포인트가 적립되지 않습니다.
            </p>
          </div>
        )}
      </Card>

      {/* 공개 범위 */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { v: false, icon: Lock, label: '비공개 (기본)', desc: '운영팀과 브랜드만 확인' },
          { v: true, icon: Globe, label: '요약 공개 동의', desc: '승인된 요약만 커뮤니티에 표시' },
        ].map((o) => {
          const I = o.icon;
          return (
            <button key={String(o.v)} onClick={() => setIsPublic(o.v)} disabled={exhausted}
              className={`rounded-2xl border p-4 text-left transition ${
                isPublic === o.v ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
              <I className={`w-4 h-4 mb-2 ${isPublic === o.v ? 'text-slate-900' : 'text-slate-500'}`} />
              <p className="text-[13px] font-bold text-slate-900">{o.label}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{o.desc}</p>
            </button>
          );
        })}
      </div>

      {error && <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}

      <div className="mb-6">
        <PrimaryButton full disabled={!valid || sending} onClick={submit}>
          {sending ? '보내는 중…' : '브랜드 추천하기'}
        </PrimaryButton>
      </div>

      {opts?.notices && <Notice title="추천 전 확인해주세요" items={opts.notices} />}

      {/* 내 추천 현황 */}
      <section className="mt-8">
        <h2 className="text-[15px] font-bold text-slate-900 mb-3">내 추천 현황</h2>
        {mine?.suggestions?.length ? (
          <div className="space-y-2.5">
            {mine.suggestions.map((s: any) => (
              <Card key={s.id} className="p-4">
                <div className="flex items-center gap-3 mb-3.5">
                  {s.athlete && <AthleteAvatar athlete={s.athlete} size={34} />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-slate-900 truncate">{s.brandName || s.category}</p>
                    <p className="text-[12px] text-slate-500">
                      {s.athlete?.name} · {new Date(s.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <Chip size="xs" tone={s.status === 'ADOPTED' ? 'emerald' : s.stageIndex < 0 ? 'slate' : 'sky'}>
                    {s.statusLabel}
                  </Chip>
                </div>
                {s.stageIndex >= 0
                  ? <Pipeline stages={mine.pipeline} index={s.stageIndex} />
                  : <p className="text-[12px] text-slate-500">{s.statusNote || '운영팀 판단으로 진행이 종료되었습니다.'}</p>}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Lightbulb className="w-5 h-5" />} title="아직 추천한 브랜드가 없습니다"
            desc={'선수에게 어울리는 브랜드를 알려주시면\n운영팀이 검토해 브랜드에 전달합니다.'} />
        )}
      </section>
    </div>
  );
}
