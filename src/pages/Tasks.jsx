import React,{useState} from 'react';
import SearchBox from '../components/SearchBox.jsx';

export default function Tasks({tasks,search,setSearch,taskTable,employee=id=>id}){
 const[filters,setFilters]=useState({});const rows=tasks.filter(t=>Object.entries(filters).every(([k,v])=>!v||t[k]===v));
 return <><section className="panel"><div className="requestform">{[['status','Status'],['priority','Priority'],['assignee','Responsible person']].map(([k,label])=><label key={k}>{label}<select value={filters[k]||''} onChange={e=>setFilters({...filters,[k]:e.target.value})}><option value="">All</option>{[...new Set(tasks.map(t=>t[k]).filter(Boolean))].map(v=><option key={v} value={v}>{k==='assignee'?employee(v):v}</option>)}</select></label>)}</div><p>{rows.length} matching tasks</p></section>{<section className="panel"><div className="panelhead"><h3>All tasks <span className="count">{tasks.length}</span></h3><SearchBox value={search} set={setSearch}/></div>{taskTable(rows)}</section>}</>;
}
