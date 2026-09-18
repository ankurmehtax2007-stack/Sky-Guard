import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { getStationCity, KNOWN_CITIES, KNOWN_STATIONS } from "../utils/constants";

const CityScopeContext = createContext(null);

function normalizeCity(value) {
  if (!value) return null;
  const match = KNOWN_CITIES.find((c) => c.toLowerCase() === String(value).toLowerCase());
  return match || null;
}

// Safe wrapper: returns auth data or null defaults without throwing.
// useAuth() throws if called outside AuthProvider (e.g. during React
// StrictMode double-invoke). We catch that so the tree doesn't crash.
function useSafeAuth() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAuth();
  } catch {
    return { role: "operator", user: null, isInitializing: true };
  }
}

export function CityScopeProvider({ children }) {
  const { role, user, isInitializing } = useSafeAuth();
  const accountCity = normalizeCity(user?.city) || normalizeCity(getStationCity(user?.stationId));
  const isScopedAdmin = role === "admin" && Boolean(normalizeCity(user?.city) || user?.stationId);

  const availableCities = role === "admin"
    ? (isScopedAdmin ? [accountCity].filter(Boolean) : ["All Cities", ...KNOWN_CITIES])
    : accountCity ? [accountCity] : KNOWN_CITIES;

  const [selectedCity, setSelectedCity] = useState("All Cities");

  useEffect(() => {
    if (isInitializing) return;
    const saved = localStorage.getItem("nimbus_admin_city");
    const initial = role === "admin"
      ? (isScopedAdmin ? accountCity : (saved && (saved === "All Cities" || KNOWN_CITIES.includes(saved)) ? saved : "All Cities"))
      : accountCity || "All Cities";
    setSelectedCity(initial);
    if (role !== "admin") localStorage.removeItem("nimbus_admin_city");
  }, [role, accountCity, isScopedAdmin, isInitializing]);

  const city = role === "admin"
    ? (isScopedAdmin ? accountCity : (selectedCity || "All Cities"))
    : (accountCity || "All Cities");

  const stationId = city && city !== "All Cities"
    ? Object.entries(KNOWN_STATIONS).find(([, value]) => value.city.toLowerCase() === city.toLowerCase())?.[0] || null
    : null;

  const value = useMemo(() => ({
    city,
    selectedCity: city,
    stationId,
    cities: availableCities,
    isCityScoped: city !== "All Cities",
    canChangeCity: role === "admin" && !isScopedAdmin,
    setCity: (nextCity) => {
      if (role !== "admin" || isScopedAdmin) return;
      const next = nextCity || "All Cities";
      localStorage.setItem("nimbus_admin_city", next);
      setSelectedCity(next);
    },
  }), [city, stationId, availableCities.join("|"), role, isScopedAdmin]);

  return <CityScopeContext.Provider value={value}>{children}</CityScopeContext.Provider>;
}

export function useCityScope() {
  const ctx = useContext(CityScopeContext);
  if (!ctx) throw new Error("useCityScope must be used within CityScopeProvider");
  return ctx;
}
