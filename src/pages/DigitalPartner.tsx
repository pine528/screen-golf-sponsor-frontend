/**
 * 디지털 파트너 월 구독 소개 — 리디자인 v2.0 §6 (임시 소개 페이지)
 *
 * 경기복·대회 현장 부착 없이 선수 승인 디지털 배지와 온라인 채널·등록 매장
 * POP에서만 12개월 사용하는 저진입 월 구독 상품. 신청·결제 플로우는 세부
 * 핸드오프 수령 후 구현하며, 지금은 상품 정의·플랜·문의 연결만 제공한다.
 * 카피 기준(§11.2): 가격은 "월 ○원 · 12개월 약정 · VAT 별도" 형식,
 * 경기복 미포함은 본문에 명시(각주 금지).
 */
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarCheck, Check, Info, Store } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const PLANS = [
  {
    name: 'START',
    monthly: 49000,
    includes: ['선수 승인 공식 디지털 배지', '팬스토어 기본 입점', '웹 배너 1종', '기본 리포트'],
    excludes: 'SNS 게시 · 매장 POP · 독점 미포함',
  },
  {
    name: 'GROW',
    monthly: 99000,
    recommended: true,
    includes: ['START 전체 포함', 'SNS 템플릿 제공', '등록 매장 POP', '할인코드 · QR'],
    excludes: '선수 직접 게시 · 방문 미포함',
  },
  {
    name: 'PLUS',
    monthly: 199000,
    includes: ['GROW 전체 포함', '분기 소재 리프레시', '동일 업종 제한', '상세 리포트'],
    excludes: '출연 · 촬영 · 경기복 미포함',
  },
];

export default function DigitalPartner() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />

      <section className="bg-[#f2faf5] px-5 pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-black tracking-wide mb-5">
            <CalendarCheck className="w-3.5 h-3.5" /> NEW · 월 구독
          </span>
          <h1 className="text-[26px] sm:text-4xl font-black tracking-tight leading-snug break-keep">
            디지털 파트너 <span className="text-emerald-500">월 구독</span>
          </h1>
          <p className="mt-5 text-[14px] sm:text-[15px] text-slate-500 leading-relaxed break-keep max-w-xl mx-auto">
            경기복·대회 현장 부착 없이, 선수가 승인한 공식 디지털 배지를
            온라인 팬스토어 · 웹/SNS · 등록 매장 홍보물에서 12개월간 사용하는
            저진입 후원 상품입니다.
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-3.5 py-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-500" />
            경기복 · 대회 현장 부착은 포함되지 않는 상품입니다
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl border p-6 flex flex-col ${
                  p.recommended
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-[0_16px_40px_-16px_rgba(16,185,129,0.35)]'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {p.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10.5px] font-black">
                    추천
                  </span>
                )}
                <h2 className="text-[15px] font-black tracking-widest text-slate-900">{p.name}</h2>
                <p className="mt-3 text-[26px] font-black text-slate-900">
                  월 {p.monthly.toLocaleString()}원
                </p>
                <p className="text-[11.5px] text-slate-400 mt-1">
                  12개월 약정 · 총 {(p.monthly * 12).toLocaleString()}원 · VAT 별도
                </p>
                <ul className="mt-5 space-y-2 flex-1">
                  {p.includes.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-[1px]" /> {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 pt-3 border-t border-slate-100 text-[11.5px] text-slate-400">{p.excludes}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-slate-50 border border-slate-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
              </span>
              <p className="text-[13px] text-slate-600 leading-relaxed break-keep">
                선수 승인 후에 사용권이 발급되며, 계약 종료 시 배지·소재 사용이 중지됩니다.
                선수별 신청·결제는 준비 중입니다 — 지금은 상담으로 시작하실 수 있어요.
              </p>
            </div>
            <Link
              to={`/contact?subject=${encodeURIComponent('[디지털 파트너 월 구독] 도입 상담 요청')}`}
              className="shrink-0 h-11 px-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
            >
              도입 상담하기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[12.5px] text-slate-400">
            <Store className="w-4 h-4" />
            경기 착장 후원이 필요하다면
            <Link to="/athletes" className="font-bold text-emerald-600 hover:text-emerald-700">직접 PICK</Link>
            을 이용해 주세요.
          </div>
        </div>
      </section>
    </div>
  );
}
