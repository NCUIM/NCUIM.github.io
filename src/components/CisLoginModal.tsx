import { useCallback, useMemo } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  useIonToast,
} from "@ionic/react";
import {
  bookmarkOutline,
  copyOutline,
  openOutline,
  flashOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";

interface CisLoginModalProps {
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
}

export const generateBookmarkletCode = (targetUrl: string): string => {
  const scriptBody = String.raw`(function(){void(async function(){try{if(!location.hostname.includes("cis.ncu.edu.tw")){alert("請先在瀏覽器開啟並登入中大課務系統 (cis.ncu.edu.tw)，再點擊此書籤！");return;}var courses=[];var seen={};function add(c){var k=(c.classNo||"")+"-"+(c.name||"");if(k!=="-"&&!seen[k]){seen[k]=true;courses.push(c);}}try{var resStatus=await fetch("/Course/main/personal/perCrsstatus");if(resStatus.ok){var html=await resStatus.text();if(!html.includes("window.location")&&!html.includes("閒置時間過長")){var doc=new DOMParser().parseFromString(html,"text/html");function parseRows(d){var trs=d.querySelectorAll("tr");for(var i=0;i<trs.length;i++){var tds=trs[i].querySelectorAll("td,th");if(tds.length>=6){var cNo=(tds[2]&&tds[2].textContent||"").trim();if(/^[A-Z]{2,}\d+/i.test(cNo)){var sNo=(tds[1]&&tds[1].textContent||"").trim();var rawName=(tds[4]&&tds[4].textContent||"").trim();var cName=rawName.split(/\s+/)[0]||rawName;var cr=Number((tds[6]&&tds[6].textContent||"").trim())||0;var st=(tds[tds.length-1]&&tds[tds.length-1].textContent||"").trim();add({serialNo:sNo,classNo:cNo,name:cName,credit:cr,status:st||"passed"});}}}}parseRows(doc);var opts=doc.querySelectorAll("select[name='semester'] option");var sems=[];for(var j=0;j<opts.length;j++){var val=opts[j].value;if(/^\d{4}$/.test(val))sems.push(val);}for(var k=0;k<Math.min(sems.length,8);k++){try{var sRes=await fetch("/Course/main/personal/perCrsstatus",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"semester="+sems[k]});if(sRes.ok){var sHtml=await sRes.text();parseRows(new DOMParser().parseFromString(sHtml,"text/html"));}}catch(_){}}}}}catch(_){}var xmlUrls=["/Course/main/support/course.xml?id=my_class","/Course/main/support/sheets.xml"];for(var x=0;x<xmlUrls.length;x++){try{var xRes=await fetch(xmlUrls[x]);if(xRes.ok){var xText=await xRes.text();if(!xmlText.includes("window.location")){var xDoc=new DOMParser().parseFromString(xText,"text/xml");var xCourses=xDoc.querySelectorAll("Courses > Course");for(var y=0;y<xCourses.length;y++){var el=xCourses[y];add({serialNo:el.getAttribute("SerialNo")||"",classNo:el.getAttribute("ClassNo")||"",name:el.getAttribute("Title")||"",credit:Number(el.getAttribute("credit")||0),status:el.getAttribute("Status")||""});}}}}catch(_){}}if(courses.length===0){alert("課務系統中尚未查詢到修課紀錄（歷年修課狀況表與本學期選課均為空）。若您為新生尚未選課，可直接在 CIM-Life 頁手動勾選課程！");return;}var payload=encodeURIComponent(JSON.stringify(courses));location.href="${targetUrl}"+String.fromCharCode(35)+"cis_data="+payload;}catch(err){alert("同步發生錯誤："+err.message);}})();})()`;
  return `javascript:${scriptBody}`;
};

const BookmarkletInstructions = ({
  bookmarkletCode,
  onCopy,
}: Readonly<{
  bookmarkletCode: string;
  onCopy: () => void;
}>) => (
  <div style={{ fontSize: 13.5, color: "var(--ncu-ink)", lineHeight: 1.6 }}>
    <div
      style={{
        background: "var(--ncu-surface)",
        border: "1.5px solid var(--ncu-border)",
        borderRadius: "var(--ncu-radius-md)",
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ncu-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <IonIcon icon={flashOutline} />
        <span>一鍵書籤同步（免開 F12 · 零密碼外洩）</span>
      </div>
      <p style={{ margin: "0 0 12px", color: "var(--ncu-muted)", fontSize: 12.5 }}>
        透過瀏覽器書籤在課務系統直接讀取歷年與本學期已修課程，自動回傳至 CIM-Life 學分試算：
      </p>

      <div style={{ textAlign: "center", margin: "16px 0 12px" }}>
        <a
          href={bookmarkletCode}
          title="將此按鈕拖曳至書籤列"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--ncu-primary)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "var(--ncu-radius-md)",
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: "var(--ncu-shadow-sm)",
            cursor: "grab",
          }}
        >
          <IonIcon icon={bookmarkOutline} style={{ fontSize: 18 }} />
          <span>🔖 拖曳此按鈕至書籤列</span>
        </a>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <IonButton size="small" fill="outline" onClick={onCopy} style={{ fontSize: 12 }}>
          <IonIcon slot="start" icon={copyOutline} />
          複製書籤代碼（手機或手動新增）
        </IonButton>
      </div>

      <ol style={{ margin: 0, paddingLeft: 20, color: "var(--ncu-ink)", fontSize: 13 }}>
        <li style={{ marginBottom: 8 }}>
          將上方按鈕<strong>拖曳至瀏覽器書籤列</strong>（或複製代碼手動建立書籤）。
        </li>
        <li style={{ marginBottom: 8 }}>
          在瀏覽器開啟並登入{" "}
          <a
            href="https://cis.ncu.edu.tw/Course/main/login"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--ncu-primary)", fontWeight: 700 }}
          >
            cis.ncu.edu.tw <IonIcon icon={openOutline} style={{ fontSize: 12, verticalAlign: "middle" }} />
          </a>。
        </li>
        <li style={{ marginBottom: 8 }}>
          登入成功後，<strong>點擊剛剛加入的書籤</strong>。
        </li>
        <li>
          書籤將安全讀取已選課程代碼，並<strong>自動跳轉回 CIM-Life</strong> 匯入學分！
        </li>
      </ol>
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "10px 14px",
        background: "rgba(16, 185, 129, 0.08)",
        borderRadius: "var(--ncu-radius-sm)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
        color: "var(--ncu-ink)",
        fontSize: 12,
      }}
    >
      <IonIcon icon={shieldCheckmarkOutline} style={{ color: "#10b981", fontSize: 16, flexShrink: 0, marginTop: 2 }} />
      <span>
        <strong>隱私承諾</strong>：代碼僅在您的本地瀏覽器執行讀取與跳轉，任何帳號、密碼或非公開資料絕不上傳任何第三方伺服器。
      </span>
    </div>
  </div>
);

