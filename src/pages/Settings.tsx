
import React, { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AppSettings, defaultSettings, Punishment } from "@/types/settings";

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const { toast } = useToast();

  const updateSettings = (section: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const addCustomPunishment = () => {
    const newPunishment: Punishment = {
      id: Date.now().toString(),
      name: 'Custom Punishment',
      description: 'Describe your punishment',
      severity: 'medium',
      cost: 100,
      icon: '⚡'
    };
    
    setSettings(prev => ({
      ...prev,
      punishments: {
        ...prev.punishments,
        availablePunishments: [...prev.punishments.availablePunishments, newPunishment]
      }
    }));
  };

  const updatePunishment = (id: string, updates: Partial<Punishment>) => {
    setSettings(prev => ({
      ...prev,
      punishments: {
        ...prev.punishments,
        availablePunishments: prev.punishments.availablePunishments.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      }
    }));
  };

  const deletePunishment = (id: string) => {
    setSettings(prev => ({
      ...prev,
      punishments: {
        ...prev.punishments,
        availablePunishments: prev.punishments.availablePunishments.filter(p => p.id !== id)
      }
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    toast({
      title: "Settings Saved! ✅",
      description: "Your preferences have been updated successfully.",
    });
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-blue-50/30">
        <AppSidebar />
        <main className="flex-1 flex flex-col items-stretch xl:px-8 px-4 pt-6 bg-transparent">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger />
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-gray-600" />
              <span className="text-lg font-semibold text-gray-800">Settings</span>
            </div>
            <div className="ml-auto">
              <Button onClick={saveSettings} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <Tabs defaultValue="reminders" className="p-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="punishments">Punishments</TabsTrigger>
                <TabsTrigger value="points">Points</TabsTrigger>
              </TabsList>

              <TabsContent value="reminders" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Reminder Settings</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Enable Reminders</label>
                      <p className="text-xs text-gray-500">Get notifications for upcoming tasks</p>
                    </div>
                    <Switch 
                      checked={settings.reminders.enableReminders}
                      onCheckedChange={(checked) => updateSettings('reminders', 'enableReminders', checked)}
                    />
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium">Pre-task reminder (minutes before)</label>
                      <input 
                        type="number" 
                        value={settings.reminders.preTaskMinutes}
                        onChange={(e) => updateSettings('reminders', 'preTaskMinutes', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Overdue reminder (minutes after missed)</label>
                      <input 
                        type="number" 
                        value={settings.reminders.overdueMinutes}
                        onChange={(e) => updateSettings('reminders', 'overdueMinutes', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Motivational nudge (minutes into task)</label>
                      <input 
                        type="number" 
                        value={settings.reminders.motivationalNudgeMinutes}
                        onChange={(e) => updateSettings('reminders', 'motivationalNudgeMinutes', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rewards" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Streak Rewards</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Enable Streak Rewards</label>
                      <p className="text-xs text-gray-500">Get bonus points for maintaining streaks</p>
                    </div>
                    <Switch 
                      checked={settings.streaks.enableStreakRewards}
                      onCheckedChange={(checked) => updateSettings('streaks', 'enableStreakRewards', checked)}
                    />
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium">7-day streak bonus points</label>
                      <input 
                        type="number" 
                        value={settings.streaks.weekReward}
                        onChange={(e) => updateSettings('streaks', 'weekReward', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">14-day streak bonus points</label>
                      <input 
                        type="number" 
                        value={settings.streaks.biWeekReward}
                        onChange={(e) => updateSettings('streaks', 'biWeekReward', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">30-day streak bonus points</label>
                      <input 
                        type="number" 
                        value={settings.streaks.monthReward}
                        onChange={(e) => updateSettings('streaks', 'monthReward', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="punishments" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Punishment System</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Enable Punishments</label>
                      <p className="text-xs text-gray-500">Apply consequences for missed tasks</p>
                    </div>
                    <Switch 
                      checked={settings.punishments.enablePunishments}
                      onCheckedChange={(checked) => updateSettings('punishments', 'enablePunishments', checked)}
                    />
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium">Missed task penalty (points)</label>
                      <input 
                        type="number" 
                        value={settings.punishments.missedTaskPenalty}
                        onChange={(e) => updateSettings('punishments', 'missedTaskPenalty', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Streak break penalty (points)</label>
                      <input 
                        type="number" 
                        value={settings.punishments.streakBreakPenalty}
                        onChange={(e) => updateSettings('punishments', 'streakBreakPenalty', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Available Punishments</h4>
                      <Button onClick={addCustomPunishment} size="sm">Add Custom</Button>
                    </div>
                    
                    {settings.punishments.availablePunishments.map((punishment) => (
                      <div key={punishment.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <input 
                            type="text" 
                            value={punishment.name}
                            onChange={(e) => updatePunishment(punishment.id, { name: e.target.value })}
                            className="font-medium bg-transparent border-none p-0 text-sm"
                          />
                          <Button 
                            onClick={() => deletePunishment(punishment.id)}
                            variant="destructive" 
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                        <Textarea 
                          value={punishment.description}
                          onChange={(e) => updatePunishment(punishment.id, { description: e.target.value })}
                          placeholder="Describe the punishment"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <select 
                            value={punishment.severity}
                            onChange={(e) => updatePunishment(punishment.id, { severity: e.target.value as any })}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="light">Light</option>
                            <option value="medium">Medium</option>
                            <option value="severe">Severe</option>
                          </select>
                          <input 
                            type="number" 
                            value={punishment.cost}
                            onChange={(e) => updatePunishment(punishment.id, { cost: parseInt(e.target.value) })}
                            placeholder="Points cost"
                            className="px-2 py-1 border rounded text-sm w-20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="points" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Points System</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Deduct points for missed tasks</label>
                      <p className="text-xs text-gray-500">Remove task points when you miss them</p>
                    </div>
                    <Switch 
                      checked={settings.points.missedTaskPenalty}
                      onCheckedChange={(checked) => updateSettings('points', 'missedTaskPenalty', checked)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Quality bonus multiplier</label>
                    <p className="text-xs text-gray-500">Extra points for high-quality completions</p>
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.points.qualityBonusMultiplier}
                      onChange={(e) => updateSettings('points', 'qualityBonusMultiplier', parseFloat(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
