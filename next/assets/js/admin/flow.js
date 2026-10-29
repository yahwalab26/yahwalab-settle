/* admin/flow.js — 월 마감 진행 표시줄(입력→검증→확정·발송→세무): 정산 3개 화면 위에 보이고 각 단계 상태를 실제 데이터로 알려 준다(읽기 전용) */
const FLOW_PG=['upload','settle','tax'],FLOW_CUR={upload:1,settle:2,tax:4};
let FLOWT=null,FLOWS={};
const flowMonth=()=>{const el=$('#sm');let m=el&&el.value;if(!m){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}return m};
const flowPage=()=>FLOW_PG.find(p=>!$('#pg-'+p).hidden)||null;
function flowDraw(){const box=$('#flow'),pg=flowPage();if(!box)return;box.hidden=!pg;if(!pg)return;
  const m=flowMonth(),s=FLOWS,
  st=(t,c)=>t?`<span class="fst ${c||''}">${esc(t)}</span>`:'<span class="fst"></span>',
  S=[['데이터 입력','#/upload',s.input,s.inputC],['검증','#/settle',s.check,s.checkC],['확정·발송','#/settle',s.send,s.sendC,'dng'],['세무','#/tax','신고 자료 확인','']];
  box.innerHTML=`<nav aria-label="월 마감 진행"><p class="k fmo">${esc(m.replace('-','년 '))}월 정산 마감</p><ol class="flow">${S.map((x,i)=>`<li${i+1===FLOW_CUR[pg]?' aria-current="step"':''}><a href="${x[1]}"${x[4]?` data-go="${x[4]}"`:''} class="${i+1===FLOW_CUR[pg]?'on':''}"><b>${i+1}</b><span class="fn">${x[0]}</span>${st(x[2],x[3])}</a></li>`).join('')}</ol>${s.detail&&pg!=='tax'?`<p class="k fdt">${esc(s.detail)}</p>`:''}</nav>`}
async function flowLoad(){const pg=flowPage();if(!pg)return;const m=flowMonth(),mm=m+'-01',last=new Date(+m.slice(0,4),+m.slice(5,7),0),end=m+'-'+String(last.getDate()).padStart(2,'0');
  try{if(!WORKS.length)await loadRefs();
    const[f,t,sr,wr]=await Promise.all([SB.from('v_data_freshness').select('platform_code,platform_name,last_sale_date,last_sale_month'),SB.from('settlements').select('person_id,status,sent_at').eq('period_month',mm),SB.rpc('admin_statement',{p_month:mm}),SB.from('works').select('id,title,release_date')]);
    const lag=(f.data||[]).filter(r=>{const d=r.last_sale_date?String(r.last_sale_date).slice(0,10):'',mo=r.last_sale_month?String(r.last_sale_month).slice(0,7):'';return d?d<end:(mo?mo<m:true)}).map(r=>pnm(r.platform_name));
    FLOWS.input=lag.length?lag.join('·')+' 미반영':'모든 플랫폼 최신';FLOWS.inputC=lag.length?'bad':'ok';
    const un=WORKS.filter(w=>!(WA[w.id]||[]).length).length,sold=new Set((sr.data||[]).filter(r=>Number(r.quantity)>0).map(r=>r.work_id)),
      zero=sr.error||wr.error?null:(wr.data||[]).filter(w=>(WA[w.id]||[]).length&&(!w.release_date||String(w.release_date).slice(0,10)<=end)&&!sold.has(w.id)).map(w=>w.title),
      pt=[];if(un)pt.push(`필명 미연결 ${un}개`);if(zero&&zero.length)pt.push(`판매 0건 ${zero.length}개`);if(!zero)pt.push('판매 확인 실패');
    FLOWS.check=pt.length?pt.join(' · '):'이상 없음';FLOWS.checkC=pt.length?'bad':'ok';FLOWS.detail=zero&&zero.length?'판매 0건 작품: '+zero.slice(0,8).join(', ')+(zero.length>8?` 외 ${zero.length-8}개`:'')+' (출간일 이후·작가 연결된 작품만, 정말 0건인지 데이터 입력을 확인하세요)':'';
    const rows=t.data||[],cf=rows.filter(x=>x.status!=='draft').length,sn=rows.filter(x=>x.sent_at).length,tot=typeof ST!=='undefined'&&ST.length?new Set(ST.map(r=>r.person_id)).size:0;
    FLOWS.send=rows.length?`확정 ${cf}${tot?'/'+tot:''}명 · 발송 ${sn}명`:(tot?`미확정 ${tot}명`:'미확정');FLOWS.sendC=tot&&cf>=tot&&sn>=tot?'ok':'';
  }catch(e){dbg('월 마감 진행',e)}
  flowDraw()}
const flowSoon=()=>{flowDraw();clearTimeout(FLOWT);FLOWT=setTimeout(flowLoad,250)};
FLOW_PG.forEach(p=>new MutationObserver(flowSoon).observe($('#pg-'+p),{attributes:true,attributeFilter:['hidden']}));
['#sl','#fresh'].forEach(q=>{const el=$(q);if(el)new MutationObserver(()=>{clearTimeout(FLOWT);FLOWT=setTimeout(flowLoad,600)}).observe(el,{childList:true})});
document.addEventListener('change',e=>{if(e.target.id==='sm')flowSoon()});
$('#flow').onclick=e=>{const a=e.target.closest('[data-go]');if(a&&location.hash==='#/settle')setTimeout(()=>{const t=$('#'+a.dataset.go);if(t)t.scrollIntoView({behavior:'smooth',block:'start'})},30)};
