import React from "react";
import { IonIcon } from "@ionic/react";

export interface FilterChipTab<T extends string = string> {
  readonly id: T;
  readonly label: string;
  readonly icon?: string;
  readonly iconColor?: string;
}

export interface FilterChipsProps<T extends string = string> {
  readonly activeCategory: T;
  readonly onSelectCategory: (id: T) => void;
  readonly tabs: readonly FilterChipTab<T>[];
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly labelClassName?: string;
}

export function FilterChips<T extends string = string>({
  activeCategory,
  onSelectCategory,
  tabs,
  ariaLabel = "類別篩選",
  className = "guide-chips-scroll filter-chips-scroll",
  labelClassName,
}: Readonly<FilterChipsProps<T>>): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 8,
        marginBottom: 16,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {tabs.map((tab) => {
        const isSelected = activeCategory === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectCategory(tab.id)}
            aria-label={tab.label}
            title={tab.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: "var(--ncu-radius-full, 9999px)",
              fontSize: 13,
              fontWeight: isSelected ? 800 : 600,
              border: isSelected
                ? "1.5px solid var(--ncu-ink, #0f172a)"
                : "1px solid var(--ncu-border, #cbd5e1)",
              background: isSelected
                ? "var(--ncu-ink, #0f172a)"
                : "var(--ncu-surface, #ffffff)",
              color: isSelected ? "#ffffff" : "var(--ncu-ink, #0f172a)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: isSelected ? "var(--ncu-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))" : "none",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
          >
            {tab.icon && (
              <IonIcon
                icon={tab.icon}
                style={{
                  fontSize: 14,
                  color: isSelected ? "#ffffff" : tab.iconColor ?? "var(--ncu-ink)",
                }}
              />
            )}
            <span className={labelClassName}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default FilterChips;
