import React, { useState } from "react";
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
  schoolSharp,
  peopleOutline,
  peopleSharp,
  codeSlashOutline,
  codeSlashSharp,
  gridOutline,
  gridSharp,
  giftOutline,
  giftSharp,
  extensionPuzzleOutline,
  extensionPuzzleSharp,
} from "ionicons/icons";

const SOLID_ICON: Readonly<Record<string, string>> = {
  [schoolOutline]: schoolSharp,
  [peopleOutline]: peopleSharp,
  [codeSlashOutline]: codeSlashSharp,
  [gridOutline]: gridSharp,
  [giftOutline]: giftSharp,
  [extensionPuzzleOutline]: extensionPuzzleSharp,
};
import guideCategoriesJson from "../data/guide-resources.json";
import { FilterChips, type FilterChipTab } from "../components/common/FilterChips";

interface ResourceLink {
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly tag?: string;
}

interface ResourceCategory {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly items: readonly ResourceLink[];
}

interface CategoryTheme {
  readonly icon: string;
  readonly iconColor: string;
  readonly tagBg: string;
  readonly tagColor: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  academic: {
    icon: schoolOutline,
    iconColor: "var(--ncu-primary)",
    tagBg: "var(--ncu-primary-light)",
    tagColor: "var(--ncu-primary)",
  },
  community: {
    icon: peopleOutline,
    iconColor: "var(--ncu-success)",
    tagBg: "var(--ncu-success-light)",
    tagColor: "#0f766e",
  },
  "tech-dev": {
    icon: codeSlashOutline,
    iconColor: "#7c3aed",
    tagBg: "#f3e8ff",
    tagColor: "#6b21a8",
  },
  "student-resources": {
    icon: giftOutline,
    iconColor: "#d97706",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
  },
  clubs: {
    icon: extensionPuzzleOutline,
    iconColor: "#e11d48",
    tagBg: "#ffe4e6",
    tagColor: "#be123c",
  },
};

const guideCategories: readonly ResourceCategory[] = guideCategoriesJson.map((cat) => ({
  ...cat,
  icon: CATEGORY_THEMES[cat.id]?.icon || schoolOutline,
}));

const CATEGORY_ICON_COLORS: Readonly<Record<string, string>> = {
  all: "var(--ncu-ink)",
  ...Object.fromEntries(
    Object.entries(CATEGORY_THEMES).map(([id, theme]) => [id, theme.iconColor]),
  ),
};

const ResourceItem = ({
  item,
  theme,
}: Readonly<{
  item: ResourceLink;
  theme: CategoryTheme;
}>) => (
  <IonItem
    button
    detail={false}
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    style={{ "--background": "var(--ncu-surface)", cursor: "pointer" }}
  >
    <IonLabel style={{ margin: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
        {item.tag && (
          <IonBadge
            style={{
              fontSize: 15,
              fontWeight: 800,
              padding: "4px 6px",
              borderRadius: 4,
              letterSpacing: 0.3,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              background: theme.tagBg,
              color: theme.tagColor,
            }}
          >
            {item.tag}
          </IonBadge>
        )}
        <strong
          style={{
            fontSize: 16.5,
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



const CategorySection = ({ cat }: Readonly<{ cat: ResourceCategory }>) => {
  const theme = CATEGORY_THEMES[cat.id] || {
    icon: schoolOutline,
    iconColor: "var(--ncu-primary)",
    tagBg: "var(--ncu-primary-light)",
    tagColor: "var(--ncu-primary)",
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          padding: "0 4px",
        }}
      >
        <IonIcon icon={theme.icon} style={{ fontSize: 19, color: theme.iconColor }} />
        <h2 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: "var(--ncu-ink)" }}>
          {cat.title}
        </h2>
      </div>
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
          <ResourceItem key={item.url} item={item} theme={theme} />
        ))}
      </IonList>
    </div>
  );
};

const FILTER_TABS: readonly FilterChipTab<string>[] = [
  {
    id: "all",
    label: "全部資源",
    icon: SOLID_ICON[gridOutline] ?? gridOutline,
    iconColor: CATEGORY_ICON_COLORS.all,
  },
  ...guideCategories.map((cat) => ({
    id: cat.id,
    label: cat.title,
    icon: SOLID_ICON[cat.icon] ?? cat.icon,
    iconColor: CATEGORY_ICON_COLORS[cat.id],
  })),
];

const GuidePageBody = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const displayedCategories =
    activeCategory === "all"
      ? guideCategories
      : guideCategories.filter((cat) => cat.id === activeCategory);

  return (
    <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", paddingTop: 4 }}>
        <FilterChips
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          tabs={FILTER_TABS}
          ariaLabel="資源類別篩選"
          className="guide-chips-scroll"
          labelClassName="guide-filter-chip-label"
        />

        {displayedCategories.map((cat) => (
          <CategorySection key={cat.id} cat={cat} />
        ))}
      </div>
    </IonContent>
  );
};

const GuidePageHeader = () => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>校園指南</IonTitle>
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
