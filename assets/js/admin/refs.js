/* admin/refs.js — 관리자 기초 자료 불러오기(loadRefs·loadFresh)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

async function loadRefs(){const[w,i,a,l]=await Promise.all([SB.from('works').select('id,title,label,release_date,contract_start').order('title'),
  SB.from('work_identifiers').select('work_id,value,id_type,platform_code'),
  SB.from('authors').select('id,pen_name,person_id,email').order('pen_name'),SB.from('work_authors').select('work_id,author_id')]);
  WORKS=w.data||[];ISBN={};(i.data||[]).forEach(x=>{if(x.id_type==='isbn')ISBN[x.value]=x.work_id;else if(x.id_type==='title_alias')ISBN['t:'+x.value]=x.work_id});
  AUTHORS=a.data||[];WA={};(l.data||[]).forEach(x=>(WA[x.work_id]??=[]).push(x.author_id))}
/* 중복 호출 방지: 이미 받았거나 받는 중이면 그 결과를 같이 쓴다(저장 후 갱신은 기존처럼 loadRefs()를 직접 호출) */
let RFP=null;const ensureRefs=()=>WORKS.length?Promise.resolve():(RFP??=loadRefs().finally(()=>{RFP=null}));
let FRP=null,FRT=0;const getFresh=()=>(FRP&&Date.now()-FRT<3000)?FRP:(FRT=Date.now(),FRP=Promise.resolve(SB.from('v_data_freshness').select('*').order('platform_code')));   /* 홈의 오늘 카드·월 마감 체크리스트가 같은 뷰를 3초 안에 같이 씀 */
async function loadFresh(){const{data}=await SB.from('v_data_freshness').select('*').order('platform_code');
  $('#fresh').innerHTML=(data||[]).slice().sort((a,b)=>{const o=['ridi','kyobo','aladin','yes24','bookcube'],k=c=>{const i=o.indexOf(c);return i<0?99:i};return k(a.platform_code)-k(b.platform_code)}).map(r=>`<tr><td>${esc(pnm(r.platform_name))}</td>
  <td>${r.last_sale_date||(r.last_sale_month?r.last_sale_month.slice(0,7):'-')}</td>
  <td>${r.last_uploaded_at?new Date(r.last_uploaded_at).toLocaleString('ko-KR'):'-'}</td></tr>`).join('')}
