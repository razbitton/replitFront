import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import DetailedMetrics from "@/pages/DetailedMetrics";
import Inputs from "@/pages/Inputs";
import ManualOrders from "@/pages/ManualOrders";
import Accounts from "@/pages/Accounts";
import NotFound from "@/pages/not-found";
import { TradingProvider } from "@/contexts/TradingContext";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/detailed" component={DetailedMetrics} />
        <Route path="/inputs" component={Inputs} />
        <Route path="/manual" component={ManualOrders} />
        <Route path="/accounts" component={Accounts} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="trading-platform-theme">
        <TooltipProvider>
          <TradingProvider>
            <Toaster />
            <Router />
          </TradingProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
