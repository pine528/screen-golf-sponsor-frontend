import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { api } from '../../services/api';
import {
  ArrowLeft,
  Users,
  Coins,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Calculator,
  TrendingUp,
  Gift,
} from 'lucide-react';
import { cn } from '../../utils';

// 수수료 계산 헬퍼 (기본 정책 기준)
const calculateSettlementFee = (grossPool: number): number => {
  if (grossPool <= 0) return 0;
  const rawFee = Math.floor(grossPool * 0.02); // 2%
  return Math.min(rawFee, 100000); // max 100,000
};

const calculateEntryDeduction = (entryFee: number): { deduction: number; platformFee: number; creatorReward: number; netToPool: number } => {
  if (entryFee <= 0) return { deduction: 0, platformFee: 0, creatorReward: 0, netToPool: 0 };
  const rawDeduction = Math.floor(entryFee * 0.10); // 10%
  const deduction = Math.min(Math.max(rawDeduction, 10), 500); // min 10, max 500
  const platformFee = Math.floor(deduction * 0.70); // 70%
  const creatorReward = deduction - platformFee; // 30%
  const netToPool = entryFee - deduction;
  return { deduction, platformFee, creatorReward, netToPool };
};

export default function AdminFanVoteSettle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['fanVoteEvent', id],
    queryFn: async () => {
      const res = await api.getFanVoteEvent(id!);
      return res.data;
    },
    enabled: !!id,
  });

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (selectedOption === null) throw new Error('옵션을 선택해주세요');
      return await api.settleFanVote(id!, selectedOption);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fanVoteEvent', id] });
      queryClient.invalidateQueries({ queryKey: ['endedFanVotes'] });
      navigate(`/fan-votes/${id}/result`);
    },
  });

  const formatNumber = (num: string | number) => {
    return Number(num).toLocaleString();
  };

  // 정산 예측 계산
  const settlementPreview = useMemo(() => {
    if (!data?.event) return null;

    const event = data.event;
    const totalEntries = event._count?.entries || 0;
    const entryFee = Number(event.entryFeePoints) || 0;
    const seedPoints = Number(event.creatorPrizePool) || 0;
    const openFeeCharged = Number(event.openFeeCharged) || 0;
    const winnersCount = event.winnersCount || 1;

    // 참여비 집계
    const totalEntryFees = entryFee * totalEntries;
    const entryCalc = calculateEntryDeduction(entryFee);
    const totalEntryDeductions = entryCalc.deduction * totalEntries;
    const totalPlatformFeesFromEntry = entryCalc.platformFee * totalEntries;
    const totalCreatorRewardsFromEntry = entryCalc.creatorReward * totalEntries;
    const netPoolFromEntries = entryCalc.netToPool * totalEntries;

    // 상금풀
    const grossPool = seedPoints + netPoolFromEntries;

    // 정산 수수료
    const settlementFee = calculateSettlementFee(grossPool);
    const netPayoutPool = grossPool - settlementFee;

    // 당첨자 지급
    const correctCount = selectedOption !== null ? (data.voteCounts[selectedOption] ?? 0) : 0;
    const actualWinners = Math.min(winnersCount, correctCount);
    const payoutEach = actualWinners > 0 ? Math.floor(netPayoutPool / actualWinners) : 0;
    const winnerPayout = payoutEach * actualWinners;
    const remainder = netPayoutPool - winnerPayout;

    // 플랫폼 수익
    const totalPlatformRevenue = openFeeCharged + totalPlatformFeesFromEntry + settlementFee + remainder;

    return {
      // 입력
      totalEntries,
      entryFee,
      seedPoints,
      openFeeCharged,
      winnersCount,
      // 참여비
      totalEntryFees,
      totalEntryDeductions,
      totalPlatformFeesFromEntry,
      totalCreatorRewardsFromEntry,
      netPoolFromEntries,
      // 상금풀
      grossPool,
      // 정산
      settlementFee,
      netPayoutPool,
      // 당첨자
      correctCount,
      actualWinners,
      payoutEach,
      winnerPayout,
      remainder,
      // 플랫폼
      totalPlatformRevenue,
    };
  }, [data, selectedOption]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              투표를 불러올 수 없습니다
            </h2>
          </div>
        </div>
      </Layout>
    );
  }

  const { event, voteCounts } = data;
  const options = event.options as string[];
  const totalEntries = event._count?.entries || 0;

  // 이미 정산됨
  if (event.status === 'SETTLED') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              이미 정산된 투표입니다
            </h2>
            <button
              onClick={() => navigate(`/fan-votes/${id}/result`)}
              className="btn btn-primary mt-4"
            >
              결과 보기
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // 아직 종료되지 않음
  if (event.status !== 'CLOSED') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              아직 종료되지 않은 투표입니다
            </h2>
            <p className="text-slate-500">
              투표가 종료된 후에 정산할 수 있습니다
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const canSettle = selectedOption !== null && confirmText === 'SETTLE';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/fan-votes')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>팬 투표 관리</span>
        </button>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">정산 실행</h1>
              <p className="text-sm text-slate-500">정답 옵션을 선택하고 정산을 실행하세요</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-slate-900">{event.title}</h2>
            <p className="text-slate-600 mt-1">{event.question}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-emerald-50 rounded-lg p-3">
              <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-700">{totalEntries}명</p>
              <p className="text-xs text-emerald-600">참여자</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <Coins className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-700">
                {settlementPreview ? formatNumber(settlementPreview.grossPool) : '0'}P
              </p>
              <p className="text-xs text-blue-600">총 상금풀</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <Trophy className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-700">{event.winnersCount}명</p>
              <p className="text-xs text-purple-600">당첨자 수</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            정답 옵션 선택 <span className="text-red-500">*</span>
          </h3>

          <div className="space-y-3">
            {options.map((option: string, index: number) => {
              const count = voteCounts[index] ?? 0;
              const percentage = totalEntries > 0 ? (count / totalEntries) * 100 : 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    selectedOption === index
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium',
                          selectedOption === index
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-900">{option}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{count}표</p>
                      <p className="text-sm text-slate-500">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settlement Preview */}
        {settlementPreview && (
          <div className="card p-6 mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">정산 예측</h3>
            </div>

            <div className="space-y-4 text-sm">
              {/* 입금 내역 */}
              <div className="bg-white/70 rounded-lg p-3">
                <p className="font-medium text-slate-700 mb-2">상금풀 구성</p>
                <div className="space-y-1">
                  {settlementPreview.seedPoints > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Seed (개설자 상금)</span>
                      <span className="font-medium">{formatNumber(settlementPreview.seedPoints)}P</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">참여비 총액</span>
                    <span className="font-medium">{formatNumber(settlementPreview.totalEntryFees)}P</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs pl-3">
                    <span>└ 상금풀 적립 (90%)</span>
                    <span>{formatNumber(settlementPreview.netPoolFromEntries)}P</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs pl-3">
                    <span>└ 수수료 공제 (10%)</span>
                    <span>{formatNumber(settlementPreview.totalEntryDeductions)}P</span>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-semibold text-amber-800">
                    <span>총 상금풀</span>
                    <span>{formatNumber(settlementPreview.grossPool)}P</span>
                  </div>
                </div>
              </div>

              {/* 지급 내역 */}
              <div className="bg-white/70 rounded-lg p-3">
                <p className="font-medium text-slate-700 mb-2">정산 내역</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-amber-700">
                    <span>정산 수수료 (2%)</span>
                    <span>-{formatNumber(settlementPreview.settlementFee)}P</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">당첨자 지급 가능액</span>
                    <span className="font-medium">{formatNumber(settlementPreview.netPayoutPool)}P</span>
                  </div>
                  {selectedOption !== null && (
                    <>
                      <div className="flex justify-between text-slate-500 text-xs pl-3">
                        <span>└ 정답자 수</span>
                        <span>{settlementPreview.correctCount}명</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-xs pl-3">
                        <span>└ 실제 당첨자 수</span>
                        <span>{settlementPreview.actualWinners}명</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 pl-3">
                        <span>└ 1인당 지급액</span>
                        <span className="font-medium">{formatNumber(settlementPreview.payoutEach)}P</span>
                      </div>
                      {settlementPreview.remainder > 0 && (
                        <div className="flex justify-between text-slate-500 text-xs pl-3">
                          <span>└ 잔여금 (플랫폼)</span>
                          <span>{formatNumber(settlementPreview.remainder)}P</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 플랫폼 수익 */}
              <div className="bg-white/70 rounded-lg p-3">
                <p className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  플랫폼 수익 합계
                </p>
                <div className="space-y-1">
                  {settlementPreview.openFeeCharged > 0 && (
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>개설 수수료</span>
                      <span>{formatNumber(settlementPreview.openFeeCharged)}P</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>참여 수수료 (플랫폼 몫)</span>
                    <span>{formatNumber(settlementPreview.totalPlatformFeesFromEntry)}P</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>정산 수수료</span>
                    <span>{formatNumber(settlementPreview.settlementFee)}P</span>
                  </div>
                  {settlementPreview.remainder > 0 && (
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>잔여금</span>
                      <span>{formatNumber(settlementPreview.remainder)}P</span>
                    </div>
                  )}
                  <div className="border-t pt-1 flex justify-between font-semibold text-emerald-700">
                    <span>총 플랫폼 수익</span>
                    <span>{formatNumber(settlementPreview.totalPlatformRevenue)}P</span>
                  </div>
                </div>
              </div>

              {/* 개설자 리워드 */}
              {settlementPreview.totalCreatorRewardsFromEntry > 0 && (
                <div className="bg-white/70 rounded-lg p-3">
                  <p className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-500" />
                    개설자 리워드
                  </p>
                  <div className="flex justify-between font-semibold text-purple-700">
                    <span>참여 수수료 리워드 (30%)</span>
                    <span>{formatNumber(settlementPreview.totalCreatorRewardsFromEntry)}P</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="card p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">정산 실행</h3>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-700 mb-3">
              정산을 실행하면:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>선택한 옵션이 정답으로 확정됩니다</li>
              <li>정답자 중 랜덤으로 {event.winnersCount}명이 당첨됩니다</li>
              <li>당첨자에게 포인트가 자동 지급됩니다</li>
              <li>정산 수수료 (2%, 최대 100,000P)가 플랫폼에 귀속됩니다</li>
              <li>이 작업은 되돌릴 수 없습니다</li>
            </ul>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-red-700 mb-2">
              확인을 위해 "SETTLE"을 입력하세요
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="input w-full border-red-300 focus:border-red-500"
              placeholder="SETTLE"
            />
          </div>

          {settleMutation.isError && (
            <div className="bg-red-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">
                {(settleMutation.error as any)?.response?.data?.message ||
                  '정산에 실패했습니다'}
              </p>
            </div>
          )}

          <button
            onClick={() => settleMutation.mutate()}
            disabled={!canSettle || settleMutation.isPending}
            className="btn w-full py-3 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {settleMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                정산 중...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                정산 실행
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
