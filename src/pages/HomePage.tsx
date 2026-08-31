import { useState, useRef, useEffect, useCallback } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
  IonBadge,
  IonModal,
  IonButtons,
  IonButton,
  useIonAlert,
} from "@ionic/react";
import {
  map,
  calendar,
  restaurant,
  calculator,
  sparkles,
  megaphoneOutline,
  chevronForwardOutline,
} from "ionicons/icons";

interface ModuleCard {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly route: string;
  readonly color: string;
  readonly badge?: string;
  readonly disabled?: boolean;
  readonly hidden?: boolean;
}

const modules: readonly ModuleCard[] = [
  {
    title: "全系課表",
    subtitle: "課表與教室時段查詢",
    icon: calendar,
    route: "/timetable",
    color: "var(--ncu-primary)",
  },
  {
    title: "學分試算",
    subtitle: "畢業學分與門檻檢核",
    icon: calculator,
    route: "/tools/credit",
    color: "var(--ncu-success)",
  },
  {
    title: "研究室座位表",
    subtitle: "研究室座位與格局圖",
    icon: map,
    route: "/seats",
    color: "var(--ncu-muted)",
    badge: "即將開放",
    disabled: true,
  },
  {
    title: "抽籤大會",
    subtitle: "大螢幕開獎 · 蛇形相鄰分配",
    icon: sparkles,
    route: "/stage/lottery",
    color: "var(--ncu-star)",
    badge: "舞台",
    hidden: true,
  },
  {
    title: "中大美食地圖",
    subtitle: "後門 · 宵夜街 · 前門 · 校內",
    icon: restaurant,
    route: "/food",
    color: "var(--ncu-danger)",
    hidden: true,
  },
];

const NcuimLogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true">
    <defs>
      <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2b4c7e" />
        <stop offset="100%" stopColor="#0f1b2e" />
      </linearGradient>
      <linearGradient id="logoTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#dce7f5" />
      </linearGradient>
      <linearGradient id="logoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="28" fill="url(#logoBgGrad)" />
    <rect x="2" y="2" width="124" height="124" rx="26" fill="none" stroke="#476f9d" strokeWidth="2" strokeOpacity="0.4" />
    <circle cx="64" cy="24" r="5" fill="#38bdf8" />
    <line x1="64" y1="29" x2="64" y2="40" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
    <text x="64" y="48" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="13" fontWeight="800" fill="#93c5fd" letterSpacing="3">NCU</text>
    <text x="64" y="96" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="46" fontWeight="900" fill="url(#logoTextGrad)" letterSpacing="-1">IM</text>
    <rect x="36" y="106" width="56" height="4" rx="2" fill="url(#logoAccentGrad)" />
  </svg>
);

const STAGE_HINTS = [
  "",
  "⚡ 訊號探測中 (1/5)",
  "🔓 核心解碼中 (2/5)",
  "🔥 防火牆破譯 (3/5)",
  "🚨 系統即將超載 (4/5)",
  "🚩 CTF 傳送門開啟！",
];

const getLogoStyle = (stage: number): React.CSSProperties => {
  const base: React.CSSProperties = {
    width: 72,
    height: 72,
    marginBottom: 8,
    borderRadius: "20px",
    border: "2.5px solid var(--ncu-ink)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1b2a4a",
    cursor: "pointer",
    userSelect: "none",
    padding: 0,
    transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
    willChange: "transform, box-shadow",
    backfaceVisibility: "hidden",
  };

  switch (stage) {
    case 1:
      return {
        ...base,
        transform: "translate3d(0, -2px, 0) scale(1.06)",
        boxShadow: "0 0 16px rgba(56, 189, 248, 0.8), var(--ncu-shadow-hard)",
      };
    case 2:
      return {
        ...base,
        transform: "scale(1.12) rotate(10deg)",
        boxShadow: "0 0 22px rgba(168, 85, 247, 0.85), var(--ncu-shadow-hard)",
      };
    case 3:
      return {
        ...base,
        transform: "scale(1.18) rotate(-12deg)",
        boxShadow: "0 0 28px rgba(249, 115, 22, 0.9), var(--ncu-shadow-hard)",
      };
    case 4:
      return {
        ...base,
        transform: "scale(1.24) rotate(180deg)",
        boxShadow: "0 0 36px rgba(239, 68, 68, 0.95), var(--ncu-shadow-hard)",
      };
    case 5:
      return {
        ...base,
        transform: "scale(1.32) rotate(360deg)",
        boxShadow: "0 0 45px #10b981, 0 0 24px #38bdf8, var(--ncu-shadow-hard)",
      };
    default:
      return {
        ...base,
        boxShadow: "var(--ncu-shadow-hard)",
        transform: "none",
      };
  }
};

