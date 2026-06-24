import { useEffect } from "react";

export function useLandingBody() {
  useEffect(() => {
    document.body.classList.add("landing-active");
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.height = "auto";
    return () => {
      document.body.classList.remove("landing-active");
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    };
  }, []);
}
