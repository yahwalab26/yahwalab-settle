/* tools/contracts.js v1.6.0 — 야화랩 전자계약 관리자 도구 (정산 사이트 iframe 겸 단독 페이지)
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
  const withBusy = async (btn, fn, label) => { const t0 = btn.textContent; btn.disabled = true; if (label) btn.textContent = label; try { return await fn(); } finally { btn.disabled = false; btn.textContent = t0; } };

  async function api(body) {
    const { data, error } = await SB.functions.invoke('ec-admin', { body });
    if (error) { let m = '요청에 실패했습니다.'; try { const j = await error.context.json(); m = j.message || m; } catch (e) { /* 무시 */ } throw new Error(m); }
    if (!data || !data.ok) throw new Error((data && data.message) || '오류가 발생했습니다.');
    return data;
  }
  const run = async (fn, okText) => { try { const r = await fn(); if (okText) toast(okText, 'ok'); return r; } catch (e) { toast(e.message, 'bad'); } };
  const gate = (t) => { root.replaceChildren(h('div', { class: 'gate' }, t)); };

  /* ---------- 목록 ---------- */
  async function list() {
    root.replaceChildren(h('div', { class: 'top' }, h('div', {}, h('h1', {}, '전자계약'), h('div', { class: 'k' }, '일반·특약 계약서 · 가계약서(검토용) · 전자서명 · 감사 추적 인증서')), h('button', { class: 'p', onclick: form }, '+ 새 계약서')), h('div', { class: 'sec', id: 'lst' }, '불러오는 중…'));
    const j = await run(() => api({ action: 'list' })); if (!j) return $('#lst').replaceChildren(h('div', { class: 'k' }, '목록을 불러오지 못했습니다. '), h('button', { onclick: list }, '다시 시도'));
    const rows = j.items.map(c => { const [t, cls] = ST[c.status] || [c.status, '']; return h('tr', { class: 'r', tabindex: '0', onclick: () => detail(c.id), onkeydown: e => { if (e.key === 'Enter') detail(c.id); } }, h('td', { class: 'mono' }, kst(c.created_at)), h('td', {}, c.doc_no), h('td', {}, h('span', { class: 'tag' }, TY[c.contract_type])), h('td', {}, c.pen_name || ''), h('td', {}, c.work_title), h('td', {}, h('span', { class: 'tag ' + cls }, t))); });
    $('#lst').replaceChildren(rows.length ? h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ...['생성', '문서 ID', '종류', '필명', '작품', '상태'].map(x => h('th', {}, x)))), h('tbody', {}, rows))) : h('div', { class: 'k' }, '아직 계약서가 없습니다. 오른쪽 위 “새 계약서”로 시작하세요.'));
  }
  const $ = s => document.querySelector(s);

  /* ---------- 새 계약서 ---------- */
  async function form() {
    const [au, wk, wa] = await Promise.all([SB.from('authors').select('id,pen_name,email').order('pen_name'), SB.from('works').select('id,title').order('title'), SB.from('work_authors').select('work_id,author_id')]);
    const A = au.data || [], W = wk.data || [], WA = wa.data || [], f = {};
    const inp = (k, label, type = 'text', val = '', ph = '') => { const id = uid(); f[k] = h('input', { id, type, value: val, placeholder: ph }); return h('div', {}, h('label', { for: id }, label), f[k]); };
    f.type = h('select', {}, h('option', { value: 'general' }, '일반 계약'), h('option', { value: 'special' }, '특약 계약'));
    f.au = h('select', {}, h('option', { value: '' }, '직접 입력'), A.map(a => h('option', { value: a.id }, a.pen_name)));
    f.wk = h('select', {}, h('option', { value: '' }, '직접 입력'));
    const fillWorks = () => { const ids = new Set(WA.filter(x => String(x.author_id) === f.au.value).map(x => String(x.work_id))); f.wk.replaceChildren(h('option', { value: '' }, '직접 입력'), W.filter(w => !f.au.value || ids.has(String(w.id))).map(w => h('option', { value: w.id }, w.title))); };
    f.au.onchange = () => { const a = A.find(x => String(x.id) === f.au.value); if (a) { f.email.value = a.email || ''; f.pen.value = a.pen_name || ''; } fillWorks(); };
    f.wk.onchange = () => { const w = W.find(x => String(x.id) === f.wk.value); if (w) f.title.value = w.title; };
    const extra = h('div', { class: 'g', hidden: true }, inp('xu', '특약 적용 종료일', 'date'), inp('xa', '특약 작가 %', 'number', 90));
    f.type.onchange = () => { extra.hidden = f.type.value !== 'special'; };
    const body = h('div', { class: 'sec' },
      h('div', { class: 'g' }, lab(f.type, '계약 종류'), lab(f.au, '작가 불러오기(선택)'), lab(f.wk, '작품 불러오기(선택)')),
      h('div', { class: 'g', style: 'margin-top:10px' }, inp('email', '작가 이메일(서명 링크 수신)', 'email'), inp('pen', '필명'), inp('title', '작품명(제호)'), inp('years', '계약 기간(년)', 'number', 3), inp('months', '인도 후 서비스 개시(개월)', 'number', 6), (f.deliv = delivField('원고 인도일 (비우면 작가가 입력)'), f.deliv.el), inp('sa', '기본 작가 정산 %', 'number', 80)),
      h('h2', { style: 'margin-top:16px' }, '작가 정보 (아는 것만 입력 · 비운 칸은 작가가 직접 입력)'),
      h('div', { class: 'g' }, INFO.map(([k, l]) => inp('i_' + k, l, 'text', '', k === 'rrn' ? '계약서 작성 시 입력하셔도 됩니다.' : ''))),
      h('div', { style: 'margin-top:10px' }, extra),
      h('div', { style: 'margin-top:12px' }, h('button', { class: 'p', onclick: ev => withBusy(ev.target, () => run(async () => {
        const sa = +f.sa.value, terms = { term_years: +f.years.value, publish_months: +f.months.value, delivery_date: f.deliv.get() || null, share_author: sa, share_publisher: 100 - sa };
        if (f.type.value === 'special') { const xa = +f.xa.value; terms.extra = { until: f.xu.value, share_author: xa, share_publisher: 100 - xa }; }
        const r = await api({ action: 'create', contract_type: f.type.value, author_email: f.email.value, pen_name: f.pen.value, work_title: f.title.value, terms, author_id: f.au.value || null,
          author_info: Object.fromEntries(INFO.map(([k]) => [k, f['i_' + k].value.trim()]).filter(([, v]) => v)) });
        detail(r.id);
      }, '계약서를 만들었습니다. 다음으로 “가계약서 발송”을 눌러 작가님께 검토를 요청하세요.'), '만드는 중…') }, '만들기'), h('button', { onclick: list }, '취소')));
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
    const reveal = m && h('button', { onclick: async () => { if (!confirm('개인정보 원문을 화면에 표시합니다. 열람 기록이 남습니다.')) return; const r = await run(() => api({ action: 'reveal', id })); if (r) { const i = r.info; pii.replaceChildren(rows([['성명', i.name], ['주민/사업자번호', i.rrn], ['연락처', i.phone], ['주소', i.address], ['계좌', `${i.bank_name} ${i.bank_no} (${i.bank_holder})`]])); } } }, '원문 보기 (열람 기록 남음)');
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
      !['completed', 'cancelled'].includes(c.status) ? h('div', { class: 'end' }, h('button', { class: 'danger', onclick: () => { if (confirm('이 계약을 취소할까요? 보낸 서명 링크도 무효가 됩니다.')) run(() => api({ action: 'cancel', id }), '계약을 취소했습니다.').then(() => detail(id)); } }, '계약 취소')) : ''
    );
  }

  /* ---------- 작가 정보 입력/수정 (서명 요청 전까지) ---------- */
  function infoEditor(c) {
    const f = {};
    const inp = (k, label, ph = '') => { const id = uid(); f[k] = h('input', { id, type: 'text', placeholder: ph }); return h('div', {}, h('label', { for: id }, label), f[k]); };
    const body = h('div', { class: 'sec' }, h('div', { class: 'k' }, '입력한 칸만 저장되고, 비워 둔 칸은 기존 값이 유지됩니다. 작가가 직접 입력할 항목은 비워 두세요.'),
      h('div', { class: 'g', style: 'margin-top:10px' }, INFO.map(([k, l]) => inp('i_' + k, l, k === 'rrn' ? '계약서 작성 시 입력하셔도 됩니다.' : '')), (f.deliv = delivField('원고 인도일 (비우면 변경 없음)'), f.deliv.el)),
      h('div', { style: 'margin-top:12px' }, h('button', { class: 'p', onclick: ev => withBusy(ev.target, () => run(async () => {
        const info = Object.fromEntries(INFO.map(([k]) => [k, f['i_' + k].value.trim()]).filter(([, v]) => v)), terms = f.deliv.get() ? { delivery_date: f.deliv.get() } : {};
        await api({ action: 'update', id: c.id, author_info: info, terms }); detail(c.id);
      }, '작가 정보를 저장했습니다.'), '저장 중…') }, '저장'), h('button', { onclick: () => detail(c.id) }, '취소')));
    root.replaceChildren(h('div', { class: 'top' }, h('div', {}, h('h1', {}, '작가 정보 입력·수정'), h('div', { class: 'k' }, c.work_title))), body);
  }

  /* ---------- 시작: 로그인·관리자 확인(다른 도구와 같은 방식) ---------- */
  async function init() {
    try {
      const { data: { session } } = await SB.auth.getSession();
      if (!session) return gate('로그인이 필요합니다. 정산 사이트에서 로그인한 뒤 이 화면을 새로고침해 주세요.');
      const pf = await SB.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      if (pf.error || !pf.data || pf.data.role === 'author') return gate('관리자만 볼 수 있는 화면입니다.');
      await list();
    } catch (e) { gate('불러오지 못했습니다: ' + String((e && e.message) || e)); }
  }
  let t0 = 0; ['keydown', 'pointerdown', 'scroll', 'wheel'].forEach(ev => addEventListener(ev, () => { const n = Date.now(); if (n - t0 > 5000) { t0 = n; try { parent !== window && parent.postMessage({ t: 'yw-act' }, location.origin); } catch (e) { /* 무시 */ } } }, { passive: true, capture: true }));
  init();
})();
