import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  FileText,
  Pill,
  Apple,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Sparkles,
  Clock,
  Calendar,
} from "lucide-react";
import type { LabResult, HealthMarker, Medication, Supplement, Recommendation, Reminder } from "@shared/schema";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover-elevate cursor-pointer transition-all">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="rounded-md bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                {trend === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MarkerStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    low: { variant: "destructive", label: "Low" },
    normal: { variant: "secondary", label: "Normal" },
    high: { variant: "destructive", label: "High" },
  };
  const config = variants[status] || variants.normal;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function RecentMarkersCard({ markers }: { markers: HealthMarker[] }) {
  const abnormalMarkers = markers.filter((m) => m.status !== "normal").slice(0, 5);
  
  if (abnormalMarkers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Health Markers
          </CardTitle>
          <CardDescription>Your vitamin and nutrient levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-green-600 dark:text-green-400">All markers in normal range!</p>
            <p className="mt-1 text-sm text-muted-foreground">Keep up the great work</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Attention Needed
        </CardTitle>
        <CardDescription>Markers outside normal range</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {abnormalMarkers.map((marker) => (
            <div key={marker.id} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{marker.name}</span>
                  <MarkerStatusBadge status={marker.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {marker.value} {marker.unit} 
                  <span className="ml-1 text-xs">
                    (normal: {marker.normalMin}-{marker.normalMax} {marker.unit})
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsPreview({ recommendations }: { recommendations: Recommendation[] }) {
  const recentRecs = recommendations.slice(0, 3);

  if (recentRecs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommendations
          </CardTitle>
          <CardDescription>Personalized health suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No recommendations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload lab results to get started</p>
            <Button asChild className="mt-4">
              <Link href="/lab-results">
                Upload Lab Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const typeIcons: Record<string, React.ElementType> = {
    supplement: Pill,
    dietary: Apple,
    physical: TrendingUp,
  };

  const priorityColors: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-green-500",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommendations
          </CardTitle>
          <CardDescription>Personalized health suggestions</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/recommendations">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentRecs.map((rec) => {
            const Icon = typeIcons[rec.type] || Sparkles;
            return (
              <div key={rec.id} className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{rec.title}</span>
                    <div className={`h-2 w-2 rounded-full ${priorityColors[rec.priority]}`} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingReminders({ reminders }: { reminders: Reminder[] }) {
  const enabledReminders = reminders.filter((r) => r.enabled).slice(0, 4);

  if (enabledReminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Reminders
          </CardTitle>
          <CardDescription>Your daily schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No reminders set</p>
            <Button variant="outline" size="sm" asChild className="mt-3">
              <Link href="/reminders">Add Reminder</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Reminders
          </CardTitle>
          <CardDescription>Your daily schedule</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reminders">
            Manage
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {enabledReminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
              <div className="text-lg font-semibold text-primary">{reminder.time}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{reminder.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{reminder.type}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: labResults, isLoading: loadingLabs } = useQuery<LabResult[]>({
    queryKey: ["/api/lab-results"],
  });

  const { data: markers, isLoading: loadingMarkers } = useQuery<HealthMarker[]>({
    queryKey: ["/api/health-markers"],
  });

  const { data: medications, isLoading: loadingMeds } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: supplements, isLoading: loadingSupps } = useQuery<Supplement[]>({
    queryKey: ["/api/supplements"],
  });

  const { data: recommendations, isLoading: loadingRecs } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
  });

  const { data: reminders, isLoading: loadingReminders } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const { data: interactions, isLoading: loadingInteractions } = useQuery<{ id: number }[]>({
    queryKey: ["/api/interactions"],
  });

  const isLoading = loadingLabs || loadingMarkers || loadingMeds || loadingSupps || loadingRecs || loadingReminders || loadingInteractions;

  const activeMeds = medications?.filter((m) => m.active) || [];
  const activeSupps = supplements?.filter((s) => s.active) || [];
  const abnormalMarkers = markers?.filter((m) => m.status !== "normal") || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Welcome to Lab2Life
        </h1>
        <p className="text-muted-foreground">
          Your personal health management dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Lab Results"
          value={labResults?.length || 0}
          description="Uploaded documents"
          icon={FileText}
          href="/lab-results"
        />
        <StatCard
          title="Medications"
          value={activeMeds.length}
          description="Active medications"
          icon={Pill}
          href="/medications"
        />
        <StatCard
          title="Supplements"
          value={activeSupps.length}
          description="Current supplements"
          icon={Apple}
          href="/supplements"
        />
        <StatCard
          title="Interactions"
          value={interactions?.length || 0}
          description={interactions?.length ? "Potential conflicts" : "No conflicts found"}
          icon={AlertTriangle}
          trend={interactions?.length ? "down" : "neutral"}
          href="/interactions"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentMarkersCard markers={markers || []} />
        <RecommendationsPreview recommendations={recommendations || []} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingReminders reminders={reminders || []} />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your health</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/planner">
                <Calendar className="h-5 w-5" />
                <span>Open Pill Planner</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/lab-results">
                <FileText className="h-5 w-5" />
                <span>Upload Lab Results</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/medications">
                <Pill className="h-5 w-5" />
                <span>Add Medication</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/interactions">
                <AlertTriangle className="h-5 w-5" />
                <span>Check Interactions</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
