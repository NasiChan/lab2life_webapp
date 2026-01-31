import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMedicationSchema, type Medication } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pill, Plus, Edit, Trash2, Clock, Utensils } from "lucide-react";

const medicationFormSchema = insertMedicationSchema.extend({
  name: z.string().min(1, "Name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
});

type MedicationFormValues = z.infer<typeof medicationFormSchema>;

function MedicationCard({
  medication,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  medication: Medication;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <Card className={`hover-elevate ${!medication.active ? "opacity-60" : ""}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`rounded-md p-2 ${medication.active ? "bg-primary/10" : "bg-muted"}`}>
            <Pill className={`h-5 w-5 ${medication.active ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <CardTitle className="text-base">{medication.name}</CardTitle>
            <CardDescription>{medication.dosage}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={medication.active ?? false}
            onCheckedChange={onToggleActive}
            data-testid={`switch-medication-active-${medication.id}`}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {medication.frequency}
          </Badge>
          {medication.timeOfDay && (
            <Badge variant="outline" className="capitalize">
              {medication.timeOfDay}
            </Badge>
          )}
          {medication.withFood && (
            <Badge variant="outline" className="gap-1">
              <Utensils className="h-3 w-3" />
              With food
            </Badge>
          )}
        </div>
        {medication.notes && (
          <p className="text-sm text-muted-foreground mb-3">{medication.notes}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            data-testid={`button-edit-medication-${medication.id}`}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            data-testid={`button-delete-medication-${medication.id}`}
          >
            <Trash2 className="h-4 w-4 mr-1 text-destructive" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MedicationForm({
  medication,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  medication?: Medication;
  onSubmit: (values: MedicationFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: medication?.name || "",
      dosage: medication?.dosage || "",
      frequency: medication?.frequency || "",
      timeOfDay: medication?.timeOfDay || "",
      withFood: medication?.withFood || false,
      notes: medication?.notes || "",
      active: medication?.active ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medication Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lisinopril" {...field} data-testid="input-medication-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosage</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 10mg" {...field} data-testid="input-medication-dosage" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-medication-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                    <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                    <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="timeOfDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time of Day</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger data-testid="select-medication-time">
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="any">Any time</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="withFood"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border p-3">
              <div>
                <FormLabel>Take with food</FormLabel>
                <FormDescription>
                  Should this medication be taken with meals?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  data-testid="switch-medication-with-food"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes..."
                  {...field}
                  value={field.value ?? ""}
                  data-testid="textarea-medication-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} data-testid="button-save-medication">
            {isSubmitting ? "Saving..." : medication ? "Update" : "Add Medication"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Medications() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();

  const { data: medications, isLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const createMutation = useMutation({
    mutationFn: async (values: MedicationFormValues) => {
      return apiRequest("POST", "/api/medications", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      setIsDialogOpen(false);
      toast({ title: "Medication added successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: MedicationFormValues }) => {
      return apiRequest("PATCH", `/api/medications/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      setIsDialogOpen(false);
      setEditingMedication(undefined);
      toast({ title: "Medication updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/medications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      toast({ title: "Medication deleted" });
    },
  });

  const handleSubmit = (values: MedicationFormValues) => {
    if (editingMedication) {
      updateMutation.mutate({ id: editingMedication.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setIsDialogOpen(true);
  };

  const handleToggleActive = (medication: Medication) => {
    updateMutation.mutate({
      id: medication.id,
      values: { ...medication, active: !medication.active },
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

  const activeMedications = medications?.filter((m) => m.active) || [];
  const inactiveMedications = medications?.filter((m) => !m.active) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-medications-title">
            Medications
          </h1>
          <p className="text-muted-foreground">
            Track your medications and dosages
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingMedication(undefined);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-medication">
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMedication ? "Edit Medication" : "Add New Medication"}
              </DialogTitle>
              <DialogDescription>
                {editingMedication
                  ? "Update medication details below."
                  : "Enter the details of your medication."}
              </DialogDescription>
            </DialogHeader>
            <MedicationForm
              medication={editingMedication}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingMedication(undefined);
              }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {medications && medications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Pill className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No medications added</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your medications to get interaction alerts and reminders.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeMedications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Active Medications ({activeMedications.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeMedications.map((medication) => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    onEdit={() => handleEdit(medication)}
                    onDelete={() => deleteMutation.mutate(medication.id)}
                    onToggleActive={() => handleToggleActive(medication)}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveMedications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                Inactive Medications ({inactiveMedications.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {inactiveMedications.map((medication) => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    onEdit={() => handleEdit(medication)}
                    onDelete={() => deleteMutation.mutate(medication.id)}
                    onToggleActive={() => handleToggleActive(medication)}
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
