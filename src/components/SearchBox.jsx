import React from 'react';
import {Search} from 'lucide-react';
export default function SearchBox({value,set}){return <label className="search"><Search size={16}/><input aria-label="Search records" placeholder="Search records…" value={value} onChange={e=>set(e.target.value)}/></label>}
