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
} from "ionicons/icons";

interface CisLoginModalProps {
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
}

const BOOKMARKLET_URI_SCHEME = String.fromCodePoint(
  106, 97, 118, 97, 115, 99, 114, 105, 112, 116, 58,
); // "javascript:"

export const generateBookmarkletCode = (targetUrl: string): string => {
  const scriptBody = String.raw`(function(){void(async function(){try{if(!location.hostname.includes("cis.ncu.edu.tw")){alert("請先在瀏覽器開啟並登入中大課務系統 (cis.ncu.edu.tw)，再點擊此書籤！");return;}var currentCourses=[];var currentSeen={};function addCurrent(c){var k=(c.classNo||"")+"-"+(c.name||"");if(k!=="-"&&!currentSeen[k]){currentSeen[k]=true;currentCourses.push(c);}}var historyCourses=[];var historySeen={};function addHistory(c){var k=(c.classNo||"")+"-"+(c.name||"");if(k!=="-"&&!historySeen[k]){historySeen[k]=true;historyCourses.push(c);}}try{var cRes=await fetch("/Course/main/support/course.xml?id=my_class");if(cRes.ok){var cText=await cRes.text();if(!cText.includes("window.location")){var cDoc=new DOMParser().parseFromString(cText,"text/xml");var cEls=cDoc.querySelectorAll("Courses > Course");for(var i=0;i<cEls.length;i++){var el=cEls[i];var obj={serialNo:el.getAttribute("SerialNo")||"",classNo:el.getAttribute("ClassNo")||"",name:el.getAttribute("Title")||"",credit:Number(el.getAttribute("credit")||0),status:el.getAttribute("Status")||""};addCurrent(obj);addHistory(obj);}}}}catch(_){}try{var sXmlRes=await fetch("/Course/main/support/sheets.xml");if(sXmlRes.ok){var sXmlText=await sXmlRes.text();if(!sXmlText.includes("window.location")){var sXmlDoc=new DOMParser().parseFromString(sXmlText,"text/xml");var sXmlEls=sXmlDoc.querySelectorAll("Courses > Course");for(var j=0;j<sXmlEls.length;j++){var sEl=sXmlEls[j];addHistory({serialNo:sEl.getAttribute("SerialNo")||"",classNo:sEl.getAttribute("ClassNo")||"",name:sEl.getAttribute("Title")||"",credit:Number(sEl.getAttribute("credit")||0),status:sEl.getAttribute("Status")||""});}}}}catch(_){}try{var resStatus=await fetch("/Course/main/personal/perCrsstatus");if(resStatus.ok){var html=await resStatus.text();if(!html.includes("window.location")&&!html.includes("閒置時間過長")){function parseRows(d){var trs=d.querySelectorAll("tr");for(var r=0;r<trs.length;r++){var tds=trs[r].querySelectorAll("td,th");if(tds.length>=6){var cNo=(tds[2]&&tds[2].textContent||"").trim();if(/^[A-Z]{2,}\d+/i.test(cNo)){var sNo=(tds[1]&&tds[1].textContent||"").trim();var rawName=(tds[4]&&tds[4].textContent||"").trim();var cName=rawName.split(/\s+/)[0]||rawName;var cr=Number((tds[6]&&tds[6].textContent||"").trim())||0;var st=(tds[tds.length-1]&&tds[tds.length-1].textContent||"").trim();addHistory({serialNo:sNo,classNo:cNo,name:cName,credit:cr,status:st||"passed"});}}}}var doc=new DOMParser().parseFromString(html,"text/html");parseRows(doc);var opts=doc.querySelectorAll("select[name='semester'] option");var sems=[];for(var o=0;o<opts.length;o++){var val=opts[o].value;if(/^\d{4}$/.test(val))sems.push(val);}await Promise.all(sems.map(async function(sVal){try{var sRes=await fetch("/Course/main/personal/perCrsstatus",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"semester="+encodeURIComponent(sVal)});if(sRes.ok){var sHtml=await sRes.text();parseRows(new DOMParser().parseFromString(sHtml,"text/html"));}}catch(_){}}));}}}catch(_){}if(historyCourses.length===0&&currentCourses.length===0){alert("課務系統中尚未查詢到修課紀錄。若您為新生尚未選課，可直接在 CIM-Life 手動勾選課程！");return;}var payloadObj={current:currentCourses.length>0?currentCourses:historyCourses,history:historyCourses.length>0?historyCourses:currentCourses};var payload=encodeURIComponent(JSON.stringify(payloadObj));location.href="${targetUrl}"+String.fromCodePoint(35)+"cis_data="+payload;}catch(err){alert("同步發生錯誤："+err.message);}})();})()`;
  return `${BOOKMARKLET_URI_SCHEME}${scriptBody}`;
};

const BookmarkletInstructions = ({
  bookmarkletCode,
  onCopy,
}: Readonly<{
  bookmarkletCode: string;
  onCopy: () => void;
}>) => (
  <div style={{ fontSize: 13.5, color: "var(--ncu-ink)", lineHeight: 1.5 }}>
    <p style={{ margin: "0 0 14px", color: "var(--ncu-muted)", fontSize: 12.5 }}>
      拖曳按鈕到書籤列，再到 <a href="https://cis.ncu.edu.tw/Course/main/login" target="_blank" rel="noreferrer" style={{ color: "var(--ncu-primary)", fontWeight: 600 }}>課務系統 <IonIcon icon={openOutline} style={{ fontSize: 11, verticalAlign: "middle" }} /></a> 登入後點擊即可同步。
    </p>

    <div style={{ textAlign: "center", margin: "14px 0 10px" }}>
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

    <div style={{ textAlign: "center", marginBottom: 14 }}>
      <IonButton size="small" fill="clear" onClick={onCopy} style={{ fontSize: 12, color: "var(--ncu-muted)" }}>
        <IonIcon slot="start" icon={copyOutline} />
        或複製代碼
      </IonButton>
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
    const path = window.location.pathname || "/tools/credit";
    return `${window.location.origin}${path}`;
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
