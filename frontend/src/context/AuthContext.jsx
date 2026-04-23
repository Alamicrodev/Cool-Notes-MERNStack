import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readJson, writeJson } from "../utils/storage";

const SESSION_KEY = "notethemood.session";      //will be used as key to store session data in local storage
const AuthContext = createContext(null);        //used in two functions, provider and consumers. 


//provider is the parent component, it wraps all children who will access the context data.  
export function AuthProvider({ children }) {

  // refresh page > Remounts all components(not just re-render) > Recreate all state variables(unlike re-render where values are preserved) 
  // gets sesssion from local storage > keeps the user signed in.
  const [session, setSession] = useState(() => readJson(SESSION_KEY, null));  

  // Everytime session changes we update in local storage. 
  useEffect(() => {
    writeJson(SESSION_KEY, session);
  }, [session]);


  // useMemo changes the object reference only when session changes, 
  // preventing unnecessary re-renders in every component consuming this context. 
  const value = useMemo(
    () => ({                                 
      session,                              
      setSession,
      logout: () => setSession(null),
      isAuthenticated: Boolean(session?.token && session?.userId),
    }),
    [session]
  );

  //pass in the session context in the value object. 
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



// simple hook to simplify getting 
export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return value;
}