const CisModalHeader = ({ onDismiss }: Readonly<{ onDismiss: () => void }>) => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>同步課務修課紀錄</IonTitle>
      <IonButtons slot="end">
        <IonButton onClick={onDismiss}>關閉</IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

const CisLoginModal = ({
  isOpen,
  onDismiss,
}: Readonly<CisLoginModalProps>) => {
  const [presentToast] = useIonToast();

  const targetUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://ncuim.github.io/tools/credit";
    return `${window.location.origin}/tools/credit`;
  }, []);

  const bookmarkletCode = useMemo(
    () => generateBookmarkletCode(targetUrl),
    [targetUrl],
  );

  const handleCopyBookmarklet = useCallback(() => {
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      presentToast({
        message: "📋 已複製書籤代碼！可在瀏覽器書籤網址欄貼上。",
        duration: 3000,
        color: "success",
        position: "top",
      });
    }).catch(() => {
      presentToast({
        message: "複製失敗，請手動選取代碼複製",
        duration: 3000,
        color: "warning",
        position: "top",
      });
    });
  }, [bookmarkletCode, presentToast]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <CisModalHeader onDismiss={onDismiss} />
      <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
        <BookmarkletInstructions
          bookmarkletCode={bookmarkletCode}
          onCopy={handleCopyBookmarklet}
        />
      </IonContent>
    </IonModal>
  );
};

export default CisLoginModal;
