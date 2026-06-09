import type { Competency } from '@/types';

export const DASHBOARD_NOT_AVAILABLE = 'Not available';

// ── Per-question breakdown ──────────────────────────────────────────────────
export interface QuestionBreakdown {
  questionId: string;
  questionText: string;
  questionSubtext?: string;
  competency: Competency;
  order: number;
  /** Criteria descriptions keyed by score level "1"–"5" */
  criteria: Record<string, string>;
  overallScore: number | null;
  managerScore: number | null;
  memberScore: number | null;
  respondentCount: number;
  managerCount: number;
  memberCount: number;
  /** manager − member (positive = manager rates higher) */
  delta: number | null;
  overallDistribution: ScoreDistributionItem[];
  managerDistribution: ScoreDistributionItem[];
  memberDistribution: ScoreDistributionItem[];
  /** criteria label matching manager's rounded average score */
  managerCriteriaLabel: string | null;
  /** criteria label matching member's rounded average score */
  memberCriteriaLabel: string | null;
}

export interface DashboardStrength {
  title: string;
  description: string;
}

export interface DashboardPillar {
  competency: Competency;
  score: number | null;
  keyMetric: string;
  actions: { title: string; description: string }[];
}

export interface EngagementDashboardData {
  engagementId: string;
  teamName: string;
  orgName: string;
  overallScore: number | null;
  maturityLabel: string;
  strengths: DashboardStrength[];
  opportunities: DashboardStrength[];
  pillars: DashboardPillar[];
  hasFullAnalysis: boolean;
  hasSurveyData: boolean;
}

export interface ScoreDistributionItem {
  level: number;
  pct: number | null;
}

export interface DetailedCompetencyBreakdown {
  competency: Competency;
  score: number | null;
  managerScore: number | null;
  memberScore: number | null;
  industryAverage: number | null;
  bestInClass: number | null;
  delta: number | null;
  respondentCount: number;
  distribution: ScoreDistributionItem[];
  aiInsight: string;
  quickWin: { title: string; description: string } | null;
  oaklinSupport: { title: string; description: string } | null;
}

export interface DetailedAnalysisData {
  engagementId: string;
  engagementTitle: string;
  teamName: string;
  overallScore: number | null;
  maturityLabel: string;
  hasFullAnalysis: boolean;
  hasSurveyData: boolean;
  aiSummary: string;
  quickWins: DashboardStrength[];
  oaklinSupport: DashboardStrength[];
  competencyBreakdown: DetailedCompetencyBreakdown[];
  /** Per-question breakdowns, sorted by competency then question order */
  questionBreakdowns: QuestionBreakdown[];
  radarAvailable: boolean;
  radarOverall: Record<Competency, number> | null;
  radarManager: Record<Competency, number> | null;
  radarMember: Record<Competency, number> | null;
}
