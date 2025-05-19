import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalSettings, DailyParameters, DayParameter } from "@/contexts/TradingContext";
import { useToast } from "@/hooks/use-toast";

const Inputs = () => {
  const { 
    globalSettings, 
    dailyParameters, 
    saveGlobalSettings, 
    saveDailyParameters, 
    isLoading 
  } = useTradingContext();
  const { toast } = useToast();

  // Local state for form values
  const [settings, setSettings] = useState<GlobalSettings | null>(globalSettings);
  const [parameters, setParameters] = useState<DailyParameters | null>(dailyParameters);

  // Function to handle global settings form changes
  const handleGlobalSettingChange = (field: keyof GlobalSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  // Function to handle daily parameter changes
  const handleDailyParameterChange = (
    dayIndex: number,
    field: keyof Omit<DayParameter, "timeAdjustments">,
    value: any
  ) => {
    if (!parameters) return;
    const updatedParameters = [...parameters];
    updatedParameters[dayIndex] = {
      ...updatedParameters[dayIndex],
      [field]: value,
    };
    setParameters(updatedParameters);
  };

  // Function to handle time adjustment changes
  const handleTimeAdjustmentChange = (
    dayIndex: number,
    field: keyof DayParameter["timeAdjustments"],
    value: number
  ) => {
    if (!parameters) return;
    const updatedParameters = [...parameters];
    updatedParameters[dayIndex] = {
      ...updatedParameters[dayIndex],
      timeAdjustments: {
        ...updatedParameters[dayIndex].timeAdjustments,
        [field]: value,
      },
    };
    setParameters(updatedParameters);
  };

  // Handle global settings form submission
  const handleGlobalSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    try {
      await saveGlobalSettings(settings);
      toast({
        title: "Success",
        description: "Global settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save global settings",
        variant: "destructive",
      });
    }
  };

  // Handle daily parameters form submission
  const handleDailyParametersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parameters) return;
    
    try {
      await saveDailyParameters(parameters);
      toast({
        title: "Success",
        description: "Daily parameters saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save daily parameters",
        variant: "destructive",
      });
    }
  };

  // Handle global settings form reset
  const handleGlobalSettingsReset = () => {
    setSettings(globalSettings);
  };

  // Handle daily parameters form reset
  const handleDailyParametersReset = () => {
    setParameters(dailyParameters);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[600px] rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Tabs defaultValue="global" className="w-full">
          <CardContent className="p-0">
            <TabsList className="w-full rounded-none border-b grid grid-cols-2">
              <TabsTrigger value="global" className="rounded-none data-[state=active]:border-b-2 py-4">
                Global Settings
              </TabsTrigger>
              <TabsTrigger value="daily" className="rounded-none data-[state=active]:border-b-2 py-4">
                Daily Parameters
              </TabsTrigger>
            </TabsList>
            
            {/* Global Settings Tab */}
            <TabsContent value="global" className="p-6">
              <form onSubmit={handleGlobalSettingsSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="futureSymbol">Future Symbol</Label>
                    <Input
                      id="futureSymbol"
                      value={settings?.futureSymbol}
                      onChange={(e) => handleGlobalSettingChange("futureSymbol", e.target.value)}
                      className="mt-1"
                      placeholder="ES"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="marginRequirement">Margin Requirement ($)</Label>
                    <Input
                      id="marginRequirement"
                      type="number"
                      value={settings?.marginRequirement}
                      onChange={(e) => handleGlobalSettingChange("marginRequirement", Number(e.target.value))}
                      className="mt-1"
                      placeholder="12000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={settings?.expirationDate}
                      onChange={(e) => handleGlobalSettingChange("expirationDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expirationTime">Expiration Time</Label>
                    <Input
                      id="expirationTime"
                      type="time"
                      value={settings?.expirationTime}
                      onChange={(e) => handleGlobalSettingChange("expirationTime", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signalCalculationStartTime">Signal Calculation Start Time</Label>
                    <Input
                      id="signalCalculationStartTime"
                      type="time"
                      value={settings?.signalCalculationStartTime}
                      onChange={(e) => handleGlobalSettingChange("signalCalculationStartTime", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tradingStartTime">Trading Start Time</Label>
                    <Input
                      id="tradingStartTime"
                      type="time"
                      value={settings?.tradingStartTime}
                      onChange={(e) => handleGlobalSettingChange("tradingStartTime", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="globalEndTime">Global End Time</Label>
                    <Input
                      id="globalEndTime"
                      type="time"
                      value={settings?.globalEndTime}
                      onChange={(e) => handleGlobalSettingChange("globalEndTime", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={handleGlobalSettingsReset}>
                    Reset
                  </Button>
                  <Button type="submit">Save Global Settings</Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Daily Parameters Tab */}
            <TabsContent value="daily" className="p-6">
              {parameters && (
                <form onSubmit={handleDailyParametersSubmit}>
                  <div className="space-y-4">
                    {/* Day accordions */}
                    <Accordion type="multiple" defaultValue={["0"]}>
                      {parameters.map((day, index) => (
                        <AccordionItem key={index} value={index.toString()}>
                          <AccordionTrigger className="px-4 py-3">
                            {day.day}
                          </AccordionTrigger>
                          <AccordionContent className="p-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <Label htmlFor={`premiumThresholdIn-${index}`}>Premium Threshold In</Label>
                                <Input
                                  id={`premiumThresholdIn-${index}`}
                                  type="number"
                                  step="0.01"
                                  value={day.premiumThresholdIn}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "premiumThresholdIn", Number(e.target.value))
                                  }
                                  className="mt-1"
                                  placeholder="2.5"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`premiumThresholdOut-${index}`}>Premium Threshold Out</Label>
                                <Input
                                  id={`premiumThresholdOut-${index}`}
                                  type="number"
                                  step="0.01"
                                  value={day.premiumThresholdOut}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "premiumThresholdOut", Number(e.target.value))
                                  }
                                  className="mt-1"
                                  placeholder="1.5"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`avgLength-${index}`}>AVG Length</Label>
                                <Input
                                  id={`avgLength-${index}`}
                                  type="number"
                                  value={day.avgLength}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "avgLength", Number(e.target.value))
                                  }
                                  className="mt-1"
                                  placeholder="20"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`upperBandDeviation-${index}`}>Upper Band Deviation</Label>
                                <Input
                                  id={`upperBandDeviation-${index}`}
                                  type="number"
                                  step="0.1"
                                  value={day.upperBandDeviation}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "upperBandDeviation", Number(e.target.value))
                                  }
                                  className="mt-1"
                                  placeholder="2.0"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`lowerBandDeviation-${index}`}>Lower Band Deviation</Label>
                                <Input
                                  id={`lowerBandDeviation-${index}`}
                                  type="number"
                                  step="0.1"
                                  value={day.lowerBandDeviation}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "lowerBandDeviation", Number(e.target.value))
                                  }
                                  className="mt-1"
                                  placeholder="2.0"
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={handleDailyParametersReset}>
                      Reset
                    </Button>
                    <Button type="submit">Save Daily Parameters</Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Inputs;
