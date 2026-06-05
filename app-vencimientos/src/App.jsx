import { useState, useEffect } from "react";

function injectFonts() {
  if (document.getElementById("venc-fonts")) return;
  const l = document.createElement("link");
  l.id = "venc-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
}

function injectStyles() {
  if (document.getElementById("venc-styles")) return;
  const s = document.createElement("style");
  s.id = "venc-styles";
  s.textContent = `
    *{box-sizing:border-box}
    input:focus,textarea:focus{border-color:rgba(255,255,255,0.22)!important;outline:none}
    input::placeholder,textarea::placeholder{color:#6A6888}
    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#28283C;border-radius:3px}
    input[type=date]{color-scheme:dark}
    input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5);cursor:pointer}
    button:active{transform:scale(0.97)}
  `;
  document.head.appendChild(s);
}

// ── Storage
const SKEY = "vencim_v2";
async function loadData() {
  if (!window.storage) return null;
  try {
    const r = await window.storage.get(SKEY);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}
async function saveData(d) {
  if (!window.storage) return;
  try { await window.storage.set(SKEY, JSON.stringify(d)); } catch {}
}

// ── Helpers
const mkDate = (offset) => {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
};

const DEFAULTS = [
  { id:"s1", type:"personal", title:"Renovar VTV del auto",      description:"Turno en el centro de inspección",     date:mkDate(2),  assignee:"", completed:false },
  { id:"s2", type:"personal", title:"Declaración jurada AFIP",   description:"Vencimiento improrrogable",             date:mkDate(-1), assignee:"", completed:false },
  { id:"s3", type:"team",     title:"Informe trimestral Q2",     description:"Presentar al directorio antes del cierre", date:mkDate(4),  assignee:"Ana López",       completed:false },
  { id:"s4", type:"team",     title:"Auditoría de sistemas",     description:"Coordinar con el equipo de IT",         date:mkDate(0),  assignee:"Sofía Rodríguez", completed:false },
  { id:"s5", type:"team",     title:"Revisión de objetivos H1",  description:"",                                      date:mkDate(15), assignee:"Carlos García",   completed:false },
];

function getUrgency(item) {
  if (item.completed)
    return { label:"Completado", color:"#34D399", bg:"rgba(52,211,153,0.11)", rank:99 };
  const t = new Date(); t.setHours(0,0,0,0);
  const d = new Date(item.date + "T00:00:00");
  const diff = Math.round((d - t) / 86400000);
  if (diff < 0)   return { label:`Venció hace ${Math.abs(diff)}d`, color:"#F87171", bg:"rgba(248,113,113,0.13)", rank:0 };
  if (diff === 0) return { label:"Vence hoy",                      color:"#FB923C", bg:"rgba(251,146,60,0.13)",  rank:1 };
  if (diff <= 3)  return { label:`${diff}d restantes`,             color:"#FBBF24", bg:"rgba(251,191,36,0.12)",  rank:2 };
                  return { label:`${diff}d restantes`,             color:"#60A5FA", bg:"rgba(96,165,250,0.11)",  rank:3 };
}

function fmtDate(str) {
  return new Date(str + "T00:00:00").toLocaleDateString("es-AR", {
    day:"2-digit", month:"short", year:"numeric"
  });
}

// ── Design tokens
const C = {
  bg:"#09090F",
  surf:"#111120",
  card:"#191928",
  border:"rgba(255,255,255,0.08)",
  text:"#EEE9FF",
  muted:"#6A6888",
  personal:"#FF7A45",
  team:"#5B8BFF",
};

const inputBase = {
  width:"100%",
  background:C.card,
  border:`1px solid ${C.border}`,
  borderRadius:10,
  padding:"11px 13px",
  color:C.text,
  fontFamily:"'Syne',sans-serif",
  fontSize:14,
};

// ── Subcomponents
function Label({ text, required }) {
  return (
    <div style={{ fontSize:10, color:C.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
      {text}{required && " *"}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <Label text={label} required={required} />
      {children}
    </div>
  );
}

function Card({ item, onToggle, onEdit, onDelete }) {
  const u = getUrgency(item);
  return (
    <div style={{
      background:C.card,
      border:`1px solid ${C.border}`,
      borderLeft:`3px solid ${u.color}`,
      borderRadius:12,
      padding:"14px 14px 14px 16px",
      opacity:item.completed ? 0.58 : 1,
      transition:"opacity 0.2s",
    }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>

        {/* Checkbox */}
        <div
          onClick={onToggle}
          style={{
            width:22, height:22, borderRadius:6, flexShrink:0, marginTop:2,
            border:`2px solid ${item.completed ? u.color : C.border}`,
            background:item.completed ? u.color+"28" : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:u.color, fontSize:12, fontWeight:800,
            transition:"all 0.15s",
          }}
        >
          {item.completed ? "✓" : ""}
        </div>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
            <span style={{
              fontWeight:700, fontSize:15,
              textDecoration:item.completed ? "line-through" : "none",
              color:item.completed ? C.muted : C.text,
              wordBreak:"break-word", lineHeight:1.3,
            }}>
              {item.title}
            </span>
            <span style={{
              flexShrink:0, fontSize:10, fontWeight:700,
              background:u.bg, color:u.color,
              borderRadius:20, padding:"3px 10px",
              fontFamily:"'IBM Plex Mono',monospace",
              whiteSpace:"nowrap", letterSpacing:0.2,
            }}>
              {u.label}
            </span>
          </div>

          {item.description && (
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.55, marginBottom:6 }}>
              {item.description}
            </div>
          )}

          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginTop:6 }}>
            <span style={{ fontSize:11, color:C.muted, fontFamily:"'IBM Plex Mono',monospace" }}>
              📅 {fmtDate(item.date)}
            </span>
            {item.type === "team" && item.assignee && (
              <span style={{ fontSize:11, color:C.team, background:C.team+"18", borderRadius:20, padding:"2px 10px" }}>
                👤 {item.assignee}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
          <button
            onClick={onEdit}
            title="Editar"
            style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, width:30, height:30, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}
          >✏️</button>
          <button
            onClick={onDelete}
            title="Eliminar"
            style={{ background:"none", border:`1px solid ${C.border}`, color:"#F87171", borderRadius:6, width:30, height:30, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}
          >🗑</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App
export default function App() {
  const [items, setItems]       = useState([]);
  const [ready, setReady]       = useState(false);
  const [tab, setTab]           = useState("personal");
  const [filter, setFilter]     = useState("pending");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({});
  const [delId, setDelId]       = useState(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    injectFonts();
    injectStyles();
    loadData().then(d => {
      setItems(d ?? DEFAULTS);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    setSaving(true);
    const t = setTimeout(() => { saveData(items); setSaving(false); }, 500);
    return () => clearTimeout(t);
  }, [items, ready]);

  // ── Stats
  const todayMid = (() => { const t = new Date(); t.setHours(0,0,0,0); return t; })();
  const stat = (type) => {
    const m = items.filter(i => i.type === type);
    return {
      pending: m.filter(i => !i.completed).length,
      overdue: m.filter(i => !i.completed && new Date(i.date+"T00:00:00") < todayMid).length,
      today:   m.filter(i => {
        const d = new Date(i.date+"T00:00:00");
        return !i.completed && Math.round((d - todayMid) / 86400000) === 0;
      }).length,
    };
  };
  const ps = stat("personal");
  const ts = stat("team");
  const tabColor = tab === "personal" ? C.personal : C.team;

  // ── Filtered + sorted list
  const list = items
    .filter(i => i.type === tab)
    .filter(i =>
      filter === "all"       ? true :
      filter === "pending"   ? !i.completed :
      i.completed
    )
    .sort((a, b) => {
      if (filter === "completed") return new Date(a.date) - new Date(b.date);
      const ra = getUrgency(a).rank, rb = getUrgency(b).rank;
      return ra !== rb ? ra - rb : new Date(a.date) - new Date(b.date);
    });

  // ── Actions
  function openAdd() {
    setForm({ title:"", description:"", date:mkDate(7), type:tab, assignee:"", completed:false });
    setEditId(null);
    setShowModal(true);
  }
  function openEdit(item) {
    setForm({...item});
    setEditId(item.id);
    setShowModal(true);
  }
  function handleSave() {
    if (!form.title?.trim() || !form.date) return;
    if (editId) {
      setItems(p => p.map(i => i.id === editId ? {...form, id:editId} : i));
    } else {
      setItems(p => [...p, {...form, id:String(Date.now())}]);
    }
    setShowModal(false);
  }
  function toggleDone(id) {
    setItems(p => p.map(i => i.id === id ? {...i, completed:!i.completed} : i));
  }
  function doDelete(id) {
    setItems(p => p.filter(i => i.id !== id));
    setDelId(null);
  }

  // ── Loading
  if (!ready) return (
    <div style={{ fontFamily:"'Syne',sans-serif", background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:14 }}>
      Cargando...
    </div>
  );

  return (
    <div style={{ fontFamily:"'Syne',sans-serif", background:C.bg, minHeight:"100vh", color:C.text }}>

      {/* ──────── HEADER ──────── */}
      <div style={{ padding:"24px 20px 0", borderBottom:`1px solid ${C.border}` }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:3, color:C.muted, textTransform:"uppercase", marginBottom:3 }}>
              Panel de
            </div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>Vencimientos</h1>
          </div>
          {saving && (
            <span style={{ fontSize:10, color:C.muted, marginTop:6, letterSpacing:1 }}>guardando…</span>
          )}
        </div>

        {/* ── Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {[
            { key:"personal", label:"Mis vencimientos", co:C.personal, s:ps },
            { key:"team",     label:"Mi equipo",        co:C.team,     s:ts },
          ].map(({ key, label, co, s }) => (
            <div
              key={key}
              onClick={() => { setTab(key); setFilter("pending"); }}
              style={{
                background:C.card,
                border:`1px solid ${tab === key ? co+"55" : C.border}`,
                borderRadius:14, padding:"14px 16px", cursor:"pointer",
                transition:"border-color 0.2s",
                boxShadow: tab === key ? `inset 0 0 0 1px ${co}22` : "none",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:co }} />
                <span style={{ fontSize:10, color:C.muted, letterSpacing:1.5, textTransform:"uppercase" }}>
                  {label}
                </span>
              </div>
              <div style={{ fontSize:32, fontWeight:800, color:co, lineHeight:1, marginBottom:4, fontFamily:"'IBM Plex Mono',monospace" }}>
                {s.pending}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>pendientes</div>
              {s.overdue > 0 && (
                <div style={{ marginTop:8, display:"inline-block", fontSize:10, fontWeight:700, background:"rgba(248,113,113,0.14)", color:"#F87171", borderRadius:20, padding:"3px 9px" }}>
                  ⚠ {s.overdue} vencido{s.overdue > 1 ? "s" : ""}
                </div>
              )}
              {s.overdue === 0 && s.today > 0 && (
                <div style={{ marginTop:8, display:"inline-block", fontSize:10, fontWeight:700, background:"rgba(251,146,60,0.14)", color:"#FB923C", borderRadius:20, padding:"3px 9px" }}>
                  🔔 vence hoy
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Tab bar */}
        <div style={{ display:"flex" }}>
          {[
            { id:"personal", label:"Mis vencimientos", co:C.personal },
            { id:"team",     label:"Equipo",           co:C.team },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex:1, background:"none", border:"none",
                borderBottom:`2px solid ${tab === t.id ? t.co : "transparent"}`,
                color:tab === t.id ? t.co : C.muted,
                fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
                padding:"12px 8px", cursor:"pointer", transition:"all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──────── FILTER CHIPS ──────── */}
      <div style={{ padding:"14px 20px 4px", display:"flex", gap:8 }}>
        {[
          { id:"pending",   l:"Pendientes" },
          { id:"all",       l:"Todos" },
          { id:"completed", l:"Completados" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              background: filter === f.id ? tabColor+"1A" : "transparent",
              border:`1px solid ${filter === f.id ? tabColor+"55" : C.border}`,
              color: filter === f.id ? tabColor : C.muted,
              borderRadius:20, padding:"5px 14px",
              fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:12,
              cursor:"pointer", transition:"all 0.2s",
            }}
          >
            {f.l}
          </button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:11, color:C.muted, alignSelf:"center" }}>
          {list.length} {list.length === 1 ? "ítem" : "ítems"}
        </span>
      </div>

      {/* ──────── LIST ──────── */}
      <div style={{ padding:"10px 20px 100px" }}>
        {list.length === 0 ? (
          <div style={{ textAlign:"center", padding:"52px 0" }}>
            <div style={{ fontSize:38, marginBottom:10, opacity:0.25 }}>✓</div>
            <div style={{ color:C.muted, fontSize:14, marginBottom:20 }}>
              {filter === "completed"
                ? "Aún no hay ítems completados"
                : "No hay vencimientos pendientes"}
            </div>
            {filter !== "completed" && (
              <button
                onClick={openAdd}
                style={{ background:tabColor, border:"none", color:"#fff", borderRadius:10, padding:"10px 24px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}
              >
                + Agregar vencimiento
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {list.map(item => (
              <Card
                key={item.id}
                item={item}
                onToggle={() => toggleDone(item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => setDelId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ──────── FAB ──────── */}
      <button
        onClick={openAdd}
        style={{
          position:"fixed", bottom:24, right:24,
          width:56, height:56, borderRadius:"50%",
          background:tabColor, border:"none", color:"#fff",
          fontSize:30, cursor:"pointer", zIndex:100,
          boxShadow:`0 4px 24px ${tabColor}55`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'Syne',sans-serif", transition:"transform 0.15s",
        }}
        title="Agregar vencimiento"
      >
        +
      </button>

      {/* ──────── DELETE CONFIRM ──────── */}
      {delId && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.74)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}
          onClick={e => e.target === e.currentTarget && setDelId(null)}
        >
          <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:18, padding:28, maxWidth:300, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🗑</div>
            <div style={{ fontWeight:700, fontSize:17, marginBottom:6 }}>¿Eliminar este ítem?</div>
            <div style={{ color:C.muted, fontSize:13, marginBottom:22, lineHeight:1.5 }}>
              Esta acción no se puede deshacer.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={() => setDelId(null)}
                style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:10, padding:"11px", fontFamily:"'Syne',sans-serif", fontWeight:700, cursor:"pointer", fontSize:14 }}
              >
                Cancelar
              </button>
              <button
                onClick={() => doDelete(delId)}
                style={{ flex:1, background:"#F87171", border:"none", color:"#fff", borderRadius:10, padding:"11px", fontFamily:"'Syne',sans-serif", fontWeight:700, cursor:"pointer", fontSize:14 }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────── ADD / EDIT MODAL ──────── */}
      {showModal && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{
            background:C.surf, border:`1px solid ${C.border}`,
            borderRadius:"20px 20px 0 0",
            padding:"24px 24px 36px", width:"100%", maxWidth:560,
            maxHeight:"92vh", overflowY:"auto",
          }}>
            {/* Modal header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>
                {editId ? "Editar vencimiento" : "Nuevo vencimiento"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}
              >
                ✕
              </button>
            </div>

            {/* Type selector */}
            <Field label="Tipo">
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { id:"personal", l:"🙋 Personal", co:C.personal },
                  { id:"team",     l:"👥 Equipo",   co:C.team },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setForm(f => ({...f, type:t.id}))}
                    style={{
                      flex:1, padding:"10px 8px", borderRadius:10, cursor:"pointer",
                      fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
                      background: form.type === t.id ? t.co+"1A" : "transparent",
                      border:`2px solid ${form.type === t.id ? t.co : C.border}`,
                      color: form.type === t.id ? t.co : C.muted,
                      transition:"all 0.15s",
                    }}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
            </Field>

            {/* Title */}
            <Field label="Título" required>
              <input
                value={form.title || ""}
                onChange={e => setForm(f => ({...f, title:e.target.value}))}
                placeholder="ej. Renovar licencia de conducir"
                style={inputBase}
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
            </Field>

            {/* Date */}
            <Field label="Fecha de vencimiento" required>
              <input
                type="date"
                value={form.date || ""}
                onChange={e => setForm(f => ({...f, date:e.target.value}))}
                style={{ ...inputBase, fontFamily:"'IBM Plex Mono',monospace" }}
              />
            </Field>

            {/* Description */}
            <Field label="Descripción">
              <textarea
                value={form.description || ""}
                onChange={e => setForm(f => ({...f, description:e.target.value}))}
                placeholder="Detalles adicionales..."
                rows={3}
                style={{ ...inputBase, resize:"vertical", lineHeight:1.5 }}
              />
            </Field>

            {/* Assignee (team only) */}
            {form.type === "team" && (
              <Field label="Responsable">
                <input
                  value={form.assignee || ""}
                  onChange={e => setForm(f => ({...f, assignee:e.target.value}))}
                  placeholder="Nombre de la persona responsable"
                  style={inputBase}
                />
              </Field>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!form.title?.trim() || !form.date}
              style={{
                width:"100%", padding:"14px", marginTop:4,
                background: !form.title?.trim() || !form.date
                  ? "rgba(255,255,255,0.06)"
                  : form.type === "personal" ? C.personal : C.team,
                border:"none", color: !form.title?.trim() || !form.date ? C.muted : "#fff",
                borderRadius:12, fontFamily:"'Syne',sans-serif", fontWeight:800,
                fontSize:15, cursor: !form.title?.trim() || !form.date ? "not-allowed" : "pointer",
                transition:"background 0.2s, color 0.2s",
              }}
            >
              {editId ? "Guardar cambios" : "Agregar vencimiento"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
