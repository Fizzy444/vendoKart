"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "@/types/auth";
import { api } from "@/services/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalRole: "seller" | "buyer";
  openAuthModal: (role?: "seller" | "buyer") => void;
  closeAuthModal: () => void;
  login: (phone: string, otp: string, role: "seller" | "buyer", name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<"seller" | "buyer">("buyer");

  const refreshUser = async () => {
    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
      api.logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const openAuthModal = (role: "seller" | "buyer" = "buyer") => {
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (
    phone: string,
    otp: string,
    role: "seller" | "buyer",
    name?: string
  ) => {
    const res = await api.verifyOtp(phone, otp, role, name);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.roles.includes(role) || user.roles.includes("admin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        authModalRole,
        openAuthModal,
        closeAuthModal,
        login,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
