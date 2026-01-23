export interface Task {
  id: string
  title: string
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
}

export interface MilestoneDates {
  releaseDates: string[]           // リリース日（複数）
  releaseJudgmentDates: string[]   // リリース判定日（複数）
}

export const taskBarColor = '#EAB308' // 濃い黄色

export const milestoneColors = {
  releaseDate: '#EF4444',        // 赤
  releaseJudgmentDate: '#22C55E', // 緑
}
