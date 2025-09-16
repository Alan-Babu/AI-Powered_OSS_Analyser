import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'repository-scan', loadComponent: () => import('./components/repository-scan/repository-scan.component').then(m => m.RepositoryScanComponent) },
  { path: 'risk-assessment', loadComponent: () => import('./components/risk-assessment/risk-assessment.component').then(m => m.RiskAssessmentComponent) },
  { path: 'vulnerability-scan', loadComponent: () => import('./components/vulnerability-scan/vulnerability-scan.component').then(m => m.VulnerabilityScanComponent) },
  { path: 'knowledge-graph', loadComponent: () => import('./components/knowledge-graph/knowledge-graph.component').then(m => m.KnowledgeGraphComponent) },
  { path: 'code-quality', loadComponent: () => import('./components/code-quality/code-quality.component').then(m => m.CodeQualityComponent) },
  { path: 'scan-history', loadComponent: () => import('./components/scan-history/scan-history.component').then(m => m.ScanHistoryComponent) },
  { path: 'ai-chatbot', loadComponent: () => import('./components/chatbot/chatbot.component').then(m => m.ChatbotComponent) },
  { path: 'gamified-debugger', loadComponent: () => import('./components/gamified-debugger/gamified-debugger.component').then(m => m.GamifiedDebuggerComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
