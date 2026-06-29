import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── Theme ──────────────────────────────────────────────────
const C = {
  bg:       "#0E0F11",
  surface:  "#1A1C20",
  card:     "#22252B",
  border:   "#2E3138",
  copper:   "#C97B3A",
  copperLt: "#E8943F",
  copperDm: "#8F5523",
  text:     "#F0EBE3",
  muted:    "#7A8090",
  green:    "#3DCB7F",
  red:      "#E05555",
  yellow:   "#E8C43A",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'Inter', sans-serif; min-height: 100vh; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${C.surface}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }

  .app { display: flex; flex-direction: column; min-height: 100vh; }

  /* Nav */
  .nav { background: ${C.surface}; border-bottom: 1px solid ${C.border}; padding: 0 24px; display: flex; align-items: center; gap: 32px; height: 56px; position: sticky; top: 0; z-index: 100; }
  .nav-logo { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 20px; color: ${C.copper}; letter-spacing: 1px; white-space: nowrap; }
  .nav-logo span { color: ${C.text}; }
  .nav-tabs { display: flex; gap: 4px; }
  .nav-tab { background: none; border: none; color: ${C.muted}; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; padding: 6px 14px; border-radius: 6px; cursor: pointer; transition: all .15s; }
  .nav-tab:hover { color: ${C.text}; background: ${C.card}; }
  .nav-tab.active { color: ${C.copper}; background: ${C.copperDm}22; }
  .nav-status { margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: 12px; color: ${C.muted}; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; background: ${C.border}; }
  .status-dot.live { background: ${C.green}; box-shadow: 0 0 6px ${C.green}88; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }

  /* Main */
  .main { flex: 1; padding: 28px 24px; max-width: 1100px; margin: 0 auto; width: 100%; }

  /* Cards */
  .card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 12px; padding: 20px; }
  .card + .card { margin-top: 16px; }
  .card-title { font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 15px; color: ${C.copper}; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 16px; }

  /* Form */
  .field { margin-bottom: 14px; }
  .label { display: block; font-size: 12px; font-weight: 500; color: ${C.muted}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .5px; }
  .input { width: 100%; background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 8px; color: ${C.text}; font-family: 'Inter', sans-serif; font-size: 14px; padding: 10px 14px; outline: none; transition: border .15s; }
  .input:focus { border-color: ${C.copper}; }
  .input::placeholder { color: ${C.muted}; }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; padding: 10px 18px; cursor: pointer; transition: all .15s; white-space: nowrap; }
  .btn-primary { background: ${C.copper}; color: #fff; }
  .btn-primary:hover { background: ${C.copperLt}; }
  .btn-primary:disabled { background: ${C.copperDm}; cursor: not-allowed; opacity: .6; }
  .btn-danger { background: ${C.red}22; color: ${C.red}; border: 1px solid ${C.red}44; }
  .btn-danger:hover { background: ${C.red}33; }
  .btn-ghost { background: ${C.surface}; color: ${C.text}; border: 1px solid ${C.border}; }
  .btn-ghost:hover { border-color: ${C.copper}; color: ${C.copper}; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }

  /* Row */
  .row { display: flex; gap: 12px; align-items: flex-end; }
  .row .field { flex: 1; margin-bottom: 0; }

  /* Job log */
  .log-box { background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; color: #9BA5B4; height: 200px; overflow-y: auto; line-height: 1.7; }
  .log-line { display: block; }
  .log-line.clip { color: ${C.green}; }
  .log-line.warn { color: ${C.yellow}; }
  .log-line.err  { color: ${C.red}; }

  /* Chips */
  .chip { display: inline-block; background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px; font-size: 11px; color: ${C.muted}; padding: 3px 10px; }
  .chip.green { background: ${C.green}11; border-color: ${C.green}44; color: ${C.green}; }
  .chip.copper { background: ${C.copper}11; border-color: ${C.copper}44; color: ${C.copper}; }
  .chip.red { background: ${C.red}11; border-color: ${C.red}44; color: ${C.red}; }
  .chip.yellow { background: ${C.yellow}11; border-color: ${C.yellow}44; color: ${C.yellow}; }

  /* Score badge */
  .score { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 22px; }

  /* Clips grid */
  .clips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  .clip-card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 12px; overflow: hidden; }
  .clip-video { width: 100%; aspect-ratio: 9/16; background: #000; display: block; }
  .clip-info { padding: 14px; }
  .clip-title { font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 15px; color: ${C.text}; margin-bottom: 4px; }
  .clip-sub { font-size: 12px; color: ${C.muted}; margin-bottom: 10px; }
  .clip-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* Layout editor */
  .layout-editor { position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; overflow: hidden; border: 1px solid ${C.border}; user-select: none; }
  .layout-zone { position: absolute; border: 2px solid; border-radius: 4px; cursor: move; display: flex; align-items: center; justify-content: center; font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: .5px; transition: box-shadow .15s; }
  .layout-zone:hover { box-shadow: 0 0 0 1px currentColor; }
  .layout-zone .handle { position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; cursor: se-resize; opacity: .5; }
  .zone-face { border-color: ${C.copper}; background: ${C.copper}22; color: ${C.copper}; }
  .zone-game { border-color: ${C.green}; background: ${C.green}11; color: ${C.green}; }
  .grid-overlay { position: absolute; inset: 0; background-image: linear-gradient(${C.border}44 1px, transparent 1px), linear-gradient(90deg, ${C.border}44 1px, transparent 1px); background-size: 10% 10%; pointer-events: none; }

  /* Toggle */
  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid ${C.border}; }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-label { font-size: 13px; color: ${C.text}; }
  .toggle-sub { font-size: 11px; color: ${C.muted}; margin-top: 2px; }
  .toggle { position: relative; width: 38px; height: 20px; }
  .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-track { position: absolute; inset: 0; background: ${C.border}; border-radius: 20px; cursor: pointer; transition: background .2s; }
  .toggle input:checked + .toggle-track { background: ${C.copper}; }
  .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: transform .2s; pointer-events: none; }
  .toggle input:checked ~ .toggle-thumb { transform: translateX(18px); }

  /* Upload drop zone */
  .dropzone { border: 2px dashed ${C.border}; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all .2s; }
  .dropzone:hover, .dropzone.dragging { border-color: ${C.copper}; background: ${C.copper}08; }
  .dropzone-icon { font-size: 36px; margin-bottom: 12px; }
  .dropzone-text { color: ${C.muted}; font-size: 14px; }
  .dropzone-text strong { color: ${C.text}; }

  /* Empty */
  .empty { text-align: center; padding: 60px 20px; color: ${C.muted}; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; opacity: .4; }

  /* Section header */
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .section-title { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 22px; color: ${C.text}; }

  /* Progress bar */
  .progress-bar { height: 4px; background: ${C.border}; border-radius: 2px; overflow: hidden; margin-top: 8px; }
  .progress-fill { height: 100%; background: ${C.copper}; border-radius: 2px; transition: width .3s; }

  /* Meta tags */
  .tag-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .tag { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 4px; font-size: 11px; color: ${C.muted}; padding: 2px 8px; }
