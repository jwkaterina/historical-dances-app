export interface Dance {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  description: string | null
  description_de: string | null
  description_ru: string | null
  scheme: string | null
  scheme_de: string | null
  scheme_ru: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
  origin: string | null
  created_at: string
}

export interface DanceVideo {
  id: string
  dance_id: string
  video_type: 'youtube' | 'uploaded'
  url: string
  order_index: number
}

export interface DanceFigure {
  id: string
  dance_id: string
  scheme_de: string | null
  scheme_ru: string | null
  order_index: number
  figure_videos?: FigureVideo[]
}

export interface FigureVideo {
  id: string
  figure_id: string
  video_type: 'youtube' | 'uploaded'
  url: string
  order_index: number
}

export interface MusicTrack {
  id: string
  title: string
  artist: string | null
  tempo: number | null
  genre: string | null
  audio_url: string | null
  created_at: string
}

export interface DanceWithDetails extends Dance {
  dance_videos: DanceVideo[]
  dance_figures: DanceFigure[]
  dance_music: { music: MusicTrack }[]
  dance_tutorials: { tutorials: Tutorial }[]
}

export interface Ball {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  date: string
  place: string | null
  place_de: string | null
  place_ru: string | null
  info_de: string | null
  info_ru: string | null
  created_at: string
  user_id: string | null
}

export interface BallSection {
  id: string
  ball_id: string
  name: string
  name_de: string | null
  name_ru: string | null
  order_index: number
  section_dances: SectionDance[]
  section_texts: SectionText[]
}

export interface SectionDance {
  id: string
  section_id: string
  dance_id: string
  order_index: number
  music_ids: string[] | null
  dances: Pick<Dance, 'id' | 'name' | 'name_de' | 'name_ru' | 'difficulty'> | null
}

export interface SectionText {
  id: string
  section_id: string
  order_index: number
  content_de: string
  content_ru: string
}

export interface BallWithSections extends Ball {
  ball_sections: BallSection[]
}

export interface TutorialCategory {
  id: string
  name_de: string
  name_ru: string
  created_at: string
}

export interface Tutorial {
  id: string
  title_de: string
  title_ru: string
  type: 'video' | 'pdf' | 'image'
  video_type: 'youtube' | 'uploaded' | null
  url: string
  category_id: string | null
  created_at: string
  tutorial_categories?: TutorialCategory | null
}

export type SectionEntry =
  | { kind: 'dance'; order_index: number; danceId: string; musicIds?: string[] }
  | { kind: 'text'; order_index: number; content_de: string; content_ru: string }

export interface SectionFormData {
  id?: string
  name_de: string
  name_ru: string
  entries: SectionEntry[]
}
