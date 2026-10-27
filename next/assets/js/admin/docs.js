/* admin/docs.js — 회사 자료(플랫폼 계약·기타 자료)
   index.html의 <script> 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 회사 자료: 플랫폼 계약(플랫폼당 현재본 1건 + 교체 이력) · 기타 자료. 관리자 전용 ---------- */
let DOCS=[],DCURL=null,DPLAT='',LGM='',LGT=0,LLM='',LLT=0; /* LGM: 접근 기록 조회 월, LGT: 월 전환 시 늦게 온 응답 무시용 */
const dFmt=t=>t?String(t).slice(0,10):'';
async function loadDocs(){const el=$('#pg-docs');if(!el)return;
  const{data,error}=await SB.from('company_documents').select('id,category,platform_code,title,memo,mime,size_bytes,is_current,created_at,replaced_at').order('created_at',{ascending:false});
  if(error){el.innerHTML='<p class="bad">회사 자료를 불러오지 못했습니다. '+esc(error.message)+'</p>';return}
  DOCS=data||[];drawDocs()}
function drawDocs(){const P=['ridi','kyobo','aladin','yes24','bookcube'],pc=DOCS.filter(d=>d.category==='platform_contract'),cur=c=>pc.find(d=>d.platform_code===c&&d.is_current),hn=c=>pc.filter(d=>d.platform_code===c&&!d.is_current).length,oth=DOCS.filter(d=>d.category==='other');
  $('#pg-docs').innerHTML=`<h2><small>(01)</small>플랫폼 계약</h2><div class="tw"><table class="vm"><caption class="sr-only">플랫폼별 계약서</caption><thead><tr><th>플랫폼</th><th>상태</th><th></th></tr></thead><tbody>${P.map(c=>{const d=cur(c),n=hn(c);return `<tr><td>${PN[c]}</td><td>${d?`<b>등록됨</b><div class="k" style="font-size:11.5px">${dFmt(d.created_at)}${d.memo?' · '+esc(d.memo):''}</div>`:'<span class="bad">미등록</span>'}${n?`<div><button class="lnk" data-dh="${c}">교체 이력 ${n}건</button></div>`:''}</td><td class="r">${d?`<button class="ghost" data-dv="${d.id}">보기</button> <button class="ghost" data-dp="${c}">교체</button> <button class="ghost" data-dd="${d.id}">삭제</button>`:`<button class="ghost" data-dp="${c}">등록</button>`}</td></tr>`}).join('')}</tbody></table></div>
  <input type="file" id="dcf" accept="application/pdf" hidden><p id="dcm" class="k" style="min-height:18px"></p>
  <h2><small>(02)</small>기타 회사 자료</h2>
  <div class="card" style="text-align:left"><div class="row" style="justify-content:flex-start"><input id="dct" type="text" aria-label="자료 제목" placeholder="제목 (예: 사업자등록증)" maxlength="80" style="flex:1 1 200px;min-width:160px"><input id="dcn" type="text" aria-label="메모" placeholder="메모 (선택)" maxlength="200" style="flex:1 1 200px;min-width:160px"></div><div class="row" style="justify-content:flex-start;margin-top:14px"><button class="ghost" id="dcp">파일 선택</button><span id="dcfn" class="k" style="flex:1 1 140px;min-width:0;overflow-wrap:anywhere">선택한 파일이 없습니다. (PDF·JPG·PNG·WebP)</span><button id="dcs">올리기</button><input type="file" id="dcx" accept="application/pdf,image/jpeg,image/png,image/webp" hidden></div></div>
  <div class="tw" style="margin-top:12px"><table class="vm"><caption class="sr-only">기타 회사 자료</caption><thead><tr><th>제목</th><th class="hm">등록일</th><th></th></tr></thead><tbody>${oth.length?oth.map(d=>`<tr><td>${esc(d.title)}${d.memo?`<div class="k" style="font-size:11.5px">${esc(d.memo)}</div>`:''}</td><td class="hm">${dFmt(d.created_at)}</td><td class="r"><button class="ghost" data-dv="${d.id}">보기</button> <button class="ghost" data-dd="${d.id}">삭제</button></td></tr>`).join(''):'<tr><td colspan="3" class="k" style="text-align:center">등록된 자료가 없습니다.</td></tr>'}</tbody></table></div>`}
