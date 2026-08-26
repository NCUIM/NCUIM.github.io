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
  IonCardContent,
  IonIcon,
  IonBadge,
} from "@ionic/react";
import {
  people,
  map,
  calendar,
  restaurant,
  calculator,
  gift,
  sparkles,
} from "ionicons/icons";

interface ModuleCard {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
}

const modules: ModuleCard[] = [
  {
    title: "活動卡片收集",
    subtitle: "QR 掃碼互換 · Profile · 成就 · 排行榜",
    icon: people,
    route: "/cards",
    color: "var(--ncu-primary)",
    badge: "活動",
  },
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
  {
    title: "新生生存指南",
    subtitle: "入學檢核 · 校園資源 · 時程規劃",
    icon: gift,
    route: "/guide",
    color: "var(--ncu-success)",
  },
];

export default function HomePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>NCUIM 2026 Fresher</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Hero Section */}
        <div
          style={{
            textAlign: "center",
            padding: "var(--ncu-space-6) 0 var(--ncu-space-4)",
          }}
        >
          <h1
            style={{
              fontSize: "var(--ncu-font-size-3xl)",
              fontWeight: "var(--ncu-font-weight-bold)",
              margin: 0,
              color: "var(--ncu-ink)",
            }}
          >
            歡迎加入資管所
          </h1>
          <p
            style={{
              fontSize: "var(--ncu-font-size-base)",
              color: "var(--ncu-muted)",
              margin: "var(--ncu-space-2) 0 0",
            }}
          >
            NCUIM 新生綜合服務與生活入口平台
          </p>
        </div>

        {/* Module Cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--ncu-space-3)",
          }}
        >
          {modules.map((mod) => (
            <IonCard
              key={mod.route}
              routerLink={mod.route}
              style={{
                margin: 0,
                border: "2px solid var(--ncu-ink)",
                boxShadow: "var(--ncu-shadow-hard)",
                cursor: "pointer",
                transition: "transform 0.1s",
              }}
              button
            >
              <IonCardHeader>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ncu-space-3)",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--ncu-radius-md)",
                      background: mod.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon
                      icon={mod.icon}
                      style={{ fontSize: 24, color: "#fff" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--ncu-space-2)",
                      }}
                    >
                      <IonCardTitle
                        style={{
                          fontSize: "var(--ncu-font-size-lg)",
                          margin: 0,
                        }}
                      >
                        {mod.title}
                      </IonCardTitle>
                      {mod.badge && (
                        <IonBadge
                          color="primary"
                          style={{ fontSize: "var(--ncu-font-size-xs)" }}
                        >
                          {mod.badge}
                        </IonBadge>
                      )}
                    </div>
                    <IonCardSubtitle
                      style={{
                        fontSize: "var(--ncu-font-size-sm)",
                        marginTop: "var(--ncu-space-1)",
                      }}
                    >
                      {mod.subtitle}
                    </IonCardSubtitle>
                  </div>
                </div>
              </IonCardHeader>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
}
