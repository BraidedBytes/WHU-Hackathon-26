"use client";

import { useEffect } from "react";

export function DemoReady() {
  useEffect(() => {
    document.body.removeAttribute("data-spoilsport-ignore");
    document.documentElement.setAttribute("data-spoilsport-ready", "");
    return () => {
      document.documentElement.removeAttribute("data-spoilsport-ready");
      document.body.setAttribute("data-spoilsport-ignore", "");
    };
  }, []);

  return null;
}
