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
  openOutline,
  pricetagOutline,
  timeOutline,
} from "ionicons/icons";
import {
  AnnouncementItem,
  AnnouncementCategory,
  CATEGORY_LABELS,
  PRIORITY_CONFIG,
  BUILTIN_ANNOUNCEMENTS,
  fetchAnnouncements,
} from "../services/announcement-api";

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

const getStageIcon = (stage: number): string => {
  if (stage <= 0) return "";
  if (stage <= 4) return "⚡";
  if (stage <= 8) return "🔓";
  if (stage <= 12) return "🔥";
  if (stage <= 16) return "🚨";
  if (stage < 20) return "💥";
  return isCtfEnded() ? "🏆" : "🚩";
};

const getLogoStyle = (stage: number, isUnlocked: boolean): React.CSSProperties => {
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
    transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease, border-color 0.3s ease",
    willChange: "transform, box-shadow",
    backfaceVisibility: "hidden",
  };

  if (isUnlocked) {
    return {
      ...base,
      border: "2.5px solid #10b981",
      animation: "unlockedPulse 3s ease-in-out infinite",
    };
  }

  if (stage <= 0) {
    return {
      ...base,
      boxShadow: "var(--ncu-shadow-hard)",
      transform: "none",
    };
  }

  const scale = 1.0 + (stage / 20) * 0.32;
  const rotate = stage >= 20 ? 360 : (stage % 2 === 0 ? stage * 1.2 : -stage * 1.2);
  let boxShadow = "var(--ncu-shadow-hard)";

  if (stage >= 17) {
    boxShadow = "0 0 45px #10b981, 0 0 24px #38bdf8, var(--ncu-shadow-hard)";
  } else if (stage >= 13) {
    boxShadow = "0 0 36px rgba(239, 68, 68, 0.95), var(--ncu-shadow-hard)";
  } else if (stage >= 9) {
    boxShadow = "0 0 28px rgba(249, 115, 22, 0.9), var(--ncu-shadow-hard)";
  } else if (stage >= 5) {
    boxShadow = "0 0 22px rgba(168, 85, 247, 0.85), var(--ncu-shadow-hard)";
  } else {
    boxShadow = "0 0 16px rgba(56, 189, 248, 0.8), var(--ncu-shadow-hard)";
  }

  return {
    ...base,
    transform: `scale(${scale.toFixed(2)}) rotate(${rotate}deg)`,
    boxShadow,
  };
};

interface ParticleData {
  id: number;
  stage: number;
  text: string;
  side: "left" | "right";
  sideOffset: number;
  offsetY: number;
  flyY: number;
  driftX: number;
  scale: number;
  rotate: number;
  duration: number;
}