const LGA={person_view:'개인정보 열람',rrn_view:'주민번호 열람',rrn_set:'주민번호 등록·변경',work_contract_view:'작품 계약서 열람',company_doc_view:'회사 자료 열람'};
async function loadLogs(){const el=$('#dlog');if(!el)return;const mv=monVal('#lgm'),my=++LGT,y=+mv.slice(0,4),mo=+mv.slice(5,7),from=new Date(Date.UTC(y,mo-1,1)-9*36e5).toISOString(),to=new Date(Date.UTC(y,mo,1)-9*36e5).toISOString();
  el.innerHTML='<p class="k">불러오는 중…</p>';
  if(!AUTHORS.length){try{await loadRefs()}catch(e){}}   /* 로그인 직후 바로 이 화면을 열어도 필명이 보이도록 */
  const{data,error,count}=await SB.from('access_logs').select('created_at,admin_email,action,target_id,label',{count:'exact'}).gte('created_at',from).lt('created_at',to).order('created_at',{ascending:false}).limit(1000);
  if(my!==LGT)return;const cn=$('#lgc');if(cn)cn.textContent='';
  if(error){el.innerHTML='<p class="bad">접근 기록을 불러오지 못했습니다. '+esc(error.message)+'</p>';return}
  const L=data||[];if(!L.length){el.innerHTML='<p class="k">'+mv.replace('-','년 ')+'월에는 기록이 없습니다.</p>';return}
  if(cn)cn.textContent='총 '+(count??L.length).toLocaleString('ko-KR')+'건'+((count||0)>L.length?' (최근 '+L.length.toLocaleString('ko-KR')+'건만 표시)':'');
  const nm=r=>(r.action==='person_view'||r.action==='rrn_set')?(AUTHORS.filter(a=>a.person_id===r.target_id).map(a=>a.pen_name).join(', ')||String(r.target_id||'').slice(0,8)):(r.label||'-');
  el.innerHTML=`<div class="tw"><table><caption class="sr-only">접근 기록</caption><thead><tr><th>일시</th><th class="hm">관리자</th><th>구분</th><th>대상</th></tr></thead><tbody>${L.map(r=>`<tr><td>${new Date(r.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</td><td class="hm">${esc(r.admin_email||'-')}</td><td>${LGA[r.action]||esc(r.action)}</td><td>${esc(nm(r))}</td></tr>`).join('')}</tbody></table></div>`}
const LLR={admin:'관리자',author:'작가'};
let LLRO='admin'; /* 로그인 기록 보기: 관리자/작가 */
async function loadLoginLogs(){const el=$('#dll');if(!el)return;const mv=monVal('#llm'),my=++LLT,y=+mv.slice(0,4),mo=+mv.slice(5,7),from=new Date(Date.UTC(y,mo-1,1)-9*36e5).toISOString(),to=new Date(Date.UTC(y,mo,1)-9*36e5).toISOString(),adm=LLRO==='admin';
  $('#llr').innerHTML=['admin','author'].map(r=>`<button type="button" class="chp" data-lr="${r}" aria-pressed="${r===LLRO}">${LLR[r]}</button>`).join('');
  el.innerHTML='<p class="k">불러오는 중…</p>';
  const{data,error,count}=await SB.from('login_logs').select('created_at,email,role,ip,ua',{count:'exact'}).eq('role',LLRO).gte('created_at',from).lt('created_at',to).order('created_at',{ascending:false}).limit(1000);
  if(my!==LLT)return;const cn=$('#llc');if(cn)cn.textContent='';
  if(error){el.innerHTML='<p class="bad">로그인 기록을 불러오지 못했습니다. '+esc(error.message)+'</p>';return}
  const L=data||[];if(!L.length){el.innerHTML='<p class="k">'+mv.replace('-','년 ')+'월에는 '+LLR[LLRO]+' 로그인 기록이 없습니다.</p>';return}
  if(cn)cn.textContent='총 '+(count??L.length).toLocaleString('ko-KR')+'건'+((count||0)>L.length?' (최근 '+L.length.toLocaleString('ko-KR')+'건만 표시)':'');
  el.innerHTML=`<div class="tw"><table><caption class="sr-only">${LLR[LLRO]} 로그인 기록</caption><thead><tr><th>일시</th><th>계정</th><th class="hm">기기</th>${adm?'<th class="hm">IP</th>':''}</tr></thead><tbody>${L.map(r=>`<tr><td>${new Date(r.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</td><td>${esc(r.email||'-')}</td><td class="hm">${esc(r.ua||'-')}</td>${adm?`<td class="hm">${esc(r.ip||'-')}</td>`:''}</tr>`).join('')}</tbody></table></div>`}
async function viewDoc(id){openLay('<p class="k">불러오는 중…</p>');const{data,error}=await call({action:'company_doc_get',id});if(error)return openLay(`<p class="bad">${esc(error)}</p>`);
  const bytes=Uint8Array.from(atob(data.data),c=>c.charCodeAt(0));if(DCURL)URL.revokeObjectURL(DCURL);DCURL=URL.createObjectURL(new Blob([bytes],{type:data.mime}));
  openLay(`<div class="row" style="justify-content:flex-end;margin-bottom:12px"><a href="${DCURL}" target="_blank" rel="noopener" class="k" style="text-decoration:underline">새 창에서 열기</a></div><h3 id="lt" style="margin:0 0 10px">${esc(data.title||'자료')}</h3>${data.mime==='application/pdf'?`<iframe src="${DCURL}" title="${esc(data.title||'자료')}" style="width:100%;height:70vh;border:1px solid var(--line)"></iframe>`:`<img src="${DCURL}" alt="${esc(data.title||'자료')}" style="max-width:100%;display:block;margin:0 auto;border:1px solid var(--line)">`}`)}
async function docUp(body,f,msg){const m=$('#dcm');m.className='k';m.textContent=msg;try{const q=await prepFile(f),{error}=await call({action:'company_doc_upload',mime:q.mime,data:q.data,...body});if(error)throw error;await loadDocs();const m2=$('#dcm');m2.className='ok';m2.textContent='저장했습니다.'}catch(e){const m3=$('#dcm');m3.className='bad';m3.textContent=String(e.message||e)}}
$('#pg-docs').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.dv)return viewDoc(d.dv);
  if(d.dh){const L=DOCS.filter(x=>x.category==='platform_contract'&&x.platform_code===d.dh&&!x.is_current);openLay(`<h3 id="lt" style="margin:0 0 12px">${PN[d.dh]} 계약서 교체 이력</h3><div class="tw"><table class="vm"><thead><tr><th>등록일</th><th>교체일</th><th></th></tr></thead><tbody>${L.map(x=>`<tr><td>${dFmt(x.created_at)}</td><td>${dFmt(x.replaced_at)}</td><td class="r"><button class="ghost" data-hv="${x.id}">보기</button></td></tr>`).join('')}</tbody></table></div>`);$('#lbody').onclick=ev=>{const v=ev.target.closest('[data-hv]');if(v)viewDoc(v.dataset.hv)};return}
  if(d.dp){const had=DOCS.some(x=>x.category==='platform_contract'&&x.platform_code===d.dp&&x.is_current);if(had&&!confirm(PN[d.dp]+' 계약서를 교체할까요?\n이전 파일은 교체 이력으로 남습니다.'))return;DPLAT=d.dp;const fi=$('#dcf');fi.value='';fi.click();return}
  if(d.dd){if(!confirm('이 자료를 삭제할까요?\n삭제하면 복구할 수 없습니다.'))return;const{error}=await call({action:'company_doc_delete',id:d.dd});if(error)return alert(error);return loadDocs()}
  if(b.id==='dcp')return $('#dcx').click();
  if(b.id==='dcs'){const t=$('#dct').value.trim(),f=$('#dcx').files[0];if(!t)return alert('제목을 입력해 주세요.');if(!f)return alert('파일을 선택해 주세요.');return docUp({category:'other',title:t,memo:$('#dcn').value.trim()},f,'올리는 중…')}};
$('#pg-docs').onchange=e=>{if(e.target.id==='dcx'){const f=e.target.files[0];$('#dcfn').textContent=f?f.name:'선택한 파일이 없습니다. (PDF·JPG·PNG·WebP)';return}if(e.target.id!=='dcf')return;const f=e.target.files[0];if(!f||!DPLAT)return;if(f.type!=='application/pdf'){const m=$('#dcm');m.className='bad';m.textContent='플랫폼 계약서는 PDF만 올릴 수 있습니다.';return}docUp({category:'platform_contract',platform_code:DPLAT,title:PN[DPLAT]+' 계약서'},f,'올리는 중…')};
$('#lgm').onchange=()=>{LGM=monVal('#lgm');loadLogs()};
$('#llm').onchange=()=>{LLM=monVal('#llm');loadLoginLogs()};
$('#llr').onclick=e=>{const b=e.target.closest('[data-lr]');if(b){LLRO=b.dataset.lr;loadLoginLogs()}};
/* 방문자: Edge Function cf-stats(관리자 전용, Cloudflare 통계 조회) 호출. 토큰은 서버 비밀값에만 있음. 집계 시작일(VSTART) 이전은 보여주지 않음 */
const VSTART='2026-10-19',VDEV={desktop:'컴퓨터',mobile:'모바일',tablet:'태블릿'};
let VF='',VTO='',VT=0; /* 기본: 오늘 기준 최근 7일(시작=종료−6일), 날짜를 고르면 그 기간 */
function vrange(){const t=iso(kst()),Z=s=>new Date(s+'T00:00:00Z');let to=VTO||t;if(to>t)to=t;if(to<VSTART)to=VSTART;let f=VF||iso(addD(Z(to),-6));if(f<VSTART)f=VSTART;if(f>to)f=to;
  if(Math.round((Date.parse(to)-Date.parse(f))/864e5)+1>93)f=iso(addD(Z(to),-92));return{f,to,n:Math.round((Date.parse(to)-Date.parse(f))/864e5)+1}}
const vcnt=n=>Number(n||0).toLocaleString('ko-KR');
function vcountry(c){try{return new Intl.DisplayNames(['ko'],{type:'region'}).of(c)||c}catch(e){return c}}
function vlist(title,rows){return rows.length?`<p style="margin:20px 0 4px"><b>${title}</b></p><div style="border-bottom:1px solid var(--line)">${rows.map(r=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line);font-size:14px"><span>${esc(r[0])}</span><b>${vcnt(r[1])}</b></div>`).join('')}</div>`:''}
/* 홈페이지 버튼 클릭(문의·이메일 복사·출간작): site_event_counts(관리자만 읽기) 합산. Cloudflare 통계와 별개로 로드 */
async function loadClicks(my,from,to){const el=$('#vcb');
  const{data,error}=await SB.from('site_event_counts').select('n').eq('event','submit').gte('day',from).lte('day',to).limit(5000);
  if(my!==VT)return;
  if(error){el.innerHTML='<p class="k" style="margin-top:20px">투고 버튼 클릭을 불러오지 못했습니다. '+esc(error.message)+'</p>';return}
  el.innerHTML=vlist('이벤트',[['투고 버튼 클릭',(data||[]).reduce((a,x)=>a+x.n,0)]])}
async function loadVisit(){const el=$('#vsb'),my=++VT,R=vrange();
  const td=iso(kst());
  $('#vsq').innerHTML=`<label class="k" for="vqf">조회 기간</label><input id="vqf" type="date" min="${VSTART}" max="${td}" value="${R.f}" style="width:auto"><span>~</span><input id="vqt" type="date" min="${VSTART}" max="${td}" value="${R.to}" style="width:auto"><span class="k" style="font-size:12px">${VSTART.replace(/-/g,'.')}부터 집계 · 최대 93일</span>`;
  el.innerHTML='<p class="k">불러오는 중…</p>';
  $('#vcb').innerHTML='';loadClicks(my,R.f,R.to);
  const{data,error}=await SB.functions.invoke('cf-stats',{body:{from:R.f,to:R.to}});
  if(my!==VT)return;
  if(error||!data){el.innerHTML='<p class="k">통계를 불러오지 못했습니다. 서버 연결이 아직 안 되었거나 일시적인 오류일 수 있습니다. 아래 링크에서 Cloudflare 대시보드로 확인해 주세요.</p>';return}
  if(data.error){el.innerHTML='<p class="k">'+(data.error==='not_configured'?'통계 연결 설정이 아직 안 되어 있습니다. 아래 링크에서 Cloudflare 대시보드로 확인해 주세요.':'통계를 불러오지 못했습니다. '+esc(data.detail||data.error))+'</p>';return}
  const D=(data.daily||[]).filter(x=>x.date>=VSTART),T=data.total||{visits:(data.daily||[]).reduce((a,x)=>a+x.visits,0),views:(data.daily||[]).reduce((a,x)=>a+x.views,0)},mx=Math.max(...D.map(x=>x.visits),1);
  if(!T.visits&&!T.views&&!D.some(x=>x.visits)){el.innerHTML='<p class="k">이 기간에 집계된 방문이 없습니다. 방문 기록은 몇 시간 뒤부터 쌓입니다.</p>';return}
  const stat=(l,v)=>`<div style="text-align:center"><div class="k" style="font-size:12px">${l}</div><div style="font-size:22px;font-weight:700">${vcnt(v)}</div></div>`;
  el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px">${stat('기간 방문',T.visits)}${stat('페이지뷰',T.views)}${stat('일 평균 방문',Math.round(T.visits/R.n))}</div>
  <p style="margin:0 0 4px"><b>일별 방문</b> <span class="k" style="font-size:12px">(종료일 기준 최근 7일)</span></p>
  <div style="border-bottom:1px solid var(--line)">${D.map(x=>`<div style="display:grid;grid-template-columns:52px 1fr 52px;align-items:center;gap:12px;padding:9px 0;border-top:1px solid var(--line)"><span class="k" style="font-size:13px">${x.date.slice(5).replace('-','.')}</span><span style="height:6px;background:var(--line);position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:${x.visits?Math.max(x.visits/mx*100,2):0}%;background:var(--ink)"></i></span><span style="text-align:right;font-size:15px;font-weight:700">${vcnt(x.visits)}</span></div>`).join('')}</div>
  ${vlist('접속 국가',(data.countries||[]).map(x=>[vcountry(x.name),x.views]))}${vlist('기기',(data.devices||[]).map(x=>[VDEV[x.name]||x.name,x.views]))}${data.scope==='main'?'':'<p class="k" style="font-size:12px;margin:14px 0 0">※ 홈 외 페이지가 포함된 값입니다(서버 함수를 최신으로 교체하면 메인 페이지만 집계).</p>'}`}
$('#vsq').onchange=e=>{if(e.target.id!=='vqf'&&e.target.id!=='vqt')return;const f=$('#vqf').value,x=$('#vqt').value;if(!f||!x)return;VF=f<=x?f:x;VTO=f<=x?x:f;loadVisit()};
