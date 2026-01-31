import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSupplementSchema, type Supplement } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Apple, Plus, Edit, Trash2, Clock, Utensils, ExternalLink } from "lucide-react";

const supplementFormSchema = insertSupplementSchema.extend({
  name: z.string().min(1, "Name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
});

type SupplementFormValues = z.infer<typeof supplementFormSchema>;

function SupplementCard({
  supplement,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  supplement: Supplement;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <Card className={`hover-elevate ${!supplement.active ? "opacity-60" : ""}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`rounded-md p-2 ${supplement.active ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"}`}>
            <Apple className={`h-5 w-5 ${supplement.active ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
          </div>
          <div>
            <CardTitle className="text-base">{supplement.name}</CardTitle>
            <CardDescription>{supplement.dosage}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={supplement.active ?? false}
            onCheckedChange={onToggleActive}
            data-testid={`switch-supplement-active-${supplement.id}`}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {supplement.frequency}
          </Badge>
          {supplement.timeOfDay && (
            <Badge variant="outline" className="capitalize">
              {supplement.timeOfDay}
            </Badge>
          )}
          {supplement.withFood && (
            <Badge variant="outline" className="gap-1">
              <Utensils className="h-3 w-3" />
              With food
            </Badge>
          )}
        </div>
        {supplement.reason && (
          <p className="text-sm text-muted-foreground mb-2">{supplement.reason}</p>
        )}
        {supplement.source && (
          <a
            href={supplement.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-3"
          >
            <ExternalLink className="h-3 w-3" />
            Source
          </a>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            data-testid={`button-edit-supplement-${supplement.id}`}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            data-testid={`button-delete-supplement-${supplement.id}`}
          >
            <Trash2 className="h-4 w-4 mr-1 text-destructive" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplementForm({
  supplement,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  supplement?: Supplement;
  onSubmit: (values: SupplementFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const form = useForm<SupplementFormValues>({
    resolver: zodResolver(supplementFormSchema),
    defaultValues: {
      name: supplement?.name || "",
      dosage: supplement?.dosage || "",
      frequency: supplement?.frequency || "",
      timeOfDay: supplement?.timeOfDay || "",
      withFood: supplement?.withFood || false,
      reason: supplement?.reason || "",
      source: supplement?.source || "",
      active: supplement?.active ?? true,
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
              <FormLabel>Supplement Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Vitamin D3" {...field} data-testid="input-supplement-name" />
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
                  <Input placeholder="e.g., 2000 IU" {...field} data-testid="input-supplement-dosage" />
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
                    <SelectTrigger data-testid="select-supplement-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Every other day">Every other day</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
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
              <FormLabel>Best Time to Take</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger data-testid="select-supplement-time">
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night (before bed)</SelectItem>
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
                  Better absorbed with meals?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  data-testid="switch-supplement-with-food"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Taking</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Low vitamin D levels from bloodwork"
                  {...field}
                  value={field.value ?? ""}
                  data-testid="textarea-supplement-reason"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source/Reference (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  {...field}
                  value={field.value ?? ""}
                  data-testid="input-supplement-source"
                />
              </FormControl>
              <FormDescription>
                Link to clinical guideline or health resource
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} data-testid="button-save-supplement">
            {isSubmitting ? "Saving..." : supplement ? "Update" : "Add Supplement"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Supplements() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | undefined>();

  const { data: supplements, isLoading } = useQuery<Supplement[]>({
    queryKey: ["/api/supplements"],
  });

  const createMutation = useMutation({
    mutationFn: async (values: SupplementFormValues) => {
      return apiRequest("POST", "/api/supplements", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      setIsDialogOpen(false);
      toast({ title: "Supplement added successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: SupplementFormValues }) => {
      return apiRequest("PATCH", `/api/supplements/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      setIsDialogOpen(false);
      setEditingSupplement(undefined);
      toast({ title: "Supplement updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/supplements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      toast({ title: "Supplement deleted" });
    },
  });

  const handleSubmit = (values: SupplementFormValues) => {
    if (editingSupplement) {
      updateMutation.mutate({ id: editingSupplement.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (supplement: Supplement) => {
    setEditingSupplement(supplement);
    setIsDialogOpen(true);
  };

  const handleToggleActive = (supplement: Supplement) => {
    updateMutation.mutate({
      id: supplement.id,
      values: { ...supplement, active: !supplement.active },
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

  const activeSupplements = supplements?.filter((s) => s.active) || [];
  const inactiveSupplements = supplements?.filter((s) => !s.active) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-supplements-title">
            Supplements
          </h1>
          <p className="text-muted-foreground">
            Track your vitamins and supplements
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingSupplement(undefined);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-supplement">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingSupplement ? "Edit Supplement" : "Add New Supplement"}
              </DialogTitle>
              <DialogDescription>
                {editingSupplement
                  ? "Update supplement details below."
                  : "Enter the details of your supplement."}
              </DialogDescription>
            </DialogHeader>
            <SupplementForm
              supplement={editingSupplement}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingSupplement(undefined);
              }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {supplements && supplements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
              <Apple className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No supplements added</h3>
            <p className="text-muted-foreground text-center mb-4">
              Track your vitamins and supplements to check for interactions.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Supplement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeSupplements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Active Supplements ({activeSupplements.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeSupplements.map((supplement) => (
                  <SupplementCard
                    key={supplement.id}
                    supplement={supplement}
                    onEdit={() => handleEdit(supplement)}
                    onDelete={() => deleteMutation.mutate(supplement.id)}
                    onToggleActive={() => handleToggleActive(supplement)}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveSupplements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                Inactive Supplements ({inactiveSupplements.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {inactiveSupplements.map((supplement) => (
                  <SupplementCard
                    key={supplement.id}
                    supplement={supplement}
                    onEdit={() => handleEdit(supplement)}
                    onDelete={() => deleteMutation.mutate(supplement.id)}
                    onToggleActive={() => handleToggleActive(supplement)}
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
