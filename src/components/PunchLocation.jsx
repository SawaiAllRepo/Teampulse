import React from 'react';
import {locationMessage} from '../utils/location.js';
export default function PunchLocation({event,label}){
 if(!event)return <div className="punchlocation"><b>{label}</b><p>No saved location received for this punch. Refresh attendance; older deployments may not have recorded it.</p></div>;
 if(event.status!=='captured')return <div className="punchlocation"><b>{label}</b><p>{locationMessage(event)}</p></div>;
 const latitude=Number(event.latitude),longitude=Number(event.longitude);
 if(event.latitude===''||event.longitude===''||event.latitude==null||event.longitude==null||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return <p>Saved coordinates are invalid.</p>;
 return <div className="punchlocation"><b>{label}</b><p>{latitude.toFixed(6)}, {longitude.toFixed(6)}<br/>Accuracy: {Math.round(Number(event.accuracy))} m<br/>{new Date(event.created).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</p></div>;
}
