export type Route = "home" | "admin";

export function getCurrentRoute(): Route {
  const base = import.meta.env.BASE_URL; // e.g. "/" locally, "/repo-name/" in production
  let path = window.location.pathname;
  if (path.startsWith(base)) {
    path = path.slice(base.length);
  }
  path = path.replace(/^\/+|\/+$/g, "");
  return path === "admin" ? "admin" : "home";
}

export function navigate(route: Route): void {
  const base = import.meta.env.BASE_URL;
  const target = route === "admin" ? `${base}admin` : base;
  window.history.pushState(null, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
