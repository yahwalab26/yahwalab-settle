/* admin/upload-infer.js — 양식 자동 추론·업로드 확정
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 양식 자동 추론: 알려진 양식이 아니어도 열 이름(제목)을 보고 값을 추정 ---------- */
const SYN={title:['제목','도서명','상품명','작품명','콘텐츠명','책제목','title'],author:['저자','저자명','작가','작가명','필명'],isbn:['isbn','epubisbn','전자책isbn','도서isbn'],
  date:['판매일','판매일시','판매취소일시','판매기간','일자','날짜','주문일','결제일'],qty:['부수','수량','판매수량','판매부수','건수'],list:['정가','출판사판매가'],price:['판매가','서점판매가','단가'],
  gross:['판매금액','판매액','매출액','매출','결제금액','총판매액'],net:['정산액','출판사정산액','정산금액','cp정산액'],channel:['판매처','판매채널','채널','스토어'],
  method:['판매유형','판매방식','대여소장'],type:['판매구분','판매형태','취소여부','상태'],refund:['환불일']};
const nrm=v=>c(v).toLowerCase().replace(/[\s_\-\/()·.]/g,''),numx=v=>num(String(v??'').replace(/[원₩\s]/g,''));
function guessMap(h){const m={},N=h.map(nrm);for(const[f,list]of Object.entries(SYN)){let i=N.findIndex(x=>list.includes(x));if(i<0)i=N.findIndex(x=>x&&list.some(t=>x.includes(t))&&!(f==='price'&&x.includes('정가')));if(i>=0)m[f]=i}return m}
function inferParse(rows,hi,m,p){const h=rows[hi],L=[],E=[],g=(r,k)=>m[k]===undefined?'':r[m[k]];
  rows.slice(hi+1).forEach((r,n)=>{if(!r.some(x=>c(x)!==''))return;const t=c(g(r,'title')).replace(/\s+/g,' ');if(!t||['합계','총계','계'].includes(t))return;
    try{const raw={};h.forEach((k,i)=>{const v=c(r[i]);if(c(k)&&v!=='')raw[c(k)]=v});
      let q=m.qty===undefined?1:numx(g(r,'qty'));const g0=m.gross===undefined?null:numx(g(r,'gross')),pr=m.price===undefined?null:numx(g(r,'price')),n0=m.net===undefined?null:numx(g(r,'net'));if(q==null)q=1;
      const gr=g0!=null?g0:(pr!=null?pr*q:null);if(gr==null)throw '판매금액을 찾을 수 없습니다';
      const rf=/취소|환불/.test(c(g(r,'type')))||c(g(r,'refund'))!==''||q<0||gr<0||(n0!=null&&n0<0),sg=rf?-1:1,iv=m.isbn===undefined?'':isbn(g(r,'isbn'));
      const base={isbn:/^\d{13}$/.test(iv)?iv:'t:'+t,title:t,author:c(g(r,'author')),line_type:rf?'refund':'sale',channel:c(g(r,'channel')),sale_method:c(g(r,'method')),quantity:sg*Math.abs(q),
        list_price:m.list===undefined?null:numx(g(r,'list')),sale_price:pr!=null?Math.abs(pr):(q?Math.round(Math.abs(gr)/Math.abs(q)):null),gross_amount:sg*Math.abs(gr),net_amount:n0==null?null:sg*Math.abs(n0),raw},
        dv=g(r,'date'),ds=c(dv);
      if(m.date!==undefined&&ds!==''){
        if(/^\d{4}[-./]\d{1,2}$/.test(ds)){const[y,mo]=ds.split(/[-./]/);L.push({...base,granularity:'monthly',sale_date:null,sale_month:`${y}-${mo.padStart(2,'0')}-01`})}
        else{const d=dt(dv),timed=typeof dv==='number'?dv%1>0:/\d{1,2}:\d{2}/.test(ds);L.push({...base,granularity:'transaction',agg:!timed,sold_at:d.ts,sale_date:d.date,sale_month:d.month})}}
      else L.push({...base,granularity:'transaction',agg:true,undated:true})}
    catch(e){E.push(`${hi+n+2}행: ${e}`)}});
  if(!L.length&&!E.length)E.push('읽을 수 있는 데이터 행이 없습니다.');return{L,E}}
