import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonNote,
  IonIcon,
} from "@ionic/react";
import { ribbonOutline } from "ionicons/icons";
import { GRADUATION_GATES } from "../../data/im-curriculum";

export interface GraduationGatesCardProps {
  readonly selectedGateIds: readonly string[];
  readonly onToggleGate: (id: string, checked: boolean) => void;
}

export const GraduationGatesCard = ({
  selectedGateIds,
  onToggleGate,
}: Readonly<GraduationGatesCardProps>) => (
  <IonCard
    style={{
      margin: "0 0 24px",
      border: "2px solid var(--ncu-ink)",
      borderRadius: "var(--ncu-radius-md)",
      boxShadow: "var(--ncu-shadow-hard)",
    }}
  >
    <IonCardHeader style={{ paddingBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IonIcon icon={ribbonOutline} style={{ fontSize: 20, color: "var(--ncu-primary)" }} />
        <IonCardTitle style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: 800 }}>
          畢業門檻與認證檢核
        </IonCardTitle>
      </div>
      <IonCardSubtitle style={{ marginTop: 4, color: "var(--ncu-muted)", fontSize: 12 }}>
        學術倫理、英文門檻與論文口試要求
      </IonCardSubtitle>
    </IonCardHeader>

    <IonCardContent style={{ padding: 0 }}>
      <IonList lines="full" style={{ padding: 0 }}>
        {GRADUATION_GATES.map((gate) => {
          const isChecked = selectedGateIds.includes(gate.id);
          return (
            <IonItem
              button
              detail={false}
              key={gate.id}
              onClick={() => onToggleGate(gate.id, !isChecked)}
              style={{
                "--background": isChecked ? "var(--ncu-success-light)" : "var(--ncu-surface)",
                cursor: "pointer",
              }}
            >
              <IonCheckbox slot="start" checked={isChecked} style={{ pointerEvents: "none" }} />
              <IonLabel style={{ margin: "10px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 15, fontWeight: 700, color: "var(--ncu-ink)" }}>
                    {gate.title}
                  </strong>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ncu-muted)" }}>
                  {gate.description}
                </p>
              </IonLabel>
              <IonNote
                slot="end"
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: isChecked ? "#0d7a3e" : "var(--ncu-muted)",
                }}
              >
                {isChecked ? "✓ 已通過" : "未通過"}
              </IonNote>
            </IonItem>
          );
        })}
      </IonList>
    </IonCardContent>
  </IonCard>
);

export default GraduationGatesCard;
