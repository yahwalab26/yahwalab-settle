/* tools/contracts.js v1.10.1 — 야화랩 전자계약 관리자 도구 (정산 사이트 iframe 겸 단독 페이지)
   서버: Edge Function ec-admin (관리자 JWT + is_admin(aal2) 확인). 읽기 전용 참조: authors·works·work_authors.
   규칙: 인라인 스크립트 없음(CSP script-src 'self'), 개인정보는 기본 마스킹·'원문 보기'는 서버에 기록. */
(function () {
  'use strict';
  const SB = supabase.createClient('https://wddixxdrndgvjgicwunu.supabase.co', 'sb_publishable_fIrxIqOmX_-BFpSELdmvXQ_kkYSkaCx');
  const ST = { draft: ['작성중', ''], review_sent: ['검토용 발송', ''], pub_pending: ['야화랩 서명 대기', 'warn'], pub_signed: ['작가 발송 대기', 'warn'], sent: ['작가 서명 대기', 'warn'], opened: ['작가 열람함', 'warn'], signed: ['처리 대기', 'bad'], completed: ['완료', 'ok'], cancelled: ['취소', ''] };
  const TY = { general: '일반', special: '특약' };
  // 원고 인도일: 달력에서 날짜 선택 또는 '즉시(완고)' 체크. 값은 'YYYY-MM-DD' 또는 '즉시', 비우면 작가가 입력
  const delivField = (label) => {
    const id = uid(), d = h('input', { type: 'date', id }), c = h('input', { type: 'checkbox' });
    c.onchange = () => { d.disabled = c.checked; if (c.checked) d.value = ''; };
    return { get: () => (c.checked ? '즉시' : d.value), el: h('div', {}, h('label', { for: id }, label), h('div', { class: 'delrow' }, d, h('label', { class: 'chk' }, c, '즉시 (완고)'))) };
  };
  const INFO = [['address', '주소'], ['name', '성명(본명)'], ['phone', '연락처'], ['bank_name', '은행명'], ['bank_no', '계좌번호'], ['bank_holder', '예금주'], ['rrn', '주민(사업자)등록번호']];
  const EVN = { created: '계약서 생성', review_sent: '검토용 발송', pub_request_sent: '야화랩 서명 요청 발송', opened: '열람', email_failed: '이메일 확인 실패', email_verified: '이메일 확인', consent_agreed: '동의', publisher_signed: '야화랩 서명', sent: '작가 서명 요청 발송', info_submitted: '작가 정보 입력', signed: '작가 서명', completed: '완료', mail_sent: '완료 메일 발송', mail_failed: '메일 발송 실패', complete_failed: '완료 처리 실패', pii_viewed: '개인정보 원문 열람', file_downloaded: '파일 내려받기', cancelled: '취소' };
  const root = document.getElementById('root');
  const h = (t, a, ...c) => { const e = document.createElement(t); Object.entries(a || {}).forEach(([k, v]) => { if (/^on/.test(k) && typeof v === 'function') e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v); }); c.flat().forEach(x => { if (x == null || x === false) return; e.append(x instanceof Node ? x : document.createTextNode(String(x))); }); return e; };
  const kst = s => s ? new Date(new Date(s).getTime() + 9 * 36e5).toISOString().replace('T', ' ').slice(0, 16) : '';
  let uidN = 0; const uid = () => 'ec' + (++uidN);
  const lab = (el, text) => { el.id = el.id || uid(); return h('div', {}, h('label', { for: el.id }, text), el); };   // 라벨과 입력칸 연결(접근성·터치 영역)
  const tbox = document.getElementById('toasts') || document.body.appendChild(h('div', { id: 'toasts', class: 'ec-toasts', role: 'status', 'aria-live': 'polite' }));
  const toast = (text, kind) => {   // 화면이 다시 그려져도 남는 알림. 성공은 자동 닫힘, 오류는 직접 닫을 때까지 유지
    if (!text) return;
    const t = h('div', { class: 'ec-toast ' + (kind || 'ok'), role: kind === 'bad' ? 'alert' : null }, h('span', {}, text), h('button', { class: 'x', type: 'button', 'aria-label': '알림 닫기', onclick: () => t.remove() }, '×'));
    tbox.append(t); while (tbox.children.length > 3) tbox.firstChild.remove();
    if (kind !== 'bad') setTimeout(() => t.remove(), Math.max(5000, text.length * 130));
  };
  const ask = (title, text, ok = '확인', danger = false) => new Promise(res => {   // 브라우저 기본 confirm 대신 사이트 모양 대화상자(Esc·초점 가둠은 <dialog>가 처리)
    const d = h('dialog', { class: 'ec-dialog', 'aria-labelledby': 'dlgT' }, h('h2', { id: 'dlgT' }, title), h('p', {}, text),
      h('div', { class: 'btns' }, h('button', { type: 'button', autofocus: danger ? '' : null, onclick: () => d.close('no') }, '닫기'), h('button', { type: 'button', class: danger ? 'p danger' : 'p', autofocus: danger ? null : '', onclick: () => d.close('yes') }, ok)));
    d.addEventListener('close', () => { res(d.returnValue === 'yes'); d.remove(); }); document.body.append(d); d.showModal();
  });
  const withBusy = async (btn, fn, label) => { const t0 = btn.textContent; btn.disabled = true; if (label) btn.textContent = label; try { return await fn(); } finally { btn.disabled = false; btn.textContent = t0; } };

  async function api(body) {
    const { data, error } = await SB.functions.invoke('ec-admin', { body });
    if (error) { let m = '요청에 실패했습니다.'; try { const j = await error.context.json(); m = j.message || m; } catch (e) { /* 무시 */ } throw new Error(m); }
    if (!data || !data.ok) throw new Error((data && data.message) || '오류가 발생했습니다.');
    return data;
  }
  const run = async (fn, okText) => { try { const r = await fn(); if (okText) toast(okText, 'ok'); return r; } catch (e) { toast(e.message === 'BAD_STATUS' ? '지금 상태에서는 할 수 없는 작업입니다. 이미 완료되었거나 취소된 계약일 수 있습니다. 최신 상태로 화면을 새로 불러왔습니다.' : e.message, 'bad'); } };
  const gate = (t, sub, link) => { root.replaceChildren(h('div', { class: 'gate' }, h('p', { class: 'gt' }, t), sub ? h('p', { class: 'k' }, sub) : '', link && link[0] ? h('a', { class: 'btn p', href: link[0], target: link[2] ? '_blank' : null, rel: link[2] ? 'noopener' : null }, link[1]) : '')); };
  const appbar = document.getElementById('appbar'); if (appbar && window.top === window.self) appbar.hidden = false;   // 단독 페이지일 때만 상단 바 표시(정산 사이트 안에 끼워 열면 숨김)

  /* ---------- 목록 ---------- */
  const ACTIVE = ['draft', 'review_sent', 'pub_pending', 'pub_signed', 'sent', 'opened'];
  const GROUP = { all: ['전체', () => true], active: ['진행 중', c => ACTIVE.includes(c.status)], fix: ['처리 필요', c => c.status === 'signed'], done: ['완료', c => c.status === 'completed'], cancelled: ['취소', c => c.status === 'cancelled'] };
  let FL = { f: 'all', q: '' };   // 보기 조건은 상세에 다녀와도 유지
  async function list() {
    root.replaceChildren(h('div', { class: 'top' }, h('div', {}, h('h1', {}, '전자계약'), h('div', { class: 'k' }, '일반·특약 계약서 · 가계약서(검토용) · 전자서명 · 감사 추적 인증서')), h('button', { class: 'p', onclick: form }, '+ 새 계약서')), h('div', { class: 'sec', id: 'lst' }, '불러오는 중…'));
    const j = await run(() => api({ action: 'list' })); if (!j) return $('#lst').replaceChildren(h('div', { class: 'k' }, '목록을 불러오지 못했습니다. '), h('button', { onclick: list }, '다시 시도'));
    const items = j.items;
    if (!items.length) return $('#lst').replaceChildren(h('div', { class: 'k' }, '아직 계약서가 없습니다. 오른쪽 위 “새 계약서”로 시작하세요.'));
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': '상태별 보기' }), tbl = h('div', { class: 'tbl' });
    const sq = h('input', { type: 'text', class: 'q', value: FL.q, placeholder: '필명·작품·문서 ID 검색', 'aria-label': '계약서 검색', autocomplete: 'off' });
    const drawChips = () => chips.replaceChildren(...Object.entries(GROUP).map(([k, [label, fn]]) => { const n = items.filter(fn).length; return (k === 'cancelled' && !n) ? null : h('button', { class: 'chip' + (k === 'fix' && n ? ' fix' : ''), type: 'button', 'aria-pressed': String(FL.f === k), onclick: () => { FL.f = k; drawChips(); drawTable(); } }, `${label} ${n}`); }).filter(Boolean));
    const drawTable = () => {
      const q = FL.q.trim().toLowerCase(), rows = items.filter(GROUP[FL.f][1]).filter(c => !q || [c.pen_name, c.work_title, c.doc_no, c.author_email].some(x => String(x || '').toLowerCase().includes(q)));
      if (!rows.length) return tbl.replaceChildren(h('div', { class: 'k empty', role: 'status' }, '조건에 맞는 계약서가 없습니다. ', h('button', { onclick: () => { FL = { f: 'all', q: '' }; sq.value = ''; drawChips(); drawTable(); } }, '필터 해제')));
      const trs = rows.map(c => { const [t, cls] = ST[c.status] || [c.status, '']; return h('tr', { class: 'r', tabindex: '0', onclick: () => detail(c.id), onkeydown: e => { if (e.key === 'Enter') detail(c.id); } }, h('td', { class: 'mono c-date' }, kst(c.created_at)), h('td', { class: 'c-id' }, c.doc_no), h('td', { class: 'c-type' }, h('span', { class: 'tag' }, TY[c.contract_type])), h('td', { class: 'c-pen' }, c.pen_name || ''), h('td', { class: 'c-title' }, c.work_title), h('td', { class: 'c-stat' }, h('span', { class: 'tag ' + cls }, t))); });
      tbl.replaceChildren(h('div', { class: 'k cnt', role: 'status' }, `${rows.length}건`), h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ...['생성', '문서 ID', '종류', '필명', '작품', '상태'].map(x => h('th', {}, x)))), h('tbody', {}, trs))));
    };
    sq.addEventListener('input', () => { FL.q = sq.value; drawTable(); });
    drawChips(); drawTable();
    $('#lst').replaceChildren(h('div', { class: 'bar' }, chips, sq), tbl);
  }
  const $ = s => document.querySelector(s);

  /* ---------- 새 계약서 ---------- */
  async function form() {
    const [au, wk, wa] = await Promise.all([SB.from('authors').select('id,pen_name,email').order('pen_name'), SB.from('works').select('id,title').order('title'), SB.from('work_authors').select('work_id,author_id')]);
    const A = au.data || [], W = wk.data || [], WA = wa.data || [], f = {};
    // 입력칸 한 묶음: 라벨(필수 표시) + 입력 + 안내 + 칸 바로 아래 오류 문구
    const fld = (k, label, el, o = {}) => { const id = uid(); el.id = id; el.setAttribute('aria-describedby', id + 'e'); f[k] = el; el.addEventListener('input', () => setErr(k, '')); return h('div', { class: 'fld' }, h('label', { for: id }, label, o.req ? h('span', { class: 'rq' }, ' 필수') : ''), el, o.hint || '', h('div', { class: 'fe', id: id + 'e' })); };
    const setErr = (k, m) => { const el = f[k]; el.setAttribute('aria-invalid', m ? 'true' : 'false'); document.getElementById(el.id + 'e').textContent = m; };
    const inp = (k, label, type = 'text', val = '', ph = '', req = false, hint = '') => fld(k, label, h('input', { type, value: val, placeholder: ph }), { req, hint });
    const typeVal = () => document.querySelector('input[name=ctype]:checked').value;
    const choice = (val, title, desc, on) => { const r = h('input', { type: 'radio', name: 'ctype', value: val, checked: on ? '' : null }); r.onchange = () => { sp.hidden = typeVal() !== 'special'; }; return h('label', { class: 'choice' }, r, h('span', {}, h('b', {}, title), h('span', { class: 'k' }, desc))); };
    f.au = h('select', {}, h('option', { value: '' }, '직접 입력'), A.map(a => h('option', { value: a.id }, a.pen_name)));
    f.wk = h('select', {}, h('option', { value: '' }, '직접 입력'));
    const fillWorks = () => { const ids = new Set(WA.filter(x => String(x.author_id) === f.au.value).map(x => String(x.work_id))); f.wk.replaceChildren(h('option', { value: '' }, '직접 입력'), W.filter(w => !f.au.value || ids.has(String(w.id))).map(w => h('option', { value: w.id }, w.title))); };
    const share = h('div', { class: 'k' }, '작가 80% · 야화랩 20%');
    const sp = h('div', { class: 'sec', hidden: true }, h('h2', {}, '특약'), h('div', { class: 'k hint' }, '정해진 기간 동안만 다른 정산 비율을 적용합니다.'), h('div', { class: 'g' }, inp('xu', '특약 적용 종료일', 'date', '', '', true), inp('xa', '특약 작가 정산 %', 'number', 90, '', true)));
    const body = h('div', {},
      h('div', { class: 'sec' }, h('h2', {}, '계약 종류'), h('div', { class: 'choices', role: 'radiogroup', 'aria-label': '계약 종류' }, choice('general', '일반 계약', '기본 정산 비율을 적용합니다.', true), choice('special', '특약 계약', '기간 한정 특별 정산 비율을 추가합니다.', false))),
      h('div', { class: 'sec' }, h('h2', {}, '작가와 작품'), h('div', { class: 'k hint' }, '목록에서 고르면 아래 칸이 자동으로 채워집니다. 목록에 없으면 직접 입력하세요.'),
        h('div', { class: 'g' }, lab(f.au, '작가 불러오기'), lab(f.wk, '작품 불러오기')),
        h('div', { class: 'g sp' }, inp('email', '작가 이메일 (서명 링크를 받는 주소)', 'email', '', '', true), inp('pen', '필명', 'text', '', '', true), inp('title', '작품명(제호)', 'text', '', '', true))),
      h('div', { class: 'sec' }, h('h2', {}, '계약 조건'),
        h('div', { class: 'g' }, inp('years', '계약 기간(년)', 'number', 3, '', true), inp('months', '인도 후 서비스 개시(개월)', 'number', 6, '', true), (f.deliv = delivField('원고 인도일 (비우면 작가가 입력)'), f.deliv.el), inp('sa', '작가 정산 %', 'number', 80, '', true, share))),
      sp,
      h('details', { class: 'sec' }, h('summary', {}, '작가 정보 미리 입력 (선택)'), h('div', { class: 'k hint' }, '아는 것만 입력하세요. 비운 칸은 작가가 직접 입력합니다.'), h('div', { class: 'g sp' }, INFO.map(([k, l]) => inp('i_' + k, l, 'text', '', k === 'rrn' ? '계약서 작성 시 입력하셔도 됩니다.' : '')))),
      h('div', { class: 'acts' }, h('button', { class: 'p', onclick: ev => { if (!validate()) return; withBusy(ev.target, () => run(async () => {
        const sa = +f.sa.value, terms = { term_years: +f.years.value, publish_months: +f.months.value, delivery_date: f.deliv.get() || null, share_author: sa, share_publisher: 100 - sa };
        if (typeVal() === 'special') { const xa = +f.xa.value; terms.extra = { until: f.xu.value, share_author: xa, share_publisher: 100 - xa }; }
        const r = await api({ action: 'create', contract_type: typeVal(), author_email: f.email.value.trim(), pen_name: f.pen.value.trim(), work_title: f.title.value.trim(), terms, author_id: f.au.value || null,
          author_info: Object.fromEntries(INFO.map(([k]) => [k, f['i_' + k].value.trim()]).filter(([, v]) => v)) });
        detail(r.id);
      }, '계약서를 만들었습니다. 다음으로 “가계약서 발송”을 눌러 작가님께 검토를 요청하세요.'), '만드는 중…'); } }, '만들기'), h('button', { onclick: list }, '취소')));
    f.au.onchange = () => { const a = A.find(x => String(x.id) === f.au.value); if (a) { f.email.value = a.email || ''; f.pen.value = a.pen_name || ''; ['email', 'pen'].forEach(k => setErr(k, '')); } fillWorks(); };
    f.wk.onchange = () => { const w = W.find(x => String(x.id) === f.wk.value); if (w) { f.title.value = w.title; setErr('title', ''); } };
    f.sa.addEventListener('input', () => { const n = +f.sa.value; share.textContent = f.sa.value !== '' && n >= 0 && n <= 100 ? `작가 ${n}% · 야화랩 ${100 - n}%` : '0~100 사이 숫자'; });
    const pct = (k, label) => { const v = f[k].value; if (v === '' || !Number.isInteger(+v) || +v < 0 || +v > 100) { bad(k, label + '은 0~100 사이 정수로 입력해 주세요.'); } };
    let first = null; const bad = (k, m) => { setErr(k, m); first = first || f[k]; };
    const validate = () => {
      first = null; ['email', 'pen', 'title', 'years', 'months', 'sa', 'xu', 'xa'].forEach(k => setErr(k, ''));
      const em = f.email.value.trim(); if (!em) bad('email', '작가 이메일을 입력해 주세요.'); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) bad('email', '이메일 형식을 확인해 주세요. 예: name@example.com');
      if (!f.pen.value.trim()) bad('pen', '필명을 입력해 주세요.'); if (!f.title.value.trim()) bad('title', '작품명(제호)을 입력해 주세요.');
      if (!(+f.years.value >= 1)) bad('years', '1년 이상으로 입력해 주세요.'); if (f.months.value === '' || !(+f.months.value >= 0)) bad('months', '0 이상의 개월 수를 입력해 주세요.');
      pct('sa', '정산 비율');
      if (typeVal() === 'special') { if (!f.xu.value) bad('xu', '특약이 끝나는 날짜를 골라 주세요.'); pct('xa', '특약 정산 비율'); }
      if (first) { first.focus(); toast('빨간 안내가 있는 칸을 확인해 주세요.', 'bad'); return false; } return true;
    };
    root.replaceChildren(h('div', { class: 'top' }, h('div', {}, h('h1', {}, '새 계약서'), h('div', { class: 'k' }, '만든 뒤 “가계약서 발송”으로 먼저 검토받고, 확정되면 “서명 요청 시작”을 누르세요. 야화랩이 먼저 서명한 뒤 작가에게 자동으로 발송됩니다.'))), body);
  }

  /* ---------- 상세 ---------- */
  const STEPS = ['작성', '검토', '야화랩 서명', '작가 서명', '완료'], CUR = { draft: 1, review_sent: 2, pub_pending: 3, pub_signed: 4, sent: 4, opened: 4, signed: 4, completed: 6 };
  const NEXT = {
    draft: '작가 정보와 조건을 확인한 뒤, 가계약서를 보내 작가에게 검토받으세요.',
    review_sent: '검토용 계약서를 보냈습니다. 작가 확인이 끝나면 서명 요청을 시작하세요.',
    pub_pending: '야화랩 서명을 기다리는 중입니다. admin@yahwalab.xyz로 간 메일의 링크에서 서명하세요.',
    pub_signed: '야화랩 서명이 끝났습니다. 작가님께 서명 요청 메일을 보내는 단계입니다.',
    sent: '작가님의 서명을 기다리는 중입니다.',
    opened: '작가님이 계약서를 열어 보았습니다. 서명을 기다리는 중입니다.',
    signed: '서명은 접수됐지만 계약서·인증서 만들기가 끝나지 않았습니다. 아래 버튼으로 이어서 처리하세요.',
    completed: '계약이 완료되었습니다. 계약서와 감사 추적 인증서는 작가님과 야화랩 메일로 발송됩니다.',
    cancelled: '취소된 계약입니다. 보낸 서명 링크는 더 이상 쓸 수 없습니다.'
  };
  const rows = pairs => h('dl', { class: 'dl' }, pairs.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v == null || v === '' ? '-' : v)]));
  async function detail(id) {
    const j = await run(() => api({ action: 'get', id })); if (!j) return;
    const c = j.contract, t = c.terms, [stText, stCls] = ST[c.status] || [c.status, ''], cur = CUR[c.status];
    const act = (label, fn, cls, okText) => h('button', { class: cls || '', onclick: ev => withBusy(ev.target, () => run(fn, okText || '완료했습니다.'), '처리 중…').then(() => detail(id)) }, label);
    const dlBtn = (label, kind) => h('button', { onclick: () => run(async () => { window.open((await api({ action: 'download', id, kind })).url, '_blank', 'noopener'); }) }, label);
    const m = j.masked, pii = h('div', {}, m ? rows([['성명', m.name], ['주민/사업자번호', m.rrn], ['연락처', m.phone], ['주소', m.address], ['계좌', m.bank]]) : h('div', { class: 'k' }, '작가가 아직 정보를 입력하지 않았습니다.'));
    const reveal = m && h('button', { onclick: async () => { if (!await ask('개인정보 원문 보기', '개인정보 원문을 화면에 표시합니다. 열람 기록이 남습니다.', '원문 보기')) return; const r = await run(() => api({ action: 'reveal', id })); if (r) { const i = r.info; pii.replaceChildren(rows([['성명', i.name], ['주민/사업자번호', i.rrn], ['연락처', i.phone], ['주소', i.address], ['계좌', `${i.bank_name} ${i.bank_no} (${i.bank_holder})`]])); } } }, '원문 보기 (열람 기록 남음)');
    const editable = ['draft', 'review_sent'].includes(c.status), live = ['draft', 'review_sent', 'pub_pending', 'pub_signed', 'sent', 'opened'].includes(c.status);
    const signLabel = c.pub_signed_at ? '작가에게 서명 요청 재발송' : (c.status === 'pub_pending' ? '야화랩 서명 메일 재발송' : '서명 요청 시작 (야화랩 서명 메일 발송)');
    const signOk = c.pub_signed_at ? '작가님께 서명 요청 메일을 다시 보냈습니다.' : '야화랩(admin@yahwalab.xyz)으로 서명 요청 메일을 보냈습니다. 야화랩이 서명하면 작가님께 자동으로 발송됩니다.';
    const retry = c.status === 'signed' || (c.status === 'completed' && !c.final_mail_sent_at);
    const buttons = [
      editable && act('가계약서(검토용) 발송', () => api({ action: 'send_review', id }), c.status === 'draft' ? 'p' : '', '검토용 계약서를 작가 메일로 보냈습니다.'),
      live && act(signLabel, () => api({ action: 'send_sign', id }), c.status === 'review_sent' ? 'p' : '', signOk),
      retry && act('완료 처리 재시도', async () => { let r; for (let i = 0; i < 6; i++) { r = await api({ action: 'retry_complete', id }); if (r.done) break; } return r; }, 'p', '완료 처리를 이어서 실행했습니다. 상태를 확인해 주세요.'),
      c.status === 'completed' && act('완료 메일 재발송', () => api({ action: 'retry_complete', id, force: true }), '', '완료 메일을 다시 보냈습니다.')
    ].filter(Boolean);
    const files = [c.review_pdf_path && dlBtn('검토용 PDF', 'review'), c.final_pdf_path && dlBtn('계약서 PDF', 'contract'), c.cert_pdf_path && dlBtn('감사 추적 인증서', 'cert')].filter(Boolean);
    const ds = t.delivery_date || '작가가 입력';
    root.replaceChildren(
      h('div', { class: 'top' }, h('div', {}, h('h1', {}, c.work_title), h('div', { class: 'k' }, `${c.doc_no} · `, h('span', { class: 'tag' }, TY[c.contract_type]), ' ', h('span', { class: 'tag ' + stCls }, stText))), h('button', { onclick: list }, '← 목록')),
      h('div', { class: 'sec stat' },
        cur ? h('ol', { class: 'ec-track', 'aria-label': '계약 진행 단계' }, STEPS.map((s, i) => h('li', { class: i + 1 < cur ? 'done' : i + 1 === cur ? 'cur' : '', 'aria-current': i + 1 === cur ? 'step' : null }, h('span', { class: 'n' }), h('span', {}, s)))) : '',
        h('p', { class: 'next' }, NEXT[c.status] || ''), buttons.length ? h('div', { class: 'acts' }, buttons) : ''),
      h('div', { class: 'sec cols' },
        h('div', {}, h('h2', {}, '계약 조건'), rows([['필명', c.pen_name], ['작가 이메일', c.author_email], ['계약 기간', `${t.term_years}년`], ['서비스 개시', `인도 후 ${t.publish_months}개월 이내`], ['원고 인도일', ds], ['정산 비율', `작가 ${t.share_author}% · 야화랩 ${t.share_publisher}%`], ...(t.extra ? [['특약', `${t.extra.until}까지 작가 ${t.extra.share_author}% · 야화랩 ${t.extra.share_publisher}%`]] : [])])),
        h('div', {}, h('h2', {}, '작가 정보 (기본 가림)'), pii, h('div', { class: 'acts gap' }, reveal || '', editable ? h('button', { onclick: () => infoEditor(c) }, '작가 정보·인도일 입력/수정') : ''))),
      files.length ? h('div', { class: 'sec' }, h('h2', {}, '문서'), h('div', { class: 'acts' }, files)) : '',
      h('div', { class: 'sec' }, h('h2', {}, '진행 기록'), h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ...['일시', '내용', '처리자', 'IP'].map(x => h('th', {}, x)))), h('tbody', {}, j.events.map(e => h('tr', {}, h('td', { class: 'mono' }, kst(e.created_at)), h('td', {}, EVN[e.event] || e.event), h('td', {}, (e.actor || '').replace('publisher:', '야화랩 ').replace('author:', '작가 ').replace('admin:', '관리자 ')), h('td', {}, e.ip || ''))))))),
      !['completed', 'cancelled'].includes(c.status) ? h('div', { class: 'end' }, h('button', { class: 'danger', onclick: async () => { if (await ask('계약 취소', '이 계약을 취소할까요? 보낸 서명 링크도 무효가 됩니다.', '계약 취소', true)) run(() => api({ action: 'cancel', id }), '계약을 취소했습니다.').then(() => detail(id)); } }, '계약 취소')) : ''
    );
  }

  /* ---------- 작가 정보 입력/수정 (서명 요청 전까지) ---------- */
  function infoEditor(c) {
    const f = {};
    const inp = (k, label, ph = '') => { const id = uid(); f[k] = h('input', { id, type: 'text', placeholder: ph }); return h('div', {}, h('label', { for: id }, label), f[k]); };
    const body = h('div', { class: 'sec' }, h('div', { class: 'k' }, '입력한 칸만 저장되고, 비워 둔 칸은 기존 값이 유지됩니다. 작가가 직접 입력할 항목은 비워 두세요.'),
      h('div', { class: 'g sp' }, INFO.map(([k, l]) => inp('i_' + k, l, k === 'rrn' ? '계약서 작성 시 입력하셔도 됩니다.' : '')), (f.deliv = delivField('원고 인도일 (비우면 변경 없음)'), f.deliv.el)),
      h('div', { class: 'acts gap' }, h('button', { class: 'p', onclick: ev => withBusy(ev.target, () => run(async () => {
        const info = Object.fromEntries(INFO.map(([k]) => [k, f['i_' + k].value.trim()]).filter(([, v]) => v)), terms = f.deliv.get() ? { delivery_date: f.deliv.get() } : {};
        await api({ action: 'update', id: c.id, author_info: info, terms }); detail(c.id);
      }, '작가 정보를 저장했습니다.'), '저장 중…') }, '저장'), h('button', { onclick: () => detail(c.id) }, '취소')));
    root.replaceChildren(h('div', { class: 'top' }, h('div', {}, h('h1', {}, '작가 정보 입력·수정'), h('div', { class: 'k' }, c.work_title))), body);
  }

  /* ---------- 시작: 로그인·관리자 확인(다른 도구와 같은 방식) ---------- */
  async function init() {
    try {
      const { data: { session } } = await SB.auth.getSession();
      if (!session) { addEventListener('visibilitychange', () => { if (!document.hidden) location.reload(); }); return gate('로그인이 필요합니다', '정산 사이트에서 로그인한 뒤 이 탭으로 돌아오면 자동으로 열립니다.', ['/', '정산 사이트에서 로그인', true]); }
      const pf = await SB.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      if (pf.error || !pf.data || pf.data.role === 'author') return gate('관리자만 볼 수 있는 화면입니다.', '', ['/', '정산 사이트로 돌아가기']);
      await list();
    } catch (e) { gate('불러오지 못했습니다', String((e && e.message) || e), ['', '']); }
  }
  let t0 = 0; ['keydown', 'pointerdown', 'scroll', 'wheel'].forEach(ev => addEventListener(ev, () => { const n = Date.now(); if (n - t0 > 5000) { t0 = n; try { parent !== window && parent.postMessage({ t: 'yw-act' }, location.origin); } catch (e) { /* 무시 */ } } }, { passive: true, capture: true }));
  init();
})();
