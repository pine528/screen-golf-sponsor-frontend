/**
 * IA02 페이지 · 메뉴 CMS + IA11 FAQ · 이용방법 CMS (핸드오프 v1.0 §11.2)
 * 블록을 조합해 페이지를 만들고, 검증 체크리스트를 통과해야 게시할 수 있다.
 */
import { useCallback, useEffect, useState } from 'react';
import {Eye, EyeOff, Trash2, Save, Send, CheckCircle2, AlertTriangle, XCircle, Monitor, Smartphone} from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  Panel, Status, Empty, Loading, useAdminGuard, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

export default function AboutOpsPages() {
  const guard = useAdminGuard();
  const [list, setList] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [device, setDevice] = useState<'PC' | 'MOBILE'>('PC');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getAboutAdminPages()
      .then((r) => {
        setList(r.data);
        if (!selected && r.data?.pages?.[0]) setSelected(r.data.pages[0].id);
      })
      .catch((e) => guard(e, '/admin/about/pages'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setError(null); setMsg(null); setDirty(false);
    api.getAboutAdminPage(selected)
      .then((r) => { setDetail(r.data); setForm(r.data.page); setBlocks(r.data.blocks); })
      .catch(() => setDetail(null));
  }, [selected]);

  const save = async (publish = false) => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.saveAboutPage({ ...form, blocks });
      const id = r.data.page.id;
      if (publish) await api.publishAboutPage(id);
      setMsg(publish ? '페이지가 게시되었습니다' : '저장되었습니다');
      setDirty(false);
      await load();
      const d = await api.getAboutAdminPage(id);
      setDetail(d.data); setForm(d.data.page); setBlocks(d.data.blocks);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '저장에 실패했습니다');
    } finally { setBusy(false); }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next); setDirty(true);
  };

  const addBlock = (type: string) => {
    setBlocks((b) => [...b, { type, name: type, payload: {}, visible: true }]);
    setDirty(true);
  };

  return (
    <AboutAdminShell title="페이지 · 메뉴" desc="소개 페이지의 블록 구성과 메뉴 라벨을 관리합니다."
      breadcrumb={['소개 운영', '페이지 · 메뉴']}>
      {loading && !list ? <Loading /> : !list ? <Empty title="페이지를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-4 gap-4">
            {/* 페이지 목록 */}
            <Panel title={`페이지 ${list.pages.length}개`}>
              {list.pages.length ? (
                <div className="divide-y divide-slate-50">
                  {list.pages.map((p: any) => (
                    <button key={p.id} onClick={() => setSelected(p.id)}
                      className={`w-full text-left px-4 py-3.5 transition ${
                        selected === p.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13.5px] font-bold text-slate-800 truncate flex-1">{p.title}</p>
                        <Status code={p.status} label={
                          ({ DRAFT: '작성 중', PUBLISHED: '게시 중', SCHEDULED: '예약', ARCHIVED: '보관' } as any)[p.status] ?? p.status
                        } />
                      </div>
                      <p className="font-mono text-[12px] text-slate-500">/{p.slug}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">블록 {p.blocks}개 · v{p.version}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty title="등록된 페이지가 없습니다" desc="CMS 페이지를 만들면 이곳에 표시됩니다." />
              )}
            </Panel>

            {/* 편집 */}
            <div className="lg:col-span-3 space-y-4">
              {!detail || !form ? (
                <Panel><Empty title="페이지를 선택하세요" /></Panel>
              ) : (
                <>
                  <Panel title={form.title}
                    right={
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-slate-500">/{form.slug}</span>
                        <button disabled={busy} onClick={() => save(false)}
                          className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:border-slate-400 inline-flex items-center gap-1.5">
                          <Save className="w-3.5 h-3.5" /> 저장
                        </button>
                        <button disabled={busy || !detail.canPublish} onClick={() => save(true)}
                          className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" /> 게시
                        </button>
                      </div>
                    }>
                    <div className="p-5 grid sm:grid-cols-2 gap-3">
                      {[
                        { k: 'title', l: '페이지 제목 *', max: 60 },
                        { k: 'menuLabel', l: '메뉴 라벨 (12자 이내)', max: 12 },
                        { k: 'seoTitle', l: 'SEO 제목', max: 60 },
                        { k: 'seoDesc', l: 'SEO 설명', max: 160 },
                      ].map((f) => (
                        <div key={f.k}>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{f.l}</label>
                          <input value={form[f.k] ?? ''}
                            onChange={(e) => { setForm({ ...form, [f.k]: e.target.value.slice(0, f.max) }); setDirty(true); }}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                          <p className="mt-1 text-right text-[12.5px] text-slate-500 tabular-nums">
                            {(form[f.k] ?? '').length} / {f.max}
                          </p>
                        </div>
                      ))}
                      <div className="sm:col-span-2">
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">메뉴 설명</label>
                        <input value={form.menuDesc ?? ''}
                          onChange={(e) => { setForm({ ...form, menuDesc: e.target.value.slice(0, 60) }); setDirty(true); }}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                      </div>
                    </div>
                  </Panel>

                  <div className="grid lg:grid-cols-3 gap-4">
                    {/* 블록 */}
                    <Panel className="lg:col-span-2" title="페이지 구성"
                      right={
                        <select onChange={(e) => { if (e.target.value) { addBlock(e.target.value); e.target.value = ''; } }}
                          className="h-9 px-3 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-600 focus:outline-none">
                          <option value="">+ 블록 추가</option>
                          {detail.blockTypes.map((b: any) => <option key={b.code} value={b.code}>{b.label}</option>)}
                        </select>
                      }>
                      {blocks.length ? (
                        <div className="p-3 space-y-2">
                          {blocks.map((b, i) => {
                            const def = detail.blockTypes.find((t: any) => t.code === b.type);
                            return (
                              <div key={i} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center gap-3">
                                  <span className="flex flex-col gap-0.5">
                                    <button onClick={() => move(i, -1)} disabled={i === 0}
                                      className="text-slate-300 hover:text-slate-600 disabled:opacity-30 text-[12.5px] leading-none">▲</button>
                                    <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1}
                                      className="text-slate-300 hover:text-slate-600 disabled:opacity-30 text-[12.5px] leading-none">▼</button>
                                  </span>
                                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-[12px] font-bold flex items-center justify-center shrink-0">
                                    {i + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[13.5px] font-bold text-slate-800">{def?.label ?? b.type}</p>
                                    <p className="text-[12px] text-slate-500 mt-0.5">{def?.rule}</p>
                                  </div>
                                  <button onClick={() => {
                                    const next = [...blocks];
                                    next[i] = { ...b, visible: !b.visible };
                                    setBlocks(next); setDirty(true);
                                  }}
                                    className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-bold ${
                                      b.visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {b.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    {b.visible ? '표시' : '숨김'}
                                  </button>
                                  <button onClick={() => { setBlocks(blocks.filter((_, j) => j !== i)); setDirty(true); }}
                                    className="w-8 h-8 rounded-lg hover:bg-rose-50 text-rose-400 flex items-center justify-center">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* 간이 payload 편집 */}
                                <div className="mt-3 pt-3 border-t border-slate-100 grid sm:grid-cols-2 gap-2.5">
                                  {['title', 'description', 'ctaLabel', 'ctaTo'].map((k) => (
                                    <div key={k}>
                                      <label className="block text-[12px] font-semibold text-slate-500 mb-1">
                                        {({ title: '제목', description: '설명', ctaLabel: '버튼 라벨', ctaTo: '링크 (내부 경로)' } as any)[k]}
                                      </label>
                                      <input value={b.payload?.[k] ?? ''}
                                        onChange={(e) => {
                                          const next = [...blocks];
                                          next[i] = { ...b, payload: { ...b.payload, [k]: e.target.value } };
                                          setBlocks(next); setDirty(true);
                                        }}
                                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:border-slate-400" />
                                      {k === 'ctaTo' && b.payload?.ctaTo && !String(b.payload.ctaTo).startsWith('/') && (
                                        <p className="mt-1 text-[12.5px] text-rose-500">내부 경로는 /로 시작해야 합니다</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Empty title="블록이 없습니다" desc="상단에서 블록을 추가하세요." />
                      )}
                    </Panel>

                    {/* 검증 · 미리보기 */}
                    <div className="space-y-4">
                      <Panel title="검증 체크리스트"
                        right={
                          <span className="text-[12px] font-bold text-slate-500 tabular-nums">
                            {detail.checks.filter((c: any) => c.ok).length}/{detail.checks.length}
                          </span>
                        }>
                        <div className="p-4 space-y-2.5">
                          {detail.checks.map((c: any) => (
                            <div key={c.key} className="flex items-start gap-2.5">
                              {c.ok
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                : c.key === 'seo'
                                  ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                  : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
                              <span className={`text-[13px] ${c.ok ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>{c.label}</span>
                            </div>
                          ))}
                        </div>
                        {!detail.canPublish && (
                          <p className="px-4 pb-4 text-[12.5px] text-rose-500">
                            필수 검증 항목을 통과해야 게시할 수 있습니다.
                          </p>
                        )}
                      </Panel>

                      <Panel title="라이브 미리보기"
                        right={
                          <div className="flex rounded-lg border border-slate-200 p-0.5">
                            {[
                              { k: 'PC', icon: Monitor }, { k: 'MOBILE', icon: Smartphone },
                            ].map((d) => {
                              const I = d.icon;
                              return (
                                <button key={d.k} onClick={() => setDevice(d.k as any)}
                                  className={`h-7 px-2.5 rounded-md text-[12.5px] font-bold inline-flex items-center gap-1 ${
                                    device === d.k ? 'bg-emerald-600 text-white' : 'text-slate-500'
                                  }`}>
                                  <I className="w-3 h-3" /> {d.k === 'PC' ? 'PC' : '모바일'}
                                </button>
                              );
                            })}
                          </div>
                        }>
                        <div className="p-4">
                          <div className={`mx-auto rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden ${
                            device === 'MOBILE' ? 'w-[220px]' : 'w-full'
                          }`}>
                            <div className="bg-white px-4 py-3 border-b border-slate-100">
                              <p className="text-[12px] font-extrabold text-slate-900">SPONPIK</p>
                            </div>
                            <div className="p-4 space-y-2">
                              {blocks.filter((b) => b.visible).map((b, i) => (
                                <div key={i} className="rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                                  <p className="text-[12px] font-bold text-slate-700 truncate">
                                    {b.payload?.title || b.name || b.type}
                                  </p>
                                  {b.payload?.description && (
                                    <p className="text-[12.5px] text-slate-500 mt-0.5 line-clamp-2">{b.payload.description}</p>
                                  )}
                                </div>
                              ))}
                              {blocks.filter((b) => b.visible).length === 0 && (
                                <p className="text-[12px] text-slate-500 text-center py-6">표시할 블록이 없습니다</p>
                              )}
                            </div>
                          </div>
                          <p className="mt-3 text-[12px] text-slate-500 text-center">실제 사이트와 다를 수 있습니다.</p>
                        </div>
                      </Panel>

                      <Panel title="버전 정보">
                        <div className="p-4 space-y-2 text-[12.5px]">
                          {[
                            { l: '현재 버전', v: `v${form.version}` },
                            { l: '최종 수정', v: fmtDate(form.updatedAt, true) },
                            { l: '게시 일시', v: fmtDate(form.publishedAt, true) },
                          ].map((r) => (
                            <div key={r.l} className="flex items-center justify-between">
                              <span className="text-slate-500">{r.l}</span>
                              <span className="font-semibold text-slate-700 tabular-nums">{r.v}</span>
                            </div>
                          ))}
                        </div>
                      </Panel>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {dirty && (
            <div className="sticky bottom-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[13px] font-semibold text-amber-800 flex-1">
                저장되지 않은 변경사항이 있습니다.
              </p>
              <button disabled={busy} onClick={() => save(false)}
                className="h-9 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800">
                저장
              </button>
            </div>
          )}
        </div>
      )}
    </AboutAdminShell>
  );
}
