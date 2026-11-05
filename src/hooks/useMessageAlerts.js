import {useEffect,useState} from 'react';
import {request} from '../data/client.js';
export default function useMessageAlerts(userId){
 const [snapshot,setSnapshot]=useState({messages:[],people:[]}),[popup,setPopup]=useState(null);
 useEffect(()=>{setSnapshot({messages:[],people:[]});setPopup(null);if(!userId)return;let active=true,inFlight=false,version=0;const seen=new Set();
  function accept(data){if(!active)return;const incoming=data.messages.filter(m=>m.recipientId===userId&&!m.readAt);const fresh=incoming.filter(m=>!seen.has(m.id));data.messages.forEach(m=>seen.add(m.id));setSnapshot(data);if(fresh.length){const message=fresh.sort((a,b)=>b.created.localeCompare(a.created))[0];setPopup({message,person:data.people.find(p=>p.id===message.senderId)});}else setPopup(old=>old&&!incoming.some(m=>m.id===old.message.id)?null:old);}
  async function refresh(){if(inFlight||document.visibilityState==='hidden')return;inFlight=true;const current=++version;try{const data=await request('messageSnapshot');if(active&&current===version)accept(data);}catch{}finally{inFlight=false;}}
  const sync=event=>{version++;accept(event.detail);};window.addEventListener('teampulse-messages',sync);window.addEventListener('focus',refresh);refresh();const timer=setInterval(refresh,10000);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('teampulse-messages',sync);window.removeEventListener('focus',refresh);};
 },[userId]);
 useEffect(()=>{if(!popup)return;const timer=setTimeout(()=>setPopup(null),7000);return()=>clearTimeout(timer);},[popup]);
 return {unread:snapshot.messages.filter(m=>m.recipientId===userId&&!m.readAt).length,popup,dismiss:()=>setPopup(null)};
}
