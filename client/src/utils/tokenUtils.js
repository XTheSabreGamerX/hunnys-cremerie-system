export const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5001";

export const authFetch = async (url, options = {}) => {
  let token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  options.headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  try {
    let response = await fetch(url, options);

    if ((response.status === 401 || response.status === 403) && refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const { accessToken } = await refreshRes.json();

        localStorage.setItem("token", accessToken);
        options.headers.Authorization = `Bearer ${accessToken}`;

        response = await fetch(url, options);
      } else {
        console.warn("Refresh failed. Logging out.");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return;
      }
    }

    if ((response.status === 401 || response.status === 403) && !refreshToken) {
      console.warn("Unauthorized or forbidden. Logging out.");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return;
    }

    return response;
  } catch (err) {
    console.error("authFetch failed:", err);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
    return;
  }
};
