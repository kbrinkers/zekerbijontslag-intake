"use client";

import { useEffect, useState } from "react";import Link from "next/link";type Intake = {  id: string;  created_at: string;  naam: string | null;  urgentie: string | null;  status: string;  situatie_type: string | null;  tekentermijn: string | null;  completeness_score: number | null;  tv_indicatie: number | null;  sector: string | null;  emotionele_staat: string | null;};const URGENTIE_STYLES: Record<string, string> = {  kritiek: "bg-red-100 text-red-700",  hoog: "bg-orange-100 text-orange-700",  middel: "bg-yellow-100 text-yellow-700",  laag: "bg-gray-100 text-gray-600",};const STATUS_LABELS: Record<string, string> = {  nieuw: "Nieuw",  in_behandeling: "In behandeling",  wacht_op_klant: "Wacht op klant",  afgerond: "Afgerond",  niet_doorgegaan: "Niet doorgegaan",};const SITUATIE_LABELS: Record<string, string> = {  VSO_ontvangen: "VSO ontvangen",

export const dynamic = "force-dynamic";
export const dynamic = "force-dynamic";
import Link from "next/link";

type Intake = {
  id: string;
  created_at: string;
  naam: string | null;
  urgentie: string | null;
  status: string;
  situatie_type: string | null;
  tekentermijn: string | null;
  completeness_score: number | null;
  tv_indicatie: number | null;
  sector: string | null;
  emotionele_staat: string | null;
};

const URGENTIE_STYLES: Record<string, string> = {
  kritiek: "bg-red-100 text-red-700",
  hoog: "bg-orange-100 text-orange-700",
  middel: "bg-yellow-100 text-yellow-700",
  laag: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  wacht_op_klant: "Wacht op klant",
  afgerond: "Afgerond",
  niet_doorgegaan: "Niet doorgegaan",
};

const SITUATIE_LABELS: Record<string, string> = {
  VSO_ontvangen: "VSO ontvangen",

export const dynamic = "force-dynamic";
