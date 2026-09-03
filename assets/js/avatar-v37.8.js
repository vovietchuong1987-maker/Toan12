/* =========================================================
   Math12 Hub  — Avatar Foundation
   - Student-only starter avatar profile.
   - First authenticated student login asks for Male/Female starter path.
   - Starter customization: skin, face, hair and basic outfit.
   - Local-first persistence + optional Firestore user-profile sync.
   - No EXP / gold / shop economy yet (reserved for +).
   ========================================================= */
const AVATAR_V378_SCHEMA=1;
const AVATAR_V378_RANK='Tân binh Toán học';
const AVATAR_V378_STARTER_LEVEL=1;
const AVATAR_V378_SKINS={
  light:{label:'Sáng',fill:'#F4C7A1',shadow:'#D99B72'},
  warm:{label:'Ấm',fill:'#E6AD7B',shadow:'#C47C52'},
  tan:{label:'Nâu',fill:'#B97850',shadow:'#8F5335'}
};
const AVATAR_V378_FACES={
  smile:{label:'Vui vẻ'},
  calm:{label:'Điềm tĩnh'},
  confident:{label:'Tự tin'},
  focus:{label:'Tập trung'}
};
const AVATAR_V378_HAIR={
  male:[
    {id:'short',label:'Gọn gàng'},
    {id:'side',label:'Rẽ ngôi'},
    {id:'spiky',label:'Năng động'}
  ],
  female:[
    {id:'bob',label:'Tóc bob'},
    {id:'long',label:'Tóc dài'},
    {id:'pony',label:'Buộc cao'}
  ]
};
const AVATAR_V378_OUTFITS=[
  {id:'school-blue',label:'Đồng phục xanh',top:'#EAF2FF',accent:'#315BC7',bottom:'#27364E'},
  {id:'school-white',label:'Đồng phục trắng',top:'#FFFFFF',accent:'#64748B',bottom:'#334155'},
  {id:'sport-basic',label:'Thể thao cơ bản',top:'#E8F7EF',accent:'#27845A',bottom:'#1F4D3A'}
];
let avatarV378Draft=null;
let avatarV378OnboardingGender='';
let avatarV378PromptedUid='';

function avatarV378OwnerUid(){return firebaseUser?.uid||'local'}
function avatarV378Starter(gender='male'){
  return {schemaVersion:AVATAR_V378_SCHEMA,initialized:false,ownerUid:avatarV378OwnerUid(),gender:gender==='female'?'female':'male',skin:'warm',face:'smile',hair:gender==='female'?'bob':'short',outfit:'school-blue',level:AVATAR_V378_STARTER_LEVEL,rank:AVATAR_V378_RANK,starter:true,updatedAt:''};
}
function avatarV378Sanitize(raw,owner=avatarV378OwnerUid()){
  if(!raw||typeof raw!=='object')return null;
  let gender=raw.gender==='female'?'female':raw.gender==='male'?'male':'';
  if(!gender)return null;
  const hairs=AVATAR_V378_HAIR[gender].map(x=>x.id);
  return {
    schemaVersion:AVATAR_V378_SCHEMA,
    initialized:raw.initialized===true,
    ownerUid:owner,
    gender,
    skin:AVATAR_V378_SKINS[raw.skin]?raw.skin:'warm',
    face:AVATAR_V378_FACES[raw.face]?raw.face:'smile',
    hair:hairs.includes(raw.hair)?raw.hair:hairs[0],
    outfit:AVATAR_V378_OUTFITS.some(x=>x.id===raw.outfit)?raw.outfit:'school-blue',
    level:AVATAR_V378_STARTER_LEVEL,
    rank:AVATAR_V378_RANK,
    starter:true,
    updatedAt:String(raw.updatedAt||'')
  };
}
function avatarV378Stored(){
  const uid=avatarV378OwnerUid();
  let cloud=avatarV378Sanitize(firebaseProfile?.avatarV378,uid);
  if(cloud)return cloud;
  let local=avatarV378Sanitize(state?.avatarV378,uid);
  if(local&&String(state.avatarV378?.ownerUid||'')===uid)return local;
  return null;
}
function avatarV378Current(){return avatarV378Sanitize(avatarV378Draft)||avatarV378Stored()||avatarV378Starter(avatarV378OnboardingGender||'male')}
function avatarV378DisplayName(){return firebaseProfile?.displayName||firebaseUser?.displayName||firebaseUser?.email?.split('@')[0]||'Học sinh Math12'}
function avatarV378Outfit(id){return AVATAR_V378_OUTFITS.find(x=>x.id===id)||AVATAR_V378_OUTFITS[0]}

