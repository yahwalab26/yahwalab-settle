/* admin/statements.js — 월 정산서
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 월 정산서 (정산서_작가별_템플릿.xlsx 양식) ---------- */
let ST=[];
let SS={};
/* 25일 자동 발송 스위치(app_settings.auto_mail_enabled). 꺼짐이 기본값 */
const autoTxt=()=>{$('#ams').textContent=$('#amc').checked?'켜짐 — 매월 25일(주말·공휴일이면 직전 영업일) 확정된 정산서 중 미발송 건을 보냅니다.':'꺼짐 — 자동 발송하지 않습니다.'};
async function loadTaxRate(){if(!$('#sxw').hidden)return;const v=await fetchTaxRate();if(v===undefined||v===Number($('#sx').value))return;$('#sx').value=v;$('#sxv').textContent=v+'%';if(ST.length)drawSettle()}
async function saveTaxRate(v){const r=await SB.from('app_settings').upsert({key:'withholding_rate',value:v,updated_at:new Date().toISOString()});if(r.error)alert('원천징수율 저장에 실패했습니다. 이 화면에서만 적용되고 작가 화면에는 반영되지 않습니다. ('+r.error.message+')')}
async function loadAuto(){const c=$('#amc'),{data,error}=await SB.from('app_settings').select('value').eq('key','auto_mail_enabled').maybeSingle();
  if(error||!data){c.disabled=true;$('#ams').textContent=error?'설정을 불러오지 못했습니다: '+error.message:'설정 항목이 없습니다.';return}
  c.checked=data.value===true;c.disabled=false;autoTxt()}
$('#amt').onclick=async()=>{const b=$('#amt'),x=Object.values(SS).find(v=>v.status!=='draft'),m=monVal('#sm')+'-01';
  if(!x)return alert('이 달에 확정된 정산서가 없습니다. 먼저 정산서를 확정해 주세요.');
  b.disabled=true;const r=await call({action:'send_test_statement',person_id:x.person_id,month:m});b.disabled=false;
  if(r.error)return alert(r.error);alert(`${r.data.to} 로 시험 발송했습니다. 확정된 첫 번째 정산서로 만든 PDF이며, 작가에게는 발송되지 않았습니다.`)};
$('#amc').onchange=e=>{if(IS_B){e.target.checked=!e.target.checked;return alert(B_MSG)}const c=e.target,want=c.checked;c.checked=!want;
  const save=async()=>{const r=await SB.from('app_settings').upsert({key:'auto_mail_enabled',value:want,updated_at:new Date().toISOString()});closeLay();if(r.error)return alert('저장 실패: '+r.error.message);c.checked=want;autoTxt()};
  confirmLay(want?{title:'자동 발송 켜기',danger:false,body:'<p style="margin:0">매월 25일(주말·공휴일이면 직전 영업일)에 확정된 정산서 중 아직 발송하지 않은 건을 작가 메일로 자동 발송합니다.</p>',ok:'켜기',onOk:save}:{title:'자동 발송 끄기',danger:false,body:'<p style="margin:0">자동 발송을 중지합니다. 수동 메일 발송은 그대로 사용할 수 있습니다.</p>',ok:'끄기',onOk:save})};
async function loadSettle(){const m=$('#sm');monVal('#sm');loadAuto();loadTaxRate();$('#sl').innerHTML='<tr><td colspan="7" class="k em">불러오는 중…</td></tr>';
  const[a,b]=await Promise.all([SB.rpc('admin_statement',{p_month:m.value+'-01'}),SB.from('settlements').select('id,person_id,status,author_total,payable_amount,confirmed_at,sent_at').eq('period_month',m.value+'-01')]);
  if(a.error){reportErr('정산서 조회',a.error.message);return $('#sl').innerHTML=`<tr><td colspan="7" class="bad em">${esc(a.error.message)}</td></tr>`}
  ST=a.data||[];SS={};(b.data||[]).forEach(x=>SS[x.person_id]=x);if(!PLOADED)await loadPeople();drawSettle()}
