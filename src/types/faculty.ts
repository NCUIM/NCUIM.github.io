export interface TeacherProfile {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly role?: string;
  readonly photoUrl: string;
  readonly localPhotoUrl: string;
  readonly education: string;
  readonly specialty: string;
  readonly specialtyTags: readonly string[];
  readonly office: string;
  readonly email: string;
}

export interface MemeItem {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly localPhotoUrl: string;
}

export type QuizTarget =
  | { readonly type: "teacher"; readonly data: TeacherProfile }
  | { readonly type: "meme"; readonly data: MemeItem };

export interface QuizQuestion {
  readonly teacher: TeacherProfile;
  readonly options: readonly TeacherProfile[];
  readonly clues: {
    readonly specialties: readonly string[];
    readonly education: string;
    readonly office: string;
  };
}

