import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonNote,
} from "@ionic/react";

const courses = [
  { id: "1", name: "計算機科學", credits: 3, category: "required" },
  { id: "2", name: "資料庫系統", credits: 3, category: "required" },
  { id: "3", name: "機器學習", credits: 3, category: "elective" },
  { id: "4", name: "演算法設計", credits: 3, category: "required" },
  { id: "5", name: "計算機網路", credits: 3, category: "elective" },
];

export default function CreditPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="" />
          </IonButtons>
          <IonTitle>學分試算</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard
          style={{
            margin: "0 0 var(--ncu-space-4)",
            border: "2px solid var(--ncu-ink)",
            boxShadow: "var(--ncu-shadow-hard)",
          }}
        >
          <IonCardHeader>
            <IonCardTitle>畢業學分概覽</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "var(--ncu-space-3)",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "var(--ncu-font-size-2xl)", fontWeight: "var(--ncu-font-weight-bold)", color: "var(--ncu-primary)" }}>0</div>
                <div style={{ fontSize: "var(--ncu-font-size-sm)", color: "var(--ncu-muted)" }}>必修</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--ncu-font-size-2xl)", fontWeight: "var(--ncu-font-weight-bold)", color: "var(--ncu-success)" }}>0</div>
                <div style={{ fontSize: "var(--ncu-font-size-sm)", color: "var(--ncu-muted)" }}>選修</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--ncu-font-size-2xl)", fontWeight: "var(--ncu-font-weight-bold)", color: "var(--ncu-muted)" }}>0</div>
                <div style={{ fontSize: "var(--ncu-font-size-sm)", color: "var(--ncu-muted)" }}>總學分</div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <h3 style={{ fontSize: "var(--ncu-font-size-lg)", fontWeight: "var(--ncu-font-weight-bold)" }}>
          課程清單
        </h3>
        <IonList style={{ borderRadius: "var(--ncu-radius-md)", overflow: "hidden" }}>
          {courses.map((course) => (
            <IonItem key={course.id}>
              <IonCheckbox slot="start" />
              <IonLabel>
                <h2>{course.name}</h2>
                <p>{course.category === "required" ? "必修" : "選修"} · {course.credits} 學分</p>
              </IonLabel>
              <IonNote slot="end">{course.credits} 學分</IonNote>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
}
