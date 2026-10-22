import React from 'react';
import Records from '../components/Records.jsx';

export default function WorkLogs({worklogs,employee}){
 return <>{<section className="panel"><div className="panelhead"><h3>Daily progress</h3></div><Records rows={worklogs} columns={[['employeeId','Employee',employee],['date','Date'],['summary','Accomplishments'],['hours','Hours'],['blockers','Blockers']]}/></section>}</>;
}