async function startInfer(rows,name,sha){let hi=-1,best=0,map={};
  rows.slice(0,15).forEach((r,i)=>{const m=guessMap(r),sc=Object.keys(m).length;if(m.title!==undefined&&(m.gross!==undefined||m.price!==undefined||m.net!==undefined)&&sc>best){best=sc;hi=i;map=m}});
  if(hi<0){QRES.push(`${name}: 알려진 양식이 아니며 열 이름에서 제목과 금액 열을 찾지 못했습니다. 첫 줄(제목 행)을 확인해 주세요.`);return nextFile()}
  const low=name.toLowerCase(),G={'알라딘':'aladin',aladin:'aladin','예스24':'yes24',yes24:'yes24','교보':'kyobo',kyobo:'kyobo','북큐브':'bookcube',bookcube:'bookcube','리디':'ridi',ridi:'ridi'},k=Object.keys(G).find(x=>low.includes(x));
  S={p:k?G[k]:'',name,sha,rows,hi,map,inf:true,errs:[],lines:[],ps:'',pe:'',dup:0};await applyInfer()}
async function applyInfer(){const s=S;if(!s.p){s.errs=['먼저 플랫폼을 선택하세요.'];s.lines=[];s.needDate=false;return render()}
  const{L,E}=inferParse(s.rows,s.hi,s.map,s.p);s.errs=E;s.needDate=L.some(l=>l.undated);
  if(s.needDate){s.raw=L;s.bc??={mode:'day',val:iso(addD(kst(),-1))};return await applyBc()}
  s.lines=E.length?[]:await withKeys(L,s.p);const D=s.lines.map(l=>l.sale_date||l.sale_month).sort();s.ps=D[0]||'';s.pe=D[D.length-1]||'';s.dup=0;if(!E.length&&s.lines.length)await markDup();render()}
function infCard(){if(!S.inf)return '';const h=S.rows[S.hi],F={title:'제목',author:'저자',isbn:'ISBN',date:'일자',qty:'수량',gross:'판매금액',net:'정산액',list:'정가',price:'판매가',channel:'판매처',method:'판매유형',type:'취소·구분',refund:'환불일'};
  return `<div class="card" style="text-align:left"><b>양식 자동 인식</b><p class="k" style="margin:4px 0 12px">알려진 양식이 아니어서 열 이름을 보고 추정했습니다. 잘못 연결된 항목은 바꿔 주세요.</p>
  <div class="row" style="justify-content:flex-start;gap:8px 18px"><label class="k" style="display:flex;gap:8px;align-items:center">플랫폼<select id="ip" style="width:auto"><option value="">선택…</option>${['ridi','kyobo','aladin','yes24','bookcube'].map(c=>`<option value="${c}" ${S.p===c?'selected':''}>${PN[c]}</option>`).join('')}</select></label>
  ${Object.entries(F).map(([f,t])=>`<label class="k" style="display:flex;gap:8px;align-items:center">${t}<select data-f="${f}" style="width:auto;max-width:150px"><option value="">(없음)</option>${h.map((x,i)=>`<option value="${i}" ${S.map[f]===i?'selected':''}>${esc(c(x)||'열'+(i+1))}</option>`).join('')}</select></label>`).join('')}</div>
  <p class="k" style="font-size:12px;margin:10px 0 0">정산액 열이 없으면 플랫폼 정산율로 계산합니다. 일자 열이 없으면 아래에서 적용 일자를 지정합니다.</p></div>`}
