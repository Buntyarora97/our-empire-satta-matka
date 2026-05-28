import { useEffect } from "react";
import { useLocation } from "wouter";

export const getAdminToken = () => localStorage.getItem("adminToken");
export const setAdminToken = (token: string) => localStorage.setItem("adminToken", token);
export const removeAdminToken = () => localStorage.removeItem("adminToken");

export function useAuthGuard() {
  const [, setLocation] = useLocation();
  const token = getAdminToken();

  useEffect(() => {
    if (!token) {
      setLocation("/");
    }
  }, [token, setLocation]);

  return { isAuthenticated: !!token };
}
