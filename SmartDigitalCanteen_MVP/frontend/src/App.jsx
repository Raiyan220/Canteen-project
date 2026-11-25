import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { UXProvider, useUX } from "./contexts/UXContext";
import GuestUpgradeModal from "./components/GuestUpgradeModal";
import Home from "./pages/Home";
import OrderHistory from "./pages/OrderHistory";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

function AppShell() {
  const { upgradeModalOpen, setUpgradeModalOpen } = useUX();

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<OrderHistory />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GuestUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <UXProvider>
      <AppShell />
    </UXProvider>
  );
}
