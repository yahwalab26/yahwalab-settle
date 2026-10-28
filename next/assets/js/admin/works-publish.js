/* admin/works-publish.js — 출간작(홈페이지 노출 작품 등록)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 출간작: 홈페이지(yahwalab.xyz)에 보일 작품 등록. works 컬럼을 재사용하고 표지는 covers 버킷에 저장 ---------- */
let BK=[],BKSEL=null,BKCOVER=null; /* BKCOVER: 편집 중 새로 고른 표지(520×780 JPG로 변환된 Blob) */
const BKG=['BL','로판','현로'],BKURL=/^https:\/\/blog\.naver\.com\//;
const bkRnd=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join(''); /* 표지 파일명용 무작위 32자(추측 방지) */
const bkCover=p=>p?SB.storage.from('covers').getPublicUrl(p).data.publicUrl:'';
const bkNames=id=>(WA[id]||[]).map(a=>(AUTHORS.find(x=>x.id===a)||{}).pen_name).filter(Boolean).join(', ');
const bkMiss=w=>[!bkNames(w.id)&&'필명',!w.genre&&'장르',!w.cover_path&&'표지',!w.blog_url&&'블로그 주소'].filter(Boolean);
const bkListed=()=>BK.filter(w=>w.public_listed).sort((a,b)=>(a.sort_order??1e9)-(b.sort_order??1e9)||String(a.release_date||'').localeCompare(String(b.release_date||'')));
let BKF='all',BKQ='',BKADD=false; /* 작품 목록 보기: 필터(all·on·off·miss)·검색어·'작품 추가' 열림 */
let BKP={t:'',c:'k'}; /* 홈페이지 반영 요청 결과 표시(화면이 다시 그려져도 유지) */
async function bkPublish(){const put=(t,c)=>{BKP={t,c};const e=$('#bkpub');if(e){e.className=c;e.textContent=t}};
  put('홈페이지 반영 요청 중…','k');const r=await call({action:'publish_site'});
  if(r.error)return put('홈페이지 반영 요청 실패: '+r.error+' — 저장은 되어 있습니다. "홈페이지에 다시 반영"으로 다시 시도해 주세요.','bad');
  put('홈페이지 반영을 요청했습니다. 1~2분 뒤 홈페이지에서 확인해 주세요.','ok')}
async function loadBooks(){const el=$('#pg-books');if(!el)return;
  const[,r]=await Promise.all([loadRefs(),SB.from('works').select('id,title,label,release_date,public_listed,genre,cover_path,blog_url,sort_order').order('title')]);
  if(r.error){el.innerHTML='<p class="bad">작품을 불러오지 못했습니다. '+esc(r.error.message)+'</p>';return}
  BK=r.data||[];drawBooks()}
const bkNorm=t=>String(t||'').toLowerCase().replace(/\s+/g,'');
function bkFilt(){const on=bkListed(),off=BK.filter(w=>!w.public_listed).sort((a,b)=>a.title.localeCompare(b.title,'ko'));
  let L=BKF==='on'?on:BKF==='off'?off:BKF==='miss'?[...on,...off].filter(w=>bkMiss(w).length):[...on,...off];
  const q=bkNorm(BKQ);return q?L.filter(w=>bkNorm(w.title+' '+bkNames(w.id)+' '+(w.label||'')).includes(q)):L}
