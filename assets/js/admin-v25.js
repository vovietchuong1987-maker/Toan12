/* =========================================================
   V26 — PRODUCTION ADMIN + SYSTEM HEALTH
   App-level administration for GitHub Pages + Firebase client apps.
   Important: account lock here is enforced by Firestore Rules. Disabling a
   Firebase Authentication user itself still requires a trusted Admin SDK/backend.
   ========================================================= */
let v25AdminUsers=[];
let v25AdminClasses=[];
let v25AdminAudit=[];
let v25AdminLoading=false;
let v25AdminLastLoadedAt=0;

function v25RoleLabel(role){return role==='admin'?'Quản trị viên':role==='teacher'?'Giáo viên':'Học sinh'}
function v25StatusLabel(status){return status==='locked'?'Đã khóa':'Đang hoạt động'}
function v25ClassAccessLabel(c){if(c.status==='trashed')return 'Thùng rác';if(c.accessStatus==='locked')return 'Tạm khóa';return 'Hoạt động'}
function v25DateValue(v){try{if(!v)return null;if(typeof v.toDate==='function')return v.toDate();let d=new Date(v);return Number.isNaN(d.getTime())?null:d}catch(_){return null}}
function v25AgeDays(v){let d=v25DateValue(v);return d?Math.max(0,Math.floor((Date.now()-d.getTime())/86400000)):null}
function v25AdminRequire(){if(isAdminRole?.())return true;alert('Chức năng này chỉ dành cho tài khoản Quản trị viên V26.');return false}

function renderAdminV25(){
  const page=document.getElementById('page-admin');if(!page)return;
  if(!firebaseUser||!isAdminRole?.()){
    page.querySelector('#v25AdminBanner')?.classList.add('warn');
    const b=page.querySelector('#v25AdminBanner');if(b)b.textContent='Đăng nhập tài khoản có role = admin để mở trung tâm quản trị.';
    return;
  }
  const b=page.querySelector('#v25AdminBanner');if(b){b.className='firebase-banner';b.textContent='V26 Admin Console đang dùng quyền Firestore đã xác thực. Khóa tài khoản là khóa truy cập ứng dụng/dữ liệu; vô hiệu hóa Firebase Authentication thật sự cần Admin SDK/backend.'}
  v25AdminRenderData();
}

async function v25AdminRefresh(force=true){
  if(!v25AdminRequire()||!firebaseDb||v25AdminLoading)return;
  if(!force&&Date.now()-v25AdminLastLoadedAt<20000&&v25AdminUsers.length){v25AdminRenderData();return}
  v25AdminLoading=true;document.getElementById('page-admin')?.classList.add('admin-loading');
  try{
    const [uSnap,cSnap,aSnap]=await Promise.all([
      firebaseDb.collection('users').limit(300).get(),
      firebaseDb.collection('classes').limit(300).get(),
      firebaseDb.collection('adminAudit').orderBy('createdAt','desc').limit(50).get()
    ]);
    v25AdminUsers=uSnap.docs.map(d=>({id:d.id,...d.data()}));
    v25AdminClasses=cSnap.docs.map(d=>({id:d.id,...d.data()}));
    v25AdminAudit=aSnap.docs.map(d=>({id:d.id,...d.data()}));
    v25AdminLastLoadedAt=Date.now();v25AdminRenderData();
  }catch(err){console.error('V26 admin refresh',err);let b=document.getElementById('v25AdminBanner');if(b){b.className='firebase-banner error';b.textContent=firebaseErrorText(err)}}
  finally{v25AdminLoading=false;document.getElementById('page-admin')?.classList.remove('admin-loading')}
}

function v25AdminRenderData(){
  if(!document.getElementById('page-admin')||!isAdminRole?.())return;
  const users=v25AdminUsers||[],classes=v25AdminClasses||[];
  const studentCount=users.filter(x=>(x.role||'student')==='student').length;
  const teacherCount=users.filter(x=>x.role==='teacher').length;
  const lockedCount=users.filter(x=>x.accountStatus==='locked').length;
  const activeClasses=classes.filter(x=>x.status!=='trashed'&&x.accessStatus!=='locked').length;
  const metrics={v25MetricUsers:users.length,v25MetricTeachers:teacherCount,v25MetricStudents:studentCount,v25MetricLocked:lockedCount,v25MetricClasses:activeClasses};
  Object.entries(metrics).forEach(([id,val])=>{let e=document.getElementById(id);if(e)e.textContent=val});
  v25AdminApplyFilters();v25AdminRenderClasses();v25AdminRenderAlerts();v25AdminRenderAudit();if(typeof v26RenderSystemHealth==='function')v26RenderSystemHealth();
  const at=document.getElementById('v25AdminUpdatedAt');if(at)at.textContent=v25AdminLastLoadedAt?new Date(v25AdminLastLoadedAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):'—';
}

