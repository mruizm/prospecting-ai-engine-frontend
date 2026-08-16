import { Routes } from "@angular/router";
import { authGuard } from "./core/auth.guard";
import { AppShellComponent } from "./layout/app-shell.component";

export const routes: Routes = [
  { path: "login", loadComponent: () => import("./pages/login.component").then((module) => module.LoginComponent) },
  {
    path: "",
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: "", loadComponent: () => import("./pages/dashboard.component").then((module) => module.DashboardComponent), pathMatch: "full" },
      { path: "new", loadComponent: () => import("./pages/new-analysis.component").then((module) => module.NewAnalysisComponent) },
      { path: "analyses/:id", loadComponent: () => import("./pages/analysis-detail.component").then((module) => module.AnalysisDetailComponent) },
      { path: "analyses/:id/report", loadComponent: () => import("./pages/report.component").then((module) => module.ReportComponent) },
    ],
  },
  { path: "**", redirectTo: "" },
];
