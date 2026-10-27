/* shared/rates.js — 계약 정산 비율 보기(작가·관리자 양쪽 사용 추정 — S6에서 소유 확정)
   index.html의 <script> 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 계약 정산 비율: 작품 목록 → 작품을 누르면 레이어로 기간·플랫폼별 비율 확인 ---------- */
let RT={};
const rateOn=(r,t)=>r.effective_from<=t&&(!r.effective_to||r.effective_to>=t);
async function loadRates(){const el=$('#rtl');if(!el)return;
  const{data,error}=await SB.rpc('author_contract_rates');
  if(error){el.innerHTML='<p class="bad" style="text-align:center">계약 비율을 불러오지 못했습니다.</p>';return}
  const R=data||[];if(!R.length){el.innerHTML='<p class="k" style="text-align:center">등록된 계약 비율이 없습니다. 궁금한 점은 운영자에게 문의해 주세요.</p>';return}
  const t=iso(kst());RT={};R.forEach(r=>{const k=r.work_id+'|'+r.author_id;(RT[k]=RT[k]||[]).push(r)});
  el.innerHTML=`<div class="tw"><table class="vm"><caption class="sr-only">계약 작품별 현재 작가 비율</caption><thead><tr><th>작품</th><th class="r">현재 작가 비율</th></tr></thead><tbody>${Object.entries(RT).map(([k,L])=>{const on=L.filter(r=>rateOn(r,t)),b=on.find(r=>r.kind==='base'&&!r.platform_code)||on[0],x=on.some(r=>r.kind==='special');
    return `<tr><td><button class="lnk" data-rk="${esc(k)}">${esc(L[0].title)}</button></td><td class="r">${b?`<b>${pct(b.author_rate)}</b>${x?'<div class="k" style="font-size:11.5px">특약</div>':''}`:'<span class="k">-</span>'}</td></tr>`}).join('')}</tbody></table></div>`}
$('#rtl').onclick=e=>{const b=e.target.closest('[data-rk]');if(!b)return;const L=RT[b.dataset.rk];if(!L)return;const f=L[0],sh=Number(f.share_ratio),t=iso(kst());
  openLay(`<h3 id="lt" style="margin:0 0 4px">${esc(f.title)}</h3><p class="k" style="margin:0 0 14px">${esc(f.pen_name)}${sh<1?` · 공동 작가 지분 ${pct(sh)}`:''}</p><div class="tw"><table class="vm"><caption class="sr-only">${esc(f.title)} 계약 비율</caption><thead><tr><th>구분</th><th>플랫폼</th><th>적용 기간</th><th class="r">작가 비율</th></tr></thead><tbody>${L.map(r=>`<tr><td>${KD[r.kind]||esc(r.kind)}</td><td>${r.platform_code?esc(pnm(r.platform_name||r.platform_code)):'전체'}</td><td>${r.effective_from} ~ ${r.effective_to||'계속'}${rateOn(r,t)?'<div class="ok" style="font-size:11.5px;font-weight:700">적용 중</div>':''}</td><td class="r"><b>${pct(r.author_rate)}</b></td></tr>`).join('')}</tbody></table></div>`)};
