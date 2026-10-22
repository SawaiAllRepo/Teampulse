/* Private server helpers: trailing underscores prevent direct google.script.run calls. */
function authError_(){const e=new Error('Your session has expired. Please log in again.');e.code='UNAUTHENTICATED';return e;}
function email_(value){require_(typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),'Enter a valid email address.');return value.trim().toLowerCase();}
function password_(value){require_(typeof value==='string'&&value.length>=12&&!bcrypt.truncates(value),'Password must contain at least 12 characters and at most 72 UTF-8 bytes.');}
function digest_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(b=>(b&255).toString(16).padStart(2,'0')).join('');}
function hashPassword_(password){password_(password);const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,Utilities.getUuid()+Utilities.getUuid(),Utilities.Charset.UTF_8).slice(0,16).map(b=>b&255);return bcrypt.hashSync(password,'$2b$12$'+bcrypt.encodeBase64(bytes,16));}
function publicUser_(u){return Object.fromEntries(SCHEMA.employees.map(k=>[k,u[k]||'']));}
function limitAuth_(action){const props=PropertiesService.getScriptProperties();const key='AUTH_RATE_'+action;let r;try{r=JSON.parse(props.getProperty(key)||'null');}catch{}const now=Date.now();if(!r||now-r.start>=900000)r={start:now,count:0};require_(r.count<(action==='register'?20:150),'Too many requests. Please try again later.');r.count++;props.setProperty(key,JSON.stringify(r));}
function audit_(actor,action,target){append_('audit',{id:Utilities.getUuid(),actor,action,target,created:new Date().toISOString()});}
function authentication_(action,p){
 limitAuth_(action);const email=email_(p.email);if(action==='register')password_(p.password);else require_(typeof p.password==='string'&&p.password.length>0&&!bcrypt.truncates(p.password),'Enter your password.');
 const existing=rows_('employees').find(e=>e.email.toLowerCase()===email);let credential=rows_('credentials').find(c=>c.email===email);
 if(action==='register'){
 require_(!credential,'This account already exists. Use Log in.');
 require_(!existing||!['Admin','HR','Team Leader'].includes(existing.role),'This account is managed by your administrator.');
 ['name','department','designation'].forEach(k=>require_(typeof p[k]==='string'&&p[k].trim().length>=2&&p[k].length<=150,'Enter your '+k+'.'));
 const now=new Date().toISOString();const u=existing||{id:Utilities.getUuid(),email,created:now};
 u.name=p.name.trim();u.department=p.department.trim();u.designation=p.designation.trim();u.role='Employee';u.status='Pending';
 const passwordHash=hashPassword_(p.password);
 if(existing)update_('employees',u);else append_('employees',u);
 append_('credentials',{id:Utilities.getUuid(),employeeId:u.id,email,passwordHash,failedAttempts:0,lockedUntil:'',created:now,lastLogin:''});audit_(u.id,'register',u.id);
 return {pending:true,message:'Your account has been created. Admin/HR can now see your profile in Employees. Once approved, log in with your email and password.'};
 }
 // A fixed dummy bcrypt comparison makes unknown accounts follow the same expensive path.
 require_(!credential||!credential.lockedUntil||Date.parse(credential.lockedUntil)<=Date.now(),'Too many failed attempts. Try again after 15 minutes.');
 const valid=bcrypt.compareSync(p.password,credential?credential.passwordHash:'$2b$12$LQv3c1yqBWVHxkd0LHAkCOYHVEfFQRH7V6M4K8E9Q0fR4/46.dJLS');
 if(!credential||!valid){if(credential){credential.failedAttempts=Number(credential.failedAttempts||0)+1;if(credential.failedAttempts>=5){credential.lockedUntil=new Date(Date.now()+900000).toISOString();credential.failedAttempts=0;}update_('credentials',credential);}throw Error('Email or password is incorrect.');}
 const u=rows_('employees').find(e=>e.id===credential.employeeId);require_(u,'Account unavailable. Contact your administrator.');
 require_(u.status==='Active',u.status==='Pending'?'Your account is awaiting Admin/HR approval.':'Your account is inactive. Contact your administrator.');
 credential.failedAttempts=0;credential.lockedUntil='';credential.lastLogin=new Date().toISOString();update_('credentials',credential);
 const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
 append_('sessions',{id:Utilities.getUuid(),employeeId:u.id,tokenHash:digest_(token),expires:new Date(Date.now()+28800000).toISOString(),revoked:'',created:new Date().toISOString()});audit_(u.id,'login',u.id);
 return {token,user:publicUser_(u),db:state_(u)};
}
function revokeSessions_(employeeId){rows_('sessions').filter(s=>s.employeeId===employeeId&&!s.revoked).forEach(s=>{s.revoked=new Date().toISOString();update_('sessions',s);});}
function changePassword_(u,p){password_(p.newPassword);require_(typeof p.currentPassword==='string'&&!bcrypt.truncates(p.currentPassword),'Current password is invalid.');const c=rows_('credentials').find(c=>c.employeeId===u.id);require_(c&&bcrypt.compareSync(p.currentPassword,c.passwordHash),'Current password is incorrect.');c.passwordHash=hashPassword_(p.newPassword);c.failedAttempts=0;c.lockedUntil='';update_('credentials',c);revokeSessions_(u.id);audit_(u.id,'changePassword',u.id);}

// Coordinates are supplied by the device. Legacy clients may record an unavailable status.
function validLocation_(l){return !!l&&l.status==='captured'&&typeof l.latitude==='number'&&isFinite(l.latitude)&&Math.abs(l.latitude)<=90&&typeof l.longitude==='number'&&isFinite(l.longitude)&&Math.abs(l.longitude)<=180&&typeof l.accuracy==='number'&&isFinite(l.accuracy)&&l.accuracy>=0;}
function accessEvent_(u,action,location,attendanceId){
 const book=spreadsheet_();if(!book.getSheetByName('accessEvents')){const sheet=book.insertSheet('accessEvents');sheet.appendRow(SCHEMA.accessEvents);sheet.setFrozenRows(1);}
 const l=location||{};const valid=validLocation_(l);
 const status=valid?'captured':['denied','blocked','timeout','unavailable','unsupported','insecure'].includes(l.status)?l.status:'unavailable';
 const event={id:attendanceId?attendanceId+':'+action:Utilities.getUuid(),employeeId:u.id,action,status,latitude:valid?l.latitude:'',longitude:valid?l.longitude:'',accuracy:valid?l.accuracy:'',created:new Date().toISOString()};append_('accessEvents',event);return event;
}
function setInitialPassword_(u,p){
 require_(['Admin','HR'].includes(u.role),'Permission denied.');const e=rows_('employees').find(e=>e.id===p.employeeId);require_(e,'Employee not found.');
 require_(u.role==='Admin'||!['Admin','HR'].includes(e.role),'Only Admin can manage privileged accounts.');require_(!rows_('credentials').some(c=>c.employeeId===e.id),'This account already has a password.');password_(p.password);
 append_('credentials',{id:Utilities.getUuid(),employeeId:e.id,email:e.email.toLowerCase(),passwordHash:hashPassword_(p.password),failedAttempts:0,lockedUntil:'',created:new Date().toISOString(),lastLogin:''});audit_(u.id,'setInitialPassword',e.id);
}
