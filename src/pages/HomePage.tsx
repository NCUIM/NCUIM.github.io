import { useState, useRef, useEffect, useCallback } from "react";
import { IonPage, useIonAlert } from "@ionic/react";
import {
  AnnouncementItem,
  BUILTIN_ANNOUNCEMENTS,
  fetchAnnouncements,
} from "../services/announcement-api";
import { CTF_CONFIG, isCtfEnded } from "../services/ctf-challenge";
import AnnouncementModal from "../components/announcements/AnnouncementModal";
import { FacultyQuizModal } from "../components/faculty/FacultyQuizModal";
import {
  HomeHeader,
  HomeBody,
  ParticleData,
  getStageIcon,
} from "../components/home";

const HomePage = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [announcements, setAnnouncements] = useState<readonly AnnouncementItem[]>(BUILTIN_ANNOUNCEMENTS);
  const [easterEggStage, setEasterEggStage] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [presentAlert] = useIonAlert();

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch latest announcements from GitHub (SWR)
  useEffect(() => {
    fetchAnnouncements().then((data) => {
      setAnnouncements(data || []);
    });
  }, []);

  const getCryptoRandom = (): number => {
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return arr[0] / 0x100000000;
    }
    return 0.5;
  };

  const addParticle = useCallback((stage: number, text: string) => {
    const side = getCryptoRandom() < 0.5 ? "left" : "right";
    const sideOffset = 8 + getCryptoRandom() * 20;
    const offsetY = -28 + getCryptoRandom() * 56;
    const flyY = -35 - getCryptoRandom() * 25;
    const driftX = (getCryptoRandom() - 0.5) * 18;
    const scale = 0.85 + getCryptoRandom() * 0.35;
    const rotate = (getCryptoRandom() - 0.5) * 14;
    const duration = 2.2 + getCryptoRandom() * 0.6; // 2.2s ~ 2.8s
    const id = Date.now() + getCryptoRandom();

    const newParticle: ParticleData = {
      id,
      stage,
      text,
      side,
      sideOffset,
      offsetY,
      flyY,
      driftX,
      scale,
      rotate,
      duration,
    };

    setParticles((prev) => [...prev.slice(-7), newParticle]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, duration * 1000 + 100);
  }, []);

  // DevTools console easter egg
  useEffect(() => {
    // skipcq: JS-0002
    console.log(
      "%c🚩 NCUIM 2026 CTF Challenge%c\nLooking for flags? Join the secret battlefield:\n👉 https://im2026ctf.duckdns.org/\nScoreboard: https://im2026ctf.duckdns.org/scoreboard",
      "color: #38bdf8; font-size: 16px; font-weight: bold; background: #0f172a; padding: 6px 12px; border-radius: 6px;",
      "color: #a855f7; font-size: 13px; font-family: monospace; font-weight: bold; margin-top: 4px;",
    );
  }, []);

  // Ambient floating particles after unlocking
  useEffect(() => {
    if (!isUnlocked) return;

    let timer: ReturnType<typeof setTimeout>;

    const spawnAmbientParticle = () => {
      const icons = isCtfEnded()
        ? ["🏆", "✨", "👑", "🔥", "⚡", "🌟"]
        : ["🚩", "⚡", "🔓", "🔥", "💥", "✨", "💎"];
      const icon = icons[Math.floor(getCryptoRandom() * icons.length)];
      addParticle(20, icon);

      const nextDelay = 700 + getCryptoRandom() * 900; // 0.7s ~ 1.6s
      timer = setTimeout(spawnAmbientParticle, nextDelay);
    };

    timer = setTimeout(spawnAmbientParticle, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [isUnlocked, addParticle]);

  const triggerEasterEgg = useCallback(() => {
    const ended = isCtfEnded();
    if (ended) {
      presentAlert({
        header: "🏁 2026 CTF 挑戰賽已圓滿結束！",
        subHeader: "NCUIM 2026 CTF 榮譽榜",
        message:
          "恭喜發現隱藏彩蛋！本次新生 CTF 挑戰賽已順利落幕，感謝所有熱情報名與解題的資管所夥伴！",
        buttons: [
          { text: "關閉", role: "cancel" },
          {
            text: "查看最終積分榜 🏆",
            handler: () => {
              window.open(CTF_CONFIG.scoreboardUrl, "_blank", "noopener,noreferrer");
            },
          },
        ],
      });
    } else {
      presentAlert({
        header: "🚩 秘密任務已解鎖！",
        subHeader: "NCUIM 2026 CTF 競技場",
        message:
          "恭喜發現隱藏彩蛋傳送門！自架 CTFd 靶場已上線，具體玩法與競賽規則已公布在網站上，準備好挑戰了嗎？",
        buttons: [
          { text: "稍後再來", role: "cancel" },
          {
            text: "前往 CTFd 戰場 🚀",
            handler: () => {
              window.open(CTF_CONFIG.activeUrl, "_blank", "noopener,noreferrer");
            },
          },
        ],
      });
    }
  }, [presentAlert]);

  const handleSecretTap = useCallback(() => {
    if (isUnlocked) {
      addParticle(20, getStageIcon(20));
      triggerEasterEgg();
      return;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    setEasterEggStage((prev) => {
      const next = prev + 1;
      addParticle(next, getStageIcon(next));

      if (next >= 20) {
        setIsUnlocked(true);
        setTimeout(() => {
          triggerEasterEgg();
        }, 400);
        return 20;
      }
      return next;
    });

    resetTimerRef.current = setTimeout(() => {
      setEasterEggStage(0);
    }, 2800);
  }, [isUnlocked, addParticle, triggerEasterEgg]);

  return (
    <IonPage>
      <HomeHeader onOpenQuiz={() => setShowQuizModal(true)} />
      <HomeBody
        stage={easterEggStage}
        isUnlocked={isUnlocked}
        particles={particles}
        announcements={announcements}
        hovered={hovered}
        onHover={setHovered}
        onLeave={() => setHovered(null)}
        onLogoClick={handleSecretTap}
        onOpenAnnouncements={() => setShowAnnouncements(true)}
      />
      <AnnouncementModal
        isOpen={showAnnouncements}
        announcements={announcements}
        onDismiss={() => setShowAnnouncements(false)}
      />
      <FacultyQuizModal
        isOpen={showQuizModal}
        onDismiss={() => setShowQuizModal(false)}
      />
    </IonPage>
  );
};

export default HomePage;
