import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Pill,
  Apple,
  Sun,
  Sunset,
  Moon,
  Clock,
  Check,
  Timer,
  ChevronLeft,
  ChevronRight,
  Utensils,
  AlertTriangle,
  Calendar,
  Layers,
} from "lucide-react";
import type { Medication, Supplement, PillDose, PillStack } from "@shared/schema";

const timeBlocks = [
  { id: "morning", label: "Morning", icon: Sun, time: "6:00 AM - 11:00 AM", color: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "midday", label: "Midday", icon: Clock, time: "11:00 AM - 3:00 PM", color: "bg-sky-100 dark:bg-sky-900/30" },
  { id: "evening", label: "Evening", icon: Sunset, time: "3:00 PM - 8:00 PM", color: "bg-orange-100 dark:bg-orange-900/30" },
  { id: "bedtime", label: "Bedtime", icon: Moon, time: "8:00 PM - 12:00 AM", color: "bg-indigo-100 dark:bg-indigo-900/30" },
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekDates(startDate: Date): Date[] {
  const dates = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

interface PillItem {
  id: number;
  type: "medication" | "supplement";
  name: string;
  dosage: string;
  timeBlock: string;
  foodRule: string;
  whyTaking: string | null;
  separationRules: any[];
  doseId?: number;
  doseStatus?: string;
}

function PillCard({
  pill,
  onTaken,
  onSnooze,
  isPending,
}: {
  pill: PillItem;
  onTaken: () => void;
  onSnooze: () => void;
  isPending: boolean;
}) {
  const isMedication = pill.type === "medication";
  const hasSeparationWarning = pill.separationRules && pill.separationRules.length > 0;
  const isTaken = pill.doseStatus === "taken";
  const isSnoozed = pill.doseStatus === "snoozed";

  return (
    <Card 
      className={`hover-elevate transition-all ${isTaken ? "opacity-60" : ""}`}
      data-testid={`card-pill-${pill.type}-${pill.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`rounded-lg p-2 flex-shrink-0 ${isMedication ? "bg-primary/10" : "bg-green-100 dark:bg-green-900/30"}`}>
              {isMedication ? (
                <Pill className="h-5 w-5 text-primary" />
              ) : (
                <Apple className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate" data-testid={`text-pill-name-${pill.id}`}>
                  {pill.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {pill.dosage}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {pill.foodRule === "with_food" && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Utensils className="h-3 w-3" />
                    With food
                  </Badge>
                )}
                {pill.foodRule === "empty_stomach" && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    Empty stomach
                  </Badge>
                )}
                {hasSeparationWarning && (
                  <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Separate from {pill.separationRules[0]?.pillName}
                  </Badge>
                )}
              </div>

              {pill.whyTaking && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">
                  {pill.whyTaking}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isTaken ? (
              <Badge className="bg-green-600 text-white gap-1">
                <Check className="h-3 w-3" />
                Taken
              </Badge>
            ) : isSnoozed ? (
              <Badge variant="secondary" className="gap-1">
                <Timer className="h-3 w-3" />
                Snoozed
              </Badge>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSnooze}
                  disabled={isPending}
                  data-testid={`button-snooze-${pill.type}-${pill.id}`}
                >
                  <Timer className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={onTaken}
                  disabled={isPending}
                  data-testid={`button-taken-${pill.type}-${pill.id}`}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Taken
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DailyView({
  selectedDate,
  medications,
  supplements,
  doses,
  onMarkTaken,
  onMarkSnoozed,
  isPending,
}: {
  selectedDate: Date;
  medications: Medication[];
  supplements: Supplement[];
  doses: PillDose[];
  onMarkTaken: (doseId: number) => void;
  onMarkSnoozed: (doseId: number) => void;
  isPending: boolean;
}) {
  const pills: PillItem[] = [
    ...medications.filter(m => m.active).map(m => ({
      id: m.id,
      type: "medication" as const,
      name: m.name,
      dosage: m.dosage,
      timeBlock: m.timeBlock || "morning",
      foodRule: m.foodRule || "either",
      whyTaking: m.whyTaking,
      separationRules: m.separationRules || [],
      doseId: doses.find(d => d.pillType === "medication" && d.pillId === m.id)?.id,
      doseStatus: doses.find(d => d.pillType === "medication" && d.pillId === m.id)?.status,
    })),
    ...supplements.filter(s => s.active).map(s => ({
      id: s.id,
      type: "supplement" as const,
      name: s.name,
      dosage: s.dosage,
      timeBlock: s.timeBlock || "morning",
      foodRule: s.foodRule || "either",
      whyTaking: s.whyTaking,
      separationRules: s.separationRules || [],
      doseId: doses.find(d => d.pillType === "supplement" && d.pillId === s.id)?.id,
      doseStatus: doses.find(d => d.pillType === "supplement" && d.pillId === s.id)?.status,
    })),
  ];

  const pillsByBlock = timeBlocks.map(block => ({
    ...block,
    pills: pills.filter(p => p.timeBlock === block.id),
  }));

  const totalPills = pills.length;
  const takenPills = pills.filter(p => p.doseStatus === "taken").length;
  const progress = totalPills > 0 ? Math.round((takenPills / totalPills) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Daily Progress</p>
              <p className="text-2xl font-bold" data-testid="text-daily-progress">
                {takenPills} / {totalPills} pills taken
              </p>
            </div>
            <div className="relative h-16 w-16">
              <svg className="transform -rotate-90 h-16 w-16">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="6"
                  fill="none"
                  r="28"
                  cx="32"
                  cy="32"
                />
                <circle
                  className="text-primary stroke-current transition-all duration-500"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  r="28"
                  cx="32"
                  cy="32"
                  strokeDasharray={`${progress * 1.76} 176`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                {progress}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {pillsByBlock.map(block => {
        if (block.pills.length === 0) return null;
        const BlockIcon = block.icon;
        return (
          <div key={block.id} className="space-y-3">
            <div className={`rounded-lg p-3 ${block.color}`}>
              <div className="flex items-center gap-2">
                <BlockIcon className="h-5 w-5" />
                <h2 className="font-semibold">{block.label}</h2>
                <span className="text-sm text-muted-foreground">({block.time})</span>
              </div>
            </div>
            <div className="space-y-2 pl-2">
              {block.pills.map(pill => (
                <PillCard
                  key={`${pill.type}-${pill.id}`}
                  pill={pill}
                  onTaken={() => pill.doseId && onMarkTaken(pill.doseId)}
                  onSnooze={() => pill.doseId && onMarkSnoozed(pill.doseId)}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        );
      })}

      {totalPills === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No pills scheduled</h3>
            <p className="text-sm text-muted-foreground">
              Add medications or supplements to see them in your daily planner.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WeeklyView({
  weekDates,
  medications,
  supplements,
  onDaySelect,
}: {
  weekDates: Date[];
  medications: Medication[];
  supplements: Supplement[];
  onDaySelect: (date: Date) => void;
}) {
  const today = formatDate(new Date());
  
  const pills = [
    ...medications.filter(m => m.active).map(m => ({
      id: m.id,
      type: "medication" as const,
      name: m.name,
      timeBlock: m.timeBlock || "morning",
    })),
    ...supplements.filter(s => s.active).map(s => ({
      id: s.id,
      type: "supplement" as const,
      name: s.name,
      timeBlock: s.timeBlock || "morning",
    })),
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left p-2 w-24"></th>
                  {weekDates.map((date, i) => {
                    const dateStr = formatDate(date);
                    const isToday = dateStr === today;
                    return (
                      <th 
                        key={i} 
                        className={`text-center p-2 cursor-pointer rounded-lg transition-colors hover:bg-muted ${isToday ? "bg-primary/10" : ""}`}
                        onClick={() => onDaySelect(date)}
                        data-testid={`button-day-${daysOfWeek[i]}`}
                      >
                        <div className="text-xs text-muted-foreground">{daysOfWeek[i]}</div>
                        <div className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>
                          {date.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeBlocks.map(block => {
                  const blockPills = pills.filter(p => p.timeBlock === block.id);
                  const BlockIcon = block.icon;
                  if (blockPills.length === 0) return null;
                  return (
                    <tr key={block.id} className="border-t">
                      <td className="p-2 align-top">
                        <div className="flex items-center gap-1.5">
                          <BlockIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{block.label}</span>
                        </div>
                      </td>
                      {weekDates.map((date, i) => (
                        <td 
                          key={i} 
                          className="p-2 align-top cursor-pointer hover:bg-muted/50 rounded"
                          onClick={() => onDaySelect(date)}
                        >
                          <div className="flex flex-wrap gap-1 justify-center">
                            {blockPills.map(pill => (
                              <div
                                key={`${pill.type}-${pill.id}`}
                                className={`h-2.5 w-2.5 rounded-full ${pill.type === "medication" ? "bg-primary" : "bg-green-500"}`}
                                title={pill.name}
                              />
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Legend
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm">Medication</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm">Supplement</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PillPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const { toast } = useToast();

  const weekDates = getWeekDates(selectedDate);

  const { data: medications = [], isLoading: loadingMeds } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: supplements = [], isLoading: loadingSupps } = useQuery<Supplement[]>({
    queryKey: ["/api/supplements"],
  });

  const { data: doses = [], isLoading: loadingDoses } = useQuery<PillDose[]>({
    queryKey: ["/api/pill-doses", formatDate(selectedDate)],
    queryFn: async () => {
      const res = await fetch(`/api/pill-doses?date=${formatDate(selectedDate)}`);
      if (!res.ok) throw new Error("Failed to fetch doses");
      return res.json();
    },
  });

  const generateDosesMutation = useMutation({
    mutationFn: async (date: string) => {
      const res = await apiRequest("POST", "/api/pill-doses/generate", { date });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pill-doses", formatDate(selectedDate)] });
    },
  });

  const updateDoseMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/pill-doses/${id}`, {
        status,
        takenAt: status === "taken" ? new Date().toISOString() : null,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pill-doses", formatDate(selectedDate)] });
      toast({
        title: variables.status === "taken" ? "Marked as taken" : "Snoozed",
        description: variables.status === "taken" 
          ? "Great job staying on track!" 
          : "We'll remind you again soon.",
      });
    },
  });

  // Generate doses when date changes
  useEffect(() => {
    if (medications.length > 0 || supplements.length > 0) {
      generateDosesMutation.mutate(formatDate(selectedDate));
    }
  }, [formatDate(selectedDate), medications.length, supplements.length]);

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (view === "weekly") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setSelectedDate(newDate);
  };

  const isLoading = loadingMeds || loadingSupps || loadingDoses;

  const dateDisplay = view === "weekly"
    ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b bg-background sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Calendar className="h-6 w-6 text-primary" />
              Pill Planner
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track your daily medications and supplements</p>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "daily" | "weekly")}>
            <TabsList>
              <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)} data-testid="button-prev">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold" data-testid="text-date-display">{dateDisplay}</h2>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} data-testid="button-next">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : view === "daily" ? (
          <DailyView
            selectedDate={selectedDate}
            medications={medications}
            supplements={supplements}
            doses={doses}
            onMarkTaken={(id) => updateDoseMutation.mutate({ id, status: "taken" })}
            onMarkSnoozed={(id) => updateDoseMutation.mutate({ id, status: "snoozed" })}
            isPending={updateDoseMutation.isPending}
          />
        ) : (
          <WeeklyView
            weekDates={weekDates}
            medications={medications}
            supplements={supplements}
            onDaySelect={(date) => {
              setSelectedDate(date);
              setView("daily");
            }}
          />
        )}
      </div>
    </div>
  );
}
