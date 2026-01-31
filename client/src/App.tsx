import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HealthProfileModal } from "@/components/health-profile-modal";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PillPlanner from "@/pages/pill-planner";
import LabResults from "@/pages/lab-results";
import Medications from "@/pages/medications";
import Supplements from "@/pages/supplements";
import Recommendations from "@/pages/recommendations";
import Reminders from "@/pages/reminders";
import Interactions from "@/pages/interactions";
import Profile from "@/pages/profile";
import type { User } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/planner" component={PillPlanner} />
      <Route path="/lab-results" component={LabResults} />
      <Route path="/medications" component={Medications} />
      <Route path="/supplements" component={Supplements} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/reminders" component={Reminders} />
      <Route path="/interactions" component={Interactions} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function shouldShowHealthOnboarding(user: User | undefined): boolean {
  if (!user) return false;
  const status = user.healthProfileStatus || { isComplete: false };
  if (status.isComplete) return false;
  if (status.skippedAt) return false;
  return true;
}

function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/me"],
  });

  useEffect(() => {
    if (!isLoading && user && shouldShowHealthOnboarding(user)) {
      setShowOnboarding(true);
    }
  }, [user, isLoading]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto custom-scrollbar">
            <Router />
          </main>
        </div>
      </div>
      <HealthProfileModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="lab2life-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
