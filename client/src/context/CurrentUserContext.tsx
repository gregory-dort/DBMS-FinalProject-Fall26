import { createContext, useContext, useState, type ReactNode } from "react";
import { getStoredUserId, storeUserId } from "../api/http";

/** Which demo user is "logged in". The id is also sent to the API by api/http.ts. */
interface CurrentUserValue {
  userId: number | null;
  setUserId: (id: number | null) => void;
}

const CurrentUserContext = createContext<CurrentUserValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(getStoredUserId);

  const setUserId = (id: number | null) => {
    storeUserId(id);
    setUserIdState(id);
  };

  return <CurrentUserContext.Provider value={{ userId, setUserId }}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const value = useContext(CurrentUserContext);
  if (!value) throw new Error("useCurrentUser must be used inside <CurrentUserProvider>");
  return value;
}