function v25AdminApplyFilters(){
  const q=String(document.getElementById('v25UserSearch')?.value||'').trim().toLowerCase(),role=document.getElementById('v25UserRoleFilter')?.value||'',status=document.getElementById('v25UserStatusFilter')?.value||'';
  let rows=(v25AdminUsers||[]).filter(u=>{
    let text=`${u.displayName||''} ${u.email||''} ${u.id||''}`.toLowerCase();
    return (!q||text.includes(q))&&(!role||(u.role||'student')===role)&&(!status||(u.accountStatus||'active')===status);
  }).sort((a,b)=>String(a.displayName||a.email||'').localeCompare(String(b.displayName||b.email||''),'vi'));
  const box=document.getElementById('v25UserTable');if(!box)return;
  box.innerHTML=rows.length?rows.map(u=>{
    const role=u.role||'student',status=u.accountStatus||'active',isRoot=role==='admin';
    return `<tr><td><div class="student-chip"><div class="avatar">${esc((u.displayName||u.email||'?').trim()[0]?.toUpperCase()||'?')}</div><div><b>${esc(u.displayName||u.email?.split('@')[0]||'Người dùng')}</b><br><small>${esc(u.email||'')}</small><br><code>${esc(u.id)}</code></div></div></td><td><span class="v25-role ${role}">${esc(v25RoleLabel(role))}</span></td><td><span class="v25-account-status ${status}">${status==='locked'?'● Đã khóa':'● Hoạt động'}</span></td><td>${u.emailVerified===true?'✓ Đã xác minh':u.emailVerified===false?'⚠ Chưa xác minh':'—'}</td><td><small>${esc(firebaseDateText?.(u.lastLoginAt)||'—')}</small></td><td><div class="admin-row-actions">${isRoot?'<span class="pill">Được bảo vệ</span>':`<button class="btn btn-soft" onclick="v25AdminToggleRole('${attrEsc(u.id)}','${attrEsc(role)}')">${role==='teacher'?'Đổi thành HS':'Đổi thành GV'}</button><button class="btn ${status==='locked'?'btn-blue':'btn-danger'}" onclick="v25AdminToggleUserLock('${attrEsc(u.id)}','${attrEsc(status)}')">${status==='locked'?'Mở khóa':'Khóa'}</button>${u.email?`<button class="btn btn-soft" onclick="v25AdminSendReset('${attrEsc(u.email)}')">Reset MK</button>`:''}`}</div></td></tr>`;
  }).join(''):'<tr><td colspan="6">Không có tài khoản phù hợp.</td></tr>';
  const count=document.getElementById('v25UserResultCount');if(count)count.textContent=`${rows.length}/${(v25AdminUsers||[]).length} tài khoản`;
}

async function v25AdminWriteAudit(action,targetType,targetId,detail={}){
  if(!firebaseDb||!firebaseUser||!isAdminRole?.())return;
  await firebaseDb.collection('adminAudit').add({actorUid:firebaseUser.uid,actorEmail:firebaseUser.email||'',action,targetType,targetId,detail,schemaVersion:26,createdAt:firebaseServerTimestamp()});
}

async function v25AdminToggleRole(uid,currentRole){
  if(!v25AdminRequire()||currentRole==='admin')return;
  const next=currentRole==='teacher'?'student':'teacher';
  if(next==='student'){
    const own=await firebaseDb.collection('classes').where('ownerId','==',uid).get();
    const active=own.docs.filter(d=>(d.data()||{}).status!=='trashed');
    if(active.length)return alert(`Không thể hạ quyền: tài khoản này đang sở hữu ${active.length} lớp hoạt động. Hãy chuyển/xử lý lớp trước.`);
  }
  if(!confirm(`Đổi tài khoản này thành ${v25RoleLabel(next)}?`))return;
  try{let target=(v25AdminUsers||[]).find(x=>x.id===uid)||{},ref=firebaseDb.collection('users').doc(uid),b=firebaseDb.batch();b.update(ref,{role:next,accountStatus:target.accountStatus||'active',schemaVersion:26,adminUpdatedAt:firebaseServerTimestamp(),adminUpdatedBy:firebaseUser.uid,updatedAt:firebaseServerTimestamp()});let aref=firebaseDb.collection('adminAudit').doc();b.set(aref,{actorUid:firebaseUser.uid,actorEmail:firebaseUser.email||'',action:'user.role.change',targetType:'user',targetId:uid,detail:{from:currentRole,to:next},schemaVersion:26,createdAt:firebaseServerTimestamp()});await b.commit();await v25AdminRefresh(true)}catch(err){alert(firebaseErrorText(err))}
}