interface ParticleData {
  stage: number;
  text: string;
  side: "left" | "right";
  sideOffset: number;
  offsetY: number;
  scale: number;
  rotate: number;
  key: number;
}

const HeroHeader = ({
  stage,
  particle,
  onLogoClick,
}: Readonly<{
  stage: number;
  particle: ParticleData | null;
  onLogoClick: () => void;
}>) => (
  <div
    style={{
      textAlign: "center",
      padding: "var(--ncu-space-3) 0 var(--ncu-space-2)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <style>{`
      @keyframes cyberGlowParticleLeft {
        0% {
          opacity: 0;
          transform: translate3d(0, 8px, 0) scale(0.92);
          filter: blur(0px);
        }
        15% {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0px);
        }
        45% {
          opacity: 0.95;
          transform: translate3d(0, -8px, 0) scale(0.94);
          filter: blur(0px);
        }
        75% {
          opacity: 0.5;
          transform: translate3d(0, -20px, 0) scale(0.78);
          filter: blur(3px);
        }
        100% {
          opacity: 0;
          transform: translate3d(0, -32px, 0) scale(0.6);
          filter: blur(6px);
        }
      }
      @keyframes cyberGlowParticleRight {
        0% {
          opacity: 0;
          transform: translate3d(0, 8px, 0) scale(0.92);
          filter: blur(0px);
        }
        15% {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0px);
        }
        45% {
          opacity: 0.95;
          transform: translate3d(0, -8px, 0) scale(0.94);
          filter: blur(0px);
        }
        75% {
          opacity: 0.5;
          transform: translate3d(0, -20px, 0) scale(0.78);
          filter: blur(3px);
        }
        100% {
          opacity: 0;
          transform: translate3d(0, -32px, 0) scale(0.6);
          filter: blur(6px);
        }
      }
    `}</style>
    <div style={{ position: "relative", display: "inline-flex", marginBottom: 14 }}>
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="NCUIM Logo"
        style={getLogoStyle(stage)}
        title="NCUIM"
      >
        <NcuimLogoIcon />
      </button>

      {particle && particle.stage > 0 && (
        <div
          key={particle.key}
          style={{
            position: "absolute",
            top: `calc(50% + ${particle.offsetY}px)`,
            left: particle.side === "right" ? `calc(100% + ${particle.sideOffset}px)` : "auto",
            right: particle.side === "left" ? `calc(100% + ${particle.sideOffset}px)` : "auto",
            whiteSpace: "nowrap",
            fontSize: `${11.5 * particle.scale}px`,
            fontWeight: 900,
            letterSpacing: 0.5,
            color: particle.stage >= 4 ? "#ff4d4f" : "#38bdf8",
            background: particle.stage >= 4 ? "rgba(15, 23, 42, 0.94)" : "rgba(15, 23, 42, 0.9)",
            border: `1.5px solid ${particle.stage >= 4 ? "#ef4444" : "#38bdf8"}`,
            padding: "3px 12px",
            borderRadius: 20,
            boxShadow: particle.stage >= 4
              ? "0 0 16px rgba(239, 68, 68, 0.5)"
              : "0 0 14px rgba(56, 189, 248, 0.5)",
            animation: particle.side === "left"
              ? "cyberGlowParticleLeft 1.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
              : "cyberGlowParticleRight 1.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
            willChange: "transform, opacity, filter",
            backfaceVisibility: "hidden",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {particle.text}
        </div>
      )}
    </div>

    <h1
      style={{
        fontSize: "var(--ncu-font-size-3xl)",
        fontWeight: "var(--ncu-font-weight-bold)",
        margin: 0,
        lineHeight: 1.2,
        color: "var(--ncu-ink)",
      }}
    >
      歡迎加入資管所
    </h1>
    <p
      style={{
        fontSize: "var(--ncu-font-size-base)",
        color: "var(--ncu-muted)",
        margin: "var(--ncu-space-1) 0 0",
      }}
    >
      CIM-Life 中央資管通
    </p>
  </div>
);

const CardIcon = ({ color, icon }: Readonly<{ color: string; icon: string }>) => (
  <div
    style={{
      width: 48,
      height: 48,
      borderRadius: "var(--ncu-radius-md)",
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <IonIcon icon={icon} style={{ fontSize: 24, color: "#fff" }} />
  </div>
);

const CardTitleRow = ({
  title,
  badge,
  subtitle,
  disabled,
}: Readonly<{
  title: string;
  badge?: string;
  subtitle: string;
  disabled?: boolean;
}>) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: "var(--ncu-space-2)" }}>
      <IonCardTitle
        style={{
          fontSize: "var(--ncu-font-size-lg)",
          margin: 0,
          color: disabled ? "var(--ncu-muted)" : "var(--ncu-ink)",
        }}
      >
        {title}
      </IonCardTitle>
      {badge && (
        <IonBadge
          color={disabled ? "medium" : "primary"}
          style={{ fontSize: "var(--ncu-font-size-xs)" }}
        >
          {badge}
        </IonBadge>
      )}
    </div>
    <IonCardSubtitle
      style={{
        fontSize: "var(--ncu-font-size-sm)",
        marginTop: "var(--ncu-space-1)",
        color: "var(--ncu-muted)",
      }}
    >
      {subtitle}
    </IonCardSubtitle>
  </div>
);

const ModuleCardItem = ({
  mod,
  isHovered,
  onHover,
  onLeave,
}: Readonly<{
  mod: ModuleCard;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}>) => {
  if (mod.disabled) {
    return (
      <IonCard
        style={{
          margin: 0,
          border: "1.5px solid var(--ncu-border)",
          boxShadow: "none",
          opacity: 0.65,
          cursor: "not-allowed",
          background: "var(--ncu-surface)",
        }}
      >
        <IonCardHeader>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ncu-space-3)" }}>
            <CardIcon color={mod.color} icon={mod.icon} />
            <CardTitleRow
              title={mod.title}
              badge={mod.badge}
              subtitle={mod.subtitle}
              disabled
            />
          </div>
        </IonCardHeader>
      </IonCard>
    );
  }

  return (
    <IonCard
      routerLink={mod.route}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        margin: 0,
        border: "2px solid var(--ncu-ink)",
        boxShadow: isHovered ? "6px 6px 0 var(--ncu-ink)" : "var(--ncu-shadow-hard)",
        transform: isHovered ? "translateY(-3px)" : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: "pointer",
      }}
      button
    >
      <IonCardHeader>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ncu-space-3)" }}>
          <CardIcon color={mod.color} icon={mod.icon} />
          <CardTitleRow title={mod.title} badge={mod.badge} subtitle={mod.subtitle} />
        </div>
      </IonCardHeader>
    </IonCard>
  );
};

const HomeHeader = () => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>CIM-Life</IonTitle>
    </IonToolbar>
  </IonHeader>
);

const HomeModuleList = ({
  hovered,
  onHover,
  onLeave,
}: Readonly<{
  hovered: string | null;
  onHover: (route: string) => void;
  onLeave: () => void;
}>) => {
  const visibleModules = modules.filter((m) => !m.hidden);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ncu-space-2)" }}>
      {visibleModules.map((mod) => (
        <ModuleCardItem
          key={mod.route}
          mod={mod}
          isHovered={hovered === mod.route}
          onHover={() => onHover(mod.route)}
          onLeave={onLeave}
        />
      ))}
    </div>
  );
};

interface AnnouncementItem {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly role: string;
  readonly date: string;
  readonly content: string;
  readonly badge?: string;
}

const announcements: readonly AnnouncementItem[] = [
  {
    id: "rep-welcome-2026",
    title: "所代阿駿對新生們的期盼",
    author: "阿駿",
    role: "資管所所代",
    date: "2026/09",
    badge: "所代的話",
    content:
      "歡迎各位加入中央資管大家庭！研究所這兩年不僅是專業知識與研究能力的深化，更是探索熱情、結識一生摯友與夥伴的寶貴旅程。期許大家勇於發問、主動跨出舒適圈，在遇到學業與研究挑戰時彼此扶持、共同成長。願大家在中央資管發光發熱，收穫最充實而難忘的碩士生涯！",
  },
];

const AnnouncementBar = ({ onOpen }: Readonly<{ onOpen: () => void }>) => {
  const latest = announcements[0];
  if (!latest) return null;

  return (
    <div
      onClick={onOpen}
      style={{
        margin: "0 0 16px",
        padding: "10px 14px",
        background: "var(--ncu-surface)",
        border: "1.5px solid var(--ncu-ink)",
        borderRadius: "var(--ncu-radius-md)",
        boxShadow: "var(--ncu-shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "6px",
            background: "rgba(27, 42, 74, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IonIcon
            icon={megaphoneOutline}
            style={{ fontSize: 14, color: "var(--ncu-primary)" }}
          />
        </div>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--ncu-ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {latest.title}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          color: "var(--ncu-muted)",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        <span>{announcements.length > 1 ? `共 ${announcements.length} 則` : "詳情"}</span>
        <IonIcon icon={chevronForwardOutline} style={{ fontSize: 14 }} />
      </div>
    </div>
  );
};

const AnnouncementModal = ({
  isOpen,
  onDismiss,
}: Readonly<{
  isOpen: boolean;
  onDismiss: () => void;
}>) => (
  <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
    <IonHeader>
      <IonToolbar>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 12 }}>
          <IonIcon icon={megaphoneOutline} style={{ fontSize: 18, color: "var(--ncu-primary)" }} />
          <IonTitle style={{ padding: 0 }}>最新公告與消息</IonTitle>
        </div>
        <IonButtons slot="end">
          <IonButton onClick={onDismiss}>關閉</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {announcements.map((item) => (
          <IonCard
            key={item.id}
            style={{
              margin: "0 0 16px",
              border: "2px solid var(--ncu-ink)",
              borderRadius: "var(--ncu-radius-md)",
              boxShadow: "var(--ncu-shadow-hard)",
              background: "var(--ncu-surface)",
            }}
          >
            <IonCardHeader style={{ padding: "16px 16px 10px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IonIcon
                    icon={megaphoneOutline}
                    style={{ fontSize: 17, color: "var(--ncu-primary)", flexShrink: 0 }}
                  />
                  <IonCardTitle style={{ fontSize: 16, fontWeight: 800, color: "var(--ncu-ink)" }}>
                    {item.title}
                  </IonCardTitle>
                </div>
                <span style={{ fontSize: 12, color: "var(--ncu-muted)" }}>{item.date}</span>
              </div>
            </IonCardHeader>
            <IonCardContent
              style={{
                padding: "0 16px 16px",
                fontSize: 14,
                color: "var(--ncu-ink)",
                lineHeight: 1.7,
              }}
            >
              <p style={{ margin: "0 0 12px", whiteSpace: "pre-line" }}>{item.content}</p>
              <div
                style={{
                  textAlign: "right",
                  fontSize: 13,
                  color: "var(--ncu-muted)",
                  fontWeight: 700,
                  borderTop: "1px dashed var(--ncu-border)",
                  paddingTop: 8,
                }}
              >
                —— {item.role} · {item.author}
              </div>
            </IonCardContent>
          </IonCard>
        ))}
      </div>
    </IonContent>
  </IonModal>
);

const HomeBody = ({
  stage,
  particle,
  hovered,
  onHover,
  onLeave,
  onLogoClick,
  onOpenAnnouncements,
}: Readonly<{
  stage: number;
  particle: ParticleData | null;
  hovered: string | null;
  onHover: (route: string) => void;
  onLeave: () => void;
  onLogoClick: () => void;
  onOpenAnnouncements: () => void;
}>) => (
  <IonContent className="ion-padding">
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <HeroHeader stage={stage} particle={particle} onLogoClick={onLogoClick} />
      <AnnouncementBar onOpen={onOpenAnnouncements} />
      <HomeModuleList hovered={hovered} onHover={onHover} onLeave={onLeave} />
    </div>
  </IonContent>
);

const CTF_CONFIG = {
  activeUrl: "https://im2026ctf.duckdns.org/",
  scoreboardUrl: "https://im2026ctf.duckdns.org/scoreboard",
  endTime: "2026-09-07T00:00:00+08:00",
};

const isCtfEnded = (): boolean => {
  try {
    return Date.now() > new Date(CTF_CONFIG.endTime).getTime();
  } catch {
    return false;
  }
};

const HomePage = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [easterEggStage, setEasterEggStage] = useState(0);
  const [particle, setParticle] = useState<ParticleData | null>(null);
  const [presentAlert] = useIonAlert();

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // DevTools console easter egg
  useEffect(() => {
    // skipcq: JS-0002
    console.log(
      "%c🚩 NCUIM 2026 CTF Challenge%c\nLooking for flags? Join the secret battlefield:\n👉 https://im2026ctf.duckdns.org/\nScoreboard: https://im2026ctf.duckdns.org/scoreboard",
      "color: #38bdf8; font-size: 16px; font-weight: bold; background: #0f172a; padding: 6px 12px; border-radius: 6px;",
      "color: #a855f7; font-size: 13px; font-family: monospace; font-weight: bold; margin-top: 4px;",
    );
  }, []);

  const triggerEasterEgg = useCallback(() => {
    const ended = isCtfEnded();
    if (ended) {
      presentAlert({
        header: "🏁 2026 CTF 挑戰賽已圓滿結束！",
        subHeader: "NCUIM 2026 CTF 榮譽榜",
        message:
          "恭喜發現隱藏彩蛋！本次新生 CTF 挑戰賽已順利落幕，感謝所有熱情報名與解題的資管所夥伴！",
        buttons: [
          { text: "關閉", role: "cancel" },
          {
            text: "查看最終積分榜 🏆",
            handler: () => {
              window.open(CTF_CONFIG.scoreboardUrl, "_blank", "noopener,noreferrer");
            },
          },
        ],
      });
    } else {
      presentAlert({
        header: "🚩 秘密任務已解鎖！",
        subHeader: "NCUIM 2026 CTF 競技場",
        message:
          "恭喜發現隱藏彩蛋傳送門！自架 CTFd 靶場已上線，具體玩法與競賽規則即將公布，準備好挑戰了嗎？",
        buttons: [
          { text: "稍後再來", role: "cancel" },
          {
            text: "前往 CTFd 戰場 🚀",
            handler: () => {
              window.open(CTF_CONFIG.activeUrl, "_blank", "noopener,noreferrer");
            },
          },
        ],
      });
    }
  }, [presentAlert]);

  const handleSecretTap = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    setEasterEggStage((prev) => {
      const next = prev + 1;
      // 隨機在 Logo 左側或右側外圍，絕不遮擋中央 Logo 圖標
      const side = Math.random() < 0.5 ? "left" : "right";
      const sideOffset = 8 + Math.random() * 16; // 距離 Logo 邊界 8px ~ 24px
      const offsetY = (Math.random() - 0.5) * 20; // 垂直微幅隨機
      const scale = 0.85 + Math.random() * 0.35; // 隨機大小 (0.85x ~ 1.2x)
      const rotate = (Math.random() - 0.5) * 14;

      setParticle({
        stage: next,
        text: STAGE_HINTS[next] || "",
        side,
        sideOffset,
        offsetY,
        scale,
        rotate,
        key: Date.now(),
      });

      if (next >= 5) {
        setTimeout(() => {
          triggerEasterEgg();
          setEasterEggStage(0);
          setParticle(null);
        }, 400);
        return 5;
      }
      return next;
    });

    resetTimerRef.current = setTimeout(() => {
      setEasterEggStage(0);
      setParticle(null);
    }, 2800);
  }, [triggerEasterEgg]);

  return (
    <IonPage>
      <HomeHeader />
      <HomeBody
        stage={easterEggStage}
        particle={particle}
        hovered={hovered}
        onHover={setHovered}
        onLeave={() => setHovered(null)}
        onLogoClick={handleSecretTap}
        onOpenAnnouncements={() => setShowAnnouncements(true)}
      />
      <AnnouncementModal
        isOpen={showAnnouncements}
        onDismiss={() => setShowAnnouncements(false)}
      />
    </IonPage>
  );
};

export default HomePage;