function drawBookRows(){const el=$('#bkrows');if(!el)return;const L=bkFilt(),drag=BKF==='on'&&!bkNorm(BKQ);
  const row=w=>{const m=bkMiss(w);return `<tr data-wid="${w.id}"${w.public_listed?' data-on':''}><td>${esc(w.title)}<div class="k" style="font-size:11.5px">${esc(bkNames(w.id)||'필명 미연결')}${w.label?' · '+esc(w.label):''}</div></td><td>${w.public_listed?'<b class="ok">공개</b>':'<span class="k">비공개</span>'}${!w.public_listed&&m.length&&m.length<4?`<div class="k" style="font-size:11.5px">미입력: ${m.join(', ')}</div>`:''}</td><td class="r">${w.public_listed&&drag?`<button class="ghost bkg" data-grip="${w.id}" title="끌어서 순서 변경 (키보드: ↑ ↓)" aria-label="순서 변경: ${esc(w.title)} — 끌거나 위·아래 화살표 키">⠿</button>`:''}<button class="ghost" data-be="${w.id}">편집</button></td></tr>`};
  el.innerHTML=L.length?L.map(row).join(''):`<tr><td colspan="3" class="k" style="text-align:center">${BK.length?'조건에 맞는 작품이 없습니다.':'작품이 없습니다.'}</td></tr>`;
  const c={all:BK.length,on:BK.filter(w=>w.public_listed).length,off:BK.filter(w=>!w.public_listed).length,miss:BK.filter(w=>bkMiss(w).length).length};
  document.querySelectorAll('#bkf [data-bkf]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.bkf===BKF));b.querySelector('i').textContent=c[b.dataset.bkf]});
  const h=$('#bkhint');if(h)h.textContent=BKF==='on'?(drag?'⠿ 손잡이를 끌어 홈페이지에 보이는 순서를 바꿉니다.':'검색 중에는 순서를 바꿀 수 없습니다. 검색어를 지워 주세요.'):''}
function drawBooks(){
  $('#pg-books').innerHTML=`<h2><small>(01)</small>작품 목록</h2>
  <div class="row" style="justify-content:flex-start;gap:10px;margin-bottom:10px"><input id="bkq" type="search" aria-label="작품 검색" placeholder="작품명 · 필명 · 레이블 검색" value="${esc(BKQ)}" autocomplete="off" style="flex:1 1 220px;max-width:360px"><button class="ghost" id="bkaddb" aria-expanded="${BKADD}">+ 작품 추가</button></div>
  <div class="card" id="bkadd"${BKADD?'':' hidden'} style="text-align:left"><p class="k" style="font-size:12px;margin:0 0 8px">판매 파일을 올리기 전에 출간작만 먼저 등록할 때 사용합니다. 정산 쪽 작품 목록에도 나타납니다.</p><div class="row" style="justify-content:flex-start"><input id="bkat" type="text" aria-label="작품명" placeholder="작품명" maxlength="80" style="flex:1 1 200px;min-width:160px"><select id="bkaa" aria-label="필명" style="flex:1 1 160px"><option value="">필명 선택</option>${AUTHORS.map(a=>`<option value="${a.id}">${esc(a.pen_name)}</option>`).join('')}</select><button class="ghost" id="bkab">추가</button></div></div>
  <div class="row" id="bkf" role="group" aria-label="작품 목록 보기" style="justify-content:flex-start;gap:8px;margin:0 0 10px">${[['all','전체'],['on','공개'],['off','비공개'],['miss','미입력 있음']].map(([k,t])=>`<button class="chp" data-bkf="${k}" aria-pressed="${k===BKF}">${t} <i style="font-style:normal;opacity:.7"></i></button>`).join('')}</div>
  <p class="k" style="font-size:12px;margin:0 0 8px;text-align:left">공개로 저장한 작품이 홈페이지 출간작이 됩니다. 저장하면 홈페이지에 자동으로 반영을 요청하며, 반영까지 1~2분 걸립니다.</p>
  <div class="row" style="justify-content:flex-start;gap:10px;margin-bottom:8px"><button class="ghost" id="bkrp">홈페이지에 다시 반영</button><span id="bkpub" class="${BKP.c}" role="status">${esc(BKP.t)}</span></div>
  <p class="k" id="bkhint" style="font-size:12px;margin:0 0 8px;text-align:left"></p>
  <div id="bke"></div>
  <div class="tw"><table class="vm"><caption class="sr-only">작품 목록</caption><thead><tr><th>작품</th><th>상태</th><th></th></tr></thead><tbody id="bkrows"></tbody></table></div>`;
  drawBookRows();drawBookEdit()}
function drawBookEdit(){const el=$('#bke'),w=BK.find(x=>x.id===BKSEL);if(!el)return;if(!w){el.innerHTML='';return}
  const cv=BKCOVER?URL.createObjectURL(BKCOVER):bkCover(w.cover_path),opt=(v,cur)=>`<option ${v===cur?'selected':''}>${esc(v)}</option>`;
  el.innerHTML=`<h2><small>(02)</small>작품 편집</h2><div class="card" style="text-align:left"><h3 style="margin:0 0 4px">${esc(w.title)}</h3><p class="k" style="margin:0 0 14px">${esc(bkNames(w.id)||'필명 미연결 — 작가 탭에서 작품에 필명을 연결해 주세요.')}</p>
  <div class="row" style="align-items:flex-start;justify-content:flex-start;gap:18px"><div style="flex:0 0 130px"><div id="bkpvw" style="width:130px;aspect-ratio:2/3;background:#f2f2f2;border:1px solid var(--line);overflow:hidden">${cv?`<img src="${cv}" alt="표지 미리보기" style="width:100%;height:100%;object-fit:cover;display:block">`:'<div class="k" style="padding:60px 8px;text-align:center">표지 없음</div>'}</div><button class="ghost" id="bkcp" style="margin-top:8px;width:130px">표지 선택</button><input type="file" id="bkcx" accept="image/jpeg,image/png,image/webp" hidden></div>
  <div style="flex:1 1 240px;min-width:0"><div class="row" style="justify-content:flex-start;gap:10px"><label class="k" for="bkg">장르</label><select id="bkg" style="width:auto"><option value="">미지정</option>${BKG.map(g=>opt(g,w.genre)).join('')}</select><label class="k" for="bkl">레이블</label><select id="bkl" style="width:auto"><option value="">미지정</option>${['트루비','야화랩'].map(g=>opt(g,w.label)).join('')}</select></div>
  <div class="row" style="justify-content:flex-start;gap:10px;margin-top:10px"><label class="k" for="bkd">출간일</label><input id="bkd" type="date" value="${esc(w.release_date||'')}"></div>
  <div style="margin-top:10px"><label class="k" for="bku">블로그 글 주소</label><input id="bku" type="text" inputmode="url" placeholder="https://blog.naver.com/yahwalab/…" value="${esc(w.blog_url||'')}" maxlength="300"></div>
  <label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-size:14px"><input type="checkbox" id="bkp" ${w.public_listed?'checked':''} style="width:18px;height:18px"> 홈페이지에 공개</label></div></div>
  <div class="row" style="justify-content:flex-start;margin-top:16px"><button id="bks">저장</button><button class="ghost" id="bkx">닫기</button></div><p id="bkm" class="k" role="status" style="min-height:18px;margin:10px 0 0"></p></div>`}
function bkConv(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{URL.revokeObjectURL(u);const W=520,H=780,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),k=Math.max(W/im.width,H/im.height),w=im.width*k,h=im.height*k;x.fillStyle='#fff';x.fillRect(0,0,W,H);x.drawImage(im,(W-w)/2,(H-h)/2,w,h);c.toBlob(b=>b?ok({b,crop:Math.abs(im.width/im.height-2/3)>0.03}):no(new Error('이미지 변환에 실패했습니다.')),'image/jpeg',0.88)};
  im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('이미지를 읽을 수 없습니다.'))};im.src=u})}