function buildSt(){const P={},seen={};
  ST.forEach(r=>{const p=P[r.person_id]??={id:r.person_id,pens:new Set(),W:{}};p.pens.add(r.pen_name);
    const w=p.W[r.work_id]??={id:r.work_id,t:r.title,rd:r.release_date,pl:{},gross:0,net:0,au:0,nr:0};w.au+=Number(r.author_amt);w.nr+=Number(r.no_rate);
    const k=r.person_id+r.work_id+r.platform_code;if(seen[k])return;seen[k]=1;       // 같은 사람의 필명 여러 개가 한 작품에 연결된 경우 판매는 한 번만 집계
    w.pl[r.platform_code]={q:Number(r.quantity),lp:Number(r.list_price||0),g:Number(r.gross),n:Number(r.net)};w.gross+=Number(r.gross);w.net+=Number(r.net)});
  const tr=Number($('#sx').value||0)/100;
  return Object.values(P).map(p=>{const W=Object.values(p.W).map(w=>{const a=Math.round(w.au);return{...w,a,ded:w.net-a,rate:w.net?a/w.net:0}});
    const net=sum(W,'net'),A=sum(W,'a'),tax=taxOf(A,Number($('#sx').value||0));return{...p,W,gross:sum(W,'gross'),net,A,ded:net-A,tax,pay:A-tax,nr:sum(W,'nr'),name:((DEC[p.id]||{}).legal_name)||((PEOPLE.find(x=>x.id===p.id)||{}).name_masked)||''}}).sort((a,b)=>[...a.pens][0].localeCompare([...b.pens][0],'ko'))}
function drawSettle(){const L=buildSt();
  $('#sl').innerHTML=L.map(p=>{const x=SS[p.id],ok=x&&x.status!=='draft',chg=ok&&(Number(x.author_total)!==p.A||Number(x.payable_amount)!==p.pay);
    const sent=x&&x.status==='sent',stt=ok?`<span class="ok">${sent?'확정 · 메일 발송':'확정'}</span>${chg?' <span class="bad">확정 후 변경됨</span>':''}<br><span class="k">${(x.confirmed_at||'').slice(0,10)}${sent&&x.sent_at?' · 발송 '+x.sent_at.slice(0,10):''}</span>`:'<span class="k">미확정</span>';
    return `<tr><td><button class="lnk" data-sp="${p.id}">${esc([...p.pens].join(', '))}</button>${p.nr?`<br><span class="bad" style="font-size:12px">계약 비율 미설정 ${p.nr}건</span>`:''}${p.A<0?'<br><span class="bad" style="font-size:12px">마이너스 정산 — 이월 공제 기능이 준비되기 전에는 확정할 수 없습니다</span>':''}</td><td class="r">${won1(p.net)}</td><td class="r">${won1(p.A)}</td><td class="r hm">${won1(p.tax)}</td><td class="r"><b>${won1(p.pay)}</b></td><td class="r hm">${won1(p.ded)}</td><td class="cc">${stt}<br><button class="ghost" data-sc="${p.id}">${ok?'재확정':'확정'}</button>${ok?`<button class="ghost" data-su="${p.id}">취소</button><button class="ghost" data-sm="${p.id}">${sent?'메일 재발송':'메일 발송'}</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="7" class="k em">이 달에 정산할 판매 내역이 없습니다.</td></tr>';
  $('#slf').innerHTML=L.length?`<tr><td><b>합계 (${L.length}명)</b></td><td class="r"><b>${won1(sum(L,'net'))}</b></td><td class="r"><b>${won1(sum(L,'A'))}</b></td><td class="r hm"><b>${won1(sum(L,'tax'))}</b></td><td class="r"><b>${won1(sum(L,'pay'))}</b></td><td class="r hm"><b>${won1(sum(L,'ded'))}</b></td><td></td></tr>`:''}
$('#sm').onchange=loadSettle;
$('#sx').oninput=()=>{if(ST.length)drawSettle()};
$('#sxe').onclick=()=>{const on=$('#sxw').hidden;$('#sxw').hidden=!on;$('#sxv').hidden=on;$('#sxe').textContent=on?'적용':'수정';if(!on){const v=Number($('#sx').value);if(!(v>=0&&v<=100)){$('#sx').value='3.3'}$('#sxv').textContent=Number($('#sx').value)+'%';drawSettle();saveTaxRate(Number($('#sx').value))}};
$('#sl').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.sp)openStatement(b.dataset.sp);if(b.dataset.sc)confirmSt([b.dataset.sc]);if(b.dataset.su)unconfirmSt(b.dataset.su);if(b.dataset.sm)mailSt(b.dataset.sm)};
$('#sca').onclick=()=>confirmSt(buildSt().map(p=>p.id));