function avatarV378HairSvg(a){
  const hair='#253047',hi='#39445C';
  if(a.gender==='female'){
    if(a.hair==='long')return `<path d="M75 88 Q76 40 120 36 Q164 40 165 90 L160 184 Q148 198 137 187 L140 97 Q121 77 100 93 L103 188 Q91 200 80 184 Z" fill="${hair}"/><path d="M84 75 Q116 38 154 72 Q139 55 119 54 Q99 55 84 75Z" fill="${hi}" opacity=".65"/>`;
    if(a.hair==='pony')return `<path d="M78 89 Q76 42 119 36 Q161 40 162 87 L151 78 Q136 54 105 59 Q91 62 82 81Z" fill="${hair}"/><path d="M153 58 Q184 59 181 93 Q176 112 159 118 Q170 88 151 76Z" fill="${hair}"/><circle cx="156" cy="66" r="8" fill="#53617D"/>`;
    return `<path d="M76 91 Q76 42 120 36 Q164 41 165 91 L157 135 Q151 148 140 143 L142 92 Q120 73 98 91 L100 144 Q87 149 81 135Z" fill="${hair}"/><path d="M85 70 Q105 47 128 52 Q148 55 157 76 Q137 61 117 63 Q99 63 85 70Z" fill="${hi}" opacity=".55"/>`;
  }
  if(a.hair==='side')return `<path d="M78 88 Q79 43 121 38 Q160 40 162 83 Q148 62 128 58 Q104 53 82 82Z" fill="${hair}"/><path d="M91 58 Q123 38 153 61 Q122 55 99 70Z" fill="${hi}" opacity=".58"/>`;
  if(a.hair==='spiky')return `<path d="M79 85 L85 53 L98 61 L108 38 L120 54 L134 36 L139 57 L158 49 L162 86 Q142 61 120 60 Q96 60 79 85Z" fill="${hair}"/>`;
  return `<path d="M79 87 Q79 45 120 38 Q159 43 162 87 Q145 62 120 61 Q96 61 79 87Z" fill="${hair}"/><path d="M90 59 Q118 43 149 63 Q119 57 95 70Z" fill="${hi}" opacity=".48"/>`;
}
function avatarV378Svg(raw,size='large'){
  const a=avatarV378Sanitize(raw)||avatarV378Starter('male'),skin=AVATAR_V378_SKINS[a.skin],out=avatarV378Outfit(a.outfit);
  const cls=size==='mini'?'avatar-svg avatar-svg-mini':'avatar-svg';
  const smile=a.face==='smile'?`<path d="M108 112 Q120 121 132 112" fill="none" stroke="#7C443B" stroke-width="3.2" stroke-linecap="round"/>`:a.face==='confident'?`<path d="M108 114 Q120 121 133 111" fill="none" stroke="#7C443B" stroke-width="3" stroke-linecap="round"/>`:a.face==='focus'?`<path d="M110 116 Q120 113 130 116" fill="none" stroke="#7C443B" stroke-width="3" stroke-linecap="round"/>`:`<path d="M110 114 Q120 117 130 114" fill="none" stroke="#7C443B" stroke-width="3" stroke-linecap="round"/>`;
  const lower=a.gender==='female'?`<path d="M84 250 L156 250 L172 321 L68 321Z" fill="${out.bottom}"/><path d="M89 321 L111 321 L106 354 L82 354Z" fill="#E7EDF6"/><path d="M129 321 L151 321 L158 354 L134 354Z" fill="#E7EDF6"/>`:`<path d="M82 250 L158 250 L151 329 L126 329 L120 275 L114 329 L89 329Z" fill="${out.bottom}"/><path d="M89 329 L112 329 L108 354 L83 354Z" fill="#E7EDF6"/><path d="M127 329 L151 329 L158 354 L133 354Z" fill="#E7EDF6"/>`;
  return `<svg class="${cls}" viewBox="0 0 240 370" role="img" aria-label="Avatar ${a.gender==='female'?'nữ':'nam'} ${esc(AVATAR_V378_RANK)}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="avbg-${a.gender}-${a.skin}-${a.outfit}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F6F9FF"/><stop offset="1" stop-color="#DDE8FF"/></linearGradient></defs>
    <rect x="8" y="8" width="224" height="354" rx="42" fill="url(#avbg-${a.gender}-${a.skin}-${a.outfit})"/>
    <circle cx="120" cy="105" r="46" fill="${skin.fill}"/><ellipse cx="76" cy="106" rx="7" ry="12" fill="${skin.shadow}" opacity=".8"/><ellipse cx="164" cy="106" rx="7" ry="12" fill="${skin.shadow}" opacity=".8"/>
    ${avatarV378HairSvg(a)}
    <ellipse cx="103" cy="102" rx="4.2" ry="5" fill="#263244"/><ellipse cx="137" cy="102" rx="4.2" ry="5" fill="#263244"/><path d="M102 91 Q108 87 113 91" fill="none" stroke="#6D4D43" stroke-width="2" stroke-linecap="round"/><path d="M128 91 Q134 87 140 91" fill="none" stroke="#6D4D43" stroke-width="2" stroke-linecap="round"/>${smile}
    <path d="M105 143 L105 161 Q120 172 135 161 L135 143" fill="${skin.fill}"/>
    <path d="M78 173 Q120 151 162 173 L171 252 L69 252Z" fill="${out.top}" stroke="#D8E1EF" stroke-width="2"/>
    <path d="M104 162 L120 181 L136 162" fill="#FFFFFF"/><path d="M120 181 L120 245" stroke="${out.accent}" stroke-width="8"/><path d="M82 180 Q60 202 60 245 L77 249 L91 194Z" fill="${out.top}"/><path d="M158 180 Q180 202 180 245 L163 249 L149 194Z" fill="${out.top}"/>
    <circle cx="69" cy="249" r="10" fill="${skin.fill}"/><circle cx="171" cy="249" r="10" fill="${skin.fill}"/>
    ${lower}
    <path d="M80 354 Q96 348 111 354 L110 361 L78 361Z" fill="#27364E"/><path d="M130 354 Q145 348 160 354 L162 361 L130 361Z" fill="#27364E"/>
    <circle cx="205" cy="46" r="20" fill="#FFFFFF" opacity=".92"/><text x="205" y="52" text-anchor="middle" font-size="17" font-weight="800" fill="#315BC7">1</text>
  </svg>`;
}
function avatarV378GenericSvg(size='mini'){
  const cls=size==='mini'?'avatar-svg avatar-svg-mini':'avatar-svg';
  return `<svg class="${cls}" viewBox="0 0 240 370" role="img" aria-label="Avatar chưa thiết lập" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="224" height="354" rx="42" fill="#EEF3FB"/><circle cx="120" cy="105" r="46" fill="#D7DFEC"/><path d="M77 87 Q81 45 120 40 Q159 45 163 87 Q145 64 120 63 Q95 64 77 87Z" fill="#AAB6C9"/><path d="M72 176 Q120 148 168 176 L176 260 L64 260Z" fill="#DDE5F1"/><path d="M87 259 L113 259 L109 350 L83 350Z" fill="#C7D1E1"/><path d="M127 259 L153 259 L158 350 L132 350Z" fill="#C7D1E1"/><circle cx="205" cy="46" r="20" fill="#FFFFFF"/><text x="205" y="52" text-anchor="middle" font-size="17" font-weight="800" fill="#8A99B1">?</text></svg>`;
}
function avatarV378MiniHtml(a){return `<span class="avatar-v378-mini">${a?avatarV378Svg(a,'mini'):avatarV378GenericSvg('mini')}</span>`}

