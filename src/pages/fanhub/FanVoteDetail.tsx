/**
 * F03 VOTE 상세·참여 + F04 완료·결과 (핸드오프 §5)
 * 한 화면에서 상태만 바뀐다: 미참여 → 참여완료(집계 중) → 결과 확정.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, Lock, Trophy, Users, AlertCircle, Thermometer, CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Card, Chip, Countdown, AthleteAvatar, Notice, Skeleton, PrimaryButton,
  StickyCTA, TempBar, nf,
} from '../../components/fanhub/FanKit';

export default function FanVoteDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [vote, setVote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [earned, setEarned] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api.getFanVote(id)
      .then((r) => { setVote(r.data); setPicked(r.data?.myAnswer ?? null); })
      .catch((e) => setError(e?.response?.data?.error?.message || '투표를 불러오지 못했습니다'))
      .finally(() => setLoading(false));

  useEffect(() => { setLoading(true); load(); }, [id]);

  const submit = async () => {
    if (!picked) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await api.submitFanBallot(id, picked);
      setVote(r.data.vote);
      setEarned(r.data.point);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || '투표에 실패했습니다';
      if (e?.response?.status === 401) { nav(`/fan/login?redirect=/fan/vote/${id}`); return; }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <Skeleton className="h-8 w-40" /><Skeleton className="h-[180px]" /><Skeleton className="h-[220px]" />
      </div>
    );
  }
  if (!vote) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500">{error || '투표를 찾을 수 없습니다'}</p>
        <Link to="/fan/vote" className="inline-block mt-4 text-[14px] font-bold text-slate-900">목록으로</Link>
      </div>
    );
  }

  const voted = vote.voted;
  const canChange = vote.changeable && voted;
  const results = vote.results as any[] | null;
  const topCount = results ? Math.max(...results.map((r) => r.count), 1) : 1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan/vote" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-400 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬 투표
      </Link>

      {/* 방금 참여했을 때의 확인 배너 (F04) */}
      {earned && (
        <div className="mb-5 rounded-3xl bg-slate-900 px-5 py-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-white">참여가 완료됐습니다</p>
            <p className="text-[12px] text-white/60 mt-0.5">
              {earned.earned > 0
                ? `팬포인트 ${earned.earned}P가 적립 예정입니다. 결과 확정 후 사용할 수 있어요.`
                : earned.reason === 'DAILY_CAP'
                  ? '오늘 적립 한도를 채웠습니다. 참여 기록은 팬온도에 반영됩니다.'
                  : '참여 기록이 팬온도에 반영됩니다.'}
            </p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Chip size="xs" tone="violet">{vote.typeLabel}</Chip>
          <Countdown ms={vote.remainMs} closed={vote.closed} />
          {voted && <Chip size="xs" tone="emerald">참여함</Chip>}
        </div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-slate-900 leading-snug tracking-[-0.02em]">
          {vote.title}
        </h1>
        {vote.description && <p className="mt-2.5 text-[14px] text-slate-500 leading-relaxed">{vote.description}</p>}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-slate-400">
          <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{nf(vote.participants)}명 참여</span>
          <span>
            {new Date(vote.closeAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 마감
          </span>
        </div>
      </div>

      {/* 대상 선수 */}
      {vote.athlete && (
        <Card className="p-4 mb-4">
          <Link to={`/athletes/${vote.athlete.id}`} className="flex items-center gap-3.5">
            <AthleteAvatar athlete={vote.athlete} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-slate-900">{vote.athlete.name}</p>
              <p className="text-[12px] text-slate-400">
                {[vote.athlete.tour, vote.athlete.region].filter(Boolean).join(' · ') || vote.athlete.sportType}
              </p>
            </div>
          </Link>
          {vote.temperature && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[12px] font-semibold text-slate-500">팬온도</span>
              </div>
              <TempBar score={vote.temperature.score} tier={vote.temperature.tier?.label} lowSample={vote.temperature.lowSample} />
            </div>
          )}
          {vote.recentSummary && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex gap-6">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">최근 평균 순위</p>
                <p className="text-[17px] font-extrabold text-slate-900 tabular-nums">{vote.recentSummary.avgRank}위</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">최근 Top 10</p>
                <p className="text-[17px] font-extrabold text-slate-900 tabular-nums">{vote.recentSummary.top10}회</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 선택지 / 결과 */}
      <Card className="p-5 mb-4">
        <p className="text-[13px] font-bold text-slate-500 mb-3.5">
          {results ? '투표 결과' : voted ? '내 선택' : '선택해주세요'}
        </p>
        <div className="space-y-2">
          {vote.options.map((opt: string) => {
            const res = results?.find((r) => r.label === opt);
            const mine = (voted ? vote.myAnswer : picked) === opt;
            const correct = vote.correctAnswer && vote.correctAnswer === opt;
            const selectable = !vote.closed && (!voted || canChange);

            return (
              <button key={opt} disabled={!selectable}
                onClick={() => selectable && setPicked(opt)}
                className={`relative w-full text-left rounded-2xl border px-4 py-3.5 transition overflow-hidden ${
                  correct ? 'border-emerald-300 bg-emerald-50/40'
                  : mine ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white'
                } ${selectable ? 'hover:border-slate-400 cursor-pointer' : 'cursor-default'}`}>
                {res && (
                  <span className="absolute inset-y-0 left-0 bg-slate-100/70 transition-[width] duration-700"
                    style={{ width: `${(res.count / topCount) * 100}%` }} />
                )}
                <span className="relative flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    mine ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                  }`}>
                    {mine && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className={`text-[15px] flex-1 ${mine || correct ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                    {opt}
                  </span>
                  {correct && <Chip size="xs" tone="emerald"><Trophy className="w-3 h-3" />정답</Chip>}
                  {res && (
                    <span className="text-[13px] font-extrabold text-slate-900 tabular-nums shrink-0">
                      {res.percent}%
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* 결과 비공개 사유 */}
        {vote.resultHidden && (
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-[12px] text-slate-500 leading-relaxed">{vote.resultHiddenReason}</p>
          </div>
        )}

        {/* 예측형 정답 대기 */}
        {voted && vote.correctBonus > 0 && !vote.correctAnswer && (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-700 leading-relaxed">
              공식 기록으로 결과가 확정되면 정답 보상 {vote.correctBonus}P가 지급됩니다. 확정 전에는 포인트가 적립 예정 상태로 표시됩니다.
            </p>
          </div>
        )}

        {vote.myCorrect === true && (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[13px] font-bold text-emerald-700">예측에 성공했습니다 · +{vote.correctBonus}P</p>
          </div>
        )}
      </Card>

      {/* 참여 안내 */}
      <div className="space-y-2 mb-6">
        {vote.guides?.map((g: any, i: number) => (
          <div key={i} className="flex items-start gap-2.5 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-[7px] shrink-0" />
            <p className="text-[12px] text-slate-500 leading-relaxed">
              <b className="text-slate-700">{g.title}</b> · {g.desc}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>
      )}

      {!vote.closed && (!voted || canChange) && (
        <StickyCTA>
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {picked && (
              <span className="hidden sm:block text-[13px] text-slate-500 shrink-0">
                선택: <b className="text-slate-900">{picked}</b>
              </span>
            )}
            <div className="flex-1">
              <PrimaryButton full disabled={!picked || submitting || picked === vote.myAnswer} onClick={submit}>
                {submitting ? '제출 중…' : canChange ? '선택 변경하기' : `투표하고 ${vote.earnPoints}P 받기`}
              </PrimaryButton>
            </div>
          </div>
        </StickyCTA>
      )}

      {vote.closed && (
        <Notice title="종료된 투표" items={['종료된 투표는 참여할 수 없습니다. 결과는 공식 기록 확정 후 갱신될 수 있습니다.']} />
      )}
    </div>
  );
}
