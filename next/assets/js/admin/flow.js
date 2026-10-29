/* admin/flow.js — 월 마감 체크리스트(입력→검증→확정·발송→세무): 정산 3개 화면 위에 '지금 할 일'과 문제 항목을 실제 데이터로 보여 주고 바로 이동시킨다(읽기 전용) */
const FLOW_PG=['upload','settle','tax'];
let FLOWT=null,FLOWS=null,FLOWM='',FLOWOPEN=true;
const flowMonth=()=>{const el=$('#sm');let m=el&&el.value;if(!/^\d{4}-\d{2}$/.test(m||'')){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}return m};
const flowPage=()=>FLOW_PG.find(p=>!$('#pg-'+p).hidden)||null;
const fmd=s=>String(s).slice(5,10).replace('-','/');
function flowSteps(pg,s,m){
  const names=(a,max,hint)=>a.slice(0,max).map(x=>`<button type="button" class="lnk" data-w="${x.id}">${esc(x.title)}</button>`).join(', ')+(a.length>max?` 외 ${a.length-max}개`:'');
  if(!s)return[1,2,3,4].map((i)=>({st:'wait',t:['데이터 입력','검증','확정·발송','세무'][i-1],d:'확인 중…'}));
  const lagOk=!s.lag.length,unl=s.unl.length,zr=s.zero,chkOk=!unl&&zr&&!zr.length,sendOk=s.tot>0&&s.cf>=s.tot&&s.sn>=s.tot;
  return[
    {st:lagOk?'ok':'warn',t:'데이터 입력',d:lagOk?`모든 플랫폼의 판매 데이터가 ${fmd(s.end)}까지 들어왔습니다.`:`${s.lag.map(x=>esc(x.n)+' '+(x.d?fmd(x.d)+'까지':'날짜 없음')).join(' · ')} — 기준월 말일(${fmd(s.end)})까지 들어오지 않았습니다.`,
      a:pg==='upload'?'':'<button type="button" data-hash="#/upload">데이터 입력하러 가기</button>'},
    {st:chkOk?'ok':'warn',t:'검증',d:chkOk?'필명이 연결되지 않은 작품과 판매 0건 작품이 없습니다.':'아래 작품을 눌러 확인하세요. 작품 편집 화면이 열립니다.',
      x:(unl?`<p><b>필명 미연결 ${unl}개</b> · ${names(s.unl,6)}<br><span class="k">작가 탭에서 필명을 작품에 연결해야 정산서에 반영됩니다.</span></p>`:'')+(zr&&zr.length?`<p><b>판매 0건 ${zr.length}개</b> · ${names(zr,6)}<br><span class="k">데이터 입력이 빠졌는지 확인하세요. (출간 전 작품은 제외)</span></p>`:'')+(!zr?'<p><b>판매 0건 확인 실패</b> · 잠시 뒤 다시 시도해 주세요.</p>':'')},
    {st:sendOk?'ok':'todo',t:'확정·발송',d:s.tot?`확정 ${s.cf}/${s.tot}명 · 발송 ${s.sn}/${s.tot}명`:(s.rows?`확정 ${s.cf}명 · 발송 ${s.sn}명`:'아직 확정한 정산서가 없습니다.')+' 월 정산서에서 금액과 비율을 확인한 뒤 확정·발송합니다.',
      a:'<button type="button" data-go="dng">정산서 확인하고 확정하기</button>'},
    {st:'todo',t:'세무',d:'정산을 확정한 뒤 원천징수·신고 자료를 확인합니다.',a:pg==='tax'?'':'<button type="button" data-hash="#/tax">세무 열기</button>'}]}
