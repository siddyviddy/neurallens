import { useState, useRef } from "react";

const MODAL_API = "https://siddhantiyer96--neurallens-pipeline-fastapi-app.modal.run";
const G = "linear-gradient(135deg,#e879f9,#a78bfa,#60a5fa)";
const gTxt = { background:G, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" };
const PLATFORMS = ["Instagram","LinkedIn","Twitter / X","TikTok","Facebook","YouTube"];
const GOALS = ["Drive engagement","Build brand awareness","Generate leads","Drive sales","Entertain & inspire"];

async function runPipeline(file, platform, goal, extra, onStatus) {
  onStatus("Sending to GPU pipeline…");
  const form = new FormData();
  form.append("video", file, file.name);
  form.append("platform", platform);
  form.append("goal", goal);
  form.append("extra", extra);
  const res = await fetch(MODAL_API, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Pipeline error: ${await res.text()}`);
  return await res.json();
}

async function getClaudeReport(pipelineResult) {
  const { neural, assembly, transcript, meta } = pipelineResult;
  const tl = neural.activation_timeline || [];
  const peakSec = neural.peak_segment && tl.length ? `segment ${neural.peak_segment} of ${tl.length}` : "unknown";
  const chapterText = assembly.chapters?.length ? assembly.chapters.map((c,i)=>`Chapter ${i+1}: ${c.summary}`).join("\n") : "No chapters detected";
  const sentimentText = assembly.sentiment?.length ? assembly.sentiment.map(s=>`"${s.text}" → ${s.sentiment}`).join("\n") : "No sentiment data";
  const prompt = `You are an expert content strategist with real TRIBE v2 neural brain scan data and AssemblyAI transcript analysis for a video.

TRIBE v2 NEURAL DATA:
- Language processing: ${neural.language_processing}/100
- Visual imagery: ${neural.visual_imagery}/100
- Attention capture: ${neural.attention_capture}/100
- Emotional valence: ${neural.emotional_valence}/100
- Overall brain engagement: ${neural.overall_brain_engagement}/100
- Viral potential: ${neural.viral_potential}/100
- Peak activation: ${peakSec}
- Dominant hemisphere: ${neural.dominant_hemisphere}

ASSEMBLYAI TRANSCRIPT:
"${(transcript||"").slice(0,800)}"

VIDEO CHAPTERS:
${chapterText}

SENTIMENT ANALYSIS:
${sentimentText}

Platform: ${meta.platform}
Goal: ${meta.goal}
${meta.extra?`Context: ${meta.extra}`:""}

Return ONLY valid JSON:
{
  "verdict": "Strong performer",
  "verdictSub": "One sentence on why this content works or doesn't.",
  "scores": {
    "hookStrength": 0,
    "messageClarity": 0,
    "emotionalResonance": 0,
    "callToAction": 0,
    "audienceAlignment": 0
  },
  "performanceLevel": "High",
  "performanceNote": "One sentence predicting real-world engagement.",
  "peakMoment": "Describe when in the video the brain activates most.",
  "strengths": ["strength","strength","strength"],
  "improvements": ["fix","fix","fix"],
  "quickWin": "The single most impactful change to make right now.",
  "bestAudience": "Who will respond best to this content."
}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1200,
      system:"Return only valid JSON. No markdown. No backticks.",
      messages:[{role:"user",content:prompt}] })
  });
  const data = await res.json();
  return JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim());
}

