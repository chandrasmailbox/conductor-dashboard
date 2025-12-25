import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <ThemeProvider>
      <div className="App min-h-screen bg-background text-foreground">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
