import {
  IonBackButton,
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useState, ChangeEvent } from "react";

const UploadSection = ({
  fileName,
  onFileChange,
}: Readonly<{
  fileName: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}>) => (
  <section>
    <h2>1. 匯入 XLSX 名單</h2>
    <label className="lottery-upload">
      <input type="file" accept=".xlsx" onChange={onFileChange} />
      <strong>{fileName || "選擇研究室選位.xlsx"}</strong>
      <span>僅預覽檔名；尚未上傳。</span>
    </label>
  </section>
);

const ValidationSection = () => (
  <section>
    <h2>2. 資料檢查</h2>
    <div className="lottery-admin-grid">
      <span>
        組別數 <b>—</b>
      </span>
      <span>
        參與者 <b>—</b>
      </span>
      <span>
        容量檢查 <b>等待匯入</b>
      </span>
    </div>
  </section>
);

const PublishSection = () => (
  <section>
    <h2>3. 現場發布</h2>
    <p>發布後，手機端會以 Firestore 即時接收抽籤狀態。</p>
    <IonButton disabled>Firebase 尚未設定</IonButton>
  </section>
);

const LotteryAdminPage = () => {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name ?? "");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="" />
          </IonButtons>
          <IonTitle>抽籤控制台</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <main className="lottery-admin">
          <p className="lottery-admin-eyebrow">STAFF ONLY · DEMO UI</p>
          <h1>研究室抽籤控制台</h1>
          <p>匯入名單、檢查資料，再發布至與會者手機。</p>

          <UploadSection fileName={fileName} onFileChange={handleFileChange} />
          <ValidationSection />
          <PublishSection />
        </main>
      </IonContent>
    </IonPage>
  );
};

export default LotteryAdminPage;