async function applyBc(){const b=S.bc,v=b.val;
  S.errs=S.errs.filter(x=>!x.startsWith('적용'));if(!v)S.errs.push('적용 일자를 선택하세요.');
  const L=S.raw.map(l=>b.mode==='day'?{...l,granularity:'transaction',sold_at:v+'T00:00:00+09:00',sale_date:v,sale_month:v.slice(0,7)+'-01'}:{...l,granularity:'monthly',sale_date:null,sale_month:v+'-01'});
  S.lines=v?await withKeys(L,S.p):[];const D=S.lines.map(l=>l.sale_date||l.sale_month).sort();S.ps=D[0]||'';S.pe=D[D.length-1]||'';S.dup=0;
  if(!S.errs.length&&S.lines.length)await markDup();render()}
function bcCard(){if(!S.needDate)return '';const b=S.bc;
  return `<div class="card"><b>적용 기간 지정</b><p class="k" style="margin:4px 0 12px">북큐브 파일에는 날짜가 없어서, 이 파일이 어느 날짜(또는 월)의 정산인지 지정해야 합니다.</p><div class="row"><select id="bm" aria-label="적용 단위"><option value="day" ${b.mode==='day'?'selected':''}>일 단위</option><option value="month" ${b.mode==='month'?'selected':''}>월 단위</option></select><input id="bv" aria-label="적용 일자" type="${b.mode==='day'?'date':'month'}" value="${b.val}"${b.mode==='day'?` max="${iso(addD(kst(),-1))}"`:''}></div></div>`}
const inRange=()=>S.lines.every(l=>S.p==='kyobo'?(l.sale_month>=S.ps.slice(0,7)+'-01'&&l.sale_month<=S.pe.slice(0,7)+'-01'):(l.sale_date>=S.ps&&l.sale_date<=S.pe));

