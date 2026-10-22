import { HOUSES } from './data.js';
import { load, save, clear } from './storage.js';
import { drawMap } from './map.js';

const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('ru-RU') + ' €';
const guests = n => n + (n % 10 === 1 && n !== 11 ? ' гость' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n) ? ' гостя' : ' гостей');
const TAG = { free: '✓ свободен', sel: '● выбран', busy: '✕ занят' };
const SYM = { free: '✓', sel: '●', busy: '✕' };
let bookings = [], selected = null, locked = false;
const nodes = {};

const say = (t, err) => { const s = $('status'); s.textContent = t; s.className = 'msg' + (err ? ' err' : ''); };
const house = id => HOUSES.find(h => h.id === id);
const busy = h => h.busy || bookings.some(b => b.houseId === h.id);
const stateOf = h => busy(h) ? 'busy' : selected === h.id ? 'sel' : 'free';
const filters = () => {
  const g = parseInt($('fGuests').value, 10), p = parseFloat($('fPrice').value);
  return { g: Number.isFinite(g) ? g : 1, p: Number.isFinite(p) ? p : Infinity };
};

function update() {
  const f = filters(); let shown = 0;
  HOUSES.forEach(h => {
    const n = nodes[h.id], st = stateOf(h), ok = h.cap >= f.g && h.price <= f.p;
    n.g.classList.toggle('off', !ok); n.li.hidden = !ok; shown += ok;
    n.g.dataset.state = st; n.it.dataset.state = st;
    n.g.querySelector('.bt').textContent = SYM[st] + h.id;
    n.g.setAttribute('aria-label', `Дом ${h.id} ${h.name}, ${TAG[st]}, ${fmt(h.price)} за ночь`);
    n.g.setAttribute('aria-disabled', st === 'busy');
    n.it.setAttribute('aria-pressed', st === 'sel'); n.it.setAttribute('aria-disabled', st === 'busy');
    n.it.innerHTML = `<strong>${h.id}. ${h.name}</strong><span class="tag">${TAG[st]}</span><span class="meta">до ${guests(h.cap)} · ${fmt(h.price)} за ночь</span>`;
  });
  $('empty').hidden = shown > 0;
  const s = house(selected);
  if (s && !(s.cap >= f.g && s.price <= f.p)) {
    selected = null; say('Выбранный дом скрыт фильтром, выбор сброшен.', true); renderCard(); update(); return;
  }
  renderMine();
}

function choose(id) {
  const h = house(id);
  if (busy(h)) { say(`Дом «${h.name}» занят и недоступен для выбора.`, true); return; }
  selected = selected === id ? null : id;
  say(selected ? `Выбран дом «${h.name}».` : 'Выбор снят.');
  renderCard(); update();
}

function renderCard() {
  const c = $('card'), h = house(selected);
  if (!h) { c.innerHTML = '<p class="hint">Дом не выбран. Нажмите на домик на схеме или в списке.</p>'; return; }
  c.innerHTML = `<h3>${h.name}</h3><p>${h.desc}</p><p><strong>${fmt(h.price)}</strong> за ночь · до ${guests(h.cap)}</p>` +
    `<form id="bf" novalidate><div class="row">` +
    `<div class="field"><label for="bGuests">Гостей (1–${h.cap})</label><input id="bGuests" type="number" min="1" max="${h.cap}" step="1" value="1" inputmode="numeric" aria-describedby="eG"><span class="err-t" id="eG"></span></div>` +
    `<div class="field"><label for="bNights">Ночей (1–30)</label><input id="bNights" type="number" min="1" max="30" step="1" value="1" inputmode="numeric" aria-describedby="eN"><span class="err-t" id="eN"></span></div>` +
    `</div><div class="total" id="total" aria-live="polite"></div><button type="submit" class="btn primary" id="ok">Подтвердить бронь</button></form>`;
  $('bGuests').addEventListener('input', () => recalc());
  $('bNights').addEventListener('input', () => recalc());
  $('bf').addEventListener('submit', e => { e.preventDefault(); confirmBooking(); });
  recalc(true);
}

