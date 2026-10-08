export interface ParticleData {
  readonly id: number;
  readonly stage: number;
  readonly text: string;
  readonly side: "left" | "right";
  readonly sideOffset: number;
  readonly offsetY: number;
  readonly flyY: number;
  readonly driftX: number;
  readonly scale: number;
  readonly rotate: number;
  readonly duration: number;
}

export interface ModuleCard {
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
