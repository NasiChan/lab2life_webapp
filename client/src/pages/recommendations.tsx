import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Pill,
  Apple,
  Dumbbell,
  Sparkles,
  FileText,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { Recommendation } from "@shared/schema";

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  supplement: {
    icon: Pill,
    label: "Supplement",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  dietary: {
    icon: Apple,
    label: "Dietary",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  physical: {
    icon: Dumbbell,
    label: "Physical Activity",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "High Priority", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "Medium Priority", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  low: { label: "Low Priority", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const typeInfo = typeConfig[recommendation.type] || typeConfig.supplement;
  const priorityInfo = priorityConfig[recommendation.priority] || priorityConfig.medium;
  const Icon = typeInfo.icon;
  const actionItems = recommendation.actionItems as string[] || [];

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-md p-2 ${typeInfo.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{recommendation.title}</CardTitle>
              {recommendation.relatedMarker && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Related to: {recommendation.relatedMarker}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge className={priorityInfo.color} variant="secondary">
            {priorityInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{recommendation.description}</p>
        
        {actionItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Action Items:</h4>
            <ul className="space-y-2">
              {actionItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
      <p className="text-muted-foreground max-w-md mb-4">
        Upload your lab results to receive personalized supplement, dietary, and
        physical activity recommendations based on your health markers.
      </p>
      <Button asChild>
        <Link href="/lab-results">
          <FileText className="h-4 w-4 mr-2" />
          Upload Lab Results
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
}

export default function Recommendations() {
  const { data: recommendations, isLoading } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <Skeleton className="h-12 w-96" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const supplementRecs = recommendations?.filter((r) => r.type === "supplement") || [];
  const dietaryRecs = recommendations?.filter((r) => r.type === "dietary") || [];
  const physicalRecs = recommendations?.filter((r) => r.type === "physical") || [];

  const hasRecommendations = recommendations && recommendations.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-recommendations-title">
          Recommendations
        </h1>
        <p className="text-muted-foreground">
          Personalized health suggestions based on your lab results
        </p>
      </div>

      {!hasRecommendations ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all" data-testid="tab-all-recommendations">
              All ({recommendations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="supplement" data-testid="tab-supplement-recommendations">
              <Pill className="h-4 w-4 mr-1" />
              Supplements ({supplementRecs.length})
            </TabsTrigger>
            <TabsTrigger value="dietary" data-testid="tab-dietary-recommendations">
              <Apple className="h-4 w-4 mr-1" />
              Dietary ({dietaryRecs.length})
            </TabsTrigger>
            <TabsTrigger value="physical" data-testid="tab-physical-recommendations">
              <Dumbbell className="h-4 w-4 mr-1" />
              Physical ({physicalRecs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations?.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="supplement">
            {supplementRecs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Pill className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No supplement recommendations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {supplementRecs.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dietary">
            {dietaryRecs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Apple className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No dietary recommendations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {dietaryRecs.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="physical">
            {physicalRecs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No physical activity recommendations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {physicalRecs.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {hasRecommendations && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              These recommendations are suggestions based on your lab results.
              Always consult with a healthcare professional before starting any new
              supplement, diet, or exercise program.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
