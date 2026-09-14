/**
 * IA10 브랜드 CMS (핸드오프 v1.0 §11.1)
 * 게시 체크리스트를 통과해야 게시할 수 있고, 로고 권리가 유효해야 한다 (§10.4).
 */
import { useCallback, useEffect, useState } from 'react';
import {Plus, Search, Save, Send, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink} from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  Panel, Tag, Empty, Loading, useAdminGuard, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

const TABS = [
  { key: 'BASIC', label: '기본정보' },
  { key: 'LOGO', label: '로고 · 권리' },
  { key: 'CASES', label: '협업사례' },
  { key: 'EXPOSURE', label: '노출 설정' },
];

export default function AboutOpsBrands() {
  const guard = useAdminGuard();
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState('');
  const [list, setList] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [tab, setTab] = useState('BASIC');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getAboutAdminBrands({ status, q: q || undefined })
      .then((r) => {
        setList(r.data);
        if (!selected && r.data?.brands?.[0]) setSelected(r.data.brands[0].id);
      })
      .catch((e) => guard(e, '/admin/about/brands'))
      .finally(() => setLoading(false));
  }, [status, q]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setError(null); setMsg(null);
    api.getAboutAdminBrand(selected)
      .then((r) => { setDetail(r.data); setForm({ ...r.data.brand, displayName: r.data.brand.name }); })
      .catch(() => setDetail(null));
  }, [selected]);

  const save = async (publish = false) => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.saveAboutBrand({ ...form, id: form.id });
      const id = r.data.brand.id;
      if (publish) await api.publishAboutBrand(id);
      setMsg(publish ? '브랜드가 게시되었습니다' : '저장되었습니다');
      await load();
      const d = await api.getAboutAdminBrand(id);
      setDetail(d.data); setForm({ ...d.data.brand, displayName: d.data.brand.name });
      setSelected(id);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '저장에 실패했습니다');
    } finally { setBusy(false); }
  };

  return (
    <AboutAdminShell title="브랜드 관리" desc="파트너 브랜드 정보와 로고 권리, 노출 설정을 관리합니다."
      breadcrumb={['브랜드·콘텐츠', '브랜드 관리']}
      actions={
        <button onClick={() => { setSelected(null); setDetail(null); setForm({ displayName: '', category: '' }); setTab('BASIC'); }}
          className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 브랜드 추가
        </button>
      }>
      {loading && !list ? <Loading /> : !list ? <Empty title="브랜드를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-4 gap-4">
            {/* 목록 */}
            <Panel title={`브랜드 ${list.brands.length}개`}
              right={
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="브랜드명"
                    className="h-9 w-32 pl-8 pr-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-400" />
                </div>
              }>
              <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-1.5">
                {list.statuses.map((s: any) => (
                  <button key={s.code} onClick={() => setStatus(s.code)}
                    className={`h-7 px-2.5 rounded-lg text-[12.5px] font-bold border transition ${
                      status === s.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
              {list.brands.length ? (
                <div className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
                  {list.brands.map((b: any) => (
                    <button key={b.id} onClick={() => setSelected(b.id)}
                      className={`w-full text-left px-4 py-3.5 transition flex items-center gap-3 ${
                        selected === b.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                      }`}>
                      <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {b.logoUrl
                          ? <img src={b.logoUrl} alt="" className="max-w-full max-h-full object-contain p-1" />
                          : <span className="text-[12px] font-bold text-slate-500">{b.name.slice(0, 2)}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13.5px] font-bold text-slate-800 truncate">{b.name}</p>
                          <Tag tone={b.status === 'ACTIVE_PARTNER' ? 'emerald' : 'slate'}>{b.statusLabel}</Tag>
                        </div>
                        <p className="text-[12.5px] text-slate-500 mt-0.5">
                          {b.category} · 사례 {b.cases}건
                        </p>
                      </div>
                      {!b.rightsOk && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              ) : <Empty title="해당하는 브랜드가 없습니다" />}
            </Panel>

            {/* 상세 */}
            <div className="lg:col-span-3 space-y-4">
              {!form ? (
                <Panel><Empty title="브랜드를 선택하세요" /></Panel>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {TABS.map((t) => (
                      <button key={t.key} onClick={() => setTab(t.key)}
                        className={`h-9 px-4 rounded-xl text-[13px] font-bold border transition ${
                          tab === t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}>
                        {t.label}
                      </button>
                    ))}
                    <div className="ml-auto flex gap-2">
                      <button disabled={busy} onClick={() => save(false)}
                        className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:border-slate-400 inline-flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5" /> 저장
                      </button>
                      <button disabled={busy || !detail?.canPublish} onClick={() => save(true)}
                        className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> 게시
                      </button>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-4">
                    <Panel className="lg:col-span-2" title={TABS.find((t) => t.key === tab)?.label}>
                      {tab === 'BASIC' && (
                        <div className="p-5 grid sm:grid-cols-2 gap-3">
                          {[
                            { k: 'displayName', l: '공식 브랜드명 *' },
                            { k: 'category', l: '카테고리 *' },
                            { k: 'legalName', l: '법인명' },
                            { k: 'website', l: '공식 웹사이트' },
                            { k: 'instagram', l: '인스타그램' },
                            { k: 'storeUrl', l: '팬스토어 URL' },
                          ].map((f) => (
                            <div key={f.k}>
                              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{f.l}</label>
                              <input value={form[f.k] ?? ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                            </div>
                          ))}
                          <div className="sm:col-span-2">
                            <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">브랜드 소개 *</label>
                            <textarea value={form.description ?? ''}
                              onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 300) })}
                              rows={3}
                              className="w-full rounded-xl border border-slate-200 p-3 text-[13px] resize-none focus:outline-none focus:border-slate-400" />
                            <p className="mt-1 text-right text-[12.5px] text-slate-500 tabular-nums">
                              {(form.description ?? '').length} / 300
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">대표 연락처</label>
                            <input value={form.contactEmail ?? ''} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                              placeholder="비공개 (대외 노출되지 않습니다)"
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                          </div>
                        </div>
                      )}

                      {tab === 'LOGO' && (
                        <div className="p-5 space-y-4">
                          <div className="grid sm:grid-cols-2 gap-3">
                            {[
                              { k: 'logoLight', l: '라이트 모드 로고 URL' },
                              { k: 'logoDark', l: '다크 모드 로고 URL' },
                              { k: 'logoAlt', l: '로고 대체 텍스트 (alt)' },
                              { k: 'heroImageUrl', l: '히어로 이미지 URL' },
                            ].map((f) => (
                              <div key={f.k}>
                                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{f.l}</label>
                                <input value={form[f.k] ?? ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                              </div>
                            ))}
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-200 p-5 flex items-center justify-center bg-white min-h-[100px]">
                              {form.logoLight
                                ? <img src={form.logoLight} alt="" className="max-h-12 max-w-full object-contain" />
                                : <span className="text-[12px] text-slate-500">라이트 모드 미리보기</span>}
                            </div>
                            <div className="rounded-2xl border border-slate-800 p-5 flex items-center justify-center bg-slate-900 min-h-[100px]">
                              {form.logoDark
                                ? <img src={form.logoDark} alt="" className="max-h-12 max-w-full object-contain" />
                                : <span className="text-[12px] text-slate-500">다크 모드 미리보기</span>}
                            </div>
                          </div>

                          {detail?.logoRight ? (
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex items-center gap-2 mb-2.5">
                                <ShieldCheck className="w-4 h-4 text-slate-500" />
                                <span className="text-[13px] font-bold text-slate-700">로고 사용권</span>
                                <Tag tone={detail.logoRight.status === 'VALID' ? 'emerald' : 'rose'}>{detail.logoRight.status}</Tag>
                              </div>
                              <div className="grid sm:grid-cols-3 gap-3 text-[12.5px]">
                                <div>
                                  <p className="text-[12px] text-slate-500">사용 권한 기간</p>
                                  <p className="font-semibold text-slate-700 tabular-nums">
                                    {fmtDate(detail.logoRight.validFrom)} ~ {fmtDate(detail.logoRight.validTo)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[12px] text-slate-500">허용 채널</p>
                                  <p className="font-semibold text-slate-700">{detail.logoRight.allowedScopes?.join(', ') || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[12px] text-slate-500">증빙</p>
                                  <p className="font-semibold text-slate-700">{detail.logoRight.evidenceName ?? '미등록'}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              <p className="text-[12.5px] text-amber-800 leading-relaxed">
                                등록된 로고 사용권이 없습니다. 권리·만료 큐에서 등록해야 게시할 수 있습니다.
                              </p>
                            </div>
                          )}

                          <p className="text-[12.5px] text-slate-500 leading-relaxed">
                            로고 색상·비율·문구를 임의로 변형하지 않습니다. 만료 또는 철회 시 자동으로 노출에서 제외됩니다.
                          </p>
                        </div>
                      )}

                      {tab === 'CASES' && (
                        detail?.cases?.length ? (
                          <div className="divide-y divide-slate-50">
                            {detail.cases.map((c: any) => (
                              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13.5px] font-bold text-slate-800 truncate">{c.title}</p>
                                  <p className="text-[12.5px] text-slate-500 mt-0.5">{c.athleteName}</p>
                                </div>
                                <Tag tone={c.status === 'PUBLISHED' ? 'emerald' : 'slate'}>{c.status}</Tag>
                                <span className="text-[12.5px] text-slate-500 tabular-nums shrink-0">
                                  {fmtDate(c.publishedAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Empty title="연결된 협업사례가 없습니다" desc="사례가 1건 이상 있어야 게시 체크리스트를 통과합니다." />
                        )
                      )}

                      {tab === 'EXPOSURE' && (
                        <div className="p-5 grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">노출 순서</label>
                            <input type="number" value={form.sortOrder ?? 0}
                              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] tabular-nums focus:outline-none" />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2.5 h-10 cursor-pointer">
                              <input type="checkbox" checked={!!form.featured}
                                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                                className="w-4 h-4 rounded accent-emerald-600" />
                              <span className="text-[13px] font-semibold text-slate-700">홈 추천 노출</span>
                            </label>
                          </div>
                          {[
                            { k: 'seoTitle', l: 'SEO 제목' },
                            { k: 'seoDesc', l: 'SEO 설명' },
                          ].map((f) => (
                            <div key={f.k} className="sm:col-span-2">
                              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{f.l}</label>
                              <input value={form[f.k] ?? ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </Panel>

                    {/* 우측: 체크리스트 · 미리보기 */}
                    <div className="space-y-4">
                      <Panel title="게시 체크리스트"
                        right={detail && (
                          <span className="text-[12px] font-bold text-slate-500 tabular-nums">
                            {detail.checksDone}/{detail.checks.length}
                          </span>
                        )}>
                        <div className="p-4 space-y-2.5">
                          {(detail?.checks ?? []).map((c: any) => (
                            <div key={c.key} className="flex items-start gap-2.5">
                              {c.ok
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                : <span className="w-4 h-4 rounded-full border-2 border-slate-200 mt-0.5 shrink-0" />}
                              <span className={`text-[13px] ${c.ok ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </Panel>

                      {detail?.duplicateWarning && (
                        <Panel title="중복 브랜드 경고">
                          <div className="p-4">
                            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                              <p className="text-[12.5px] text-amber-800 leading-relaxed mb-2">
                                유사한 브랜드가 존재할 수 있습니다.
                              </p>
                              <p className="text-[13px] font-bold text-slate-800">{detail.duplicateWarning.name}</p>
                              <p className="text-[12.5px] text-slate-500 mt-0.5 tabular-nums">
                                등록일 {fmtDate(detail.duplicateWarning.createdAt)} · 상태 {detail.duplicateWarning.status}
                              </p>
                            </div>
                          </div>
                        </Panel>
                      )}

                      <Panel title="공개 미리보기">
                        <div className="p-4">
                          <div className="rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="bg-gradient-to-b from-slate-50 to-white p-5 text-center">
                              {form.logoLight
                                ? <img src={form.logoLight} alt="" className="max-h-10 mx-auto object-contain mb-3" />
                                : <p className="text-[16px] font-extrabold text-slate-800 mb-3">{form.displayName}</p>}
                              <p className="text-[12.5px] text-slate-500 leading-relaxed line-clamp-3">
                                {form.description ?? '브랜드 소개가 입력되지 않았습니다'}
                              </p>
                              <p className="mt-2 text-[12px] text-slate-500">{form.category}</p>
                            </div>
                          </div>
                          {form.website && (
                            <a href={form.website} target="_blank" rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 hover:underline">
                              웹사이트 확인 <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </Panel>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AboutAdminShell>
  );
}
