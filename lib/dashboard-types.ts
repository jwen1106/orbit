import type { Competency } from '@/types';

export const DASHBOARD_NOT_AVAILABLE = 'Not available';

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
  teamName: string;
  overallScore: number | null;
  maturityLabel: string;
  hasFullAnalysis: boolean;
  hasSurveyData: boolean;
  aiSummary: string;
  quickWins: DashboardStrength[];
  oaklinSupport: DashboardStrength[];
  competencyBreakdown: DetailedCompetencyBreakdown[];
  radarAvailable: boolean;
  radarOverall: Record<Competency, number> | null;
  radarManager: Record<Competency, number> | null;
  radarMember: Record<Competency, number> | null;
}
