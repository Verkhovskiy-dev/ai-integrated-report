import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LiveDataProvider } from "./contexts/LiveDataContext";
import { FilterProvider } from "./contexts/FilterContext";
import { I18nProvider } from "./contexts/I18nContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { ExecutiveDataProvider } from "./contexts/ExecutiveDataContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <I18nProvider>
          <ViewModeProvider>
          <ExecutiveDataProvider>
          <LiveDataProvider>
            <FilterProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </FilterProvider>
          </LiveDataProvider>
          </ExecutiveDataProvider>
          </ViewModeProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
