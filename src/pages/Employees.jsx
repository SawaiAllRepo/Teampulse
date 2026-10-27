import React from 'react';

export default function Employees({db,initials,badge}){
 const employees=db.employees.filter(e=>e.status!=='Deleted');
 return <section className="panel"><div className="panelhead"><h3>Our people</h3><span className="muted">{employees.length} {employees.length===1?'employee':'employees'}</span></div><div className="peoplegrid">{employees.map(e=><article className="personcard" key={e.id}><i>{e.photoUrl?<img src={e.photoUrl} alt={e.name} referrerPolicy="no-referrer" style={{width:48,height:48,borderRadius:24,objectFit:'cover'}}/>:initials(e.name)}</i><h3>{e.name}</h3><p>{[e.designation,e.department].filter(Boolean).join(' · ')}</p>{badge(e.role+' access')}<hr/><small>ID: {e.employeeCode||e.id}</small><small>Manager: {db.employees.find(m=>m.id===e.managerId)?.name||'Not set'}</small><small>Joined: {e.joiningDate||'Not set'}</small><small>{e.employmentType||'Employment type not set'}</small><a href={'mailto:'+e.email}>{e.email}</a><div className="employeeaccess">{badge(e.status)}</div></article>)}</div>{!employees.length&&<div className="empty">No employees to display.</div>}</section>;
}
