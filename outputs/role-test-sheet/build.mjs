import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
import {roles,casesFor} from '../../tests/helpers/role-cases.mjs';

const out='C:/TeamPulse/outputs/role-test-sheet';
const evidence=await fs.readFile(`${out}/role-test-results.xml`,'utf8');
assert.equal((evidence.match(/<testcase /g)||[]).length,40);
assert.ok(!/<failure|<error|<skipped/.test(evidence));
const wb=Workbook.create();
const sheet=wb.worksheets.add('Role test cases');
sheet.showGridLines=false;
sheet.tabColor='#0B1F44';
sheet.getRange('A2').values=[['TeamPulse role test cases']];
sheet.getRange('A3').values=[['Executed 19 October 2026. Automated backend tests using mocked Google services.']];
sheet.getRange('A5:E5').values=[['Role','Cases','Passed','Failed','Pass rate']];
sheet.getRange('A6:A9').values=roles.map(r=>[r.name]);
for(let row=6;row<=9;row++){
 sheet.getRange(`B${row}:E${row}`).formulas=[[
  `=COUNTIFS($B$16:$B$55,A${row})`,
  `=COUNTIFS($B$16:$B$55,A${row},$G$16:$G$55,"PASS")`,
  `=COUNTIFS($B$16:$B$55,A${row},$G$16:$G$55,"FAIL")`,
  `=C${row}/B${row}`
 ]];
}
sheet.getRange('A10').values=[['Total']];
sheet.getRange('B10:E10').formulas=[['=SUM(B6:B9)','=SUM(C6:C9)','=SUM(D6:D9)','=C10/B10']];
sheet.getRange('A12').values=[['Precondition: fresh seeded workspace and an active role account for every test. Fixture working date: 14 October 2026.']];
sheet.getRange('A13').values=[['Scope: live Sheets writes, browser interactions and device permission prompts were not tested. Full regression: 235 passed.']];
sheet.getRange('A14').values=[['Source: recorded JUnit role results and the approved four-role test-case report.']];
sheet.getRange('A15:H15').values=[['Test ID','Role','Test case','Steps / input','Expected result','Actual result','Status','Executed on']];
const rows=roles.flatMap(role=>casesFor(role).map(c=>{
 assert.ok(evidence.includes(`name="${c.id} `));
 return [c.id,role.name,c.title,c.steps,c.expected,'All automated assertions met.','PASS',new Date('2026-10-19T00:00:00Z')];
}));
sheet.getRange('A16:H55').values=rows;
const area=sheet.getRange('A1:H55');
area.format.font={name:'Arial',size:10,color:'#18263B'};
area.format.verticalAlignment='center';
sheet.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:'#0B1F44'};
sheet.getRange('A3').format.font={italic:true,color:'#596579'};
sheet.getRange('A2:H2').format.borders={bottom:{style:'thin',color:'#CBD5E1'}};
for(const r of ['A5:E5','A15:H15']){
 sheet.getRange(r).format.fill='#0B1F44';
 sheet.getRange(r).format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};
 sheet.getRange(r).format.horizontalAlignment='center';
 sheet.getRange(r).format.rowHeight=27;
}
sheet.getRange('A6:E10').format.rowHeight=23;
sheet.getRange('B6:D10').setNumberFormat('0');
sheet.getRange('E6:E10').setNumberFormat('0%');
sheet.getRange('A10:E10').format.font.bold=true;
sheet.getRange('A10:E10').format.borders={top:{style:'thin',color:'#CBD5E1'}};
sheet.getRange('A12:H14').format.rowHeight=22;
sheet.getRange('A12:H14').format.font={name:'Arial',size:10,color:'#596579'};
sheet.getRange('A16:H55').format.wrapText=true;
sheet.getRange('A16:H55').format.verticalAlignment='top';
sheet.getRange('A16:H55').format.rowHeight=55;
const widths={A:85,B:110,C:215,D:330,E:350,F:165,G:80,H:110};
for(const [col,width]of Object.entries(widths))sheet.getRange(`${col}1:${col}55`).format.columnWidthPx=width;
sheet.getRange('G16:H55').format.horizontalAlignment='center';
sheet.getRange('H16:H55').setNumberFormat('dd mmm yyyy');
for(let row=16;row<=55;row++)if(Math.floor((row-16)/10)%2===1)sheet.getRange(`A${row}:H${row}`).format.fill='#F3F6FA';
sheet.getRange('G16:G55').conditionalFormats.add('containsText',{text:'FAIL',format:{fill:'#FDE8E8',font:{color:'#9B1C1C',bold:true}}});
sheet.freezePanes.freezeRows(15);
sheet.freezePanes.freezeColumns(2);
wb.recalculate();
assert.deepEqual(sheet.getRange('B10:D10').values,[[40,40,0]]);
// Confirm summary responds to a changed result, then restore the recorded result.
sheet.getRange('G16').values=[['FAIL']];
wb.recalculate();
assert.deepEqual(sheet.getRange('C10:D10').values,[[39,1]]);
sheet.getRange('G16').values=[['PASS']];
wb.recalculate();
assert.deepEqual(sheet.getRange('B10:D10').values,[[40,40,0]]);
for(const [name,range]of [['overview','A1:H18'],['details','A26:H28']]){
 const preview=await wb.render({sheetName:sheet.name,range,scale:1,format:'png'});
 await fs.writeFile(`${out}/${name}.png`,new Uint8Array(await preview.arrayBuffer()));
}
const file=await SpreadsheetFile.exportXlsx(wb);
await file.save(`${out}/TeamPulse-role-test-cases.xlsx`);
console.log('Verified 40 cases and formula recalculation. Workbook exported.');
