/* admin/overview.js — 통계 요약(읽기 전용): 한 달의 매출·방문·클릭을 한 화면에. 숫자는 판매 현황·방문자 화면과 같은 조회(admin_detail·admin_sales_rows·cf-stats·site_event_counts)로 계산 */
let OVT=0;
const ovCard=(t,v,s,go)=>`<div class="card" style="flex:1 1 200px;margin:0;text-align:left"><div class="k">${t}</div><div style="font-size:22px;font-weight:700">${v}</div>${s?`<div class="k" style="font-size:12px">${s}</div>`:''}${go?`<a class="k" href="${go[0]}" style="font-size:12px;text-decoration:underline;text-underline-offset:3px">${go[1]}</a>`:''}</div>`;
async function loadOverview(){const el=$('#ovb'),inp=$('#om');if(!inp.value)inp.value=iso(kst()).slice(0,7);const m=inp.value,my=++OVT;
  el.innerHTML='<p class="k">불러오는 중…</p>';
  const y=+m.slice(0,4),mo=+m.slice(5,7),last=iso(new Date(Date.UTC(y,mo,0))),td=iso(kst()),f=m+'-01'<VSTART?VSTART:m+'-01',to=last>td?td:last;
  const[d,s,c,v]=await Promise.all([SB.rpc('admin_detail',{p_month:m+'-01'}),SB.rpc('admin_sales_rows',{p_month:m+'-01'}),
    SB.from('site_event_counts').select('n').eq('event','submit').gte('day',f).lte('day',to).limit(5000),
    f<=to?SB.functions.invoke('cf-stats',{body:{from:f,to}}):Promise.resolve({data:null})]);
  if(my!==OVT)return;
  const er=d.error||s.error;if(er){el.innerHTML='<p class="bad">'+esc(er.message)+'</p>';return}
  const D=d.data||[],S=s.data||[],net=sum(D,'net'),au=sum(D,'author_amt'),qty=sum(S,'quantity'),
    cn=c.error?'-':vcnt((c.data||[]).reduce((a,x)=>a+x.n,0)),T=(v.data&&!v.data.error)?(v.data.total||{visits:(v.data.daily||[]).reduce((a,x)=>a+x.visits,0),views:(v.data.daily||[]).reduce((a,x)=>a+x.views,0)}):null,
    nov=f>to?'이 달은 방문 집계 시작일('+VSTART.replace(/-/g,'.')+') 이전입니다':'방문 통계를 불러오지 못했습니다';
  el.innerHTML=`<h3 class="ovh">매출</h3><div class="row" style="gap:12px;align-items:stretch">${ovCard('야화랩 전체 정산액',won(net),'모든 임프린트 포함',['#/home','판매 현황에서 자세히'])}${ovCard('내 순수 매출',won(net-au),'정산액 − 작가 몫')}${ovCard('판매 수량',vcnt(qty)+'건',D.length?'':'이 달의 데이터가 없습니다')}</div>
  <h3 class="ovh">홈페이지</h3><div class="row" style="gap:12px;align-items:stretch">${ovCard('방문',T?vcnt(T.visits):'-',T?'':nov,['#/visit','방문자에서 자세히'])}${ovCard('페이지뷰',T?vcnt(T.views):'-','')}${ovCard('투고 버튼 클릭',cn,'')}</div>
  <p class="k" style="font-size:12px;margin:14px 0 0">읽기 전용 요약입니다. 숫자는 판매 현황·방문자 화면과 같은 기준입니다(방문·클릭은 ${f.replace(/-/g,'.')} ~ ${to.replace(/-/g,'.')}).</p>`}
$('#om').onchange=loadOverview;
