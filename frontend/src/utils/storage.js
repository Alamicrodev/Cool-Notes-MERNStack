export function readJson(key, fallback = null) {
  //if its not the running in the browser(Server Side rendering) fall back.  
  if (typeof window === "undefined") {    
    return fallback;
  }
       
  try {                       
    //otherwise read from local storage
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}



export function writeJson(key, value) {
  if (typeof window === "undefined") {        
    return;
  }

  //write to the local storage
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}
