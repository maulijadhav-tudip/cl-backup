import base64 from "base-64";

export const getHeaders = () => {
  let headers = new Headers();
  headers.append(
    "Authorization",
    "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
  );
  return headers;
};