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
import { Input } from "@/components/ui/input";
import { getPoints, setPoints } from "@/utils/pointsStorage";
import { useEffect } from "react";

// Capacitor/simulated ScreenTimePlugin bridge
const ScreenTimePlugin = (window as any).ScreenTimePlugin ?? {
  // Fallbacks for dev environment (mock, so UI works in browser)
  getScreenTimeLimits: async () => ({}),
  setScreenTimeLimit: async ({ app, minutes }: { app: string; minutes: number }) => {},
  getAppUsageStats: async ({ date }: { date: string }) => ({ apps: [] }),
};

// Helper for today date in YYYY-MM-DD
const todayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

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

  // Add penalty event listener
React.useEffect(() => {
  const handleLimitExceeded = (event: any) => {
    const { app, minutesUsed, limit } = event.detail;
    
    // Get current points
    const currentPoints = getPoints();
    
    // Calculate penalty (you can customize this)
    const penalty = Math.min(50, (minutesUsed - limit) * 5); // 5 points per minute over, max 50
    
    // Deduct points
    const newPoints = Math.max(0, currentPoints - penalty);
    setPoints(newPoints);
    
    // Show notification
    toast({
      title: "⚠️ App Limit Exceeded!",
      description: `${app}: Used ${minutesUsed}/${limit} min. Lost ${penalty} points!`,
      variant: "destructive",
    });
    
    // Optional: Apply additional punishment from settings
    if (settings.punishments.enablePunishments) {
      // You can add custom punishment logic here
      console.log("Additional punishment applied for", app);
    }
  };

  // Register the event listener
  window.addEventListener('limitExceeded', handleLimitExceeded);
  
  // Cleanup
  return () => {
    window.removeEventListener('limitExceeded', handleLimitExceeded);
  };
}, [settings.punishments.enablePunishments, toast]);


  const [appLimits, setAppLimits] = useState<{ [app: string]: number }>({});
  const [usageStats, setUsageStats] = useState<{ [pkg: string]: number }>({});
  const [loadingAppLimits, setLoadingAppLimits] = useState(false);
  const [newLimit, setNewLimit] = useState({ app: "", minutes: 15 });

  // Load app limits and usage stats when entering tab
  const fetchLimitsAndUsage = async () => {
    setLoadingAppLimits(true);
    try {
      const limitsData = await ScreenTimePlugin.getScreenTimeLimits();
      setAppLimits(limitsData || {});
    } catch {
      setAppLimits({});
    }
    try {
      const stats = await ScreenTimePlugin.getAppUsageStats({ date: todayStr() });
      const usage: { [pkg: string]: number } = {};
      if (stats && Array.isArray(stats.apps)) {
        stats.apps.forEach((app: { package: string, minutes: number }) => {
          usage[app.package] = app.minutes;
        });
      }
      setUsageStats(usage);
    } catch {
      setUsageStats({});
    }
    setLoadingAppLimits(false);
  };

  // Only load on first render of tab
  const [hasLoadedPenalties, setHasLoadedPenalties] = useState(false);

  // Used for controlled switching tabs to perform fetching only when entering penalties tab:
  const [visibleTab, setVisibleTab] = useState<string>("reminders");

  React.useEffect(() => {
    if (visibleTab === "penalties" && !hasLoadedPenalties) {
      fetchLimitsAndUsage();
      setHasLoadedPenalties(true);
    }
  }, [visibleTab, hasLoadedPenalties]);

  // Add, update, remove app limits
  const handleUpdateLimit = async (app: string, minutes: number) => {
    await ScreenTimePlugin.setScreenTimeLimit({ app, minutes });
    fetchLimitsAndUsage();
  };
  const handleDeleteLimit = async (app: string) => {
    await ScreenTimePlugin.setScreenTimeLimit({ app, minutes: 0 }); // 0 = remove
    fetchLimitsAndUsage();
  };
  const handleAddLimit = async () => {
    if (!newLimit.app || newLimit.minutes <= 0) return;
    await ScreenTimePlugin.setScreenTimeLimit(newLimit);
    setNewLimit({ app: "", minutes: 15 });
    fetchLimitsAndUsage();
  };

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
            <Tabs value={visibleTab} onValueChange={(tab) => setVisibleTab(tab)} className="p-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="punishments">Punishments</TabsTrigger>
                <TabsTrigger value="points">Points</TabsTrigger>
                <TabsTrigger value="penalties">App Penalties</TabsTrigger>
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

              {/* NEW App Penalties Tab */}
              <TabsContent value="penalties" className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">App Time Limits & Penalties</h3>
                  <p className="text-gray-500 mb-4 text-sm">
                    Control per-app daily time limits. When you exceed a limit, the app issues a penalty automatically. Edits here sync directly with your device.
                  </p>
                  <Button onClick={fetchLimitsAndUsage} size="sm" className="mb-2">Refresh Data</Button>
                  {loadingAppLimits ? (
                    <div className="text-center py-8 text-gray-500">Loading app limits…</div>
                  ) : (
                    <div className="space-y-4">
                      {Object.keys(appLimits).length === 0 && (
                        <div className="text-sm text-gray-600 italic py-4">No app time limits set yet.</div>
                      )}
                      {Object.entries(appLimits).map(([app, minutes]) => (
                        <div key={app} className="p-4 rounded border flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 bg-zinc-50">
                          <div className="flex-1">
                            <div className="font-mono pb-1">{app}</div>
                            <div className="text-xs text-gray-600">
                              Today's usage:{" "}
                              <span className={(usageStats[app] ?? 0) > minutes ? "text-red-600 font-bold" : "text-green-800"}>
                                {usageStats[app] ?? 0} / {minutes} min
                              </span>
                              {(usageStats[app] ?? 0) > minutes && (
                                <span className="ml-2 text-xs text-red-500">
                                  (+{(usageStats[app] ?? 0) - minutes} over)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="number"
                              min={1}
                              value={minutes}
                              onChange={e =>
                                handleUpdateLimit(app, Math.max(1, parseInt(e.target.value) || 1))
                              }
                              className="w-24"
                            />
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteLimit(app)}
                              size="sm"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      {/* Add new app limit */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Input
                          placeholder="App package name"
                          value={newLimit.app}
                          onChange={e => setNewLimit(l => ({ ...l, app: e.target.value }))}
                          className="sm:max-w-xs"
                        />
                        <Input
                          type="number"
                          min={1}
                          placeholder="Daily minutes"
                          value={newLimit.minutes}
                          onChange={e => setNewLimit(l => ({ ...l, minutes: Math.max(1, +e.target.value) }))}
                          className="sm:w-28"
                        />
                        <Button
                          onClick={handleAddLimit}
                          size="sm"
                          className="shrink-0"
                          disabled={!newLimit.app || newLimit.minutes < 1}
                        >
                          Add App Limit
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded mt-6 text-blue-800 text-sm">
                    <div>
                      You may need to grant usage stats permission on your phone for this feature to work.<br />
                      The penalty system applies automatically if you exceed your set limits.
                    </div>
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