function flowDraw(){const box=$('#flow'),pg=flowPage();if(!box)return;box.hidden=!pg;if(!pg)return;
  const m=flowMonth(),s=FLOWS&&FLOWM===m?FLOWS:null,S=flowSteps(pg,s,m),
    cur=s?S.findIndex(x=>x.st!=='ok'):-1,warn=s?S.slice(0,3).filter(x=>x.st==='warn').length:0,
    lab={ok:'완료',warn:'확인 필요',todo:'대기',wait:'확인 중'},ic={ok:'✓',warn:'!',todo:'○',wait:'…'};
  box.innerHTML=`<section class="fl" aria-label="월 마감 체크리스트"><div class="flh"><div><b>${esc(m.slice(0,4))}년 ${+m.slice(5)}월 정산 마감</b><span class="k"> ${s?(warn?`· 확인 필요 ${warn}건`:'· 준비 완료'):'· 확인 중…'}</span></div><button type="button" class="ghost" data-tog="1" aria-expanded="${FLOWOPEN}">${FLOWOPEN?'접기':'펴기'}</button></div>
  ${FLOWOPEN?`<ol class="flr">${S.map((x,i)=>`<li class="${x.st}${i===cur?' now':''}"><span class="fic" aria-hidden="true">${ic[x.st]}</span><div class="fbd"><div class="ft"><b>${i+1}. ${x.t}</b><span class="ftag ${x.st}">${lab[x.st]}</span>${i===cur?'<span class="ftag now">지금 할 일</span>':''}</div><p class="fd">${x.d}</p>${x.x||''}</div>${x.a?`<div class="fa">${x.a}</div>`:''}</li>`).join('')}</ol>`:''}</section>`}
async function flowLoad(){const pg=flowPage();if(!pg)return;const m=flowMonth(),mm=m+'-01',last=new Date(+m.slice(0,4),+m.slice(5,7),0),end=m+'-'+String(last.getDate()).padStart(2,'0');
  try{if(!WORKS.length)await loadRefs();
    const[f,t,sr,wr]=await Promise.all([SB.from('v_data_freshness').select('platform_code,platform_name,last_sale_date,last_sale_month'),SB.from('settlements').select('person_id,status,sent_at').eq('period_month',mm),SB.rpc('admin_statement',{p_month:mm}),SB.from('works').select('id,title,release_date')]);
    const qe=f.error||t.error;if(qe)throw qe;
    const lag=(f.data||[]).filter(r=>{const d=r.last_sale_date?String(r.last_sale_date).slice(0,10):'',mo=r.last_sale_month?String(r.last_sale_month).slice(0,7):'';return d?d<end:(mo?mo<m:true)}).map(r=>({n:pnm(r.platform_name),d:r.last_sale_date?String(r.last_sale_date).slice(0,10):''})),
      unl=WORKS.filter(w=>!(WA[w.id]||[]).length).map(w=>({id:w.id,title:w.title})),sold=new Set((sr.data||[]).filter(r=>Number(r.quantity)>0).map(r=>r.work_id)),
      zero=sr.error||wr.error?null:(wr.data||[]).filter(w=>(WA[w.id]||[]).length&&(!w.release_date||String(w.release_date).slice(0,10)<=end)&&!sold.has(w.id)).map(w=>({id:w.id,title:w.title})),
      rows=t.data||[];
    FLOWS={lag,unl,zero,end,rows:rows.length,cf:rows.filter(x=>x.status!=='draft').length,sn:rows.filter(x=>x.sent_at).length,tot:typeof ST!=='undefined'&&ST.length?new Set(ST.map(r=>r.person_id)).size:0};FLOWM=m;
  }catch(e){dbg('월 마감 진행',e);FLOWS={lag:[],unl:[],zero:null,end,rows:0,cf:0,sn:0,tot:0};FLOWM=m}
  flowDraw()}
const flowSoon=()=>{flowDraw();clearTimeout(FLOWT);FLOWT=setTimeout(flowLoad,250)};
FLOW_PG.forEach(p=>new MutationObserver(flowSoon).observe($('#pg-'+p),{attributes:true,attributeFilter:['hidden']}));
['#sl','#fresh'].forEach(q=>{const el=$(q);if(el)new MutationObserver(()=>{clearTimeout(FLOWT);FLOWT=setTimeout(flowLoad,600)}).observe(el,{childList:true})});
document.addEventListener('change',e=>{if(e.target.id==='sm')flowSoon()});
$('#flow').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.tog){FLOWOPEN=!FLOWOPEN;flowDraw();return}
  if(d.hash){location.hash=d.hash;return}
  if(d.w){goWork(d.w);return}
  if(d.go){const go=()=>{const t=$('#'+d.go);if(t)t.scrollIntoView({behavior:'smooth',block:'start'})};if(location.hash==='#/settle')go();else{location.hash='#/settle';setTimeout(go,500)}}};
flowSoon();
