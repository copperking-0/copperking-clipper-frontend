import { useState, useEffect, useRef } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const C = {
  bg:"#0E0F11", surface:"#1A1C20", card:"#22252B", border:"#2E3138",
  copper:"#C97B3A", copperLt:"#E8943F", copperDm:"#8F5523",
  text:"#F0EBE3", muted:"#7A8090", green:"#3DCB7F", red:"#E05555", yellow:"#E8C43A",
};

const PRESETS = {
  "Gameplay + Webcam": {
    stream_width:1920, stream_height:1080,
    facecam:{ x:1298, y:730, w:622, h:350 },
    gameplay:{ x:480, w:960 },
    include_facecam:true, gameplay_height:1320,
  },
  "Gameplay Only": {
    stream_width:1920, stream_height:1080,
    facecam:{ x:1298, y:730, w:622, h:350 },
    gameplay:{ x:0, w:1920 },
    include_facecam:false, gameplay_height:1920,
  },
};

const DEFAULT_LAYOUT = PRESETS["Gameplay + Webcam"];

const CLIP_MODES = [
  { id:"auto",      label:"Auto",        desc:"Score all moments equally" },
  { id:"hype",      label:"Big Moments", desc:"Clutch plays, reactions, hype" },
  { id:"monologue", label:"Monologues",  desc:"Storytelling, rants, speeches" },
  { id:"funny",     label:"Funny",       desc:"Fails, jokes, chaotic moments" },
  { id:"horror",    label:"Horror",      desc:"Jump scares, tense moments" },
];

// ── Platform detection ─────────────────────────────────────
function detectPlatform(url) {
  if (!url) return null;
  if (url.includes("twitch.tv"))  return "twitch";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("kick.com"))   return "kick";
  return "other";
}

function extractChannel(url, platform) {
  try {
    const u = new URL(url);
    if (platform === "twitch")  return u.pathname.replace("/", "").split("/")[0];
    if (platform === "kick")    return u.pathname.replace("/", "").split("/")[0];
    if (platform === "youtube") {
      // handle /live/ or /channel/ or /@handle
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1];
    }
  } catch { return null; }
  return null;
}