async function saveBook(){const w=BK.find(x=>x.id===BKSEL);if(!w)return;const m=$('#bkm'),b=$('#bks'),say=(t,c)=>{m.className=c||'k';m.textContent=t};
  const genre=$('#bkg').value||null,label=$('#bkl').value||null,rd=$('#bkd').value||null,url=$('#bku').value.trim()||null,pub=$('#bkp').checked;
  if(url&&!BKURL.test(url))return say('블로그 글 주소는 https://blog.naver.com/ 으로 시작해야 합니다.','bad');
  if(pub){const miss=[!bkNames(w.id)&&'필명 연결',!genre&&'장르',!(BKCOVER||w.cover_path)&&'표지',!url&&'블로그 글 주소'].filter(Boolean);if(miss.length)return say('공개하려면 먼저 다음을 채워 주세요: '+miss.join(', '),'bad')}
  b.disabled=true;say('저장 중…');let np=null;
  if(BKCOVER){let up;for(let n=0;n<3;n++){np='cover-'+bkRnd()+'.jpg';up=await SB.storage.from('covers').upload(np,BKCOVER,{contentType:'image/jpeg',cacheControl:'31536000'});if(!up.error||!/exist|duplicate/i.test(up.error.message))break} /* cover-무작위32자.jpg (v2.8.4부터. 예전 표지는 cover-연월일시분초.jpg 그대로) */
    if(up.error){np=null;b.disabled=false;return say('표지 업로드 실패: '+up.error.message,'bad')}}
  const patch={genre,label,release_date:rd,blog_url:url,public_listed:pub,cover_path:np||w.cover_path};
  if(pub&&!w.public_listed)patch.sort_order=Math.max(0,...bkListed().map(x=>x.sort_order||0))+1;
  if(!pub)patch.sort_order=null;
  const{error}=await SB.from('works').update(patch).eq('id',w.id);
  if(error){if(np)await SB.storage.from('covers').remove([np]);b.disabled=false;return say('저장 실패: '+error.message,'bad')}
  if(np&&w.cover_path)await SB.storage.from('covers').remove([w.cover_path]);
  BKCOVER=null;await loadBooks();const m2=$('#bkm');if(m2){m2.className='ok';m2.textContent='저장했습니다.'}if(w.public_listed||pub)bkPublish()}