function ScoreBar({ label, score }) {
  const c = score>=72?"#a78bfa":score>=48?"#60a5fa":"#e879f9";
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,color:"#94a3b8"}}>{label}</span>
        <span style={{fontSize:12,fontWeight:600,color:c}}>{score}<span style={{fontSize:10,color:"#334155",fontWeight:400}}>/100</span></span>
      </div>
      <div style={{height:5,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${score}%`,background:`linear-gradient(90deg,${c}88,${c})`,borderRadius:99,transition:"width 1.4s cubic-bezier(.16,1,.3,1)"}}/>
      </div>
    </div>
  );
}

function Pill({children,color="#a78bfa"}) {
  return <span style={{padding:"3px 11px",borderRadius:99,fontSize:11,fontWeight:500,background:`${color}18`,color,border:`1px solid ${color}28`,display:"inline-block"}}>{children}</span>;
}

function NeuralBadge({label,value,color}) {
  return (
    <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(167,139,250,0.1)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
      <div style={{fontSize:10,color:"#475569",marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color}}>{Math.round(value)}</div>
    </div>
  );
}

function Timeline({data}) {
  if (!data?.length) return null;
  const max = Math.max(...data);
  const peakIdx = data.indexOf(max);
  return (
    <div>
      <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Brain activation timeline</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:1.5,height:56}}>
        {data.map((v,i)=>{
          const h = max>0?Math.max(3,(v/max)*56):3;
          const isPeak = i===peakIdx;
          return (
            <div key={i} style={{flex:1,height:h,borderRadius:2,position:"relative",
              background:isPeak?"#e879f9":`rgba(167,139,250,${0.15+(v/max)*0.65})`,
              transition:"height 1s ease"}}>
              {isPeak&&<div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",fontSize:7,color:"#e879f9",whiteSpace:"nowrap"}}>peak</div>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
        <span style={{fontSize:9,color:"#1e293b"}}>0:00</span>
        <span style={{fontSize:9,color:"#1e293b"}}>end</span>
      </div>
    </div>
  );
}

function Steps({current}) {
  const list = ["Upload","Analyse","Report"];
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:26}}>
      {list.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff",
              background:current>i+1?G:current===i+1?G:"rgba(255,255,255,0.05)",
              border:current===i+1?"none":"1px solid rgba(255,255,255,0.07)",
              boxShadow:current===i+1?"0 0 18px rgba(167,139,250,0.3)":"none",
              opacity:current<i+1?.4:1}}>
              {current>i+1?"✓":i+1}
            </div>
            <span style={{fontSize:10,fontWeight:current===i+1?500:400,color:current===i+1?"#a78bfa":"#2d3748"}}>{s}</span>
          </div>
          {i<list.length-1&&<div style={{width:46,height:1,margin:"0 6px",marginBottom:14,background:current>i+1?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.05)"}}/>}
        </div>
      ))}
    </div>
  );
}

const card = {background:"rgba(255,255,255,0.025)",border:"1px solid rgba(167,139,250,0.1)",borderRadius:16,padding:18};
const softInput = {background:"rgba(255,255,255,0.035)",border:"1px solid rgba(167,139,250,0.14)",borderRadius:10,color:"#e2e8f0",fontSize:12,outline:"none",width:"100%"};

export default function NeuralLens() {
  const [slots,setSlots] = useState([null,null,null]);
  const [platform,setPlatform] = useState("Instagram");
  const [goal,setGoal] = useState("Drive engagement");
  const [extra,setExtra] = useState("");
  const [ctx,setCtx] = useState(false);
  const [screen,setScreen] = useState("upload");
  const [statusMsg,setStatusMsg] = useState("");
  const [results,setResults] = useState([]);
  const [active,setActive] = useState(0);
  const [error,setError] = useState(null);
  const refs = [useRef(),useRef(),useRef()];

  const setFile = (i,file) => {
    if (!file) return;
    setSlots(p=>{const n=[...p];n[i]={file,preview:URL.createObjectURL(file)};return n;});
  };

  const activeSlots = slots.map((s,i)=>s?i:-1).filter(x=>x>=0);

  const analyze = async () => {
    if (!activeSlots.length) return;
    setScreen("analyzing"); setError(null);
    const out = [];
    for (let i=0;i<activeSlots.length;i++) {
      const idx = activeSlots[i];
      try {
        setStatusMsg(`Processing video ${i+1} of ${activeSlots.length}…`);
        const pipelineResult = await runPipeline(slots[idx].file,platform,goal,extra,msg=>setStatusMsg(msg));
        setStatusMsg(`Building report for video ${i+1}…`);
        const report = await getClaudeReport(pipelineResult);
        out.push({idx,slot:slots[idx],pipelineResult,report});
      } catch(e) {
        setError(`Analysis failed: ${e.message}`);
        setScreen("upload"); return;
      }
    }
    setResults(out); setActive(0); setScreen("results");
  };

  const vColor = v=>v==="Strong performer"?"#a78bfa":v==="High potential"?"#60a5fa":"#e879f9";
  const pColor = p=>p==="High"?"#a78bfa":p==="Medium"?"#60a5fa":"#e879f9";

  if (screen==="analyzing") return (
    <div style={{background:"#09060f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:22,padding:24,fontFamily:"system-ui,sans-serif",color:"#e2e8f0"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{position:"relative",width:88,height:88}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",padding:1.5,background:G,animation:"spin 2.2s linear infinite"}}>
          <div style={{width:"100%",height:"100%",borderRadius:"50%",background:"#09060f"}}/>
        </div>
        <div style={{position:"absolute",inset:10,borderRadius:"50%",background:"rgba(167,139,250,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🧠</div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:17,fontWeight:600,color:"#f1f5f9",marginBottom:6}}>Running neural analysis</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>{statusMsg}</div>
        {["FFmpeg extracting audio & frames","AssemblyAI transcribing + sentiment","TRIBE v2 mapping brain activation","Claude building performance report"].map((s,i)=>(
          <div key={i} style={{fontSize:11,color:"#2d3748",display:"flex",alignItems:"center",gap:7,justifyContent:"center",marginBottom:5}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:G}}/>{s}
          </div>
        ))}
      </div>
    </div>
  );

  if (screen==="results") {
    const isCompare = active==="compare";
    const cur = results[isCompare?0:active];
    const d = cur?.report;
    const neural = cur?.pipelineResult?.neural;
    const assembly = cur?.pipelineResult?.assembly;
    const transcript = cur?.pipelineResult?.transcript;
    const SCORES = [
      {key:"hookStrength",label:"Hook strength"},
      {key:"messageClarity",label:"Message clarity"},
      {key:"emotionalResonance",label:"Emotional resonance"},
      {key:"callToAction",label:"Call to action"},
      {key:"audienceAlignment",label:"Audience alignment"},
    ];
    return (
      <div style={{background:"#09060f",minHeight:"100vh",padding:"22px 18px",fontFamily:"system-ui,sans-serif",color:"#e2e8f0",maxWidth:1040,margin:"0 auto"}}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,paddingBottom:14,borderBottom:"1px solid rgba(167,139,250,0.08)"}}>
          <div style={{fontSize:16,fontWeight:700,...gTxt}}>✦ NeuralLens</div>
          <button onClick={()=>{setScreen("upload");setResults([]);setSlots([null,null,null]);}}
            style={{fontSize:11,color:"#475569",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"5px 13px",cursor:"pointer"}}>
            + New report
          </button>
        </div>
        {results.length>1&&(
          <div style={{display:"flex",gap:7,marginBottom:18,flexWrap:"wrap"}}>
            {results.map((_,i)=>(
              <button key={i} onClick={()=>setActive(i)} style={{padding:"5px 13px",borderRadius:99,fontSize:11,cursor:"pointer",fontWeight:500,border:"none",background:active===i?G:"rgba(255,255,255,0.04)",color:active===i?"#fff":"#64748b"}}>
                Video {i+1}
              </button>
            ))}
            <button onClick={()=>setActive("compare")} style={{padding:"5px 13px",borderRadius:99,fontSize:11,cursor:"pointer",fontWeight:500,border:"none",background:active==="compare"?G:"rgba(255,255,255,0.04)",color:active==="compare"?"#fff":"#64748b"}}>
              Compare
            </button>
          </div>
        )}
        {isCompare?(
          <div style={{...card}}>
            <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>Side-by-side comparison</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${results.length},1fr)`,gap:16}}>
              {results.map((r,i)=>{
                const rd=r.report; const rn=r.pipelineResult.neural;
                return (
                  <div key={i} style={{borderRight:i<results.length-1?"1px solid rgba(255,255,255,0.05)":"none",paddingRight:i<results.length-1?16:0}}>
                    <div style={{fontSize:10,color:"#334155",marginBottom:9}}>Video {i+1}</div>
                    <Pill color={vColor(rd.verdict)}>{rd.verdict}</Pill>
                    <div style={{fontSize:11,color:"#64748b",margin:"9px 0 12px",lineHeight:1.65}}>{rd.verdictSub}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
                      <NeuralBadge label="Viral potential" value={rn.viral_potential} color="#e879f9"/>
                      <NeuralBadge label="Brain engagement" value={rn.overall_brain_engagement} color="#a78bfa"/>
                    </div>
                    {SCORES.map(m=><ScoreBar key={m.key} label={m.label} score={rd.scores[m.key]}/>)}
                    <div style={{marginTop:12}}><Timeline data={rn.activation_timeline}/></div>
                  </div>
                );
              })}
            </div>
          </div>
        ):d&&neural&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{...card,marginBottom:14,display:"flex",alignItems:"flex-start",gap:18,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <Pill color={vColor(d.verdict)}>{d.verdict}</Pill>
                <h2 style={{fontSize:20,fontWeight:700,color:"#f1f5f9",margin:"10px 0 8px",lineHeight:1.35}}>{d.verdictSub}</h2>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <Pill color={pColor(d.performanceLevel)}>Performance: {d.performanceLevel}</Pill>
                  <span style={{fontSize:12,color:"#475569"}}>{d.performanceNote}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap"}}>
                <NeuralBadge label="Viral potential" value={neural.viral_potential} color="#e879f9"/>
                <NeuralBadge label="Brain engagement" value={neural.overall_brain_engagement} color="#a78bfa"/>
                <NeuralBadge label="Attention" value={neural.attention_capture} color="#60a5fa"/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={card}>
                  <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Content scores</div>
                  {SCORES.map(m=><ScoreBar key={m.key} label={m.label} score={d.scores[m.key]}/>)}
                </div>
                <div style={card}><Timeline data={neural.activation_timeline}/></div>
                {transcript&&(
                  <div style={card}>
                    <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Transcript</div>
                    <div style={{fontSize:11,color:"#475569",lineHeight:1.7,maxHeight:80,overflow:"hidden"}}>{transcript}</div>
                  </div>
                )}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={card}>
                  <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Neural breakdown</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <NeuralBadge label="Language" value={neural.language_processing} color="#a78bfa"/>
                    <NeuralBadge label="Visual imagery" value={neural.visual_imagery} color="#60a5fa"/>
                    <NeuralBadge label="Attention" value={neural.attention_capture} color="#34d399"/>
                    <NeuralBadge label="Emotion" value={neural.emotional_valence} color="#e879f9"/>
                  </div>
                  <div style={{fontSize:11,color:"#334155",marginTop:10,textAlign:"center"}}>
                    Dominant hemisphere: <span style={{color:"#a78bfa"}}>{neural.dominant_hemisphere}</span>
                  </div>
                </div>
                {assembly?.chapters?.length>0&&(
                  <div style={card}>
                    <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Video chapters</div>
                    {assembly.chapters.map((c,i)=>(
                      <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                        <div style={{fontSize:9,color:"#a78bfa",minWidth:32,marginTop:2}}>{Math.round(c.start/1000)}s</div>
                        <div style={{fontSize:11,color:"#64748b",lineHeight:1.6}}>{c.summary}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{...card,borderColor:"rgba(232,121,249,0.15)",background:"rgba(232,121,249,0.04)"}}>
                  <div style={{fontSize:10,color:"#e879f9",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Peak moment ✦</div>
                  <div style={{fontSize:12,color:"#c4b5fd",lineHeight:1.7}}>{d.peakMoment}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={card}>
                  <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>What's working</div>
                  {d.strengths.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",marginTop:5,flexShrink:0,background:"linear-gradient(135deg,#a78bfa,#60a5fa)"}}/>
                      <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.65}}>{s}</span>
                    </div>
                  ))}
                </div>
                <div style={{...card,borderColor:"rgba(96,165,250,0.15)",background:"rgba(96,165,250,0.04)"}}>
                  <div style={{fontSize:10,color:"#60a5fa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Quick win ✦</div>
                  <div style={{fontSize:12,color:"#bae6fd",lineHeight:1.7}}>{d.quickWin}</div>
                </div>
                <div style={card}>
                  <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Improvements</div>
                  {d.improvements.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",marginTop:5,flexShrink:0,background:"#e879f9"}}/>
                      <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.65}}>{s}</span>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <div style={{fontSize:10,color:"#475569",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Best audience</div>
                  <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.7}}>{d.bestAudience}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{background:"#09060f",minHeight:"100vh",padding:"28px 18px",fontFamily:"system-ui,sans-serif",color:"#e2e8f0",maxWidth:820,margin:"0 auto"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        ::placeholder{color:#1e2d40 !important}
        select option{background:#111827}
      `}</style>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:20,fontWeight:700,...gTxt,marginBottom:2}}>✦ NeuralLens</div>
        <div style={{fontSize:11,color:"#1e2d40",letterSpacing:1}}>POWERED BY TRIBE v2 · ASSEMBLYAI · CLAUDE</div>
      </div>
      <Steps current={1}/>
      <div style={{textAlign:"center",marginBottom:26}}>
        <h1 style={{fontSize:22,fontWeight:700,color:"#f1f5f9",margin:"0 0 7px",lineHeight:1.35}}>How will your audience react?</h1>
        <p style={{fontSize:12,color:"#334155",margin:0}}>Upload up to 3 videos. We'll run full neural analysis on each one.</p>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{flex:"1 1 210px",minWidth:195}}>
            <div style={{fontSize:11,color:"#475569",marginBottom:6,fontWeight:500}}>
              Video {i+1}{i>0&&<span style={{color:"#1e293b",fontWeight:400,fontSize:10}}> · optional</span>}
            </div>
            <div onDrop={e=>{e.preventDefault();setFile(i,e.dataTransfer.files[0]);}}
              onDragOver={e=>e.preventDefault()} onClick={()=>refs[i].current?.click()}
              style={{background:"rgba(255,255,255,0.035)",border:`1px dashed ${slots[i]?"rgba(167,139,250,0.35)":"rgba(167,139,250,0.12)"}`,borderRadius:12,height:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",position:"relative",overflow:"hidden"}}>
              {slots[i]?(
                <div style={{textAlign:"center",padding:"0 12px"}}>
                  <div style={{fontSize:28,marginBottom:6}}>🎬</div>
                  <div style={{fontSize:11,color:"#a78bfa",fontWeight:500}}>{slots[i].file.name.slice(0,26)}</div>
                  <div style={{fontSize:10,color:"#334155",marginTop:3}}>{(slots[i].file.size/1024/1024).toFixed(1)} MB · ready ✓</div>
                  <div style={{marginTop:8,fontSize:10,color:"#1e293b"}} onClick={e=>{e.stopPropagation();setSlots(p=>{const n=[...p];n[i]=null;return n;});}}>remove</div>
                </div>
              ):(
                <>
                  <div style={{fontSize:28,color:"rgba(167,139,250,0.18)"}}>🎬</div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#1a2540",marginBottom:3}}>Drop video or click to upload</div>
                    <div style={{fontSize:10,color:"#131e30"}}>mp4 · mov · avi · max 3 min</div>
                  </div>
                </>
              )}
              <input ref={refs[i]} type="file" accept="video/*" onChange={e=>setFile(i,e.target.files[0])} style={{display:"none"}}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{...card,marginBottom:20,borderRadius:12}}>
        <button onClick={()=>setCtx(!ctx)} style={{width:"100%",background:"none",border:"none",color:"#475569",fontSize:12,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",padding:0}}>
          <span style={{fontWeight:500}}>Add context <span style={{color:"#1e293b",fontWeight:400,fontSize:11}}>· platform, goal & notes (optional)</span></span>
          <span style={{fontSize:10,color:"#1e293b"}}>{ctx?"▲ hide":"▼ show"}</span>
        </button>
        {ctx&&(
          <div style={{marginTop:14,display:"flex",gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",flexDirection:"column",gap:5,flex:"1 1 150px"}}>
              <label style={{fontSize:11,color:"#475569"}}>Platform</label>
              <select value={platform} onChange={e=>setPlatform(e.target.value)} style={{...softInput,padding:"7px 10px"}}>
                {PLATFORMS.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,flex:"1 1 150px"}}>
              <label style={{fontSize:11,color:"#475569"}}>Goal</label>
              <select value={goal} onChange={e=>setGoal(e.target.value)} style={{...softInput,padding:"7px 10px"}}>
                {GOALS.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,flex:"2 1 240px"}}>
              <label style={{fontSize:11,color:"#475569"}}>Notes</label>
              <input value={extra} onChange={e=>setExtra(e.target.value)} placeholder="e.g. targeting 25–40 founders in the US…" style={{...softInput,padding:"7px 12px"}}/>
            </div>
          </div>
        )}
      </div>
      {error&&<div style={{background:"rgba(232,121,249,0.06)",border:"1px solid rgba(232,121,249,0.18)",borderRadius:10,padding:11,marginBottom:14,fontSize:11,color:"#e879f9"}}>{error}</div>}
      <div style={{maxWidth:340,margin:"0 auto",textAlign:"center"}}>
        <button onClick={analyze} disabled={!activeSlots.length}
          style={{width:"100%",padding:"14px 0",borderRadius:12,border:"none",cursor:activeSlots.length?"pointer":"not-allowed",opacity:activeSlots.length?1:.3,background:G,color:"#fff",fontSize:13,fontWeight:600,letterSpacing:.4,marginBottom:13,boxShadow:activeSlots.length?"0 4px 28px rgba(167,139,250,0.2)":"none"}}>
          Run neural analysis{activeSlots.length>0?` · ${activeSlots.length} video${activeSlots.length>1?"s":""}` :""}
        </button>
        <p style={{fontSize:11,color:"#2d3748",lineHeight:1.8,margin:"0 0 8px"}}>
          We send your video through FFmpeg, AssemblyAI, and the TRIBE v2 brain model — then Claude turns that data into a clear performance report.
        </p>
        <div style={{fontSize:10,color:"#1a2535"}}>Free tier · 3 reports per month</div>
      </div>
    </div>
  );
}
