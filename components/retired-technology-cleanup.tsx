"use client";
import { useEffect } from "react";
import { clearRetiredTechnologyStorage } from "@/lib/retired-technology-storage";
export function RetiredTechnologyCleanup() {
  useEffect(() => { try { clearRetiredTechnologyStorage(localStorage); } catch { /* Browser storage is optional. */ } }, []);
  return null;
}
