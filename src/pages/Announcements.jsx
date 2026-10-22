import React from 'react';
import {Megaphone} from 'lucide-react';

export default function Announcements({admin,db,mutate,busy}){
 return <>{<div className="projectgrid">{db.announcements.map(a=><article className="panel project" key={a.id}><Megaphone className="pinktext"/><h3>{a.title}</h3><p>{a.message}</p><small>{a.created?new Date(a.created).toLocaleDateString('en-IN'):''}</small>{admin&&<div className="actions" style={{marginTop:18}}><button disabled={busy} aria-label={'Delete announcement: '+a.title} onClick={()=>{if(window.confirm('Delete announcement "'+a.title+'"? This will remove it for everyone.'))mutate('deleteAnnouncement',{id:a.id});}}>Delete announcement</button></div>}</article>)}</div>}</>;
}
