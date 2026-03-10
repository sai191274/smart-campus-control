import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GridSenseProvider } from "@/contexts/GridSenseContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import CameraPage from "@/pages/CameraPage";
import Savings from "@/pages/Savings";
import SettingsPage from "@/pages/SettingsPage";
import LogsPage from "@/pages/LogsPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <GridSenseProvider>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </GridSenseProvider>
);

export default App;
