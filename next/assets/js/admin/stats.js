/* admin/stats.js — 현황(정산 현황·작품별 판매 상세)
   index.html의 <script> 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 현황 ---------- */
let DD=[],DP='all';const COL={'야화랩':'#111','트루비':'#e8b23c','미지정':'#bdbdbd'},PL={all:'전체',ridi:'리디북스',kyobo:'교보문고',aladin:'알라딘',yes24:'예스24',bookcube:'북큐브'};
const man=n=>n>=1e4?(n/1e4).toFixed(1)+'만':Math.round(n).toLocaleString('ko-KR'),sum=(a,k)=>a.reduce((t,r)=>t+Number(r[k]),0);
let WR=[],DY=[],CT=[],LV='야화랩',SALES=[];const vis=l=>LV==='야화랩'||l==='트루비';
async function loadHome(ev){const m=$('#dm');monVal('#dm');const t=kst(),mon=iso(addD(t,-((t.getUTCDay()+6)%7)));
  const[w,d,y,sr,c]=await Promise.all([SB.rpc('admin_weekly',{p_weeks:8}),SB.rpc('admin_detail',{p_month:m.value+'-01'}),SB.rpc('admin_daily',{p_from:mon,p_to:iso(t)}),SB.rpc('admin_sales_rows',{p_month:m.value+'-01'}),SB.from('contracts').select('id,work_id,platform_code,author_rate,effective_from,effective_to,kind,note')]);
  const er=w.error||d.error||y.error;if(er){reportErr('현황 조회',er.message);return}
  DD=d.data||[];WR=w.data||[];DY=y.data||[];SALES=sr.data||[];CT=c.data||[];drawWeekly();drawWeek();drawDetail();drawRenew();if(!(ev&&ev.type==='change'))loadYear();else drawYear()}
