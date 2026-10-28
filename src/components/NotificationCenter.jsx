import {notificationText} from '../i18n/messages.js';
import {usePreferences} from './PreferencesProvider.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {Bell,X} from 'lucide-react';
import {workspaceNotifications} from '../utils/notifications.js';
import {createNotificationMemory,notificationFingerprint} from '../utils/notificationMemory.js';
export default function NotificationCenter({db,user,navigate}){
 const {t,language}=usePreferences();
 const key='teampulse-notifications-'+user.id;
 const memory=useRef(null);
 if(!memory.current){let storage;try{storage=window.localStorage;}catch{}memory.current=createNotificationMemory(user.id,storage);}
 const [items,setItems]=useState(()=>{let saved=[];try{const value=JSON.parse(sessionStorage.getItem(key)||'[]');if(Array.isArray(value))saved=value.filter(item=>item&&typeof item.id==='string'&&typeof item.message==='string'&&typeof item.page==='string'&&item.page!=='Work logs').slice(0,100);}catch{}memory.current.remember(saved);return [...new Map(saved.map(item=>[notificationFingerprint(item.id),item])).values()].map(item=>({...item,read:memory.current.isRead(item.id)})).filter(item=>!item.read);});
 const [open,setOpen]=useState(false),[popup,setPopup]=useState(null);
 const previous=useRef(null);
 useEffect(()=>{
  const initial=!previous.current;
  const events=workspaceNotifications(previous.current,db,user);previous.current=db;
  // Record delivery before showing the popup, so a remount or refresh cannot replay it.
  const result=memory.current.receive(events,initial);
  if(!result.items.length)return;
  const dated=result.items.map(item=>({...item,time:new Date().toISOString()})).reverse();
  setItems(old=>{const existing=new Map(old.map(item=>[notificationFingerprint(item.id),item]));const added=dated.map(item=>initial&&existing.has(notificationFingerprint(item.id))?{...existing.get(notificationFingerprint(item.id)),read:item.read}:item);return [...added,...old.filter(item=>!added.some(event=>notificationFingerprint(event.id)===notificationFingerprint(item.id)))].slice(0,100);});
  if(result.fresh.length)setPopup({...dated[0],extra:result.fresh.length-1});
 },[db,user.id,user.role]);
 useEffect(()=>{try{sessionStorage.setItem(key,JSON.stringify(items));}catch{}},[items,key]);
 useEffect(()=>{if(!popup)return;const timer=setTimeout(()=>setPopup(null),7000);return()=>clearTimeout(timer);},[popup]);
 useEffect(()=>{const sync=event=>{if(event.key!==memory.current.key)return;setItems(old=>old.map(item=>({...item,read:item.read||memory.current.isRead(item.id)})));setPopup(old=>old&&memory.current.isRead(old.id)?null:old);};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 useEffect(()=>{if(!open)return;const close=event=>{if(event.key==='Escape')setOpen(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[open]);
 // Opening the inbox counts the displayed messages as seen. Keep them visible until it closes.
 useEffect(()=>{if(open){const ids=items.filter(item=>!item.read).map(item=>item.id);if(ids.length){memory.current.markRead(ids);setItems(old=>old.map(item=>ids.includes(item.id)?{...item,read:true}:item));}setPopup(null);}else{setItems(old=>old.some(item=>item.read)?old.filter(item=>!item.read):old);}},[open,items]);
 const unread=items.filter(item=>!item.read).length;
 function markRead(ids){memory.current.markRead(ids);setItems(old=>old.map(item=>ids.includes(item.id)?{...item,read:true}:item));}
 function dismiss(){if(popup)markRead([popup.id]);setPopup(null);}
 function visit(item){markRead([item.id]);navigate(item.page);setOpen(false);setPopup(null);}
 return <div className="notifications"><button aria-label={`Notifications${unread?', '+unread+' unread':''}`} aria-expanded={open} aria-controls="notification-inbox" onClick={()=>setOpen(!open)}><Bell size={18}/>{unread>0&&<span className="notificationcount">{unread>99?'99+':unread}</span>}</button>{open&&<section id="notification-inbox" className="notificationinbox" aria-label={t("Notifications")}><div className="notificationheading"><strong>{t("Notifications")}</strong><button className="textbtn" onClick={()=>{markRead(items.map(item=>item.id));setPopup(null);}} disabled={!unread}>{t("Mark all read")}</button><button aria-label={t("Close notifications")} onClick={()=>setOpen(false)}><X size={16}/></button></div><div className="notificationlist">{items.length?items.map(item=><button key={item.id} className={item.read?'notificationitem':'notificationitem unread'} onClick={()=>visit(item)}><span>{notificationText(language,item.message)}</span><small>{t(item.page==='Employees'&&!['Admin','HR'].includes(user.role)?'Teammates':item.page)} · {new Date(item.time).toLocaleString(language==='hi'?'hi-IN':'en-IN',{timeZone:'Asia/Kolkata'})} IST</small></button>):<p className="notificationempty">{t("You’re all caught up.")}</p>}</div></section>}{popup&&<div className="notificationpopup" role="status"><button onClick={()=>visit(popup)}><Bell size={18}/><span>{notificationText(language,popup.message)}{popup.extra>0&&<small>{t('{count} more updates in notifications',{count:popup.extra})}</small>}</span></button><button aria-label={t("Dismiss notification")} onClick={dismiss}><X size={16}/></button></div>}</div>;
}
