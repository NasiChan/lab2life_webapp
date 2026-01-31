import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  Pill,
  Apple,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Link } from "wouter";
import type { Interaction, Medication, Supplement } from "@shared/schema";

const severityConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  severe: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Severe",
  },
  moderate: {
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Moderate",
  },
  mild: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Mild",
  },
};

function InteractionCard({
  interaction,
  medication,
  supplement,
}: {
  interaction: Interaction;
  medication?: Medication;
  supplement?: Supplement;
}) {
  const config = severityConfig[interaction.severity] || severityConfig.mild;
  const SeverityIcon = config.icon;

  const severityColors: Record<string, string> = {
    severe: "bg-red-500",
    moderate: "bg-amber-500",
    mild: "bg-blue-500",
  };

  return (
    <Card className="hover-elevate overflow-hidden" data-testid={`card-interaction-${interaction.id}`}>
      <div className={`h-1 w-full ${severityColors[interaction.severity] || severityColors.mild}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-md p-2 ${config.bgColor}`}>
              <SeverityIcon className={`h-5 w-5 ${config.color}`} />
            </div>
            <Badge className={`${config.bgColor} ${config.color}`} variant="secondary">
              {config.label} Interaction
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
            <Pill className="h-4 w-4 text-primary" />
            <span className="font-medium">{medication?.name || "Unknown Medication"}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
            <Apple className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="font-medium">{supplement?.name || "Unknown Supplement"}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-1">What happens:</h4>
          <p className="text-sm text-muted-foreground">{interaction.description}</p>
        </div>

        <Separator />

        <div className="rounded-md bg-muted/50 p-3">
          <div className="flex items-start gap-2">
            <Stethoscope className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <h4 className="text-sm font-medium mb-1">Recommendation:</h4>
              <p className="text-sm text-muted-foreground">{interaction.recommendation}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NoInteractionsState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
          <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-medium mb-2 text-green-600 dark:text-green-400">
          No Interactions Found
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Based on your current medications and supplements, we haven't detected any
          potential interactions. Keep your lists updated for accurate checking.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/medications">
              <Pill className="h-4 w-4 mr-2" />
              View Medications
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/supplements">
              <Apple className="h-4 w-4 mr-2" />
              View Supplements
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyListsState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Add Items to Check</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Add your medications and supplements to automatically check for potential
          interactions between them.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/medications">
              <Pill className="h-4 w-4 mr-2" />
              Add Medications
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/supplements">
              <Apple className="h-4 w-4 mr-2" />
              Add Supplements
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Interactions() {
  const { toast } = useToast();

  const { data: interactions, isLoading: loadingInteractions } = useQuery<Interaction[]>({
    queryKey: ["/api/interactions"],
  });

  const { data: medications, isLoading: loadingMeds } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: supplements, isLoading: loadingSupps } = useQuery<Supplement[]>({
    queryKey: ["/api/supplements"],
  });

  const checkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/interactions/check");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      toast({
        title: "Check complete",
        description: "Interaction check has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Check failed",
        description: "Could not complete the interaction check. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isLoading = loadingInteractions || loadingMeds || loadingSupps;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const activeMeds = medications?.filter((m) => m.active) || [];
  const activeSupps = supplements?.filter((s) => s.active) || [];
  const hasItems = activeMeds.length > 0 || activeSupps.length > 0;

  const getMedication = (id: number | null) =>
    medications?.find((m) => m.id === id);
  const getSupplement = (id: number | null) =>
    supplements?.find((s) => s.id === id);

  const severeInteractions = interactions?.filter((i) => i.severity === "severe") || [];
  const moderateInteractions = interactions?.filter((i) => i.severity === "moderate") || [];
  const mildInteractions = interactions?.filter((i) => i.severity === "mild") || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-interactions-title">
            Interaction Checker
          </h1>
          <p className="text-muted-foreground">
            Check for potential conflicts between medications and supplements
          </p>
        </div>
        {hasItems && (
          <Button
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
            data-testid="button-check-interactions"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checkMutation.isPending ? "animate-spin" : ""}`} />
            {checkMutation.isPending ? "Checking..." : "Check Interactions"}
          </Button>
        )}
      </div>

      {!hasItems ? (
        <EmptyListsState />
      ) : interactions && interactions.length === 0 ? (
        <NoInteractionsState />
      ) : (
        <div className="space-y-6">
          {severeInteractions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Severe Interactions ({severeInteractions.length})
              </h2>
              <div className="space-y-4">
                {severeInteractions.map((interaction) => (
                  <InteractionCard
                    key={interaction.id}
                    interaction={interaction}
                    medication={getMedication(interaction.medicationId)}
                    supplement={getSupplement(interaction.supplementId)}
                  />
                ))}
              </div>
            </div>
          )}

          {moderateInteractions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Moderate Interactions ({moderateInteractions.length})
              </h2>
              <div className="space-y-4">
                {moderateInteractions.map((interaction) => (
                  <InteractionCard
                    key={interaction.id}
                    interaction={interaction}
                    medication={getMedication(interaction.medicationId)}
                    supplement={getSupplement(interaction.supplementId)}
                  />
                ))}
              </div>
            </div>
          )}

          {mildInteractions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Mild Interactions ({mildInteractions.length})
              </h2>
              <div className="space-y-4">
                {mildInteractions.map((interaction) => (
                  <InteractionCard
                    key={interaction.id}
                    interaction={interaction}
                    medication={getMedication(interaction.medicationId)}
                    supplement={getSupplement(interaction.supplementId)}
                  />
                ))}
              </div>
            </div>
          )}

          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground text-center">
                This interaction checker provides general guidance. Always consult with a
                pharmacist or healthcare professional about potential drug interactions.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
