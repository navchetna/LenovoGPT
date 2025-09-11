import { useState, useEffect } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { RadioGroup, RadioGroupItem } from "@/components/radio-group";
import { Switch } from "@/components/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { useTheme } from "@/contexts/ThemeContext";

export function ScheduledThemeConfig() {
  const { scheduledTheme, updateScheduledTheme } = useTheme();
  const [enabled, setEnabled] = useState(scheduledTheme.enabled);
  const [mode, setMode] = useState(scheduledTheme.mode);
  const [lightModeTime, setLightModeTime] = useState(
    scheduledTheme.lightModeTime
  );
  const [darkModeTime, setDarkModeTime] = useState(scheduledTheme.darkModeTime);

  useEffect(() => {
    setEnabled(scheduledTheme.enabled);
    setMode(scheduledTheme.mode);
    setLightModeTime(scheduledTheme.lightModeTime);
    setDarkModeTime(scheduledTheme.darkModeTime);
  }, [scheduledTheme]);

  const handleSave = () => {
    updateScheduledTheme({
      enabled,
      mode,
      lightModeTime,
      darkModeTime,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Scheduling</CardTitle>
        <CardDescription>
          Configure when to switch between light and dark modes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="scheduled-theme-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <Label htmlFor="scheduled-theme-enabled">
            Enable Scheduled Theme
          </Label>
        </div>
        <RadioGroup
          value={mode}
          // onValueChange={setMode}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sunset" id="sunset" />
            <Label htmlFor="sunset">Sunset to Sunrise</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom">Custom Schedule</Label>
          </div>
        </RadioGroup>
        {mode === "custom" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="light-mode-time">Light Mode Start Time</Label>
              <Input
                id="light-mode-time"
                type="time"
                value={lightModeTime}
                onChange={(e) => setLightModeTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dark-mode-time">Dark Mode Start Time</Label>
              <Input
                id="dark-mode-time"
                type="time"
                value={darkModeTime}
                onChange={(e) => setDarkModeTime(e.target.value)}
              />
            </div>
          </div>
        )}
        <Button onClick={handleSave}>Save Scheduled Theme Settings</Button>
      </CardContent>
    </Card>
  );
}
