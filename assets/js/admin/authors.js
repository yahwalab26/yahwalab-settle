/* admin/authors.js — 작가 관리
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 작가 관리 ---------- */
let PEOPLE=[];
const cpy=async(t,b)=>{await navigator.clipboard.writeText(t);const o=b.textContent;b.textContent='복사됨';setTimeout(()=>b.textContent=o,1200)};
const IS_B=false,B_MSG='',B_BLOCK=[];   /* v2.18.0 컷오버: 실행 차단 해제(시험판 때는 true) */
 async function call(body){if(B_BLOCK.includes(body.action)||body.send_email===true)return{error:B_MSG};const{data,error}=await SB.functions.invoke('admin-author',{body});
  if(error){let m=error.message;try{m=(await error.context.json()).error||m}catch(e){dbg('서버 오류 본문 읽기',e)}return{error:m}}return{data}}
let STAT={},PLOADED=false;
async function loadPeople(){const[,p,pr]=await Promise.all([loadRefs(),SB.from('persons').select('id,name_masked,phone_masked,created_at').order('created_at',{ascending:false}),SB.from('profiles').select('person_id,must_change_password').eq('role','author')]);
  PEOPLE=p.data||[];STAT={};(pr.data||[]).forEach(x=>{if(x.person_id)STAT[x.person_id]=x.must_change_password});PLOADED=true;renderPeople();loadDec()}
let DEC={};
function renderPeople(){const q=$('#aq').value.trim().toLowerCase();
  const rows=PEOPLE.map(p=>({p,d:DEC[p.id]||{},pens:AUTHORS.filter(a=>a.person_id===p.id)})).filter(({p,d,pens})=>!q||[d.legal_name||p.name_masked,d.phone,d.address,...pens.flatMap(a=>[a.pen_name,a.email])].join(' ').toLowerCase().includes(q));
  $('#alist').innerHTML=rows.map(({p,d,pens})=>{const st=STAT[p.id],list=pens.length?pens:[{}],n=list.length,
    stat=st===undefined?'<span class="vs k">계정 없음</span>':st?'<span class="vs bad"><i class="dot" style="background:var(--bad)"></i>인증 전</span>':'<span class="vs ok"><i class="dot" style="background:var(--ok)"></i>인증 완료</span>',
    acts=['edit:수정','link:링크 재발급','del:삭제'].map(x=>{const[k,t]=x.split(':');return `<button class="ghost" data-pa="${k}" data-id="${p.id}">${t}</button>`}).join('');
    return list.map((a,i)=>{const ws=WORKS.filter(w=>(WA[w.id]||[]).includes(a.id)).map(w=>`<button class="lnk" data-pa="work" data-id="${w.id}">${esc(w.title)}</button>`).join('<br>')||'<span class="k">-</span>';
      return `<tr class="${i?'':'first'}">${i?'':`<th scope="row" rowspan="${n}"><button class="lnk" data-pa="view" data-id="${p.id}">${esc(d.legal_name||p.name_masked)}</button></th>`}<td>${a.id?`<button class="lnk" data-pa="pen" data-id="${a.id}">${esc(a.pen_name)}</button>`:'-'}</td><td>${ws}</td>${i?'':`<td class="hm" rowspan="${n}">${esc(d.phone||p.phone_masked||'-')}</td>`}<td class="hm">${esc(a.email||'-')}</td>${i?'':`<td class="cc" rowspan="${n}">${stat}</td><td class="cc" rowspan="${n}">${acts}</td>`}</tr>`}).join('')}).join('')||'<tr><td colspan="7" class="k em">등록된 작가가 없습니다.</td></tr>'}