function render(){
  const s=S,U=unmatched(),gross=s.lines.reduce((a,l)=>a+l.gross_amount,0),net=s.p==='kyobo'?null:s.lines.reduce((a,l)=>a+l.net_amount,0);
  const by={};s.lines.forEach(l=>{const k=l.isbn;by[k]??={t:l.title,a:l.author,q:0,g:0};by[k].q+=l.quantity;by[k].g+=l.gross_amount});
  const ok=!s.errs.length&&!Object.keys(U).length&&s.lines.length&&s.p;
  $('#prev').innerHTML=`<div class="card">
    ${QRES.length?`<p class="ok" style="margin:0 0 10px;font-size:13px">${QRES.map(esc).join('<br>')}</p>`:''}<div class="row"><b>${PN[s.p]||'플랫폼 미선택'}</b><span class="k">${esc(s.name)}</span>${QTOT>1?`<span class="k">(${QTOT-QUE.length}/${QTOT})</span>`:''}</div>
    <div class="tw"><table style="margin-top:12px"><thead><tr><th>작품</th><th>작가</th><th class="r">수량</th><th class="r">판매금액</th></tr></thead><tbody>
    ${Object.entries(by).map(([k,v])=>`<tr><td>${esc(ISBN[k]?(WORKS.find(w=>w.id===ISBN[k])||{}).title:v.t)} ${ISBN[k]?'':'<span class="bad">· 미등록</span>'}</td><td>${authCell(k,v.a)}</td><td class="r">${v.q}</td><td class="r">${won(v.g)}</td></tr>`).join('')}
    <tr><td><b>합계 ${s.lines.length}행</b></td><td></td><td></td><td class="r"><b>${won(gross)}</b></td></tr></tbody></table></div>
    <p class="k" style="margin:10px 0 0">${net==null?'교보문고는 정산액이 파일에 없어 정산율로 계산됩니다.':`CP 정산액 합계 ${won(net)}`}</p></div>
  ${s.errs.length?`<div class="card bad"><b>오류 ${s.errs.length}건 — 수정 후 다시 올려주세요</b><br>${s.errs.slice(0,8).map(esc).join('<br>')}${s.errs.length>8?'<br>…':''}</div>`:''}
  ${Object.keys(U).length?`<div class="card"><b>미등록 작품 ${Object.keys(U).length}건</b><p class="k" style="margin:4px 0 12px">ISBN으로 작품을 연결해야 업로드할 수 있습니다. 한 번 연결하면 이후 파일에서는 자동 인식됩니다.</p>
    ${Object.entries(U).map(([i,t])=>`<div class="row" style="margin-bottom:8px"><span style="flex:1 1 200px;min-width:0;overflow-wrap:anywhere">${esc(t)}<br><span class="k">${i.startsWith('t:')?'제목으로 매칭':i}</span></span>
    <select data-sel="${i}"><option value="">작품 선택…</option><option value="__new">+ 새 작품으로 등록</option>${WORKS.map(w=>`<option value="${w.id}" ${w.title===t.replace(/^\[[^\]]*\]\s*/,'')?'selected':''}>${esc(w.title)}</option>`).join('')}</select>
    <select data-lbl="${i}">${['야화랩','트루비'].map(o=>`<option ${(S.lines.find(l=>l.isbn===i)||{}).pub===o?'selected':''}>${o}</option>`).join('')}</select><button class="ghost" data-link="${i}" data-title="${esc(t)}">연결</button></div>`).join('')}</div>`:''}
  ${infCard()}${bcCard()}${authCard()}
  ${rowPrev()}<div class="card"><p style="margin:0">신규 <b>${s.lines.length-s.dup}건</b>${s.p==='kyobo'?(s.dup?` · 기존 ${s.dup}건은 새 값으로 갱신됩니다`:''):` · 중복 <b>${s.dup}건</b>은 건너뜁니다`}</p>
    <p class="k" style="margin:6px 0 0">이미 올린 행은 다시 추가되지 않고, 새 행만 저장됩니다.</p>
    <div class="row" style="margin-top:14px"><button id="go" ${ok?'':'disabled'}>확인하고 등록</button><button class="ghost" id="sk">${QUE.length?'건너뛰기':'취소'}</button><span id="msg"></span></div></div>`;
  if(s.needDate){$('#bm').onchange=e=>{S.bc.mode=e.target.value;S.bc.val=e.target.value==='day'?iso(addD(kst(),-1)):iso(addD(kst(),-1)).slice(0,7);applyBc()};$('#bv').onchange=e=>{S.bc.val=e.target.value;applyBc()}}
  $('#sk').onclick=()=>{S=null;nextFile()};
  if(s.inf){$('#ip').onchange=e=>{S.p=e.target.value;applyInfer()};document.querySelectorAll('[data-f]').forEach(sel=>sel.onchange=e=>{const f=e.target.dataset.f;if(e.target.value==='')delete S.map[f];else S.map[f]=+e.target.value;applyInfer()})}
  $('#go').onclick=commit}

$('#prev').onclick=async e=>{if(e.target.dataset.alink)return linkAuthor(e.target.dataset.alink,e.target);const i=e.target.dataset.link;if(!i)return;
  const sel=$(`[data-sel="${i}"]`).value;if(!sel)return alert('연결할 작품을 선택하세요.');
  let wid=sel;e.target.disabled=true;
  if(sel==='__new'){const{data,error}=await SB.from('works').insert({title:e.target.dataset.title.replace(/^\[[^\]]*\]\s*/,''),label:$(`[data-lbl="${i}"]`).value}).select('id').single();
    if(error){e.target.disabled=false;return alert(error.message)}wid=data.id}
  const{error}=await SB.from('work_identifiers').insert(i.startsWith('t:')?{work_id:wid,id_type:'title_alias',platform_code:S.p||null,value:i.slice(2)}:{work_id:wid,id_type:'isbn',value:i});
  if(error){e.target.disabled=false;return alert(error.message)}
  await loadRefs();render()};