const HeroHeader = ({
  stage,
  isUnlocked,
  particles,
  onLogoClick,
}: Readonly<{
  stage: number;
  isUnlocked: boolean;
  particles: ParticleData[];
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
      @keyframes unlockedPulse {
        0%, 100% {
          transform: scale(1.04);
          box-shadow: 0 0 26px rgba(16, 185, 129, 0.75), 0 0 14px rgba(56, 189, 248, 0.5), var(--ncu-shadow-hard);
        }
        50% {
          transform: scale(1.08);
          box-shadow: 0 0 42px rgba(16, 185, 129, 0.95), 0 0 24px rgba(56, 189, 248, 0.7), var(--ncu-shadow-hard);
        }
      }
      @keyframes cyberGlowParticle {
        0% {
          opacity: 0;
          transform: translate3d(0, 8px, 0) scale(0.85);
        }
        15% {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
        60% {
          opacity: 0.85;
          transform: translate3d(calc(var(--drift-x, 0px) * 0.5), calc(var(--fly-y, -50px) * 0.5), 0) scale(0.8);
        }
        100% {
          opacity: 0;
          transform: translate3d(var(--drift-x, 0px), var(--fly-y, -50px), 0) scale(0.25);
        }
      }
    `}</style>
    <div style={{ position: "relative", display: "inline-flex", marginBottom: 14 }}>
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="NCUIM Logo"
        style={getLogoStyle(stage, isUnlocked)}
        title="NCUIM"
      >
        <NcuimLogoIcon />
      </button>

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: `calc(50% + ${p.offsetY}px)`,
            left: p.side === "right" ? `calc(100% + ${p.sideOffset}px)` : "auto",
            right: p.side === "left" ? `calc(100% + ${p.sideOffset}px)` : "auto",
            ["--fly-y" as string]: `${p.flyY}px`,
            ["--drift-x" as string]: `${p.driftX}px`,
            fontSize: 20,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: p.stage >= 13 ? "rgba(15, 23, 42, 0.94)" : "rgba(15, 23, 42, 0.88)",
            border: `1.5px solid ${p.stage >= 13 ? "#ef4444" : "#38bdf8"}`,
            boxShadow: p.stage >= 13
              ? "0 0 16px rgba(239, 68, 68, 0.6)"
              : "0 0 14px rgba(56, 189, 248, 0.6)",
            animation: `cyberGlowParticle ${p.duration}s ease-out forwards`,
            willChange: "transform, opacity",
            transformOrigin: "center center",
            backfaceVisibility: "hidden",
            pointerEvents: "none",
            zIndex: 10,
            userSelect: "none",
          }}
        >
          {p.text}
        </div>
      ))}
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

const AnnouncementBar = ({
  announcements,
  onOpen,
}: Readonly<{
  announcements: readonly AnnouncementItem[];
  onOpen: () => void;
}>) => {
  const latest = announcements[0];
  if (!latest) return null;

  const isUrgent = latest.priority === "urgent";
  const priorityConfig = PRIORITY_CONFIG[latest.priority];

  return (
    <div
      onClick={onOpen}
      style={{
        margin: "0 0 16px",
        padding: "10px 14px",
        background: isUrgent ? "rgba(239, 68, 68, 0.08)" : "var(--ncu-surface)",
        border: isUrgent ? "2px solid #ef4444" : "1.5px solid var(--ncu-ink)",
        borderRadius: "var(--ncu-radius-md)",
        boxShadow: isUrgent ? "0 0 12px rgba(239, 68, 68, 0.25)" : "var(--ncu-shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        <div
          style={{
            padding: "2px 6px",
            borderRadius: "6px",
            background: isUrgent ? "#ef4444" : "rgba(27, 42, 74, 0.08)",
            color: isUrgent ? "#ffffff" : "var(--ncu-primary)",
            fontSize: 11,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexShrink: 0,
          }}
        >
          <span>{priorityConfig.icon}</span>
          <span>{isUrgent ? "緊急置頂" : "公告"}</span>
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
  announcements,
  onDismiss,
}: Readonly<{
  isOpen: boolean;
  announcements: readonly AnnouncementItem[];
  onDismiss: () => void;
}>) => {
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory>("all");

  const categories: readonly AnnouncementCategory[] = [
    "all",
    "course",
    "event",
    "department",
    "career",
    "system",
    "general",
  ];

  const filtered =
    selectedCategory === "all"
      ? announcements
      : announcements.filter((item) => item.category === selectedCategory);

  return (
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
          {/* Category Filter Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 14,
              marginBottom: 8,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {categories.map((cat) => {
              const info = CATEGORY_LABELS[cat];
              const isSelected = selectedCategory === cat;
              const count =
                cat === "all"
                  ? announcements.length
                  : announcements.filter((item) => item.category === cat).length;

              if (cat !== "all" && count === 0) return null;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 12px",
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 800 : 600,
                    border: isSelected ? "1.5px solid var(--ncu-ink)" : "1px solid var(--ncu-border)",
                    background: isSelected ? "var(--ncu-ink)" : "var(--ncu-surface)",
                    color: isSelected ? "#ffffff" : "var(--ncu-ink)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: isSelected ? "var(--ncu-shadow-sm)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                  <span style={{ opacity: 0.75, fontSize: 11 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 16px",
                color: "var(--ncu-muted)",
                background: "var(--ncu-surface)",
                borderRadius: "var(--ncu-radius-md)",
                border: "1px dashed var(--ncu-border)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>此分類目前尚無公告</div>
            </div>
          ) : (
            filtered.map((item) => {
              const priorityConfig = PRIORITY_CONFIG[item.priority];
              const categoryConfig = CATEGORY_LABELS[item.category];

              return (
                <IonCard
                  key={item.id}
                  style={{
                    margin: "0 0 16px",
                    border:
                      item.priority === "urgent" ? "2.5px solid #ef4444" : "2px solid var(--ncu-ink)",
                    borderRadius: "var(--ncu-radius-md)",
                    boxShadow:
                      item.priority === "urgent"
                        ? "0 0 16px rgba(239, 68, 68, 0.2)"
                        : "var(--ncu-shadow-hard)",
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
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: priorityConfig.badgeColor,
                            color: "#ffffff",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <span>{priorityConfig.icon}</span>
                          <span>{priorityConfig.label}</span>
                        </span>

                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(27, 42, 74, 0.08)",
                            color: "var(--ncu-ink)",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <span>{categoryConfig.icon}</span>
                          <span>{categoryConfig.label}</span>
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--ncu-muted)", fontWeight: 600 }}>
                        {item.date}
                      </span>
                    </div>

                    <IonCardTitle
                      style={{
                        fontSize: 16.5,
                        fontWeight: 800,
                        color: "var(--ncu-ink)",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.title}
                    </IonCardTitle>

                    {item.milestone && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "rgba(59, 130, 246, 0.08)",
                          border: "1px solid rgba(59, 130, 246, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "#1e40af",
                          fontWeight: 700,
                        }}
                      >
                        <IonIcon icon={timeOutline} style={{ fontSize: 14 }} />
                        <span>階段：{item.milestone.title}</span>
                        {item.milestone.dueOn && (
                          <span style={{ opacity: 0.85 }}>(截止：{item.milestone.dueOn})</span>
                        )}
                      </div>
                    )}
                  </IonCardHeader>

                  <IonCardContent
                    style={{
                      padding: "0 16px 16px",
                      fontSize: 14,
                      color: "var(--ncu-ink)",
                      lineHeight: 1.7,
                    }}
                  >
                    <p style={{ margin: "0 0 14px", whiteSpace: "pre-line" }}>{item.content}</p>

                    {item.actionUrl && (
                      <div style={{ marginBottom: 14 }}>
                        <button
                          type="button"
                          onClick={() => window.open(item.actionUrl, "_blank", "noopener,noreferrer")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1.5px solid var(--ncu-ink)",
                            background: "var(--ncu-surface)",
                            color: "var(--ncu-ink)",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "var(--ncu-shadow-sm)",
                          }}
                        >
                          <IonIcon icon={openOutline} style={{ fontSize: 14 }} />
                          <span>開啟相關連結 ↗</span>
                        </button>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                        fontSize: 12.5,
                        color: "var(--ncu-muted)",
                        fontWeight: 700,
                        borderTop: "1px dashed var(--ncu-border)",
                        paddingTop: 10,
                      }}
                    >
                      <div>
                        —— {item.role} · {item.author}
                      </div>

                      {item.htmlUrl && (
                        <a
                          href={item.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--ncu-primary)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                          }}
                        >
                          <span>在 GitHub 檢視討論</span>
                          <IonIcon icon={openOutline} style={{ fontSize: 12 }} />
                        </a>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

const HomeBody = ({
  stage,
  isUnlocked,
  particles,
  announcements,
  hovered,
  onHover,
  onLeave,
  onLogoClick,
  onOpenAnnouncements,
}: Readonly<{
  stage: number;
  isUnlocked: boolean;
  particles: ParticleData[];
  announcements: readonly AnnouncementItem[];
  hovered: string | null;
  onHover: (route: string) => void;
  onLeave: () => void;
  onLogoClick: () => void;
  onOpenAnnouncements: () => void;
}>) => (
  <IonContent className="ion-padding">
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <HeroHeader
        stage={stage}
        isUnlocked={isUnlocked}
        particles={particles}
        onLogoClick={onLogoClick}
      />
      <AnnouncementBar announcements={announcements} onOpen={onOpenAnnouncements} />
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
  const [announcements, setAnnouncements] = useState<readonly AnnouncementItem[]>(BUILTIN_ANNOUNCEMENTS);
  const [easterEggStage, setEasterEggStage] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [presentAlert] = useIonAlert();

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch latest announcements from GitHub (SWR)
  useEffect(() => {
    fetchAnnouncements().then((data) => {
      if (data && data.length > 0) {
        setAnnouncements(data);
      }
    });
  }, []);

  const addParticle = useCallback((stage: number, text: string) => {
    const side = Math.random() < 0.5 ? "left" : "right";
    const sideOffset = 8 + Math.random() * 20;
    const offsetY = -28 + Math.random() * 56;
    const flyY = -35 - Math.random() * 25;
    const driftX = (Math.random() - 0.5) * 18;
    const scale = 0.85 + Math.random() * 0.35;
    const rotate = (Math.random() - 0.5) * 14;
    const duration = 2.2 + Math.random() * 0.6; // 2.2s ~ 2.8s
    const id = Date.now() + Math.random();

    const newParticle: ParticleData = {
      id,
      stage,
      text,
      side,
      sideOffset,
      offsetY,
      flyY,
      driftX,
      scale,
      rotate,
      duration,
    };

    setParticles((prev) => [...prev.slice(-7), newParticle]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, duration * 1000 + 100);
  }, []);

  // DevTools console easter egg
  useEffect(() => {
    // skipcq: JS-0002
    console.log(
      "%c🚩 NCUIM 2026 CTF Challenge%c\nLooking for flags? Join the secret battlefield:\n👉 https://im2026ctf.duckdns.org/\nScoreboard: https://im2026ctf.duckdns.org/scoreboard",
      "color: #38bdf8; font-size: 16px; font-weight: bold; background: #0f172a; padding: 6px 12px; border-radius: 6px;",
      "color: #a855f7; font-size: 13px; font-family: monospace; font-weight: bold; margin-top: 4px;",
    );
  }, []);

  // Ambient floating particles after unlocking
  useEffect(() => {
    if (!isUnlocked) return;

    let timer: ReturnType<typeof setTimeout>;

    const spawnAmbientParticle = () => {
      const icons = isCtfEnded()
        ? ["🏆", "✨", "👑", "🔥", "⚡", "🌟"]
        : ["🚩", "⚡", "🔓", "🔥", "💥", "✨", "💎"];
      const icon = icons[Math.floor(Math.random() * icons.length)];
      addParticle(20, icon);

      const nextDelay = 700 + Math.random() * 900; // 0.7s ~ 1.6s
      timer = setTimeout(spawnAmbientParticle, nextDelay);
    };

    timer = setTimeout(spawnAmbientParticle, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [isUnlocked, addParticle]);

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
    if (isUnlocked) {
      addParticle(20, getStageIcon(20));
      triggerEasterEgg();
      return;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    setEasterEggStage((prev) => {
      const next = prev + 1;
      addParticle(next, getStageIcon(next));

      if (next >= 20) {
        setIsUnlocked(true);
        setTimeout(() => {
          triggerEasterEgg();
        }, 400);
        return 20;
      }
      return next;
    });

    resetTimerRef.current = setTimeout(() => {
      setEasterEggStage(0);
    }, 2800);
  }, [isUnlocked, addParticle, triggerEasterEgg]);

  return (
    <IonPage>
      <HomeHeader />
      <HomeBody
        stage={easterEggStage}
        isUnlocked={isUnlocked}
        particles={particles}
        announcements={announcements}
        hovered={hovered}
        onHover={setHovered}
        onLeave={() => setHovered(null)}
        onLogoClick={handleSecretTap}
        onOpenAnnouncements={() => setShowAnnouncements(true)}
      />
      <AnnouncementModal
        isOpen={showAnnouncements}
        announcements={announcements}
        onDismiss={() => setShowAnnouncements(false)}
      />
    </IonPage>
  );
};

export default HomePage;
