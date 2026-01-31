import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  User,
  Heart,
  Ruler,
  Scale,
  Activity,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

/**
 * IMPORTANT:
 * - Keep form values as STRINGS (because inputs are strings)
 * - Convert to numbers right before sending to API
 */
const healthProfileFormSchema = z.object({
  age: z.string(),
  sex: z.enum(["male", "female", "other"]).or(z.literal("")),
  heightCm: z.string(),
  weightKg: z.string(),
  activityLevel: z.enum(["low", "moderate", "high"]).or(z.literal("")),
});

type HealthProfileFormValues = z.infer<typeof healthProfileFormSchema>;

type HealthProfilePayload = {
  age?: number;
  sex?: "male" | "female" | "other";
  heightCm?: number;
  weightKg?: number;
  activityLevel?: "low" | "moderate" | "high";
};

/**
 * Convert a string input to an optional number.
 *
 * @param value - String from input.
 * @returns number if valid, otherwise undefined.
 */
function toOptionalNumber(value: string): number | undefined {
  const v = value.trim();
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/me"],
  });

  const form = useForm<HealthProfileFormValues>({
    resolver: zodResolver(healthProfileFormSchema),
    defaultValues: {
      age: "",
      sex: "",
      heightCm: "",
      weightKg: "",
      activityLevel: "",
    },
  });

  // When user data loads/changes, populate the form safely
  useEffect(() => {
    if (!user) return;

    form.reset({
      age: user.healthProfile?.age != null ? String(user.healthProfile.age) : "",
      sex: user.healthProfile?.sex ?? "",
      heightCm:
        user.healthProfile?.heightCm != null ? String(user.healthProfile.heightCm) : "",
      weightKg:
        user.healthProfile?.weightKg != null ? String(user.healthProfile.weightKg) : "",
      activityLevel: user.healthProfile?.activityLevel ?? "",
    });
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: HealthProfilePayload) => {
      const res = await apiRequest("PATCH", "/api/me/health-profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Profile updated",
        description: "Your health profile has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit: SubmitHandler<HealthProfileFormValues> = async (data) => {
    const payload: HealthProfilePayload = {
      age: toOptionalNumber(data.age),
      sex: data.sex === "" ? undefined : data.sex,
      heightCm: toOptionalNumber(data.heightCm),
      weightKg: toOptionalNumber(data.weightKg),
      activityLevel: data.activityLevel === "" ? undefined : data.activityLevel,
    };

    await updateProfileMutation.mutateAsync(payload);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isComplete = user?.healthProfileStatus?.isComplete;
  const lastUpdated = user?.healthProfileStatus?.lastUpdated;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight flex items-center gap-2"
          data-testid="text-page-title"
        >
          <User className="h-6 w-6 text-primary" />
          Profile & Settings
        </h1>
        <p className="text-muted-foreground">Manage your health profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle>Health Profile</CardTitle>
            </div>
            {isComplete ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Incomplete
              </Badge>
            )}
          </div>
          <CardDescription>
            Your basic health information helps us provide personalized recommendations.
            {lastUpdated && (
              <span className="block text-xs mt-1">
                Last updated: {new Date(lastUpdated).toLocaleDateString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Age
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          data-testid="input-profile-age"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>Required for profile completion</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biological Sex</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-profile-sex">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="heightCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        Height (cm)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="170"
                          data-testid="input-profile-height"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>Required for profile completion</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        Weight (kg)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="70"
                          data-testid="input-profile-weight"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>Required for profile completion</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Activity Level
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-profile-activity">
                          <SelectValue placeholder="Select your activity level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - Mostly sedentary</SelectItem>
                        <SelectItem value="moderate">
                          Moderate - Some exercise weekly
                        </SelectItem>
                        <SelectItem value="high">High - Very active lifestyle</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">{user?.username}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
