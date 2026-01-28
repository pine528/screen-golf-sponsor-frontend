import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { api } from '../../services/api';
import {
  Heart,
  EyeOff,
  Loader2,
  MessageCircle,
  Calendar,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Gift,
} from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  tour?: string;
  profileImageUrl?: string;
}

interface Donation {
  id: string;
  amount: string;
  platformFee: string;
  netAmount: string;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
  athlete: Athlete;
}

interface DonationsResponse {
  donations: Donation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalAmount: string;
    totalCount: number;
  };
}

export default function MyDonations() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: DonationsResponse }>({
    queryKey: ['myDonations', page],
    queryFn: () => api.getMyDonations({ page, limit }),
  });

  const donationsData = data?.data;
  const donations = donationsData?.donations || [];
  const pagination = donationsData?.pagination;
  const summary = donationsData?.summary;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAmount = (amount: string | number) => {
    return Number(amount).toLocaleString();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-7 h-7 text-green-500" />
            <h1 className="text-2xl font-bold">내 후원 내역</h1>
          </div>
          <p className="text-gray-600">
            선수들에게 보낸 후원 내역을 확인하세요
          </p>
        </div>

        {/* Summary Card */}
        {summary && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Heart className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-gray-600">총 후원 금액</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatAmount(summary.totalAmount)}P
                </div>
                <div className="text-sm text-gray-500">
                  {summary.totalCount}명의 선수를 응원했습니다
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            후원 내역을 불러오는데 실패했습니다.
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">아직 후원 내역이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">
              좋아하는 선수를 응원해보세요!
            </p>
          </div>
        ) : (
          <>
            {/* Donations List */}
            <div className="space-y-3">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Athlete Avatar */}
                    <div className="flex-shrink-0">
                      {donation.athlete.profileImageUrl ? (
                        <img
                          src={donation.athlete.profileImageUrl}
                          alt={donation.athlete.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium text-gray-900">
                            {donation.athlete.name}
                          </span>
                          {donation.athlete.tour && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({donation.athlete.tour})
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-red-500">
                          -{formatAmount(donation.amount)}P
                        </span>
                      </div>

                      {donation.message && (
                        <div className="flex items-start gap-2 text-gray-600 text-sm bg-gray-50 rounded-lg p-2 mb-2">
                          <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p>{donation.message}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(donation.createdAt)}</span>
                        </div>
                        {donation.isAnonymous && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <EyeOff className="w-3 h-3" />
                            <span>익명</span>
                          </div>
                        )}
                        <span className="text-green-600">
                          선수 수령: {formatAmount(donation.netAmount)}P
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
