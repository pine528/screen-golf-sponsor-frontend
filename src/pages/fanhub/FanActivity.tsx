/**
 * F16 내 팬활동 — 투표·글·편지·추천·포인트를 한 곳에서 (핸드오프 §18.1)
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Vote, MessageSquare, Mail, Coins, Activity, Lightbulb } from 'lucide-react';
import { api } from '../../services/api';
import {
  FanHeader, Card, Chip, AthleteAvatar, EmptyState, Skeleton, TempBar, nf,
} from '../../components/fanhub/FanKit';

const SUGGEST_STATUS: Record<string, { label: string; tone: 'slate' | 'sky' | 'emerald' | 'amber' }> = {
  RECEIVED: { label: '접수', tone: 'slate' },
  REVIEWING: { label: '검토 중', tone: 'sky' },
  DELIVERED: { label: '브랜드 전달', tone: 'sky' },
  INTERESTED: { label: '브랜드 관심', tone: 'amber' },
  ADOPTED: { label: '채택', tone: 'emerald' },
  HOLD: { label: '보류', tone: 'slate' },
  CLOSED: { label: '종료', tone: 'slate' },
};

export default function FanActivity() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyFanActivity()
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-10 space-y-4"><Skeleton className="h-[120px]" /><Skeleton className="h-[240px]" /></div>;
  }
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <EmptyState title="팬활동을 불러오지 못했습니다" desc="로그인 후 다시 시도해주세요." />
      </div>
    );
  }

  const s = data.summary;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-400 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬 참여
      </Link>

      <FanHeader eyebrow="MY ACTIVITY" title="내 팬활동"
        desc="그동안의 응원 기록을 한눈에 확인하세요." />

      {/* 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {[
          { icon: Vote, label: '투표 참여', v: s.votes, to: '/fan/vote' },
          { icon: MessageSquare, label: '커뮤니티 글', v: s.posts, to: '/fan/community' },
          { icon: Mail, label: '응원 편지', v: s.letters, to: null },
          { icon: Coins, label: '팬포인트', v: s.balance, to: '/fan/points', suffix: 'P' },
        ].map((m) => {
          const I = m.icon;
          const inner = (
            <>
              <I className="w-4 h-4 text-slate-400 mb-2.5" />
              <p className="text-[22px] font-extrabold text-slate-900 tabular-nums leading-none">
                {nf(m.v)}<span className="text-[13px] text-slate-400">{m.suffix || ''}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">{m.label}</p>
            </>
          );
          return m.to
            ? <Card key={m.label} as="link" to={m.to} className="p-4">{inner}</Card>
            : <Card key={m.label} className="p-4">{inner}</Card>;
        })}
      </div>

      {/* 응원한 선수 */}
      {data.contributions?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-slate-900 mb-3">응원한 선수 {data.contributions.length}명</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {data.contributions.map((c: any) => (
              <Card key={c.athlete.id} as="link" to={`/fan/temperature/${c.athlete.id}`} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AthleteAvatar athlete={c.athlete} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-slate-900 truncate">{c.athlete.name}</p>
                    <p className="text-[11px] text-slate-400">{c.levelLabel}</p>
                  </div>
                  <Chip size="xs">{c.diversity}/{c.diversityMax} 영역</Chip>
                </div>
                <TempBar score={c.score} tier={undefined} />
              </Card>
            ))}
          </div>
          <Link to="/fan/contributions" className="mt-3 block text-center text-[12px] font-bold text-slate-500 hover:text-slate-900">
            기여도 자세히 보기
          </Link>
        </section>
      )}

      {/* 브랜드 추천 상태 */}
      {data.suggestions?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-slate-900 mb-1">내 브랜드 추천</h2>
          <p className="text-[13px] text-slate-400 mb-3">접수 → 검토 → 브랜드 전달 → 관심 → 채택 순으로 진행됩니다.</p>
          <Card className="divide-y divide-slate-100">
            {data.suggestions.map((sg: any) => {
              const st = SUGGEST_STATUS[sg.status] || SUGGEST_STATUS.RECEIVED;
              return (
                <div key={sg.id} className="flex items-center gap-3 px-4 py-3.5">
                  <AthleteAvatar athlete={sg.athlete} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-slate-800 truncate">
                      {sg.brandName || sg.category}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sg.athlete?.name} · {new Date(sg.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <Chip size="xs" tone={st.tone}>{st.label}</Chip>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      {/* 타임라인 */}
      <section className="mb-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-3">최근 활동</h2>
        {data.timeline?.length ? (
          <Card className="p-5">
            <ol className="relative">
              {data.timeline.map((t: any, i: number) => (
                <li key={t.id} className="relative pl-6 pb-5 last:pb-0">
                  {i < data.timeline.length - 1 && (
                    <span className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-100" />
                  )}
                  <span className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${
                    t.validity === 'VALID' ? 'bg-slate-900' : 'bg-amber-300'
                  }`} />
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-slate-800">{t.label}</p>
                    {t.validity !== 'VALID' && <Chip size="xs" tone="amber">검토 중</Chip>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.athlete?.name ? `${t.athlete.name} · ` : ''}
                    {new Date(t.at).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        ) : (
          <EmptyState icon={<Activity className="w-5 h-5" />} title="아직 활동 기록이 없습니다"
            desc={'투표나 커뮤니티 응원으로 첫 활동을 남겨보세요.'}
            action={
              <Link to="/fan/vote" className="inline-flex h-10 px-5 rounded-2xl bg-slate-900 text-white text-[13px] font-bold items-center hover:bg-slate-800 transition">
                투표 참여하기
              </Link>
            } />
        )}
      </section>

      {/* 브랜드 추천 유도 */}
      <Link to="/fan/community"
        className="block rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 hover:border-slate-300 transition">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-slate-900">선수에게 어울리는 브랜드를 추천해보세요</p>
            <p className="text-[12px] text-slate-400 mt-0.5">팬의 추천은 실제 스폰서십 제안으로 이어집니다</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
