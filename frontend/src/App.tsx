import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Employees } from "./pages/Employees";
import { Customers } from "./pages/Customers";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/customers"
            element={
              <ProtectedRoute requiredPermission={["customer.manage", "customer.viewAllBranches"]}>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute requiredPermission="employee.manage">
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/customers" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