async function loadDec(){const{data}=await call({action:'list_people'});if(data){DEC=data.people||{};renderPeople()}}
$('#aq').oninput=renderPeople;
let EDIT=null;
const penRow=(p={})=>`<div class="pr"${p.id?` data-id="${p.id}"`:''}><input class="pn" type="text" placeholder="필명" aria-label="필명" value="${esc(p.pen_name||'')}" required><input class="pe" type="email" placeholder="이메일" aria-label="필명별 이메일" value="${esc(p.email||'')}" required><button type="button" class="ghost" data-rm aria-label="이 줄 삭제">삭제</button></div>`;
async function openForm(id){EDIT=id;$('#af').reset();rrnFmt();$('#f5v').hidden=true;$('#f5').placeholder='주민등록번호 13자리 (선택 · 암호화 저장)';$('#fmw').hidden=!!id;$('#fl').hidden=!id;$('#fs').textContent=id?'저장':'등록하고 설정 링크 만들기';let pens=[{}];
  if(id){const{data,error}=await call({action:'get_person',person_id:id});if(error)return alert(error);const d=data.pii;
    $('#f1').value=d.legal_name||'';$('#f2').value=d.phone||'';$('#f3').value=d.address||'';$('#f4').value=d.bank||[d.bank_name,d.bank_account].filter(Boolean).join(' ');pens=data.pens.length?data.pens:[{}];$('#fl').value=data.login_email||'';if(data.has_rrn){$('#f5').placeholder='주민등록번호 등록됨 (바꾸려면 새 번호 입력, 비워 두면 그대로 유지)';$('#f5v').hidden=false}}
  $('#prow').innerHTML=pens.map(penRow).join('');$('#afw').hidden=false;$('#afw').scrollIntoView({behavior:'smooth',block:'center'})}
$('#anew').onclick=()=>openForm(null);$('#fc').onclick=()=>{$('#afw').hidden=true};
$('#padd').onclick=()=>$('#prow').insertAdjacentHTML('beforeend',penRow());
$('#prow').onclick=e=>{const b=e.target.closest('[data-rm]');if(!b)return;if($('#prow').children.length<2)return alert('필명은 최소 1개 필요합니다.');b.closest('.pr').remove()};
const mailNote=m=>!m?'':m.ok?'<p class="ok" style="margin:6px 0 0">안내 메일을 발송했습니다.</p>':`<p class="bad" style="margin:6px 0 0">메일 발송 실패: ${esc(m.error)}<br>아래 링크를 직접 전달해 주세요.</p>`;
function showLink(link,msg,mail){const r=$('#ares');
  r.innerHTML=`<b>${msg}</b>${mailNote(mail)}<p class="k" style="margin:6px 0 12px">링크를 작가에게 직접 전달하셔도 됩니다. 링크를 열면 비밀번호를 설정하게 되며, 만료되면 다시 발급해야 합니다.</p><div class="pre" style="margin-bottom:12px">${esc(link)}</div><button class="ghost" id="cl">링크 복사</button>`;
  r.hidden=false;$('#cl').onclick=e=>cpy(link,e.target)}
function showPii(d){const L=[['legal_name','실명'],['phone','연락처'],['address','주소'],['bank','은행 · 계좌 · 예금주'],['rrn_state','주민등록번호'],['login_email','로그인 이메일']];
  openLay(`<h3 id="lt" style="margin:0 0 14px">작가 상세</h3><table>${L.map(([k,t])=>`<tr><th scope="row" style="width:32%">${t}</th><td>${esc(d[k]||'-')}</td></tr>`).join('')}</table>${d.pens&&d.pens.length?`<h4 style="margin:22px 0 6px">필명 · 이메일 · 작품</h4><table><thead><tr><th>필명</th><th>이메일</th><th>작품</th></tr></thead><tbody>${d.pens.map(p=>`<tr><td>${esc(p.pen_name)}</td><td>${esc(p.email||'-')}</td><td>${WORKS.filter(w=>(WA[w.id]||[]).includes(p.id)).map(w=>esc(w.title)).join('<br>')||'-'}</td></tr>`).join('')}</tbody></table>`:''}`)}
