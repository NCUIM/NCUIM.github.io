import React from "react";
import {
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
import type { ModuleCard } from "./types";
import homeModulesJson from "../../data/home-modules.json";

interface ModuleCardRaw {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly route: string;
  readonly color: string;
  readonly badge?: string;
  readonly disabled?: boolean;
  readonly hidden?: boolean;
}

const MODULE_ICONS: Record<string, string> = {
  calendar,
  calculator,
  map,
  sparkles,
  restaurant,
};

export const modules: readonly ModuleCard[] = (homeModulesJson as readonly ModuleCardRaw[]).map(
  (m) => ({
    ...m,
    icon: MODULE_ICONS[m.icon] ?? calendar,
  })
);

export const CardIcon = ({ color, icon }: Readonly<{ color: string; icon: string }>) => (
  <div
    style={{
      width: 56,
      height: 56,
      borderRadius: "14px",
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <IonIcon icon={icon} style={{ fontSize: 28, color: "#fff" }} />
  </div>
);

export const CardTitleRow = ({
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

export const ModuleCardItem = ({
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

export const HomeModuleList = ({
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
