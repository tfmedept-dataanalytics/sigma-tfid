'use client';

import { OrgMap, OrgRepo, OrgQuarterly, OrgAnnual, OrgAnalytics } from './org';
import { PpStructure, PpRepo, PpQuarterly, PpAnnual, PpPortfolio } from './ppi';
import { AnOverview, AnTrend, AnTargetActual, AnHeatmap, AnCompare, AnRanking, AnRisk, AnDrill, AnPathway } from './analytics';
import { AiSummary, AiAsk, AiInterpret, AiRootCause, AiForecast, AiRecommend, AiNarrative } from './ai';
import { RpQuarterly, RpAnnual, RpExecutive, RpProgram, RpCustom } from './report';
import { WfMyTasks, WfReview, WfValidation, WfApproval, WfReturned } from './workflow';
import { AdRoles, AdOrg, AdProgram, AdMasterData, AdWorkflowCfg, AdSystemCfg, AdNotification, AdAudit } from './admin';
import { MdIndicators, MdYears } from './manage';

export const VIEWS = {
  'org-map': OrgMap, 'org-kpi': OrgRepo, 'org-qu': OrgQuarterly,
  'org-ann': OrgAnnual, 'org-an': OrgAnalytics,

  'pp-str': PpStructure, 'pp-ind': PpRepo, 'pp-qu': PpQuarterly,
  'pp-ann': PpAnnual, 'pp-an': PpPortfolio,

  'md-ind': MdIndicators, 'md-yr': MdYears,

  'an-ov': AnOverview, 'an-tr': AnTrend, 'an-tva': AnTargetActual, 'an-hm': AnHeatmap,
  'an-cmp': AnCompare, 'an-rank': AnRanking, 'an-risk': AnRisk, 'an-dd': AnDrill,
  'an-path': AnPathway,

  'ai-sum': AiSummary, 'ai-ask': AiAsk, 'ai-int': AiInterpret, 'ai-rca': AiRootCause,
  'ai-fc': AiForecast, 'ai-rec': AiRecommend, 'ai-nar': AiNarrative,

  'rp-q': RpQuarterly, 'rp-a': RpAnnual, 'rp-e': RpExecutive, 'rp-p': RpProgram, 'rp-c': RpCustom,

  'wf-my': WfMyTasks, 'wf-rev': WfReview, 'wf-val': WfValidation,
  'wf-app': WfApproval, 'wf-ret': WfReturned,

  'ad-role': AdRoles, 'ad-org': AdOrg, 'ad-prg': AdProgram, 'ad-md': AdMasterData,
  'ad-wf': AdWorkflowCfg, 'ad-cfg': AdSystemCfg, 'ad-not': AdNotification, 'ad-aud': AdAudit
};

export default function ViewHost({ id, ...props }) {
  const C = VIEWS[id];
  if (!C) return null;
  return <C {...props} />;
}
