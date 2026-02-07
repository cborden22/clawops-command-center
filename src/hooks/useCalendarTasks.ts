import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { toast } from "@/hooks/use-toast";

export interface CalendarTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  taskDate: string;
  taskType: string;
  completed: boolean;
  createdAt: string;
  createdByUserId: string | null;
}

export interface CreateCalendarTaskInput {
  title: string;
  description?: string;
  taskDate: string;
  taskType?: string;
}

export function useCalendarTasks() {
  const { user } = useAuth();
  const { effectiveUserId } = useTeamContext();
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      setIsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("calendar_tasks")
        .select("*")
        .order("task_date", { ascending: true });

      if (error) throw error;

      const mappedTasks: CalendarTask[] = (data || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        taskDate: t.task_date,
        taskType: t.task_type || "reminder",
        completed: t.completed || false,
        createdAt: t.created_at,
        createdByUserId: t.created_by_user_id,
      }));

      setTasks(mappedTasks);
    } catch (error: any) {
      console.error("Error fetching calendar tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load calendar tasks.",
        variant: "destructive",
      });
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const createTask = async (input: CreateCalendarTaskInput): Promise<CalendarTask | null> => {
    if (!user || !effectiveUserId) return null;

    try {
      const { data, error } = await supabase
        .from("calendar_tasks")
        .insert({
          user_id: effectiveUserId,
          title: input.title,
          description: input.description || null,
          task_date: input.taskDate,
          task_type: input.taskType || "reminder",
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTasks();
      
      toast({
        title: "Task Created",
        description: `"${input.title}" has been added to the calendar.`,
      });

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description,
        taskDate: data.task_date,
        taskType: data.task_type || "reminder",
        completed: data.completed || false,
        createdAt: data.created_at,
        createdByUserId: data.created_by_user_id,
      };
    } catch (error: any) {
      console.error("Error creating calendar task:", error);
      toast({
        title: "Error",
        description: "Failed to create calendar task.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Pick<CalendarTask, "title" | "description" | "taskDate" | "taskType" | "completed">>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.taskDate !== undefined) updateData.task_date = updates.taskDate;
      if (updates.taskType !== undefined) updateData.task_type = updates.taskType;
      if (updates.completed !== undefined) updateData.completed = updates.completed;

      const { error } = await supabase
        .from("calendar_tasks")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      await fetchTasks();
    } catch (error: any) {
      console.error("Error updating calendar task:", error);
      toast({
        title: "Error",
        description: "Failed to update calendar task.",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("calendar_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchTasks();
      
      toast({
        title: "Task Deleted",
        description: "Calendar task has been removed.",
      });
    } catch (error: any) {
      console.error("Error deleting calendar task:", error);
      toast({
        title: "Error",
        description: "Failed to delete calendar task.",
        variant: "destructive",
      });
    }
  };

  const toggleCompleted = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      await updateTask(id, { completed: !task.completed });
    }
  };

  return {
    tasks,
    isLoaded,
    createTask,
    updateTask,
    deleteTask,
    toggleCompleted,
    refetch: fetchTasks,
  };
}
