import { createContext, useContext } from "react";

// Shared state for the report flow (draft + the user's submitted reports).
// Kept in plain JS (no JSX) so react-refresh stays happy.
export const FlowContext = createContext(null);

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used inside FlowContext.Provider");
  return ctx;
}

export const EMPTY_DRAFT = {
  photo: null,
  lat: -26.6736,
  lng: 27.9319,
  address: "Vereeniging, Gauteng, South Africa",
  issueType: "Pothole",
  description: "",
  size: "Medium",
  depth: "Moderate",
  traffic: "Low",
  damage: "No",
};
