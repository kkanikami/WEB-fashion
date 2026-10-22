import { KEY, HOUSES } from './data.js';
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { list: [], warn: '' };
    const d = JSON.parse(raw);
    if (!Array.isArray(d)) throw new Error('format');
    const list = d.filter(b => b && HOUSES.some(h => h.id === b.houseId) && Number.isFinite(b.total));
    return { list, warn: list.length !== d.length ? 'Часть сохранённых данных повреждена и пропущена.' : '' };
  } catch (e) {
    return { list: [], warn: 'Сохранённые брони повреждены и не загружены. Можно начать заново.' };
  }
}
export function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
}
export function clear() {
  try { localStorage.removeItem(KEY); } catch (e) { /* нет доступа к хранилищу */ }
}
