/**
 * 무료 투표 목록 (/votes)
 *
 * 카드에 노출되는 수치는 모두 서버 실값이다. 참여자가 없으면 0으로 그대로 보여주고
 * 임의의 예시 수치를 채우지 않는다 (개편 LEG-06).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, CheckCircle2, ListChecks, ShieldCheck, Users } from 'lucide-react';
import { api } from '../../services/api';
import RewardPoolStatus from '../../components/RewardPoolStatus';
import { Layout } from '../../components/Layout';

interface VoteV2 {
  id: string;
  templateCode: string;
  title: string;
  description?: string;
  options: any[];
  optionTally?: Record<string, number>;
  status: string;
  rewardBudgetEp: string;
  escrowEp: string;
  maxPerWinnerEp: string;
  closeAt: string;
  createdAt: string;
  _count: { participations: number };
}

type StatusFilter = 'ALL' | 'OPEN' | 'CLOSED' | 'SETTLED';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'OPEN', label: '참여 가능' },
  { key: 'CLOSED', label: '마감' },
  { key: 'SETTLED', label: '정산 완료' },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  OPEN: { label: '참여 가능', cls: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: '마감', cls: 'bg-amber-100 text-amber-700' },
  SETTLED: { label: '정산 완료', cls: 'bg-violet-100 text-violet-700' },
  CANCELED: { label: '취소됨', cls: 'bg-slate-100 text-slate-600' },
};

const TEMPLATE_LABEL: Record<string, string> = {
  'T1-YesNo': 'Yes/No',
  'T2-MC': '다지선다',
  'T3-TopN': 'Top N',
  'T4-Exact': '정확값',
};

const STEPS = [
  { title: '투표를 고릅니다', desc: '참여 가능한 투표 중 원하는 주제를 선택하세요.' },
  { title: '보기를 선택합니다', desc: '한 투표당 1인 1회, 마감 전까지 참여할 수 있습니다.' },
  { title: '마감 후 집계합니다', desc: '마감되면 정답과 참여 결과를 함께 공개합니다.' },
  { title: '리워드를 지급합니다', desc: '정답자에게 EP를 나눠 지급하고 내역을 남깁니다.' },
];

const formatDate = (s: string) =>
  new Date(s).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const remaining = (closeAt: string) => {
  const diff = new Date(closeAt).getTime() - Date.now();
  if (diff <= 0) return '마감됨';
  const hours = Math.floor(diff / 3600000);
  if (hours >= 24) return `${Math.floor(hours / 24)}일 남음`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}시간 ${minutes}분 남음`;
};

export default function VoteV2List() {
  const navigate = useNavigate();
  const [votes, setVotes] = useState<VoteV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchVotes();
  }, [statusFilter, pagination.page]);

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, pageSize: pagination.pageSize };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await api.getVotes(params);
      if (response.success) {
        setVotes(response.data || []);
        if (response.pagination) setPagination((prev) => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">무료 투표</h1>
            <p className="text-sm text-slate-500">무료로 참여하고 정답 시 리워드를 받으세요!</p>
          </div>
          <RewardPoolStatus compact className="md:w-auto" />
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatusFilter(f.key);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              aria-pressed={statusFilter === f.key}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                statusFilter === f.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 목록 */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-6" />
                    <div className="h-9 bg-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : votes.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-slate-200 bg-white">
                <ListChecks className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                <p className="text-slate-500 text-sm">해당 조건의 투표가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {votes.map((vote) => (
                  <VoteCard key={vote.id} vote={vote} onOpen={() => navigate(`/votes/${vote.id}`)} />
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400"
                >
                  이전
                </button>
                <span className="px-3 text-sm text-slate-500 tabular-nums">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400"
                >
                  다음
                </button>
              </div>
            )}
          </div>

          {/* 안내 사이드바 */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-extrabold text-slate-900 mb-4">투표는 이렇게 진행돼요</h2>
              <ol className="space-y-3.5">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-violet-100 text-violet-700 text-xs font-black inline-flex items-center justify-center tabular-nums">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{s.title}</div>
                      <p className="text-xs text-slate-500 break-keep leading-relaxed">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                to="/guide"
                className="mt-5 inline-flex w-full items-center justify-center gap-1 h-10 rounded-xl border border-violet-200 text-violet-700 text-sm font-bold hover:bg-violet-50 transition-colors"
              >
                자주 묻는 질문 보기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed break-keep">
                  투표는 무료이며 참여에 별도 비용이 들지 않습니다. 공정한 운영을 위해 중복·부정 참여를 모니터링하며,
                  리워드는 정산 후 EP로 지급됩니다.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function VoteCard({ vote, onOpen }: { vote: VoteV2; onOpen: () => void }) {
  const badge = STATUS_BADGE[vote.status] || STATUS_BADGE.CANCELED;
  const options: any[] = Array.isArray(vote.options) ? vote.options : [];
  const participants = vote._count?.participations || 0;
  const action =
    vote.status === 'OPEN' ? '투표 참여' : vote.status === 'SETTLED' ? '정산 보기' : '결과 보기';

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen();
      }}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-violet-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-violet-50 text-violet-700">
          {TEMPLATE_LABEL[vote.templateCode] || vote.templateCode}
        </span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${badge.cls}`}>{badge.label}</span>
      </div>

      <h3 className="text-base font-extrabold text-slate-900 leading-snug break-keep line-clamp-2 min-h-[2.75rem]">
        {vote.title}
      </h3>
      {vote.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{vote.description}</p>}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {participants.toLocaleString()}명 참여
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="w-3.5 h-3.5" />
          {vote.status === 'OPEN' ? remaining(vote.closeAt) : formatDate(vote.closeAt)}
        </span>
        <span className="inline-flex items-center gap-1">
          <ListChecks className="w-3.5 h-3.5" />
          선택지 {options.length}개
        </span>
      </div>

      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {options.slice(0, 4).map((o: any, i: number) => (
            <span
              key={o.id ?? i}
              className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 max-w-full truncate"
            >
              {o.label ?? o.name ?? `선택 ${i + 1}`}
            </span>
          ))}
          {options.length > 4 && (
            <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-400">
              +{options.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] text-slate-400">예상 보상</div>
          <div className="text-lg font-black text-violet-600 tabular-nums leading-tight">
            {Number(vote.escrowEp || 0).toLocaleString()} <span className="text-xs font-bold">EP</span>
          </div>
        </div>
        <span
          className={`inline-flex items-center justify-center h-9 px-4 rounded-xl text-xs font-bold ${
            vote.status === 'OPEN'
              ? 'bg-violet-600 text-white'
              : 'border border-slate-200 text-slate-700'
          }`}
        >
          {action}
        </span>
      </div>

      {vote.status === 'OPEN' && (
        <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-slate-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />1인 1회 참여 가능
        </p>
      )}
    </div>
  );
}
