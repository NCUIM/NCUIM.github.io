import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
} from "@ionic/react";
import {
  openOutline,
  schoolOutline,
  peopleOutline,
  codeSlashOutline,
} from "ionicons/icons";
import guideCategoriesJson from "../data/guide-resources.json";

interface ResourceLink {
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly tag?: string;
}

interface ResourceCategory {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly items: readonly ResourceLink[];
}

const CATEGORY_ICON_MAP: Record<string, string> = {
  academic: schoolOutline,
  community: peopleOutline,
  "tech-dev": codeSlashOutline,
};

const guideCategories: readonly ResourceCategory[] = guideCategoriesJson.map((cat) => ({
  ...cat,
  icon: CATEGORY_ICON_MAP[cat.id] || schoolOutline,
}));

const ResourceItem = ({ item }: Readonly<{ item: ResourceLink }>) => (
  <IonItem
    button
    detail={false}
    key={item.url}
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    style={{ "--background": "var(--ncu-surface)", cursor: "pointer" }}
  >
    <IonLabel style={{ margin: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        {item.tag && (
          <IonBadge color="primary" style={{ fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 4 }}>
            {item.tag}
          </IonBadge>
        )}
        <strong style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ncu-ink)" }}>
          {item.title}
        </strong>
      </div>
      <p style={{ fontSize: 13, color: "var(--ncu-muted)", lineHeight: 1.4, margin: 0 }}>
        {item.description}
      </p>
    </IonLabel>
    <IonIcon icon={openOutline} slot="end" style={{ fontSize: 18, color: "var(--ncu-muted)", flexShrink: 0, marginLeft: 10 }} />
  </IonItem>
);

const GuideIntroHeader = () => (
  <div style={{ padding: "4px 4px 16px" }}>
    <h1
      style={{
        fontSize: 22,
        fontWeight: 800,
        color: "var(--ncu-ink)",
        margin: "0 0 4px",
      }}
    >
      中大生活與實用入口
    </h1>
    <p style={{ fontSize: 14, color: "var(--ncu-muted)", margin: 0 }}>
      收錄資管所新生常用之校園系統、生活服務與開發者軟體資源
    </p>
  </div>
);

const CategorySection = ({ cat }: Readonly<{ cat: ResourceCategory }>) => (
  <div style={{ marginBottom: 28 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        padding: "0 4px",
      }}
    >
      <IonIcon icon={cat.icon} style={{ fontSize: 20, color: "var(--ncu-primary)" }} />
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--ncu-ink)" }}>
        {cat.title}
      </h2>
    </div>
    <p style={{ margin: "0 0 10px 4px", fontSize: 13, color: "var(--ncu-muted)" }}>
      {cat.subtitle}
    </p>
    <IonList
      inset
      style={{
        margin: 0,
        borderRadius: "var(--ncu-radius-md)",
        border: "1.5px solid var(--ncu-border)",
        overflow: "hidden",
      }}
    >
      {cat.items.map((item) => (
        <ResourceItem key={item.url} item={item} />
      ))}
    </IonList>
  </div>
);

const GuidePageBody = () => (
  <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <GuideIntroHeader />
      {guideCategories.map((cat) => (
        <CategorySection key={cat.id} cat={cat} />
      ))}
    </div>
  </IonContent>
);

const GuidePageHeader = () => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>常用資源與新生導航</IonTitle>
    </IonToolbar>
  </IonHeader>
);

const GuidePage = () => {
  return (
    <IonPage>
      <GuidePageHeader />
      <GuidePageBody />
    </IonPage>
  );
};

export default GuidePage;
