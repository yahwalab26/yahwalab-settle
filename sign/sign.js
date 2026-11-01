/* sign/sign.js — 작가 전자계약 서명 화면 (로그인 없음, 서명 링크 토큰으로 접근). 서버: Edge Function ec-sign */
'use strict';
const FN = 'https://wddixxdrndgvjgicwunu.supabase.co/functions/v1/ec-sign', KEY = 'sb_publishable_fIrxIqOmX_-BFpSELdmvXQ_kkYSkaCx';
const $ = s => document.querySelector(s), T = new URLSearchParams(location.search).get('t');
let SESSION = null;
async function api(body) {
  let r; try { r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ t: T, s: SESSION, ...body }) }); } catch { throw new Error('네트워크 오류입니다. 잠시 후 다시 시도해 주세요.'); }
  const j = await r.json().catch(() => ({})); if (!j.ok) throw new Error(j.message || '오류가 발생했습니다.'); return j;
}
function show(n) { ['v0','v1','v2','v3','v4'].forEach((id, i) => $('#' + id).classList.toggle('hide', i !== n && !(n === 2 && id === 'v2'))); [1,2,3].forEach(i => $('#s' + i).classList.toggle('on', i <= Math.min(n, 3))); scrollTo(0, 0); }
const busy = (b, on) => { b.disabled = on; };
const fail = (id, e) => { $('#' + id).textContent = e.message || String(e); };

(async () => {
  if (!T) { $('#v0').textContent = '유효하지 않은 링크입니다.'; return; }
  try { const j = await api({ action: 'open' }); $('#sub').textContent = `${j.publisher} · ${j.work_title}`; $('#hint').textContent = `계약서에 등록된 이메일(${j.email_hint})로 인증번호를 보내드립니다.`; show(1); }
  catch (e) { $('#v0').textContent = ''; const p = document.createElement('p'); p.textContent = e.message; $('#v0').appendChild(p); }
})();

$('#sendOtp').onclick = async e => { busy(e.target, true); $('#e1').className = 'err'; $('#e1').textContent = '';
  try { await api({ action: 'send_otp' }); $('#otpBox').classList.remove('hide'); $('#e1').className = 'ok'; $('#e1').textContent = '인증번호를 보냈습니다. 메일함을 확인해 주세요.'; } catch (x) { (()=>{ $('#e1').className='err'; fail('e1', x); })(); } busy(e.target, false); };
$('#verify').onclick = async e => { busy(e.target, true); $('#e1').className = 'err'; $('#e1').textContent = '';
  try { SESSION = (await api({ action: 'verify_otp', otp: $('#otp').value })).session; await loadDoc(); show(2); } catch (x) { (()=>{ $('#e1').className='err'; fail('e1', x); })(); } busy(e.target, false); };

async function loadDoc() {
  const j = await api({ action: 'get_contract' }), box = $('#doc'); box.textContent = '';
  const add = (cls, tag, text) => { const el = document.createElement(tag); if (cls) el.className = cls; el.textContent = text; box.appendChild(el); };
  for (const b of j.blocks) {
    if (b.t === 'title') add('t1', 'div', b.text); else if (b.t === 'sub') add('t2', 'div', b.text); else if (b.t === 'h') add('', 'h4', b.text);
    else if (b.t === 'p') add('', 'p', b.text); else if (b.t === 'li') add('li', 'p', b.text);
    else if (b.t === 'box') { const d = document.createElement('div'); d.className = 'box'; b.lines.forEach((l, i) => { const p = document.createElement('p'); p.textContent = l; if (i === 0) p.style.fontWeight = '700'; d.appendChild(p); }); box.appendChild(d); }
  }
}
const F = ['name','address','phone','rrn','bank_name','bank_no','bank_holder'];
$('#next2').onclick = () => {
  const miss = F.find(k => !$('#' + k).value.trim()); if (miss) { $('#e2').textContent = '모든 항목을 입력해 주세요.'; return; }
  const rrn = $('#rrn').value.replace(/\D/g, ''); if (![10, 13].includes(rrn.length)) { $('#e2').textContent = '주민(사업자)등록번호 자릿수를 확인해 주세요. (주민 13자리 / 사업자 10자리)'; return; }
  $('#e2').textContent = ''; show(3); fit();
};
$('#back3').onclick = () => show(2);

const cv = $('#pad'), ctx = cv.getContext('2d'); let drawing = false, strokes = 0, last = null;
function fit() { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineWidth = 2.6; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; strokes = 0; }
const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
cv.addEventListener('pointerdown', e => { drawing = true; last = pt(e); cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(last.x + .1, last.y + .1); ctx.stroke(); });
cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); strokes += Math.hypot(p.x - last.x, p.y - last.y); last = p; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, () => { drawing = false; }));
$('#clear').onclick = fit;

$('#submit').onclick = async e => {
  $('#e3').textContent = '';
  if (!($('#c1').checked && $('#c2').checked && $('#c3').checked)) { $('#e3').textContent = '필수 동의 항목에 모두 체크해 주세요.'; return; }
  if (strokes < 40) { $('#e3').textContent = '서명을 그려 주세요.'; return; }
  busy(e.target, true);
  try {
    const info = Object.fromEntries(F.map(k => [k, $('#' + k).value.trim()]));
    const j = await api({ action: 'submit', info, consents: { esign: true, privacy: true, rrn: true }, signature: cv.toDataURL('image/png') });
    show(4); $('#doneT').textContent = '서명이 완료되었습니다';
    $('#doneM').textContent = j.completed ? (j.mailOk === false ? '완료된 계약서 발송에 문제가 있어 야화랩에서 곧 다시 보내드립니다.' : '완료된 계약서와 감사 추적 인증서를 이메일로 보내드렸습니다. 메일함을 확인해 주세요.') : j.message;
    F.forEach(k => $('#' + k).value = '');
  } catch (x) { fail('e3', x); busy(e.target, false); }
};
