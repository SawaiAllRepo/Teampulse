import React from 'react';
import {time} from '../utils/format.js';
import Records from '../components/Records.jsx';

export default function LeaveRequests({admin,leaves,employee,badge,mutate,busy}){
 return <>{<section className="panel"><div className="panelhead"><h3>Leave requests</h3><span className="muted">{admin?'Review your team’s requests':'Track your time off'}</span></div><Records rows={leaves} columns={[['employeeId','Employee',employee],['type','Type'],['start','From'],['end','To'],['reason','Reason'],['status','Status',badge]]} extra={admin?l=>l.status==='Pending'?<div className="actions"><button disabled={busy} onClick={()=>mutate('leaveDecision',{id:l.id,status:'Approved'})}>Approve</button><button disabled={busy} onClick={()=>mutate('leaveDecision',{id:l.id,status:'Rejected'})}>Reject</button></div>:null:null}/></section>}</>;
}
