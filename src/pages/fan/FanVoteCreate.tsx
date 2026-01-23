import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { api } from '../../services/api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Vote,
  Loader2,
  AlertCircle,
  Info,
  Calculator,
  Gift,
} from 'lucide-react';

// 수수료 계산 헬퍼 (기본 정책 기준)
const calculateOpenFee = (seedPoints: number): { fee: number; isMin: boolean; isMax: boolean } => {
  if (seedPoints <= 0) return { fee: 0, isMin: false, isMax: false };
  const rawFee = Math.floor(seedPoints * 0.02); // 2%
  const MIN_FEE = 1000;
  const MAX_FEE = 50000;
  const fee = Math.min(Math.max(rawFee, MIN_FEE), MAX_FEE);
  return {
    fee,
    isMin: rawFee < MIN_FEE,
    isMax: rawFee > MAX_FEE,
  };
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

export default function FanVoteCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [entryFeePoints, setEntryFeePoints] = useState(0);
  const [seedPoints, setSeedPoints] = useState(0); // 상금포인트 (Seed)
  const [winnersCount, setWinnersCount] = useState(1);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  // 수수료 계산 (실시간)
  const feeBreakdown = useMemo(() => {
    const openFeeCalc = calculateOpenFee(seedPoints);
    const entryCalc = calculateEntryDeduction(entryFeePoints);
    const totalRequired = seedPoints + openFeeCalc.fee;

    return {
      seedPoints,
      openFee: openFeeCalc.fee,
      openFeeIsMin: openFeeCalc.isMin,
      openFeeIsMax: openFeeCalc.isMax,
      totalRequired,
      entryFee: entryFeePoints,
      ...entryCalc,
    };
  }, [seedPoints, entryFeePoints]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const filteredOptions = options.filter((o) => o.trim() !== '');
      return await api.createFanVote({
        title,
        question,
        options: filteredOptions,
        entryFeePoints,
        winnersCount,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        creatorPrizePool: seedPoints, // Seed 포인트 전달
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCreatedFanVotes'] });
      navigate('/fan-votes/my');
    },
  });

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const isValid =
    title.trim() &&
    question.trim() &&
    options.filter((o) => o.trim()).length >= 2 &&
    startsAt &&
    endsAt &&
    new Date(startsAt) < new Date(endsAt);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/fan-votes/my')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>내 투표 목록</span>
        </button>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Vote className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">투표 만들기</h1>
              <p className="text-sm text-slate-500">팬들과 함께 즐길 투표를 만들어보세요</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">투표 진행 방식</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600">
                  <li>투표 생성 후 "제출"하면 관리자 승인 대기 상태가 됩니다</li>
                  <li>승인되면 자동으로 시작 시간에 투표가 오픈됩니다</li>
                  <li>종료 후 관리자가 정답을 선택하면 당첨자에게 포인트가 지급됩니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                투표 제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                placeholder="예: 이번 주 우승자는?"
                maxLength={200}
              />
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                질문 *
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="input w-full min-h-[80px]"
                placeholder="참여자들에게 물어볼 질문을 입력하세요"
                maxLength={500}
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                선택지 * (2~6개)
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="input flex-1"
                      placeholder={`옵션 ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button
                  onClick={addOption}
                  className="mt-2 flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                  옵션 추가
                </button>
              )}
            </div>

            {/* Seed Points (상금포인트) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-500" />
                  상금포인트 (Seed)
                </div>
              </label>
              <input
                type="number"
                value={seedPoints}
                onChange={(e) => setSeedPoints(Math.max(0, parseInt(e.target.value) || 0))}
                className="input w-full"
                min={0}
                step={1000}
              />
              <p className="text-xs text-slate-500 mt-1">
                당첨자에게 지급할 상금입니다. 0 = 참여비만 상금풀에 적립
              </p>
            </div>

            {/* Entry Fee & Winners */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  참가비 (P)
                </label>
                <input
                  type="number"
                  value={entryFeePoints}
                  onChange={(e) => setEntryFeePoints(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input w-full"
                  min={0}
                />
                <p className="text-xs text-slate-500 mt-1">0 = 무료 참가</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  당첨자 수
                </label>
                <input
                  type="number"
                  value={winnersCount}
                  onChange={(e) => setWinnersCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input w-full"
                  min={1}
                />
                <p className="text-xs text-slate-500 mt-1">정답자 중 랜덤 추첨</p>
              </div>
            </div>

            {/* Fee Preview */}
            {(seedPoints > 0 || entryFeePoints > 0) && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">수수료 미리보기</span>
                </div>
                <div className="space-y-2 text-sm">
                  {seedPoints > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">상금포인트 (Seed)</span>
                        <span className="font-medium">{feeBreakdown.seedPoints.toLocaleString()} P</span>
                      </div>
                      <div className="flex justify-between text-amber-700">
                        <span>
                          개설 수수료{' '}
                          {feeBreakdown.openFeeIsMin ? (
                            <span className="text-xs">(최소 1,000P 적용)</span>
                          ) : feeBreakdown.openFeeIsMax ? (
                            <span className="text-xs">(최대 50,000P 적용)</span>
                          ) : (
                            <span className="text-xs">(Seed의 2%)</span>
                          )}
                        </span>
                        <span className="font-medium">-{feeBreakdown.openFee.toLocaleString()} P</span>
                      </div>
                      <div className="border-t border-amber-200 pt-2 flex justify-between font-semibold">
                        <span className="text-amber-800">승인 시 필요 포인트</span>
                        <span className="text-amber-900">{feeBreakdown.totalRequired.toLocaleString()} P</span>
                      </div>
                    </>
                  )}
                  {entryFeePoints > 0 && (
                    <>
                      <div className="border-t border-amber-200 pt-2 mt-2">
                        <div className="text-xs text-slate-500 mb-2">참여자 1인당 수수료 구조</div>
                        <div className="flex justify-between text-slate-600">
                          <span>참가비</span>
                          <span>{feeBreakdown.entryFee.toLocaleString()} P</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>└ 상금풀 적립 (90%)</span>
                          <span>{feeBreakdown.netToPool.toLocaleString()} P</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>└ 개설자 리워드 (3%)</span>
                          <span>+{feeBreakdown.creatorReward.toLocaleString()} P</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-xs">
                          <span>└ 플랫폼 수수료 (7%)</span>
                          <span>{feeBreakdown.platformFee.toLocaleString()} P</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  시작 시간 *
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  종료 시간 *
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Error Message */}
            {createMutation.isError && (
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">투표 생성에 실패했습니다</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  {(createMutation.error as any)?.response?.data?.message ||
                    '다시 시도해주세요'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={() => createMutation.mutate()}
              disabled={!isValid || createMutation.isPending}
              className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  생성 중...
                </>
              ) : (
                <>
                  <Vote className="w-4 h-4 mr-2" />
                  투표 만들기
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              생성 후 "제출"을 해야 관리자 승인을 받을 수 있습니다
              {seedPoints > 0 && (
                <span className="block mt-1 text-amber-600">
                  * 승인 시 상금포인트 + 개설 수수료가 차감됩니다
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
