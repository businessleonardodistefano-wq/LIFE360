import { useState, useEffect, useRef } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
const STORAGE_KEY = "life360_v1";

const load = async () => {
  try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : null; } catch { return null; }
};
const save = async (data) => {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

const defaultState = () => ({
  profile: { name: "Utente", age: 26, dob: "2000-04-19", height: 176, weight: 77, bf: 10 },
  physicalLog: [], // [{date, weight, bf, notes}]
  sleep: [], // [{date, bedtime, wakeup, quality, notes}]
  workouts: [], // [{date, type, exercises:[{name,sets,reps,kg}], notes, duration}]
  nutrition: { calories: 2200, protein: 180, carbs: 220, fats: 70 },
  nutritionLog: [], // [{date, calories, protein, carbs, fats, notes}]
  finances: { monthlyTarget: 10000, currency: "€" },
  transactions: [], // [{id, date, type, category, amount, note, recurring}]
  habits: [
    { id: "h1", name: "Lettura", icon: "📚", color: "#a855f7" },
    { id: "h2", name: "Studio", icon: "🎓", color: "#22c55e" },
    { id: "h3", name: "Journaling", icon: "✍️", color: "#eab308" },
    { id: "h4", name: "Meditazione", icon: "🧘", color: "#06b6d4" },
  ],
  habitLog: {}, // {"2024-01-01": {h1:true, h2:false,...}}
  mood: [], // [{date, score, notes}]
  journal: [], // [{date, text, mood}]
  routine: {
    morning: [
      { id: "m1", label: "60 Pushups", done: false },
      { id: "m2", label: "3x Vacuum 15s", done: false },
      { id: "m3", label: "5min Meditazione", done: false },
      { id: "m4", label: "Colazione", done: false },
      { id: "m5", label: "Lava viso & denti", done: false },
      { id: "m6", label: "Crema viso", done: false },
    ],
    evening: [
      { id: "e1", label: "Spegni schermi", done: false },
      { id: "e2", label: "Tisana", done: false },
      { id: "e3", label: "Journal", done: false },
      { id: "e4", label: "Lettura", done: false },
    ],
  },
  routineLog: {}, // {"2024-01-01": {morning:[...], evening:[...]}}
  trading: { goal: "Automatizzare entro Set 2025", notes: "" },
  theme: "dark",
});

// ── design tokens ──────────────────────────────────────────────────────────
const VIOLET = "#a855f7";
const GREEN = "#4ade80";
const YELLOW = "#facc15";
const CYAN = "#22d3ee";

const CATS_OUT = ["Cibo", "Abbigliamento", "Sport", "Trasporti", "Casa", "Salute", "Intrattenimento", "Altro"];
const CATS_IN = ["Lavoro", "Trading", "Freelance", "Altro"];
const WORKOUT_TYPES = ["Upper Body HIIT", "Upper Body Forza (8 rep)", "Upper Body Volume (15 rep)", "Addome", "Calcio", "Corsa", "Full Body", "Altro"];
const MOODS = ["😤", "😔", "😐", "🙂", "😄"];
const MOOD_LABELS = ["Pessimo", "Basso", "Neutro", "Bene", "Ottimo"];

// ── glass style ─────────────────────────────────────────────────────────────
const glass = (extra = "") => `
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 20px;
  ${extra}
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load().then((saved) => {
      setData(saved || defaultState());
      setLoading(false);
    });
  }, []);

  const update = (fn) => {
    setData((prev) => {
      const next = fn(JSON.parse(JSON.stringify(prev)));
      save(next);
      return next;
    });
  };

  if (loading) return <Loader />;
  if (!data) return null;

  const isDark = data.theme !== "light";

  const bg = isDark
    ? "linear-gradient(135deg, #0d0014 0%, #0a0a0f 40%, #001a0a 100%)"
    : "linear-gradient(135deg, #f3e8ff 0%, #f0fdf4 100%)";

  const text = isDark ? "#f0f0f0" : "#1a1a2e";
  const sub = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";

  const ctx = { data, update, isDark, text, sub };

  const TABS = [
    { id: "home", icon: "⚡", label: "Home" },
    { id: "fitness", icon: "💪", label: "Fitness" },
    { id: "sleep", icon: "😴", label: "Sonno" },
    { id: "nutrition", icon: "🥗", label: "Nutrizione" },
    { id: "finance", icon: "💰", label: "Finanze" },
    { id: "habits", icon: "🔄", label: "Abitudini" },
    { id: "mind", icon: "🧠", label: "Mente" },
    { id: "profile", icon: "👤", label: "Profilo" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", position: "relative", overflowX: "hidden" }}>
      {/* Orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${VIOLET}22 0%, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${GREEN}22 0%, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "40%", right: "20%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${YELLOW}15 0%, transparent 70%)`, filter: "blur(40px)" }} />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 16px 100px" }}>
        <Header ctx={ctx} />
        {tab === "home" && <HomeTab ctx={ctx} />}
        {tab === "fitness" && <FitnessTab ctx={ctx} />}
        {tab === "sleep" && <SleepTab ctx={ctx} />}
        {tab === "nutrition" && <NutritionTab ctx={ctx} />}
        {tab === "finance" && <FinanceTab ctx={ctx} />}
        {tab === "habits" && <HabitsTab ctx={ctx} />}
        {tab === "mind" && <MindTab ctx={ctx} />}
        {tab === "profile" && <ProfileTab ctx={ctx} />}
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, padding: "8px 8px 20px", background: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(30px)", borderTop: `1px solid rgba(255,255,255,0.1)` }}>
        <div style={{ display: "flex", justifyContent: "space-around", maxWidth: 900, margin: "0 auto" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px", borderRadius: 12, transition: "all 0.2s", opacity: tab === t.id ? 1 : 0.45, transform: tab === t.id ? "scale(1.1)" : "scale(1)" }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 9, color: tab === t.id ? VIOLET : text, fontWeight: tab === t.id ? 700 : 400, letterSpacing: 0.3 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── Loader ──────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0014" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 2s linear infinite" }}>⚡</div>
        <div style={{ color: VIOLET, fontFamily: "system-ui", letterSpacing: 4, fontSize: 12 }}>CARICAMENTO</div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────
function Header({ ctx }) {
  const { data, update, isDark, text } = ctx;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";
  const now = new Date();
  const dateStr = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ padding: "24px 0 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 13, color: VIOLET, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{dateStr}</div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{greeting} 👋</div>
      </div>
      <button onClick={() => update(d => { d.theme = d.theme === "dark" ? "light" : "dark"; return d; })} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 50, width: 40, height: 40, cursor: "pointer", fontSize: 18 }}>
        {isDark ? "☀️" : "🌙"}
      </button>
    </div>
  );
}