/* 주민등록번호 입력: 입력하는 동안은 숫자가 보이고(확인용), 자리 수·생년월일·성별 숫자를 바로 검사해 알려 주며, 저장하면 칸이 비워지고, 저장 직후와 수정 화면에서 서버에 저장된 값을 10초 동안만 다시 보여 줌 */
const rrnCheck=(raw,today)=>{const d=String(raw==null?'':raw).replace(/\D/g,'');if(d.length!==13)return{ok:false,msg:'숫자 13자리가 아닙니다('+d.length+'자리)'};
  const g=+d[6];if(!(g>=1&&g<=8))return{ok:false,msg:'7번째 숫자(성별)는 1~8이어야 합니다'};
  const y=((g===1||g===2||g===5||g===6)?1900:2000)+ +d.slice(0,2),m=+d.slice(2,4),dd=+d.slice(4,6),dt=new Date(Date.UTC(y,m-1,dd));
  if(m<1||m>12||dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==dd)return{ok:false,msg:'앞 6자리가 올바른 생년월일(YYMMDD)이 아닙니다'};
  if(dt>(today||new Date()))return{ok:false,msg:'생년월일이 오늘보다 뒤입니다(7번째 숫자나 연도를 확인하세요)'};
  const birth=y+'-'+d.slice(2,4)+'-'+d.slice(4,6),foreign=g>=5,sex=g%2?'남':'여';return{ok:true,birth,foreign,sex,msg:birth+' 생 · '+(foreign?'외국인 ':'')+sex}};
const rrnFmt=()=>{const el=$('#f5'),d=el.value.replace(/\D/g,'').slice(0,13),s=$('#f5s');el.value=d.length>6?d.slice(0,6)+'-'+d.slice(6):d;
  if(!d.length){s.textContent='';s.className='k';return}
  if(d.length>=7&&!(+d[6]>=1&&+d[6]<=8)){s.textContent='7번째 숫자(성별)는 1~8이어야 합니다. 번호를 다시 확인해 주세요.';s.className='bad';return}
  if(d.length<13){s.textContent=d.length+'/13자리';s.className='k';return}
  const c=rrnCheck(d);if(!c.ok){s.textContent='⚠ '+c.msg+'. 번호를 다시 확인해 주세요.';s.className='bad';return}
  s.textContent='✓ 앞 6자리 '+d.slice(0,6)+' = '+c.birth+' 생 · 7번째 '+d[6]+' = '+(c.foreign?'외국인 ':'')+c.sex+' · 뒤 6자리 '+d.slice(7)+' — 저장하면 지워지고, 저장 직후 10초 동안 서버에 저장된 값을 다시 보여 드립니다.';s.className='ok'};
$('#f5').oninput=rrnFmt;
let PKT=0,PKI=0;
function hidePeek(){clearTimeout(PKT);clearInterval(PKI);const b=$('#rrnpk');b.hidden=true;b.textContent=''}
async function peekRrn(id,label){hidePeek();const b=$('#rrnpk');b.hidden=false;b.textContent='서버에 저장된 값을 확인하는 중…';
  const{data,error}=await call({action:'get_rrn',person_ids:[id]});
  if(error){b.innerHTML='<b class="bad">확인하지 못했습니다</b><div class="k" style="text-align:left">'+esc(error)+'</div>';PKT=setTimeout(hidePeek,8000);return}
  const v=(data.rrn||{})[id]||'';if(!v){b.innerHTML='<b class="bad">'+esc(label||'작가')+' — 저장된 주민등록번호가 없습니다</b>';PKT=setTimeout(hidePeek,8000);return}
  const c=rrnCheck(v);let n=10;
  const paint=()=>{b.innerHTML='<div class="k" style="text-align:left">'+esc(label||'작가')+' · 서버에 저장된 번호 ('+n+'초 후 자동으로 숨김)</div><div style="font-size:19px;font-weight:700;letter-spacing:.5px;margin:4px 0;text-align:left">'+esc(v.slice(0,6)+'-'+v.slice(6))+'</div><div class="'+(c.ok?'ok':'bad')+'" style="font-size:13px;text-align:left">'+(c.ok?'✓ ':'⚠ ')+esc(c.msg)+'</div><button type="button" class="ghost" id="rrnpkx" style="margin-top:8px">지금 숨기기</button>';$('#rrnpkx').onclick=hidePeek};
  paint();PKI=setInterval(()=>{n--;if(n<=0)hidePeek();else paint()},1000)}
