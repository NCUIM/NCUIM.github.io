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

export interface QuizQuestion {
  readonly teacher: TeacherProfile;
  readonly options: readonly TeacherProfile[];
  readonly clues: {
    readonly specialties: readonly string[];
    readonly education: string;
    readonly office: string;
  };
}
