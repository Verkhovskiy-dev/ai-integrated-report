import assert from 'node:assert/strict'; import { createHash } from 'node:crypto'; import { readFile } from 'node:fs/promises';
import { buildPairedPayload } from '../../scripts/news-contract/build-paired-news-data.mjs';
const nodes=JSON.parse(await readFile(new URL('./producer-nodes-sanitized.json',import.meta.url),'utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
const parseOriginal=nodes['Parse Report to JSON'].parameters.jsCode;
const validateOriginal=nodes['Validate Report'].parameters.jsCode;
// Minimal parser delta: preserve, rather than discard, optional fields supplied by the agent.
const parsePatched=parseOriginal.replace("sources: (e.sources || []).filter(s => /^https?:\\/\\//.test(s))", "sources: (e.sources || []).filter(s => /^https?:\\/\\//.test(s)), source_event_id: e.source_event_id, canonical_url: e.canonical_url, news_id: e.news_id, importance: e.importance, executive_explanation: e.executive_explanation");
assert.notEqual(parsePatched,parseOriginal);
const FixedDate=class extends Date { constructor(v){super(v===undefined?'2026-10-25T12:00:00.000Z':v)} static now(){return new Date('2026-10-25T12:00:00.000Z').valueOf()} };
async function node(code,input){ const fn=new AsyncFunction('$input','$','Date',code); return (await fn.call({helpers:{httpRequest:async()=>({statusCode:200})}},{first:()=>({json:input})},name=>({first:()=>({json:name==='Prep Agent Input'?{input_news_count:15,input_source_stats:{a:1,b:1,c:1}}:{}})}),FixedDate))[0].json; }
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const e=(n,l)=>({title:'Событие '+n,fact:'Факт '+n,why_important:'Причина '+n,sources:[`https://${l}.test/${n}`],related_levels:[l,9],importance:{level:l===1?'high':'low',rationale:'Явная оценка'},executive_explanation:{what_happened:'Факт',why_important:'Причина',business_impact:'Влияние'}});
const raw={date:'2026-10-25',srt_levels:[9,8,7,1].map(l=>({level:l,level_summary:'Изменение',events:Array.from({length:l===9?3:4},(_,i)=>e(`${l}-${i}`,l))})),cross_level_links:[],structural_shifts:[],radar_signals:[],trends:[]};
const parsed=await node(parsePatched,{output:JSON.stringify(raw)}); const validated=await node(validateOriginal,parsed); assert.equal(validated._validation.passed,true,JSON.stringify(validated._validation)); let writes=0; const paired=buildPairedPayload(parsed.report); if(validated._validation.passed){writes++;} assert.equal(writes,1); assert.equal(paired.executive.executive_events.length,15);
for(const mutate of [r=>{r.report.date='2026-10-24'},r=>{r.report.srt_levels.forEach(x=>x.events=[])}]) {const x=structuredClone(parsed);mutate(x);const out=await node(validateOriginal,x);assert.equal(out._validation.passed,false);}
const bad=structuredClone(parsed.report);bad.srt_levels[0].events[0].importance={level:'urgent',rationale:'x'};assert.throws(()=>buildPairedPayload(bad),/importance/); console.log(JSON.stringify({parse_original_sha256:sha(parseOriginal),validate_original_sha256:sha(validateOriginal),parse_patch_preserves_contract:true,valid_writes:1,invalid_writes:0}));
