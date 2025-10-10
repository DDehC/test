// src/api/profile.js
const API = import.meta.env.VITE_API_BASE || "/api";

export async function fetchProfile() {
  try {
    console.log("DEBUG: Fetching profile from:", `${API}/profile/`);
    
    const res = await fetch(`${API}/profile/`, {
      credentials: "include",
    });
    
    console.log("DEBUG: Profile fetch response status:", res.status);
    console.log("DEBUG: Profile fetch response URL:", res.url);
    
    if (res.status === 401) {
      throw new Error("Unauthorized - Please log in");
    }
    
    if (res.status === 404) {
      throw new Error(`Profile endpoint not found at ${res.url}`);
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - Failed to fetch profile`);
    }
    
    const data = await res.json();
    console.log("DEBUG: Profile data received:", data);
    
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch profile");
    }
    
    return data.user;
  } catch (error) {
    console.error("DEBUG: Profile fetch error:", error);
    throw error;
  }
}

export async function saveProfile(payload) {
  try {
    console.log("DEBUG: Saving profile to:", `${API}/profile/`);
    
    const res = await fetch(`${API}/profile/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    console.log("DEBUG: Profile save response status:", res.status);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - Failed to save profile`);
    }
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to save profile");
    }
    
    return data.user;
  } catch (error) {
    console.error("DEBUG: Profile save error:", error);
    throw error;
  }
}

// Test if profile endpoint exists
export async function testProfileEndpoint() {
  try {
    const res = await fetch(`${API}/profile/test`, {
      credentials: "include",
    });
    console.log("DEBUG: Test endpoint status:", res.status);
    return res.ok;
  } catch (error) {
    console.error("DEBUG: Test endpoint error:", error);
    return false;
  }
}