function readForm(show) {
  const h = house(selected);
  const gv = $('bGuests').value.trim(), nv = $('bNights').value.trim(), g = Number(gv), n = Number(nv);
  const eg = gv === '' || !Number.isInteger(g) || g < 1 || g > h.cap ? `Укажите целое число гостей от 1 до ${h.cap}.` : '';
  const en = nv === '' || !Number.isInteger(n) || n < 1 || n > 30 ? 'Укажите целое число ночей от 1 до 30.' : '';
  if (show) {
    $('eG').textContent = eg; $('eN').textContent = en;
    $('bGuests').setAttribute('aria-invalid', !!eg); $('bNights').setAttribute('aria-invalid', !!en);
  }
  return { h, g, n, ok: !eg && !en };
}
function recalc(quiet) {
  const r = readForm(!quiet);
  $('total').textContent = r.ok ? 'Итого: ' + fmt(r.h.price * r.n) : 'Итого: —';
}

function confirmBooking() {
  if (locked) return;
  if (selected === null) { say('Сначала выберите свободный дом.', true); return; }
  const r = readForm(true);
  if (!r.ok) { say('Исправьте ошибки в форме, бронь не создана.', true); return; }
  if (busy(r.h)) { say('Этот дом уже занят.', true); return; }
  locked = true; $('ok').disabled = true;
  const b = { num: Date.now().toString(36).toUpperCase(), houseId: r.h.id, name: r.h.name, guests: r.g, nights: r.n, total: r.h.price * r.n };
  bookings.push(b);
  const saved = save(bookings);
  selected = null; renderCard(); update();
  if (saved) say(`Бронь №${b.num} создана: «${b.name}», ${b.nights} н., ${fmt(b.total)}. Учебное демо.`);
  else say('Браузер не разрешает сохранение: брони пропадут после обновления страницы.', true);
  locked = false;
}

function renderMine() {
  const m = $('mine');
  if (!bookings.length) { m.innerHTML = '<p class="hint">Броней пока нет. Выберите дом и подтвердите бронь.</p>'; return; }
  m.innerHTML = '';
  bookings.forEach(b => {
    const d = document.createElement('div'); d.className = 'book';
    d.innerHTML = `<p><strong>Бронь №${b.num}</strong></p><p>${b.name} · ${guests(b.guests)} · ${b.nights} н.</p><p>Сумма: <strong>${fmt(b.total)}</strong></p>`;
    const x = document.createElement('button');
    x.type = 'button'; x.className = 'btn danger'; x.textContent = 'Отменить бронь';
    x.setAttribute('aria-label', `Отменить бронь №${b.num}, ${b.name}`);
    x.addEventListener('click', () => {
      bookings = bookings.filter(y => y.num !== b.num); save(bookings); update();
      say(`Бронь №${b.num} отменена, дом «${b.name}» свободен.`);
    });
    d.append(x); m.append(d);
  });
}

const gs = drawMap($('map'), HOUSES, choose);
HOUSES.forEach(h => {
  const li = document.createElement('li'), it = document.createElement('button');
  it.type = 'button'; it.className = 'item'; it.addEventListener('click', () => choose(h.id));
  li.append(it); $('list').append(li); nodes[h.id] = { g: gs[h.id], li, it };
});
$('fGuests').addEventListener('input', update);
$('fPrice').addEventListener('input', update);
$('fReset').addEventListener('click', () => { $('fGuests').value = 1; $('fPrice').value = 300; update(); say('Фильтры сброшены.'); });
$('demoReset').addEventListener('click', () => {
  if (!confirm('Удалить все брони этого демо и вернуть начальное состояние?')) return;
  bookings = []; selected = null; clear();
  $('fGuests').value = 1; $('fPrice').value = 300; renderCard(); update(); say('Демо сброшено.');
});

const r = load(); bookings = r.list;
renderCard(); update();
if (r.warn) say(r.warn, true);