const authCell=(k,name)=>{const w=ISBN[k];if(!w)return `<span class="k">${esc(name)||'-'}</span>`;
  const ids=WA[w]||[];if(!ids.length)return `<span class="bad">${esc(name)||'-'} · 미연결</span>`;
  const ns=ids.map(i=>(AUTHORS.find(a=>a.id===i)||{}).pen_name);
  return esc(ns.join(', '))+(name&&!ns.includes(name)?` <span class="k">(파일: ${esc(name)})</span>`:'')};
function authCard(){const NA={};S.lines.forEach(l=>{const w=ISBN[l.isbn];if(w&&!(WA[w]||[]).length)NA[w]??=l.author});const K=Object.entries(NA);if(!K.length)return '';
  return `<div class="card"><b>작가 미연결 작품 ${K.length}건</b><p class="k" style="margin:4px 0 12px">등록된 작가(필명)만 연결할 수 있습니다. 목록에 없으면 <a href="#/authors">작가 탭</a>에서 먼저 등록하세요. 지금 연결하지 않고 업로드해도 되며, 나중에 연결하면 그대로 반영됩니다.</p>
  ${K.map(([w,name])=>{const m=AUTHORS.find(a=>a.pen_name===name);return `<div class="row" style="margin-bottom:8px"><span style="flex:1 1 200px;min-width:0;overflow-wrap:anywhere">${esc((WORKS.find(x=>x.id===w)||{}).title)}<br><span class="k">파일의 저자명: ${esc(name)||'-'}</span></span>
  <select data-asel="${w}"><option value="">작가 선택…</option>${AUTHORS.map(a=>`<option value="${a.id}" ${m&&m.id===a.id?'selected':''}>${esc(a.pen_name)}</option>`).join('')}</select>
  <button class="ghost" data-alink="${w}" data-name="${esc(name)}">연결</button></div>`}).join('')}</div>`}
async function linkAuthor(w,btn){const sel=$(`[data-asel="${w}"]`).value;if(!sel)return alert('연결할 작가를 선택하세요.');btn.disabled=true;let aid=sel;
  if(sel==='__new'){const{data,error}=await SB.from('authors').insert({pen_name:btn.dataset.name}).select('id').single();if(error){btn.disabled=false;return alert(error.message)}aid=data.id}
  const{error}=await SB.from('work_authors').insert({work_id:w,author_id:aid,share_ratio:1});
  if(error){btn.disabled=false;return alert(error.message)}await loadRefs();render()}
async function overlap(){const{data}=await SB.rpc('preview_upload_overlap',{p_platform:S.p,p_start:S.ps,p_end:S.pe});const o=data?.[0],el=$('#ov');
  if(el)el.innerHTML=o&&o.existing_rows>0?`<span class="bad">주의: 같은 기간의 기존 데이터 ${o.existing_rows}건(${won(o.existing_gross)})이 삭제되고 이 파일로 교체됩니다.</span>`:'같은 기간의 기존 데이터가 없어 새로 추가됩니다.'}

async function commit(){const b=$('#go');b.disabled=true;$('#msg').textContent='업로드 중…';
  const lines=S.lines.map(({isbn:i,title,author,pub,agg,undated,...x})=>({...x,is_agg:!!agg,work_id:ISBN[i]}));
  const{data,error}=await SB.rpc('commit_upload_v2',{p_batch:{platform_code:S.p,filename:S.name,file_sha256:S.sha,period_start:S.ps,period_end:S.pe},p_lines:lines});
  if(error){b.disabled=false;$('#msg').innerHTML=`<span class="bad">${esc(error.message)}</span>`;reportErr('업로드 확정',error.message);return}
  QRES.push(`${S.name}: ${PN[S.p]} 신규 ${data.inserted}건 추가 · 중복 ${data.skipped}건 건너뜀${data.updated?` · ${data.updated}건 갱신`:''}`);S=null;loadFresh();loadUploads();nextFile()}
