import { IonBackButton, IonButtons, IonContent, IonPage } from "@ionic/react";

const members = [{ name: "你", seat: "4-2" }, { name: "林小雨", seat: "4-1" }, { name: "陳宇軒", seat: "3-2" }, { name: "王思涵", seat: "3-1" }];

export default function LotteryPage() {
  return <IonPage><IonContent fullscreen scrollY={false} className="lottery-stage-content"><main className="lottery-stage-shell lottery-result-screen"><div className="lottery-stage-layout">
    <IonButtons className="lottery-result-back"><IonBackButton defaultHref="/" text="返回" /></IonButtons>
    <header className="lottery-stage-header"><p>NCUIM 2026 FRESHER MIXER · DEMO</p><h1>你的抽籤結果</h1></header>
    <section style={{ padding: 14, border: "1px solid #34d399", borderRadius: 18, background: "linear-gradient(135deg,#0d483e,#16355b)", textAlign: "center" }}><span>已同步 · 第 8 組</span><strong style={{ display: "block", margin: "4px 0", fontSize: 36 }}>313 研究室</strong><div>你的座位 <b style={{ fontSize: 24, color: "#fbbf24" }}>4-2</b></div></section>
    <section style={{ marginTop: 10, padding: 10, border: "1px solid #334155", borderRadius: 14, background: "#111827" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><strong>313 研究室座位圖</strong><span>大門 →</span></div><div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 4 }}>{Array.from({ length: 23 }, (_, index) => { const seat = `${Math.floor(index / 6) + 1}-${(index % 6) + 1}`; const member = members.find((item) => item.seat === seat); const mine = seat === "4-2"; return <div key={seat} style={{ minHeight: 34, padding: 2, border: `${mine ? 2 : 1}px solid ${mine ? "#fbbf24" : member ? "#60a5fa" : "#334155"}`, borderRadius: 4, background: mine ? "#78350f" : member ? "#172554" : "#0f172a", textAlign: "center", fontSize: 9 }}><div>{seat}</div><b style={{ color: mine ? "#fef3c7" : "#cbd5e1" }}>{member?.name}</b></div>; })}</div></section>
    <section style={{ marginTop: 10 }}><h2 style={{ margin: "0 0 5px", fontSize: 15 }}>你的同組成員</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>{members.map((member) => <div key={member.seat} style={{ display: "flex", justifyContent: "space-between", padding: 7, border: "1px solid #334155", borderRadius: 6, color: member.name === "你" ? "#fbbf24" : "inherit" }}><b>{member.name}</b><span>{member.seat}</span></div>)}</div></section>
    <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 11, textAlign: "center" }}>Demo 資料 · 正式活動將依報到身分同步結果。</p>
  </div></main></IonContent></IonPage>;
}
