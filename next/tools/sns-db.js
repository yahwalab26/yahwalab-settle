/* SNS 글 작성기: 작가·작품을 DB에서 읽어 선택(읽기 전용, 쓰기 없음).
   - 작가명 칸에 필명 목록(검색)이 붙고, 필명이 일치하면 그 작가의 작품 목록이 뜸
   - 작품을 고르면 작품명 칸이 채워짐. 작품명을 고쳐도 글에만 반영되고 DB는 바뀌지 않음
   - 읽기에 실패해도(로그인 없음·네트워크) 지금처럼 직접 입력으로 계속 사용 가능 */
(function(){
var SB_URL='https://wddixxdrndgvjgicwunu.supabase.co',SB_KEY='sb_publishable_fIrxIqOmX_-BFpSELdmvXQ_kkYSkaCx';
var $=function(s){return document.querySelector(s)};
var byName={},worksOf={};   // 필명 → [작가 id], 작가 id → [작품]
function dbg(l,e){try{console.warn('[sns-db] '+l,e)}catch(_){}}
function note(msg){var n=$('#snsdbnote');if(!n)return;n.textContent=msg||'';n.classList.toggle('dbhide',!msg)}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}))}
function opt(v,t){var o=document.createElement('option');o.value=v;o.textContent=t;return o}
function ym(d){return d?String(d).slice(0,7):''}

/* 작가명이 등록된 필명과 일치하면 작품 목록을 채움 */
function drawWorks(){
  var f=$('#snsworkf'),sel=$('#snswork'),name=$('#snsauthor').value.trim();
  var ids=byName[name]||[],seen={},list=[];
  ids.forEach(function(a){(worksOf[a]||[]).forEach(function(w){if(!seen[w.id]){seen[w.id]=1;list.push(w)}})});
  list.sort(function(x,y){return String(y.release_date||'').localeCompare(String(x.release_date||''))});
  sel.textContent='';sel.appendChild(opt('','직접 입력'));
  list.forEach(function(w){sel.appendChild(opt(w.id,w.title+(w.release_date?' · '+ym(w.release_date):'')))});
  sel._list=list;
  f.classList.toggle('dbhide',!list.length);
  if(name&&ids.length&&!list.length)note('등록된 작품이 없는 작가입니다. 작품명은 직접 입력해 주세요.');else note('');
}
function pick(){
  var sel=$('#snswork'),w=(sel._list||[]).filter(function(x){return String(x.id)===sel.value})[0];
  if(!w)return;                       // '직접 입력'이면 작품명 칸은 그대로 둠
  var t=$('#snstitle');t.value=w.title;fire(t);
}

async function load(){
  try{
    if(!window.supabase){note('작가 목록을 불러올 수 없어 직접 입력으로 사용합니다.');return}
    var sb=supabase.createClient(SB_URL,SB_KEY,{auth:{autoRefreshToken:false,detectSessionInUrl:false}});
    var ss=await sb.auth.getSession();
    if(!ss.data||!ss.data.session){note('정산 사이트에 로그인하면 작가·작품 목록을 쓸 수 있습니다. 지금은 직접 입력으로 사용합니다.');return}
    var r=await Promise.all([
      sb.from('authors').select('id,pen_name').order('pen_name'),
      sb.from('work_authors').select('work_id,author_id'),
      sb.from('works').select('id,title,release_date')]);
    for(var i=0;i<r.length;i++)if(r[i].error)throw r[i].error;
    var wk={};(r[2].data||[]).forEach(function(w){wk[w.id]=w});
    (r[1].data||[]).forEach(function(x){var w=wk[x.work_id];if(!w)return;(worksOf[x.author_id]=worksOf[x.author_id]||[]).push(w)});
    var dl=$('#snsauthors');
    (r[0].data||[]).forEach(function(a){if(!a.pen_name)return;(byName[a.pen_name]=byName[a.pen_name]||[]).push(a.id)});
    Object.keys(byName).forEach(function(n){var o=document.createElement('option');o.value=n;dl.appendChild(o)});
    drawWorks();
  }catch(e){dbg('load',e);note('작가·작품 목록을 불러오지 못해 직접 입력으로 사용합니다.')}
}

$('#snsauthor').addEventListener('input',drawWorks);
$('#snsauthor').addEventListener('change',drawWorks);
$('#snswork').addEventListener('change',pick);
document.addEventListener('click',function(e){    // '입력 비우기'에서 선택칸도 초기화
  var b=e.target.closest('[data-act="clear"]');if(!b)return;
  setTimeout(drawWorks,0);
});
load();
})();
