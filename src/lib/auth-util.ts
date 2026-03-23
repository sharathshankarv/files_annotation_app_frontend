export const isTokenExpired = (token: string | null): boolean => {
  if (!token || typeof window === "undefined") return true;

  try {
    const parts: string[] = token.split(".");

    if (parts.length < 2) return true;

    // 🛡️ THE FIX IS HERE: Added to grab the payload string.
    // Previously, I was assigning the entire array 'parts' to the string 'base64Url'.
    const base64Url: string = parts[1];

    // Now .replace() will work because base64Url is a string.
    const base64: string = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const { exp } = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);

    return exp < currentTime + 5;
  } catch (error) {
    return true;
  }
};
