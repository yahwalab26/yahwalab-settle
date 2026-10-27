/* author/statements.js — 작가: 확정된 월별 정산서 열람
   index.html의 <script> 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 작가: 확정된 월별 정산서 열람 ---------- */
// 정산서 파일 이름: 야화랩_{정산월}_{작가필명} (예: 야화랩_202609_마요마요참지마요) — PDF로 저장/인쇄할 때 브라우저가 문서 제목을 파일 이름으로 쓴다
const fname=S=>`야화랩_${String(S.month).replace('-','')}_${(S.pens[0]||'작가').replace(/[\\/:*?"<>|]/g,'')}`;
function printSt(S){const old=document.title;document.title=fname(S);const back=()=>{document.title=old;removeEventListener('afterprint',back)};addEventListener('afterprint',back);print()}
let MY={},TAXR=3.3; /* TAXR: 작가 화면 '예상 실지급액'에 쓰는 원천징수율(%). 우선순위: 설정(app_settings) > 최근 확정 정산서 > 3.3 */
async function loadMyStatements(){const mq=c=>SB.from('settlements').select(c).in('status',['confirmed','sent']).order('period_month',{ascending:false});let q=await mq('id,period_month,payable_amount,author_total,snapshot,sent_at');if(q.error)q=await mq('id,period_month,payable_amount,author_total,snapshot');const{data,error}=q;MY={};(data||[]).forEach(x=>MY[x.id]=x);const tr0=(data||[]).map(x=>x.snapshot?.tax_rate).find(v=>typeof v==='number'&&v>=0&&v<=100);if(tr0!==undefined)TAXR=tr0;const sv=await fetchTaxRate();if(sv!==undefined)TAXR=sv;
  $('#mys').innerHTML=error?`<tr><td colspan="5" class="bad em">정산서를 불러오지 못했습니다.</td></tr>`:(data||[]).map(x=>`<tr><td>${x.period_month.slice(0,7)}</td><td class="r">${won1(x.author_total)}</td><td class="r">${won1(x.payable_amount)}</td><td class="cc hm">${x.sent_at?new Date(Date.parse(x.sent_at)+324e5).toISOString().slice(0,10):'-'}</td><td class="r"><button class="ghost" data-my="${x.id}">정산서 보기</button></td></tr>`).join('')||'<tr><td colspan="5" class="k em">확정된 정산서가 없습니다. 정산 메일 발송일 이후에 확인하실 수 있습니다.</td></tr>'}
$('#mys').onclick=e=>{const b=e.target.closest('[data-my]');if(!b)return;const x=MY[b.dataset.my];if(!x||!x.snapshot)return;
  openLay(stHtml(x.snapshot)+'<div class="row noprint" style="justify-content:flex-end;margin-top:14px"><button class="ghost" id="spr">인쇄 / PDF 저장</button></div>');$('#spr').onclick=()=>printSt(x.snapshot)};