$('#f5v').onclick=()=>peekRrn(EDIT,(document.querySelector('#prow .pn')||{}).value||'작가');
addEventListener('hashchange',hidePeek);document.addEventListener('visibilitychange',()=>{if(document.hidden)hidePeek()});
$('#f5').oninput=rrnFmt;
$('#af').onsubmit=async e=>{e.preventDefault();const g=i=>$('#'+i).value.trim(),b=$('#fs'),
  pens=[...document.querySelectorAll('#prow .pr')].map(r=>({id:r.dataset.id,pen_name:r.querySelector('.pn').value.trim(),email:r.querySelector('.pe').value.trim().toLowerCase()})),
  base={legal_name:g('f1'),phone:g('f2'),address:g('f3'),bank:g('f4'),rrn:g('f5'),pens};if(base.rrn){const ck=rrnCheck(base.rrn);if(!ck.ok)return alert('주민등록번호를 확인해 주세요: '+ck.msg)}b.disabled=true;
  const{data,error}=await call(EDIT?{action:'update_person',person_id:EDIT,login_email:g('fl'),...base}:{action:'create_person',send_email:$('#fm').checked,...base});
  b.disabled=false;$('#f5').value='';rrnFmt();if(error)return alert(error);
  if(data.duplicate){$('#ares').innerHTML=`<b class="bad">이미 등록된 작가입니다 (${esc(data.name_masked)})</b><p class="k" style="margin:6px 0 0">실명과 전화번호가 같은 사람이 있습니다. 목록에서 '수정'으로 필명을 추가하세요.</p>`;$('#ares').hidden=false;return}
  $('#afw').hidden=true;
  if(EDIT){$('#ares').innerHTML='<b class="ok">작가 정보를 수정했습니다.</b>';$('#ares').hidden=false}
  else showLink(data.link,`${esc(pens[0].pen_name)} 계정을 만들었습니다.`,data.mail);
  if(base.rrn)peekRrn(EDIT||data.person_id,pens[0].pen_name);
  loadPeople()};
$('#alist').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id,a=b.dataset.pa;if(a==='work')return goWork(id);
  if(a==='pen')return openPen(id);
  if(a==='edit')return openForm(id);
  if(a==='del'){if(prompt('정말 삭제할까요?\n작가 계정, 개인정보, 필명과 작품 연결이 모두 삭제됩니다.\n삭제하려면 "삭제"를 입력하세요.')!=='삭제')return;b.disabled=true;
    const{error}=await call({action:'delete_person',person_id:id});b.disabled=false;if(error)return alert(error);$('#ares').innerHTML='<b>작가를 삭제했습니다.</b>';$('#ares').hidden=false;return loadPeople()}
  b.disabled=true;const sm=a==='link'&&confirm('이메일로도 발송할까요?\n(취소하면 링크만 표시됩니다)');b.disabled=true;const{data,error}=await call(a==='view'?{action:'get_person',person_id:id}:{action:'reissue_link',person_id:id,send_email:sm});b.disabled=false;
  if(error)return alert(error);a==='view'?showPii({...data.pii,login_email:data.login_email,pens:data.pens,rrn_state:data.has_rrn?'등록됨 (암호화 저장, 화면에는 표시하지 않음)':'미등록'}):showLink(data.link,'비밀번호 설정 링크를 다시 만들었습니다.',data.mail)};

$('#mp').onclick=async e=>{e.target.disabled=true;const{data,error}=await call({action:'preview_mail'});e.target.disabled=false;if(error)return alert(error);
  const r=$('#mprev');r.innerHTML=`<b>${esc(data.subject)}</b><div class="row" style="margin-top:10px"><button class="ghost" data-w="100%">PC 폭</button><button class="ghost" data-w="360px">모바일 폭 (360px)</button></div><iframe id="mif" sandbox="" style="display:block;width:100%;max-width:100%;height:600px;border:1px solid var(--line);margin:12px auto 0"></iframe><button class="ghost" id="mx" style="margin-top:12px">닫기</button>`;
  $('#mif').srcdoc=data.html;r.hidden=false;r.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>$('#mif').style.width=b.dataset.w);$('#mx').onclick=()=>r.hidden=true};
