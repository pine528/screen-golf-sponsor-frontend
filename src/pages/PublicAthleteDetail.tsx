/**
 * 공개 선수 상세 페이지 (/athletes/:id)
 *
 * - 비회원 접근 가능
 * - 프로필 + 약력 + 진행 중 슬롯 + 후원 시작 CTA
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, ExternalLink, Instagram, Globe, Award } from 'lucide-react';
import { api } from '../services/api';

export default function PublicAthleteDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: resp, isLoading, error } = useQuery({
    queryKey: ['public-athlete', id],
    queryFn: () => api.getPublicAthlete(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">로딩 중...</div>;
  if (error || !resp?.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <div className="text-base font-semibold text-slate-700 mb-1">선수를 찾을 수 없습니다</div>
        <Link to="/athletes" className="text-sm text-emerald-600 hover:underline mt-3">선수 목록으로</Link>
      </div>
    );
  }

  const { athlete, slotInstances = [], exposureCount = 0 } = resp.data;
  const social = (athlete.socialLinks || {}) as Record<string, string>;
  const sponsors = (athlete.primarySponsors || []) as any[];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6">
          <Link to="/athletes" className="inline-flex items-center gap-1 text-xs opacity-90 hover:opacity-100">
            <ArrowLeft className="w-3 h-3" /> 선수 목록
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-12 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-start">
          {/* 프로필 사진 */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-white/20 backdrop-blur border-4 border-white/40 shadow-2xl mx-auto sm:mx-0">
            {athlete.profileImageUrl ? (
              <img src={athlete.profileImageUrl} alt={athlete.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl font-extrabold">{athlete.name.charAt(0)}</div>
            )}
          </div>
          {/* 정보 */}
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full mb-2">
              <Trophy className="w-3 h-3" /> {athlete.tour || 'PRO'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">{athlete.name}</h1>
            {athlete.realName && athlete.realName !== athlete.name && (
              <div className="text-sm opacity-90 mb-3">본명: {athlete.realName}</div>
            )}
            <p className="text-sm sm:text-base opacity-95 leading-relaxed max-w-2xl mb-4">
              {athlete.bio || '프로 골퍼로서 활발히 활동 중입니다.'}
            </p>

            {/* 소셜 링크 */}
            {(social.instagram || social.youtube || social.website) && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {social.instagram && (
                  <a href={social.instagram.startsWith('http') ? social.instagram : `https://instagram.com/${social.instagram}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold">
                    🎥 YouTube
                  </a>
                )}
                {social.website && (
                  <a href={social.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <Globe className="w-3.5 h-3.5" /> 웹사이트
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌: 슬롯 + 통계 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-base font-extrabold text-slate-900 mb-3 inline-flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" /> 진행 중인 광고 슬롯
            </h2>
            {slotInstances.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">현재 진행 중인 슬롯이 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slotInstances.map((s: any) => (
                  <div key={s.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="text-xs font-bold text-slate-900">{s.slotTemplate?.name || '슬롯'}</div>
                    <div className="text-[10px] text-slate-500 mb-2">{s.slotTemplate?.bodyPart || ''}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">현재 입찰가</span>
                      <span className="text-sm font-extrabold text-emerald-600">
                        ₩{Number(s.currentBid || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 활동 통계 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-base font-extrabold text-slate-900 mb-3">📊 활동 통계</h2>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="누적 노출" value={exposureCount.toLocaleString()} />
              <Stat label="진행 슬롯" value={String(slotInstances.length)} />
              <Stat
                label="가입일"
                value={athlete.createdAt ? new Date(athlete.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }) : '-'}
              />
            </div>
          </div>

          {/* 메인 스폰서 (있으면) */}
          {sponsors.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-base font-extrabold text-slate-900 mb-3">🏆 메인 스폰서</h2>
              <div className="flex flex-wrap gap-2">
                {sponsors.map((s: any, i: number) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-semibold">
                    {typeof s === 'string' ? s : s.name || s.brand || ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 우: CTA */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 sticky top-4">
            <div className="text-xs font-bold opacity-90 mb-2">스폰서십 시작하기</div>
            <h3 className="text-xl font-extrabold mb-3">{athlete.name} 선수와 함께</h3>
            <p className="text-sm opacity-95 mb-5 leading-relaxed">
              경기 중 노출 슬롯을 실시간 경매로 낙찰받아 브랜드 노출과 매출 증명까지 한 번에.
            </p>
            <Link
              to="/auctions"
              className="block w-full bg-white text-emerald-600 text-center font-extrabold py-3 rounded-xl hover:bg-emerald-50 transition-colors mb-2"
            >
              경매 둘러보기
            </Link>
            <Link
              to="/register"
              className="block w-full bg-white/20 backdrop-blur text-white text-center font-bold py-3 rounded-xl hover:bg-white/30 transition-colors text-sm inline-flex items-center justify-center gap-1"
            >
              브랜드 가입 <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-extrabold text-slate-900">{value}</div>
    </div>
  );
}
