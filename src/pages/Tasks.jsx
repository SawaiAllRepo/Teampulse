import React from 'react';
import SearchBox from '../components/SearchBox.jsx';

export default function Tasks({tasks,search,setSearch,taskTable}){
 return <>{<section className="panel"><div className="panelhead"><h3>All tasks <span className="count">{tasks.length}</span></h3><SearchBox value={search} set={setSearch}/></div>{taskTable(tasks)}</section>}</>;
}
