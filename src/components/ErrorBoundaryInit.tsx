"use client";

import { useEffect } from "react";
import { installGlobalErrorHandler } from "@/lib/errorReporter";

export default function ErrorBoundaryInit() {
  useEffect(() => {
    installGlobalErrorHandler();
  }, []);
  return null;
}
