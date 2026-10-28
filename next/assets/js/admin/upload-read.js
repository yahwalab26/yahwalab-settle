/* admin/upload-read.js — 파일 읽기(엑셀·CSV 해석)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 파일 읽기 ---------- */
function parseCSV(t){const R=[];let r=[],f='',i=0,n=t.length;
  while(i<n){
    if(t[i]=='"'){i++;f='';while(i<n){if(t[i]=='"'){if(t[i+1]=='"'){f+='"';i+=2}else{i++;break}}else f+=t[i++]}}
    else{f='';while(i<n&&t[i]!=','&&t[i]!='\n'&&t[i]!='\r')f+=t[i++]}
    r.push(f);
    if(t[i]==','){i++;if(i>=n||t[i]=='\n'||t[i]=='\r')r.push('');continue}
    if(t[i]=='\r')i++;if(t[i]=='\n')i++;R.push(r);r=[]}
  if(r.length)R.push(r);return R}
const decode=b=>{try{return new TextDecoder('utf-8',{fatal:true}).decode(b).replace(/^\uFEFF/,'')}catch{return new TextDecoder('euc-kr').decode(b)}};
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');

const num=v=>{const s=c(v).replace(/,/g,'');if(s==='')return null;const n=Number(s);if(isNaN(n))throw `숫자가 아님: ${s}`;return Math.round(n)};
const tt=v=>{const s=c(v),m=s.match(/^=T\("([\s\S]*)"\)$/);return m?m[1].replace(/""/g,'"'):s};   // 리디북스 파일의 =T("…") 텍스트 보호 표기 풀기
const isbn=v=>c(v).replace(/^=T\("?/,'').replace(/"?\)$/,'').replace(/\.0$/,'');
function dt(v){let y,mo,d,h=0,mi=0,s=0;
  if(typeof v==='number'){const D=new Date(Math.round((v-25569)*864e5));[y,mo,d,h,mi,s]=[D.getUTCFullYear(),D.getUTCMonth()+1,D.getUTCDate(),D.getUTCHours(),D.getUTCMinutes(),D.getUTCSeconds()]}
  else{const m=c(v).match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);if(!m)throw `날짜 형식 오류: ${c(v)}`;
    [y,mo,d]=[+m[1],+m[2],+m[3]];h=+(m[4]||0);mi=+(m[5]||0);s=+(m[6]||0)}
  const p=x=>String(x).padStart(2,'0'),date=`${y}-${p(mo)}-${p(d)}`;
  return{ts:`${date}T${p(h)}:${p(mi)}:${p(s)}+09:00`,date,month:`${y}-${p(mo)}-01`}}

function detect(rows){for(let i=0;i<Math.min(rows.length,10);i++){const h=rows[i].map(c);
  if(h.includes('기준일')&&h.includes('도서 ID')&&h.includes('판매액')&&h.includes('정산액'))return['ridi',i];     // 리디북스 판매내역조회(일·도서별 집계)
  if(h.includes('판매/취소일시')&&h.includes('ItemId'))return['aladin',i];
  if(h.includes('출판사정산액')&&h.includes('판매서점'))return['yes24',i];
  if(h.includes('정산대상금액')&&h.includes('판매유형')&&h.includes('판매처'))return['bookcube',i];
  if(h.includes('판매기간')&&h.includes('판매금액'))return['kyobo',i]}return[null,0]}

