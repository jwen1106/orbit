import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'oaklin_admin' | 'team_manager';
export type OfficeFunction = 'back' | 'middle' | 'front';
export type Competency = 'people_relationships' | 'growth_impact' | 'purpose_alignment';
export type EngagementStatus = 'draft' | 'active' | 'closed' | 'analysed';
export type RespondentRole = 'manager' | 'member';
export type RespondentStatus = 'invited' | 'in_progress' | 'completed';
export type ActionStatus = 'not_started' | 'in_progress' | 'complete';
export type Timeframe = 'short_term' | 'long_term';

export interface OUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organisationId: string | null;
  createdAt: Timestamp;
  invitedBy: string | null;
}

export interface Organisation {
  id: string;
  name: string;
  industry: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Team {
  id: string;
  organisationId: string;
  name: string;
  function: OfficeFunction;
  size: number;
  managerId: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Engagement {
  id: string;
  title?: string;
  teamId: string;
  organisationId: string;
  status: EngagementStatus;
  memberShareToken: string;
  managerSurveyToken: string;
  questionSetVersion: string;
  createdAt: Timestamp;
  activatedAt: Timestamp | null;
  closedAt: Timestamp | null;
  analysedAt: Timestamp | null;
  createdBy: string;
}

export interface Respondent {
  id: string;
  engagementId: string;
  role: RespondentRole;
  name: string;
  email: string | null;
  inviteToken: string;
  accessMethod: 'email_invite' | 'shared_link';
  status: RespondentStatus;
  invitedAt: Timestamp | null;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

export interface SurveyResponse {
  questionId: string;
  score: number;
  answeredAt: Timestamp;
}

export interface Question {
  id: string;
  version: string;
  competency: Competency;
  role: RespondentRole | 'both';
  order: number;
  text: string;
  subtext?: string;
  criteria: Record<string, string>;
  isActive: boolean;
  /** Empty array = global (shown to all organisations). Populated = restricted to listed orgs. */
  assignedOrganisationIds: string[];
}

export interface CompetencyScores {
  people_relationships: number;
  growth_impact: number;
  purpose_alignment: number;
}

export interface BenchmarkScore {
  score: number;
  industryAverage: number;
  bestInClass: number;
  delta: number;
}

export interface Insights {
  engagementId: string;
  teamId: string;
  organisationId: string;
  competencyScores: CompetencyScores;
  managerScores: CompetencyScores;
  memberScores: CompetencyScores;
  respondentCount: { manager: number; member: number };
  aiSummary: string;
  keyStrengths: string[];
  quickWins: { title: string; description: string }[];
  strategicInitiatives: { title: string; description: string }[];
  benchmarkComparison: Record<Competency, BenchmarkScore>;
  generatedAt: Timestamp;
  modelVersion: string;
}

export interface ActionItem {
  id: string;
  engagementId: string;
  teamId: string;
  organisationId: string;
  title: string;
  description: string;
  competency: Competency;
  timeframe: Timeframe;
  priority: number;
  status: ActionStatus;
  assignedTo: string;
  dueDate: Timestamp | null;
  source: 'ai_generated' | 'manual';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BenchmarkEntry {
  industryAverage: number;
  bestInClass: number;
}

export interface Benchmark {
  id: string;
  industry: string;
  function: OfficeFunction;
  sizeRange: string;
  competencyScores: Record<Competency, BenchmarkEntry>;
  source: 'oaklin_authored' | 'ai_supplemented';
  updatedAt: Timestamp;
  updatedBy: string;
}

export const COMPETENCY_LABELS: Record<Competency, string> = {
  people_relationships: 'People & Relationships',
  growth_impact: 'Growth & Impact',
  purpose_alignment: 'Purpose & Alignment',
};

export const COMPETENCY_ICONS: Record<Competency, string> = {
  people_relationships: '??',
  growth_impact: '??',
  purpose_alignment: '??',
};

export const INDUSTRIES = [
  'Aerospace & Defence',
  'Automotive',
  'Energy',
  'Financial Services',
  'Government & Public Sector',
  'Healthcare',
  'Infrastructure',
  'Pharmaceuticals',
  'Property & Construction',
  'Retail',
  'Technology',
  'Transport',
  'Water',
  'Other',
] as const;

export const QUESTION_SET_VERSION = 'v1';

export const SIZE_RANGES = ['1-10', '11-25', '26-50', '51+'] as const;