async function v25AdminToggleUserLock(uid,currentStatus){
  if(!v25AdminRequire())return;let target=(v25AdminUsers||[]).find(x=>x.id===uid);if(target?.role==='admin')return alert('V26 không cho khóa tài khoản admin từ trình duyệt.');
  const next=currentStatus==='locked'?'active':'locked';if(!confirm(next==='locked'?'Khóa truy cập ứng dụng của tài khoản này?':'Mở lại quyền truy cập ứng dụng cho tài khoản này?'))return;
  try{let ref=firebaseDb.collection('users').doc(uid),b=firebaseDb.batch();b.update(ref,{accountStatus:next,schemaVersion:26,adminUpdatedAt:firebaseServerTimestamp(),adminUpdatedBy:firebaseUser.uid,updatedAt:firebaseServerTimestamp()});let aref=firebaseDb.collection('adminAudit').doc();b.set(aref,{actorUid:firebaseUser.uid,actorEmail:firebaseUser.email||'',action:next==='locked'?'user.lock':'user.unlock',targetType:'user',targetId:uid,detail:{status:next},schemaVersion:26,createdAt:firebaseServerTimestamp()});await b.commit();await v25AdminRefresh(true)}catch(err){alert(firebaseErrorText(err))}
}

async function v25AdminSendReset(email){if(!v25AdminRequire()||!email)return;if(!confirm(`Gửi email đặt lại mật khẩu tới ${email}?`))return;try{await firebaseAuth.sendPasswordResetEmail(email);await v25AdminWriteAudit('user.password-reset.request','user','',{email});alert('Đã gửi yêu cầu đặt lại mật khẩu.')}catch(err){alert(firebaseErrorText(err))}}

