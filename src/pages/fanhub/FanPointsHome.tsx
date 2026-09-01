/**
 * F09 팬포인트 홈 (핸드오프 §7)
 * 잔액·적립예정·소멸예정·사용가능을 분리해 보여준다 (§18.3).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, ChevronRight, Award, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { Card, Chip, Notice, Skeleton, EmptyState, nf } from '../../components/fanhub/FanKit';

const KIND_TONE: Record<string, string> = {
  EARN: 'text-emerald-600', PENDING: 'text-slate-400',
  SPEND: 'text-slate-900', EXPIRE: 'text-slate-400', REVERSE: 'text-rose-500',
};

export default function FanPointsHome() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyFanPoints()
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-[180px]" /><Skeleton className="h-[220px]" /><Skeleton className="h-[200px]" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <EmptyState title="팬포인트를 불러오지 못했습니다" desc="로그인 후 다시 시도해주세요." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-400 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬 참여
      </Link>

      {/* 잔액 */}
      <div className="relative overflow-hidden rounded-[28px] bg-slate-900 px-6 py-7 mb-3">
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)' }} />
        <div className="relative">
          <p className="text-[12px] font-semibold text-white/50 mb-2">사용 가능한 팬포인트</p>
          <p className="text-[42px] font-extrabold text-white tabular-nums leading-none tracking-[-0.03em]">
            {nf(data.balance)}<span className="text-[20px] text-white/50 ml-1.5">P</span>
          </p>
          <div className="mt-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[12px] font-bold text-white">{data.badge?.label}</span>
            </span>
            {data.nextBadge && (
              <span className="text-[12px] text-white/50">
                {data.nextBadge.label}까지 {nf(data.nextBadge.remaining)}P
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 상태 분리 */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Card className="px-3.5 py-4">
          <p className="text-[11px] font-semibold text-slate-400 mb-1.5">적립 예정</p>
          <p className="text-[19px] font-extrabold text-slate-900 tabular-nums leading-none">{nf(data.pending)}P</p>
          <p className="text-[11px] text-slate-400 mt-1.5">{data.pendingCount}건 확정 대기</p>
        </Card>
        <Card className="px-3.5 py-4">
          <p className="text-[11px] font-semibold text-slate-400 mb-1.5">이번 달 적립</p>
          <p className="text-[19px] font-extrabold text-slate-900 tabular-nums leading-none">{nf(data.monthEarned)}P</p>
          <p className="text-[11px] text-slate-400 mt-1.5">확정 기준</p>
        </Card>
        <Card className={`px-3.5 py-4 ${data.expiringSoon > 0 ? 'border-amber-200 bg-amber-50/50' : ''}`}>
          <p className={`text-[11px] font-semibold mb-1.5 ${data.expiringSoon > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            30일 내 소멸
          </p>
          <p className={`text-[19px] font-extrabold tabular-nums leading-none ${data.expiringSoon > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {nf(data.expiringSoon)}P
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5">유효기간 12개월</p>
        </Card>
      </div>

      {/* 소멸 예정 일정 */}
      {data.expirySchedule?.length > 0 && (
        <Card className="p-5 mb-6 border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[13px] font-bold text-amber-700">곧 소멸되는 포인트</span>
          </div>
          <div className="space-y-2">
            {data.expirySchedule.map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500">
                  {new Date(e.expiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="text-[13px] font-bold text-amber-700 tabular-nums">{nf(e.amount)}P</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 적립 방법 — 미션처럼 */}
      <section className="mb-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-3">포인트 모으는 방법</h2>
        <Card className="divide-y divide-slate-100">
          {data.earnRules?.map((r: any) => (
            <div key={r.code} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-slate-800">{r.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{r.limit}</p>
              </div>
              <span className="shrink-0 text-[13px] font-extrabold text-emerald-600 tabular-nums">
                {r.rate ? `${r.rate * 100}%` : `+${r.points}P`}
              </span>
            </div>
          ))}
        </Card>
      </section>

      {/* 사용처 */}
      <section className="mb-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-3">포인트 사용처</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {data.spendRules?.map((r: any) => (
            <Card key={r.code} className={`p-4 ${r.available ? '' : 'bg-slate-50/60'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {!r.available && <Lock className="w-3 h-3 text-slate-300" />}
                <p className={`text-[13px] font-bold ${r.available ? 'text-slate-900' : 'text-slate-400'}`}>{r.label}</p>
                {r.available && <Chip size="xs" tone="emerald">사용 가능</Chip>}
              </div>
              <p className="text-[12px] text-slate-400 leading-relaxed">{r.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 최근 내역 */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-slate-900">최근 내역</h2>
          <Link to="/fan/points/ledger" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-0.5">
            전체보기 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {data.recent?.length ? (
          <Card className="divide-y divide-slate-100">
            {data.recent.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-slate-800 truncate">{t.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    {t.status === 'PENDING' && ' · 확정 대기'}
                  </p>
                </div>
                <span className={`shrink-0 text-[14px] font-bold tabular-nums ${KIND_TONE[t.kind] || 'text-slate-700'}`}>
                  {t.amount > 0 ? '+' : ''}{nf(t.amount)}P
                </span>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState icon={<Clock className="w-5 h-5" />} title="아직 적립 내역이 없습니다"
            desc={'투표에 참여하면 첫 팬포인트가 적립됩니다.'} />
        )}
      </section>

      <Notice title="팬포인트 안내" items={[
        data.notice,
        '포인트는 적립 후 12개월간 유효하며, 소멸 30일 전에 안내드립니다.',
        '부정 참여가 확인되면 적립된 포인트가 회수될 수 있습니다.',
      ]} />
    </div>
  );
}
