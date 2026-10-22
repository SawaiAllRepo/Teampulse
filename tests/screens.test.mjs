import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('every screen renders empty and populated workspaces for all four roles',async t=>{
 globalThis.sessionStorage={getItem:()=>null};
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 t.after(async()=>{await server.close();delete globalThis.sessionStorage;});
 const noop=()=>{};
 const employee={id:'e1',name:'Test Employee',email:'test@example.com',status:'Active',role:'Employee',department:'IT',designation:'Developer'};
 const other={...employee,id:'e2',name:'Other Employee',status:'Pending'};
 const date=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
 const record={id:'a1',employeeId:'e1',date,checkIn:new Date().toISOString(),checkOut:new Date().toISOString()};
 for(const page of ['Login','Overview','Employees','Projects','Tasks','Attendance','WorkLogs','LeaveRequests','Announcements','Settings']){
 const {default:Screen}=await server.ssrLoadModule('/src/pages/'+page+'.jsx');
 for(const role of ['Admin','HR','Team Leader','Employee'])for(const populated of [false,true])await t.test(`${page}: ${role}, ${populated?'populated':'empty'}`,()=>{
 const db={employees:populated?[employee,other]:[],projects:populated?[{id:'p1',name:'Project',owner:'e1',status:'In progress',due:date}]:[],tasks:populated?[{id:'t1',title:'Task',projectId:'p1',assignee:'e1',status:'To do',due:date}]:[],attendance:populated?[record]:[],worklogs:populated?[{id:'w1',employeeId:'e1',date,summary:'Work',hours:2}]:[],leaves:populated?[{id:'l1',employeeId:'e1',start:date,end:date,status:'Pending'}]:[],announcements:populated?[{id:'n1',title:'Notice',message:'Message'}]:[]};
 const props={...db,db,me:{...employee,role},role,admin:['Admin','HR'].includes(role),lead:role!=='Employee',open:db.tasks,currentAttendance:populated?record:null,search:'',busy:false,accessEvents:[],attendanceDate:date,syncedAt:'',punchStage:'',location:null,employee:()=>employee.name,initials:()=> 'TE',filtered:rows=>rows,badge:s=>React.createElement('span',null,s),taskTable:()=>React.createElement('div',null,'Tasks'),setSearch:noop,mutate:noop,setModal:noop,setAttendanceDate:noop,changePassword:noop,setError:noop,setPage:noop,load:noop,setBusy:noop,setNotice:noop,fail:noop,syncAttendance:noop,onLogin:noop};
 const html=renderToStaticMarkup(React.createElement(Screen,props));assert.ok(html.length>0);
 if(page==='Overview')assert.equal(html.includes('Team attendance today'),props.admin);
 });
 }
});