async function moveBook(id,d){const on=bkListed(),i=on.findIndex(x=>x.id===id),j=i+d;if(i<0||j<0||j>=on.length)return;[on[i],on[j]]=[on[j],on[i]];
  const rs=await Promise.all(on.map((w,k)=>SB.from('works').update({sort_order:k+1}).eq('id',w.id))),er=rs.find(r=>r.error);if(er)return alert(er.error.message);await loadBooks();bkPublish()}
async function addBook(){const t=$('#bkat').value.trim(),a=$('#bkaa').value;if(!t)return alert('작품명을 입력해 주세요.');if(!a)return alert('필명을 선택해 주세요.');
  if(BK.some(w=>w.title.replace(/\s/g,'')===t.replace(/\s/g,'')))return alert('같은 이름의 작품이 이미 있습니다.');
  const{data,error}=await SB.from('works').insert({title:t,label:'트루비'}).select('id').single();if(error)return alert(error.message);
  const r=await SB.from('work_authors').insert({work_id:data.id,author_id:a,share_ratio:1});if(r.error){await SB.from('works').delete().eq('id',data.id);return alert(r.error.message)}
  BKSEL=data.id;BKCOVER=null;BKADD=false;BKF='all';BKQ='';await loadBooks()}
/* 출간작 순서 드래그: 손잡이(.bkg)를 끌면 행이 따라오고, 놓을 때 바뀐 행의 sort_order만 저장 */
let BKD=null;
const bkGrip=e=>e.target.closest&&e.target.closest('.bkg');
async function bkDragEnd(e,cancel){const d=BKD;if(!d||e.pointerId!==d.pid)return;BKD=null;
  d.rows.forEach(r=>r.classList.remove('bk-it','bk-ib'));d.tr.classList.remove('bk-drag');d.tr.style.transform='';
  try{d.g.releasePointerCapture(d.pid)}catch(e){dbg('드래그 해제',e)}
  if(cancel||d.t===d.i)return;
  const me=d.tr.dataset.wid,ids=d.rows.map(r=>r.dataset.wid).filter(x=>x!==me);ids.splice(d.t,0,me);
  const by=Object.fromEntries(BK.map(w=>[String(w.id),w])),ch=ids.map((id,k)=>({id,o:k+1})).filter(x=>(by[x.id]||{}).sort_order!==x.o);
  if(!ch.length)return;
  const rs=await Promise.all(ch.map(x=>SB.from('works').update({sort_order:x.o}).eq('id',x.id))),er=rs.find(r=>r.error);
  if(er)alert('순서를 저장하지 못했습니다. '+er.error.message);
  await loadBooks();if(!er)bkPublish()}
