import { useState } from "react";
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
} from "@ionic/react";
import {
  map,
  calendar,
  restaurant,
  calculator,
  sparkles,
} from "ionicons/icons";

interface ModuleCard {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly route: string;
  readonly color: string;
  readonly badge?: string;
}

const modules: readonly ModuleCard[] = [
  {
    title: "研究室座位表",
    subtitle: "209 · 310 · 313 · 919 擬真格局圖",
    icon: map,
    route: "/seats",
    color: "var(--ncu-success)",
  },
  {
    title: "抽籤大會",
    subtitle: "大螢幕開獎 · 蛇形相鄰分配",
    icon: sparkles,
    route: "/stage/lottery",
    color: "var(--ncu-star)",
    badge: "舞台",
  },
  {
    title: "全系課表",
    subtitle: "週曆矩陣 · 篩選學制與課程屬性",
    icon: calendar,
    route: "/timetable",
    color: "var(--ncu-primary)",
  },
  {
    title: "中大美食地圖",
    subtitle: "後門 · 宵夜街 · 前門 · 校內",
    icon: restaurant,
    route: "/food",
    color: "var(--ncu-danger)",
  },
  {
    title: "學分試算",
    subtitle: "必修 · 選修 · 外所抵免 · 畢業門檻",
    icon: calculator,
    route: "/tools/credit",
    color: "var(--ncu-muted)",
  },
];

const HeroHeader = () => (
  <div
    style={{
      textAlign: "center",
      padding: "var(--ncu-space-2) 0 var(--ncu-space-1)",
    }}
  >
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
}: Readonly<{ title: string; badge?: string; subtitle: string }>) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: "var(--ncu-space-2)" }}>
      <IonCardTitle style={{ fontSize: "var(--ncu-font-size-lg)", margin: 0 }}>
        {title}
      </IonCardTitle>
      {badge && (
        <IonBadge color="primary" style={{ fontSize: "var(--ncu-font-size-xs)" }}>
          {badge}
        </IonBadge>
      )}
    </div>
    <IonCardSubtitle style={{ fontSize: "var(--ncu-font-size-sm)", marginTop: "var(--ncu-space-1)" }}>
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
}>) => (
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
}>) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--ncu-space-2)" }}>
    {modules.map((mod) => (
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

const HomeBody = ({
  hovered,
  onHover,
  onLeave,
}: Readonly<{
  hovered: string | null;
  onHover: (route: string) => void;
  onLeave: () => void;
}>) => (
  <IonContent className="ion-padding">
    <HeroHeader />
    <HomeModuleList hovered={hovered} onHover={onHover} onLeave={onLeave} />
  </IonContent>
);

const HomePage = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <IonPage>
      <HomeHeader />
      <HomeBody hovered={hovered} onHover={setHovered} onLeave={() => setHovered(null)} />
    </IonPage>
  );
};

export default HomePage;
