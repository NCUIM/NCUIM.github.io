import { useState, useRef, useEffect, useCallback } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
  IonBadge,
  useIonAlert,
} from "@ionic/react";
import {
  map,
  calendar,
  restaurant,
  calculator,
  sparkles,
  trophy,
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
    title: "研究室座位表",
    subtitle: "研究室座位與格局圖",
    icon: map,
    route: "/seats",
    color: "var(--ncu-muted)",
    badge: "即將開放",
    disabled: true,
  },
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

const HeroHeader = ({ onLogoClick }: Readonly<{ onLogoClick: () => void }>) => (
  <div
    style={{
      textAlign: "center",
      padding: "var(--ncu-space-3) 0 var(--ncu-space-2)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <button
      type="button"
      onClick={onLogoClick}
      aria-label="NCUIM Logo"
      style={{
        width: 72,
        height: 72,
        marginBottom: 14,
        borderRadius: "20px",
        boxShadow: "var(--ncu-shadow-hard)",
        border: "2.5px solid var(--ncu-ink)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1b2a4a",
        cursor: "pointer",
        transition: "transform 0.1s ease",
        userSelect: "none",
        padding: 0,
      }}
      title="NCUIM"
    >
      <NcuimLogoIcon />
    </button>
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
      NCUIM 新生綜合服務與生活入口平台
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
      <IonTitle>NCUIM 2026 Fresher Mixer</IonTitle>
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

const HomeBody = ({
  hovered,
  onHover,
  onLeave,
  onLogoClick,
}: Readonly<{
  hovered: string | null;
  onHover: (route: string) => void;
  onLeave: () => void;
  onLogoClick: () => void;
}>) => (
  <IonContent className="ion-padding">
    <HeroHeader onLogoClick={onLogoClick} />
    <HomeModuleList hovered={hovered} onHover={onHover} onLeave={onLeave} />
  </IonContent>
);

const HomePage = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [presentAlert] = useIonAlert();

  // Easter egg click counter
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  // DevTools console easter egg
  useEffect(() => {
    // skipcq: JS-0002
    console.log(
      "%c🚩 NCUIM 2026 CTF Challenge%c\nLooking for flags? Join the secret battlefield:\n👉 https://im2026ctf.duckdns.org/",
      "color: #38bdf8; font-size: 16px; font-weight: bold; background: #0f172a; padding: 6px 12px; border-radius: 6px;",
      "color: #a855f7; font-size: 13px; font-family: monospace; font-weight: bold; margin-top: 4px;",
    );
  }, []);

  const triggerEasterEgg = useCallback(() => {
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
            window.open("https://im2026ctf.duckdns.org/", "_blank", "noopener,noreferrer");
          },
        },
      ],
    });
  }, [presentAlert]);

  const handleSecretTap = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTimeRef.current > 2000) {
      clickCountRef.current = 1;
    } else {
      clickCountRef.current += 1;
    }
    lastClickTimeRef.current = now;

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      triggerEasterEgg();
    }
  }, [triggerEasterEgg]);

  return (
    <IonPage>
      <HomeHeader />
      <HomeBody
        hovered={hovered}
        onHover={setHovered}
        onLeave={() => setHovered(null)}
        onLogoClick={handleSecretTap}
      />
    </IonPage>
  );
};

export default HomePage;
