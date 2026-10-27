/* SNS 글 작성기: 작가·작품을 DB에서 읽어 '선택'으로만 고르게 함(읽기 전용, 쓰기 없음).
   - 작가명: 누르면 전체 작가 목록이 열리고, 글자를 치면 걸러짐. 다시 눌러도 항상 전체 목록부터 보임
   - 작품명: 고른 작가의 작품만 선택(출간일 최신순). 작품이 하나면 자동 선택
   - DB를 못 읽으면(로그인 없음·네트워크) 예전처럼 직접 입력으로 대체 */
(function(){
var SB_URL='https://wddixxdrndgvjgicwunu.supabase.co',SB_KEY='sb_publishable_fIrxIqOmX_-BFpSELdmvXQ_kkYSkaCx';
var $=function(s){return document.querySelector(s)};
var inp=$('#snsauthor'),box=$('#snsalist'),sel=$('#snstitle'),fb=$('#snstitlefb');
var NAMES=[],byName={},worksOf={},VALID='',DBOK=false,hi=-1,SILENT=false;
function dbg(l,e){try{console.warn('[sns-db] '+l,e)}catch(_){}}
function note(m){var n=$('#snsdbnote');n.textContent=m||'';n.hidden=!m}
function fire(el,t){el.dispatchEvent(new Event(t,{bubbles:true}))}
function fireQuiet(el,t){SILENT=true;try{fire(el,t)}finally{SILENT=false}}   /* 이 파일의 입력 처리는 건너뛰고 미리보기만 갱신 */
function opt(v,t){var o=document.createElement('option');o.value=v;o.textContent=t;return o}
function ym(d){return d?String(d).slice(0,7):''}

/* ---- 작가 목록 ---- */
function items(){return [].slice.call(box.querySelectorAll('button'))}
function mark(i){var L=items();L.forEach(function(b,k){b.classList.toggle('on',k===i)});hi=i;if(L[i]&&L[i].scrollIntoView)L[i].scrollIntoView({block:'nearest'})}
function draw(filter){
  var q=(filter||'').toLowerCase(),L=NAMES.filter(function(n){return !q||n.toLowerCase().indexOf(q)>=0});
  box.textContent='';hi=-1;
  if(!L.length){var d=document.createElement('div');d.className='none';d.textContent='일치하는 작가가 없습니다';box.appendChild(d);return}
  L.forEach(function(n){var b=document.createElement('button');b.type='button';b.setAttribute('role','option');b.textContent=n;box.appendChild(b)});
}
function open(all){if(!DBOK)return;draw(all?'':inp.value.trim());box.hidden=false;inp.setAttribute('aria-expanded','true')}
function close(){box.hidden=true;inp.setAttribute('aria-expanded','false');hi=-1}
function choose(n){inp.value=n;VALID=n;close();fireQuiet(inp,'input');drawTitles()}

/* ---- 작품 선택 ---- */
function drawTitles(){
  var ids=byName[VALID]||[],seen={},list=[];
  ids.forEach(function(a){(worksOf[a]||[]).forEach(function(w){if(!seen[w.id]){seen[w.id]=1;list.push(w)}})});
  list.sort(function(x,y){return String(y.release_date||'').localeCompare(String(x.release_date||''))});
  sel.textContent='';
  if(!VALID){sel.appendChild(opt('','작가를 먼저 선택하세요'));sel.disabled=true}
  else if(!list.length){sel.appendChild(opt('','등록된 작품이 없습니다'));sel.disabled=true}
  else{
    sel.appendChild(opt('','작품을 선택하세요'));
    list.forEach(function(w){sel.appendChild(opt(w.title,w.title+(w.release_date?' · '+ym(w.release_date):'')))});
    sel.disabled=false;
    if(list.length===1)sel.value=list[0].title;
  }
  fire(sel,'change');
}

async function load(){
  try{
    if(!window.supabase)throw new Error('라이브러리 없음');
    var sb=supabase.createClient(SB_URL,SB_KEY,{auth:{autoRefreshToken:false,detectSessionInUrl:false}});
    var ss=await sb.auth.getSession();
    if(!ss.data||!ss.data.session){manual('정산 사이트에 로그인하면 작가·작품을 선택할 수 있습니다. 지금은 직접 입력으로 사용합니다.');return}
    var r=await Promise.all([
      sb.from('authors').select('id,pen_name').order('pen_name'),
      sb.from('work_authors').select('work_id,author_id'),
      sb.from('works').select('id,title,release_date')]);
    for(var i=0;i<r.length;i++)if(r[i].error)throw r[i].error;
    var wk={};(r[2].data||[]).forEach(function(w){wk[w.id]=w});
    (r[1].data||[]).forEach(function(x){var w=wk[x.work_id];if(w)(worksOf[x.author_id]=worksOf[x.author_id]||[]).push(w)});
    (r[0].data||[]).forEach(function(a){if(a.pen_name)(byName[a.pen_name]=byName[a.pen_name]||[]).push(a.id)});
    NAMES=Object.keys(byName);DBOK=true;
    if(!NAMES.length)manual('등록된 작가가 없어 직접 입력으로 사용합니다.');
  }catch(e){dbg('load',e);manual('작가·작품 목록을 불러오지 못해 직접 입력으로 사용합니다.')}
}
/* DB를 못 쓸 때: 작가·작품명 직접 입력 */
function manual(msg){
  DBOK=false;close();note(msg);inp.placeholder='작가명';
  sel.hidden=true;sel.disabled=false;fb.hidden=false;
  fb.addEventListener('input',function(){sel.textContent='';sel.appendChild(opt(fb.value,fb.value));sel.value=fb.value;fire(sel,'change')});
}

inp.addEventListener('focus',function(){if(DBOK){inp.select();open(true)}});
inp.addEventListener('click',function(){if(DBOK){inp.select();open(true)}});
inp.addEventListener('input',function(){
  if(!DBOK||SILENT)return;
  open(false);
  if(inp.value!==VALID){VALID='';drawTitles()}      // 글자를 고치는 순간 선택은 풀림 → 목록에서 다시 고름
});
inp.addEventListener('keydown',function(e){
  if(!DBOK)return;var L=items();
  if(e.key==='ArrowDown'){e.preventDefault();if(box.hidden)open(true);else mark(Math.min(hi+1,L.length-1))}
  else if(e.key==='ArrowUp'){e.preventDefault();mark(Math.max(hi-1,0))}
  else if(e.key==='Enter'){if(!box.hidden){e.preventDefault();var t=L[hi>=0?hi:(L.length===1?0:-1)];if(t&&t.tagName==='BUTTON')choose(t.textContent)}}
  else if(e.key==='Escape'){close()}
});
inp.addEventListener('blur',function(){setTimeout(function(){
  if(!DBOK)return;close();
  if(inp.value!==VALID){inp.value=VALID;fireQuiet(inp,'input')}   // 목록에 없는 글자는 되돌림
},120)});
box.addEventListener('mousedown',function(e){var b=e.target.closest('button');if(!b)return;e.preventDefault();choose(b.textContent)});
document.addEventListener('click',function(e){          // '입력 비우기'
  if(!e.target.closest('[data-act="clear"]'))return;
  setTimeout(function(){VALID='';fb.value='';if(DBOK){inp.value='';drawTitles()}else{sel.textContent='';sel.appendChild(opt('',''))}},0);
});
load();
})();
