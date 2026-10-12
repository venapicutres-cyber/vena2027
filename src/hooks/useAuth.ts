import React, { useState, useEffect, useCallback } from "react";
import { User, ViewType } from "../types";
import { LAST_ROUTE_STORAGE_KEY } from "../routes/routesConfig";
import { supabase } from "../lib/supabaseClient";



export interface UseAuthReturn {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  handleLoginSuccess: (user: User) => void;
  handleLogout: () => void;
  hasPermission: (view: ViewType) => boolean;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const storedValue = window.localStorage.getItem("weddfin-isAuthenticated");
      return storedValue ? JSON.parse(storedValue) : false;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedValue = window.localStorage.getItem("weddfin-currentUser");
      return storedValue ? JSON.parse(storedValue) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    window.localStorage.setItem(
      "weddfin-isAuthenticated",
      JSON.stringify(isAuthenticated),
    );
  }, [isAuthenticated]);

  useEffect(() => {
    window.localStorage.setItem(
      "weddfin-currentUser",
      JSON.stringify(currentUser),
    );
  }, [currentUser]);


  const handleLoginSuccess = useCallback((user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    try {
      const last = window.localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
      if (
        last &&
        typeof last === "string" &&
        last.startsWith("#/") &&
        !last.startsWith("#/home") &&
        !last.startsWith("#/login")
      ) {
        window.location.hash = last;
        return;
      }
    } catch (e) {
      console.warn("[Routing] Failed to read last route after login:", e);
    }

    window.location.hash = "#/dashboard";
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("[Supabase] Logout error:", e);
    }
    
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(LAST_ROUTE_STORAGE_KEY);
    } catch {}
    window.location.hash = "#/home";
  }, []);

  const hasPermission = useCallback(
    (view: ViewType) => {
      if (!currentUser) return false;
      if (currentUser.role === "Admin") return true;
      return currentUser.permissions?.includes(view) || false;
    },
    [currentUser],
  );

  return {
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    setCurrentUser,
    users,
    setUsers,
    handleLoginSuccess,
    handleLogout,
    hasPermission,
  };
}

export default useAuth;