const bars=(rows,color)=>{const mx=Math.max(...rows.map(r=>r.v),1);return rows.map(r=>`<div class="bar"><div class="bl">${esc(r.l)}</div><div style="flex:1;min-width:0">${r.t!==undefined?`<div class="bn">${esc(r.t)||'&nbsp;'}</div>`:''}<div class="bt" style="display:flex;align-items:center">${(()=>{const pc=Math.max(r.v/mx*100,0),sm=pc<35;return `<div class="bf" style="width:${pc}%;background:${color};flex:none">${sm?'':w0(r.v)}</div>${sm?`<span style="padding-left:8px;font-size:12px;font-weight:600;white-space:nowrap">${w0(r.v)}</span>`:''}`})()}</div></div></div>`).join('')};
async function loadStats(){const t=kst(),m0=mon1(t.getUTCFullYear(),t.getUTCMonth()-5);
  const[a,b]=await Promise.all([SB.rpc('author_sales_summary',{p_from:iso(addD(t,-5)),p_to:iso(addD(t,-1)),p_unit:'day'}),SB.rpc('author_sales_summary',{p_from:iso(m0),p_to:iso(t),p_unit:'month'})]);
  if(a.error||b.error){$('#stt').innerHTML='<p class="bad" style="text-align:center">통계를 불러오지 못했습니다.</p>';return}
  const D={},M={},T={};(a.data||[]).forEach(r=>D[r.period]=(D[r.period]||0)+Number(r.author_amount||0));
  (b.data||[]).forEach(r=>{const k=r.period.slice(0,7),v=Number(r.author_amount||0);M[k]=(M[k]||0)+v;T[r.title]=(T[r.title]||0)+v});
  const days=[1,2,3,4,5].map(i=>{const k=iso(addD(t,-i));return{l:k.slice(8)+'일',v:D[k]||0}}),
    mons=[0,1,2,3,4,5].map(i=>{const x=mon1(t.getUTCFullYear(),t.getUTCMonth()-i);return{l:(x.getUTCMonth()+1)+'월',v:M[iso(x).slice(0,7)]||0}}),
    top=Object.entries(T).sort((p,q)=>q[1]-p[1]).slice(0,5).map((x,i)=>({l:(i+1)+'위',t:x[0],v:x[1]}));while(top.length<5)top.push({l:top.length+1+'위',t:'',v:0});
  $('#stt').innerHTML=`<div class="bh">최근 5일 예상 정산액 추이</div><div class="bu">(단위: 원)</div>${bars(days,'#e8b23c')}<div class="bh">최근 6개월 예상 정산액 추이</div><div class="bu">(단위: 원)</div>${bars(mons,'#111')}<div class="bh">상위 5개 작품 매출</div><div class="bu">(단위: 원 · 작품별 예상 정산액 · 최근 6개월)</div>${bars(top,'#6f9f8a')}`}
let PLS=[],PSEL=new Set(['all']);
const drawChips=()=>{const el=$('#pchips');   // 버튼은 한 번만 만들고 선택 상태만 갱신(깜빡임·잔상 방지)
  if(el.children.length!==PLS.length+1)el.innerHTML=[{code:'all',name:'전체'},...PLS].map(p=>`<button type="button" class="chp" data-c="${p.code}" aria-pressed="false">${esc(p.name)}</button>`).join('');
  el.querySelectorAll('.chp').forEach(b=>b.setAttribute('aria-pressed',String(PSEL.has(b.dataset.c))))};
async function initSearch(){const{data}=await SB.from('platforms').select('code,name').eq('is_active',true);PLS=[...(data||[]),...((data||[]).some(p=>p.code==='ridi')?[]:[{code:'ridi',name:'리디북스'}])].map(p=>({...p,name:pnm(p.name)})).sort((a,b)=>{const o=['리디북스','교보문고','알라딘','예스24','북큐브'],r=n=>{const i=o.indexOf(n);return i<0?99:i};return r(a.name)-r(b.name)||a.name.localeCompare(b.name,'ko')});drawChips();
  const t=kst(),y=iso(addD(t,-1));$('#sf').max=$('#se').max=y;$('#sf').value=iso(mon1(t.getUTCFullYear(),t.getUTCMonth()))>y?y:iso(mon1(t.getUTCFullYear(),t.getUTCMonth()));$('#se').value=y}
