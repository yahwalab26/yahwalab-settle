/* admin/password.js — 관리자 화면의 비밀번호 변경 버튼
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

$('#pwb').onclick=()=>askPw(false);
