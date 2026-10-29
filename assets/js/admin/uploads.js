/* admin/uploads.js — 업로드 이력 · 정산 데이터 초기화
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 업로드 이력 · 정산 데이터 초기화 ---------- */
async function loadUploads(){const{data}=await SB.from('upload_batches').select('id,platform_code,filename,row_count,created_at').order('created_at',{ascending:false}).limit(30);
  $('#ul').innerHTML=(data||[]).map(b=>`<tr><td>${new Date(b.created_at).toLocaleString('ko-KR')}</td><td>${PN[b.platform_code]||b.platform_code}</td><td class="hm">${esc(b.filename||'')}</td><td class="r">${b.row_count}</td><td><button class="ghost ib" data-ub="${b.id}" data-n="${b.row_count}" title="이 업로드 되돌리기" aria-label="이 업로드 되돌리기"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg></button></td></tr>`).join('')||'<tr><td colspan="5" class="k">업로드 이력이 없습니다.</td></tr>'}
$('#ul').onclick=e=>{const b=e.target.closest('[data-ub]');if(!b)return;const id=b.dataset.ub;
  confirmLay({title:'업로드 되돌리기',body:`<p style="margin:0">이 업로드로 추가·갱신된 판매 데이터 <b>${b.dataset.n}건</b>을 삭제합니다.<br>이전 업로드에 있던 중복 행은 영향을 받지 않습니다.</p>`,ok:'되돌리기',onOk:async()=>{
    const a=await SB.from('sales_lines').delete().eq('batch_id',id);if(a.error){alert(a.error.message);return closeLay()}
    const d=await SB.from('upload_batches').delete().eq('id',id);closeLay();if(d.error)alert(d.error.message);loadFresh();loadUploads();loadHome()}})};
$('#rb').onclick=async()=>{const pf=$('#rs').value,label=pf?PN[pf]:'전체 플랫폼';let q=SB.from('sales_lines').select('id',{count:'exact',head:true});if(pf)q=q.eq('platform_code',pf);const{count}=await q;
  confirmLay({title:'정산 데이터 초기화',body:`<p style="margin:0"><b>${label}</b>의 판매 데이터 <b>${count??0}건</b>과 업로드 이력이 모두 삭제됩니다.<br><span class="bad">삭제한 데이터는 복구할 수 없습니다.</span> 필요하면 원본 파일을 다시 업로드해야 하며, 작가 · 작품 · 계약 정보는 그대로 유지됩니다.</p>`,phrase:'초기화',ok:'초기화 실행',onOk:async()=>{
    if(!confirm(`정말로 ${label}의 판매 데이터 ${count??0}건을 삭제할까요?\\n이 작업은 되돌릴 수 없습니다.`))return closeLay();
    const{data,error}=await call({action:'reset_sales',confirm:'초기화',platform:pf||null});closeLay();if(error)return alert(error);
    alert(`판매 데이터 ${data.deleted}건을 삭제했습니다.`);loadFresh();loadUploads();loadHome()}})};
$('#pc').onclick=e=>{const b=e.target.closest('button');if(b){DP=b.dataset.p;drawDetail()}};
$('#dt').onchange=async e=>{const t=e.target.closest('select[data-wl]');if(!t||!t.value)return;const{error}=await SB.from('works').update({label:t.value}).eq('id',t.dataset.wl);if(error)return alert(error.message);loadHome()};