`;

// ── Helpers ────────────────────────────────────────────────
function statusChip(status) {
  const map = { pending:"yellow", running:"green", done:"copper", failed:"red", stopped:"" };
  return <span className={`chip ${map[status]||""}`}>{status}</span>;
}

function logClass(line) {
  if (line.includes("🎬") || line.includes("✅")) return "clip";
  if (line.includes("⚠️")) return "warn";
  if (line.includes("❌") || line.includes("Fatal")) return "err";
  return "";
}

// ── Stream Tab ─────────────────────────────────────────────
function StreamTab({ onJobStart }) {
  const [url, setUrl]       = useState("");
  const [game, setGame]     = useState("gaming");
  const [jobId, setJobId]   = useState(null);
  const [job, setJob]       = useState(null);
  const [loading, setLoading] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    const iv = setInterval(async () => {
      const res = await fetch(`${API}/jobs/${jobId}`);
      const data = await res.json();
      setJob(data);
      if (data.status === "done" || data.status === "failed" || data.status === "stopped") clearInterval(iv);
    }, 2000);
    return () => clearInterval(iv);
  }, [jobId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [job?.logs]);

  async function start() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/clip/stream`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), game })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start");
      setJobId(data.job_id);
      onJobStart(data.job_id);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function stop() {
    if (!jobId) return;
    await fetch(`${API}/clip/stream/${jobId}`, { method: "DELETE" });
  }

  const isRunning = job?.status === "running";

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Stream Monitor</h2>
        {job && statusChip(job.status)}
      </div>

      <div className="card">
        <div className="card-title">Stream Source</div>
        <div className="row">
          <div className="field">
            <label className="label">Stream URL</label>
            <input className="input" placeholder="https://twitch.tv/channel  •  https://kick.com/channel  •  rtmp://..." value={url} onChange={e => setUrl(e.target.value)} disabled={isRunning} />
          </div>
          <div className="field" style={{ maxWidth: 180 }}>
            <label className="label">Game</label>
            <input className="input" placeholder="e.g. Dead by Daylight" value={game} onChange={e => setGame(e.target.value)} disabled={isRunning} />
          </div>
          {!isRunning
            ? <button className="btn btn-primary" onClick={start} disabled={loading || !url.trim()}>
                {loading ? "Starting…" : "▶ Start Clipping"}
              </button>
            : <button className="btn btn-danger" onClick={stop}>■ Stop</button>
          }
        </div>
      </div>

      {job && (
        <div className="card">
          <div className="card-title">Live Feed</div>
          <div ref={logRef} className="log-box">
            {job.logs.map((l, i) => (
              <span key={i} className={`log-line ${logClass(l)}`}>{l}{"\n"}</span>
            ))}
            {isRunning && <span className="log-line" style={{ color: C.copper }}>● Monitoring…</span>}
          </div>
          {job.clips.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="card-title">Clips This Session ({job.clips.length})</div>
              {job.clips.map((c, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span className="score" style={{ color: C.copper }}>{c.score}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{c.meta?.burned_title}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{c.meta?.yt_title}</div>
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
  const [game, setGame]       = useState("gaming");
  const [jobId, setJobId]     = useState(null);
  const [job, setJob]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [filename, setFilename] = useState(null);
  const logRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    const iv = setInterval(async () => {
      const res  = await fetch(`${API}/jobs/${jobId}`);
      const data = await res.json();
      setJob(data);
      if (data.status === "done" || data.status === "failed") clearInterval(iv);
    }, 2000);
    return () => clearInterval(iv);
  }, [jobId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [job?.logs]);

  async function upload(file) {
    if (!file) return;
    setFilename(file.name);
    const form = new FormData();
    form.append("file", file);
    form.append("game", game);
    const res  = await fetch(`${API}/clip/upload`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) { alert(data.detail); return; }
    setJobId(data.job_id);
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

      {!jobId && (
        <div className="card">
          <div className="field">
            <label className="label">Game</label>
            <input className="input" style={{ maxWidth: 280 }} placeholder="e.g. Detroit: Become Human" value={game} onChange={e => setGame(e.target.value)} />
          </div>
          <div
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]); }}
          >
            <div className="dropzone-icon">🎬</div>
            <div className="dropzone-text"><strong>Drop your VOD here</strong> or click to browse</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>MP4, MOV, MKV, AVI, WebM</div>
          </div>
          <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={e => upload(e.target.files[0])} />
        </div>
      )}

      {job && (
        <div className="card">
          <div className="card-title">Processing: {filename}</div>
          {job.status === "running" && (
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          )}
          <div style={{ marginTop: 12 }} ref={logRef} className="log-box">
            {job.logs.map((l, i) => (
              <span key={i} className={`log-line ${logClass(l)}`}>{l}{"\n"}</span>
            ))}
          </div>
          {job.status === "done" && (
            <div style={{ marginTop: 12, color: C.green, fontSize: 14, fontWeight: 600 }}>
              ✅ Done — {job.clips.length} clip{job.clips.length !== 1 ? "s" : ""} saved
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Clips Tab ──────────────────────────────────────────────
function ClipsTab() {
  const [clips, setClips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(`${API}/clips`)
      .then(r => r.json())
      .then(data => { setClips(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div>Loading clips…</div>;
  if (!clips.length) return <div className="empty"><div className="empty-icon">🎬</div><div>No clips yet.<br/><span style={{fontSize:13}}>Start a stream monitor or upload a VOD to generate highlights.</span></div></div>;

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
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{c.meta?.yt_title}</div>

              {expanded === i && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>TikTok Caption</div>
                  <div style={{ fontSize: 12, color: C.text, marginBottom: 8 }}>{c.meta?.tiktok_title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>YouTube Tags</div>
                  <div className="tag-list">{(c.meta?.yt_tags||[]).map((t,j) => <span key={j} className="tag">#{t}</span>)}</div>
                  <div style={{ fontSize: 11, color: C.muted, margin: "8px 0 4px" }}>TikTok Hashtags</div>
                  <div className="tag-list">{(c.meta?.tiktok_hashtags||[]).map((t,j) => <span key={j} className="tag">#{t}</span>)}</div>
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

  const [layout, setLayout]   = useState(null);
  const [saved, setSaved]     = useState(false);
  const [dragging, setDragging] = useState(null); // { zone, startX, startY, origX, origY }
  const [resizing, setResizing] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/layout`).then(r => r.json()).then(setLayout);
  }, []);

  function toCanvas(val, axis) {
    return axis === "x" ? (val / 1920) * CANVAS_W : (val / 1080) * CANVAS_H;
  }
  function fromCanvas(val, axis) {
    return axis === "x" ? Math.round((val / CANVAS_W) * 1920) : Math.round((val / CANVAS_H) * 1080);
  }

  function onMouseDown(e, zone, type="move") {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    if (type === "move") {
      setDragging({ zone, startX, startY, orig: { ...layout[zone] } });
    } else {
      setResizing({ zone, startX, startY, orig: { ...layout[zone] } });
    }
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
    await fetch(`${API}/layout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(layout)
    });
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
        <button className="btn btn-primary" onClick={save}>{saved ? "✓ Saved!" : "Save Layout"}</button>
      </div>

      <div className="card">
        <div className="card-title">Stream Canvas — Drag zones to match your OBS layout</div>
        <div
          ref={canvasRef}
          className="layout-editor"
          style={{ maxWidth: CANVAS_W }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div className="grid-overlay" />

          {/* Gameplay zone */}
          <div
            className="layout-zone zone-game"
            style={{
              left:   toCanvas(gp.x, "x"),
              top:    0,
              width:  toCanvas(gp.w, "x"),
              height: CANVAS_H,
            }}
            onMouseDown={e => onMouseDown(e, "gameplay")}
          >
            GAMEPLAY
            <div className="handle" onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "gameplay", "resize"); }}>⊿</div>
          </div>

          {/* Facecam zone (only if enabled) */}
          {layout.include_facecam && (
            <div
              className="layout-zone zone-face"
              style={{
                left:   toCanvas(fc.x, "x"),
                top:    toCanvas(fc.y, "y"),
                width:  toCanvas(fc.w, "x"),
                height: toCanvas(fc.h, "y"),
              }}
              onMouseDown={e => onMouseDown(e, "facecam")}
            >
              FACECAM
              <div className="handle" onMouseDown={e => { e.stopPropagation(); onMouseDown(e, "facecam", "resize"); }}>⊿</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Include Facecam</div>
              <div className="toggle-sub">Show face + gameplay or gameplay only</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={layout.include_facecam} onChange={e => setLayout(l => ({ ...l, include_facecam: e.target.checked }))} />
              <div className="toggle-track" />
              <div className="toggle-thumb" />
            </label>
          </div>

          <div style={{ marginTop: 12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div className="label">Facecam Position</div>
              <div style={{ fontSize: 12, color: C.muted }}>X: {fc.x}px  Y: {fc.y}px  W: {fc.w}px  H: {fc.h}px</div>
            </div>
            <div>
              <div className="label">Gameplay Position</div>
              <div style={{ fontSize: 12, color: C.muted }}>X: {gp.x}px  W: {gp.w}px</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────
export default function App() {
  const [tab, setTab]         = useState("stream");
  const [activeJob, setActiveJob] = useState(null);

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
            <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="nav-status">
          <div className={`status-dot ${activeJob ? "live" : ""}`} />
          {activeJob ? "Clipping live" : "Idle"}
        </div>
      </nav>

      <main className="main">
        {tab === "stream" && <StreamTab onJobStart={setActiveJob} />}
        {tab === "upload" && <UploadTab />}
        {tab === "clips"  && <ClipsTab />}
        {tab === "layout" && <LayoutTab />}
      </main>
    </div>
  );
}
