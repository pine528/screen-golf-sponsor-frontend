/**
 * 선수 메뉴 공통 훅 — 관심 선수(계정 단위) · 비교 후보(최대 3명)
 *  - useFavorites: 로그인 시 /me/favorite-athletes/ids 로 초기화, 토글은 낙관적 반영 후 실패 시 복원.
 *    Guest가 하트를 누르면 로그인으로 보내고 돌아온 뒤 원래 선수를 저장한다 (§7.1 restore).
 *  - useCompare: 후보를 sessionStorage에 두고 어디서든 같은 선택을 본다 (§6.1). ids는 /athletes/compare?ids= 로 공유.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const PENDING_KEY = 'sponpik.favorite.pending';
export const COMPARE_KEY = 'sponpik.athletes.compare';
export const COMPARE_MAX = 3;

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ athleteId: string; name?: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { setFavs(new Set()); return; }
    api.getMyFavoriteAthleteIds().then((r: any) => setFavs(new Set(r?.data?.ids || []))).catch(() => {});
    /* 로그인 전에 눌렀던 하트 복원 */
    try {
      const pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
      if (pending?.athleteId) {
        sessionStorage.removeItem(PENDING_KEY);
        api.addMyFavoriteAthlete(pending.athleteId).then(() => setFavs((s) => new Set(s).add(pending.athleteId))).catch(() => {});
      }
    } catch { /* 무시 */ }
  }, [isAuthenticated]);

  const toggle = useCallback(async (athleteId: string, name?: string) => {
    if (!isAuthenticated) {
      try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ athleteId })); } catch { /* 무시 */ }
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const on = favs.has(athleteId);
    setFavs((s) => { const n = new Set(s); on ? n.delete(athleteId) : n.add(athleteId); return n; });
    try {
      if (on) { await api.removeMyFavoriteAthlete(athleteId); setToast({ athleteId, name }); setTimeout(() => setToast((t) => (t?.athleteId === athleteId ? null : t)), 6000); }
      else await api.addMyFavoriteAthlete(athleteId);
    } catch (e: any) {
      setFavs((s) => { const n = new Set(s); on ? n.add(athleteId) : n.delete(athleteId); return n; });
      if (e?.response?.status === 401) navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [favs, isAuthenticated, navigate]);

  /** 해제 되돌리기 (§7.1 undo) */
  const undo = useCallback(async () => {
    if (!toast) return;
    const id = toast.athleteId;
    setToast(null);
    setFavs((s) => new Set(s).add(id));
    try { await api.addMyFavoriteAthlete(id); } catch { setFavs((s) => { const n = new Set(s); n.delete(id); return n; }); }
  }, [toast]);

  return { favs, toggle, toast, undo, dismissToast: () => setToast(null) };
}

function readCompare(): any[] {
  try { const v = JSON.parse(sessionStorage.getItem(COMPARE_KEY) || '[]'); return Array.isArray(v) ? v.slice(0, COMPARE_MAX) : []; } catch { return []; }
}

export function useCompare() {
  const [compare, setCompare] = useState<any[]>(readCompare);
  useEffect(() => { try { sessionStorage.setItem(COMPARE_KEY, JSON.stringify(compare)); } catch { /* 무시 */ } }, [compare]);

  const has = useCallback((id: string) => compare.some((x) => x.id === id), [compare]);
  const toggle = useCallback((a: any) => {
    setCompare((prev) => (prev.some((x) => x.id === a.id) ? prev.filter((x) => x.id !== a.id) : prev.length >= COMPARE_MAX ? prev : [...prev, minimal(a)]));
  }, []);
  const remove = useCallback((id: string) => setCompare((prev) => prev.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setCompare([]), []);
  const replace = useCallback((list: any[]) => setCompare(list.slice(0, COMPARE_MAX).map(minimal)), []);

  return { compare, has, toggle, remove, clear, replace, full: compare.length >= COMPARE_MAX };
}

function minimal(a: any) {
  return { id: a.id, name: a.name, tour: a.tour, region: a.region, profileImageUrl: a.profileImageUrl };
}