function getEmbedUrl(url, platform) {
  const ch = extractChannel(url, platform);
  if (!ch) return null;
  if (platform === "twitch")  return `https://player.twitch.tv/?channel=${ch}&parent=${window.location.hostname}&autoplay=true&muted=true`;
  if (platform === "kick")    return `https://player.kick.com/${ch}?autoplay=true&muted=true`;
  if (platform === "youtube") return `https://www.youtube.com/embed/live_stream?channel=${ch}&autoplay=1&mute=1`;
  return null;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg};color:${C.text};font-family:'Inter',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${C.surface}}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
  .app{display:flex;flex-direction:column;min-height:100vh}
  .nav{background:${C.surface};border-bottom:1px solid ${C.border};padding:0 24px;display:flex;align-items:center;gap:32px;height:56px;position:sticky;top:0;z-index:100}
  .nav-logo{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:20px;color:${C.copper};letter-spacing:1px;white-space:nowrap}
  .nav-logo span{color:${C.text}}
  .nav-tabs{display:flex;gap:4px}
  .nav-tab{background:none;border:none;color:${C.muted};font-family:'Inter',sans-serif;font-size:13px;font-weight:500;padding:6px 14px;border-radius:6px;cursor:pointer;transition:all .15s}
  .nav-tab:hover{color:${C.text};background:${C.card}}
  .nav-tab.active{color:${C.copper};background:${C.copperDm}22}
  .nav-status{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:12px;color:${C.muted}}
  .status-dot{width:7px;height:7px;border-radius:50%;background:${C.border}}
  .status-dot.live{background:${C.green};box-shadow:0 0 6px ${C.green}88;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .main{flex:1;padding:28px 24px;max-width:1100px;margin:0 auto;width:100%}
  .card{background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:20px}
  .card+.card{margin-top:16px}
  .card-title{font-family:'Rajdhani',sans-serif;font-weight:600;font-size:15px;color:${C.copper};text-transform:uppercase;letter-spacing:.8px;margin-bottom:16px}
  .field{margin-bottom:14px}
  .label{display:block;font-size:12px;font-weight:500;color:${C.muted};margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
  .input{width:100%;background:${C.surface};border:1px solid ${C.border};border-radius:8px;color:${C.text};font-family:'Inter',sans-serif;font-size:14px;padding:10px 14px;outline:none;transition:border .15s}
  .input:focus{border-color:${C.copper}}
  .input::placeholder{color:${C.muted}}
  .btn{display:inline-flex;align-items:center;gap:8px;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;padding:10px 18px;cursor:pointer;transition:all .15s;white-space:nowrap}
  .btn-primary{background:${C.copper};color:#fff}
  .btn-primary:hover{background:${C.copperLt}}
  .btn-primary:disabled{background:${C.copperDm};cursor:not-allowed;opacity:.6}
  .btn-danger{background:${C.red}22;color:${C.red};border:1px solid ${C.red}44}
  .btn-danger:hover{background:${C.red}33}
  .btn-ghost{background:${C.surface};color:${C.text};border:1px solid ${C.border}}
  .btn-ghost:hover{border-color:${C.copper};color:${C.copper}}
  .btn-sm{padding:6px 12px;font-size:12px}
  .row{display:flex;gap:12px;align-items:flex-end}
  .row .field{flex:1;margin-bottom:0}
  .log-box{background:${C.bg};border:1px solid ${C.border};border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#9BA5B4;height:200px;overflow-y:auto;line-height:1.7}
  .log-line{display:block}
  .log-line.clip{color:${C.green}}
  .log-line.warn{color:${C.yellow}}
  .log-line.err{color:${C.red}}
  .log-line.stopped{color:${C.red};font-weight:600}
  .chip{display:inline-block;background:${C.surface};border:1px solid ${C.border};border-radius:20px;font-size:11px;color:${C.muted};padding:3px 10px}
  .chip.green{background:${C.green}11;border-color:${C.green}44;color:${C.green}}
  .chip.copper{background:${C.copper}11;border-color:${C.copper}44;color:${C.copper}}
  .chip.red{background:${C.red}11;border-color:${C.red}44;color:${C.red}}
  .chip.yellow{background:${C.yellow}11;border-color:${C.yellow}44;color:${C.yellow}}
  .score{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:22px}
  .clips-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
  .clip-card{background:${C.card};border:1px solid ${C.border};border-radius:12px;overflow:hidden}
  .clip-video{width:100%;aspect-ratio:9/16;background:#000;display:block}
  .clip-info{padding:14px}
  .clip-title{font-family:'Rajdhani',sans-serif;font-weight:600;font-size:15px;color:${C.text};margin-bottom:4px}
  .clip-sub{font-size:12px;color:${C.muted};margin-bottom:10px}
  .clip-actions{display:flex;gap:8px;flex-wrap:wrap}
  .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${C.border}}
  .toggle-row:last-child{border-bottom:none}
  .toggle-label{font-size:13px;color:${C.text}}
  .toggle-sub{font-size:11px;color:${C.muted};margin-top:2px}
  .toggle{position:relative;width:38px;height:20px}
  .toggle input{opacity:0;width:0;height:0;position:absolute}
  .toggle-track{position:absolute;inset:0;background:${C.border};border-radius:20px;cursor:pointer;transition:background .2s}
  .toggle input:checked+.toggle-track{background:${C.copper}}
  .toggle-thumb{position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s;pointer-events:none}
  .toggle input:checked~.toggle-thumb{transform:translateX(18px)}
  .dropzone{border:2px dashed ${C.border};border-radius:12px;padding:40px;text-align:center;cursor:pointer;transition:all .2s}
  .dropzone:hover,.dropzone.dragging{border-color:${C.copper};background:${C.copper}08}
  .dropzone-icon{font-size:36px;margin-bottom:12px}
  .dropzone-text{color:${C.muted};font-size:14px}
  .dropzone-text strong{color:${C.text}}
  .empty{text-align:center;padding:60px 20px;color:${C.muted}}
  .empty-icon{font-size:40px;margin-bottom:12px;opacity:.4}
  .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
  .section-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:22px;color:${C.text}}
  .progress-bar{height:4px;background:${C.border};border-radius:2px;overflow:hidden;margin-top:8px}
  .progress-fill{height:100%;background:${C.copper};border-radius:2px;transition:width .3s}
  .tag-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
  .tag{background:${C.surface};border:1px solid ${C.border};border-radius:4px;font-size:11px;color:${C.muted};padding:2px 8px}
  .mode-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:8px}
  .mode-btn{background:${C.surface};border:1px solid ${C.border};border-radius:8px;padding:10px 12px;cursor:pointer;text-align:left;transition:all .15s}
  .mode-btn:hover{border-color:${C.copper}}
  .mode-btn.active{border-color:${C.copper};background:${C.copper}11}
  .mode-btn-label{font-size:13px;font-weight:600;color:${C.text};margin-bottom:2px}
  .mode-btn-desc{font-size:11px;color:${C.muted}}
  .score-slider{width:100%;accent-color:${C.copper}}
  .banner{border-radius:8px;padding:10px 14px;font-size:13px;font-weight:600;margin-top:12px}
  .banner-stopped{background:${C.red}11;border:1px solid ${C.red}33;color:${C.red}}
  .banner-done{background:${C.green}11;border:1px solid ${C.green}33;color:${C.green}}
  .preset-row{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
  .preset-btn{background:${C.surface};border:1px solid ${C.border};border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;color:${C.muted};cursor:pointer;transition:all .15s}
  .preset-btn:hover{border-color:${C.copper};color:${C.copper}}

  /* Preview + Layout overlay */
  .preview-wrap{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;border:1px solid ${C.border}}
  .preview-iframe{width:100%;height:100%;border:none;display:block}
  .preview-snapshot{width:100%;height:100%;object-fit:contain;display:block}
  .preview-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${C.muted};font-size:13px;flex-direction:column;gap:8px}
  .preview-badge{position:absolute;top:8px;left:8px;background:#000a;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:${C.green};border:1px solid ${C.green}44}
  .layout-overlay{position:absolute;inset:0;pointer-events:none}
  .layout-overlay.interactive{pointer-events:all}
  .layout-zone{position:absolute;border:2px solid;border-radius:4px;cursor:move;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:12px;letter-spacing:.5px}
  .layout-zone:hover{box-shadow:0 0 0 1px currentColor}
  .zone-face{border-color:${C.copper};background:${C.copper}22;color:${C.copper}}
  .zone-game{border-color:${C.green};background:${C.green}11;color:${C.green}}
  .zone-handle{position:absolute;bottom:2px;right:2px;width:10px;height:10px;cursor:se-resize;opacity:.6}
  .grid-overlay{position:absolute;inset:0;background-image:linear-gradient(${C.border}44 1px,transparent 1px),linear-gradient(90deg,${C.border}44 1px,transparent 1px);background-size:10% 10%;pointer-events:none}
  .step-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .step-num{width:24px;height:24px;border-radius:50%;background:${C.copper};color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .step-label{font-family:'Rajdhani',sans-serif;font-weight:600;font-size:15px;color:${C.text};text-transform:uppercase;letter-spacing:.5px}
  .layout-editor{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;border:1px solid ${C.border};user-select:none}
`;

function statusChip(status) {
  const map = { pending:"yellow", running:"green", done:"copper", failed:"red", stopped:"red" };
  return <span className={`chip ${map[status]||""}`}>{status}</span>;
}

function logClass(line) {
  if (line.includes("■ STOPPED") || line.includes("Stream ended")) return "stopped";
  if (line.includes("🎬") || line.includes("✅")) return "clip";
  if (line.includes("⚠️")) return "warn";
  if (line.includes("❌") || line.includes("Fatal")) return "err";
  return "";
}

// ── Preview + Layout Overlay ───────────────────────────────
function PreviewWithLayout({ url, layout, setLayout, videoFile }) {
  const CANVAS_W = 640;
  const CANVAS_H = 360;
  const canvasRef  = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [snapLoading, setSnapLoading] = useState(false);

  const platform = detectPlatform(url);
  const embedUrl = url ? getEmbedUrl(url, platform) : null;

  // Fetch snapshot for non-embeddable platforms
  useEffect(() => {
    if (!url || platform === "twitch" || platform === "youtube" || platform === "kick" || videoFile) return;
    setSnapLoading(true);
    fetch(`${API}/preview/snapshot`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ url })
    })
      .then(r => r.ok ? r.blob() : null)
      .then(blob => { if (blob) setSnapshot(URL.createObjectURL(blob)); })
      .catch(() => {})
      .finally(() => setSnapLoading(false));
  }, [url, platform, videoFile]);

  function toCanvas(val, axis) { return axis === "x" ? (val / 1920) * CANVAS_W : (val / 1080) * CANVAS_H; }
  function fromCanvas(val, axis) { return axis === "x" ? Math.round((val / CANVAS_W) * 1920) : Math.round((val / CANVAS_H) * 1080); }

  function onMouseDown(e, zone, type="move") {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    if (type === "move") setDragging({ zone, startX, startY, orig:{ ...layout[zone] } });
    else setResizing({ zone, startX, startY, orig:{ ...layout[zone] } });
  }

  function onMouseMove(e) {
    if (!dragging && !resizing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    if (dragging) {
      const dx = mx - dragging.startX * scaleX;
      const dy = my - dragging.startY * scaleY;
      setLayout(prev => ({
        ...prev,
        [dragging.zone]: {
          ...prev[dragging.zone],
          x: Math.max(0, fromCanvas(toCanvas(dragging.orig.x, "x") + dx, "x")),
          y: dragging.zone === "facecam" ? Math.max(0, fromCanvas(toCanvas(dragging.orig.y, "y") + dy, "y")) : prev[dragging.zone].y
        }
      }));
    }
    if (resizing) {
      const dx = mx - resizing.startX * scaleX;
      const dy = my - resizing.startY * scaleY;
      setLayout(prev => ({
        ...prev,
        [resizing.zone]: {
          ...prev[resizing.zone],
          w: Math.max(80, fromCanvas(toCanvas(resizing.orig.w, "x") + dx, "x")),
          h: resizing.zone === "facecam" ? Math.max(40, fromCanvas(toCanvas(resizing.orig.h, "y") + dy, "y")) : prev[resizing.zone].h
        }
      }));
    }
  }

  function onMouseUp() { setDragging(null); setResizing(null); }

  const fc = layout?.facecam;
  const gp = layout?.gameplay;

  // Video file object URL for VOD preview
  const [fileUrl, setFileUrl] = useState(null);
  useEffect(() => {
    if (!videoFile) { setFileUrl(null); return; }
    const u = URL.createObjectURL(videoFile);
    setFileUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [videoFile]);

  return (
    <div>
      {/* Preview */}
      <div className="preview-wrap" style={{ marginBottom:12 }}>
        {/* Embedded player */}
        {embedUrl && !videoFile && (
          <>
            <iframe className="preview-iframe" src={embedUrl} allowFullScreen allow="autoplay" />
            <div className="preview-badge">🔴 LIVE PREVIEW</div>
          </>
        )}

        {/* VOD file preview */}
        {fileUrl && (
          <video className="preview-snapshot" src={fileUrl} controls muted style={{ width:"100%", height:"100%", objectFit:"contain" }} />
        )}

        {/* Snapshot for RTMP/other */}
        {!embedUrl && !fileUrl && snapshot && (
          <>
            <img className="preview-snapshot" src={snapshot} alt="Stream snapshot" />
            <div className="preview-badge">📸 SNAPSHOT</div>
          </>
        )}

        {/* Loading / placeholder */}
        {!embedUrl && !fileUrl && !snapshot && (
          <div className="preview-placeholder">
            {snapLoading
              ? <><span style={{fontSize:24}}>⏳</span><span>Grabbing snapshot…</span></>
              : <><span style={{fontSize:24}}>📺</span><span>{url ? "Enter a supported URL to preview" : "Preview will appear here"}</span></>
            }
          </div>
        )}

        {/* Layout overlay on top of preview */}
        {layout && (
          <div
            ref={canvasRef}
            className="layout-overlay interactive"
            style={{ position:"absolute", inset:0 }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <div className="grid-overlay" />

            {/* Gameplay zone */}
            <div
              className="layout-zone zone-game"
              style={{
                left:`${(gp.x/1920)*100}%`, top:0,
                width:`${(gp.w/1920)*100}%`, height:"100%"
              }}
              onMouseDown={e => onMouseDown(e, "gameplay")}
            >
              GAMEPLAY
              <div className="zone-handle" onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "gameplay", "resize"); }}>⊿</div>
            </div>

            {/* Facecam zone */}
            {layout.include_facecam && (
              <div
                className="layout-zone zone-face"
                style={{
                  left:`${(fc.x/1920)*100}%`, top:`${(fc.y/1080)*100}%`,
                  width:`${(fc.w/1920)*100}%`, height:`${(fc.h/1080)*100}%`
                }}
                onMouseDown={e => onMouseDown(e, "facecam")}
              >
                FACECAM
                <div className="zone-handle" onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "facecam", "resize"); }}>⊿</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Layout controls under preview */}
      {layout && (
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:C.muted }}>Presets:</span>
          {Object.keys(PRESETS).map(name => (
            <button key={name} className="preset-btn" onClick={() => setLayout({ ...PRESETS[name] })}>{name}</button>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:12, color:C.muted }}>Facecam</span>
            <label className="toggle">
              <input type="checkbox" checked={layout.include_facecam} onChange={e => setLayout(l => ({ ...l, include_facecam:e.target.checked }))} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stream Tab ─────────────────────────────────────────────
function StreamTab({ activeJobId, onJobStart, onJobEnd }) {
  const [url, setUrl]         = useState("");
  const [game, setGame]       = useState("gaming");
  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore]     = useState(8);
  const [mode, setMode]       = useState("auto");
  const [layout, setLayout]   = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const logRef = useRef(null);

  // Load saved layout on mount
  useEffect(() => {
    fetch(`${API}/layout`).then(r => r.json()).then(setLayout).catch(() => setLayout({ ...DEFAULT_LAYOUT }));
  }, []);

  // Resume polling after tab switch
  useEffect(() => {
    if (!activeJobId) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`${API}/jobs/${activeJobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJob(data);
        if (data.status === "done" || data.status === "failed" || data.status === "stopped") {
          clearInterval(iv);
          onJobEnd();
        }
      } catch (err) { console.warn("Poll failed:", err.message); }
    }, 2000);
    return () => clearInterval(iv);
  }, [activeJobId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [job?.logs]);

  async function saveAndStart() {
    if (!url.trim() || !layout) return;
    setLoading(true);
    // Save layout first
    await fetch(`${API}/layout`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(layout)
    }).catch(() => {});
    // Start job
    try {
      const res = await fetch(`${API}/clip/stream`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ url: url.trim(), game, score_threshold: score, clip_mode: mode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start");
      onJobStart(data.job_id);
      setPreviewing(false);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }

  async function stop() {
    if (!activeJobId) return;
    await fetch(`${API}/clip/stream/${activeJobId}`, { method:"DELETE" });
  }

  const isRunning = job?.status === "running";
  const isStopped = job?.status === "stopped";
  const isDone    = job?.status === "done";

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Stream Monitor</h2>
        {job && statusChip(job.status)}
      </div>

      {/* Step 1 — URL + Settings */}
      {!activeJobId && (
        <div className="card">
          <div className="step-header"><div className="step-num">1</div><div className="step-label">Stream Source & Settings</div></div>
          <div className="row" style={{ marginBottom:14 }}>
            <div className="field" style={{ marginBottom:0 }}>
              <label className="label">Stream URL</label>
              <input className="input" placeholder="https://twitch.tv/channel  •  https://kick.com/channel  •  rtmp://..." value={url} onChange={e => { setUrl(e.target.value); setPreviewing(false); }} />
            </div>
            <div className="field" style={{ maxWidth:180, marginBottom:0 }}>
              <label className="label">Game</label>
              <input className="input" placeholder="e.g. Dead by Daylight" value={game} onChange={e => setGame(e.target.value)} />
            </div>
          </div>

          <div className="label">Clip Mode</div>
          <div className="mode-grid" style={{ marginBottom:14 }}>
            {CLIP_MODES.map(m => (
              <div key={m.id} className={`mode-btn ${mode === m.id ? "active" : ""}`} onClick={() => setMode(m.id)}>
                <div className="mode-btn-label">{m.label}</div>
                <div className="mode-btn-desc">{m.desc}</div>
              </div>
            ))}
          </div>

          <label className="label">Score Threshold — only clip if score ≥ {score}/10</label>
          <input type="range" className="score-slider" min={5} max={10} value={score} onChange={e => setScore(Number(e.target.value))} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginTop:4, marginBottom:16 }}>
            <span>5 — more clips</span><span>10 — only the best</span>
          </div>

          <button className="btn btn-primary" onClick={() => setPreviewing(true)} disabled={!url.trim()}>
            Preview & Set Layout →
          </button>
        </div>
      )}

      {/* Step 2 — Preview + Layout */}
      {!activeJobId && previewing && layout && (
        <div className="card">
          <div className="step-header"><div className="step-num">2</div><div className="step-label">Preview & Adjust Layout</div></div>
          <p style={{ fontSize:13, color:C.muted, marginBottom:14 }}>
            Drag the <span style={{ color:C.green }}>GAMEPLAY</span> and <span style={{ color:C.copper }}>FACECAM</span> zones to match your stream layout. This determines how clips are cropped.
          </p>

          <PreviewWithLayout url={url} layout={layout} setLayout={setLayout} videoFile={null} />

          <div style={{ marginTop:16, display:"flex", gap:10 }}>
            <button className="btn btn-ghost" onClick={() => setPreviewing(false)}>← Back</button>
            <button className="btn btn-primary" onClick={saveAndStart} disabled={loading}>
              {loading ? "Starting…" : "▶ Start Clipping"}
            </button>
          </div>
        </div>
      )}

      {/* Running state */}
      {activeJobId && (
        <div className="card">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:13, color:C.muted }}>Monitoring: <span style={{ color:C.text }}>{url || "stream"}</span></div>
            </div>
            {isRunning && <button className="btn btn-danger" onClick={stop}>■ Stop</button>}
          </div>

          <div className="card-title">Live Feed</div>
          <div ref={logRef} className="log-box">
            {job?.logs?.map((l, i) => (
              <span key={i} className={`log-line ${logClass(l)}`}>{l}{"\n"}</span>
            ))}
            {isRunning && <span className="log-line" style={{ color:C.copper }}>● Monitoring…</span>}
          </div>

          {isStopped && <div className="banner banner-stopped">■ Clipper stopped. {job?.clips?.length || 0} clips saved this session.</div>}
          {isDone    && <div className="banner banner-done">✅ Stream ended. {job?.clips?.length || 0} clips saved.</div>}

          {job?.clips?.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div className="card-title">Clips This Session ({job.clips.length})</div>
              {job.clips.map((c, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span className="score" style={{ color:C.copper }}>{c.score}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{c.meta?.burned_title}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{c.meta?.yt_title}</div>
                    <div style={{ fontSize:11, color:C.muted, fontStyle:"italic" }}>{c.meta?.tiktok_title}</div>
                  </div>
                  <a className="btn btn-ghost btn-sm" href={`${API}/clips/${c.date}/${c.titled}`} download>↓ Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Upload Tab ─────────────────────────────────────────────
function UploadTab() {
  const [game, setGame]         = useState("gaming");
  const [jobId, setJobId]       = useState(null);
  const [job, setJob]           = useState(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [score, setScore]       = useState(8);
  const [mode, setMode]         = useState("auto");
  const [layout, setLayout]     = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const logRef  = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/layout`).then(r => r.json()).then(setLayout).catch(() => setLayout({ ...DEFAULT_LAYOUT }));
  }, []);

  useEffect(() => {
    if (!jobId) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`${API}/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJob(data);
        if (data.status === "done" || data.status === "failed") clearInterval(iv);
      } catch (err) { console.warn("Poll failed:", err.message); }
    }, 2000);
    return () => clearInterval(iv);
  }, [jobId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [job?.logs]);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setPreviewing(true);
  }

  async function saveAndUpload() {
    if (!file || !layout) return;
    // Save layout
    await fetch(`${API}/layout`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(layout)
    }).catch(() => {});
    // Upload file
    const form = new FormData();
    form.append("file", file);
    form.append("game", game);
    form.append("score_threshold", score);
    form.append("clip_mode", mode);
    const res  = await fetch(`${API}/clip/upload`, { method:"POST", body:form });
    const data = await res.json();
    if (!res.ok) { alert(data.detail); return; }
    setJobId(data.job_id);
    setPreviewing(false);
  }

  const totalChunks = job?.logs?.filter(l => l.includes("Chunk")).length || 0;
  const doneChunks  = job?.logs?.filter(l => l.includes("/10")).length || 0;
  const progress    = totalChunks > 0 ? Math.min(100, Math.round((doneChunks / totalChunks) * 100)) : 0;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Upload VOD</h2>
        {job && statusChip(job.status)}
      </div>

      {/* Step 1 — Settings + drop zone */}
      {!jobId && !previewing && (
        <div className="card">
          <div className="step-header"><div className="step-num">1</div><div className="step-label">Settings & Upload</div></div>
          <div className="row" style={{ marginBottom:14 }}>
            <div className="field" style={{ maxWidth:240, marginBottom:0 }}>
              <label className="label">Game</label>
              <input className="input" placeholder="e.g. Detroit: Become Human" value={game} onChange={e => setGame(e.target.value)} />
            </div>
          </div>

          <div className="label">Clip Mode</div>
          <div className="mode-grid" style={{ marginBottom:14 }}>
            {CLIP_MODES.map(m => (
              <div key={m.id} className={`mode-btn ${mode === m.id ? "active" : ""}`} onClick={() => setMode(m.id)}>
                <div className="mode-btn-label">{m.label}</div>
                <div className="mode-btn-desc">{m.desc}</div>
              </div>
            ))}
          </div>

          <label className="label">Score Threshold — clip if score ≥ {score}/10</label>
          <input type="range" className="score-slider" min={5} max={10} value={score} onChange={e => setScore(Number(e.target.value))} style={{ marginBottom:14 }} />

          <div
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
          >
            <div className="dropzone-icon">🎬</div>
            <div className="dropzone-text"><strong>Drop your VOD here</strong> or click to browse</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>MP4, MOV, MKV, AVI, WebM</div>
          </div>
          <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={e => pickFile(e.target.files[0])} />
        </div>
      )}

      {/* Step 2 — Preview + Layout */}
      {!jobId && previewing && file && layout && (
        <div className="card">
          <div className="step-header"><div className="step-num">2</div><div className="step-label">Preview & Adjust Layout</div></div>
          <p style={{ fontSize:13, color:C.muted, marginBottom:14 }}>
            Drag the <span style={{ color:C.green }}>GAMEPLAY</span> and <span style={{ color:C.copper }}>FACECAM</span> zones to match how your stream looks in the video.
          </p>
          <p style={{ fontSize:13, color:C.text, marginBottom:14 }}>📂 {file.name}</p>

          <PreviewWithLayout url={null} layout={layout} setLayout={setLayout} videoFile={file} />

          <div style={{ marginTop:16, display:"flex", gap:10 }}>
            <button className="btn btn-ghost" onClick={() => setPreviewing(false)}>← Back</button>
            <button className="btn btn-primary" onClick={saveAndUpload}>▶ Start Processing</button>
          </div>
        </div>
      )}

      {/* Processing state */}
      {job && (
        <div className="card">
          <div className="card-title">Processing: {file?.name}</div>
          {job.status === "running" && (
            <div className="progress-bar"><div className="progress-fill" style={{ width:`${progress}%` }} /></div>
          )}
          <div style={{ marginTop:12 }} ref={logRef} className="log-box">
            {job.logs.map((l, i) => (
              <span key={i} className={`log-line ${logClass(l)}`}>{l}{"\n"}</span>
            ))}
          </div>
          {job.status === "done" && (
            <div className="banner banner-done">✅ Done — {job.clips.length} clip{job.clips.length !== 1 ? "s" : ""} saved.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Clips Tab ──────────────────────────────────────────────
function ClipsTab() {
  const [clips, setClips]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(`${API}/clips`)
      .then(r => r.json())
      .then(data => { setClips(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div>Loading clips…</div>;
  if (!clips.length) return <div className="empty"><div className="empty-icon">🎬</div><div>No clips yet.<br/><span style={{fontSize:13}}>Start a stream monitor or upload a VOD.</span></div></div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Saved Clips</h2>
        <span className="chip copper">{clips.length} clips</span>
      </div>
      <div className="clips-grid">
        {clips.map((c, i) => (
          <div key={i} className="clip-card">
            <video className="clip-video" controls preload="metadata" src={`${API}/clips/${c.date}/${c.titled}`} />
            <div className="clip-info">
              <div className="clip-title">{c.meta?.burned_title || c.base}</div>
              <div className="clip-sub">{c.date}</div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{c.meta?.yt_title}</div>
              <div style={{ fontSize:11, color:C.muted, fontStyle:"italic", marginBottom:8 }}>{c.meta?.tiktok_title}</div>
              {expanded === i && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>YouTube Tags</div>
                  <div className="tag-list">{(c.meta?.yt_tags||[]).map((t,j) => <span key={j} className="tag">#{t}</span>)}</div>
                  <div style={{ fontSize:11, color:C.muted, margin:"8px 0 4px" }}>TikTok Hashtags</div>
                  <div className="tag-list">{(c.meta?.tiktok_hashtags||[]).map((t,j) => <span key={j} className="tag">#{t}</span>)}</div>
                  <div style={{ fontSize:11, color:C.muted, margin:"8px 0 4px" }}>Hook</div>
                  <div style={{ fontSize:12, color:C.text }}>{c.meta?.hook}</div>
                </div>
              )}
              <div className="clip-actions">
                <a className="btn btn-primary btn-sm" href={`${API}/clips/${c.date}/${c.titled}`} download>↓ Titled</a>
                <a className="btn btn-ghost btn-sm" href={`${API}/clips/${c.date}/${c.portrait}`} download>↓ Clean</a>
                <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === i ? null : i)}>
                  {expanded === i ? "▲ Less" : "▼ Metadata"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Layout Tab ─────────────────────────────────────────────
function LayoutTab() {
  const CANVAS_W = 640;
  const CANVAS_H = 360;
  const [layout, setLayout]     = useState(null);
  const [saved, setSaved]       = useState(false);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/layout`).then(r => r.json()).then(setLayout).catch(() => setLayout({ ...DEFAULT_LAYOUT }));
  }, []);

  function toCanvas(val, axis) { return axis === "x" ? (val / 1920) * CANVAS_W : (val / 1080) * CANVAS_H; }
  function fromCanvas(val, axis) { return axis === "x" ? Math.round((val / CANVAS_W) * 1920) : Math.round((val / CANVAS_H) * 1080); }

  function onMouseDown(e, zone, type="move") {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    if (type === "move") setDragging({ zone, startX, startY, orig:{ ...layout[zone] } });
    else setResizing({ zone, startX, startY, orig:{ ...layout[zone] } });
  }

  function onMouseMove(e) {
    if (!dragging && !resizing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (dragging) {
      const dx = mx - dragging.startX;
      const dy = my - dragging.startY;
      setLayout(prev => ({
        ...prev,
        [dragging.zone]: {
          ...prev[dragging.zone],
          x: Math.max(0, fromCanvas(toCanvas(dragging.orig.x, "x") + dx, "x")),
          y: dragging.zone === "facecam" ? Math.max(0, fromCanvas(toCanvas(dragging.orig.y, "y") + dy, "y")) : prev[dragging.zone].y
        }
      }));
    }
    if (resizing) {
      const dx = mx - resizing.startX;
      const dy = my - resizing.startY;
      setLayout(prev => ({
        ...prev,
        [resizing.zone]: {
          ...prev[resizing.zone],
          w: Math.max(80, fromCanvas(toCanvas(resizing.orig.w, "x") + dx, "x")),
          h: resizing.zone === "facecam" ? Math.max(40, fromCanvas(toCanvas(resizing.orig.h, "y") + dy, "y")) : prev[resizing.zone].h
        }
      }));
    }
  }

  function onMouseUp() { setDragging(null); setResizing(null); }

  async function save() {
    await fetch(`${API}/layout`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(layout) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!layout) return <div className="empty"><div className="empty-icon">⏳</div>Loading layout…</div>;

  const fc = layout.facecam;
  const gp = layout.gameplay;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Layout Editor</h2>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setLayout({ ...DEFAULT_LAYOUT })}>↺ Reset</button>
          <button className="btn btn-primary" onClick={save}>{saved ? "✓ Saved!" : "Save Layout"}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Presets</div>
        <div className="preset-row">
          {Object.keys(PRESETS).map(name => (
            <button key={name} className="preset-btn" onClick={() => setLayout({ ...PRESETS[name] })}>{name}</button>
          ))}
        </div>

        <div className="card-title">Stream Canvas — Drag zones to match your OBS layout</div>
        <div
          ref={canvasRef}
          className="layout-editor"
          style={{ maxWidth:CANVAS_W }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div className="grid-overlay" />
          <div
            className="layout-zone zone-game"
            style={{ left:toCanvas(gp.x,"x"), top:0, width:toCanvas(gp.w,"x"), height:CANVAS_H }}
            onMouseDown={e => onMouseDown(e, "gameplay")}
          >
            GAMEPLAY
            <div className="zone-handle" onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "gameplay", "resize"); }}>⊿</div>
          </div>
          {layout.include_facecam && (
            <div
              className="layout-zone zone-face"
              style={{ left:toCanvas(fc.x,"x"), top:toCanvas(fc.y,"y"), width:toCanvas(fc.w,"x"), height:toCanvas(fc.h,"y") }}
              onMouseDown={e => onMouseDown(e, "facecam")}
            >
              FACECAM
              <div className="zone-handle" onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "facecam", "resize"); }}>⊿</div>
            </div>
          )}
        </div>

        <div style={{ marginTop:16 }}>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Include Facecam</div>
              <div className="toggle-sub">Show face + gameplay, or gameplay only</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={layout.include_facecam} onChange={e => setLayout(l => ({ ...l, include_facecam:e.target.checked }))} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
          <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><div className="label">Facecam</div><div style={{ fontSize:12, color:C.muted }}>X: {fc.x}  Y: {fc.y}  W: {fc.w}  H: {fc.h}</div></div>
            <div><div className="label">Gameplay</div><div style={{ fontSize:12, color:C.muted }}>X: {gp.x}  W: {gp.w}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────
export default function App() {
  const [tab, setTab]                 = useState("stream");
  const [activeJobId, setActiveJobId] = useState(null);

  const tabs = [
    { id:"stream", label:"▶ Stream" },
    { id:"upload", label:"↑ Upload" },
    { id:"clips",  label:"🎬 Clips" },
    { id:"layout", label:"⚙ Layout" },
  ];

  return (
    <div className="app">
      <style>{css}</style>
      <nav className="nav">
        <div className="nav-logo">COPPER<span>CLIPPER</span></div>
        <div className="nav-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="nav-status">
          <div className={`status-dot ${activeJobId ? "live" : ""}`} />
          {activeJobId ? "Clipping live" : "Idle"}
        </div>
      </nav>
      <main className="main">
        <div style={{ display: tab === "stream" ? "block" : "none" }}>
          <StreamTab activeJobId={activeJobId} onJobStart={id => setActiveJobId(id)} onJobEnd={() => setActiveJobId(null)} />
        </div>
        <div style={{ display: tab === "upload" ? "block" : "none" }}><UploadTab /></div>
        <div style={{ display: tab === "clips"  ? "block" : "none" }}><ClipsTab /></div>
        <div style={{ display: tab === "layout" ? "block" : "none" }}><LayoutTab /></div>
      </main>
    </div>
  );
}
