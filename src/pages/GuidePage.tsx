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

interface CategoryTheme {
  readonly icon: string;
  readonly badgeColor: string;
  readonly iconColor: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  academic: {
    icon: schoolOutline,
    badgeColor: "primary",
    iconColor: "var(--ncu-primary)",
  },
  community: {
    icon: peopleOutline,
    badgeColor: "success",
    iconColor: "var(--ncu-success)",
  },
  "tech-dev": {
    icon: codeSlashOutline,
    badgeColor: "tertiary",
    iconColor: "#7c3aed",
  },
};

const guideCategories: readonly ResourceCategory[] = guideCategoriesJson.map((cat) => ({
  ...cat,
  icon: CATEGORY_THEMES[cat.id]?.icon || schoolOutline,
}));

const ResourceItem = ({
  item,
  badgeColor,
}: Readonly<{
  item: ResourceLink;
  badgeColor: string;
}>) => (
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
        {item.tag && (
          <IonBadge
            color={badgeColor}
            style={{
              fontSize: 13.5,
              fontWeight: 800,
              padding: "3.5px 8px",
              borderRadius: 6,
              letterSpacing: 0.3,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {item.tag}
          </IonBadge>
        )}
        <strong
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "var(--ncu-ink)",
            display: "inline-flex",
            alignItems: "center",
            lineHeight: 1.2,
          }}
        >
          {item.title}
        </strong>
      </div>
      <p style={{ fontSize: 13, color: "var(--ncu-muted)", lineHeight: 1.45, margin: 0 }}>
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
      收錄資管所常用之校園系統、生活服務與開發者軟體資源
    </p>
  </div>
);

const CategorySection = ({ cat }: Readonly<{ cat: ResourceCategory }>) => {
  const theme = CATEGORY_THEMES[cat.id] || {
    icon: schoolOutline,
    badgeColor: "primary",
    iconColor: "var(--ncu-primary)",
  };

  return (
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
        <IonIcon icon={theme.icon} style={{ fontSize: 20, color: theme.iconColor }} />
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
          <ResourceItem key={item.url} item={item} badgeColor={theme.badgeColor} />
        ))}
      </IonList>
    </div>
  );
};

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
      <IonTitle>常用資源與校園導航</IonTitle>
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
