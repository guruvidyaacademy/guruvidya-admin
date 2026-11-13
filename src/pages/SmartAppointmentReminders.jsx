import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import './SmartAppointmentReminders.css';
const DEFAULT={master_enabled:false,offline:{'4h':{whatsapp:true,email:true},'2h':{whatsapp:true,email:true},'1h':{whatsapp:true,email:true}},online:{'4h':{whatsapp:true,email:true},'2h':{whatsapp:true,email:true},'1h':{whatsapp:true,email:true},'5min':{whatsapp:true,email:true}},fallback_minutes:{'4h':60,'2h':30,'1h':10,'5min':0},stage_minutes:{offline:{'4h':240,'2h':120,'1h':60},online:{'4h':240,'2h':120,'1h':60,'5min':5}}};
const IST='Asia/Kolkata';
const fmt=(v,opts={})=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('en-IN',{timeZone:IST,day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',...opts})};
const day=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-CA',{timeZone:IST,year:'numeric',month:'2-digit',day:'2-digit'}).format(d).replace(/\//g,'-')};
const shift=(iso,n)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const ico={bell:'♧',calendar:'▦',send:'➤',delivered:'✓',confirmed:'♟',pending:'◷',failed:'⚠',building:'▥',video:'▰',mail:'✉',whatsapp:'◉',clock:'◷',refresh:'↻',settings:'⚙',database:'▤'};
function Icon({name,cls=''}){return <span aria-hidden="true" className={'sr-icon sr-ico-'+name+' '+cls}>{ico[name]||'●'}</span>}
const TRACK_PATHS={
 building:<><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M7 9V4h10v5M9 6h.01M15 6h.01M7 12h.01M12 12h.01M17 12h.01M7 16h.01M12 16h.01M17 16h.01M10 21v-3h4v3"/></>,
 video:<><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6"/></>,
 history:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h8M8 17h5"/></>,
 lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
 search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
 filter:<><path d="M3 5h18l-7 8v6l-4 2v-8z"/></>,
 refresh:<><path d="M20 7a8 8 0 0 0-14-2L4 8M4 3v5h5M4 17a8 8 0 0 0 14 2l2-3m0 5v-5h-5"/></>,
 user:<><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
 users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a6 6 0 0 1 3 5"/></>,
 ref:<><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
 pin:<><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
 clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
 whatsapp:<><path d="M20 11.5a8 8 0 0 1-11.5 7L4 20l1.5-4.5A8 8 0 1 1 20 11.5Z"/><path d="M9 9c1 3 3 5 6 6l1-2-2-1-1 1-2-2 1-1-1-2z"/></>,
 student:<><path d="m2 9 10-5 10 5-10 5-10-5Z"/><path d="M6 11v5c3 3 9 3 12 0v-5M22 9v7"/></>,
 mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></>,
 send:<><path d="m21 3-7.8 18-3.3-7.9L2 9.8 21 3Z"/><path d="M21 3 9.9 13.1"/></>,
 delivered:<><path d="m2 12 4 4 7-8M10 12l4 4 8-9"/></>,
 eye:<><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
 click:<><path d="m5 3 12 9-6 1-2 6-4-16Z"/><path d="m15 16 4 4M18 5v3M21 10h-3M12 2v3"/></>,
 close:<><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></>,
 check:<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
 info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
 chevron:<path d="m9 6 6 6-6 6"/>,
 chevronup:<path d="m6 15 6-6 6 6"/>,
 bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4"/></>
};
function TrackingIcon({name,size=20,className=''}){return <svg className={'sr-track-svg '+className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{TRACK_PATHS[name]||TRACK_PATHS.info}</svg>}

const OVERVIEW_PATHS={
 send:<><path d="m21 3-7.8 18-3.3-7.9L2 9.8 21 3Z"/><path d="M21 3 9.9 13.1"/></>,
 alert:<><path d="m10.2 3.7-8.4 14.7a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.8 3.7a2 2 0 0 0-3.6 0Z"/><path d="M12 9v5M12 18h.01"/></>,
 ...TRACK_PATHS
};
function ApprovedOverviewIcon({name,size=36}){
 const paths={
  bell:<><path d="M12 3a2 2 0 0 0-2 2v.45C6.8 6.3 5.3 8.9 5.3 12.1v4.1L3.7 19h16.6l-1.6-2.8v-4.1c0-3.2-1.5-5.8-4.7-6.65V5a2 2 0 0 0-2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9.5 21a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
  building:<><path d="M3 21V6.5L11 3v18H3Zm10 0V9l8-3v15h-8Z" fill="currentColor"/><g fill="#e9f4ff"><rect x="5.2" y="8" width="2.1" height="2.4" rx=".3"/><rect x="8.2" y="8" width="1.6" height="2.4" rx=".3"/><rect x="5.2" y="12" width="2.1" height="2.4" rx=".3"/><rect x="8.2" y="12" width="1.6" height="2.4" rx=".3"/><rect x="5.2" y="16" width="2.1" height="2.4" rx=".3"/><rect x="8.2" y="16" width="1.6" height="2.4" rx=".3"/><rect x="15" y="11" width="2" height="2.2" rx=".3"/><rect x="18" y="11" width="1.5" height="2.2" rx=".3"/><rect x="15" y="15" width="2" height="2.2" rx=".3"/><rect x="18" y="15" width="1.5" height="2.2" rx=".3"/></g></>,
  video:<><rect x="2" y="5" width="14.3" height="14" rx="2.3" fill="currentColor"/><path d="m16 9.3 6-3.2v11.8l-6-3.2Z" fill="currentColor"/></>
 };
 return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">{paths[name]}</svg>
}
function OverviewIcon({name,size=24}){return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">{OVERVIEW_PATHS[name]||TRACK_PATHS.info}</svg>}
const futureCountdown=value=>{const diff=new Date(value).getTime()-Date.now();if(!Number.isFinite(diff)||diff<=0)return 'Due';const min=Math.ceil(diff/60000);return min<60?`In ${min} min`:min<1440?`In ${Math.floor(min/60)}h ${min%60}m`:`In ${Math.floor(min/1440)}d`};
function Tile({name,label,value,subtitle}){const iconNames={calendar:'calendar',send:'send',delivered:'check',confirmed:'users',pending:'clock',failed:'alert'};return <div className={'sr-kpi sr-kpi-'+name}><span className="sr-kpi-icon"><OverviewIcon name={iconNames[name]||'calendar'} size={29}/></span><div className="sr-kpi-text"><strong>{value}</strong><b>{label}</b><small>{subtitle}</small></div></div>}
function Donut({items,total,center}){const palette=['#0fbf84','#1685f8','#8343e9','#ff922e','#ee465a'];let start=0;const gradient=items.map((v,i)=>{const end=start+(total?100*v/total:0);const s=`${palette[i%5]} ${start}% ${end}%`;start=end;return s}).join(',');return <div className="sr-donut" style={{background:total?`conic-gradient(${gradient})`:'#e8eff8'}}><div><strong>{center??total}</strong><small>Total</small></div></div>}
function Trend({rows}){const width=550,height=130,keys=['scheduled','sent','delivered','confirmed'],colors=['#1479f5','#0aba86','#58a8fa','#8245eb'];const max=Math.max(1,...rows.flatMap(x=>keys.map(k=>x[k]||0)));const pts=k=>rows.map((r,i)=>`${12+i*(width-24)/Math.max(1,rows.length-1)},${height-14-(r[k]||0)*(height-28)/max}`).join(' ');return <div className="sr-trend"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Reminder performance trend">{[0,1,2,3].map(i=><line key={i} x1="0" x2={width} y1={15+i*32} y2={15+i*32} stroke="#e4edf9"/>)}{keys.map((k,i)=><polyline key={k} points={pts(k)} fill="none" stroke={colors[i]} strokeWidth="2.5" strokeLinejoin="round"/> )}</svg><div className="sr-legend">{keys.map((k,i)=><span key={k}><i style={{background:colors[i]}}/>{k}</span>)}</div></div>}
const statusOf=r=>String(r.status||'scheduled').toLowerCase();
function WindowPanel({recipient,booking}){return <div className="sr-panel sr-window sr-window-designed"><div className="sr-panel-heading">24h WhatsApp Window Timeline ({recipient==='student'?'Student':'Parent / Guardian'})</div><div className="sr-window-timeline"><div className="sr-window-event sr-window-event-unavailable"><span className="sr-timeline-dot"><TrackingIcon name="clock" size={16}/></span><div className="sr-window-event-copy"><strong>Window history not connected</strong><small>Verified inbound replies, opening and expiry times, and extension attempts will appear here when recipient-level event data becomes available.</small></div><span className="sr-status-pill sr-pill-neutral">Not available</span></div></div><div className="sr-window-note"><TrackingIcon name="info" size={19}/><div><strong>Note:</strong><p>Only a valid inbound Student/Parent WhatsApp reply reopens the 24h window.</p><p>Maximum 2 extension attempts per recipient; no outgoing message or website click extends the window.</p></div></div></div>}
const MANUAL_BUTTON_LABELS={on_my_way:"Yes, I'm On My Way",im_ready:"Yes, I'm Ready",yes_attend:"Yes, I'll Attend",yes_attend_open:"Yes, I'll Attend",reschedule:'Reschedule',cancel:'Cancel'};
function manualButtonEvents(test,channel,mode){
 const oneHourLabel=String(mode||test?.mode||'').toLowerCase()==='online'?"Yes, I'm Ready":"Yes, I'm On My Way";
 const stageLabel=test?.stage==='1h'?oneHourLabel:test?.stage==='2h'?"Yes, I'll Be There":"Yes, I'll Attend";
 const clicks=(Array.isArray(test?.manual_clicks)?test.manual_clicks:[]).map(row=>{
  const key=String(row.button_key||'unknown');
  const raw=Array.isArray(row.click_history)&&row.click_history.length?row.click_history:[row.clicked_at];
  const times=raw.map(v=>typeof v==='string'?v:v?.clicked_at||v?.at||v?.occurred_at).filter(Boolean).sort((a,b)=>new Date(a)-new Date(b));
  const first=row.clicked_at||times[0],last=row.last_clicked_at||times[times.length-1]||first;
  const outcome=(key==='on_my_way'||key==='im_ready')?'1h acknowledgement recorded':key==='yes_attend'?'Attendance confirmation recorded':key==='yes_attend_open'?'Confirmation page opened':key==='reschedule'?'Reschedule page opened — not completed':key==='cancel'?'Cancellation page opened — not completed':'Button response recorded';
  return {channel,key,label:key==='yes_attend'||key==='yes_attend_open'?stageLabel:MANUAL_BUTTON_LABELS[key]||key.replaceAll('_',' '),first,last,total:Math.max(Number(row.click_count)||0,times.length,1),times,outcome,type:'click'};
 });
 // A WhatsApp yes_attend entry is recorded only after the incoming button
 // response is received. Use its latest recorded click as the attendance
 // acknowledgement, independently of later reminder-preference responses.
 if(channel==='whatsapp'){
  // 1h uses a single acknowledgement button rather than the 4h/2h YES key.
  const confirmationKeys=test?.stage==='1h'?['on_my_way','im_ready','yes_attend']:['yes_attend'];
  clicks.filter(e=>confirmationKeys.includes(e.key)).forEach(e=>{e.confirmedAt=e.last;});
 }
 // Email YES link opening and attendance confirmation are two stages of the same
 // button action. Preserve their separate audit timestamps, but render one row
 // and do not count the successful confirmation as a second button click.
 if(channel==='email'){
  const openIndex=clicks.findIndex(e=>e.key==='yes_attend_open');
  const confirmIndex=clicks.findIndex(e=>e.key==='yes_attend');
  if(openIndex!==-1&&confirmIndex!==-1){
   const opened=clicks[openIndex],confirmed=clicks[confirmIndex];
   const times=[...opened.times].sort((a,b)=>new Date(a)-new Date(b));
   const confirmedTimes=[...confirmed.times].sort((a,b)=>new Date(a)-new Date(b));
   const merged={...opened,key:'yes_attend',label:stageLabel,total:opened.total,
    first:opened.first,last:opened.last,times,
    confirmedAt:confirmedTimes[0]||confirmed.first,
    confirmationTimes:confirmedTimes,
    outcome:'Attendance confirmation recorded'};
   clicks.splice(Math.max(openIndex,confirmIndex),1);
   clicks.splice(Math.min(openIndex,confirmIndex),1,merged);
  }else if(confirmIndex!==-1){
   // Legacy links may only report a confirmed event. Keep the verified event.
   clicks[confirmIndex]={...clicks[confirmIndex],confirmedAt:clicks[confirmIndex].first};
  }
 }
 // Only a verified booking transaction bearing this exact signed email-test context
 // can change Page Opened to Completed. Ordinary booking/admin changes do not count.
 if(channel==='email'){
  const outcomes=Array.isArray(test?.action_outcomes)?test.action_outcomes:[];
  for(const e of clicks){
   if(!['reschedule','cancel'].includes(e.key))continue;
   const latest=outcomes.filter(o=>o.action===e.key && o.completed_at && new Date(o.completed_at)>=new Date(e.first)).sort((a,b)=>new Date(b.completed_at)-new Date(a.completed_at))[0];
   if(latest?.failed){e.outcome=e.key==='reschedule'?'Reschedule Failed — Server Error':'Cancellation Failed — Server Error';e.failedAt=latest.completed_at;}
   const done=latest&&!latest.failed?latest:null;
   if(done){e.outcome=e.key==='reschedule'?(done.approval_pending==='true'?'Reschedule Submitted — Awaiting Admin Approval':'Reschedule Completed Successfully'):'Cancellation Completed';e.completedAt=done.completed_at;
    if(e.key==='reschedule'){e.previousStartsAt=done.previous_starts_at;e.newStartsAt=done.new_starts_at;}}
  }
 }
 // The existing 4h preference audit is authoritative for follow-up Yes/No.
 // These are preference events, not additional clicks in the provider's click count.
 if(channel==='whatsapp'&&test?.stage==='4h'&&test?.followup_choice){
  const f=test.followup_choice,history=Array.isArray(f.history)?f.history:[];
  const byChoice={yes:[],no:[]};
  history.forEach(h=>{if((h.event_type==='initial'||h.event_type==='confirmed')&&byChoice[h.requested_choice]&&h.occurred_at)byChoice[h.requested_choice].push(h.occurred_at)});
  if(!history.length&&['yes','no'].includes(f.choice)&&f.choice_clicked_at)byChoice[f.choice].push(f.choice_clicked_at);
  Object.entries(byChoice).forEach(([choice,times])=>{if(!times.length)return;times.sort((a,b)=>new Date(a)-new Date(b));clicks.push({channel,key:'followup_'+choice,label:'2h Reminder Follow-up — '+(choice==='yes'?'Yes':'No'),first:times[0],last:times[times.length-1],total:times.length,times,outcome:'Preference '+(choice==='yes'?'enabled':'disabled')+' (confirmed)',type:'preference'});});
  history.filter(h=>h.event_type==='requested'&&h.occurred_at).forEach(h=>clicks.push({channel,key:'followup_request_'+h.occurred_at,label:'Follow-up change requested — '+String(h.requested_choice).toUpperCase(),first:h.occurred_at,last:h.occurred_at,total:1,times:[h.occurred_at],outcome:'Awaiting separate confirmation; current preference unchanged',type:'preference'}));
 }
 return clicks;
}
// Compact booking-row preview: use only verified manual-test outcomes, never inferred clicks.
// Preserve each stage's verified acknowledgement separately. A provider-accepted
// send or an opened email link alone is not an attendance confirmation.
function verifiedBookingAcknowledgements(tests,booking){
 return (tests||[]).filter(t=>['4h','2h','1h'].includes(t.stage)).flatMap(t=>
  manualButtonEvents(t,t.channel,booking?.mode).filter(e=>e.type==='click'&&e.confirmedAt&&(
   t.stage==='1h'?['on_my_way','im_ready','yes_attend'].includes(e.key):e.key==='yes_attend'))
   .map(e=>({stage:t.stage,channel:t.channel,at:e.confirmedAt,
    label:t.stage==='1h'?(String(booking?.mode||'').toLowerCase()==='online'?"Yes, I'm Ready":"Yes, I'm On My Way"):
     t.stage==='2h'?"Yes, I'll Be There":"Yes, I'll Attend"}))
 ).sort((a,b)=>new Date(a.at)-new Date(b.at));
}
function BookingRowStatus({tests,booking}){
 const state=String(booking?.status||'').toLowerCase(),response=String(booking?.customer_response||'').toLowerCase();
 if(state.includes('cancel')||response.includes('cancel')||booking?.cancelled_at)return <span className="sr-row-attendance sr-row-attendance-cancel"><span className="sr-cancel-circle"><TrackingIcon name="close" size={10}/></span> Booking Cancelled</span>;
 if(state.includes('reschedul')||response.includes('reschedul'))return <span className="sr-row-attendance sr-row-attendance-wait"><TrackingIcon name="calendar" size={12}/> Rescheduled</span>;
 const confirmed=verifiedBookingAcknowledgements(tests,booking);
 return confirmed.length?<span className="sr-row-attendance sr-row-attendance-yes" title={'Latest confirmed via '+(confirmed[confirmed.length-1].channel==='email'?'Email':'WhatsApp')}><TrackingIcon name="check" size={12}/> Attendance Confirmed</span>:<span className="sr-row-attendance sr-row-attendance-wait"><TrackingIcon name="clock" size={12}/> Awaiting Confirmation</span>;
}
function BookingOutcomeSource({tests,booking,settings}){
 const state=String(booking?.status||'').toLowerCase();
 if(state.includes('cancel')||state.includes('reschedul')||booking?.cancelled_at)return null;
 const confirmed=verifiedBookingAcknowledgements(tests,booking);
 if(!confirmed.length)return null;
 const stages=['4h','2h','1h'];
 const oneHourMinutes=Number(settings?.stage_minutes?.[booking?.mode]?.['1h']??DEFAULT.stage_minutes[booking?.mode]?.['1h']??60);
 const startsAt=new Date(booking?.starts_at);
 const oneHourAt=Number.isFinite(startsAt.getTime())?new Date(startsAt.getTime()-oneHourMinutes*60000):null;
 const oneHourEnabled=Boolean(settings?.[booking?.mode]?.['1h']?.whatsapp||settings?.[booking?.mode]?.['1h']?.email);
 const showOneHourSchedule=oneHourEnabled&&oneHourAt&&oneHourAt.getTime()>Date.now();
 return <div className="sr-row-outcome-sources sr-row-stage-confirmations sr-designb-timeline" aria-label="Verified reminder confirmations">
  {stages.map(stage=>{
   const item=[...confirmed].reverse().find(e=>e.stage===stage);
   if(!item){
    if(stage!=='1h'||!showOneHourSchedule)return null;
    return <div key={stage} className="sr-row-stage-confirmation sr-row-stage-scheduled" title={'1h reminder due '+fmt(oneHourAt)+(settings?.master_enabled?'':' · Automation OFF')}><span className="sr-row-stage-pill"><TrackingIcon name="clock" size={10}/>1h</span><span className="sr-row-stage-detail"><span className="sr-row-stage-label">Planned · {compactTime(oneHourAt)}</span><span className="sr-row-stage-source sr-designb-automation">{settings?.master_enabled?'Scheduled':'Automation OFF'}</span></span></div>;
   }
   const channelName=item.channel==='email'?'Email':'WhatsApp';
   return <div key={stage} className={"sr-row-stage-confirmation sr-premium-stage sr-premium-stage-"+item.channel} title={`${stage} · ${item.label} · Via ${channelName} · ${fmt(item.at)}`}>
    <span className="sr-row-stage-pill">{stage}</span>
    <span className="sr-premium-stage-lock" aria-label="Confirmed stage locked"><TrackingIcon name="lock" size={13}/></span>
    <span className="sr-row-stage-detail"><span className="sr-row-stage-label"><TrackingIcon name="check" size={12}/>{item.label}</span><span className={'sr-row-stage-source sr-row-stage-source-'+item.channel}><TrackingIcon name={item.channel==='email'?'mail':'whatsapp'} size={13}/>{compactTime(item.at)}</span></span>
   </div>;
  })}
 </div>;
}
function BookingRowManualSummary({tests,channel}){
 const relevant=tests.filter(t=>t.channel===channel);
 if(channel==='whatsapp'){
  const accepted=relevant.filter(t=>['accepted','sent','delivered','read'].includes(String(t.status||'').toLowerCase()));
  const latest=[...accepted].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
  return latest?<div className="sr-mini-footer sr-mini-test" title="Manual test, not a scheduled reminder"><TrackingIcon name="whatsapp" size={12}/> Test: Provider Accepted · {compactTime(latest.created_at)}</div>:null;
 }
 const actions=relevant.flatMap(t=>manualButtonEvents(t,'email').filter(e=>e.type==='click').map(e=>({...e,stage:t.stage})));
 const items=actions.map(e=>{
  const completed=Boolean(e.completedAt),failed=Boolean(e.failedAt);
  const at=completed?e.completedAt:failed?e.failedAt:e.confirmedAt||e.last;
  const label=completed?(e.key==='cancel'?'Cancelled':e.key==='reschedule'?(e.outcome.includes('Awaiting')?'Reschedule Pending':'Rescheduled'):'Confirmed'):failed?'Failed':e.key==='cancel'?'Clicked Cancel':e.key==='reschedule'?'Clicked Reschedule':e.confirmedAt?'Confirmed':e.key==='yes_attend'?e.label:e.label;
  return {at,label,tone:completed&&e.key==='cancel'?'red':completed?'green':failed?'red':'blue'};
 }).filter(x=>x.at).sort((a,b)=>new Date(b.at)-new Date(a.at));
 const latest=items[0];
 return latest?<div className="sr-mini-footer sr-mini-action" title="Latest verified email button action (manual test)"><span className="sr-mini-action-heading">Latest Email Action</span><span className={'sr-mini-action-pill sr-mini-action-'+latest.tone}>{latest.tone==='red'?<span className="sr-cancel-circle"><TrackingIcon name="close" size={9}/></span>:<TrackingIcon name={latest.tone==='green'?'check':'info'} size={11}/>} {latest.label}</span><time>{compactTime(latest.at)}</time></div>:null;
}
// Collapsed row: latest verified scheduled-delivery milestone per stage.
// Manual tests are deliberately excluded from this summary.
const compactTime=value=>value?fmt(value,{day:undefined,month:undefined,year:undefined}):'—';
function BookingRowChannel({deliveries,channel,mode,clicks,tests,booking,settings}){
 const stages=mode==='online'?['4h','2h','1h','5min']:['4h','2h','1h'];
 const relevant=deliveries.filter(d=>d.channel===channel);
 const manual=Array.isArray(tests)?tests.filter(t=>t.channel===channel):[];
 const outcomes=(tests||[]).filter(t=>t.stage==='4h').flatMap(t=>manualButtonEvents(t,t.channel,booking?.mode).filter(e=>e.type==='click'&&(e.confirmedAt||e.completedAt)));
 const finalOutcome=String(booking?.status||'').toLowerCase();
 const isCancelled=finalOutcome.includes('cancel')||Boolean(booking?.cancelled_at);
 const isRescheduled=finalOutcome.includes('reschedul');
 const hasYes=outcomes.some(e=>e.key==='yes_attend');
 const hasFinal=isCancelled||isRescheduled;
 const followup=(tests||[]).filter(t=>t.channel==='whatsapp'&&t.stage==='4h'&&t.followup_choice).map(t=>t.followup_choice).sort((a,b)=>new Date(b.choice_clicked_at||0)-new Date(a.choice_clicked_at||0))[0];
 const followupChoice=String(followup?.choice||'').toLowerCase();
 const followupAt=followup?.choice_clicked_at||null;
 // A requested NO is not final until the explicit confirmation is recorded.
 const preferenceHistory=Array.isArray(followup?.history)?followup.history:[];
 const lastConfirmedPreference=preferenceHistory.filter(h=>h.event_type==='confirmed'&&['yes','no'].includes(h.requested_choice)&&h.occurred_at).sort((a,b)=>new Date(b.occurred_at)-new Date(a.occurred_at))[0];
 const effectiveChoice=lastConfirmedPreference?.requested_choice||followupChoice;
 const effectiveAt=lastConfirmedPreference?.occurred_at||followupAt;
 const preferenceButton=effectiveChoice==='no'?(lastConfirmedPreference?'Yes, Turn Off':'NO · Locked'):(lastConfirmedPreference?'Yes, Keep On':'Yes');
 const latestStage=stage=>{
  const rows=relevant.filter(d=>d.stage===stage);
  const events=[];
  rows.forEach(d=>{
   if(d.sent_at)events.push({label:'Sent',at:d.sent_at,tone:channel==='email'?'blue':'green',icon:'send'});
   if(d.delivered_at)events.push({label:'Delivered',at:d.delivered_at,tone:channel==='email'?'blue':'green',icon:'delivered'});
   const read=channel==='email'?d.opened_at:d.read_at;
   if(read)events.push({label:channel==='email'?'Opened':'Read',at:read,tone:channel==='email'?'blue':'green',icon:'eye'});
   // Only show a button name when a verified click record was actually loaded.
   const recorded=Array.isArray(clicks?.[d.id])?clicks[d.id]:[];
   recorded.forEach(c=>{if(c.clicked_at)events.push({label:String(c.button_name||c.button_key||'Button').slice(0,32),at:c.clicked_at,tone:channel==='email'?'blue':'green',icon:'click'});});
   if(d.status==='failed'&&d.updated_at)events.push({label:'Failed',at:d.updated_at,tone:'red',icon:'info'});
  });
  // Scheduled delivery always takes precedence. A separate manual test is labelled
  // explicitly so its verified receipt is visible without posing as automation.
  if(!events.length){
   manual.filter(t=>t.stage===stage).forEach(t=>{
    const tone=channel==='email'?'blue':'green';
    const at=t.provider_clicked_at||t.read_at||t.opened_at||t.delivered_at;
    if(t.delivered_at)events.push({label:'Test Delivered',at:t.delivered_at,tone,icon:'delivered'});
    if(t.read_at||t.opened_at)events.push({label:channel==='email'?'Test Opened':'Test Read',at:t.opened_at||t.read_at,tone,icon:'eye'});
    if(t.provider_clicked_at)events.push({label:'Test Clicked',at:t.provider_clicked_at,tone,icon:'click'});
    manualButtonEvents(t,channel,booking?.mode).filter(e=>e.type==='click').forEach(e=>{
     const at=e.completedAt||e.confirmedAt||e.last;
     if(!at)return;
     const done=Boolean(e.completedAt||e.confirmedAt);
     const label=e.key==='cancel'?(done?'Cancelled':'Clicked Cancel'):e.key==='reschedule'?(done?'Rescheduled':'Clicked Reschedule'):e.key==='yes_attend'?(stage==='2h'?"Yes, I'll Be There":stage==='1h'?(String(booking?.mode||'').toLowerCase()==='online'?"I'm Ready":"On My Way"):"Yes, I'll Attend"):e.label;
     events.push({label,at,tone:e.key==='cancel'&&done?'red':e.key==='reschedule'?'amber':done?'green':tone,icon:e.key==='cancel'&&done?'close':done?'check':'click'});
    });
    if(!at&&['accepted','sent'].includes(String(t.status||'').toLowerCase()))events.push({label:'Test Accepted',at:t.completed_at||t.created_at,tone:'grey',icon:'clock'});
    if(!at&&String(t.status||'').toLowerCase()==='failed')events.push({label:'Test Failed',at:t.completed_at||t.created_at,tone:'red',icon:'info'});
   });
  }
  // A verified final 4h response takes precedence over the earlier delivery/read event.
  if(stage==='4h'){
   const finalClicks=manual.filter(t=>t.stage==='4h').flatMap(t=>manualButtonEvents(t,channel,booking?.mode).filter(e=>e.type==='click'&&(e.confirmedAt||e.completedAt)));
   const relevantFinal=finalClicks.filter(e=>isCancelled?e.key==='cancel':isRescheduled?e.key==='reschedule':e.key==='yes_attend');
   relevantFinal.forEach(e=>events.push({label:isCancelled?'Cancelled':isRescheduled?'Rescheduled':"Yes, I'll Attend",at:e.completedAt||e.confirmedAt,tone:isCancelled?'red':isRescheduled?'amber':'green',icon:isCancelled?'close':isRescheduled?'calendar':'check',locked:true}));
  }
  // Verified 4h follow-up choice controls ONLY the next (2h) reminder.
  // Attendance confirmation remains independent. 1h is not suppressed by 4h NO.
  // Preserve actual sent/delivered/read/click activity even if a preference changes later.
  const hasRealStageActivity=events.some(e=>!e.label.startsWith('Test')&&!e.locked);
  if(channel==='whatsapp'&&effectiveChoice==='no'){
   if(stage==='4h'){
    // The 4h attendance YES remains visible in the booking outcome/source line.
    // This badge describes the subsequent 2h reminder preference only.
    return {label:preferenceButton,at:effectiveAt,tone:'red',icon:'lock',locked:true};
   }
   if(stage==='2h'&&!hasRealStageActivity){
    return {label:'Skipped · 4h NO',at:null,tone:'grey',icon:'lock'};
   }
   if(stage==='1h'&&!events.length&&!hasFinal){
    return {label:'Scheduled',at:null,tone:'blue',icon:'clock'};
   }
  }
  if(stage==='2h'&&channel==='whatsapp'&&effectiveChoice==='yes'&&!hasRealStageActivity){
   events.push({label:preferenceButton,at:effectiveAt,tone:'green',icon:'check',preference:true});
  }
  if(stage!=='4h'&&hasFinal&&!events.length){
   return {label:isCancelled?'Stopped':'Recalculate',at:null,tone:'grey',icon:'lock'};
  }
  events.sort((x,y)=>new Date(y.at||0)-new Date(x.at||0));
  const finalEvent=events.filter(e=>e.locked).sort((x,y)=>new Date(y.at)-new Date(x.at))[0];
  if(stage==='1h'&&!hasFinal&&!events.length){
   const enabled=Boolean(settings?.[mode]?.['1h']?.[channel]);
   const mins=Number(settings?.stage_minutes?.[mode]?.['1h']??DEFAULT.stage_minutes[mode]?.['1h']??60);
   const fallback=channel==='email'?Number(settings?.fallback_minutes?.['1h']??DEFAULT.fallback_minutes['1h']):0;
   const start=new Date(booking?.starts_at);
   const due=Number.isFinite(start.getTime())?new Date(start.getTime()-(mins-fallback)*60000):null;
   if(enabled&&due&&Number.isFinite(due.getTime())&&due.getTime()>Date.now()){
    return {label:channel==='email'?'Fallback Scheduled':'Scheduled',at:due,tone:'blue',icon:'clock',scheduled:true};
   }
  }
  return finalEvent||events[0]||{label:'Not Sent',at:null,tone:'grey',icon:'clock'};
 };
 return <div className={'sr-mini-channel sr-mini-'+channel+' sr-designb-channel'}><div className="sr-designb-channel-title"><TrackingIcon name={channel==='whatsapp'?'whatsapp':'mail'} size={18}/><b>{channel==='whatsapp'?'WhatsApp':'Email'}</b></div>
  {stages.map(stage=>{const event=latestStage(stage);return <div className="sr-mini-stage" key={stage} title={stage+' reminder: '+event.label+(event.at?' at '+fmt(event.at):'')}>
   <span className="sr-mini-stage-name">{stage}</span>
   <span className={'sr-mini-status sr-mini-'+event.tone}><span className="sr-mini-status-icon"><TrackingIcon name={event.icon} size={10}/></span><span className="sr-mini-status-label">{event.label}</span></span>
   <time className="sr-mini-time">{compactTime(event.at)}</time>
  </div>})}
  {channel==='whatsapp'&&<BookingRowManualSummary tests={tests||[]} channel={channel}/>}
 </div>;
}
function BookingRowWindow(){return <div className="sr-mini-window"><span className="sr-mini-window-badge"><TrackingIcon name="clock" size={12}/> Not Verified</span><small>Open: —</small><small>Expires: —</small></div>}
function ManualTrackingCard({test,channel,mode}){
 const wa=channel==='whatsapp',events=wa?['Sent','Delivered','Read','Clicked']:['Sent','Delivered','Opened','Clicked'];
 const iconNames=['send','check','info','ref'],accepted=test?.status==='accepted';
 const entries=manualButtonEvents(test,channel,mode),clickEntries=entries.filter(e=>e.type==='click');
 const clicks=clickEntries.reduce((n,e)=>n+e.total,0);
 const firstClick=clickEntries.map(e=>e.first).filter(Boolean).sort()[0];
 const lastClick=clickEntries.map(e=>e.last).filter(Boolean).sort().slice(-1)[0];
 const timestamps=[accepted?(test.completed_at||test.created_at):null,test?.delivered_at||null,wa?(test?.read_at||null):(test?.opened_at||null),firstClick];
 return <section className={'sr-manual-premium-card sr-manual-premium-'+channel} aria-label={'Manual '+channel+' tracking'}>
  <div className="sr-manual-premium-heading"><span className="sr-manual-premium-logo"><TrackingIcon name={wa?'whatsapp':'mail'} size={21}/></span><span><b>{wa?'WhatsApp':'Email'}</b><small>{wa?'BotSailor':'Resend'} · Manual Test</small></span><span className="sr-manual-premium-badge">{test?(accepted?'Provider accepted':test.status):'Not tested'}</span></div>
  <div className="sr-manual-premium-events">{events.map((name,i)=>{const at=timestamps[i],observed=i===0?accepted:i===3?clicks>0:Boolean(at);return <div className="sr-manual-premium-event" key={name}><span className={'sr-manual-premium-event-icon '+(observed?'verified':'')}><TrackingIcon name={iconNames[i]} size={17}/></span><div><b>{name}</b><small>{i===0&&accepted?'Provider accepted send request':observed?(i===3?`${clicks} recorded click${clicks===1?'':'s'}`:'Provider event recorded'):i===0?'No accepted send':'Awaiting verified event'}</small></div><time>{fmt(at)}</time></div>})}</div>
  <details className="sr-manual-inline-clicks"><summary><TrackingIcon name="ref" size={16}/> Button-wise activity <span>{clicks} clicks{entries.some(e=>e.type==='preference')?' · follow-up recorded':''}</span></summary>
   {entries.length?entries.filter(e=>!wa||e.type!=='preference').map((e,i)=>{const completed=Boolean(e.completedAt),failed=Boolean(e.failedAt),pending=/not completed|opened|awaiting/i.test(e.outcome||'')&&!completed;const icon=e.key==='reschedule'?'calendar':e.key==='cancel'?'close':'check';return <div className={'sr-action-card sr-action-'+(wa?'wa':'email')} key={e.key+'-'+i}>
    <div className="sr-action-top"><span className="sr-action-icon"><TrackingIcon name={icon} size={17}/></span><div className="sr-action-title"><strong>{e.label}</strong><small>{e.key==='reschedule'?'Schedule change':e.key==='cancel'?'Cancellation action':test?.stage==='1h'?'1h acknowledgement':test?.stage==='2h'?'2h attendance acknowledgement':wa?'4h attendance acknowledgement':'Attendance response'}</small></div><span className="sr-action-count">{e.total} click{e.total===1?'':'s'}</span></div>
    <div className={'sr-action-status '+(failed?'failed':pending?'pending':'success')}><TrackingIcon name={failed?'close':pending?'info':'check'} size={15}/><span>{e.outcome}</span></div>
    {completed&&e.key==='reschedule'&&<div className="sr-action-schedule"><div><small>Previous Schedule</small><b>{fmt(e.previousStartsAt)}</b></div><div><small>New Schedule</small><b>{fmt(e.newStartsAt)}</b></div></div>}
    <div className="sr-action-meta"><TrackingIcon name="history" size={14}/><span>{completed?'Completed':failed?'Failed':e.confirmedAt?'Confirmed':'First click'}: <b>{fmt(e.completedAt||e.failedAt||e.confirmedAt||e.first)}</b></span></div>
    {e.total>1&&<div className="sr-action-meta">First: {fmt(e.first)} · Last: {fmt(e.last)}</div>}
    {e.times.length>1&&<details className="sr-action-history"><summary>View click history ({e.times.length})</summary><ol>{e.times.map((at,j)=><li key={j}>{fmt(at)}</li>)}</ol></details>}
   </div>;}):<p className="sr-muted">No verified button activity recorded.</p>}
   {wa&&test?.stage==='4h'&&test?.followup_choice&&<div className="sr-followup-summary sr-action-followups"><div className="sr-action-followups-title"><TrackingIcon name="history" size={17}/><strong>Reminder Preferences</strong></div><p className="sr-manual-activity-note">The 4h acknowledgement is separate from reminder preferences. Turning a reminder OFF does not cancel the booking.</p>{['2h','1h'].map(stage=>{const f=test.followup_choice;const is2h=stage==='2h';const choice=is2h?f.choice:null;const history=is2h&&Array.isArray(f.history)?f.history:[];const pending=is2h?f.pending_change:null;const confirmed=history.filter(h=>h.event_type==='initial'||h.event_type==='confirmed');const latest=confirmed[confirmed.length-1];return <div className="sr-followup-stage" key={stage}><div className="sr-followup-stage-head"><b><TrackingIcon name="history" size={15}/> {stage} Reminder</b><span className={'sr-followup-state '+(choice==='yes'?'on':choice==='no'?'off':'unknown')}>{choice==='yes'?'YES · Confirmed':choice==='no'?'NO · Confirmed':!is2h?'Scheduled':'Awaiting verified response'}</span></div>{is2h?<small>Last verified confirmation: {fmt(latest?.occurred_at||f.choice_clicked_at)}</small>:<small>Awaiting scheduled send time · No response required yet</small>}{pending&&<div className="sr-followup-pending"><span className="sr-followup-pending-badge">Pending</span><b>Change Requested — {String(pending.requested_choice||'').toUpperCase()}</b><small>{fmt(pending.created_at)} · Current confirmed preference remains unchanged.</small></div>}{is2h&&history.length>0&&<details className="sr-action-history"><summary>View verified response history ({history.length})</summary><ol>{history.map((h,i)=><li key={i}>{h.event_type==='requested'?'Change requested':h.event_type==='confirmed'?'Change confirmed':h.event_type==='initial'?'Initial confirmation':'Previous choice retained'} · {String(h.requested_choice||'').toUpperCase()} · {fmt(h.occurred_at)}</li>)}</ol></details>}{!is2h&&<small>Scheduled is the upcoming-stage display; delivery and any final preference change require verified backend events.</small>}</div>})}<p className="sr-manual-activity-note">Final stage lock is shown only after verified backend confirmation; never inferred from a click.</p></div>}
  </details>
  {clicks>0&&<div className="sr-manual-premium-click-meta">First click: <b>{fmt(firstClick)}</b> · Last click: <b>{fmt(lastClick)}</b> · Total: <b>{clicks}</b></div>}
  <div className="sr-manual-premium-foot">{accepted?'Accepted is not proof of delivery.':'Only verified events are shown.'} {wa?'Read requires a provider receipt.':'Opened requires a provider event.'}</div>
 </section>;
}
function ManualButtonActivity({whatsapp,email,mode}){
 const entries=[...manualButtonEvents(whatsapp,'whatsapp',mode),...manualButtonEvents(email,'email',mode)];
 const timeline=entries.flatMap(e=>e.times.map(at=>({...e,at}))).sort((a,b)=>new Date(b.at)-new Date(a.at));
 return <section className="sr-manual-activity sr-manual-activity-compact"><details className="sr-manual-unified-timeline"><summary><TrackingIcon name="history" size={17}/> Unified Activity Timeline ({timeline.length} verified events) · IST</summary>{timeline.length?<ol>{timeline.map((e,i)=><li key={i}><span className={'sr-manual-timeline-channel '+e.channel}>{e.channel==='whatsapp'?'WhatsApp':'Email'}</span><strong>{e.label}</strong><small>{e.outcome}</small><time>{fmt(e.at)}</time></li>)}</ol>:<p className="sr-muted">No verified button or preference events yet.</p>}</details><p className="sr-manual-activity-note">Follow-up preference events are shown separately from click totals. Opening a reschedule or cancellation page does not complete that booking action.</p></section>;
}
function Channel({channel,delivery,onClicks,clicks,loading}){const stages=channel==='whatsapp'?['Sent','Delivered','Read','Clicked']:['Sent','Delivered','Opened','Clicked'];const keyMap={Sent:'sent_at',Delivered:'delivered_at',Read:'read_at',Opened:'opened_at',Clicked:'clicked_at'};const status=delivery?.status||'Not sent';const byButton=Array.isArray(clicks)?Object.values(clicks.reduce((a,c)=>{const key=c.button_key||c.button_name||'Button';(a[key]??={key,times:[]}).times.push(c.clicked_at);return a},{})):null;return <div className={'sr-channel sr-channel-'+channel}><div className="sr-channel-head"><span><span className="sr-channel-icon"><TrackingIcon name={channel==='whatsapp'?'whatsapp':'mail'} size={22}/></span><b>{channel==='whatsapp'?'WhatsApp':'Email'}</b></span><span className={'sr-status-pill '+(delivery?.delivered_at||delivery?.opened_at?'sr-pill-green':'sr-pill-neutral')}>{delivery?.opened_at?'Opened':delivery?.delivered_at?'Delivered':status}</span></div><div className="sr-event-timeline">{stages.map(s=><div className="sr-event" key={s}><span className={delivery?.[keyMap[s]]?'sr-tick':'sr-empty-tick'}>{delivery?.[keyMap[s]]?'✓':'–'}</span><span>{s}</span><time>{fmt(delivery?.[keyMap[s]])}</time></div>)}</div><div className="sr-click-head">{channel==='whatsapp'?'WhatsApp':'Email'} Button Clicks</div>{delivery?.id?<><button type="button" className="sr-click-load" disabled={loading} onClick={()=>onClicks(delivery.id)}>{loading?'Loading click history…':byButton?'Refresh actual click history':'View actual button click history'} <TrackingIcon name="chevron" size={15}/></button>{byButton&&<div className="sr-click-list">{byButton.length?byButton.map(c=><div className="sr-click-row" key={c.key}><span className="sr-click-dot">✓</span><strong>{c.key}</strong><span className="sr-click-count">{c.times.length}</span><small>First: {fmt(c.times[0])} | Last: {fmt(c.times[c.times.length-1])}</small></div>):<p className="sr-muted">No recorded button clicks</p>}</div>}</>:<div className="sr-click-empty">No {channel==='whatsapp'?'WhatsApp':'Email'} reminder delivery or button clicks recorded for this stage.</div>}</div>}

export default function SmartAppointmentReminders({base,token,view='overview'}){
 const [settings,setSettings]=useState(DEFAULT),[settingsError,setSettingsError]=useState(''),[bookings,setBookings]=useState([]),[deliveries,setDeliveries]=useState([]),[manualTests,setManualTests]=useState([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[period,setPeriod]=useState('today'),[customStart,setCustomStart]=useState(''),[customEnd,setCustomEnd]=useState(''),[mode,setMode]=useState('offline'),[search,setSearch]=useState(''),[expanded,setExpanded]=useState(null),[recipient,setRecipient]=useState('student'),[detail,setDetail]=useState('window'),[stage,setStage]=useState('4h'),[settingsTab,setSettingsTab]=useState('stages'),[clicks,setClicks]=useState({}),[clickBusy,setClickBusy]=useState(null),[showAdvancedFilters,setShowAdvancedFilters]=useState(false),[statusFilter,setStatusFilter]=useState('all');
 const [autoRefresh,setAutoRefresh]=useState(true),[lastUpdated,setLastUpdated]=useState(null);
 const pollingBusy=useRef(false);
 const request=useCallback(async(path,method='GET',body)=>{const r=await fetch(`${base}${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json().catch(()=>({}));if(!r.ok||j.success===false)throw Error(j.message||`HTTP ${r.status}`);return j.data??j},[base,token]);
 const reload=useCallback(async()=>{setLoading(true);setError('');const results=await Promise.allSettled([request('/admin/booking'),request('/admin/booking/smart-reminders/tracking'),request('/admin/booking/smart-reminders/settings'),request('/admin/booking/smart-reminders/manual-tests')]);if(results[0].status==='fulfilled')setBookings(Array.isArray(results[0].value)?results[0].value:[]);else setError('Unable to load appointments: '+results[0].reason.message);if(results[1].status==='fulfilled')setDeliveries(Array.isArray(results[1].value)?results[1].value:[]);else{setDeliveries([]);setNotice('Smart reminder delivery tracking is not available until the approved database migration is installed. No sample tracking is shown.')}if(results[2].status==='fulfilled')setSettings({...DEFAULT,...results[2].value,stage_minutes:{offline:{...DEFAULT.stage_minutes.offline,...results[2].value.stage_minutes?.offline},online:{...DEFAULT.stage_minutes.online,...results[2].value.stage_minutes?.online}}});else setSettingsError(results[2].reason.message);if(results[3].status==='fulfilled')setManualTests(Array.isArray(results[3].value)?results[3].value:[]);else setManualTests([]);setLoading(false)},[request]);
 useEffect(()=>{if(token)reload()},[token,reload]);
 // Poll tracking data only while this submenu is active. Do not remount cards,
 // reset expanded panels, or overwrite the entire CRM on each 5-second tick.
 const refreshTracking=useCallback(async()=>{
  if(pollingBusy.current||!token)return;
  pollingBusy.current=true;
  try{
   const results=await Promise.allSettled([request('/admin/booking'),request('/admin/booking/smart-reminders/tracking'),request('/admin/booking/smart-reminders/manual-tests')]);
   if(results[0].status==='fulfilled')setBookings(Array.isArray(results[0].value)?results[0].value:[]);
   if(results[1].status==='fulfilled')setDeliveries(Array.isArray(results[1].value)?results[1].value:[]);
   if(results[2].status==='fulfilled')setManualTests(Array.isArray(results[2].value)?results[2].value:[]);
   if(results.every(r=>r.status==='fulfilled'))setLastUpdated(new Date().toISOString());
  }catch(_e){/* retain last verified tracking on transient failure */}
  finally{pollingBusy.current=false;}
 },[request,token]);
 useEffect(()=>{if(view!=='tracking'||!autoRefresh||!token)return;const timer=setInterval(()=>{if(!document.hidden)refreshTracking()},5000);return()=>clearInterval(timer)},[view,autoRefresh,token,refreshTracking]);
 const today=day(new Date()),dates=useMemo(()=>({today:[today,today],tomorrow:[shift(today,1),shift(today,1)],yesterday:[shift(today,-1),shift(today,-1)],next7:[today,shift(today,6)],last7:[shift(today,-6),today],custom:[customStart,customEnd],all:['','']}),[today,customStart,customEnd]);
 const filtered=useMemo(()=>bookings.filter(b=>{const d=day(b.starts_at),[from,to]=dates[period]||['',''];return d&&(!from||d>=from)&&(!to||d<=to)}),[bookings,dates,period]);
 const modes=useMemo(()=>({offline:filtered.filter(b=>String(b.mode).toLowerCase()==='offline'),online:filtered.filter(b=>String(b.mode).toLowerCase()==='online')}),[filtered]);
 const shown=useMemo(()=>modes[mode].filter(b=>{const match=[b.booking_ref,b.student_name,b.booked_by,b.counsellor_name].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()));if(!match)return false;if(statusFilter==='all')return true;const d=deliveries.filter(x=>String(x.booking_id)===String(b.id));const status=d.some(x=>x.status==='failed')?'failed':d.some(x=>x.sent_at)?'sent':d.length?'scheduled':'not-sent';return status===statusFilter}),[modes,mode,search,statusFilter,deliveries]);
 const events=useMemo(()=>deliveries.filter(d=>{const b=bookings.find(x=>String(x.id)===String(d.booking_id));return b&&filtered.some(x=>String(x.id)===String(b.id))}),[deliveries,bookings,filtered]);
 const stats=useMemo(()=>({scheduled:events.filter(x=>!x.sent_at).length,sent:events.filter(x=>x.sent_at).length,delivered:events.filter(x=>x.delivered_at).length,confirmed:events.filter(x=>x.clicked_at).length,pending:events.filter(x=>x.sent_at&&!x.delivered_at).length,failed:events.filter(x=>statusOf(x)==='failed').length}),[events]);
 const last14=useMemo(()=>Array.from({length:14},(_,i)=>{const d=shift(today,i-13),e=deliveries.filter(x=>day(x.created_at)===d);return {date:d,scheduled:e.length,sent:e.filter(x=>x.sent_at).length,delivered:e.filter(x=>x.delivered_at).length,confirmed:e.filter(x=>x.clicked_at).length}}),[deliveries,today]);
 const recent=useMemo(()=>[...deliveries].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5),[deliveries]);
 const upcoming=useMemo(()=>bookings.filter(b=>new Date(b.starts_at)>new Date()).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at)).slice(0,5),[bookings]);
 const loadClicks=async id=>{setClickBusy(id);try{const rows=await request(`/admin/booking/smart-reminders/tracking/${encodeURIComponent(id)}/clicks?limit=100`);setClicks(x=>({...x,[id]:rows}))}catch(e){setError(e.message)}finally{setClickBusy(null)}};
 const toggle=(m,s,ch)=>setSettings(v=>({...v,[m]:{...v[m],[s]:{...v[m][s],[ch]:!v[m][s][ch]}}}));
 const stageTime=(m,s)=>settings.stage_minutes?.[m]?.[s]??DEFAULT.stage_minutes[m][s];
 const prettyMinutes=n=>`${Math.floor(n/60)?`${Math.floor(n/60)}h`:''}${n%60?` ${n%60}m`:''}`.trim()||'0m';
 const changeMinutes=(kind,m,s,unit,value)=>setSettings(old=>{const oldValue=kind==='stage'?old.stage_minutes?.[m]?.[s]??DEFAULT.stage_minutes[m][s]:old.fallback_minutes?.[s]??DEFAULT.fallback_minutes[s];const next=(unit==='h'?Number(value)*60+oldValue%60:Math.floor(oldValue/60)*60+Number(value));return kind==='stage'?{...old,stage_minutes:{...old.stage_minutes,[m]:{...old.stage_minutes[m],[s]:next}}}:{...old,fallback_minutes:{...old.fallback_minutes,[s]:next}}});
 const timeSelect=(kind,m,s)=>{const value=kind==='stage'?stageTime(m,s):settings.fallback_minutes?.[s]??DEFAULT.fallback_minutes[s];return <span className="sr-time-pickers"><select aria-label={`${m} ${s} ${kind} hours`} value={Math.floor(value/60)} onChange={e=>changeMinutes(kind,m,s,'h',e.target.value)}>{Array.from({length:25},(_,n)=><option key={n} value={n}>{n}h</option>)}</select><select aria-label={`${m} ${s} ${kind} minutes`} value={value%60} onChange={e=>changeMinutes(kind,m,s,'m',e.target.value)}>{Array.from({length:60},(_,n)=><option key={n} value={n}>{n}m</option>)}</select></span>};
 const save=async()=>{setSaving(true);setError('');setNotice('');try{const saved=await request('/admin/booking/smart-reminders/settings','PUT',{...settings,master_enabled:false});setSettings({...DEFAULT,...saved,master_enabled:false});setNotice('Settings saved. Master Automation remains OFF.')}catch(e){setError(e.message)}finally{setSaving(false)}};
 const [testBusy,setTestBusy]=useState({}),[testErrors,setTestErrors]=useState({});
 const [consentEvidence,setConsentEvidence]=useState(''),[consentAttested,setConsentAttested]=useState(false),[consentBusy,setConsentBusy]=useState(false);
 const [consentResult,setConsentResult]=useState(null);
 const recordConsent=async(b)=>{if(!consentAttested||consentEvidence.trim().length<15)return; if(!window.confirm(`Confirm you independently verified explicit WhatsApp messaging opt-in from ${recipient} for booking ${b.booking_ref}? This records an auditable consent; it does not send a message.`))return;const target={bookingId:String(b.id),recipient};setConsentResult(null);setConsentBusy(true);try{const result=await request('/admin/booking/smart-reminders/record-consent','POST',{booking_id:b.id,recipient_type:recipient,confirmation:'I_CONFIRMED_EXPLICIT_WHATSAPP_OPT_IN',evidence:consentEvidence.trim()});if(result?.success!==true)throw new Error(result?.message||'Consent API did not confirm success');setConsentEvidence('');setConsentAttested(false);try{await reload()}catch(refreshError){console.warn('Smart reminder consent refresh:',refreshError)}setConsentResult({...target,ok:true,message:result.message||'Consent recorded by server. This does not send a message.'})}catch(e){setConsentResult({...target,ok:false,message:e.message||'Consent request failed'});}finally{setConsentBusy(false)}};
 const sendManualTest=async(b,channel)=>{const key=`${b.id}:${recipient}:${stage}:${channel}`;if(!window.confirm(`Send a REAL ${stage} ${channel.toUpperCase()} TEST to ${recipient} for booking ${b.booking_ref}? This contacts the actual recipient immediately. Master Automation remains OFF.`))return;setTestBusy(v=>({...v,[key]:true}));setTestErrors(v=>({...v,[key]:''}));setError('');setNotice('');try{const result=await request('/admin/booking/smart-reminders/manual-test','POST',{booking_id:b.id,recipient_type:recipient,channel,stage,confirm:'SEND_REAL_TEST'});setNotice(`Manual ${channel} test: ${result.status}. Provider acceptance is not delivery confirmation.`);await reload()}catch(e){setTestErrors(v=>({...v,[key]:e.message}));await reload()}finally{setTestBusy(v=>({...v,[key]:false}))}};
 const selectBooking=b=>{setExpanded(x=>x===b.id?null:b.id);setRecipient('student');setStage('4h');setDetail('window')};
 return <section id="bk-smart-reminders-panel" className={"bk-card sr-root "+(view==='overview'?'sr-overview-page':'')}><header className="sr-header"><div className="sr-heading"><span className="sr-heading-icon">{view==='tracking'?<TrackingIcon name="building" size={32}/>:view==='overview'?<ApprovedOverviewIcon name="bell" size={34}/>:<Icon name="settings"/>}</span><div><h2>{view==='overview'?'Smart Appointment Reminders - Overview':view==='tracking'?'Delivery & Tracking':'Reminder Settings'}</h2><p>{view==='overview'?'Complete summary of appointment reminder system performance and monitoring':view==='tracking'?'Appointment reminder history · Track WhatsApp & Email delivery, clicks and 24h window activity':'Configure automated appointment reminders, channels and tracking options'}</p></div></div><div className="sr-header-right">{view==='tracking'&&<div className="sr-live-refresh"><label><input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)}/> Auto Refresh · 5 sec</label><button type="button" onClick={refreshTracking} title="Fetch latest delivery and click events now">↻ Refresh Now</button>{lastUpdated&&<small>Updated {fmt(lastUpdated)}</small>}</div>}<span className="sr-automation"><TrackingIcon name="lock" size={17}/> Automation OFF</span><time>{fmt(new Date())}</time><button type="button" className="sr-refresh" title="Refresh" onClick={reload} disabled={loading}>↻</button></div></header>{error&&<div className="sr-alert sr-error" role="alert">{error}</div>}{notice&&<div className="sr-alert sr-info" role="status">{notice}</div>}{loading&&<div className="sr-alert sr-info">Loading actual CRM records…</div>}
 {view==='overview'&&<div className="sr-content"><div className="sr-mode-summary">{['offline','online'].map(m=><div className="sr-mode-banner" key={m}><span className="sr-overview-mode-icon"><ApprovedOverviewIcon name={m==='offline'?'building':'video'} size={36}/></span><div><b>{m==='offline'?'Offline':'Online'} Appointments</b><small>{m==='offline'?'In-person appointments':'Virtual appointments'}</small><small>{(m==='offline'?['4h','2h','1h']:['4h','2h','1h','5min']).map(k=>prettyMinutes(stageTime(m,k))).join(' · ')} reminders</small></div><div className="sr-banner-number"><strong>{bookings.filter(b=>day(b.starts_at)===today&&b.mode===m).length}</strong><small>Today</small></div><div className="sr-banner-number"><strong>{bookings.filter(b=>day(b.starts_at)>=today&&day(b.starts_at)<=shift(today,6)&&b.mode===m).length}</strong><small>Next 7 Days</small></div></div>)}</div><div className="sr-kpis">{[['calendar','Scheduled',stats.scheduled,"Today's reminders"],['send','Sent',stats.sent,'WhatsApp + Email'],['delivered','Delivered',stats.delivered,'Successfully delivered'],['confirmed','Confirmed',stats.confirmed,'Button interactions'],['pending','Pending',stats.pending,'Awaiting delivery'],['failed','Failed',stats.failed,'Delivery failed']].map(([n,l,v,s])=><Tile key={n} name={n} label={l} value={v} subtitle={s}/>)}</div><div className="sr-grid sr-grid-top"><div className="sr-panel"><h3>Reminder Performance <small>(Last 14 Days)</small></h3><Trend rows={last14}/></div><div className="sr-panel"><h3>Delivery Status <small>(Selected Appointments)</small></h3><div className="sr-donut-layout"><Donut items={[stats.sent,stats.delivered,stats.confirmed,stats.pending,stats.failed]} total={Object.values(stats).reduce((a,b)=>a+b,0)}/><div className="sr-donut-labels">{[['Sent',stats.sent],['Delivered',stats.delivered],['Confirmed',stats.confirmed],['Pending',stats.pending],['Failed',stats.failed]].map(([k,v])=><div key={k}>{k}<b>{v}</b></div>)}</div></div></div><div className="sr-panel"><h3>Channel Performance <small>(Today)</small></h3>{['whatsapp','email'].map(ch=>{const e=deliveries.filter(x=>x.channel===ch&&day(x.created_at)===today),s=e.filter(x=>x.sent_at).length,v=e.filter(x=>ch==='email'?x.opened_at:x.delivered_at).length,p=s?Math.round(100*v/s):0;return <div className="sr-progress-row" key={ch}><span className={"sr-overview-channel-icon sr-overview-channel-"+ch}><OverviewIcon name={ch==='email'?'mail':'whatsapp'} size={29}/></span><div><b>{ch==='email'?'Email':'WhatsApp'}</b><small>{s} sent</small><div className="sr-progress"><span style={{width:p+'%'}}/></div><small>{ch==='email'?'Opened':'Delivered'}</small></div><strong>{p}%</strong></div>})}</div></div><div className="sr-grid sr-grid-mid"><div className="sr-panel"><h3>Appointment Type Distribution <small>(Today)</small></h3><div className="sr-donut-layout"><Donut items={[modes.offline.length,modes.online.length]} total={filtered.length}/><div className="sr-donut-labels"><div>Offline <b>{modes.offline.length}</b></div><div>Online <b>{modes.online.length}</b></div></div></div></div><div className="sr-panel"><h3>Reminder Stage Distribution <small>(Today)</small></h3><div className="sr-bars">{['4h','2h','1h','5min'].map((s,i)=>{const n=events.filter(x=>x.stage===s).length,max=Math.max(1,...['4h','2h','1h','5min'].map(k=>events.filter(x=>x.stage===k).length));return <div key={s}><b>{n}</b><span style={{height:Math.max(3,n/max*80)+'px',background:['#2189f6','#1383ef','#803df1','#ff5c8c'][i]}}/><small>{s}</small></div>})}</div></div><div className="sr-panel"><h3>24h Window Status <small>(Recipients)</small></h3><p className="sr-muted">Recipient window metrics will appear when verified inbound-window event data is available.</p><div className="sr-progress-row sr-window-progress"><div><b>Students</b><div className="sr-progress"/></div><span>—</span></div><div className="sr-progress-row sr-window-progress"><div><b>Parents / Guardians</b><div className="sr-progress"/></div><span>—</span></div></div><div className="sr-panel"><h3>Today's Summary</h3>{[['Reminders Due',events.length,'calendar'],['Completed',stats.delivered,'check'],['In Progress',stats.pending,'clock'],['Issues',stats.failed,'alert']].map(([n,v,ic])=><div className="sr-summary-line" key={n}><span className="sr-summary-name"><span className={'sr-summary-icon sr-summary-'+ic}><OverviewIcon name={ic} size={17}/></span>{n}</span><b>{v}</b></div>)}</div></div><div className="sr-grid sr-grid-bottom"><div className="sr-panel"><h3>Recent Reminder Activity <small>(Latest events)</small></h3>{recent.length?recent.map(r=><div className="sr-activity sr-overview-activity" key={r.id}><span className={"sr-activity-icon sr-activity-"+r.channel}><OverviewIcon name={r.channel==='email'?'mail':'whatsapp'} size={20}/></span><span><b>{r.stage} reminder · {r.channel}</b><small>Booking ID {r.booking_id} · {fmt(r.created_at)}</small></span><span className="sr-tag">{r.status||'Recorded'}</span></div>):<p className="sr-muted">No recorded Smart Reminder activity.</p>}</div><div className="sr-panel"><h3>Upcoming Appointments <small>(Next 5)</small></h3>{upcoming.length?upcoming.map(b=><div className="sr-activity sr-upcoming-activity" key={b.id}><span className="sr-activity-icon sr-activity-calendar"><OverviewIcon name="calendar" size={20}/></span><span><b>{b.student_name} ({b.booking_ref})</b><small>{fmt(b.starts_at)} · {b.mode}</small></span><span className="sr-tag sr-countdown">{futureCountdown(b.starts_at)}</span></div>):<p className="sr-muted">No upcoming appointments.</p>}</div></div></div>}
 {view==='tracking'&&<div className="sr-content sr-tracking-page"><div className="sr-filters"><div className="sr-filter-buttons"><span className="sr-date-icon"><TrackingIcon name="calendar" size={21}/></span>{[['today','Today'],['tomorrow','Tomorrow'],['yesterday','Yesterday'],['next7','7 Days'],['custom','Custom Date'],['all','All History']].map(([k,l])=><button type="button" className={period===k?'selected':''} key={k} onClick={()=>setPeriod(k)}>{k==='custom'||k==='all'?<TrackingIcon name={k==='custom'?'calendar':'history'} size={16}/>:null}{l}</button>)}</div><div className="sr-search-filter"><label className="sr-search-box"><TrackingIcon name="search" size={19}/><input aria-label="Search booking" placeholder="Search by Booking Ref / Student Name..." value={search} onChange={e=>setSearch(e.target.value)}/></label><button type="button" className={'sr-advanced-btn '+(showAdvancedFilters?'selected':'')} onClick={()=>setShowAdvancedFilters(x=>!x)} aria-expanded={showAdvancedFilters}><TrackingIcon name="filter" size={19}/> Filters</button></div></div>{period==='custom'&&<div className="sr-custom"><label>From <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}/></label><label>To <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/></label></div>}{showAdvancedFilters&&<div className="sr-advanced-panel"><label>Reminder Status <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="sent">Sent</option><option value="scheduled">Scheduled</option><option value="failed">Failed</option><option value="not-sent">Not Sent</option></select></label><span>Filtered by appointment date, not booking date.</span></div>}<div className="sr-mode-summary sr-tracking-modes">{['offline','online'].map(m=><button type="button" key={m} className={'sr-mode-banner '+(mode===m?'selected':'')} onClick={()=>{setMode(m);setExpanded(null);setStage('4h')}}><span className="sr-mode-icon"><TrackingIcon name={m==='offline'?'building':'video'} size={34}/></span><span><b>{m==='offline'?'Offline':'Online'} Appointments</b><small>{m==='offline'?'In-person':'Virtual'} appointments · {(m==='offline'?['4h','2h','1h']:['4h','2h','1h','5min']).map(k=>prettyMinutes(stageTime(m,k))).join(' · ')} reminders</small></span><strong>{modes[m].length}<small>{period==='today'?'Today':'Selected'}</small></strong></button>)}</div><div className="sr-table-wrap"><table className="sr-table"><thead><tr>{[['ref','Booking Ref'],['users','Booked By'],['calendar','Date & Time'],['whatsapp','WhatsApp'],['mail','Email'],['clock','24h Window']].map(([icon,label])=><th key={label}><span className={'sr-premium-th sr-premium-th-'+icon}><TrackingIcon name={icon} size={15}/><span>{label}</span></span></th>)}</tr></thead><tbody>{shown.map(b=>{const d=deliveries.filter(x=>String(x.booking_id)===String(b.id)),last=[...d].sort((a,c)=>new Date(c.created_at)-new Date(a.created_at))[0],status=d.some(x=>x.status==='failed')?'Failed':d.some(x=>x.sent_at)?'Sent':d.length?'Scheduled':'Not Sent';const bookingTests=manualTests.filter(t=>String(t.booking_id)===String(b.id));const actor=String(b.booked_by||'').toLowerCase(),actorType=actor.includes('parent')?'parent':actor.includes('counsel')?'counsellor':actor.includes('student')?'student':'other';return <React.Fragment key={b.id}><tr className={'sr-premium-booking-row '+(expanded===b.id?'sr-row-active':'')} onClick={()=>selectBooking(b)} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectBooking(b)}}}><td><span className="sr-chevron"><TrackingIcon name={expanded===b.id?'chevronup':'chevron'} size={15}/></span><b>{b.booking_ref}</b>{(b.course_name||b.course_title||b.course)&&<span className="sr-premium-course"><TrackingIcon name="student" size={11}/>{b.course_name||b.course_title||b.course}</span>}</td><td><span className={'sr-booked-person sr-booked-person-'+actorType}><span className="sr-booked-person-icon"><TrackingIcon name={actorType==='student'?'student':actorType==='parent'?'users':'user'} size={17}/></span><span className="sr-booked-person-copy"><b title={actorType==='parent'?(b.parent_name||b.guardian_name||b.booked_by_name||'Parent'):(b.student_name||b.booked_by_name||'—')}>{actorType==='parent'?(b.parent_name||b.guardian_name||b.booked_by_name||'Parent'):(actorType==='student'?(b.student_name||'Student'):(b.booked_by_name||b.booked_by||'—'))}</b><small>{actorType==='parent'?'Parent / Guardian':actorType==='student'?'Student':b.booked_by||'Other'}</small></span></span></td><td><div className="sr-premium-date-card"><span className="sr-date-cell"><TrackingIcon name="calendar" size={17}/>{fmt(b.starts_at)}</span><BookingRowStatus tests={bookingTests} booking={b}/><BookingOutcomeSource tests={bookingTests} booking={b} settings={settings}/></div></td><td><BookingRowChannel deliveries={d} channel="whatsapp" mode={b.mode} clicks={clicks} tests={bookingTests} booking={b} settings={settings}/></td><td><BookingRowChannel deliveries={d} channel="email" mode={b.mode} clicks={clicks} tests={bookingTests} booking={b} settings={settings}/></td><td><BookingRowWindow/></td></tr>{expanded===b.id&&<tr className="sr-expanded"><td colSpan="6"><div className="sr-expanded-body"><div className="sr-appointment-info"><h4><TrackingIcon name="info" size={19}/> Appointment Details</h4><div><span><TrackingIcon name="user"/>Student: <b>{b.student_name}</b></span><span><TrackingIcon name="ref"/>Booking Ref: <b>{b.booking_ref}</b></span><span><TrackingIcon name="users"/>Booked by: <b>{b.booked_by||'—'}</b></span><span><TrackingIcon name="calendar"/>Appointment: <b>{fmt(b.starts_at)}</b></span><span><TrackingIcon name={b.mode==='online'?'video':'building'}/>Mode: <b>{b.mode}</b></span><span><TrackingIcon name="pin"/>Location: <b>{b.location_name||'—'}</b></span><span><TrackingIcon name="clock"/>Reminder Status: <b>{status}</b></span><span><TrackingIcon name="history"/>Last Activity: <b>{fmt(last?.created_at)}</b></span></div></div><div className="sr-detail-controls"><div className="sr-segments sr-main-segments"><button type="button" className={detail==='window'?'selected':''} onClick={()=>setDetail('window')}>24h Window Management</button><button type="button" className={detail==='reminders'?'selected':''} onClick={()=>setDetail('reminders')}>Appointment Reminders</button></div><div className="sr-recipient-controls"><span>Tracking for:</span><div className="sr-segments sr-recipient-segments"><button type="button" className={recipient==='student'?'selected':''} onClick={()=>setRecipient('student')}>Student</button><button type="button" className={recipient==='parent'?'selected':''} onClick={()=>setRecipient('parent')}>Parent / Guardian</button></div></div></div><div className={'sr-detail-grid '+(detail==='reminders'?'sr-detail-focus-reminders':'') }><div className="sr-detail-window"><WindowPanel recipient={recipient} booking={b}/></div><div className="sr-reminder-detail"><div className="sr-reminder-title"><h4>Channel Tracking — {prettyMinutes(stageTime(mode,stage))} Reminder ({recipient==='student'?'Student':'Parent / Guardian'})</h4><div className="sr-segments sr-stage-segments">{(mode==='online'?['4h','2h','1h','5min']:['4h','2h','1h']).map(s=><button type="button" className={stage===s?'selected':''} onClick={()=>setStage(s)} key={s}>{prettyMinutes(stageTime(mode,s))}</button>)}</div></div><div className="sr-manual-test" style={{padding:'14px',margin:'12px 0',background:'#f0f6ff',borderRadius:12}}><strong>REAL Test Now — {stage} · {recipient==='student'?'Student':'Parent / Guardian'}</strong><p style={{fontSize:12,margin:'7px 0'}}>Send immediately, regardless of reminder stage time. Master Automation OFF · 60-second cooldown per recipient/channel/stage.</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}>{['email','whatsapp'].map(ch=>{const last=manualTests.find(t=>String(t.booking_id)===String(b.id)&&t.recipient_type===recipient&&t.stage===stage&&t.channel===ch);return <div key={ch} style={{flex:'1 1 190px',padding:12,background:'white',borderRadius:10,border:'1px solid #dbe7fa'}}><b>{ch==='email'?'Email':'WhatsApp'}</b><div style={{fontSize:12,margin:'6px 0'}}>Manual test: <b>{last?.status||'Not tested'}</b>{last?.completed_at&&<span> · {fmt(last.completed_at)}</span>}</div>{last?.status==='failed'&&last?.detail&&<div role="alert" style={{fontSize:12,color:'#b42318',margin:'4px 0 8px',overflowWrap:'anywhere'}}>Provider detail: {String(last.detail).slice(0,400)}</div>}<button type="button" disabled={Boolean(testBusy[`${b.id}:${recipient}:${stage}:${ch}`])} onClick={()=>sendManualTest(b,ch)}>{testBusy[`${b.id}:${recipient}:${stage}:${ch}`]?'Sending…':`REAL Test Now — ${ch==='email'?'Email':'WhatsApp'}`}</button>{testErrors[`${b.id}:${recipient}:${stage}:${ch}`]&&<div role="alert" style={{color:'#b42318',fontSize:12,marginTop:7}}>Test failed: {testErrors[`${b.id}:${recipient}:${stage}:${ch}`]}</div>}</div>})}</div><div style={{marginTop:10,padding:10,border:'1px solid #dbe7fa',borderRadius:9,background:'#fff'}}><strong>WhatsApp consent (supervised)</strong><p style={{fontSize:12,margin:'6px 0'}}>24h OPEN or green verification does not itself grant marketing/utility messaging opt-in. Record consent only after independently confirming this recipient explicitly agreed to WhatsApp appointment messages. No automatic approval.</p><textarea aria-label="WhatsApp opt-in evidence" placeholder="Describe when/how this recipient explicitly opted in (minimum 15 characters). Do not enter OTPs or passwords." value={consentEvidence} onChange={e=>setConsentEvidence(e.target.value)} rows={2} style={{width:'100%',boxSizing:'border-box'}}/><label style={{display:'flex',alignItems:'start',gap:6,fontSize:12,margin:'6px 0'}}><input type="checkbox" checked={consentAttested} onChange={e=>setConsentAttested(e.target.checked)}/>I personally confirmed this recipient's explicit WhatsApp appointment-message opt-in.</label><button type="button" disabled={consentBusy||!consentAttested||consentEvidence.trim().length<15} onClick={()=>recordConsent(b)}>{consentBusy?'Recording…':'Record Verified WhatsApp Opt-in'}</button>{consentResult&&consentResult.bookingId===String(b.id)&&consentResult.recipient===recipient&&<div role="status" aria-live="polite" style={{marginTop:9,padding:'9px 11px',borderRadius:7,border:consentResult.ok?'1px solid #b8e4cc':'1px solid #f2b8b5',background:consentResult.ok?'#eefaf2':'#fff1f0',color:consentResult.ok?'#166534':'#b42318',fontSize:12}}>{consentResult.ok?'Consent API success: ':'Consent save failed: '}{consentResult.message}</div>}</div><small style={{display:'block',marginTop:9}}>Manual test audit is separate from scheduled deliveries. Accepted means provider accepted the send, not Delivered/Opened/Read. The current test email has no tracked action buttons; their click tracking cannot be verified from it.</small></div><div className="sr-manual-premium-section"><div className="sr-manual-premium-section-title"><TrackingIcon name="history" size={20}/><div><b>Manual Test — Delivery & Tracking</b><small>Independent from scheduled reminders · Verified events shown in IST</small></div></div><div className="sr-manual-premium-grid">{['whatsapp','email'].map(ch=>{const test=manualTests.find(t=>String(t.booking_id)===String(b.id)&&t.recipient_type===recipient&&t.stage===stage&&t.channel===ch);return <ManualTrackingCard key={ch} test={test} channel={ch} mode={b.mode}/>})}</div><ManualButtonActivity whatsapp={manualTests.find(t=>String(t.booking_id)===String(b.id)&&t.recipient_type===recipient&&t.stage===stage&&t.channel==='whatsapp')} email={manualTests.find(t=>String(t.booking_id)===String(b.id)&&t.recipient_type===recipient&&t.stage===stage&&t.channel==='email')} mode={b.mode}/></div><div className="sr-scheduled-tracking-label"><TrackingIcon name="calendar" size={18}/> Scheduled Reminder — Delivery & Tracking <small>(manual tests are excluded)</small></div><div className="sr-channel-grid">{['whatsapp','email'].map(ch=>{const rec=d.find(x=>String(x.recipient_type).toLowerCase().includes(recipient)&&x.stage===stage&&x.channel===ch);const test=manualTests.find(t=>String(t.booking_id)===String(b.id)&&t.recipient_type===recipient&&t.stage===stage&&t.channel===ch);return <div key={ch}><Channel channel={ch} delivery={rec} onClicks={loadClicks} clicks={rec?clicks[rec.id]:undefined} loading={rec&&clickBusy===rec.id}/></div>})}</div></div></div></div></td></tr>}</React.Fragment>})}</tbody></table>{!shown.length&&<p className="sr-muted sr-empty">No {mode} appointments for the selected appointment date filter.</p>}</div></div>}
{view==='settings'&&<div className="sr-content sr-settings-page"><div className={'sr-master '+(settings.master_enabled?'sr-master-on':'')}><span className="sr-master-lock"><TrackingIcon name="lock" size={43}/></span><div><h3>Master Automation — <em>{settings.master_enabled?'ON':'OFF'}</em></h3><p>{settings.master_enabled?'ON selected — live dispatch requires scheduler installation.':'WhatsApp/Email dispatch and scheduler are currently on hold.'}<br/>Enable only after complete testing and explicit approval.</p></div><label className="sr-master-toggle"><span>Master ON/OFF</span><span className="sr-switch"><input type="checkbox" checked={!!settings.master_enabled} onChange={e=>setSettings(v=>({...v,master_enabled:e.target.checked}))} aria-label="Master Automation ON OFF"/><span/></span></label><div className="sr-master-status"><b>System Status</b><small className="sr-disabled-status"><i/> {settings.master_enabled?'Pending Scheduler — Not Active':'Automation Disabled'}</small><small>No automatic reminders are being sent.<br/>All settings can be configured and saved.</small></div><button type="button" className="sr-save" onClick={save} disabled={saving||!!settingsError}>{saving?'Saving…':<><TrackingIcon name="ref" size={19}/> Save Settings</>}</button></div>{settingsError&&<div className="sr-alert sr-error">Settings API: {settingsError}</div>}<div className="sr-settings-tabs">{[['stages','Reminder Stages'],['channels','Channels & Templates'],['window','24h Window Management'],['fallback','Email Fallback'],['retention','Tracking & Retention']].map(([k,l])=><button type="button" key={k} className={settingsTab===k?'selected':''} onClick={()=>setSettingsTab(k)}>{l}</button>)}</div>{settingsTab==='stages'&&<div className="sr-settings-grid">{['offline','online'].map(m=><div className="sr-panel" key={m}><div className="sr-setting-card-title"><span className="sr-overview-mode-icon"><ApprovedOverviewIcon name={m==='offline'?'building':'video'} size={36}/></span><div><h3>{m==='offline'?'Offline':'Online'} Appointment Reminders</h3><small>{m==='offline'?'In-person':'Virtual'} appointments · {(m==='offline'?['4h','2h','1h']:['4h','2h','1h','5min']).map(k=>prettyMinutes(stageTime(m,k))).join(' · ')} reminders</small></div><span className="sr-tag sr-tag-configured"><TrackingIcon name="check" size={16}/> Configured</span></div><table className="sr-settings-table"><thead><tr><th>Stage</th><th>Send via WhatsApp</th><th>Send via Email</th><th>Email Fallback</th><th>Status</th></tr></thead><tbody>{Object.entries(settings[m]||DEFAULT[m]).map(([s,channels])=><tr key={s}><td><b>{timeSelect('stage',m,s)}</b><small>before appointment</small></td>{['whatsapp','email'].map(ch=><td key={ch}><label className={'sr-switch sr-switch-'+ch}><input type="checkbox" checked={!!channels[ch]} onChange={()=>toggle(m,s,ch)} aria-label={`${m} ${s} ${ch}`}/><span/></label></td>)}<td>{s==='5min'?'Send together':timeSelect('fallback',m,s)}</td><td><span className={'sr-tag '+(channels.whatsapp||channels.email?'sr-tag-enabled':'sr-tag-disabled')}>{channels.whatsapp||channels.email?'Enabled':'Disabled'}</span></td></tr>)}</tbody></table></div>)}</div>}{settingsTab==='channels'&&<div className="sr-panel"><h3>Channels & Templates</h3><p className="sr-muted">Stage-level WhatsApp and Email switches are configured in Reminder Stages. CLOSED-window messages must use an approved Utility Template. No new template is dispatched while Master Automation is OFF.</p></div>}{settingsTab==='window'&&<div className="sr-panel"><h3>24h Window Management</h3><div className="sr-setting-line"><b>Maximum extension attempts</b><span>2 attempts (Day 1 & Day 2)</span></div><div className="sr-setting-line"><b>Send before window expiry</b><span>2 hours</span></div><div className="sr-setting-line"><b>Closed window</b><span>Approved Utility Template policy</span></div><p className="sr-muted">Extension dispatch remains HOLD. Valid inbound recipient reply is required to reopen the 24h WhatsApp window.</p></div>}{settingsTab==='fallback'&&<div className="sr-panel"><h3>Email Fallback</h3>{['4h','2h','1h'].map(s=><div className="sr-setting-line" key={s}><b>{prettyMinutes(stageTime('offline',s))} reminder</b><span>{prettyMinutes(settings.fallback_minutes?.[s]??DEFAULT.fallback_minutes[s])} after WhatsApp, if unconfirmed</span></div>)}<div className="sr-setting-line"><b>Online 5min</b><span>WhatsApp and Email together</span></div><p className="sr-muted">If WhatsApp is OFF, Email is sent at the stage time. Earlier confirmations do not suppress later stages.</p></div>}{settingsTab==='retention'&&<div className="sr-panel"><h3>Tracking & Data Retention</h3><div className="sr-setting-line"><b>Tracking retention</b><span>15 days (planned)</span></div><div className="sr-setting-line"><b>Automatic deletion</b><span>HOLD — not activated</span></div><div className="sr-setting-line"><b>Button click tracking</b><span>Available when tracking schema is installed</span></div><p className="sr-muted">Existing Internal Team Alerts tracking remains unchanged.</p></div>}<div className="sr-settings-lower">
 <div className="sr-panel sr-settings-bottom-card">
  <div className="sr-bottom-heading"><span className="sr-bottom-icon"><OverviewIcon name="send" size={27}/></span><div><h3>Channel Configuration</h3><p>Enable or disable channels for appointment reminders</p></div></div>
  {['whatsapp','email'].map(ch=>{const enabled=['offline','online'].some(m=>Object.values(settings[m]||{}).some(stage=>!!stage[ch]));return <label key={ch} className="sr-global-channel"><span className={'sr-global-channel-icon sr-global-'+ch}><TrackingIcon name={ch==='whatsapp'?'whatsapp':'mail'} size={27}/></span><span className="sr-global-channel-text"><b>{ch==='whatsapp'?'WhatsApp':'Email'} Reminders</b><small>{ch==='whatsapp'?'Send reminder messages via WhatsApp (using templates and 24h window rules)':'Send reminder emails with confirmation and action buttons'}</small></span><span className={'sr-switch sr-switch-'+ch}><input type="checkbox" checked={enabled} onChange={e=>{const checked=e.target.checked;setSettings(v=>({...v,offline:Object.fromEntries(Object.entries(v.offline).map(([key,stage])=>[key,{...stage,[ch]:checked}])),online:Object.fromEntries(Object.entries(v.online).map(([key,stage])=>[key,{...stage,[ch]:checked}]))}))}} aria-label={'All '+ch+' reminder stages'}/><span/></span></label>})}
 </div>
 <div className="sr-panel sr-settings-bottom-card">
  <div className="sr-bottom-heading"><span className="sr-bottom-icon"><TrackingIcon name="clock" size={27}/></span><div><h3>24h Window Management</h3><p>Settings for 24-hour WhatsApp window extension</p></div></div>
  <div className="sr-bottom-field"><label>Window Extension Attempts</label><select disabled value="2" aria-label="Window extension attempts"><option value="2">2 attempts (Day 1 &amp; Day 2)</option></select><span className="sr-help" title="Fixed policy; dispatch is on hold">?</span></div>
  <div className="sr-bottom-field"><label>Send reminder before expiry</label><select disabled value="2" aria-label="Send before expiry"><option value="2">2 hours before expiry</option></select><span className="sr-help" title="No automatic window extension sending is active">?</span></div>
  <div className="sr-bottom-field"><label>Utility Template (CLOSED window)</label><select disabled value="approved" aria-label="Closed window template"><option value="approved">Use approved template</option></select><span className="sr-help" title="Requires approved utility template and backend integration">?</span></div>
  <div className="sr-bottom-note"><TrackingIcon name="info" size={19}/><span>Extension attempts are sent only if a valid 24h window is open based on recipient's inbound reply (Student / Parent separately). Sending remains on HOLD.</span></div>
 </div>
 <div className="sr-panel sr-settings-bottom-card">
  <div className="sr-bottom-heading"><span className="sr-bottom-icon"><TrackingIcon name="ref" size={27}/></span><div><h3>Tracking &amp; Data Retention</h3><p>History retention and tracking configuration</p></div></div>
  <div className="sr-bottom-field"><label>Tracking Retention Period</label><select disabled value="15" aria-label="Tracking retention"><option value="15">15 days</option></select><span className="sr-help" title="Retention cleanup has not been activated">?</span></div>
  <div className="sr-bottom-field"><label>Delete after retention period</label><select disabled value="hold" aria-label="Automatic deletion"><option value="hold">On Hold (Manual only)</option></select><span className="sr-help" title="Automatic deletion is disabled">?</span></div>
  <div className="sr-bottom-field"><label>Track Button Clicks</label><select disabled value="enabled" aria-label="Track button clicks"><option value="enabled">Enabled when available</option></select><span className="sr-help" title="Requires tracking schema and event data">?</span></div>
  <div className="sr-bottom-field"><label>Store Message Status</label><select disabled value="enabled" aria-label="Store message status"><option value="enabled">Enabled when available</option></select><span className="sr-help" title="Requires tracking schema and event data">?</span></div>
  <div className="sr-bottom-note"><TrackingIcon name="info" size={19}/><span>Automatic deletion is currently on hold. Historical data will be maintained for analysis and review.</span></div>
 </div>
 </div></div>}
 </section>;
}
