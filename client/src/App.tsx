import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import seoRoutes from "./data/seoRoutes.json";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LiveDataProvider } from "./contexts/LiveDataContext";
import { FilterProvider } from "./contexts/FilterContext";
import { I18nProvider } from "./contexts/I18nContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { ExecutiveDataProvider } from "./contexts/ExecutiveDataContext";
import { EkenRoutesProvider } from "./contexts/EkenRoutesContext";
import Home from "./pages/Home";
import Education from "./pages/Education";
import Programs from "./pages/Programs";
import Positions from "./pages/Positions";

function Router() {
  const [location] = useLocation();
  useEffect(() => {
    const route = location === "/" ? "/" : location.replace(/\/$/, "") + "/";
    const metadata = seoRoutes[route as keyof typeof seoRoutes];
    if (!metadata) return;
    const [title, description] = metadata;
    document.title = title;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://verkhovskiy.ai" + route;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = description;
  }, [location]);
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/education"} component={Education} />
      <Route path={"/education/"} component={Education} />
      <Route path={"/programs"} component={Programs} />
      <Route path={"/programs/"} component={Programs} />
      <Route path={"/positions"} component={Positions} />
      <Route path={"/positions/"} component={Positions} />
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
          <EkenRoutesProvider>
          <LiveDataProvider>
            <FilterProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </FilterProvider>
          </LiveDataProvider>
          </EkenRoutesProvider>
          </ExecutiveDataProvider>
          </ViewModeProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
