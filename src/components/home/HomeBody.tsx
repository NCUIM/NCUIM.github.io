import React from "react";
import { IonContent } from "@ionic/react";
import type { ParticleData } from "./types";
import type { AnnouncementItem } from "../../services/announcement-api";
import { HeroHeader } from "./HeroHeader";
import { AnnouncementBar } from "./AnnouncementBar";
import { HomeModuleList } from "./HomeModuleList";
import { HomeFooter } from "./HomeFooter";

export const HomeBody = ({
  stage,
  isUnlocked,
  particles,
  announcements,
  hovered,
  onHover,
  onLeave,
  onLogoClick,
  onOpenAnnouncements,
}: Readonly<{
  stage: number;
  isUnlocked: boolean;
  particles: readonly ParticleData[];
  announcements: readonly AnnouncementItem[];
  hovered: string | null;
  onHover: (route: string) => void;
  onLeave: () => void;
  onLogoClick: () => void;
  onOpenAnnouncements: () => void;
}>) => (
  <IonContent className="ion-padding">
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <HeroHeader
        stage={stage}
        isUnlocked={isUnlocked}
        particles={particles}
        onLogoClick={onLogoClick}
      />
      <AnnouncementBar announcements={announcements} onOpen={onOpenAnnouncements} />
      <HomeModuleList hovered={hovered} onHover={onHover} onLeave={onLeave} />
      <HomeFooter />
    </div>
  </IonContent>
);
