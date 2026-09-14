/**
 * the GUYS 팬스토어 — 선수 AR 보기 (/fan-store/the-guys/ar)
 *                  + AR 이미지팩 다운로드 (/fan-store/the-guys/ar/download)
 * 사용자 제공 시안 기준. 다운로드는 실제로 생성해 둔 이미지 파일만 활성화하고
 * (정사각/스토리/월페이퍼), 아직 없는 포맷(배경 제거 PNG·모션 클립)은 준비중으로 둔다.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Check,
  Code2,
  Copy,
  Download,
  Instagram,
  Link2,
  MessageCircle,
  Pause,
  RotateCw,
  Share2,
  ShieldCheck,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { GUYS_PRODUCTS, GUYS_STORE } from '../../data/guysStore';

export default function FanStoreGuysAr() {
  const [copiedWhat, setCopiedWhat] = useState<string | null>(null);
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhat(what);
      setTimeout(() => setCopiedWhat(null), 1500);
    } catch {
      /* 무시 */
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      <section className="px-5 sm:px-8 pt-2 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,32%)] gap-5 items-start">
          {/* ── AR 뷰어 ── */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 min-h-[420px] flex items-end justify-center">
            <img
              src={GUYS_STORE.athletePhoto}
              alt={`${GUYS_STORE.athleteName} 프로`}
              className="max-h-[560px] w-auto object-contain"
            />
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-[12px] font-bold">
              <Box className="w-3.5 h-3.5" /> AR 모드 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-[12px] font-bold">
              팬 전용 콘텐츠
            </span>

            {/* 좌하단 미니 카드 */}
            <Link
              to={GUYS_STORE.path}
              className="absolute bottom-5 left-5 hidden sm:flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur px-3 py-2.5 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                <img src={GUYS_STORE.athletePhoto} alt="" className="w-full h-full object-cover object-top" />
              </div>
              <div className="leading-tight pr-1">
                <div className="text-[12px] font-extrabold text-slate-900">{GUYS_STORE.athleteName} 프로</div>
                <div className="text-[12.5px] text-slate-500">{GUYS_STORE.brandName} 전속 프로</div>
                <div className="text-[12.5px] font-bold text-emerald-700">상품 보기 ›</div>
              </div>
            </Link>

            {/* 하단 컨트롤 바 — 촬영(이미지 저장)만 동작, 나머지는 준비중 */}
            <div className="absolute bottom-5 flex items-center gap-5 rounded-2xl bg-slate-900/85 px-6 py-3">
              <ControlBtn icon={Pause} label="일시정지" disabled />
              <a
                href={GUYS_STORE.arPack[0].file || GUYS_STORE.athletePhoto}
                download={`${GUYS_STORE.athleteName}-프로-AR.jpg`}
                className="flex flex-col items-center gap-1 text-white"
              >
                <span className="w-11 h-11 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[12.5px] font-bold">촬영</span>
              </a>
              <ControlBtn icon={RotateCw} label="360° 회전" disabled />
              <ControlBtn icon={ZoomIn} label="확대/축소" disabled />
            </div>
          </div>

          {/* ── 우측 패널 ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h1 className="text-lg font-extrabold text-slate-900 mb-1.5">{GUYS_STORE.athleteName} 프로 AR 보기</h1>
              <p className="text-[12px] text-slate-500 break-keep leading-relaxed mb-4">
                {GUYS_STORE.athleteName} 프로를 AR로 만나보세요. 현실 공간에서 자유롭게 배치하고 함께 사진을 찍을 수 있어요.
              </p>
              <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3.5 mb-4">
                <div className="text-[12px] font-extrabold text-slate-900 mb-2">사용 가이드</div>
                {[
                  "화면 하단의 '촬영' 버튼을 눌러 사진을 찍어보세요.",
                  "'360° 회전'으로 다양한 각도에서 감상할 수 있어요.",
                  "'배경 변경'으로 나만의 공간을 연출해보세요.",
                ].map((g, i) => (
                  <div key={g} className="flex items-start gap-2 mb-1.5 last:mb-0">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-slate-600 break-keep">{g}</span>
                  </div>
                ))}
              </div>

              <Link
                to={`${GUYS_STORE.path}/ar/download`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 mb-2 hover:border-emerald-300 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-slate-900">다운로드</div>
                  <div className="text-[12px] text-slate-500">AR 파일을 내려받아 보관하세요.</div>
                </div>
              </Link>
              <button
                onClick={() => copy(window.location.href, 'share')}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 mb-2 hover:border-emerald-300 transition-colors text-left"
              >
                {copiedWhat === 'share' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Share2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-slate-900">공유하기</div>
                  <div className="text-[12px] text-slate-500">{copiedWhat === 'share' ? '링크가 복사되었습니다.' : 'SNS로 친구들과 공유해보세요.'}</div>
                </div>
              </button>
              <button
                onClick={() => copy(GUYS_STORE.fanCode, 'code')}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:border-emerald-300 transition-colors text-left"
              >
                {copiedWhat === 'code' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Code2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-slate-900">코드 복사</div>
                  <div className="text-[12px] text-slate-500">
                    {copiedWhat === 'code' ? `${GUYS_STORE.fanCode} 복사됨` : `팬 할인코드 ${GUYS_STORE.fanCode}를 복사해보세요.`}
                  </div>
                </div>
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-500 break-keep leading-relaxed">
                본 콘텐츠는 팬 전용 콘텐츠입니다. 상업적 이용 및 무단 배포를 금지합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ControlBtn({ icon: Icon, label, disabled = false }: { icon: any; label: string; disabled?: boolean }) {
  return (
    <span className={`flex flex-col items-center gap-1 text-white ${disabled ? 'opacity-40' : ''}`} title={disabled ? '준비 중' : undefined}>
      <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-[12.5px] font-bold">{label}</span>
    </span>
  );
}

/* ── AR 이미지팩 다운로드 ─────────────────────────────────────── */

export function FanStoreGuysArDownload() {
  const [copiedWhat, setCopiedWhat] = useState<string | null>(null);
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhat(what);
      setTimeout(() => setCopiedWhat(null), 1500);
    } catch {
      /* 무시 */
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      <section className="px-5 sm:px-8 pt-2 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,30%)] gap-5 items-start">
          <div className="min-w-0">
            {/* 히어로 */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 border border-emerald-100 p-6 sm:p-8 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[12px] font-bold">팬 전용</span>
                    <span className="px-2.5 py-1 rounded-full border border-emerald-600 text-emerald-700 text-[12px] font-bold">AR 이미지팩</span>
                  </div>
                  <h1 className="flex items-center flex-wrap gap-2 mb-2">
                    <img src={GUYS_STORE.brandLogo} alt={GUYS_STORE.brandName} className="h-8 object-contain" />
                    <span className="text-xl sm:text-2xl font-black text-slate-900">× {GUYS_STORE.athleteName} 프로</span>
                  </h1>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mb-3">AR 이미지팩</div>
                  <p className="text-[13px] text-slate-500 break-keep leading-relaxed">
                    {GUYS_STORE.brandName}와 {GUYS_STORE.athleteName} 프로의 특별한 순간을 다양한 포맷으로 다운로드하여 자유롭게 공유하고
                    응원해 주세요!
                  </p>
                </div>
                {/* 카드 스택 미리보기 */}
                <div className="flex items-center -space-x-8 shrink-0">
                  {GUYS_STORE.arPack.filter((a) => a.file).map((a, i) => (
                    <div
                      key={a.key}
                      className={`w-[92px] aspect-[3/4] rounded-xl overflow-hidden border-2 border-white shadow-lg ${
                        i === 1 ? 'z-10 scale-110' : ''
                      }`}
                    >
                      <img src={a.file!} alt={a.label} className="w-full h-full object-cover object-top" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 다운로드 포맷 선택 */}
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">다운로드 포맷 선택</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
              {GUYS_STORE.arPack.map((a) => (
                <div key={a.key} className="rounded-2xl border border-slate-200 p-3 flex flex-col">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 mb-3 flex items-center justify-center">
                    {a.file ? (
                      <img src={a.file} alt={a.label} className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-[12.5px] text-slate-500 text-center px-2 break-keep">{a.label}<br />준비중</span>
                    )}
                  </div>
                  <div className="text-[12px] font-extrabold text-slate-900 break-keep">{a.label}</div>
                  <div className="text-[12.5px] text-slate-500 tabular-nums mb-2.5">
                    {a.dim} · {a.format}
                  </div>
                  {a.file ? (
                    <a
                      href={a.file}
                      download={`${GUYS_STORE.athleteName}-프로-${a.label}.${a.format.toLowerCase()}`}
                      className="mt-auto h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-[12px] font-bold hover:bg-emerald-50"
                    >
                      <Download className="w-3.5 h-3.5" /> 다운로드
                    </a>
                  ) : (
                    <span className="mt-auto h-9 inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-[12px] font-bold">
                      준비 중
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* 이용 가이드 */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">이용 가이드</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  {[
                    ['다운로드', '원하는 포맷의 "다운로드" 버튼을 클릭하세요.'],
                    ['저장', '기기에 이미지를 저장하거나 영상을 다운로드합니다.'],
                    ['공유', '저장한 콘텐츠를 SNS, 프로필, 배경화면 등 자유롭게 활용하세요.'],
                  ].map(([t, d], i) => (
                    <div key={t} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[12.5px] font-black flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[12px] font-bold text-slate-900 mr-1.5">{t}</span>
                        <span className="text-[12px] text-slate-500 break-keep">{d}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-4">
                  <div className="text-[12px] font-extrabold text-slate-900 mb-2">💡 활용 TIP</div>
                  <ul className="space-y-1">
                    {['프로필 이미지로 설정해 보세요.', '스토리에 올려 응원의 메시지를 전해보세요.', '배경화면으로 설정해 매일 응원해 보세요.'].map((t) => (
                      <li key={t} className="flex items-start gap-2 text-[12px] text-slate-600">
                        <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ── 우측 사이드바 ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <dl className="text-[12px] mb-4">
                <div className="flex items-center gap-4 py-1.5">
                  <dt className="w-14 shrink-0 text-slate-500">선수</dt>
                  <dd className="font-bold text-slate-900">{GUYS_STORE.athleteName} 프로</dd>
                </div>
                <div className="flex items-center gap-4 py-1.5">
                  <dt className="w-14 shrink-0 text-slate-500">브랜드</dt>
                  <dd>
                    <img src={GUYS_STORE.brandLogo} alt={GUYS_STORE.brandName} className="h-5 object-contain" />
                  </dd>
                </div>
              </dl>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3.5 py-3 mb-4">
                <div className="text-[12px] text-slate-500 mb-1">팬 전용 할인코드</div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 tracking-wider">{GUYS_STORE.fanCode}</span>
                  <span className="text-[12px] font-bold text-emerald-700">{GUYS_STORE.fanDiscountPct}%</span>
                  <button onClick={() => copy(GUYS_STORE.fanCode, 'code')} className="ml-auto text-slate-500 hover:text-slate-700">
                    {copiedWhat === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-[12.5px] text-slate-500 mt-1">{GUYS_STORE.brandName} 팬 스토어 전용</div>
              </div>

              <div className="text-[12px] font-bold text-slate-600 mb-1.5">AR 미리보기</div>
              <Link to={`${GUYS_STORE.path}/ar`} className="block relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 mb-4">
                <img src={GUYS_STORE.arPack[0].file!} alt="AR 미리보기" className="w-full aspect-[4/3] object-cover object-top" />
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 text-white text-[12.5px] font-bold">
                  <Box className="w-3 h-3" /> AR
                </span>
              </Link>

              <div className="text-[12px] font-bold text-slate-600 mb-1.5">공유하기</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => copy(window.location.href, 'share')}
                  className="h-9 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  {copiedWhat === 'share' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />} 링크 복사
                </button>
                <span title="준비 중" className="h-9 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-100 text-[12px] font-bold text-slate-300">
                  <MessageCircle className="w-3.5 h-3.5" /> 카카오톡
                </span>
                <span title="준비 중" className="h-9 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-100 text-[12px] font-bold text-slate-300">
                  <Instagram className="w-3.5 h-3.5" /> 인스타
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 px-4 py-3.5 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[12px] font-extrabold text-slate-900 mb-0.5">팬 전용 다운로드</div>
                <p className="text-[12px] text-slate-500 break-keep leading-relaxed">
                  본 콘텐츠는 팬을 위한 전용 콘텐츠입니다. 상업적 이용 및 무단 배포를 금지합니다.
                </p>
              </div>
            </div>

            {/* 관련 콘텐츠 */}
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-[13px] font-extrabold text-slate-900 mb-3">관련 콘텐츠</div>
              <RelatedProducts />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function RelatedProducts() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {GUYS_PRODUCTS.slice(0, 4).map((p) => (
        <Link key={p.id} to={`${GUYS_STORE.path}/${p.id}`} className="rounded-xl border border-slate-100 overflow-hidden hover:border-emerald-300 transition-colors">
          <div className="aspect-square bg-slate-50 flex items-center justify-center p-2">
            <span className="text-[9px] text-slate-500 text-center break-keep leading-snug">{p.name}</span>
          </div>
          <div className="p-2">
            <div className="text-[12px] font-black text-slate-900 tabular-nums">{p.price.toLocaleString()}원</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
