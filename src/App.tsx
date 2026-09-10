import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import TestSetup from "./pages/TestSetup";
import AIAnalysis from "./pages/AIAnalysis";
import MRGeneration from "./pages/MRGeneration";
import Testing from "./pages/Testing";
import Results from "./pages/Results";
import Violations from "./pages/Violations";
import Report from "./pages/Report";
import { DATASET_META } from "./data/testCases";

export default function App() {
  const location = useLocation();

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/setup" element={<TestSetup />} />
                  <Route path="/analysis" element={<AIAnalysis />} />
                  <Route path="/mr" element={<MRGeneration />} />
                  <Route path="/testing" element={<Testing />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/violations" element={<Violations />} />
                  <Route path="/report" element={<Report />} />
                </Routes>
              </motion.div>
            </AnimatePresence>

            <footer className="mt-10 border-t hairline pt-4 text-center text-[11px] text-slate-600">
              POC · simulated LLM / CLIP / CV-model services · dataset: {DATASET_META.source} ({DATASET_META.license})
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
