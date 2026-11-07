/* 야화랩 전자계약 — 서명 페이지 (v1.5.0). 야화랩(출판사)과 작가가 같은 주소를 쓰고, 링크 종류에 따라 역할이 정해진다.
   CSP(script-src 'self') 때문에 인라인이 아닌 외부 파일로 둔다. */
(function () {
  'use strict';
  const FN = 'https://wddixxdrndgvjgicwunu.supabase.co/functions/v1/ec-sign';
  const $ = s => document.querySelector(s), T = new URLSearchParams(location.search).get('t');
  let SESSION = null, ROLE = null, MODE = 'draw', IMG = null;
  async function api(body) {
    let r; try { r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: T, s: SESSION, ...body }) }); } catch { throw new Error('네트워크 오류입니다. 잠시 후 다시 시도해 주세요.'); }
    const j = await r.json().catch(() => ({})); if (!j.ok) throw new Error(j.message || '오류가 발생했습니다.'); return j;
  }
  const IDS = ['v0', 'v1', 'v2', 'v3', 'v4'];
  function show(id) { IDS.forEach(x => $('#' + x).classList.toggle('hide', x !== id)); const n = { v1: 1, v2: 2, v3: 3, v4: 3 }[id] || 0; [1, 2, 3].forEach(i => $('#s' + i).classList.toggle('on', i <= n)); scrollTo(0, 0); }
  const busy = (b, on) => { b.disabled = on; },
    wait = (on, t, m) => { $('#busy').classList.toggle('hide', !on); if (on) { $('#busyT').textContent = t; $('#busyM').textContent = m; } }, fail = (id, e) => { $('#' + id).textContent = e.message || String(e); };

  (async () => {
    if (!T) { $('#v0').textContent = '유효하지 않은 링크입니다.'; return; }
    try {
      const j = await api({ action: 'open' }); ROLE = j.role;
      $('#ttl').textContent = ROLE === 'publisher' ? '야화랩 서명(출판사)' : '전자계약 서명';
      $('#sub').textContent = `${j.publisher} · ${j.work_title}`;
      if (ROLE === 'publisher' && j.session) { SESSION = j.session; await loadDoc(); show('v2'); } else show('v1');   // 야화랩(출판사)은 이메일 확인 없이 진행
    } catch (e) { $('#v0').textContent = e.message; }
  })();

  $('#verify').onclick = async e => {
    busy(e.target, true); $('#e1').textContent = '';
    try { SESSION = (await api({ action: 'verify_email', email: $('#email').value })).session; await loadDoc(); show('v2'); } catch (x) { fail('e1', x); }
    busy(e.target, false);
  };
  $('#email').addEventListener('keydown', e => { if (e.key === 'Enter') $('#verify').click(); });

  async function loadDoc() {
    const j = await api({ action: 'get_contract' }), box = $('#doc'); box.textContent = '';
    const add = (cls, tag, text) => { const el = document.createElement(tag); if (cls) el.className = cls; el.textContent = text; box.appendChild(el); };
    for (const b of j.blocks) {
      if (b.t === 'title') add('title', 'div', b.text); else if (b.t === 'sub') add('sub2', 'div', b.text); else if (b.t === 'h') add('', 'h4', b.text);
      else if (b.t === 'p') add('', 'p', b.text); else if (b.t === 'li') add('li', 'p', b.text);
      else if (b.t === 'check') { const l = document.createElement('label'); l.className = 'chk one'; const c = document.createElement('input'); c.type = 'checkbox'; c.id = 'ai'; c.disabled = ROLE === 'publisher'; const sp = document.createElement('span'); sp.textContent = b.text; l.append(c, sp); box.appendChild(l); }
      else if (b.t === 'box') { const d = document.createElement('div'); d.className = 'box'; b.lines.forEach((l, i) => { const p = document.createElement('p'); p.textContent = l; if (i === 0) p.style.fontWeight = '700'; d.appendChild(p); }); box.appendChild(d); }
    }
    const pub = ROLE === 'publisher';
    $('#note').textContent = pub ? '내용을 확인한 뒤 서명(또는 도장)해 주세요. 완료되면 작가님께 서명 요청 메일이 자동으로 발송됩니다.' : '야화랩의 서명(도장)이 완료된 계약서입니다. 내용을 확인한 뒤 정보를 입력하고 서명해 주세요.';
    ['infoCard', 'c2w', 'c3w'].forEach(id => $('#' + id).classList.toggle('hide', pub));
    $('#tSeal').classList.toggle('hide', !(pub && j.has_seal));
    if (!pub) {   // 야화랩이 미리 입력한 정보 채우기
      HAS_RRN = !!j.has_rrn; DEL_LOCK = !!j.delivery_locked; const pf = j.prefill || {};
      BASE.forEach(k => { if (pf[k]) $('#' + k).value = pf[k]; });
      $('#rrnWrap').classList.toggle('hide', HAS_RRN);
      if (DEL_LOCK) {   // 야화랩이 정한 인도일은 수정 불가
        if (j.delivery === '즉시') $('#delNow').checked = true; else $('#delivery').value = j.delivery;
        $('#delivery').disabled = true; $('#delNow').disabled = true; $('#delNote').textContent = '(야화랩 입력)';
      }
    }
    $('#signT').textContent = pub ? '동의 및 서명(도장)' : '동의 및 서명';
  }

  let HAS_RRN = false, DEL_LOCK = false;   // 야화랩이 미리 입력한 항목은 작가에게 묻지 않는다
  const BASE = ['address', 'name', 'phone', 'bank_name', 'bank_no', 'bank_holder'];
  const val = k => (k === 'delivery' ? ($('#delNow').checked ? '즉시' : $('#delivery').value) : $('#' + k).value.trim());
  $('#delNow').onchange = () => { $('#delivery').disabled = $('#delNow').checked; if ($('#delNow').checked) $('#delivery').value = ''; };
  const FIELDS = () => [...BASE, ...(HAS_RRN ? [] : ['rrn']), ...(DEL_LOCK ? [] : ['delivery'])];
  $('#next2').onclick = () => {
    if (ROLE === 'author') {
      FIELDS().concat(['rrn', 'delivery']).forEach(k => $('#' + k).classList.remove('bad'));
      if (!$('#ai') || !$('#ai').checked) { $('#e2').textContent = '제10조의2(생성형 AI의 사용 제한)의 "동의합니다"에 체크해 주세요.'; $('#doc').scrollTop = $('#doc').scrollHeight; return; }
      const empty = FIELDS().filter(k => !val(k));
      if (empty.length) { empty.forEach(k => $('#' + k).classList.add('bad')); const f0 = $('#' + empty[0]); if (f0.focus) f0.focus(); $('#e2').textContent = '모든 항목은 필수입니다. 빨간 칸을 입력해 주세요.'; return; }
      const rrn = $('#rrn').value.replace(/\D/g, ''); if (!HAS_RRN && ![10, 13].includes(rrn.length)) { $('#e2').textContent = '주민(사업자)등록번호 자릿수를 확인해 주세요. (주민 13자리 / 사업자 10자리)'; return; }
    }
    $('#e2').textContent = ''; show('v3'); setMode(MODE);
  };
  $('#back3').onclick = () => show('v2');

  // ---- 서명 방법: 직접 그리기 / 이미지 첨부 / 등록된 도장(야화랩만) ----
  const cv = $('#pad'), ctx = cv.getContext('2d'); let drawing = false, strokes = 0, last = null;
  function fit() { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; if (!r.width) return; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineWidth = 2.6; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; strokes = 0; }
  const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointerdown', e => { drawing = true; last = pt(e); cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(last.x + .1, last.y + .1); ctx.stroke(); });
  cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); strokes += Math.hypot(p.x - last.x, p.y - last.y); last = p; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, () => { drawing = false; }));
  $('#clear').onclick = fit;
  function setMode(m) {
    MODE = m; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
    ['draw', 'img', 'seal'].forEach(k => $('#m_' + k).classList.toggle('hide', k !== m)); if (m === 'draw') fit(); $('#e3').textContent = '';
  }
  document.querySelectorAll('.tabs button').forEach(b => { b.onclick = () => setMode(b.dataset.m); });

  function toPng(im, max) {   // 사진/도장 이미지를 PNG로 줄이고, 흰 배경을 투명하게
    const sc = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.width * sc)); c.height = Math.max(1, Math.round(im.height * sc));
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) if (p[i] > 232 && p[i + 1] > 232 && p[i + 2] > 232) p[i + 3] = 0;
    x.putImageData(d, 0, 0); return c;
  }
  $('#file').onchange = e => {
    const f = e.target.files[0]; IMG = null; if (!f) return;
    if (f.size > 8e6) { $('#e3').textContent = '파일이 너무 큽니다. 8MB 이하 이미지를 올려 주세요.'; return; }
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      let c = toPng(im, 520), url = c.toDataURL('image/png'); if (url.length * 0.75 > 600000) { c = toPng(im, 300); url = c.toDataURL('image/png'); }
      IMG = url; const pv = $('#pv'); pv.width = c.width; pv.height = c.height; pv.getContext('2d').drawImage(c, 0, 0); $('#e3').textContent = '';
    }; im.onerror = () => { $('#e3').textContent = '이미지를 읽을 수 없습니다. PNG 또는 JPG 파일을 올려 주세요.'; }; im.src = r.result; };
    r.readAsDataURL(f);
  };
  function getSig() {
    if (MODE === 'seal') return { use_seal: true };
    if (MODE === 'img') { if (!IMG) throw new Error('도장 또는 서명 이미지를 올려 주세요.'); return { signature: IMG }; }
    if (strokes < 40) throw new Error('서명을 그려 주세요.'); return { signature: cv.toDataURL('image/png') };
  }

  $('#submit').onclick = async e => {
    $('#e3').textContent = ''; const pub = ROLE === 'publisher';
    if (!($('#c1').checked && (pub || ($('#c2').checked && $('#c3').checked)))) { $('#e3').textContent = '필수 동의 항목에 모두 체크해 주세요.'; return; }
    let sig; try { sig = getSig(); } catch (x) { fail('e3', x); return; }
    busy(e.target, true); wait(true, pub ? '서명을 처리하는 중입니다' : '서명을 저장하는 중입니다', pub ? '작가님께 서명 요청 메일을 보내고 있습니다. 잠시만 기다려 주세요.' : '계약서와 감사 추적 인증서를 만들어 이메일로 보내고 있습니다. 10~30초 걸릴 수 있으니 창을 닫지 말고 기다려 주세요.');
    try {
      if (pub) {
        const j = await api({ action: 'pub_submit', consents: { esign: true }, ...sig });
        show('v4'); $('#doneT').textContent = '야화랩 서명이 완료되었습니다';
        $('#doneM').textContent = j.mailOk === false ? j.message : '작가님께 서명 요청 메일(야화랩 서명이 완료된 계약서 첨부)을 자동으로 보냈습니다.';
      } else {
        const info = Object.fromEntries(FIELDS().map(k => [k, val(k)]));
        await api({ action: 'submit', info, consents: { esign: true, privacy: true, rrn: true, ai: true }, ...sig });
        FIELDS().forEach(k => { $('#' + k).value = ''; }); $('#delNow').checked = false;
        // 계약서·인증서 생성과 메일 발송을 한 단계씩 진행(서버 시간 제한 때문에 나눔)
        const LABEL = { contract: '계약서를 만드는 중입니다', cert: '감사 추적 인증서를 만드는 중입니다', mail: '이메일로 보내는 중입니다' };
        let r = null, bad = 0;
        for (let i = 0; i < 6; i++) {
          try { r = await api({ action: 'finalize' }); bad = 0; } catch (x) { if (++bad > 2) break; await new Promise(z => setTimeout(z, 1500)); i--; continue; }
          if (r.done) break; wait(true, LABEL[r.step === 'contract' ? 'cert' : 'mail'] || '처리 중입니다', '창을 닫지 말고 기다려 주세요.');
        }
        show('v4'); $('#doneT').textContent = '서명이 완료되었습니다';
        $('#doneM').textContent = r && r.done ? (r.mailOk === false ? '서명은 완료되었습니다. 완료 문서 발송에 문제가 있어 야화랩에서 확인 후 다시 보내드립니다.' : '완료된 계약서와 감사 추적 인증서를 이메일로 보내드렸습니다. 메일함을 확인해 주세요.') : '서명은 접수되었습니다. 완료 문서는 야화랩에서 확인 후 이메일로 보내드립니다.';
      }
    } catch (x) { fail('e3', x); busy(e.target, false); } finally { wait(false); }
  };
})();
