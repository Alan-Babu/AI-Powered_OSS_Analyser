import { Routes } from '@angular/router';
import { AuthGuard } from '../app/guard/auth.guard';
import { MainLayoutComponent } from '../app/layouts/main-layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from '../app/layouts/auth-layout/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
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
    ]
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'signin', loadComponent: () => import('../app/components/auth/signin/signin/signin.component').then(m => m.SigninComponent) },
      { path: 'signup', loadComponent: () => import('../app/components/auth/signup/signup/signup.component').then(m => m.SignupComponent) },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
