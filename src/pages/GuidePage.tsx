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

const RESOURCE_CATEGORIES: readonly ResourceCategory[] = [
  {
    id: "academic",
    title: "教務與課務系統",
    subtitle: "選課、成績、數位學習與學籍管理必備入口",
    icon: schoolOutline,
    items: [
      {
        title: "NCU Portal 入口網",
        description: "校園單一登入入口 · 查成績、選課系統入口、學籍資料、繳費單查詢",
        url: "https://portal.ncu.edu.tw/",
        tag: "單一入口",
      },
      {
        title: "課務系統 (CIS)",
        description: "排課模擬、選課登記、即時選課清單與個人正式課表查詢",
        url: "https://cis.ncu.edu.tw/Course/main/login",
        tag: "選課排課",
      },
      {
        title: "新 ee-class 數位學習平台",
        description: "課程講義教材下載、作業繳交、平時成績查看與線上測驗",
        url: "https://ncueeclass.ncu.edu.tw/",
        tag: "課程平台",
      },
      {
        title: "2026 新生知訊網",
        description: "新生註冊引導、體檢時程、宿舍申請及各項入學行政指引",
        url: "https://ncufresh.ncu.edu.tw/",
        tag: "新生指南",
      },
      {
        title: "臺灣學術倫理教育資源中心",
        description: "碩士畢業口試必備門檻 · 線上完成 6 小時研習並取得修課證明",
        url: "https://ethics.moe.edu.tw/",
        tag: "畢業門檻",
      },
    ],
  },
  {
    id: "community",
    title: "校園生活與社群服務",
    subtitle: "活動報名、校外租屋、二手交流與學生社群討論區",
    icon: peopleOutline,
    items: [
      {
        title: "iNCU 學校活動報名系統",
        description: "全校講座、就業博覽會、企業參訪與學術工作坊線上報名",
        url: "https://cis.ncu.edu.tw/iNCU/messageNotice/activityManagement/activity",
        tag: "活動報名",
      },
      {
        title: "iNCU 整合服務首頁",
        description: "學校各項行政服務、校園公佈欄公告與即時重要通知整合",
        url: "https://cis.ncu.edu.tw/iNCU/home",
        tag: "校園行政",
      },
      {
        title: "雲端租屋生活網",
        description: "中大周邊校外租屋資訊、通過學校安全評鑑合格房東房源查詢",
        url: "https://house.nfu.edu.tw/NCU",
        tag: "校外租屋",
      },
      {
        title: "NCU TALK 臉書社團",
        description: "中央大學最大學生交流社群 · 尋物、選課評價與校園即時討論",
        url: "https://www.facebook.com/groups/NCUgroup/",
        tag: "學生社群",
      },
      {
        title: "復活福利社 (二手市集)",
        description: "校內二手教科書、家具家電、生活用品二手出清與轉讓",
        url: "https://www.facebook.com/groups/209055389218793/",
        tag: "二手交易",
      },
    ],
  },
  {
    id: "tech-dev",
    title: "計中與開發者資源",
    subtitle: "正版軟體下載、校外 VPN、圖書館資料庫與學生開發者福利",
    icon: codeSlashOutline,
    items: [
      {
        title: "計中校園授權軟體庫",
        description: "學校正版 Windows、Office、MATLAB、SPSS 等軟體免費下載",
        url: "https://software.ncu.edu.tw/",
        tag: "授權軟體",
      },
      {
        title: "校園 GlobalProtect VPN 連線設定",
        description: "校外連回校園內網 · 存取圖書館電子期刊、論文資料庫與研究室資源",
        url: "https://wiki.cc.ncu.edu.tw/",
        tag: "校外連線",
      },
      {
        title: "GitHub Student Developer Pack",
        description: "學生開發者大禮包 · 免費 GitHub Pro、GitHub Copilot 及雲端額度",
        url: "https://education.github.com/pack",
        tag: "開發福利",
      },
      {
        title: "JetBrains 免費學生專業版",
        description: "IntelliJ IDEA、PyCharm、WebStorm 等頂級 IDE 全套免費教育授權",
        url: "https://www.jetbrains.com/academy/student-pack/",
        tag: "IDE 授權",
      },
      {
        title: "中大圖書館館藏與電子資源",
        description: "學術論文、IEEE / ACM 期刊資料庫檢索、借還書與研討室預約",
        url: "https://www.lib.ncu.edu.tw/",
        tag: "學術館藏",
      },
    ],
  },
];

const GuidePage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>常用資源與新生導航</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "var(--ncu-canvas)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* Header Introduction */}
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

          {/* Categorized Resource Sections */}
          {RESOURCE_CATEGORIES.map((cat) => (
            <div key={cat.id} style={{ marginBottom: 28 }}>
              {/* Category Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                  padding: "0 4px",
                }}
              >
                <IonIcon
                  icon={cat.icon}
                  style={{ fontSize: 20, color: "var(--ncu-primary)" }}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 800,
                    color: "var(--ncu-ink)",
                  }}
                >
                  {cat.title}
                </h2>
              </div>
              <p
                style={{
                  margin: "0 0 10px 4px",
                  fontSize: 13,
                  color: "var(--ncu-muted)",
                }}
              >
                {cat.subtitle}
              </p>

              {/* Resource List */}
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
                  <IonItem
                    button
                    detail={false}
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      "--background": "var(--ncu-surface)",
                      cursor: "pointer",
                    }}
                  >
                    <IonLabel style={{ margin: "12px 0" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 4,
                        }}
                      >
                        <strong
                          style={{
                            fontSize: 15.5,
                            fontWeight: 700,
                            color: "var(--ncu-ink)",
                          }}
                        >
                          {item.title}
                        </strong>
                        {item.tag && (
                          <IonBadge
                            color="primary"
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 7px",
                              borderRadius: 4,
                            }}
                          >
                            {item.tag}
                          </IonBadge>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--ncu-muted)",
                          lineHeight: 1.4,
                          margin: 0,
                        }}
                      >
                        {item.description}
                      </p>
                    </IonLabel>
                    <IonIcon
                      icon={openOutline}
                      slot="end"
                      style={{
                        fontSize: 18,
                        color: "var(--ncu-muted)",
                        flexShrink: 0,
                        marginLeft: 10,
                      }}
                    />
                  </IonItem>
                ))}
              </IonList>
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuidePage;
