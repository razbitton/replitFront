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
                    <Label htmlFor="initialMargin">Initial Margin Requirement ($)</Label>
                    <Input
                      id="initialMargin"
                      type="number"
                      value={settings?.initialMargin}
                      onChange={(e) => handleGlobalSettingChange("initialMargin", Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maintenanceMargin">Maintenance Margin ($)</Label>
                    <Input
                      id="maintenanceMargin"
                      type="number"
                      value={settings?.maintenanceMargin}
                      onChange={(e) => handleGlobalSettingChange("maintenanceMargin", Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contractSize">Contract Size</Label>
                    <Input
                      id="contractSize"
                      type="number"
                      value={settings?.contractSize}
                      onChange={(e) => handleGlobalSettingChange("contractSize", Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tickValue">Tick Value ($)</Label>
                    <Input
                      id="tickValue"
                      type="number"
                      step="0.01"
                      value={settings?.tickValue}
                      onChange={(e) => handleGlobalSettingChange("tickValue", Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tradingHoursStart">Trading Hours Start</Label>
                    <Input
                      id="tradingHoursStart"
                      type="time"
                      value={settings?.tradingHoursStart}
                      onChange={(e) => handleGlobalSettingChange("tradingHoursStart", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tradingHoursEnd">Trading Hours End</Label>
                    <Input
                      id="tradingHoursEnd"
                      type="time"
                      value={settings?.tradingHoursEnd}
                      onChange={(e) => handleGlobalSettingChange("tradingHoursEnd", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Risk Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="maxPositionSize">Max Position Size</Label>
                      <Input
                        id="maxPositionSize"
                        type="number"
                        value={settings?.maxPositionSize}
                        onChange={(e) => handleGlobalSettingChange("maxPositionSize", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxDailyLoss">Max Daily Loss ($)</Label>
                      <Input
                        id="maxDailyLoss"
                        type="number"
                        value={settings?.maxDailyLoss}
                        onChange={(e) => handleGlobalSettingChange("maxDailyLoss", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="targetProfit">Target Profit ($)</Label>
                      <Input
                        id="targetProfit"
                        type="number"
                        value={settings?.targetProfit}
                        onChange={(e) => handleGlobalSettingChange("targetProfit", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
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
                                <Label htmlFor={`upperBand-${index}`}>Upper Band Threshold</Label>
                                <Input
                                  id={`upperBand-${index}`}
                                  type="number"
                                  step="0.01"
                                  value={day.upperBandThreshold}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "upperBandThreshold", Number(e.target.value))
                                  }
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`lowerBand-${index}`}>Lower Band Threshold</Label>
                                <Input
                                  id={`lowerBand-${index}`}
                                  type="number"
                                  step="0.01"
                                  value={day.lowerBandThreshold}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "lowerBandThreshold", Number(e.target.value))
                                  }
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`maxTradeQty-${index}`}>Max Trade Quantity</Label>
                                <Input
                                  id={`maxTradeQty-${index}`}
                                  type="number"
                                  value={day.maxTradeQuantity}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "maxTradeQuantity", Number(e.target.value))
                                  }
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`volatilityFactor-${index}`}>Premium Volatility Factor (%)</Label>
                                <Input
                                  id={`volatilityFactor-${index}`}
                                  type="number"
                                  value={day.premiumVolatilityFactor}
                                  onChange={(e) => 
                                    handleDailyParameterChange(index, "premiumVolatilityFactor", Number(e.target.value))
                                  }
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <Label htmlFor={`strategy-${index}`}>Trading Strategy</Label>
                                <Select
                                  value={day.tradingStrategy}
                                  onValueChange={(value) => 
                                    handleDailyParameterChange(index, "tradingStrategy", value)
                                  }
                                >
                                  <SelectTrigger id={`strategy-${index}`} className="mt-1">
                                    <SelectValue placeholder="Select a strategy" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Mean Reversion">Mean Reversion</SelectItem>
                                    <SelectItem value="Trend Following">Trend Following</SelectItem>
                                    <SelectItem value="Volatility Breakout">Volatility Breakout</SelectItem>
                                    <SelectItem value="Pair Hedging">Pair Hedging</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Time-Specific Adjustments</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor={`marketOpen-${index}`} className="text-xs text-gray-500">
                                    Market Open (9:30-10:00)
                                  </Label>
                                  <Input
                                    id={`marketOpen-${index}`}
                                    type="number"
                                    step="0.1"
                                    value={day.timeAdjustments.marketOpen}
                                    onChange={(e) => 
                                      handleTimeAdjustmentChange(index, "marketOpen", Number(e.target.value))
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`midDay-${index}`} className="text-xs text-gray-500">
                                    Mid-Day (12:00-13:30)
                                  </Label>
                                  <Input
                                    id={`midDay-${index}`}
                                    type="number"
                                    step="0.1"
                                    value={day.timeAdjustments.midDay}
                                    onChange={(e) => 
                                      handleTimeAdjustmentChange(index, "midDay", Number(e.target.value))
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`marketClose-${index}`} className="text-xs text-gray-500">
                                    Market Close (15:30-16:00)
                                  </Label>
                                  <Input
                                    id={`marketClose-${index}`}
                                    type="number"
                                    step="0.1"
                                    value={day.timeAdjustments.marketClose}
                                    onChange={(e) => 
                                      handleTimeAdjustmentChange(index, "marketClose", Number(e.target.value))
                                    }
                                    className="mt-1"
                                  />
                                </div>
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