function v25AdminRenderClasses(){
  const q=String(document.getElementById('v25ClassSearch')?.value||'').trim().toLowerCase(),box=document.getElementById('v25ClassTable');if(!box)return;
  const ownerMap=new Map((v25AdminUsers||[]).map(u=>[u.id,u]));
  let rows=(v25AdminClasses||[]).filter(c=>!q||`${c.name||''} ${c.teacherName||''} ${c.ownerId||''}`.toLowerCase().includes(q)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  box.innerHTML=rows.length?rows.map(c=>{let owner=ownerMap.get(c.ownerId)||{},access=c.accessStatus||'active';return `<tr><td><b>${esc(c.name||'Lớp học')}</b><br><small>${esc(c.id)}</small></td><td>${esc(c.teacherName||owner.displayName||owner.email||c.ownerId||'—')}<br><small>${esc(owner.email||'')}</small></td><td><span class="v25-class-status ${c.status==='trashed'?'trashed':access==='locked'?'locked':'active'}">${esc(v25ClassAccessLabel(c))}</span></td><td>${c.analyticsV26?.memberCount??c.analyticsV25?.memberCount??c.analyticsV24?.memberCount??c.analyticsV23?.memberCount??c.analyticsV22?.memberCount??'—'}</td><td>${(c.analyticsV26?.averageScore??c.analyticsV25?.averageScore??c.analyticsV24?.averageScore??c.analyticsV23?.averageScore??c.analyticsV22?.averageScore)==null?'—':Number(c.analyticsV26?.averageScore??c.analyticsV25?.averageScore??c.analyticsV24?.averageScore??c.analyticsV23?.averageScore??c.analyticsV22?.averageScore).toFixed(2)}</td><td><div class="admin-row-actions">${c.status==='trashed'?'<span class="pill">Chủ lớp xử lý trong Thùng rác</span>':`<button class="btn ${access==='locked'?'btn-blue':'btn-danger'}" onclick="v25AdminToggleClassAccess('${attrEsc(c.id)}','${attrEsc(access)}')">${access==='locked'?'Mở lớp':'Khóa lớp'}</button>`}</div></td></tr>`}).join(''):'<tr><td colspan="6">Không có lớp phù hợp.</td></tr>';
}

async function v25AdminToggleClassAccess(classId,current){
  if(!v25AdminRequire())return;const next=current==='locked'?'active':'locked';if(!confirm(next==='locked'?'Tạm khóa học sinh truy cập lớp này? Chủ lớp vẫn có thể quản trị.':'Mở lại quyền truy cập lớp cho học sinh?'))return;
  try{let ref=firebaseDb.collection('classes').doc(classId),b=firebaseDb.batch();b.update(ref,{accessStatus:next,schemaVersion:26,moderatedAt:firebaseServerTimestamp(),moderatedBy:firebaseUser.uid,updatedAt:firebaseServerTimestamp()});let aref=firebaseDb.collection('adminAudit').doc();b.set(aref,{actorUid:firebaseUser.uid,actorEmail:firebaseUser.email||'',action:next==='locked'?'class.lock':'class.unlock',targetType:'class',targetId:classId,detail:{accessStatus:next},schemaVersion:26,createdAt:firebaseServerTimestamp()});await b.commit();await v25AdminRefresh(true)}catch(err){alert(firebaseErrorText(err))}
}

function v25AdminRenderAlerts(){
  const box=document.getElementById('v25AdminAlerts');if(!box)return;let alerts=[];
  const locked=(v25AdminUsers||[]).filter(u=>u.accountStatus==='locked');if(locked.length)alerts.push({level:'warn',title:`${locked.length} tài khoản đang khóa`,text:'Kiểm tra xem các tài khoản này còn cần duy trì khóa hay không.'});
  const unverified=(v25AdminUsers||[]).filter(u=>u.emailVerified===false);if(unverified.length)alerts.push({level:'warn',title:`${unverified.length} email chưa xác minh`,text:'Nên nhắc người dùng xác minh email để tăng độ tin cậy tài khoản.'});
  const oldSchema=(v25AdminUsers||[]).filter(u=>(Number(u.schemaVersion)||0)<26);if(oldSchema.length)alerts.push({level:'info',title:`${oldSchema.length} hồ sơ chưa lên schema V26`,text:'Hồ sơ sẽ tự cập nhật khi người dùng đăng nhập V26.'});
  const staleTrash=(v25AdminClasses||[]).filter(c=>c.status==='trashed'&&(v25AgeDays(c.trashedAt)||0)>=7);if(staleTrash.length)alerts.push({level:'warn',title:`${staleTrash.length} lớp ở Thùng rác ≥ 7 ngày`,text:'Chủ lớp nên quyết định khôi phục hoặc xóa vĩnh viễn.'});
  const classLocked=(v25AdminClasses||[]).filter(c=>c.accessStatus==='locked'&&c.status!=='trashed');if(classLocked.length)alerts.push({level:'danger',title:`${classLocked.length} lớp đang bị khóa truy cập`,text:'Học sinh không thể đọc lớp/bài giao cho đến khi admin mở lại.'});
  if(!(v25AdminUsers||[]).some(u=>u.role==='admin'))alerts.push({level:'danger',title:'Không tìm thấy hồ sơ admin',text:'Cần thiết lập ít nhất một users/{uid}.role = admin trực tiếp trong Firebase Console.'});
  box.innerHTML=alerts.length?alerts.map(a=>`<div class="v25-alert ${a.level}"><div><b>${esc(a.title)}</b><p>${esc(a.text)}</p></div></div>`).join(''):'<div class="firebase-banner"><b>✓ Hệ thống không có cảnh báo nổi bật.</b></div>';
}

function v25AdminRenderAudit(){
  const box=document.getElementById('v25AdminAudit');if(!box)return;const actionName={'user.role.change':'Đổi quyền','user.lock':'Khóa tài khoản','user.unlock':'Mở tài khoản','user.password-reset.request':'Gửi reset mật khẩu','class.lock':'Khóa lớp','class.unlock':'Mở lớp','system.integrity.repair':'Sửa toàn vẹn V26'};
  box.innerHTML=(v25AdminAudit||[]).length?(v25AdminAudit||[]).map(a=>`<div class="audit-row"><div><b>${esc(actionName[a.action]||a.action||'Thao tác')}</b><small>${esc(a.actorEmail||a.actorUid||'admin')} → ${esc(a.targetType||'')} ${esc(a.targetId||'')}</small></div><span>${esc(firebaseDateText?.(a.createdAt)||'')}</span></div>`).join(''):'<div class="online-empty">Chưa có nhật ký quản trị V26.</div>';
}
