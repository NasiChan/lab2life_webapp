import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Trash2,
  Eye,
  Plus,
} from "lucide-react";
import type { LabResult, HealthMarker } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
    processing: { variant: "secondary", icon: Loader2 },
    completed: { variant: "default", icon: CheckCircle },
    error: { variant: "destructive", icon: XCircle },
  };
  const { variant, icon: Icon } = config[status] || config.processing;
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
      <span className="capitalize">{status}</span>
    </Badge>
  );
}

function MarkerCard({ marker }: { marker: HealthMarker }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "low":
        return TrendingDown;
      case "high":
        return TrendingUp;
      default:
        return Minus;
    }
  };

  const StatusIcon = getStatusIcon(marker.status);
  const normalMin = Number(marker.normalMin);
  const normalMax = Number(marker.normalMax);
  const value = Number(marker.value);
  
  const range = normalMax - normalMin;
  const position = range > 0 ? Math.min(100, Math.max(0, ((value - normalMin + range * 0.25) / (range * 1.5)) * 100)) : 50;

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-medium">{marker.name}</h4>
          <p className="text-xs text-muted-foreground capitalize">{marker.category}</p>
        </div>
        <div className={`rounded-md p-1.5 ${getStatusColor(marker.status)}`}>
          <StatusIcon className="h-4 w-4" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{marker.value}</span>
          <span className="text-sm text-muted-foreground">{marker.unit}</span>
        </div>
        
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-1/4 w-1/2 h-full bg-green-200 dark:bg-green-800"
          />
          <div
            className="absolute top-0 h-full w-1 bg-foreground rounded-full transition-all"
            style={{ left: `calc(${position}% - 2px)` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{normalMin} {marker.unit}</span>
          <span className="text-center">Normal Range</span>
          <span>{normalMax} {marker.unit}</span>
        </div>
      </div>
    </div>
  );
}

function LabResultCard({
  result,
  markers,
  onDelete,
}: {
  result: LabResult;
  markers: HealthMarker[];
  onDelete: (id: number) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const resultMarkers = markers.filter((m) => m.labResultId === result.id);
  const abnormalCount = resultMarkers.filter((m) => m.status !== "normal").length;

  return (
    <>
      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{result.fileName}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(result.uploadDate).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={result.status} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Markers: </span>
                <span className="font-medium">{resultMarkers.length}</span>
              </div>
              {abnormalCount > 0 && (
                <div className="text-amber-600 dark:text-amber-400">
                  <span className="font-medium">{abnormalCount}</span> need attention
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(true)}
                disabled={result.status !== "completed"}
                data-testid={`button-view-result-${result.id}`}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(result.id)}
                data-testid={`button-delete-result-${result.id}`}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{result.fileName}</DialogTitle>
            <DialogDescription>
              Uploaded on {new Date(result.uploadDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="markers" className="mt-4">
            <TabsList>
              <TabsTrigger value="markers">Health Markers ({resultMarkers.length})</TabsTrigger>
              <TabsTrigger value="abnormal">
                Needs Attention ({abnormalCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="markers" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {resultMarkers.map((marker) => (
                    <MarkerCard key={marker.id} marker={marker} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="abnormal" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {abnormalCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                    <p className="font-medium text-green-600 dark:text-green-400">
                      All markers are within normal range!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {resultMarkers
                      .filter((m) => m.status !== "normal")
                      .map((marker) => (
                        <MarkerCard key={marker.id} marker={marker} />
                      ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UploadSection() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/lab-results/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-markers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Upload successful",
        description: "Your lab results are being processed. This may take a moment.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      await uploadMutation.mutateAsync(file);
      setUploadProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Upload Lab Results</h3>
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
          Upload your bloodwork results (PDF or image) and our AI will extract key
          health markers and provide personalized recommendations.
        </p>

        {isUploading ? (
          <div className="w-full max-w-xs space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {uploadProgress < 100 ? "Uploading..." : "Processing..."}
            </p>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              data-testid="button-upload-file"
            >
              <Plus className="h-4 w-4 mr-2" />
              Select File
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Supported formats: PDF, PNG, JPG
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function LabResults() {
  const { toast } = useToast();

  const { data: labResults, isLoading: loadingResults } = useQuery<LabResult[]>({
    queryKey: ["/api/lab-results"],
  });

  const { data: markers, isLoading: loadingMarkers } = useQuery<HealthMarker[]>({
    queryKey: ["/api/health-markers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/lab-results/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-markers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Deleted",
        description: "Lab result has been removed.",
      });
    },
  });

  const isLoading = loadingResults || loadingMarkers;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <Skeleton className="h-48" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-lab-results-title">
          Lab Results
        </h1>
        <p className="text-muted-foreground">
          Upload and analyze your bloodwork documents
        </p>
      </div>

      <UploadSection />

      {labResults && labResults.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Lab Results</h2>
          <div className="space-y-4">
            {labResults.map((result) => (
              <LabResultCard
                key={result.id}
                result={result}
                markers={markers || []}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}

      {labResults && labResults.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No lab results yet</h3>
          <p className="text-muted-foreground">
            Upload your first lab result to get started with personalized health insights.
          </p>
        </div>
      )}
    </div>
  );
}
