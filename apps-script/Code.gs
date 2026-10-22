/* TeamPulse password authentication and Sheets storage.
 * Run setup() with ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD before first deployment.
 * TeamPulse — owner-approved public web app; app sessions protect business records.
 * Set SPREADSHEET_ID and ADMIN_EMAIL in Project Settings > Script Properties. */
const TEAMPULSE_SPREADSHEET_ID = '1zsY6TWHvstFcN39kAGQziLwJG-jztdGwllS3SU-RxLs';
const SCHEMA = {
 employees:['id','name','email','role','department','designation','status','created'],
 projects:['id','name','department','owner','status','due','description','created'],
 tasks:['id','title','projectId','assignee','priority','status','due','created'],
 attendance:['id','employeeId','date','checkIn','checkOut','created'],
 worklogs:['id','employeeId','date','summary','hours','blockers','created'],
 leaves:['id','employeeId','type','start','end','reason','status','reviewer','created'],
 announcements:['id','title','message','created'],
 audit:['id','actor','action','target','created'],
 credentials:['id','employeeId','email','passwordHash','failedAttempts','lockedUntil','created','lastLogin'],
 accessEvents:['id','employeeId','action','status','latitude','longitude','accuracy','created'],
 sessions:['id','employeeId','tokenHash','expires','revoked','created']
};
let requestBook_=null;
function spreadsheet_(){if(requestBook_)return requestBook_;const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')||TEAMPULSE_SPREADSHEET_ID;return requestBook_=SpreadsheetApp.openById(id)}
function setup(){
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
 const props=PropertiesService.getScriptProperties();require_(props.getProperty('ADMIN_EMAIL'),'Set ADMIN_EMAIL in Script Properties before setup.');const email=email_(props.getProperty('ADMIN_EMAIL'));const book=spreadsheet_();
 if(!book.getSheetByName('credentials')||!rows_('credentials').some(c=>c.email===email))password_(props.getProperty('ADMIN_INITIAL_PASSWORD'));
 Object.keys(SCHEMA).forEach(k=>{let sheet=book.getSheetByName(k);if(!sheet){sheet=book.insertSheet(k);sheet.appendRow(SCHEMA[k]);sheet.setFrozenRows(1);}});
 const employees=rows_('employees');const credentials=rows_('credentials');
 const matches=credentials.filter(c=>String(c.email).trim().toLowerCase()===email);
 require_(matches.length<=1,'Multiple Admin credentials found. Resolve duplicate rows before setup.');
 const credential=matches[0];
 const profiles=employees.filter(e=>String(e.email).trim().toLowerCase()===email);
 require_(profiles.length<=1,'Multiple Admin profiles found. Resolve duplicate rows before setup.');
 let admin=profiles[0];
 // Only owner-run setup repairs this link; login must never grant roles or recreate profiles.
 if(credential){
 require_(typeof credential.employeeId==='string'&&credential.employeeId.trim().length>0,'Admin credential has no employeeId. Restore it from backup.');
 const linked=employees.find(e=>e.id===credential.employeeId);
 require_(!linked||(admin&&linked.id===admin.id),'Admin credential points to another employee. Restore the correct link from backup.');
 require_(!credentials.some(c=>c!==credential&&c.employeeId===(admin?admin.id:credential.employeeId)),'Another credential uses the Admin profile. Resolve the conflict before setup.');
 }
 if(admin)require_(admin.role==='Admin'&&admin.status==='Active','ADMIN_EMAIL must belong to an active Admin.');
 if(!admin){admin={id:credential?credential.employeeId:Utilities.getUuid(),name:'Workspace Admin',email,role:'Admin',department:'Management',designation:'Administrator',status:'Active',created:new Date().toISOString()};append_('employees',admin);}
 if(credential){
 if(credential.employeeId!==admin.id||credential.email!==email){credential.employeeId=admin.id;credential.email=email;update_('credentials',credential);}
 }else{
 const password=props.getProperty('ADMIN_INITIAL_PASSWORD');password_(password);append_('credentials',{id:Utilities.getUuid(),employeeId:admin.id,email,passwordHash:hashPassword_(password),failedAttempts:0,lockedUntil:'',created:new Date().toISOString(),lastLogin:''});props.deleteProperty('ADMIN_INITIAL_PASSWORD');
 }
 }finally{lock.releaseLock();}
}
function doGet(){return HtmlService.createHtmlOutputFromFile('Index').setTitle('TeamPulse · Sawai Associates')}
function rows_(k){const sheet=spreadsheet_().getSheetByName(k);if(!sheet)throw Error('Run setup() before opening TeamPulse.');const data=sheet.getDataRange().getValues();if(JSON.stringify((data[0]||[]).slice(0,SCHEMA[k].length))!==JSON.stringify(SCHEMA[k]))throw Error('Unexpected columns in '+k);return data.slice(1).filter(r=>r[0]).map(r=>Object.fromEntries(SCHEMA[k].map((h,i)=>[h,sheetValue_(h,r[i])])))}
function cell_(v){return typeof v==='string'&&/^[=+\-@]/.test(v)?"'"+v:v}
function append_(k,r){spreadsheet_().getSheetByName(k).appendRow(SCHEMA[k].map(h=>cell_(r[h]??'')))}
function update_(k,r){const s=spreadsheet_().getSheetByName(k);const ids=s.getRange(1,1,s.getLastRow(),1).getValues();const i=ids.findIndex(row=>row[0]===r.id);if(i<1)throw Error('Record not found.');s.getRange(i+1,1,1,SCHEMA[k].length).setValues([SCHEMA[k].map(h=>cell_(r[h]??''))])}
function require_(condition,message){if(!condition)throw Error(message||'Permission denied.')}
function currentUser_(token){
 if(typeof token!=='string'||token.length<40||token.length>200)throw authError_();
 const session=rows_('sessions').find(x=>x.tokenHash===digest_(token)&&!x.revoked&&Date.parse(x.expires)>Date.now());
 if(!session)throw authError_();
 const u=rows_('employees').find(e=>e.id===session.employeeId&&e.status==='Active');if(!u)throw authError_();return u;
}
function state_(u){const db={};Object.keys(SCHEMA).filter(k=>!['audit','credentials','sessions','accessEvents'].includes(k)).forEach(k=>db[k]=rows_(k));const admin=['Admin','HR'].includes(u.role);if(!admin){if(u.role==='Team Leader'){db.projects=db.projects.filter(p=>p.owner===u.id);db.tasks=db.tasks.filter(t=>db.projects.some(p=>p.id===t.projectId));const people=new Set([u.id,...db.tasks.map(t=>t.assignee)]);db.employees=db.employees.filter(e=>people.has(e.id));db.attendance=db.attendance.filter(a=>people.has(a.employeeId));db.worklogs=db.worklogs.filter(w=>people.has(w.employeeId))}else{db.tasks=db.tasks.filter(t=>t.assignee===u.id);db.projects=db.projects.filter(p=>db.tasks.some(t=>t.projectId===p.id));db.employees=db.employees.filter(e=>e.id===u.id);db.attendance=db.attendance.filter(a=>a.employeeId===u.id);db.worklogs=db.worklogs.filter(w=>w.employeeId===u.id)}db.leaves=db.leaves.filter(l=>l.employeeId===u.id)}return db}
function validate_(k,r,u){const required={employees:['name','email','role','department','designation'],projects:['name','department','owner','due','status','description'],tasks:['title','projectId','assignee','priority','status','due'],worklogs:['date','summary','hours'],leaves:['type','start','end','reason'],announcements:['title','message']};required[k].forEach(f=>require_(String(r[f]??'').trim(),'Missing '+f));Object.values(r).forEach(v=>require_(typeof v==='string'&&v.length<=1000,'Invalid field value.'));['date','due','start','end'].filter(f=>r[f]).forEach(f=>require_(/^\d{4}-\d{2}-\d{2}$/.test(r[f])&&!isNaN(Date.parse(r[f]))&&new Date(r[f]).toISOString().slice(0,10)===r[f],'Invalid date.'));if(k==='employees'){require_(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email),'Invalid email.');r.email=r.email.toLowerCase();require_(['Admin','HR','Team Leader','Employee'].includes(r.role),'Invalid role.');require_(!rows_('employees').some(e=>e.email.toLowerCase()===r.email),'Email already exists.');require_(u.role==='Admin'||!['Admin','HR'].includes(r.role),'Only Admin can create privileged accounts.');r.status='Active'}if(k==='projects'){require_(rows_('employees').some(e=>e.id===r.owner&&['Admin','Team Leader'].includes(e.role)),'Invalid project owner.');require_(['Planning','In progress','Completed'].includes(r.status),'Invalid project status.');require_(u.role!=='Team Leader'||r.owner===u.id,'You can only create your own projects.')}if(k==='tasks'){const p=rows_('projects').find(p=>p.id===r.projectId);require_(p,'Project not found.');require_(['Admin','HR'].includes(u.role)||p.owner===u.id);require_(rows_('employees').some(e=>e.id===r.assignee&&e.status==='Active'),'Invalid assignee.');require_(['Low','Medium','High'].includes(r.priority)&&['To do','In progress','Done'].includes(r.status),'Invalid task values.')}if(k==='worklogs'){require_(Number(r.hours)>0&&Number(r.hours)<=24,'Hours must be between 0 and 24.');require_(r.date<=Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd'),'Work logs cannot be in the future.');r.employeeId=u.id}if(k==='leaves'){require_(r.end>=r.start,'Invalid leave date range.');require_(['Casual','Sick','Earned'].includes(r.type),'Invalid leave type.');r.employeeId=u.id;r.status='Pending';require_(!rows_('leaves').some(l=>l.employeeId===u.id&&l.status!=='Rejected'&&l.start<=r.end&&l.end>=r.start),'Leave overlaps an existing request.')}}
function api(req){requestBook_=null;const lock=LockService.getScriptLock();try{require_(req&&typeof req.action==='string','Invalid request.');if(!['bootstrap','accessHistory','attendanceSnapshot'].includes(req.action))lock.waitLock(30000);const p=req.payload||{};
 if(req.action==='checkAccount'){limitAuth_('checkAccount');const email=email_(p.email);return {ok:true,data:{exists:rows_('credentials').some(c=>c.email===email)}};}
 if(['register','login'].includes(req.action))return {ok:true,data:authentication_(req.action,p)};
 const u=currentUser_(req.token);
 if(req.action==='logout'){rows_('sessions').filter(x=>x.tokenHash===digest_(req.token)).forEach(x=>{x.revoked=new Date().toISOString();update_('sessions',x);});audit_(u.id,'logout',u.id);return {ok:true,data:{}};}
 if(req.action==='setInitialPassword'){setInitialPassword_(u,p);return {ok:true,data:{}};}
 if(req.action==='attendanceSnapshot')return {ok:true,data:attendanceSnapshot_(u)};
 if(req.action==='accessHistory'){return {ok:true,data:{events:(spreadsheet_().getSheetByName('accessEvents')?rows_('accessEvents'):[]).filter(e=>['punchIn','punchOut'].includes(e.action)&&(['Admin','HR'].includes(u.role)||e.employeeId===u.id)).slice(-200).reverse()}};}
 if(req.action==='updateProfile'){require_(typeof p.name==='string'&&p.name.trim().length>0&&p.name.trim().length<=100,'Enter a name between 1 and 100 characters.');require_(Object.keys(p).every(k=>k==='name'),'Only your name can be edited here.');const profile=rows_('employees').find(e=>e.id===u.id);require_(profile,'Account not found.');profile.name=p.name.trim();update_('employees',profile);audit_(u.id,'updateProfile',u.id);return {ok:true,data:{user:publicUser_(profile),db:state_(profile)}};}
 if(req.action==='changePassword'){changePassword_(u,p);return {ok:true,data:{}};}
 const admin=['Admin','HR'].includes(u.role);const lead=admin||u.role==='Team Leader';if(req.action==='bootstrap')return {ok:true,data:{db:state_(u),user:u,attendanceLocationVersion:1}};let target='';if(req.action==='employeeAccess'){
 require_(admin);const e=rows_('employees').find(x=>x.id===p.id);require_(e&&e.status!=='Deleted','Employee not found.');require_(e.id!==u.id,'Ask another administrator to change your own role or access.');
 require_(['Active','Pending','Inactive'].includes(p.status)&&['Admin','HR','Team Leader','Employee'].includes(p.role),'Invalid access settings.');
 require_(u.role==='Admin'||(!['Admin','HR'].includes(e.role)&&!['Admin','HR'].includes(p.role)),'Only Admin can change privileged access.');
 require_(e.role!=='Admin'||(p.role==='Admin'&&p.status==='Active')||rows_('employees').some(x=>x.id!==e.id&&x.role==='Admin'&&x.status==='Active'),'Keep at least one active Admin.');
 e.role=p.role;e.status=p.status;update_('employees',e);if(e.status!=='Active')revokeSessions_(e.id);target=e.id;
 }else if(req.action==='deleteEmployee'){require_(admin,'Only Admin and HR can delete employees.');const employee=rows_('employees').find(e=>e.id===p.id&&e.status!=='Deleted');require_(employee,'Employee not found.');require_(employee.id!==u.id,'You cannot delete your own account.');require_(u.role==='Admin'||!['Admin','HR'].includes(employee.role),'Only Admin can delete privileged accounts.');require_(employee.role!=='Admin'||rows_('employees').some(e=>e.id!==employee.id&&e.role==='Admin'&&e.status==='Active'),'Keep at least one active Admin.');revokeSessions_(employee.id);employee.status='Deleted';update_('employees',employee);target=employee.id}else if(req.action==='deleteProject'){require_(admin,'Only Admin and HR can delete projects.');require_(typeof p.id==='string'&&p.id.length>0,'Project ID is required.');require_(rows_('projects').some(project=>project.id===p.id),'Project not found.');const linked=new Set(rows_('tasks').filter(task=>task.projectId===p.id).map(task=>task.id));const taskSheet=spreadsheet_().getSheetByName('tasks');const taskIds=taskSheet.getRange(1,1,taskSheet.getLastRow(),1).getValues();for(let index=taskIds.length-1;index>0;index--)if(linked.has(taskIds[index][0]))taskSheet.deleteRow(index+1);const sheet=spreadsheet_().getSheetByName('projects');const ids=sheet.getRange(1,1,sheet.getLastRow(),1).getValues();const index=ids.findIndex(row=>row[0]===p.id);require_(index>0,'Project not found.');sheet.deleteRow(index+1);target=p.id}else if(req.action==='deleteAnnouncement'){require_(admin,'Only Admin and HR can delete announcements.');require_(typeof p.id==='string'&&p.id.length>0,'Announcement ID is required.');require_(rows_('announcements').some(a=>a.id===p.id),'Announcement not found.');const sheet=spreadsheet_().getSheetByName('announcements');const ids=sheet.getRange(1,1,sheet.getLastRow(),1).getValues();const index=ids.findIndex(row=>row[0]===p.id);require_(index>0,'Announcement not found.');sheet.deleteRow(index+1);target=p.id}else if(req.action==='create'){const k=p.collection;require_(['employees','projects','tasks','worklogs','leaves','announcements'].includes(k),'Unknown collection.');require_(['employees','announcements'].includes(k)?admin:['projects','tasks'].includes(k)?lead:true);require_(p.record&&typeof p.record==='object','Invalid record.');const r={};SCHEMA[k].filter(f=>!['id','created','employeeId','reviewer'].includes(f)).forEach(f=>{if(p.record[f]!==undefined)r[f]=p.record[f]});validate_(k,r,u);r.id=Utilities.getUuid();r.created=new Date().toISOString();append_(k,r);target=r.id}else if(req.action==='taskStatus'){const t=rows_('tasks').find(t=>t.id===p.id);require_(t,'Task not found.');require_(admin||t.assignee===u.id||rows_('projects').some(x=>x.id===t.projectId&&x.owner===u.id));require_(['To do','In progress','Done'].includes(p.status),'Invalid status.');t.status=p.status;update_('tasks',t);target=t.id}else if(req.action==='leaveDecision'){require_(admin);const l=rows_('leaves').find(l=>l.id===p.id);require_(l&&l.status==='Pending','Leave is missing or already reviewed.');require_(l.employeeId!==u.id,'You cannot review your own leave.');require_(['Approved','Rejected'].includes(p.status),'Invalid decision.');l.status=p.status;l.reviewer=u.id;update_('leaves',l);target=l.id}else if(req.action==='attendance'){if(p.requireLocation===true)require_(validLocation_(p.location),'A valid current location is required. Allow location and try again.');const closedAttendanceIds=[];const date=Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd');const matches=rows_('attendance').filter(a=>String(a.employeeId)===String(u.id)&&a.date===date);let a=(p.kind==='out'&&p.attendanceId?matches.find(a=>String(a.id)===String(p.attendanceId)):null)||matches.find(a=>a.checkIn&&!a.checkOut)||matches[0];require_(['in','out'].includes(p.kind),'Invalid attendance action.');if(p.kind==='in'){require_(!matches.some(row=>row.checkIn&&!row.checkOut),'Punch out your open attendance before punching in again.');a={id:Utilities.getUuid(),employeeId:u.id,date,checkIn:new Date().toISOString(),checkOut:'',created:new Date().toISOString()};append_('attendance',a)}else{require_(a&&a.checkIn&&!a.checkOut,'No open punch-in for your account today. Attendance shown for other employees cannot be punched out by you.');a.checkOut=new Date().toISOString();update_('attendance',a);closedAttendanceIds.push(a.id);matches.filter(other=>other.id!==a.id&&other.checkIn&&!other.checkOut).forEach(other=>{other.checkOut=a.checkOut;update_('attendance',other);closedAttendanceIds.push(other.id);})}const event=accessEvent_(u,p.kind==='in'?'punchIn':'punchOut',p.location,a.id);target=a.id;if(p.compact===true){audit_(u.id,'attendance',a.id);return {ok:true,data:{attendance:a,event,closedAttendanceIds}};}}else throw Error('Unknown action.');append_('audit',{id:Utilities.getUuid(),actor:u.id,action:req.action,target,created:new Date().toISOString()});return {ok:true,data:{db:state_(u)}}}catch(e){console.error('TeamPulse request failed: '+(req&&req.action));return {ok:false,code:e.code,error:e.message||'Unable to complete request.'}}finally{requestBook_=null;if(lock.hasLock())lock.releaseLock()}}


function doPost(e){let r;try{const text=e&&e.postData&&e.postData.contents;require_(typeof text==='string'&&text.length<=32768,'Invalid request.');r=api(JSON.parse(text));}catch{r={ok:false,error:'Invalid request.'};}return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);}

// Sheets auto-converts yyyy-MM-dd text into Date cells. Keep calendar dates separate from timestamps.
function sheetValue_(field,value){
 if(['date','due','start','end'].includes(field)&&typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(value)&&!isNaN(Date.parse(value)))return Utilities.formatDate(new Date(value),'Asia/Kolkata','yyyy-MM-dd');
 if(Object.prototype.toString.call(value)==='[object Date]'){
 if(['date','due','start','end'].includes(field)){const book=spreadsheet_();const zone=book.getSpreadsheetTimeZone?book.getSpreadsheetTimeZone():'Asia/Kolkata';return Utilities.formatDate(value,zone,'yyyy-MM-dd');}
 return value.toISOString();
 }
 return value;
}

function attendanceSnapshot_(u){
 const admin=['Admin','HR'].includes(u.role);const people=new Set([String(u.id)]);
 if(u.role==='Team Leader'){const projects=rows_('projects').filter(p=>p.owner===u.id);rows_('tasks').filter(t=>projects.some(p=>p.id===t.projectId)).forEach(t=>people.add(String(t.assignee)));}
 const attendance=rows_('attendance').filter(a=>admin||people.has(String(a.employeeId)));
 const events=(spreadsheet_().getSheetByName('accessEvents')?rows_('accessEvents'):[]).filter(e=>['punchIn','punchOut'].includes(e.action)&&(admin||String(e.employeeId)===String(u.id))).reverse();
 return {attendance,events,syncedAt:new Date().toISOString()};
}
