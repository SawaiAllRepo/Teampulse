export function shiftDay(value){if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value;const stamp=value instanceof Date?value.getTime():Date.parse(value);return Number.isFinite(stamp)?new Date(stamp+330*60000).toISOString().slice(0,10):'';}
export function shiftPunch(value,day){if(!value)return NaN;if(/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)){const parts=value.split(':');return Date.parse(day+'T'+parts[0].padStart(2,'0')+':'+parts[1]+':'+(parts[2]||'00')+'+05:30');}return Date.parse(value);}
export function shiftMinutes(records,employeeId,day,now=Date.now()){
 const start=Date.parse(day+'T09:30:00+05:30'),end=Math.min(Number(now),Date.parse(day+'T18:30:00+05:30'));if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return 0;
 const intervals=records.filter(row=>String(row.employeeId)===String(employeeId)&&shiftDay(row.date)===day).map(row=>[Math.max(start,shiftPunch(row.checkIn,day)),Math.min(end,row.checkOut?shiftPunch(row.checkOut,day):Number(now))]).filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>a).sort((a,b)=>a[0]-b[0]);
 let total=0,lastEnd=start;for(const [a,b] of intervals){total+=Math.max(0,b-Math.max(a,lastEnd));lastEnd=Math.max(lastEnd,b);}return Math.floor(total/60000);
}
export function hoursLabel(minutes){return Math.floor(minutes/60)+'h '+minutes%60+'m';}

export function dailyShiftTotal(records,employeeId,day,now=Date.now()){const sessions=records.filter(row=>String(row.employeeId)===String(employeeId)&&shiftDay(row.date)===day&&row.checkIn);return {complete:sessions.length>0&&sessions.every(row=>!!row.checkOut),minutes:shiftMinutes(sessions,employeeId,day,now)};}
