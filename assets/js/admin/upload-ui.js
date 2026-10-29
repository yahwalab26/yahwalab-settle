/* admin/upload-ui.js — 업로드 화면
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 업로드 화면 ---------- */
const dz=$('#dz'),fi=$('#file');
let QUE=[],QRES=[],QTOT=0;
function startQ(files){QUE=[...files];QRES=[];QTOT=QUE.length;nextFile()}
function nextFile(){const f=QUE.shift();if(f)return handle(f);fi.value='';$('#prev').innerHTML=QRES.length?`<div class="card ok" style="text-align:left"><b>업로드 처리 결과</b><br>${QRES.map(esc).join('<br>')}</div>`:''}
fi.onchange=()=>fi.files.length&&startQ(fi.files);
dz.ondragover=e=>{e.preventDefault();dz.classList.add('on')};dz.ondragleave=()=>dz.classList.remove('on');
dz.ondrop=e=>{e.preventDefault();dz.classList.remove('on');e.dataTransfer.files.length&&startQ(e.dataTransfer.files)};

async function handle(f){
  $('#prev').innerHTML='<p class="k">파일을 읽는 중…</p>';
  try{const buf=await f.arrayBuffer(),sha=hex(await crypto.subtle.digest('SHA-256',buf));
    if(!/\.csv$/i.test(f.name))await needXLSX();
    const rows=/\.csv$/i.test(f.name)?parseCSV(decode(buf)):(()=>{const wb=XLSX.read(buf,{type:'array'});return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:''})})();
    const[p,hi]=detect(rows);if(!p)return await startInfer(rows,f.name,sha);
    const{L,E}=parse(rows,p,hi);
    if(p==='bookcube'){S={p,name:f.name,sha,raw:L,lines:[],errs:E,ps:'',pe:'',dup:0,needDate:true,bc:{mode:'day',val:iso(addD(kst(),-1))}};return await applyBc()}
    const lines=await withKeys(L,p),D=lines.map(l=>l.sale_date||l.sale_month).sort();
    S={p,name:f.name,sha,lines,errs:E,ps:D[0],pe:D[D.length-1],dup:0};
    if(!E.length&&lines.length)await markDup();
    render()}
  catch(e){QRES.push(`${f.name}: 읽지 못했습니다 (${e.message||e})`);nextFile()}}

const h256=async t=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)));
async function withKeys(L,p){const seen={},out=[],agg={};   // 행 지문: 건별은 "같은 내용의 n번째 행", 월 집계는 (작품·월·채널·방식)
  for(const l of L){
    if(l.granularity==='monthly'||l.agg){const k=l.granularity==='monthly'?[p,l.isbn,l.sale_month,l.channel,l.sale_method].join('|'):[p,l.isbn,l.sale_date,l.channel||'',l.sale_method||'',l.line_type].join('|');
      if(agg[k]){const a=agg[k];a.quantity+=l.quantity;a.gross_amount+=l.gross_amount;if(l.net_amount!=null)a.net_amount=(a.net_amount||0)+l.net_amount}else{agg[k]={...l,_k:k};out.push(agg[k])}}
    else{const b=[p,l.isbn,l.line_type,l.sold_at,l.channel||'',l.sale_method||'',l.sale_price,l.net_amount,l.quantity].join('|');seen[b]=(seen[b]||0)+1;out.push({...l,_k:b+'|'+seen[b]})}}
  for(const l of out){l.row_key=await h256(l._k);delete l._k}return out}
async function markDup(){const{data}=await SB.rpc('existing_keys',{p_platform:S.p,p_keys:S.lines.map(l=>l.row_key)});S.have=new Set(data||[]);S.dup=S.lines.filter(l=>S.have.has(l.row_key)).length}
function rowPrev(){const L=S.lines;if(!L.length)return '';const sta=l=>S.have?.has(l.row_key)?(l.granularity==='monthly'||l.agg?'갱신':'중복'):'신규';
  return `<div class="card" style="text-align:left"><b>등록될 데이터 미리보기</b> <span class="k">(${L.length}행 중 ${Math.min(L.length,100)}행 표시 · 내용을 확인한 뒤 아래 버튼을 눌러야 등록됩니다)</span><div class="tw" style="margin-top:10px"><table><caption class="sr-only">등록될 데이터</caption><thead><tr><th>일자</th><th>작품</th><th class="hm">작가</th><th class="hm">구분</th><th class="r">수량</th><th class="r hm">판매금액</th><th class="r">정산액</th><th>상태</th></tr></thead><tbody>${L.slice(0,100).map(l=>{const st=sta(l);return `<tr${st==='중복'?' style="color:var(--mute)"':''}><td>${l.sale_date||(l.sale_month||'').slice(0,7)+' 월'}</td><td>${esc(l.title)}</td><td class="hm">${esc(l.author||'-')}</td><td class="hm">${l.line_type==='refund'?'취소':'판매'}${l.sale_method?' · '+esc(l.sale_method):''}</td><td class="r">${l.quantity}</td><td class="r hm">${won(l.gross_amount)}</td><td class="r">${l.net_amount==null?'(계산)':won(l.net_amount)}</td><td>${st==='신규'?'<span class="ok">신규</span>':st==='갱신'?'갱신':'<span class="k">중복 · 건너뜀</span>'}</td></tr>`}).join('')}</tbody></table></div></div>`}
const unmatched=()=>{const m={};S.lines.forEach(l=>{if((/^\d{13}$/.test(l.isbn)||/^t:./.test(l.isbn))&&!ISBN[l.isbn])m[l.isbn]??=l.title});return m};
