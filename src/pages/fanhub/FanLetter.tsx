/**
 * F06 응원편지 작성 (핸드오프 §9.2 · §10.2)
 * 월 2통 제한, AutoMod 검수, 공개 범위 선택. 선수의 개별 답장 의무는 없다는 점을 미리 알린다.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Globe, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import {
  Card, AthleteAvatar, Notice, PrimaryButton, StickyCTA, Skeleton,
} from '../../components/fanhub/FanKit';

const MIN = 50;
const MAX = 500;

export default function FanLetter() {
  const { athleteId = '' } = useParams();
  const nav = useNavigate();
  const [athlete, setAthlete] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getFanTemperature(athleteId).then((r) => setAthlete(r.data?.athlete)).catch(() => null),
      api.getLetterQuota().then((r) => setQuota(r.data)).catch(() => setQuota(null)),
    ]).finally(() => setLoading(false));
  }, [athleteId]);

  const send = async () => {
    setSending(true); setError(null);
    try {
      const r = await api.sendFanLetter(athleteId, { title: title || undefined, content, isPublic });
      setResult(r.data);
    } catch (e: any) {
      if (e?.response?.status === 401) { nav(`/fan/login?redirect=/fan/letter/${athleteId}`); return; }
      setError(e?.response?.data?.error?.message || '편지를 보내지 못했습니다');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 space-y-4"><Skeleton className="h-[120px]" /><Skeleton className="h-[300px]" /></div>;
  }

  /* 발송 완료 */
  if (result) {
    const pending = result.moderation?.status === 'PENDING';
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className={`mx-auto w-14 h-14 rounded-3xl flex items-center justify-center mb-5 ${
          pending ? 'bg-amber-50' : 'bg-emerald-50'
        }`}>
          {pending ? <AlertCircle className="w-6 h-6 text-amber-500" /> : <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
        </div>
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">
          {pending ? '편지가 검토 대기 중입니다' : '응원 편지를 보냈습니다'}
        </h1>
        <p className="mt-3 text-[14px] text-slate-500 leading-relaxed whitespace-pre-line">
          {pending
            ? `${result.moderation.note}\n운영팀 확인 후 전달되며, 검토 중에는 팬온도와 포인트에 반영되지 않습니다.`
            : `${athlete?.name || '선수'}님에게 마음이 전달됐습니다.\n선수는 월 1회 감사 메시지로 답할 수 있습니다.`}
        </p>
        {!pending && result.point?.earned > 0 && (
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2">
            <span className="text-[13px] font-bold text-emerald-700">팬포인트 +{result.point.earned}P 적립 예정</span>
          </div>
        )}
        <p className="mt-4 text-[12px] text-slate-500">이번 달 남은 편지 {result.remaining}통</p>
        <div className="mt-8 flex gap-2 justify-center">
          <Link to="/fan" className="h-11 px-5 rounded-2xl bg-slate-100 text-slate-700 text-[14px] font-bold flex items-center hover:bg-slate-200 transition">
            팬 참여 홈
          </Link>
          <Link to={`/fan/temperature/${athleteId}`} className="h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold flex items-center hover:bg-slate-800 transition">
            팬온도 보기
          </Link>
        </div>
      </div>
    );
  }

  const len = content.trim().length;
  const exhausted = quota && quota.remaining <= 0;
  const valid = len >= MIN && len <= MAX && !exhausted;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to={`/fan/temperature/${athleteId}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 돌아가기
      </Link>

      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-[-0.02em]">응원 편지 쓰기</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {quota ? `이번 달 ${quota.remaining}/${quota.limit}통 남음` : '월 2통까지 보낼 수 있습니다'}
          </p>
        </div>
      </div>

      {athlete && (
        <Card className="p-4 mb-4 flex items-center gap-3.5">
          <AthleteAvatar athlete={athlete} size={44} />
          <div>
            <p className="text-[15px] font-bold text-slate-900">{athlete.name}</p>
            <p className="text-[12px] text-slate-500">{athlete.tour || athlete.sportType || '선수'}</p>
          </div>
        </Card>
      )}

      {exhausted && (
        <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-amber-700 leading-relaxed">
            이번 달 편지를 모두 보냈습니다. 다음 달 1일에 다시 보낼 수 있어요.
          </p>
        </div>
      )}

      <Card className="p-5 mb-4">
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 50))}
          placeholder="제목 (선택)" disabled={exhausted}
          className="w-full text-[16px] font-bold text-slate-900 placeholder:text-slate-300 border-0 border-b border-slate-100 pb-3 mb-4 focus:outline-none focus:border-slate-300 disabled:bg-transparent" />
        <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, MAX))}
          placeholder={`선수에게 전하고 싶은 응원을 남겨주세요.\n\n연락처, 만남 요청, 금전 요구는 보낼 수 없습니다.`}
          rows={9} disabled={exhausted}
          className="w-full text-[15px] text-slate-700 leading-relaxed placeholder:text-slate-300 border-0 resize-none focus:outline-none disabled:bg-transparent" />
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className={`text-[12px] font-semibold tabular-nums ${
            len > MAX ? 'text-rose-500' : len >= MIN ? 'text-emerald-600' : 'text-slate-500'
          }`}>
            {len} / {MAX}자 {len < MIN && `(최소 ${MIN}자)`}
          </span>
        </div>
      </Card>

      {/* 공개 범위 */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { v: true, icon: Globe, label: '공개', desc: '팬 커뮤니티에 함께 표시' },
          { v: false, icon: Lock, label: '비공개', desc: '선수에게만 전달' },
        ].map((o) => {
          const I = o.icon;
          return (
            <button key={String(o.v)} onClick={() => setIsPublic(o.v)} disabled={exhausted}
              className={`rounded-2xl border p-4 text-left transition ${
                isPublic === o.v ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
              <I className={`w-4 h-4 mb-2 ${isPublic === o.v ? 'text-slate-900' : 'text-slate-500'}`} />
              <p className="text-[14px] font-bold text-slate-900">{o.label}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{o.desc}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>
      )}

      <Notice title="편지 작성 안내" items={[
        '선수의 개별 답장은 의무가 아니며, 월 1회 감사 메시지로 갈음할 수 있습니다.',
        '연락처·계좌·외부 메신저 요청, 만남 요구, 금전 요구가 포함되면 자동으로 검토 대기 상태가 됩니다.',
        '검토 대기 중인 편지는 팬온도와 포인트에 반영되지 않습니다.',
      ]} />

      <div className="mt-5">
        <StickyCTA>
          <div className="max-w-2xl mx-auto">
            <PrimaryButton full disabled={!valid || sending} onClick={send}>
              {sending ? '보내는 중…' : '응원 편지 보내기'}
            </PrimaryButton>
          </div>
        </StickyCTA>
      </div>
    </div>
  );
}