function avatarV378NotifyChanged(field,value){
  const detail={field,value,avatar:avatarV378Draft?{...avatarV378Draft}:avatarV378Current(),at:Date.now()};
  requestAnimationFrame(()=>{
    try{window.dispatchEvent(new CustomEvent('math12hub:avatar-changed',{detail}))}catch(_){}
    try{window.v384Avatar3D?.rebuild?.()}catch(_){}
  });
}
function avatarV378Set(field,value){
  let a=avatarV378Current();
  if(field==='gender'){
    const gender=value==='female'?'female':'male';a.gender=gender;a.hair=gender==='female'?'bob':'short';
  }else if(field==='skin'&&AVATAR_V378_SKINS[value])a.skin=value;
  else if(field==='face'&&AVATAR_V378_FACES[value])a.face=value;
  else if(field==='hair'&&AVATAR_V378_HAIR[a.gender].some(x=>x.id===value))a.hair=value;
  else if(field==='outfit'&&AVATAR_V378_OUTFITS.some(x=>x.id===value))a.outfit=value;
  avatarV378Draft={...a,ownerUid:avatarV378OwnerUid(),updatedAt:new Date().toISOString()};
  // : keep the starter editor and the layered wardrobe in sync.
  // Without this, the wardrobe's starter slots can override the newly selected hair/outfit.
  try{window.v385Wardrobe?.syncBase?.(field,avatarV378Draft)}catch(_){}
  avatarV378RenderPage();
  avatarV378NotifyChanged(field,value);
}
function avatarV378OptionButton(field,id,label,current,extra=''){
  return `<button class="avatar-choice ${current===id?'selected':''}" type="button" onclick="avatarV378Set('${field}','${id}')"><span>${extra||label}</span><small>${esc(label)}</small><em>Miễn phí</em></button>`;
}
function avatarV378RenderPage(){
  const root=document.getElementById('avatarV378Page');if(!root)return;
  const a=avatarV378Current(),stored=avatarV378Stored(),isSaved=!!stored?.initialized&&!avatarV378Draft;
  const hair=AVATAR_V378_HAIR[a.gender];
  root.innerHTML=`<div class="avatar-page-grid">
    <section class="card avatar-preview-card">
      <div class="avatar-preview-kicker">NHÂN VẬT HỌC TẬP</div>
      <div class="avatar-preview-stage">${avatarV378Svg(a)}</div>
      <div class="avatar-name">${esc(avatarV378DisplayName())}</div>
      <div class="avatar-rank-row"><span>Lv.${AVATAR_V378_STARTER_LEVEL}</span><b>${esc(AVATAR_V378_RANK)}</b></div>
      <p>Nhân vật khởi đầu chỉ dùng vật phẩm cơ bản. EXP, vàng và Shop sẽ được nối vào nền móng này ở các bản tiếp theo.</p>
      <div class="avatar-foundation-status"><span>✓ Avatar cá nhân</span><span>✓ Đồng bộ tài khoản</span><span>✓ Bộ đồ tân thủ</span></div>
    </section>
    <section class="card avatar-builder-card">
      <div class="section-head avatar-builder-head"><div><h3>Tạo nhân vật tân thủ</h3><p>Chọn diện mạo cơ bản. Tất cả lựa chọn trong bản v37.8 đều miễn phí.</p></div><span class="avatar-save-state ${isSaved?'saved':'draft'}">${isSaved?'Đã lưu':'Đang chỉnh'}</span></div>
      <div class="avatar-builder-section"><label>1. Kiểu nhân vật</label><div class="avatar-gender-grid">
        <button class="avatar-gender-card ${a.gender==='male'?'selected':''}" onclick="avatarV378Set('gender','male')" type="button">${avatarV378Svg({...a,gender:'male',hair:'short'},'mini')}<b>Nam</b><small>Tân thủ nam</small></button>
        <button class="avatar-gender-card ${a.gender==='female'?'selected':''}" onclick="avatarV378Set('gender','female')" type="button">${avatarV378Svg({...a,gender:'female',hair:'bob'},'mini')}<b>Nữ</b><small>Tân thủ nữ</small></button>
      </div></div>
      <div class="avatar-builder-section"><label>2. Tông da</label><div class="avatar-choice-grid avatar-skin-grid">${Object.entries(AVATAR_V378_SKINS).map(([id,x])=>avatarV378OptionButton('skin',id,x.label,a.skin,`<i style="background:${x.fill}"></i>`)).join('')}</div></div>
      <div class="avatar-builder-section"><label>3. Gương mặt</label><div class="avatar-choice-grid">${Object.entries(AVATAR_V378_FACES).map(([id,x])=>avatarV378OptionButton('face',id,x.label,a.face,id==='smile'?'☺':id==='confident'?'◕‿◕':id==='focus'?'⌁':'—')).join('')}</div></div>
      <div class="avatar-builder-section"><label>4. Kiểu tóc</label><div class="avatar-choice-grid">${hair.map(x=>avatarV378OptionButton('hair',x.id,x.label,a.hair,'✦')).join('')}</div></div>
      <div class="avatar-builder-section"><label>5. Trang phục tân thủ</label><div class="avatar-outfit-grid">${AVATAR_V378_OUTFITS.map(x=>`<button class="avatar-outfit-card ${a.outfit===x.id?'selected':''}" type="button" onclick="avatarV378Set('outfit','${x.id}')"><span class="avatar-outfit-swatch"><i style="background:${x.top}"></i><i style="background:${x.accent}"></i><i style="background:${x.bottom}"></i></span><b>${esc(x.label)}</b><small>Starter • 0 vàng</small></button>`).join('')}</div></div>
      <div class="avatar-builder-actions"><button class="btn btn-soft" type="button" onclick="avatarV378ResetDraft()">Đặt lại</button><button class="btn btn-blue" type="button" onclick="avatarV378Save()">${stored?.initialized?'Lưu thay đổi':'Hoàn tất nhân vật'}</button></div>
    </section>
  </div>
  <div class="avatar-future-grid mt">
    <div class="card avatar-future-card"><span>⚡</span><div><b>EXP & Level</b><small>Đã chừa cấu trúc cho v37.9.</small></div><em>Sắp có</em></div>
    <div class="card avatar-future-card"><span>🪙</span><div><b>Vàng</b><small>Phần thưởng học tập, chưa kích hoạt ở v37.8.</small></div><em>Sắp có</em></div>
    <div class="card avatar-future-card"><span>🛍</span><div><b>Shop & Inventory</b><small>Vật phẩm nâng cấp sẽ mở sau khi nền avatar ổn định.</small></div><em>Sắp có</em></div>
  </div>`;
}
function avatarV378ResetDraft(){avatarV378Draft=avatarV378Stored()||avatarV378Starter(avatarV378Current().gender);try{window.v385Wardrobe?.syncBase?.('reset',avatarV378Draft)}catch(_){}avatarV378RenderPage();avatarV378NotifyChanged('reset','')}
async function avatarV378Save(){
  let a=avatarV378Current();a={...a,initialized:true,ownerUid:avatarV378OwnerUid(),updatedAt:new Date().toISOString()};
  state.avatarV378=a;avatarV378Draft=null;save({sync:false,reason:'avatar-v37.8'});
  if(firebaseUser&&firebaseDb&&!firebaseAccountLocked){
    try{await firebaseDb.collection('users').doc(firebaseUser.uid).set({avatarV378:a,updatedAt:firebaseServerTimestamp()},{merge:true});firebaseProfile={...(firebaseProfile||{}),avatarV378:a};firebaseAuditLog?.('profile.avatar.update',{gender:a.gender,hair:a.hair,outfit:a.outfit}).catch?.(()=>{});examToast?.('✓ Đã lưu nhân vật tân thủ');}
    catch(err){console.warn('Avatar  cloud save',err);examToast?.('Đã lưu trên máy; chưa đồng bộ được avatar.')}
  }else examToast?.('Đã lưu avatar trên thiết bị. Đăng nhập để đồng bộ.');
  avatarV378RefreshUI();avatarV378RenderPage();
}
function avatarV378DashboardHtml(){
  const a=avatarV378Stored();
  return `<div class="card avatar-dashboard-card"><div class="avatar-dashboard-visual">${a?avatarV378Svg(a,'mini'):avatarV378GenericSvg('mini')}</div><div class="avatar-dashboard-copy"><div class="avatar-preview-kicker">NHÂN VẬT CỦA EM</div><h3>${esc(avatarV378DisplayName())}</h3><p>${a?.initialized?`Lv.1 • ${esc(AVATAR_V378_RANK)} • Bộ đồ tân thủ đã lưu.`:'Chưa tạo nhân vật. Bắt đầu với bộ đồ tân thủ miễn phí.'}</p><div class="avatar-dashboard-tags"><span>Lv.1</span><span>${esc(AVATAR_V378_RANK)}</span><span>${a?.initialized?'✓ Đã tạo':'Chưa thiết lập'}</span></div></div><button class="btn ${a?.initialized?'btn-soft':'btn-blue'}" onclick="goPage('avatar')">${a?.initialized?'Tùy chỉnh':'Tạo nhân vật'}</button></div>`;
}
function avatarV378RefreshUI(){
  const dash=document.getElementById('avatarV378Dashboard');if(dash)dash.innerHTML=avatarV378DashboardHtml();
  const top=document.getElementById('avatarV378Topbar');if(top){const a=avatarV378Stored();top.innerHTML=`${avatarV378MiniHtml(a)}<span><b>${esc(avatarV378DisplayName())}</b><small>Lv.1 • ${esc(AVATAR_V378_RANK)}</small></span>`;top.classList.toggle('is-ready',!!avatarV378Stored()?.initialized)}
  if(document.getElementById('page-avatar')?.classList.contains('active'))avatarV378RenderPage();
}
function avatarV378PickOnboardingGender(gender){avatarV378OnboardingGender=gender==='female'?'female':'male';document.querySelectorAll('.avatar-onboard-gender').forEach(b=>b.classList.toggle('selected',b.dataset.gender===avatarV378OnboardingGender));let btn=document.getElementById('avatarV378OnboardNext');if(btn)btn.disabled=false}
function avatarV378StartOnboarding(){
  if(!avatarV378OnboardingGender)return;
  avatarV378Draft=avatarV378Starter(avatarV378OnboardingGender);closeModal();goPage('avatar');avatarV378RenderPage();
}
function avatarV378OpenOnboarding(){
  avatarV378OnboardingGender='';
  const male=avatarV378Starter('male'),female=avatarV378Starter('female');
  openModal('Chào mừng tân binh!','Avatar Foundation',`<div class="avatar-onboard-intro"><div class="avatar-onboard-badge">Lv.1</div><div><h4>Tạo nhân vật học tập đầu tiên</h4><p>Chọn Nam hoặc Nữ để nhận bộ đồ tân thủ cơ bản. Sau đó em có thể chọn tóc, tông da và đồng phục miễn phí.</p></div></div><div class="avatar-onboard-grid"><button type="button" class="avatar-onboard-gender" data-gender="male" onclick="avatarV378PickOnboardingGender('male')">${avatarV378Svg(male,'mini')}<b>Nam</b><small>Bắt đầu với nhân vật nam</small></button><button type="button" class="avatar-onboard-gender" data-gender="female" onclick="avatarV378PickOnboardingGender('female')">${avatarV378Svg(female,'mini')}<b>Nữ</b><small>Bắt đầu với nhân vật nữ</small></button></div><div class="avatar-onboard-note"> chỉ có vật phẩm tân thủ miễn phí. EXP, vàng và Shop chưa ảnh hưởng đến điểm số hay kết quả học tập.</div>`,`<button class="btn btn-soft" onclick="closeModal()">Để sau</button><button class="btn btn-blue" id="avatarV378OnboardNext" disabled onclick="avatarV378StartOnboarding()">Tạo nhân vật →</button>`);
}
function avatarV378MaybePrompt(){
  if(!firebaseUser||currentSecureRole()!=='student'||firebaseAccountLocked)return;
  const uid=firebaseUser.uid;if(avatarV378Stored()?.initialized||avatarV378PromptedUid===uid)return;
  avatarV378PromptedUid=uid;setTimeout(()=>{if(firebaseUser?.uid===uid&&!avatarV378Stored()?.initialized)avatarV378OpenOnboarding()},180);
}
function avatarV378AdoptCloud(){
  const uid=avatarV378OwnerUid(),cloud=avatarV378Sanitize(firebaseProfile?.avatarV378,uid);if(!cloud)return;
  state.avatarV378=cloud;try{localStorage.setItem(LOCAL_STATE_KEY,JSON.stringify(state))}catch(_){}
}

// Extend existing student navigation safely without changing teacher/admin access.
try{ROLE_ACCESS.student.add('avatar')}catch(_){}
const avatarV378BaseGoPage=goPage;
goPage=function(page,internal=false){const out=avatarV378BaseGoPage(page,internal);if(page==='avatar')requestAnimationFrame(avatarV378RenderPage);return out};
const avatarV378BaseApplyRoleAccess=applyRoleAccess;
applyRoleAccess=function(role='student',navigate=false){const out=avatarV378BaseApplyRoleAccess(role,navigate);requestAnimationFrame(avatarV378RefreshUI);return out};
const avatarV378BaseFirebaseHydrateUser=firebaseHydrateUser;
firebaseHydrateUser=async function(user){const out=await avatarV378BaseFirebaseHydrateUser(user);avatarV378AdoptCloud();avatarV378RefreshUI();avatarV378MaybePrompt();return out};
const avatarV378BaseRenderDashboard=renderDashboard;
renderDashboard=function(){const out=avatarV378BaseRenderDashboard();avatarV378RefreshUI();return out};

requestAnimationFrame(()=>{avatarV378RefreshUI();if(document.getElementById('page-avatar')?.classList.contains('active'))avatarV378RenderPage()});
