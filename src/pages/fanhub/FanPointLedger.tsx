/**
 * F10 포인트 원장 — 적립 · 사용 · 회수 · 만료 (핸드오프 §7.4)
 * 원장은 삭제되지 않는다. 회수·만료도 거래로 남는다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Receipt } from 'lucide-react';
import { api } from '../../services/api';
import {
  FanHeader, Card, Chip, AthleteAvatar, EmptyState, Notice, Skeleton, nf,
} from '../../components/fanhub/FanKit';

const FILTERS = [
  { key: '', label: '전체' },
  { key: 'EARN', label: '적립' },
  { key: 'PENDING', label: '적립 예정' },
  { key: 'SPEND', label: '사용' },
  { key: 'EXPIRED', label: '만료' },
];

const KIND_META: Record<string, { tone: 'slate' | 'emerald' | 'amber' | 'rose'; label: string; color: string }> = {
  EARN: { tone: 'emerald', label: '적립', color: 'text-emerald-600' },
  PENDING: { tone: 'slate', label: '적립 예정', color: 'text-slate-500' },
  SPEND: { tone: 'slate', label: '사용', color: 'text-slate-900' },
  EXPIRE: { tone: 'amber', label: '만료', color: 'text-amber-600' },
  REVERSE: { tone: 'rose', label: '회수', color: 'text-rose-500' },
};

export default function FanPointLedger() {
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMyPointLedger({ kind: kind || undefined, page, limit: 20 })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [kind, page]);

  const items = data?.items || [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan/points" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬포인트
      </Link>

      <FanHeader eyebrow="POINT LEDGER" title="포인트 내역"
        desc="적립부터 사용·만료까지 모든 변동이 순서대로 기록됩니다." />

      {/* 요약 */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: '사용 가능', v: data.summary.available, cls: 'text-slate-900' },
            { label: '적립 예정', v: data.summary.pending, cls: 'text-slate-500' },
            { label: '30일 내 소멸', v: data.summary.expiringSoon, cls: 'text-amber-600' },
          ].map((s) => (
            <Card key={s.label} className="px-3.5 py-3.5">
              <p className="text-[12px] font-semibold text-slate-500 mb-1">{s.label}</p>
              <p className={`text-[17px] font-extrabold tabular-nums leading-none ${s.cls}`}>{nf(s.v)}P</p>
            </Card>
          ))}
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => { setKind(f.key); setPage(1); }}
            className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-semibold transition border ${
              kind === f.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[68px]" />)}</div>
      ) : items.length ? (
        <>
          <Card className="divide-y divide-slate-100">
            {items.map((t: any) => {
              const m = KIND_META[t.kind] || KIND_META.EARN;
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-4">
                  {t.athlete ? <AthleteAvatar athlete={t.athlete} size={38} /> : (
                    <div className="w-[38px] h-[38px] rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[14px] font-semibold text-slate-800 truncate">{t.label}</p>
                      {t.kind === 'PENDING' && <Chip size="xs">확정 대기</Chip>}
                      {t.kind === 'REVERSE' && <Chip size="xs" tone="rose">회수</Chip>}
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      {new Date(t.createdAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {t.athlete && ` · ${t.athlete.name}`}
                      {t.expiresAt && t.kind === 'EARN' &&
                        ` · ${new Date(t.expiresAt).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })} 만료`}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[15px] font-extrabold tabular-nums ${m.color}`}>
                    {t.amount > 0 ? '+' : ''}{nf(t.amount)}P
                  </span>
                </div>
              );
            })}
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 disabled:opacity-40 hover:border-slate-300">
                이전
              </button>
              <span className="text-[13px] text-slate-500 tabular-nums px-2">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 disabled:opacity-40 hover:border-slate-300">
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={<Receipt className="w-5 h-5" />} title="해당하는 내역이 없습니다"
          desc="다른 필터를 선택해보세요." />
      )}

      {data?.policy && (
        <div className="mt-8">
          <Notice title="원장 정책" items={[
            data.policy.notice,
            `적립된 포인트의 유효기간은 ${data.policy.expiryMonths}개월입니다.`,
          ]} />
        </div>
      )}
    </div>
  );
}
