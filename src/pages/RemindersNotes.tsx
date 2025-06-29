
import React, { useEffect, useState, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import { AddNoteDialog } from "@/components/reminders/AddNoteDialog";
import { ReminderList } from "@/components/reminders/ReminderList";
import { NoteList } from "@/components/reminders/NoteList";
import { ReminderNoteItem, ReminderCategory, NoteCategory } from "@/types/reminders";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";

const REMINDER_STORAGE_KEY = "reminders_notes";

export default function RemindersNotes() {
  const [items, setItems] = useState<ReminderNoteItem[]>([]);
  const [tab, setTab] = useState<"reminders" | "notes">("reminders");
  const { toast } = useToast();
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (stored) setItems(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const handleAddReminder = (
    reminder: Omit<ReminderNoteItem, "id" | "createdAt" | "type" | "alarmSent"> &
      { category: ReminderCategory; time?: string }
  ) => {
    const newItem: ReminderNoteItem = {
      id: Date.now().toString(),
      type: "reminder",
      ...reminder,
      createdAt: new Date().toISOString(),
      alarmSent: false,
    };
    setItems((prev) => [...prev, newItem]);
    toast({ title: "Reminder Added", description: newItem.title });
  };

  const handleAddNote = (
    note: Omit<ReminderNoteItem, "id" | "createdAt" | "type" | "alarmSent"> & { category: NoteCategory }
  ) => {
    const newItem: ReminderNoteItem = {
      id: Date.now().toString(),
      type: "note",
      ...note,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    toast({ title: "Note Added", description: newItem.title });
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Item Deleted" });
  };

  // In-app alarm for general reminders at given date & time
  useEffect(() => {
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    alarmIntervalRef.current = setInterval(() => {
      const now = new Date();
      setItems((currItems) =>
        currItems.map((item) => {
          if (
            item.type === "reminder" &&
            item.category === "general-reminders" &&
            item.date &&
            item.time &&
            !item.alarmSent
          ) {
            const [h, m] = item.time.split(":");
            const reminderDate = new Date(item.date);
            reminderDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

            // If time is now (within this minute) and today or in the past
            if (
              Math.abs(reminderDate.getTime() - now.getTime()) < 60000 &&
              now >= reminderDate
            ) {
              toast({
                title: "Reminder Alarm ⏰",
                description: `"${item.title}" is scheduled for now.`,
                duration: 10000,
              });
              return { ...item, alarmSent: true };
            }
          }
          return item;
        })
      );
    }, 30000); // Check every 30s
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
    // Only rerun when items/ toast changes!
    // eslint-disable-next-line
  }, [toast]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-blue-50/30">
        <AppSidebar />
        <main className="flex-1 flex flex-col items-stretch xl:px-8 px-4 pt-6">
          <div className="flex items-center gap-4 mb-4">
            <SidebarTrigger />
            <Bell className="h-6 w-6 text-purple-600" />
            <span className="text-lg font-semibold">Reminders & Notes</span>
          </div>
          <Tabs value={tab} onValueChange={v=>setTab(v as any)} className="w-full">
            <TabsList>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="reminders">
              <div className="flex justify-between items-center mt-4 mb-3">
                <div className="font-semibold text-gray-600">Your Reminders</div>
                <AddReminderDialog onAdd={handleAddReminder} />
              </div>
              <ReminderList
                items={items.filter(i=>i.type==="reminder")}
                onDelete={deleteItem}
              />
              {items.filter(i=>i.type==="reminder").length===0 && (
                <div className="py-12 text-center text-gray-400">
                  <Bell className="h-10 w-10 mx-auto mb-2" />
                  No reminders yet.
                </div>
              )}
            </TabsContent>
            <TabsContent value="notes">
              <div className="flex justify-between items-center mt-4 mb-3">
                <div className="font-semibold text-gray-600">Your Notes</div>
                <AddNoteDialog onAdd={handleAddNote} />
              </div>
              <NoteList
                items={items.filter(i=>i.type==="note")}
                onDelete={deleteItem}
              />
              {items.filter(i=>i.type==="note").length===0 && (
                <div className="py-12 text-center text-gray-400">
                  <Bell className="h-10 w-10 mx-auto mb-2" />
                  No notes yet.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}