$('#pchips').onclick=e=>{const c=e.target.closest('[data-c]')?.dataset.c;if(!c)return;if(c==='all')PSEL=new Set(['all']);else{PSEL.delete('all');PSEL.has(c)?PSEL.delete(c):PSEL.add(c);if(!PSEL.size)PSEL=new Set(['all'])}drawChips()};
$('#sdq').onclick=e=>{const q=e.target.dataset.q;if(!q)return;const t=kst(),y=addD(t,-1),Y=t.getUTCFullYear(),M=t.getUTCMonth();let f,g;
  if(q==='y')f=g=y;else if(q==='yy')f=g=addD(t,-2);else if(q==='tm'){f=mon1(Y,M);g=y;if(f>g)f=g}else{f=mon1(Y,M-1);g=addD(mon1(Y,M),-1)}$('#sf').value=iso(f);$('#se').value=iso(g)};
$('#sgo').onclick=async()=>{const f=$('#sf').value,e=$('#se').value;if(!f||!e||f>e)return alert('정산 기간을 확인해 주세요.');if((new Date(e)-new Date(f))/864e5>92)return alert('3개월 이내의 기간만 조회할 수 있습니다.');
  $('#sres').innerHTML='<p class="k" style="text-align:center">조회 중…</p>';const ti=$('#sq').value.trim().split(/\s+/).filter(Boolean);
  const{data,error}=await SB.rpc('author_sales_search',{p_from:f,p_to:e,p_titles:ti.length?ti:null,p_platforms:PSEL.has('all')?null:[...PSEL]});
  if(error)return $('#sres').innerHTML=`<p class="bad" style="text-align:center">${esc(error.message)}</p>`;
  const R=data||[],sm=k=>R.reduce((a,r)=>a+Number(r[k]||0),0),AA=Math.round(sm('author_amount')),PAY=AA-taxOf(AA,TAXR);
  $('#sres').innerHTML=`<p class="k" style="margin:0 0 8px">${f} ~ ${e} · 총 ${R.length}건${R.length>=2000?' (최대 2,000건까지 표시)':''}</p><div class="tw sc"><table class="rt"><caption class="sr-only">일일 정산 현황</caption><thead><tr><th class="cc">판매일</th><th class="cc">플랫폼</th><th>작품명</th><th class="r">수량</th><th class="r">판매액</th><th class="r">수익액</th><th class="r">예상정산액</th></tr></thead><tbody>${R.map(r=>`<tr><td class="cc">${r.sale_date||r.sale_month.slice(0,7)+' (월 합계)'}</td><td class="cc">${esc(pnm(r.platform_name))}</td><td>${esc(r.title)}</td><td class="r">${r.quantity}</td><td class="r">${w0(r.gross_amount)}</td><td class="r">${r.net_amount==null?'-':w0(r.net_amount)}</td><td class="r">${r.author_amount==null?'-':w0(r.author_amount)}</td></tr>`).join('')||'<tr><td colspan="7" class="k em">조회된 내역이 없습니다.</td></tr>'}</tbody><tfoot><tr><td colspan="3"><b>합계</b></td><td class="r"><b>${sm('quantity')}</b></td><td class="r"><b>${w0(sm('gross_amount'))}</b></td><td class="r"><b>${w0(sm('net_amount'))}</b></td><td class="r"><b>${w0(sm('author_amount'))}</b></td></tr>${R.length?`<tr><td colspan="6" class="r"><b>예상 실지급액</b> <span class="k">(원천징수 ${TAXR}% 공제)</span></td><td class="r"><b>${w0(PAY)}</b></td></tr>`:''}</tfoot></table></div>${R.length?`<p class="k" style="font-size:12px;margin:8px 0 0">예상 실지급액은 예상정산액 합계에서 원천징수(${Math.abs(TAXR-3.3)<1e-9?'소득세 3%, 지방소득세는 소득세의 10%, 각각 10원 미만 내림':`소득세·지방소득세 합산 ${TAXR}%, 원 미만 내림`})를 뺀 금액입니다. 정산이 확정되면 달라질 수 있습니다.</p>`:''}`};
$('#pwb2').onclick=()=>askPw(false);