function parse(rows,p,hi){
  const h=rows[hi].map(c),g=(r,k)=>r[h.indexOf(k)],L=[],E=[];let total=null;
  rows.slice(hi+1).forEach((r,n)=>{
    if(!r.some(x=>c(x)!==''))return;
    const raw={};h.forEach((k,i)=>{const v=c(r[i]);if(k&&v!=='')raw[k]=v});
    try{
      if(p==='bookcube'){const t=c(g(r,'제목')).replace(/\s+/g,' ');if(['합계','총계','계'].includes(t))return;if(!t)throw '제목 없음';
        const q=num(g(r,'부수')),gr=num(g(r,'판매액')),nt=num(g(r,'정산액'));if(q==null||gr==null||nt==null)throw '부수 · 판매액 · 정산액 중 빈 값이 있습니다';const rf=q<0||gr<0||nt<0;
        L.push({isbn:'t:'+t,title:t,author:c(g(r,'저자')),granularity:'transaction',line_type:rf?'refund':'sale',agg:true,channel:c(g(r,'판매처')),sale_method:c(g(r,'판매유형')),
          quantity:q,list_price:num(g(r,'정가')),sale_price:q?Math.round(Math.abs(gr)/Math.abs(q)):null,gross_amount:gr,net_amount:nt,raw});return}
      if(p==='ridi'){Object.keys(raw).forEach(k=>raw[k]=tt(raw[k]));const t=tt(g(r,'제목')).replace(/\s+/g,' ');
        if(!t){if(c(g(r,'도서 ID'))===''&&c(g(r,'판매액'))==='')return;throw '제목 없음'}
        const day=dt(g(r,'기준일')),sq=num(g(r,'판매권')),cq=num(g(r,'취소권')),sg=num(g(r,'판매액')),cg=num(g(r,'취소액')),nt=num(g(r,'정산액'));
        if(sq==null||sg==null||nt==null)throw '판매권 · 판매액 · 정산액 중 빈 값이 있습니다';
        if(!sq&&!cq&&!sg&&!cg&&!nt)return;                                                    // 실적 없는 행은 건너뜀
        const q=sq-Math.abs(cq||0),gr=sg-Math.abs(cg||0);                                     // 판매에서 취소를 뺀 순수 판매(취소는 절댓값으로 차감)
        if(gr>0&&nt>gr*1.01)throw `정산액(${nt})이 판매액(${gr})보다 큽니다 — 파일 양식을 확인하세요`;
        const iv=isbn(g(r,'전자책ISBN13'))||isbn(g(r,'종이책ISBN13')),rf=q<0||gr<0||nt<0;
        L.push({isbn:/^\d{13}$/.test(iv)?iv:'t:'+t,title:t,author:tt(g(r,'저자')),pub:tt(g(r,'출판사')),granularity:'transaction',agg:true,line_type:rf?'refund':'sale',
          sold_at:day.ts,sale_date:day.date,sale_month:day.month,channel:c(g(r,'판매처')),sale_method:'',quantity:q,list_price:num(g(r,'전자책정가')),
          sale_price:q?Math.round(Math.abs(gr)/Math.abs(q)):null,gross_amount:gr,net_amount:nt,raw});return}
      if(p==='kyobo'){const rv=g(r,'판매기간'),per=c(rv);
        if(per==='합계'){total=num(g(r,'판매금액'));return}
        const day=typeof rv==='number'||/^\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(per)?dt(rv):null;       // 새 양식: 날짜(엑셀 날짜값) → 일 단위
        if(!day&&!/^\d{4}-\d{2}$/.test(per))throw `판매기간 형식 오류: ${per}`;                         // 예전 양식: 2026-09 → 월 단위
        L.push({isbn:isbn(g(r,'epub isbn')),title:c(g(r,'상품명')),author:c(g(r,'저자명')),pub:c(g(r,'출판사')),line_type:'sale',
          ...(day?{granularity:'transaction',agg:true,sold_at:day.ts,sale_date:day.date,sale_month:day.month}:{granularity:'monthly',sale_date:null,sale_month:per+'-01'}),
          channel:c(g(r,'판매채널')),sale_method:c(g(r,'판매방식')),quantity:num(g(r,'판매수량')),list_price:num(g(r,'정가')),
          sale_price:num(g(r,'판매가')),gross_amount:num(g(r,'판매금액')),net_amount:null,raw});return}
      let refund,when,orig=null,list,sale,net,ik,title;
      if(p==='aladin'){const f=c(g(r,'판매형태'));if(f!=='판매'&&f!=='대여'&&f!=='취소')throw `알 수 없는 판매형태: ${f}`;   // 대여(이벤트 기간 등)는 판매와 같은 1건 판매로 처리
        refund=f==='취소';when=dt(g(r,'판매/취소일시'));if(c(g(r,'원주문일시'))!=='')orig=dt(g(r,'원주문일시')).ts;
        list=g(r,'정가');sale=g(r,'판매가');net=g(r,'정산액');ik=g(r,'ISBN');title=g(r,'제목')}
      else{const f=c(g(r,'판매구분')),rf=c(g(r,'환불일'));refund=rf!==''||/환불|취소/.test(f);
        if(!refund&&f!=='구매')throw `알 수 없는 판매구분: ${f}`;
        when=dt(refund&&rf!==''?g(r,'환불일'):g(r,'판매일'));if(refund&&c(g(r,'판매일'))!=='')orig=dt(g(r,'판매일')).ts;
        list=g(r,'출판사판매가');sale=g(r,'서점판매가');net=g(r,'출판사정산액');ik=g(r,'전자책ISBN');title=g(r,'도서명')}
      const q=refund?-1:1,sp=Math.abs(num(sale)),nt=num(net);if(nt==null)throw '정산액 없음';
      L.push({isbn:isbn(ik),title:c(title),author:c(g(r,'저자명')),granularity:'transaction',line_type:refund?'refund':'sale',sold_at:when.ts,sale_date:when.date,
        sale_month:when.month,original_sold_at:orig,quantity:q,list_price:num(list),sale_price:sp,gross_amount:q*sp,net_amount:q*Math.abs(nt),raw});
    }catch(e){E.push(`${hi+n+2}행: ${e}`)}});
  if(p==='kyobo'&&total!=null){const s=L.reduce((a,l)=>a+l.gross_amount,0);if(s!==total)E.push(`합계 불일치: 행 합 ${won(s)} ≠ 파일의 합계 ${won(total)}`)}
  L.forEach((l,i)=>{if(!/^\d{13}$/.test(l.isbn)&&!/^t:./.test(l.isbn))E.push(`ISBN 인식 실패: "${l.isbn}" (${l.title})`)});
  return{L,E,total}}