// ── Glass Card ───────────────────────────────────────────────────────────────
function Card({ children, style = {}, accent }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", border: `1px solid ${accent || "rgba(255,255,255,0.13)"}`, borderRadius: 20, padding: 20, marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, color }) {
  return <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><span>{icon}</span><span style={{ color: color || "inherit" }}>{title}</span></div>;
}

function PillBtn({ label, onClick, color, small }) {
  return (
    <button onClick={onClick} style={{ background: color || VIOLET, border: "none", borderRadius: 50, padding: small ? "6px 14px" : "10px 20px", color: "#fff", fontWeight: 600, fontSize: small ? 12 : 14, cursor: "pointer", letterSpacing: 0.3 }}>
      {label}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", style = {} }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px", color: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box", ...style }} />
    </div>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px", color: "inherit", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", background: "rgba(30,0,50,0.8)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px", color: "inherit", fontSize: 14, outline: "none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ProgressBar({ value, max, color, label, sublabel }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ opacity: 0.7 }}>{sublabel || `${value} / ${max}`}</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME TAB
// ─────────────────────────────────────────────────────────────────────────────
function HomeTab({ ctx }) {
  const { data, update, text, sub } = ctx;
  const todayStr = today();

  // Streak calc
  const calcStreak = (logs, field) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      const entry = logs[key];
      if (!entry || !entry[field]) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const todayHabits = data.habitLog[todayStr] || {};
  const doneHabits = data.habits.filter(h => todayHabits[h.id]).length;
  const totalHabits = data.habits.length;

  const lastSleep = data.sleep[data.sleep.length - 1];
  const sleepHours = lastSleep ? (() => {
    const [bh, bm] = lastSleep.bedtime.split(":").map(Number);
    const [wh, wm] = lastSleep.wakeup.split(":").map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins < 0) mins += 1440;
    return (mins / 60).toFixed(1);
  })() : null;

  const lastWorkout = data.workouts[data.workouts.length - 1];
  const thisMonthTx = data.transactions.filter(t => t.date.startsWith(todayStr.slice(0, 7)));
  const income = thisMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = thisMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const todayMood = data.mood.find(m => m.date === todayStr);
  const todayRoutine = data.routineLog[todayStr] || { morning: data.routine.morning.map(r => ({ ...r })), evening: data.routine.evening.map(r => ({ ...r })) };

  const toggleRoutine = (period, id) => {
    update(d => {
      if (!d.routineLog[todayStr]) {
        d.routineLog[todayStr] = {
          morning: d.routine.morning.map(r => ({ ...r })),
          evening: d.routine.evening.map(r => ({ ...r })),
        };
      }
      const item = d.routineLog[todayStr][period].find(r => r.id === id);
      if (item) item.done = !item.done;
      return d;
    });
  };

  const morningDone = todayRoutine.morning.filter(r => r.done).length;
  const eveningDone = todayRoutine.evening.filter(r => r.done).length;

  return (
    <div>
      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
        <StatCard icon="😴" label="Sonno" value={sleepHours ? `${sleepHours}h` : "—"} target="/ 7.5h" color={sleepHours >= 7.5 ? GREEN : YELLOW} />
        <StatCard icon="💪" label="Ultimo WO" value={lastWorkout ? fmtDate(lastWorkout.date) : "—"} target={lastWorkout?.type?.split(" ").slice(0, 2).join(" ") || ""} color={VIOLET} />
        <StatCard icon="💰" label="Entrate" value={`€${income.toLocaleString()}`} target={`/ €${data.finances.monthlyTarget.toLocaleString()}`} color={GREEN} />
        <StatCard icon="🔄" label="Abitudini" value={`${doneHabits}/${totalHabits}`} target="oggi" color={CYAN} />
      </div>

      {/* Routine Morning */}
      <Card accent={`1px solid ${YELLOW}44`} style={{ marginTop: 16 }}>
        <SectionTitle icon="🌅" title={`Routine Mattutina (${morningDone}/${data.routine.morning.length})`} color={YELLOW} />
        {todayRoutine.morning.map(item => (
          <RoutineItem key={item.id} item={item} onToggle={() => toggleRoutine("morning", item.id)} color={YELLOW} />
        ))}
      </Card>

      {/* Routine Evening */}
      <Card accent={`1px solid ${VIOLET}44`}>
        <SectionTitle icon="🌙" title={`Routine Serale (${eveningDone}/${data.routine.evening.length})`} color={VIOLET} />
        {todayRoutine.evening.map(item => (
          <RoutineItem key={item.id} item={item} onToggle={() => toggleRoutine("evening", item.id)} color={VIOLET} />
        ))}
      </Card>

      {/* Quick Mood */}
      <Card>
        <SectionTitle icon="😊" title="Come stai oggi?" color={CYAN} />
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {MOODS.map((m, i) => (
            <button key={i} onClick={() => update(d => {
              const idx = d.mood.findIndex(x => x.date === todayStr);
              if (idx >= 0) d.mood[idx].score = i + 1;
              else d.mood.push({ date: todayStr, score: i + 1, notes: "" });
              return d;
            })} style={{ background: todayMood?.score === i + 1 ? "rgba(255,255,255,0.2)" : "transparent", border: `2px solid ${todayMood?.score === i + 1 ? CYAN : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontSize: 24, transition: "all 0.2s", transform: todayMood?.score === i + 1 ? "scale(1.2)" : "scale(1)" }}>
              {m}
            </button>
          ))}
        </div>
        {todayMood && <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, opacity: 0.7 }}>{MOOD_LABELS[todayMood.score - 1]}</div>}
      </Card>

      {/* Trading Goal */}
      <Card accent={`1px solid ${GREEN}44`}>
        <SectionTitle icon="📈" title="Trading Goal" color={GREEN} />
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>{data.trading.goal}</div>
        <div style={{ fontSize: 12, opacity: 0.5 }}>Target: €10.000/mese entro Settembre 2025</div>
        <ProgressBar value={income} max={data.finances.monthlyTarget} color={GREEN} label="Entrate questo mese" sublabel={`€${income.toLocaleString()} / €${data.finances.monthlyTarget.toLocaleString()}`} />
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, target, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${color}33`, borderRadius: 20, padding: 16, marginBottom: 0 }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.5 }}>{target}</div>
    </div>
  );
}

function RoutineItem({ item, onToggle, color }) {
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.done ? color : "rgba(255,255,255,0.2)"}`, background: item.done ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
        {item.done && <span style={{ fontSize: 12, color: "#000" }}>✓</span>}
      </div>
      <span style={{ fontSize: 14, textDecoration: item.done ? "line-through" : "none", opacity: item.done ? 0.5 : 1 }}>{item.label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FITNESS TAB
// ─────────────────────────────────────────────────────────────────────────────
function FitnessTab({ ctx }) {
  const { data, update } = ctx;
  const [view, setView] = useState("log"); // log | history | progress
  const [form, setForm] = useState({ date: today(), type: WORKOUT_TYPES[0], duration: "", notes: "", exercises: [{ name: "", sets: "", reps: "", kg: "" }] });

  const addExercise = () => setForm(f => ({ ...f, exercises: [...f.exercises, { name: "", sets: "", reps: "", kg: "" }] }));
  const updateEx = (i, field, val) => setForm(f => { const ex = [...f.exercises]; ex[i] = { ...ex[i], [field]: val }; return { ...f, exercises: ex }; });
  const removeEx = (i) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));

  const saveWorkout = () => {
    if (!form.type) return;
    update(d => { d.workouts.push({ ...form, id: Date.now() }); return d; });
    setForm({ date: today(), type: WORKOUT_TYPES[0], duration: "", notes: "", exercises: [{ name: "", sets: "", reps: "", kg: "" }] });
    setView("history");
  };

  const sorted = [...data.workouts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <SectionTitle icon="💪" title="Fitness & Allenamenti" color={VIOLET} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["log", "history", "progress"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ background: view === v ? VIOLET : "rgba(255,255,255,0.08)", border: "none", borderRadius: 50, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
            {v === "log" ? "➕ Log" : v === "history" ? "📋 Storico" : "📊 Progressi"}
          </button>
        ))}
      </div>

      {view === "log" && (
        <Card>
          <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <Select label="Tipo Allenamento" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={WORKOUT_TYPES} />
          <Input label="Durata (min)" type="number" value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} />
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, opacity: 0.6, letterSpacing: 0.5, textTransform: "uppercase" }}>Esercizi</div>
          {form.exercises.map((ex, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>Esercizio {i + 1}</span>
                {i > 0 && <button onClick={() => removeEx(i)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>✕</button>}
              </div>
              <Input label="Nome" value={ex.name} onChange={v => updateEx(i, "name", v)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <Input label="Serie" type="number" value={ex.sets} onChange={v => updateEx(i, "sets", v)} />
                <Input label="Rip." type="number" value={ex.reps} onChange={v => updateEx(i, "reps", v)} />
                <Input label="Kg" type="number" value={ex.kg} onChange={v => updateEx(i, "kg", v)} />
              </div>
            </div>
          ))}
          <button onClick={addExercise} style={{ background: "rgba(255,255,255,0.08)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px", width: "100%", color: "inherit", cursor: "pointer", marginBottom: 12, fontSize: 13 }}>+ Aggiungi Esercizio</button>
          <Textarea label="Note" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
          <PillBtn label="Salva Allenamento 💪" onClick={saveWorkout} color={VIOLET} />
        </Card>
      )}

      {view === "history" && (
        <div>
          {sorted.length === 0 && <Card><div style={{ opacity: 0.5, textAlign: "center" }}>Nessun allenamento registrato</div></Card>}
          {sorted.map(w => (
            <Card key={w.id} accent={`1px solid ${VIOLET}33`}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{w.type}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{fmtDate(w.date)}</div>
              </div>
              {w.duration && <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>⏱ {w.duration} min</div>}
              {w.exercises.filter(e => e.name).map((ex, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ flex: 1, fontWeight: 500 }}>{ex.name}</span>
                  <span style={{ opacity: 0.6 }}>{ex.sets}x{ex.reps}</span>
                  {ex.kg && <span style={{ color: VIOLET, fontWeight: 600 }}>{ex.kg}kg</span>}
                </div>
              ))}
              {w.notes && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>{w.notes}</div>}
            </Card>
          ))}
        </div>
      )}

      {view === "progress" && <FitnessProgress data={data} />}
    </div>
  );
}

function FitnessProgress({ data }) {
  const byType = {};
  data.workouts.forEach(w => { byType[w.type] = (byType[w.type] || 0) + 1; });
  const thisMonth = data.workouts.filter(w => w.date.startsWith(today().slice(0, 7))).length;

  return (
    <div>
      <Card>
        <SectionTitle icon="📊" title="Questo Mese" color={VIOLET} />
        <div style={{ fontSize: 40, fontWeight: 800, color: VIOLET }}>{thisMonth}</div>
        <div style={{ opacity: 0.6, fontSize: 14 }}>allenamenti</div>
      </Card>
      <Card>
        <SectionTitle icon="🏆" title="Per Tipo" color={YELLOW} />
        {Object.entries(byType).map(([type, count]) => (
          <ProgressBar key={type} label={type} value={count} max={Math.max(...Object.values(byType))} color={VIOLET} sublabel={`${count} sessioni`} />
        ))}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLEEP TAB
// ─────────────────────────────────────────────────────────────────────────────
function SleepTab({ ctx }) {
  const { data, update } = ctx;
  const [form, setForm] = useState({ date: today(), bedtime: "23:00", wakeup: "06:30", quality: 3, notes: "" });

  const calcHours = (bed, wake) => {
    const [bh, bm] = bed.split(":").map(Number);
    const [wh, wm] = wake.split(":").map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins < 0) mins += 1440;
    return (mins / 60).toFixed(1);
  };

  const saveSleep = () => {
    update(d => {
      const idx = d.sleep.findIndex(s => s.date === form.date);
      if (idx >= 0) d.sleep[idx] = { ...form };
      else d.sleep.push({ ...form });
      return d;
    });
  };

  const sorted = [...data.sleep].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const avgHours = sorted.length ? (sorted.reduce((s, sl) => s + parseFloat(calcHours(sl.bedtime, sl.wakeup)), 0) / sorted.length).toFixed(1) : null;

  return (
    <div>
      <SectionTitle icon="😴" title="Sonno" color={CYAN} />

      {avgHours && (
        <Card>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: parseFloat(avgHours) >= 7.5 ? GREEN : YELLOW }}>{avgHours}h</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Media 14gg</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: CYAN }}>7.5h</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Obiettivo</div>
            </div>
          </div>
          <ProgressBar value={parseFloat(avgHours)} max={9} color={parseFloat(avgHours) >= 7.5 ? GREEN : YELLOW} label="Media sonno" sublabel={`${avgHours}h / 7.5h obiettivo`} />
        </Card>
      )}

      <Card>
        <SectionTitle icon="📝" title="Registra Sonno" color={CYAN} />
        <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Input label="Ora a letto" type="time" value={form.bedtime} onChange={v => setForm(f => ({ ...f, bedtime: v }))} />
          <Input label="Sveglia" type="time" value={form.wakeup} onChange={v => setForm(f => ({ ...f, wakeup: v }))} />
        </div>
        <div style={{ textAlign: "center", fontSize: 28, fontWeight: 700, color: CYAN, margin: "8px 0" }}>
          {calcHours(form.bedtime, form.wakeup)}h
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, opacity: 0.6, letterSpacing: 0.5, textTransform: "uppercase" }}>Qualità</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(q => (
              <button key={q} onClick={() => setForm(f => ({ ...f, quality: q }))} style={{ flex: 1, padding: "8px 0", background: form.quality === q ? CYAN : "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all 0.2s" }}>{q}</button>
            ))}
          </div>
        </div>
        <Textarea label="Note" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
        <PillBtn label="Salva Sonno 😴" onClick={saveSleep} color={CYAN} />
      </Card>

      <Card>
        <SectionTitle icon="📋" title="Storico" color={CYAN} />
        {sorted.map(sl => (
          <div key={sl.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtDate(sl.date)}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>{sl.bedtime} → {sl.wakeup}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, color: parseFloat(calcHours(sl.bedtime, sl.wakeup)) >= 7.5 ? GREEN : YELLOW }}>{calcHours(sl.bedtime, sl.wakeup)}h</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>{"⭐".repeat(sl.quality)}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITION TAB
// ─────────────────────────────────────────────────────────────────────────────
function NutritionTab({ ctx }) {
  const { data, update } = ctx;
  const [view, setView] = useState("today");
  const [form, setForm] = useState({ date: today(), calories: "", protein: "", carbs: "", fats: "", notes: "" });

  const saveLog = () => {
    update(d => {
      const idx = d.nutritionLog.findIndex(n => n.date === form.date);
      if (idx >= 0) d.nutritionLog[idx] = { ...form };
      else d.nutritionLog.push({ ...form });
      return d;
    });
  };

  const todayLog = data.nutritionLog.find(n => n.date === today());
  const targets = data.nutrition;

  return (
    <div>
      <SectionTitle icon="🥗" title="Nutrizione" color={GREEN} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["today", "log", "targets"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ background: view === v ? GREEN : "rgba(255,255,255,0.08)", border: "none", borderRadius: 50, padding: "8px 16px", color: view === v ? "#000" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {v === "today" ? "📊 Oggi" : v === "log" ? "📝 Log" : "🎯 Target"}
          </button>
        ))}
      </div>

      {view === "today" && (
        <div>
          <Card>
            <SectionTitle icon="🔥" title="Oggi" color={GREEN} />
            {todayLog ? (
              <>
                <ProgressBar value={todayLog.calories || 0} max={targets.calories} color={GREEN} label="Calorie" sublabel={`${todayLog.calories || 0} / ${targets.calories} kcal`} />
                <ProgressBar value={todayLog.protein || 0} max={targets.protein} color={VIOLET} label="Proteine" sublabel={`${todayLog.protein || 0}g / ${targets.protein}g`} />
                <ProgressBar value={todayLog.carbs || 0} max={targets.carbs} color={YELLOW} label="Carboidrati" sublabel={`${todayLog.carbs || 0}g / ${targets.carbs}g`} />
                <ProgressBar value={todayLog.fats || 0} max={targets.fats} color={CYAN} label="Grassi" sublabel={`${todayLog.fats || 0}g / ${targets.fats}g`} />
              </>
            ) : <div style={{ opacity: 0.5, textAlign: "center", fontSize: 14 }}>Nessun dato per oggi — vai su Log</div>}
          </Card>
        </div>
      )}

      {view === "log" && (
        <Card>
          <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <Input label="Calorie (kcal)" type="number" value={form.calories} onChange={v => setForm(f => ({ ...f, calories: v }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <Input label="Proteine (g)" type="number" value={form.protein} onChange={v => setForm(f => ({ ...f, protein: v }))} />
            <Input label="Carbo (g)" type="number" value={form.carbs} onChange={v => setForm(f => ({ ...f, carbs: v }))} />
            <Input label="Grassi (g)" type="number" value={form.fats} onChange={v => setForm(f => ({ ...f, fats: v }))} />
          </div>
          <Textarea label="Note / Pasti" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
          <PillBtn label="Salva 🥗" onClick={saveLog} color={GREEN} />
        </Card>
      )}

      {view === "targets" && (
        <Card>
          <SectionTitle icon="🎯" title="Target Nutrizionali" color={GREEN} />
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>Impostati dal nutrizionista</div>
          <Input label="Calorie target (kcal)" type="number" value={targets.calories} onChange={v => update(d => { d.nutrition.calories = parseInt(v) || 0; return d; })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <Input label="Proteine (g)" type="number" value={targets.protein} onChange={v => update(d => { d.nutrition.protein = parseInt(v) || 0; return d; })} />
            <Input label="Carbo (g)" type="number" value={targets.carbs} onChange={v => update(d => { d.nutrition.carbs = parseInt(v) || 0; return d; })} />
            <Input label="Grassi (g)" type="number" value={targets.fats} onChange={v => update(d => { d.nutrition.fats = parseInt(v) || 0; return d; })} />
          </div>
          <div style={{ padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12, fontSize: 13, opacity: 0.7 }}>
            💡 Aggiorna questi valori dopo ogni visita dal nutrizionista
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE TAB
// ─────────────────────────────────────────────────────────────────────────────
function FinanceTab({ ctx }) {
  const { data, update } = ctx;
  const [view, setView] = useState("overview");
  const [form, setForm] = useState({ date: today(), type: "expense", category: CATS_OUT[0], amount: "", note: "", recurring: false });

  const thisMonth = today().slice(0, 7);
  const monthTx = data.transactions.filter(t => t.date.startsWith(thisMonth));
  const income = monthTx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;
  const recurring = data.transactions.filter(t => t.recurring);

  const saveTx = () => {
    if (!form.amount) return;
    update(d => { d.transactions.push({ ...form, id: Date.now(), amount: parseFloat(form.amount) }); return d; });
    setForm({ date: today(), type: "expense", category: CATS_OUT[0], amount: "", note: "", recurring: false });
  };

  const deleteTx = (id) => update(d => { d.transactions = d.transactions.filter(t => t.id !== id); return d; });

  const expByCategory = {};
  monthTx.filter(t => t.type === "expense").forEach(t => { expByCategory[t.category] = (expByCategory[t.category] || 0) + Number(t.amount); });

  return (
    <div>
      <SectionTitle icon="💰" title="Finanze" color={YELLOW} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["overview", "add", "history", "recurring"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ background: view === v ? YELLOW : "rgba(255,255,255,0.08)", border: "none", borderRadius: 50, padding: "8px 14px", color: view === v ? "#000" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {v === "overview" ? "📊 Panoramica" : v === "add" ? "➕ Aggiungi" : v === "history" ? "📋 Storico" : "🔁 Ricorrenti"}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <MiniStatCard label="Entrate" value={`€${income.toLocaleString()}`} color={GREEN} />
            <MiniStatCard label="Uscite" value={`€${expenses.toLocaleString()}`} color="#f87171" />
            <MiniStatCard label="Saldo" value={`€${balance.toLocaleString()}`} color={balance >= 0 ? GREEN : "#f87171"} />
          </div>
          <Card>
            <ProgressBar value={income} max={data.finances.monthlyTarget} color={GREEN} label="Progresso verso €10k" sublabel={`€${income.toLocaleString()} / €${data.finances.monthlyTarget.toLocaleString()}`} />
          </Card>
          {Object.keys(expByCategory).length > 0 && (
            <Card>
              <SectionTitle icon="📊" title="Uscite per Categoria" color={YELLOW} />
              {Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <ProgressBar key={cat} label={cat} value={amt} max={expenses} color={YELLOW} sublabel={`€${amt.toLocaleString()}`} />
              ))}
            </Card>
          )}
        </div>
      )}

      {view === "add" && (
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setForm(f => ({ ...f, type: "expense", category: CATS_OUT[0] }))} style={{ flex: 1, padding: "10px", background: form.type === "expense" ? "#f87171" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 600 }}>💸 Uscita</button>
            <button onClick={() => setForm(f => ({ ...f, type: "income", category: CATS_IN[0] }))} style={{ flex: 1, padding: "10px", background: form.type === "income" ? GREEN : "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 600 }}>💰 Entrata</button>
          </div>
          <Input label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <Select label="Categoria" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={form.type === "expense" ? CATS_OUT : CATS_IN} />
          <Input label="Importo (€)" type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} />
          <Input label="Nota" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} />
          <div onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.recurring ? YELLOW : "rgba(255,255,255,0.2)"}`, background: form.recurring ? YELLOW : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {form.recurring && <span style={{ fontSize: 12, color: "#000" }}>✓</span>}
            </div>
            <span style={{ fontSize: 14 }}>Spesa/Entrata ricorrente</span>
          </div>
          <PillBtn label="Salva 💰" onClick={saveTx} color={YELLOW} />
        </Card>
      )}

      {view === "history" && (
        <div>
          {[...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 14, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.category} {t.recurring ? "🔁" : ""}</div>
                <div style={{ fontSize: 12, opacity: 0.5 }}>{fmtDate(t.date)} {t.note && `· ${t.note}`}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 700, color: t.type === "income" ? GREEN : "#f87171" }}>
                  {t.type === "income" ? "+" : "-"}€{Number(t.amount).toLocaleString()}
                </span>
                <button onClick={() => deleteTx(t.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "recurring" && (
        <div>
          <Card>
            <SectionTitle icon="🔁" title="Transazioni Ricorrenti" color={YELLOW} />
            {recurring.length === 0 && <div style={{ opacity: 0.5, fontSize: 14 }}>Nessuna transazione ricorrente</div>}
            {recurring.map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.category}</div>
                  <div style={{ fontSize: 12, opacity: 0.5 }}>{t.note}</div>
                </div>
                <span style={{ fontWeight: 700, color: t.type === "income" ? GREEN : "#f87171" }}>
                  {t.type === "income" ? "+" : "-"}€{Number(t.amount).toLocaleString()}
                </span>
              </div>
            ))}
            {recurring.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Totale ricorrente mensile: <span style={{ color: GREEN }}>+€{recurring.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0).toLocaleString()}</span> / <span style={{ color: "#f87171" }}>-€{recurring.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function MiniStatCard({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HABITS TAB
// ─────────────────────────────────────────────────────────────────────────────
function HabitsTab({ ctx }) {
  const { data, update } = ctx;
  const todayStr = today();
  const todayHabits = data.habitLog[todayStr] || {};

  const toggle = (id) => {
    update(d => {
      if (!d.habitLog[todayStr]) d.habitLog[todayStr] = {};
      d.habitLog[todayStr][id] = !d.habitLog[todayStr][id];
      return d;
    });
  };

  const getStreak = (id) => {
    let streak = 0;
    const d = new Date();
    while (streak < 365) {
      const key = d.toISOString().slice(0, 10);
      if (!data.habitLog[key]?.[id]) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div>
      <SectionTitle icon="🔄" title="Abitudini" color={VIOLET} />

      <Card>
        <SectionTitle icon="📅" title="Oggi" color={VIOLET} />
        {data.habits.map(h => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={() => toggle(h.id)} style={{ width: 32, height: 32, borderRadius: 10, border: `2px solid ${todayHabits[h.id] ? h.color : "rgba(255,255,255,0.2)"}`, background: todayHabits[h.id] ? h.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, transition: "all 0.2s", flexShrink: 0 }}>
              {todayHabits[h.id] ? "✓" : ""}
            </button>
            <span style={{ fontSize: 20 }}>{h.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{h.name}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>🔥 {getStreak(h.id)} giorni streak</div>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle icon="📊" title="Ultimi 7 giorni" color={CYAN} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px 8px", opacity: 0.5 }}>Abitudine</th>
                {last7.map(d => <th key={d} style={{ padding: "4px 6px", opacity: 0.5, fontSize: 10 }}>{fmtDate(d).split(" ")[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.habits.map(h => (
                <tr key={h.id}>
                  <td style={{ padding: "6px 8px", fontWeight: 500 }}>{h.icon} {h.name}</td>
                  {last7.map(d => (
                    <td key={d} style={{ padding: "6px", textAlign: "center" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: data.habitLog[d]?.[h.id] ? h.color : "rgba(255,255,255,0.08)", margin: "0 auto" }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MIND TAB
// ─────────────────────────────────────────────────────────────────────────────
function MindTab({ ctx }) {
  const { data, update } = ctx;
  const [view, setView] = useState("journal");
  const [entry, setEntry] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const todayStr = today();
  const todayMood = data.mood.find(m => m.date === todayStr);
  const todayJournal = data.journal.find(j => j.date === todayStr);

  const saveJournal = () => {
    if (!entry.trim()) return;
    update(d => {
      const idx = d.journal.findIndex(j => j.date === todayStr);
      if (idx >= 0) d.journal[idx].text = entry;
      else d.journal.push({ date: todayStr, text: entry, mood: todayMood?.score });
      return d;
    });
    setEntry("");
  };

  const saveMoodNote = () => {
    update(d => {
      const idx = d.mood.findIndex(m => m.date === todayStr);
      if (idx >= 0) d.mood[idx].notes = moodNote;
      else d.mood.push({ date: todayStr, score: 3, notes: moodNote });
      return d;
    });
    setMoodNote("");
  };

  return (
    <div>
      <SectionTitle icon="🧠" title="Mente & Benessere" color={CYAN} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["journal", "mood", "meditation"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ background: view === v ? CYAN : "rgba(255,255,255,0.08)", border: "none", borderRadius: 50, padding: "8px 14px", color: view === v ? "#000" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {v === "journal" ? "✍️ Journal" : v === "mood" ? "😊 Umore" : "🧘 Meditazione"}
          </button>
        ))}
      </div>

      {view === "journal" && (
        <div>
          <Card>
            <SectionTitle icon="✍️" title="Journal di oggi" color={CYAN} />
            {todayJournal && <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 12, padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12, lineHeight: 1.6 }}>{todayJournal.text}</div>}
            <Textarea label="Scrivi qui..." value={entry} onChange={setEntry} />
            <PillBtn label="Salva ✍️" onClick={saveJournal} color={CYAN} />
          </Card>
          <Card>
            <SectionTitle icon="📚" title="Archivio Journal" color={CYAN} />
            {[...data.journal].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(j => (
              <div key={j.date} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>{fmtDate(j.date)} {j.mood ? MOODS[j.mood - 1] : ""}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>{j.text.length > 120 ? j.text.slice(0, 120) + "..." : j.text}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view === "mood" && (
        <div>
          <Card>
            <SectionTitle icon="😊" title="Umore di oggi" color={YELLOW} />
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
              {MOODS.map((m, i) => (
                <button key={i} onClick={() => update(d => {
                  const idx = d.mood.findIndex(x => x.date === todayStr);
                  if (idx >= 0) d.mood[idx].score = i + 1;
                  else d.mood.push({ date: todayStr, score: i + 1, notes: "" });
                  return d;
                })} style={{ background: todayMood?.score === i + 1 ? "rgba(255,255,255,0.2)" : "transparent", border: `2px solid ${todayMood?.score === i + 1 ? YELLOW : "rgba(255,255,255,0.1)"}`, borderRadius: 14, padding: "10px 14px", cursor: "pointer", fontSize: 28, transition: "all 0.2s", transform: todayMood?.score === i + 1 ? "scale(1.15)" : "scale(1)" }}>
                  {m}
                </button>
              ))}
            </div>
            {todayMood && <div style={{ textAlign: "center", color: YELLOW, fontWeight: 600 }}>{MOOD_LABELS[todayMood.score - 1]}</div>}
            <Textarea label="Note sull'umore" value={moodNote || todayMood?.notes || ""} onChange={setMoodNote} />
            <PillBtn label="Salva 😊" onClick={saveMoodNote} color={YELLOW} />
          </Card>
          <Card>
            <SectionTitle icon="📈" title="Andamento Umore" color={YELLOW} />
            {data.mood.slice(-14).map(m => (
              <div key={m.date} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                <span style={{ fontSize: 11, opacity: 0.5, width: 50 }}>{fmtDate(m.date)}</span>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 99 }}>
                  <div style={{ width: `${m.score * 20}%`, height: "100%", background: YELLOW, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 18 }}>{MOODS[m.score - 1]}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view === "meditation" && <MeditationView data={data} update={update} todayStr={todayStr} />}
    </div>
  );
}

function MeditationView({ data, update, todayStr }) {
  const [mins, setMins] = useState(5);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const interval = useRef(null);

  const total = mins * 60;

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => {
        setElapsed(e => {
          if (e >= total - 1) {
            clearInterval(interval.current);
            setRunning(false);
            update(d => {
              const idx = d.habitLog[todayStr];
              if (!d.habitLog[todayStr]) d.habitLog[todayStr] = {};
              d.habitLog[todayStr]["h4"] = true;
              return d;
            });
            return total;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval.current);
    }
    return () => clearInterval(interval.current);
  }, [running]);

  const pct = total > 0 ? elapsed / total : 0;
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  const remaining = total - elapsed;
  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <Card>
      <SectionTitle icon="🧘" title="Meditazione" color={CYAN} />
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
          {[5, 10, 15, 20].map(m => (
            <button key={m} onClick={() => { setMins(m); setElapsed(0); setRunning(false); }} style={{ background: mins === m ? CYAN : "rgba(255,255,255,0.08)", border: "none", borderRadius: 50, padding: "8px 14px", color: mins === m ? "#000" : "#fff", cursor: "pointer", fontWeight: 600 }}>{m}min</button>
          ))}
        </div>
        <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={90} cy={90} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} />
          <circle cx={90} cy={90} r={r} fill="none" stroke={CYAN} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div style={{ fontSize: 36, fontWeight: 800, marginTop: -130, color: CYAN, position: "relative", zIndex: 1 }}>{mm}:{ss}</div>
        <div style={{ marginTop: 80 }}>
          <button onClick={() => { if (elapsed >= total) { setElapsed(0); setRunning(true); } else setRunning(!running); }} style={{ background: running ? "#f87171" : CYAN, border: "none", borderRadius: 50, padding: "14px 32px", color: running ? "#fff" : "#000", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            {running ? "⏸ Pausa" : elapsed > 0 && elapsed < total ? "▶ Riprendi" : "▶ Inizia"}
          </button>
          {elapsed > 0 && <button onClick={() => { setElapsed(0); setRunning(false); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", marginLeft: 12, fontSize: 14 }}>Reset</button>}
        </div>
        {elapsed === total && <div style={{ marginTop: 16, color: GREEN, fontWeight: 700, fontSize: 16 }}>🎉 Sessione completata!</div>}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────────────────────────
function ProfileTab({ ctx }) {
  const { data, update } = ctx;
  const [view, setView] = useState("stats");
  const [physForm, setPhysForm] = useState({ date: today(), weight: "", bf: "", notes: "" });

  const savePhysical = () => {
    update(d => { d.physicalLog.push({ ...physForm, id: Date.now() }); return d; });
    setPhysForm({ date: today(), weight: "", bf: "", notes: "" });
  };

  const sorted = [...data.physicalLog].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];

  const bmi = (data.profile.weight / ((data.profile.height / 100) ** 2)).toFixed(1);
  const leanMass = (data.profile.weight * (1 - data.profile.bf / 100)).toFixed(1);
  const fatMass = (data.profile.weight * data.profile.bf / 100).toFixed(1);

  return (
    <div>
      <SectionTitle icon="👤" title="Profilo & Parametri" color={VIOLET} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["stats", "log", "history", "settings"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ background: view === v ? VIOLET : "rgba(255,255,255,0.08)", border: "none", borderRadius: 50, padding: "8px 12px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            {v === "stats" ? "📊 Stats" : v === "log" ? "📝 Log" : v === "history" ? "📋 Storico" : "⚙️ Profilo"}
          </button>
        ))}
      </div>

      {view === "stats" && (
        <div>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Peso", value: `${latest?.weight || data.profile.weight} kg`, color: VIOLET },
                { label: "Body Fat", value: `${latest?.bf || data.profile.bf}%`, color: YELLOW },
                { label: "Massa Magra", value: `${leanMass} kg`, color: GREEN },
                { label: "Massa Grassa", value: `${fatMass} kg`, color: "#f87171" },
                { label: "BMI", value: bmi, color: CYAN },
                { label: "Altezza", value: `${data.profile.height} cm`, color: VIOLET },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {view === "log" && (
        <Card>
          <SectionTitle icon="📝" title="Nuova Misurazione" color={VIOLET} />
          <Input label="Data" type="date" value={physForm.date} onChange={v => setPhysForm(f => ({ ...f, date: v }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Input label="Peso (kg)" type="number" value={physForm.weight} onChange={v => setPhysForm(f => ({ ...f, weight: v }))} />
            <Input label="Body Fat (%)" type="number" value={physForm.bf} onChange={v => setPhysForm(f => ({ ...f, bf: v }))} />
          </div>
          <Textarea label="Note (nutrizionista)" value={physForm.notes} onChange={v => setPhysForm(f => ({ ...f, notes: v }))} />
          <PillBtn label="Salva Misurazione 📊" onClick={savePhysical} color={VIOLET} />
        </Card>
      )}

      {view === "history" && (
        <Card>
          <SectionTitle icon="📈" title="Storico Misurazioni" color={VIOLET} />
          {sorted.length === 0 && <div style={{ opacity: 0.5 }}>Nessuna misurazione</div>}
          {sorted.map(m => (
            <div key={m.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{fmtDate(m.date)}</span>
                <div style={{ display: "flex", gap: 16 }}>
                  {m.weight && <span style={{ color: VIOLET, fontWeight: 700 }}>{m.weight}kg</span>}
                  {m.bf && <span style={{ color: YELLOW, fontWeight: 700 }}>{m.bf}%BF</span>}
                </div>
              </div>
              {m.notes && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>{m.notes}</div>}
            </div>
          ))}
        </Card>
      )}

      {view === "settings" && (
        <Card>
          <SectionTitle icon="⚙️" title="Info Profilo" color={VIOLET} />
          <Input label="Nome" value={data.profile.name} onChange={v => update(d => { d.profile.name = v; return d; })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Input label="Altezza (cm)" type="number" value={data.profile.height} onChange={v => update(d => { d.profile.height = parseFloat(v); return d; })} />
            <Input label="Età" type="number" value={data.profile.age} onChange={v => update(d => { d.profile.age = parseInt(v); return d; })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Input label="Peso base (kg)" type="number" value={data.profile.weight} onChange={v => update(d => { d.profile.weight = parseFloat(v); return d; })} />
            <Input label="BF% base" type="number" value={data.profile.bf} onChange={v => update(d => { d.profile.bf = parseFloat(v); return d; })} />
          </div>
          <Input label="Target mensile (€)" type="number" value={data.finances.monthlyTarget} onChange={v => update(d => { d.finances.monthlyTarget = parseInt(v); return d; })} />
          <div style={{ padding: 12, background: "rgba(168,85,247,0.1)", borderRadius: 12, fontSize: 13, color: VIOLET, fontWeight: 500, marginTop: 8 }}>
            💡 I dati vengono salvati automaticamente nel tuo browser
          </div>
        </Card>
      )}
    </div>
  );
}
