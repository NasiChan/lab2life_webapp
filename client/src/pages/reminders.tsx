import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertReminderSchema, type Reminder } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Plus, Edit, Trash2, Bell, BellOff, Pill, Apple, Dumbbell } from "lucide-react";

const days = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

const reminderFormSchema = insertReminderSchema.extend({
  title: z.string().min(1, "Title is required"),
  time: z.string().min(1, "Time is required"),
  days: z.array(z.string()).min(1, "Select at least one day"),
  type: z.string().min(1, "Type is required"),
});

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

function ReminderCard({
  reminder,
  onEdit,
  onDelete,
  onToggleEnabled,
}: {
  reminder: Reminder;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: () => void;
}) {
  const typeIcons: Record<string, React.ElementType> = {
    medication: Pill,
    supplement: Apple,
    activity: Dumbbell,
  };
  const Icon = typeIcons[reminder.type] || Clock;
  const reminderDays = (reminder.days as string[]) || [];

  return (
    <Card className={`hover-elevate ${!reminder.enabled ? "opacity-60" : ""}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`rounded-md p-2 ${reminder.enabled ? "bg-primary/10" : "bg-muted"}`}>
            <Icon className={`h-5 w-5 ${reminder.enabled ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {reminder.title}
              {reminder.enabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription className="capitalize">{reminder.type}</CardDescription>
          </div>
        </div>
        <Switch
          checked={reminder.enabled ?? false}
          onCheckedChange={onToggleEnabled}
          data-testid={`switch-reminder-enabled-${reminder.id}`}
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-primary">{reminder.time}</div>
          <div className="flex flex-wrap gap-1">
            {days.map((day) => (
              <Badge
                key={day.value}
                variant={reminderDays.includes(day.value) ? "default" : "outline"}
                className={`text-xs ${!reminderDays.includes(day.value) ? "opacity-40" : ""}`}
              >
                {day.label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            data-testid={`button-edit-reminder-${reminder.id}`}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            data-testid={`button-delete-reminder-${reminder.id}`}
          >
            <Trash2 className="h-4 w-4 mr-1 text-destructive" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReminderForm({
  reminder,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  reminder?: Reminder;
  onSubmit: (values: ReminderFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const existingDays = (reminder?.days as string[]) || [];
  
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: reminder?.title || "",
      time: reminder?.time || "08:00",
      days: existingDays.length > 0 ? existingDays : ["monday", "tuesday", "wednesday", "thursday", "friday"],
      type: reminder?.type || "medication",
      enabled: reminder?.enabled ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Take morning vitamins" {...field} data-testid="input-reminder-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} data-testid="input-reminder-time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-reminder-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="medication">Medication</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="activity">Physical Activity</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="days"
          render={() => (
            <FormItem>
              <FormLabel>Days of the Week</FormLabel>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <FormField
                    key={day.value}
                    control={form.control}
                    name="days"
                    render={({ field }) => {
                      return (
                        <FormItem key={day.value}>
                          <FormControl>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, day.value])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== day.value)
                                      );
                                }}
                                data-testid={`checkbox-day-${day.value}`}
                              />
                              <span className="text-sm">{day.label}</span>
                            </label>
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} data-testid="button-save-reminder">
            {isSubmitting ? "Saving..." : reminder ? "Update" : "Add Reminder"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Reminders() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>();

  const { data: reminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const createMutation = useMutation({
    mutationFn: async (values: ReminderFormValues) => {
      return apiRequest("POST", "/api/reminders", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsDialogOpen(false);
      toast({ title: "Reminder created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: ReminderFormValues }) => {
      return apiRequest("PATCH", `/api/reminders/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsDialogOpen(false);
      setEditingReminder(undefined);
      toast({ title: "Reminder updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({ title: "Reminder deleted" });
    },
  });

  const handleSubmit = (values: ReminderFormValues) => {
    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsDialogOpen(true);
  };

  const handleToggleEnabled = (reminder: Reminder) => {
    const reminderDays = (reminder.days as string[]) || [];
    updateMutation.mutate({
      id: reminder.id,
      values: {
        title: reminder.title,
        time: reminder.time,
        days: reminderDays,
        type: reminder.type,
        enabled: !reminder.enabled,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const enabledReminders = reminders?.filter((r) => r.enabled) || [];
  const disabledReminders = reminders?.filter((r) => !r.enabled) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-reminders-title">
            Reminders
          </h1>
          <p className="text-muted-foreground">
            Schedule reminders for medications, supplements, and activities
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingReminder(undefined);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-reminder">
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? "Edit Reminder" : "Add New Reminder"}
              </DialogTitle>
              <DialogDescription>
                {editingReminder
                  ? "Update reminder details below."
                  : "Set up a new reminder for your health routine."}
              </DialogDescription>
            </DialogHeader>
            <ReminderForm
              reminder={editingReminder}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingReminder(undefined);
              }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {reminders && reminders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No reminders set</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create reminders to stay on track with your health routine.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {enabledReminders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Active Reminders ({enabledReminders.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {enabledReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onEdit={() => handleEdit(reminder)}
                    onDelete={() => deleteMutation.mutate(reminder.id)}
                    onToggleEnabled={() => handleToggleEnabled(reminder)}
                  />
                ))}
              </div>
            </div>
          )}

          {disabledReminders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                Disabled Reminders ({disabledReminders.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {disabledReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onEdit={() => handleEdit(reminder)}
                    onDelete={() => deleteMutation.mutate(reminder.id)}
                    onToggleEnabled={() => handleToggleEnabled(reminder)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