$('#pg-books').addEventListener('pointerdown',e=>{const g=bkGrip(e);if(!g||BKD||(e.pointerType==='mouse'&&e.button!==0))return;
  const tr=g.closest('tr'),rows=[...tr.parentNode.querySelectorAll('tr[data-on]')];if(rows.length<2)return;
  e.preventDefault();try{g.setPointerCapture(e.pointerId)}catch(e){dbg('드래그 시작',e)}
  const i=rows.indexOf(tr);
  BKD={g,tr,rows,i,t:i,pid:e.pointerId,sy:e.clientY+scrollY,mids:rows.map(r=>{const b=r.getBoundingClientRect();return b.top+scrollY+b.height/2})};
  tr.classList.add('bk-drag')});
$('#pg-books').addEventListener('pointermove',e=>{const d=BKD;if(!d||e.pointerId!==d.pid)return;
  if(e.clientY<60)scrollBy(0,-14);else if(e.clientY>innerHeight-60)scrollBy(0,14);
  const y=e.clientY+scrollY;d.tr.style.transform=`translateY(${y-d.sy}px)`;
  d.t=d.mids.filter((m,k)=>k!==d.i&&m<y).length;
  const oth=d.rows.filter(r=>r!==d.tr);d.rows.forEach(r=>r.classList.remove('bk-it','bk-ib'));
  if(d.t===0)oth[0].classList.add('bk-it');else oth[d.t-1].classList.add('bk-ib')});
$('#pg-books').addEventListener('pointerup',e=>bkDragEnd(e,false));
$('#pg-books').addEventListener('pointercancel',e=>bkDragEnd(e,true));
$('#pg-books').addEventListener('keydown',async e=>{const g=bkGrip(e);if(!g||(e.key!=='ArrowUp'&&e.key!=='ArrowDown'))return;e.preventDefault();
  const id=g.dataset.grip;await moveBook(id,e.key==='ArrowUp'?-1:1);const n=document.querySelector('.bkg[data-grip="'+id+'"]');if(n)n.focus()});
$('#pg-books').oninput=e=>{if(e.target.id==='bkq'){BKQ=e.target.value;drawBookRows()}};
$('#pg-books').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.bkf){BKF=d.bkf;drawBookRows();return}
  if(b.id==='bkaddb'){BKADD=!BKADD;$('#bkadd').hidden=!BKADD;b.setAttribute('aria-expanded',String(BKADD));if(BKADD)$('#bkat').focus();return}
  if(d.be){BKSEL=d.be;BKCOVER=null;drawBookEdit();$('#bke').scrollIntoView({behavior:'smooth',block:'nearest'});return}
  if(b.id==='bkcp')return $('#bkcx').click();
  if(b.id==='bkx'){BKSEL=null;BKCOVER=null;drawBookEdit();return}
  if(b.id==='bks')return saveBook();if(b.id==='bkab')return addBook();if(b.id==='bkrp')return bkPublish()};
$('#pg-books').onchange=async e=>{if(e.target.id!=='bkcx')return;const f=e.target.files[0];if(!f)return;const m=$('#bkm');
  try{const r=await bkConv(f);BKCOVER=r.b;$('#bkpvw').innerHTML=`<img src="${URL.createObjectURL(r.b)}" alt="표지 미리보기" style="width:100%;height:100%;object-fit:cover;display:block">`;m.className=r.crop?'bad':'k';m.textContent=r.crop?'표지 비율이 2:3이 아니라 가장자리가 잘렸습니다. 미리보기를 확인한 뒤 저장해 주세요.':'표지를 바꿨습니다. 저장하면 반영됩니다.'}catch(x){m.className='bad';m.textContent=x.message}e.target.value=''};
