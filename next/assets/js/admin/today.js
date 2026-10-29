/* admin/today.js — 홈(오늘): 지금 할 일(월 마감 체크리스트는 flow.js)·플랫폼별 최신 데이터·다음 자동 발송일. 읽기 전용 */
let TDT=0;
const tdDays=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/864e5);
function tdNextSend(today){ /* 매월 25일, 주말이면 직전 평일(공휴일은 반영하지 않음) */
  const y=+today.slice(0,4),mo=+today.slice(5,7),pick=(yy,mm)=>{const d=new Date(Date.UTC(yy,mm-1,25));while([0,6].includes(d.getUTCDay()))d.setUTCDate(d.getUTCDate()-1);return iso(d)};
  let s=pick(y,mo);if(s<today)s=mo===12?pick(y+1,1):pick(y,mo+1);return s}
async function loadToday(){const el=$('#tdb'),my=++TDT,t=kst(),today=iso(t),W='일월화수목금토'[t.getUTCDay()];
  $('#tdd').textContent=`${t.getUTCMonth()+1}월 ${t.getUTCDate()}일 (${W})`;
  const tm=$('#tm');tm.value=flowMonth();
  el.innerHTML='<p class="k">불러오는 중…</p>';
  const[f,a]=await Promise.all([SB.from('v_data_freshness').select('*').order('platform_code'),SB.from('app_settings').select('value').eq('key','auto_mail_enabled').maybeSingle()]);
  if(my!==TDT)return;
  const o=['ridi','kyobo','aladin','yes24','bookcube'],k=c=>{const i=o.indexOf(c);return i<0?99:i},
    rows=(f.data||[]).slice().sort((x,y)=>k(x.platform_code)-k(y.platform_code)).map(r=>{const d=r.last_sale_date?String(r.last_sale_date).slice(0,10):'',n=d?tdDays(d,today):null,
      tag=n==null?['확인 필요','warn','판매일 없음']:n<=3?['최신','ok',n<=1?'어제까지':n+'일 전까지']:['지연','warn',n+'일 전까지'];
      return `<li class="${tag[1]}"><span class="fic" aria-hidden="true">${tag[1]==='ok'?'✓':'!'}</span><div class="fbd"><div class="ft"><b>${esc(pnm(r.platform_name))}</b><span class="ftag ${tag[1]}">${tag[0]}</span></div><p class="fd">${d?d.slice(5).replace('-','/')+' 판매분까지 ('+tag[2]+')':'마지막 판매일 정보가 없습니다.'}${r.last_uploaded_at?' · 마지막 업로드 '+new Date(r.last_uploaded_at).toLocaleDateString('ko-KR'):''}</p></div></li>`}).join(''),
    nx=tdNextSend(today),dn=tdDays(today,nx),on=a.data&&a.data.value===true;
  el.innerHTML=`<div class="card" style="text-align:left"><b>플랫폼별 최신 판매 데이터</b><p class="k" style="margin:4px 0 0;font-size:12.5px">오늘 기준 3일 이내면 최신으로 봅니다(플랫폼 반영 지연 감안).</p>
    <ol class="flr" style="margin-top:8px">${rows||'<li><span></span><div class="fbd"><p class="fd">데이터 현황을 불러오지 못했습니다.</p></div></li>'}</ol>
    <div class="row" style="justify-content:flex-start;margin-top:10px"><button type="button" class="ghost" data-tg="#/upload">데이터 입력하러 가기</button></div></div>
  <div class="card" style="text-align:left"><b>다음 정산서 자동 발송</b>
    <p style="margin:8px 0 0;font-size:20px;font-weight:700">${nx.slice(5,7)}/${nx.slice(8)} <span class="k" style="font-size:13px;font-weight:400">${dn===0?'오늘':dn+'일 후'}</span></p>
    <p class="k" style="margin:4px 0 0;font-size:12.5px">자동 발송 <b>${a.error?'확인 실패':on?'켜짐':'꺼짐'}</b> · 매월 25일(주말이면 직전 평일, 공휴일은 반영되지 않았으니 월 정산서에서 확인) · 확정된 정산서 중 미발송 건만 발송됩니다.</p>
    <div class="row" style="justify-content:flex-start;margin-top:10px"><button type="button" class="ghost" data-tg="#/settle">월 정산서 열기</button></div></div>
  <div class="row" style="justify-content:flex-start;gap:8px;margin-top:4px"><button type="button" class="ghost" data-tg="#/overview">통계 요약</button><button type="button" class="ghost" data-tg="#/books">작품</button><button type="button" class="ghost" data-tg="#/authors">작가</button><button type="button" class="ghost" data-tg="#/mail">메일 작성</button></div>`}
$('#pg-today').onclick=e=>{const b=e.target.closest('[data-tg]');if(b)location.hash=b.dataset.tg};
$('#tm').onchange=e=>{if(!/^\d{4}-\d{2}$/.test(e.target.value))return;$('#sm').value=e.target.value;flowSoon()};
