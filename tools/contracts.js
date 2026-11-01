/* tools/contracts.js v1.0.0 — 야화랩 전자계약 관리자 도구 (정산 사이트 iframe 겸 단독 페이지)
   서버: Edge Function ec-admin (관리자 JWT + is_admin(aal2) 확인). 읽기 전용 참조: authors·works·work_authors.
   규칙: 인라인 스크립트 없음(CSP script-src 'self'), 개인정보는 기본 마스킹·'원문 보기'는 서버에 기록. */
(function () {
  'use strict';
  const SB = supabase.createClient('https://wddixxdrndgvjgicwunu.supabase.co', 'sb_publishable_fIrxIqOmX_-BFpSELdmvXQ_kkYSkaCx');
  const ST = { draft: ['작성중', ''], review_sent: ['검토용 발송', ''], sent: ['서명 요청됨', 'warn'], opened: ['열람함', 'warn'], signed: ['처리 대기', 'bad'], completed: ['완료', 'ok'], cancelled: ['취소', ''] };
  const TY = { general: '일반', special: '특약' };
  const root = document.getElementById('root');
  const h = (t, a, ...c) => { const e = document.createElement(t); Object.entries(a || {}).forEach(([k, v]) => { if (k === 'onclick') e.onclick = v; else if (v !== false && v != null) e.setAttribute(k, v); }); c.flat().forEach(x => { if (x == null || x === false) return; e.append(x instanceof Node ? x : document.createTextNode(String(x))); }); return e; };
  const kst = s => s ? new Date(new Date(s).getTime() + 9 * 36e5).toISOString().replace('T', ' ').slice(0, 16) : '';
  let msg = h('div');

  async function api(body) {
    const { data, error } = await SB.functions.invoke('ec-admin', { body });
    if (error) { let m = '요청에 실패했습니다.'; try { const j = await error.context.json(); m = j.message || m; } catch (e) { /* 무시 */ } throw new Error(m); }
    if (!data || !data.ok) throw new Error((data && data.message) || '오류가 발생했습니다.');
    return data;
  }
  const note = (t, cls) => { msg.replaceWith(msg = h('div', t ? { class: 'note ' + (cls || 'err'), role: 'alert' } : {}, t || '')); };
  const run = async (fn, okText) => { note(''); try { const r = await fn(); if (okText) note(okText, 'info'); return r; } catch (e) { note(e.message); } };
  const gate = (t) => { root.replaceChildren(h('div', { class: 'gate' }, t)); };

  /* ---------- 목록 ---------- */
  async function list() {
    msg = h('div');
    root.replaceChildren(h('div', { class: 'top' }, h('div', {}, h('h1', {}, '전자계약'), h('div', { class: 'k' }, '일반·특약 계약서 · 가계약서(검토용) · 전자서명 · 감사 추적 인증서')), h('button', { class: 'p', onclick: form }, '+ 새 계약서')), msg, h('div', { class: 'sec', id: 'lst' }, '불러오는 중…'));
    const j = await run(() => api({ action: 'list' })); if (!j) return;
    const rows = j.items.map(c => { const [t, cls] = ST[c.status] || [c.status, '']; return h('tr', { class: 'r', onclick: () => detail(c.id) }, h('td', { class: 'mono' }, kst(c.created_at)), h('td', {}, c.doc_no), h('td', {}, h('span', { class: 'tag' }, TY[c.contract_type])), h('td', {}, c.pen_name || ''), h('td', {}, c.work_title), h('td', {}, h('span', { class: 'tag ' + cls }, t))); });
    $('#lst').replaceChildren(rows.length ? h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ...['생성', '문서 ID', '종류', '필명', '작품', '상태'].map(x => h('th', {}, x)))), h('tbody', {}, rows))) : h('div', { class: 'k' }, '아직 계약서가 없습니다. 오른쪽 위 “새 계약서”로 시작하세요.'));
  }
  const $ = s => document.querySelector(s);

  /* ---------- 새 계약서 ---------- */
  async function form() {
    msg = h('div');
    const [au, wk, wa] = await Promise.all([SB.from('authors').select('id,pen_name,email').order('pen_name'), SB.from('works').select('id,title').order('title'), SB.from('work_authors').select('work_id,author_id')]);
    const A = au.data || [], W = wk.data || [], WA = wa.data || [], f = {};
    const inp = (k, label, type = 'text', val = '') => { f[k] = h('input', { type, value: val }); return h('div', {}, h('label', {}, label), f[k]); };
    f.type = h('select', {}, h('option', { value: 'general' }, '일반 계약'), h('option', { value: 'special' }, '특약 계약'));
    f.au = h('select', {}, h('option', { value: '' }, '직접 입력'), A.map(a => h('option', { value: a.id }, a.pen_name)));
    f.wk = h('select', {}, h('option', { value: '' }, '직접 입력'));
    const fillWorks = () => { const ids = new Set(WA.filter(x => String(x.author_id) === f.au.value).map(x => String(x.work_id))); f.wk.replaceChildren(h('option', { value: '' }, '직접 입력'), W.filter(w => !f.au.value || ids.has(String(w.id))).map(w => h('option', { value: w.id }, w.title))); };
    f.au.onchange = () => { const a = A.find(x => String(x.id) === f.au.value); if (a) { f.email.value = a.email || ''; f.pen.value = a.pen_name || ''; } fillWorks(); };
    f.wk.onchange = () => { const w = W.find(x => String(x.id) === f.wk.value); if (w) f.title.value = w.title; };
    const extra = h('div', { class: 'g', hidden: true }, inp('xu', '특약 적용 종료일', 'date'), inp('xa', '특약 작가 %', 'number', 90));
    f.type.onchange = () => { extra.hidden = f.type.value !== 'special'; };
    const body = h('div', { class: 'sec' },
      h('div', { class: 'g' }, h('div', {}, h('label', {}, '계약 종류'), f.type), h('div', {}, h('label', {}, '작가 불러오기(선택)'), f.au), h('div', {}, h('label', {}, '작품 불러오기(선택)'), f.wk)),
      h('div', { class: 'g', style: 'margin-top:10px' }, inp('email', '작가 이메일(서명 링크 수신)', 'email'), inp('pen', '필명'), inp('title', '작품명(제호)'), inp('years', '계약 기간(년)', 'number', 3), inp('months', '인도 후 서비스 개시(개월)', 'number', 6), inp('deliv', '원고 인도일(미정이면 비움)', 'date'), inp('sa', '기본 작가 정산 %', 'number', 80)),
      h('div', { style: 'margin-top:10px' }, extra),
      h('div', { style: 'margin-top:12px' }, h('button', { class: 'p', onclick: () => run(async () => {
        const sa = +f.sa.value, terms = { term_years: +f.years.value, publish_months: +f.months.value, delivery_date: f.deliv.value || null, share_author: sa, share_publisher: 100 - sa };
        if (f.type.value === 'special') { const xa = +f.xa.value; terms.extra = { until: f.xu.value, share_author: xa, share_publisher: 100 - xa }; }
        const r = await api({ action: 'create', contract_type: f.type.value, author_email: f.email.value, pen_name: f.pen.value, work_title: f.title.value, terms, author_id: f.au.value || null });
        detail(r.id);
      }) }, '만들기'), h('button', { onclick: list }, '취소')));
    root.replaceChildren(h('div', { class: 'top' }, h('div', {}, h('h1', {}, '새 계약서'), h('div', { class: 'k' }, '만든 뒤 “가계약서 발송”으로 먼저 검토받고, 확정되면 “서명 요청”을 보냅니다.'))), msg, body);
  }

  /* ---------- 상세 ---------- */
  async function detail(id) {
    msg = h('div');
    const j = await run(() => api({ action: 'get', id })); if (!j) return;
    const c = j.contract, t = c.terms, [stText, stCls] = ST[c.status] || [c.status, ''];
    const act = (label, fn, cls, okText) => h('button', { class: cls || '', onclick: ev => { ev.target.disabled = true; run(fn, okText || '완료했습니다.').then(() => detail(id)); } }, label);
    const dl = (label, kind) => h('button', { onclick: () => run(async () => { window.open((await api({ action: 'download', id, kind })).url, '_blank', 'noopener'); }) }, label);
    const pii = h('div', {}, j.masked ? [`성명 ${j.masked.name} · 주민/사업자번호 ${j.masked.rrn} · 연락처 ${j.masked.phone}`, h('br'), `주소 ${j.masked.address} · 계좌 ${j.masked.bank}`] : '작가가 아직 정보를 입력하지 않았습니다.');
    const reveal = j.masked && h('button', { onclick: async () => { if (!confirm('개인정보 원문을 화면에 표시합니다. 열람 기록이 남습니다.')) return; const r = await run(() => api({ action: 'reveal', id })); if (r) { const i = r.info; pii.replaceChildren(`성명 ${i.name} · 번호 ${i.rrn} · 연락처 ${i.phone}`, h('br'), `주소 ${i.address} · ${i.bank_name} ${i.bank_no} (${i.bank_holder})`); } } }, '개인정보 원문 보기');
    const editable = ['draft', 'review_sent'].includes(c.status), live = ['draft', 'review_sent', 'sent', 'opened'].includes(c.status);
    root.replaceChildren(
      h('div', { class: 'top' }, h('div', {}, h('h1', {}, c.work_title), h('div', { class: 'k' }, `${c.doc_no} · `, h('span', { class: 'tag' }, TY[c.contract_type]), ' ', h('span', { class: 'tag ' + stCls }, stText))), h('button', { onclick: list }, '← 목록')), msg,
      h('div', { class: 'sec' }, h('h2', {}, '계약 조건'), `필명 ${c.pen_name || '-'} · ${c.author_email}`, h('br'), `기간 ${t.term_years}년 · 인도 후 ${t.publish_months}개월 이내 개시 · 인도일 ${t.delivery_date || '미정'} · 배분 ${t.share_author}:${t.share_publisher}`, t.extra ? [h('br'), `특약: ${t.extra.until}까지 ${t.extra.share_author}:${t.extra.share_publisher}`] : ''),
      h('div', { class: 'sec' }, h('h2', {}, '작가 정보 (기본 가림)'), pii, reveal || ''),
      h('div', { class: 'sec' }, h('h2', {}, '진행'),
        editable ? act('가계약서(검토용) 발송', () => api({ action: 'send_review', id }), '', '검토용 계약서를 작가 메일로 보냈습니다.') : '',
        live ? act(c.status === 'sent' || c.status === 'opened' ? '서명 요청 재발송' : '서명 요청 발송', () => api({ action: 'send_sign', id }), 'p', '서명 요청 메일을 보냈습니다.') : '',
        c.status === 'signed' ? act('완료 처리 재시도', () => api({ action: 'retry_complete', id }), 'p') : '', c.status === 'completed' ? act('완료 메일 재발송', () => api({ action: 'retry_complete', id }), '', '완료 메일을 다시 보냈습니다.') : '',
        c.review_pdf_path ? dl('검토용 PDF', 'review') : '', c.final_pdf_path ? dl('계약서 PDF', 'contract') : '', c.cert_pdf_path ? dl('감사 추적 인증서', 'cert') : '',
        !['completed', 'cancelled'].includes(c.status) ? h('button', { onclick: () => { if (confirm('이 계약을 취소할까요? 보낸 서명 링크도 무효가 됩니다.')) run(() => api({ action: 'cancel', id })).then(() => detail(id)); } }, '계약 취소') : ''),
      h('div', { class: 'sec' }, h('h2', {}, '진행 기록'), h('div', { class: 'scroll' }, h('table', {}, h('tbody', {}, j.events.map(e => h('tr', {}, h('td', { class: 'mono' }, kst(e.created_at)), h('td', {}, e.event), h('td', {}, e.actor || ''), h('td', {}, e.ip || ''))))))));
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
