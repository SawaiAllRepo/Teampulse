export const leaveTypes=['Casual','Sick','Earned/Annual','Unpaid','Other'];
export const defaultLeavePolicy={workingDays:[1,2,3,4,5,6],holidays:[],approverId:''};
export function leaveUnits(record,policy=defaultLeavePolicy){
 const start=Date.parse(record.start+'T00:00:00Z'),end=Date.parse(record.end+'T00:00:00Z');
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<start||end-start>365*86400000)return [];
 const half=record.duration==='Half day';if(half&&(start!==end||!['First half','Second half'].includes(record.half)))return [];
 const working=new Set(policy.workingDays||[1,2,3,4,5,6]),holidays=new Set(policy.holidays||[]),units=[];
 for(let stamp=start;stamp<=end;stamp+=86400000){const date=new Date(stamp),day=date.toISOString().slice(0,10);if(working.has(date.getUTCDay())&&!holidays.has(day))units.push({day,mask:half?(record.half==='First half'?1:2):3});}
 return units;
}
export function totalLeaveDays(record,policy=defaultLeavePolicy){return leaveUnits(record,policy).reduce((days,unit)=>days+(unit.mask===3?1:0.5),0);}
export function leaveOverlaps(a,b,policy=defaultLeavePolicy){const other=new Map(leaveUnits(b,policy).map(unit=>[unit.day,unit.mask]));return leaveUnits(a,policy).some(unit=>(other.get(unit.day)||0)&unit.mask);}