function drawWeekly(){const R=WR.filter(r=>vis(r.label)),W=[...new Set(R.map(r=>r.week_start))].sort(),by={};R.forEach(r=>{(by[r.week_start]??={})[r.label]=Number(r.net)});
  if(!W.length){$('#wk').innerHTML='<p class="k" style="margin:0">표시할 주간 데이터가 없습니다.</p>';return}
  const tot=w=>Object.values(by[w]).reduce((a,b)=>a+b,0),max=Math.max(...W.map(tot),1);
  $('#wk').innerHTML=`<div style="display:flex;align-items:flex-end;gap:8px;height:190px">${W.map(w=>{const t=tot(w);return `<div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%" title="${w} 주 · ${won(t)}"><div class="k" style="text-align:center;font-size:11px;margin-bottom:3px">${t?man(t):''}</div><div style="height:${Math.max(t/max*150,t?2:0)}px;display:flex;flex-direction:column-reverse">${Object.keys(COL).filter(l=>by[w][l]).map(l=>`<div style="height:${by[w][l]/t*100}%;background:${COL[l]}" title="${l} ${won(by[w][l])}"></div>`).join('')}</div></div>`}).join('')}</div>
  <div style="display:flex;gap:8px;margin-top:6px">${W.map(w=>`<div class="k" style="flex:1;min-width:0;text-align:center;font-size:11px">${w.slice(5).replace('-','/')}</div>`).join('')}</div>
  <div class="row k" style="margin-top:12px;font-size:12px">${Object.entries(COL).filter(([l])=>vis(l)).map(([l,c])=>`<span><i style="display:inline-block;width:10px;height:10px;background:${c};margin-right:5px"></i>${l}</span>`).join('')}</div>
  <p class="k" style="font-size:12px;margin:8px 0 0">각 주(월요일 시작)의 정산액입니다.</p>`}
function drawWeek(){const t=kst(),mon=addD(t,-((t.getUTCDay()+6)%7)),today=iso(t),days=[0,1,2,3,4,5,6].map(i=>{const d=iso(addD(mon,i));return{l:'월화수목금토일'[i],f:d>today,v:DY.filter(r=>r.sale_date===d&&vis(r.label)).reduce((a,r)=>a+Number(r.net),0)}});
  const tot=days.reduce((a,x)=>a+x.v,0),lw=WR.filter(r=>r.week_start===iso(addD(mon,-7))&&vis(r.label)).reduce((a,r)=>a+Number(r.net),0),mx=Math.max(...days.map(x=>x.v),1);
  $('#tw').innerHTML=`<div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="k">이번 주 정산액 (월~오늘)</div><div style="font-size:22px;font-weight:700">${won(tot)}</div></div><div class="k" style="text-align:right">지난주 전체<br><b style="color:var(--ink)">${won(lw)}</b></div></div>
  <div style="display:flex;gap:8px;align-items:flex-end;height:120px;margin-top:14px">${days.map(x=>`<div style="flex:1;min-width:0;text-align:center"><div class="k" style="font-size:11px">${x.f?'':man(x.v)}</div><div style="height:${x.f?0:Math.max(x.v/mx*70,x.v?2:0)}px;background:var(--ink);margin:2px 0"></div><div class="k" style="font-size:12px">${x.l}</div></div>`).join('')}</div>
  <p class="k" style="font-size:12px;margin:8px 0 0">전일 분까지 업로드된 데이터 기준입니다.</p>`}
function drawDetail(){const base=DD.filter(r=>vis(r.label)),rows=base.filter(r=>DP==='all'||r.platform_code===DP),LB={};rows.forEach(r=>LB[r.label]=(LB[r.label]||0)+Number(r.net));
  const tot=sum(rows,'net'),card=(t,v,s)=>`<div class="card" style="flex:1 1 200px;margin:0"><div class="k">${t}</div><div style="font-size:22px;font-weight:700">${won(v)}</div>${s?`<div class="k" style="font-size:12px">${s}</div>`:''}</div>`;
  const aut=sum(rows,'author_amt'),nr=sum(rows,'no_rate'),pure=card('내 순수 매출 (작가 몫 제외)',tot-aut,`정산액 − 작가 몫${nr?` · 계약 비율 미설정 ${nr}건은 작가 몫 0원으로 계산`:''}`);
  $('#lv').innerHTML=['야화랩','트루비'].map(l=>`<button type="button" class="chp" data-lv="${l}" aria-pressed="${l===LV}">${l==='야화랩'?'야화랩 (전체)':'트루비 (임프린트)'}</button>`).join('');
  $('#lc').innerHTML=(LV==='야화랩'?card('야화랩 전체 정산액',tot,'모든 임프린트 포함')+card('야화랩 직접 출간',LB['야화랩']||0)+card('트루비 (임프린트)',LB['트루비']||0)+(rows.some(r=>r.label==='미지정')?card('레이블 미지정',LB['미지정']||0,'작품 상세에서 지정하세요'):''):card('트루비 정산액',tot,'임프린트'))+pure;
  $('#pc').innerHTML=Object.entries(PL).map(([k,t])=>`<button type="button" data-p="${k}" aria-pressed="${k===DP}">${t} · ${won(sum(k==='all'?base:base.filter(r=>r.platform_code===k),'net'))}</button>`).join('');
  const SR=SALES.filter(r=>vis(r.label)&&(DP==='all'||r.platform_code===DP));
  $('#dt').innerHTML=SR.map(r=>`<tr><td class="cc">${r.sale_date||(r.sale_month||'').slice(0,7)+' 월'}</td><td class="cc">${PN[r.platform_code]||r.platform_code}</td><td>${esc(r.title)}</td><td class="r">${r.quantity}</td><td class="r">${won(r.gross)}</td><td class="r">${won(r.net)}</td><td class="r">${won(r.author_amt)}</td></tr>`).join('')||'<tr><td colspan="7" class="k em">이 달의 데이터가 없습니다.</td></tr>';
  $('#dtf').innerHTML=SR.length?`<tr><td colspan="3"><b>합계</b></td><td class="r"><b>${sum(SR,'quantity')}</b></td><td class="r"><b>${won(sum(SR,'gross'))}</b></td><td class="r"><b>${won(sum(SR,'net'))}</b></td><td class="r"><b>${won(sum(SR,'author_amt'))}</b></td></tr>`:'';
  const miss=sum(rows,'missing');$('#dn').textContent=miss?`정산율이 설정되지 않아 금액이 계산되지 않은 ${miss}건이 있습니다. (교보문고는 정산율 설정 필요)`:'';
  const W={};base.forEach(r=>{const o=W[r.work_id]??={t:r.title,l:r.label,q:0,n:0};o.q+=Number(r.quantity);o.n+=Number(r.net)});
  $('#wl').innerHTML=Object.entries(W).sort((a,b)=>b[1].n-a[1].n).map(([id,o])=>`<tr><td><button class="lnk" data-w="${id}">${esc(o.t)}</button></td><td class="hm">${o.l}</td><td class="r">${o.q}</td><td class="r">${won(o.n)}</td><td class="r hm">${rateTxt(id)}</td><td class="hm">${renewTxt(id)}</td></tr>`).join('')||'<tr><td colspan="6" class="k em">이 달의 데이터가 없습니다.</td></tr>'}
/* 월별 정산액: '최근 12개월' 또는 연도(1~12월). 월별 집계 함수가 없어 admin_detail을 월마다 불러 합산(이번 달 이후는 조회 안 함). 월 선택을 바꿀 때는 다시 불러오지 않음 */
let YR=[],YMODE='',YRT=0;const YEAR0=2025;
async function loadYear(mode){const el=$('#yr'),t=kst(),cy=t.getUTCFullYear(),pad=n=>String(n).padStart(2,'0'),now=cy+'-'+pad(t.getUTCMonth()+1);
  if(mode)YMODE=mode;if(!YMODE)YMODE=String(cy);
  const ms=[];if(YMODE==='r12'){for(let i=11;i>=0;i--){const d=new Date(Date.UTC(cy,t.getUTCMonth()-i,1));ms.push(d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1))}}else{for(let k=1;k<=12;k++)ms.push(YMODE+'-'+pad(k))}
  const my=++YRT,live=ms.filter(m=>m<=now);el.style.opacity='.5';
  const rs=await Promise.all(live.map(m=>SB.rpc('admin_detail',{p_month:m+'-01'})));
  if(my!==YRT)return;el.style.opacity='';
  const bad=rs.find(r=>r.error);
  if(bad){reportErr('월별 정산액 조회',bad.error.message);el.innerHTML='<p class="k" style="margin:0">불러오지 못했습니다. 새로고침해 주세요.</p>';return}
  const mp=Object.fromEntries(live.map((m,i)=>[m,rs[i].data||[]]));
  YR=ms.map(m=>({m,rows:mp[m]||[],future:m>now}));drawYear()}
function drawYear(){if(!YR.length)return;
  const cy=kst().getUTCFullYear(),T=YR.map(o=>{const by={};o.rows.filter(r=>vis(r.label)).forEach(r=>{by[r.label]=(by[r.label]||0)+Number(r.net)});return{m:o.m,f:o.future,t:Object.values(by).reduce((a,b)=>a+b,0)}}),
    max=Math.max(...T.map(x=>x.t),1),all=T.reduce((a,x)=>a+x.t,0),n=Math.max(T.filter(x=>!x.f).length,1),pm=$('#dm').value,modes=[['r12','최근 12개월']];
  for(let y=cy;y>=YEAR0;y--)modes.push([String(y),y+'년']);
  /* 월 리스트: 월 · 비율 선(검정 한 가지) · 금액. 스크롤 없이 위에서 아래로 */
  $('#yr').innerHTML=`<div class="row" style="justify-content:flex-start;gap:8px;margin:0 0 12px">${modes.map(([k,t])=>`<button type="button" class="chp" data-ymode="${k}" aria-pressed="${k===YMODE}">${t}</button>`).join('')}</div>
  <div class="row k" style="justify-content:space-between;margin:0 0 6px"><span>${YMODE==='r12'?'12개월':YMODE+'년'} 합계 <b style="color:var(--ink)">${won(all)}</b></span><span>월 평균 <b style="color:var(--ink)">${won(Math.round(all/n))}</b></span></div>
  <div style="border-bottom:1px solid var(--line)">${T.map(x=>{const mm=+x.m.slice(5),lb=YMODE==='r12'?x.m.slice(2,4)+'.'+x.m.slice(5):mm+'월',sel=x.m===pm,w=x.t?Math.max(x.t/max*100,1.5):0;
    return `<div ${x.f?'':`data-ym="${x.m}" role="button" tabindex="0" title="${x.m} 월 선택"`} style="display:grid;grid-template-columns:52px 1fr 108px;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line);${x.f?'opacity:.4':'cursor:pointer'}"><span class="k" style="font-size:13px;${sel?'color:var(--ink);font-weight:700;text-decoration:underline;text-underline-offset:4px':''}">${lb}</span><span style="height:6px;background:var(--line);position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:${w}%;background:var(--ink)"></i></span><span style="text-align:right;font-size:15px;font-weight:700">${x.f?'–':won(x.t)}</span></div>`}).join('')}</div>
  <p class="k" style="font-size:12px;margin:8px 0 0">월 단위 정산액입니다. 행을 누르면 위 월 선택이 그 달로 바뀝니다.</p>`}
const yrPick=e=>{const c=e.target.closest('[data-ymode]');if(c){loadYear(c.dataset.ymode);return}const b=e.target.closest('[data-ym]');if(!b)return;$('#dm').value=b.dataset.ym;$('#dm').dispatchEvent(new Event('change'));scrollTo({top:0,behavior:'smooth'})};
$('#yr').onclick=yrPick;$('#yr').onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-ym]')){e.preventDefault();yrPick(e)}};
$('#dm').onchange=loadHome;
$('#lv').onclick=e=>{const b=e.target.closest('[data-lv]');if(b){LV=b.dataset.lv;drawWeekly();drawWeek();drawDetail();drawYear()}};
$('#wl').onclick=e=>{const b=e.target.closest('[data-w]');if(b)openWork(b.dataset.w)};

