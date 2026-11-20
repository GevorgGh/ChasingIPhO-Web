import problemsData from "@/data/problems.json";
import topicsData from "@/data/topics.json";
import materialsData from "@/data/materials.json";
import selfMaterialsData from "@/data/self_materials.json";
import questsData from "@/data/quests.json";
import iphoData from "@/data/ipho_olympiads.json";
import armenianData from "@/data/armenian_olympiads.json";
import olympAmData from "@/data/olymp_am_physics.json";

// --- Types ---
export interface Problem {
  title: string | null;
  title_hy?: string | null;
  title_ru?: string | null;
  topic: string;
  status: string;
  folder_id?: string | null;
  folder_name?: string | null;
  file_id?: string | null;
  problem_file_id?: string | null;
  problem_file_name?: string | null;
  sol_file_id?: string | null;
  solution_file_id?: string | null;
  solution_file_name?: string | null;
  tex_file_id?: string | null;
  sol_tex_file_id?: string | null;
  link?: string | null;
  solution_link?: string | null;
}

export interface Material {
  id: string;
  title: string;
  topic: string;
  title_hy?: string | null;
  title_ru?: string | null;
  status: string;
  file_id: string;
  link?: string | null;
}

export interface Quest {
  question: string;
  answer: string;
  options: string[];
  is_bonus?: boolean;
  question_en?: string;
  options_en?: string[];
  question_ru?: string;
  options_ru?: string[];
}

export interface IphoProblem {
  id: string;
  year: string;
  country: string;
  number: string;
  type: string;
  title: string;
  topics: string[];
  subtopics: string[];
  problem_url: string;
  solution_url?: string | null;
}

export interface OlympAmEntry {
  node_id: string;
  url: string;
  header: string;
  title: string;
  year: string;
  stage: string;
  attachments: { title: string; url: string }[];
}

// --- Data accessors ---
export function getProblems(): Record<string, Problem> {
  return problemsData as unknown as Record<string, Problem>;
}

/**
 * Robust problem lookup by ID (e.g. "1", "0001", "78", "0078")
 */
export function getProblem(id: string): { key: string; problem: Problem } | undefined {
  const problems = getProblems();
  // 1. Direct match
  if (problems[id]) return { key: id, problem: problems[id] };

  // 2. Stripped leading zeros match
  const stripped = id.replace(/^0+/, "");
  for (const [key, val] of Object.entries(problems)) {
    if (key.replace(/^0+/, "") === stripped) {
      return { key, problem: val };
    }
  }

  // 3. 4-digit zero-padded match
  const padded = id.padStart(4, "0");
  if (problems[padded]) return { key: padded, problem: problems[padded] };

  return undefined;
}

/**
 * Format problem number for display:
 * Shows clean integer number (e.g. 78, 1) and raw key if needed
 */
export function formatProblemNumber(key: string): { display: string; raw: string } {
  const num = parseInt(key, 10);
  return {
    display: isNaN(num) ? key : num.toString(),
    raw: key,
  };
}

export function getActiveProblems(): [string, Problem][] {
  const problems = getProblems();
  return Object.entries(problems)
    .filter(([, p]) => p.status === "active" || p.status === "solved")
    .sort(([a], [b]) => parseInt(b, 10) - parseInt(a, 10));
}

export function getProblemsByTopic(): Record<string, [string, Problem][]> {
  const active = getActiveProblems();
  const byTopic: Record<string, [string, Problem][]> = {};
  for (const [id, p] of active) {
    const topic = p.topic?.toLowerCase().trim() || "general";
    if (!byTopic[topic]) byTopic[topic] = [];
    byTopic[topic].push([id, p]);
  }
  return byTopic;
}

export function getTopics(): Record<string, { en: string; hy: string; ru: string }> {
  return topicsData as Record<string, { en: string; hy: string; ru: string }>;
}

export function getMaterials(): Material[] {
  return (materialsData as unknown as Material[]).filter((m) => m.status === "active");
}

export function getSelfMaterials(): Material[] {
  return (selfMaterialsData as unknown as Material[]).filter((m) => m.status === "active");
}

export function getQuests(): Quest[] {
  return questsData as unknown as Quest[];
}

export function getIphoData() {
  const raw = iphoData as unknown as {
    topics: Record<string, string>;
    subtopics: Record<string, Record<string, string>>;
    problems: IphoProblem[];
  };
  return raw;
}

export function getArmenianOlympiads() {
  return armenianData as unknown as {
    source: string;
    subject: string;
    nodes: OlympAmEntry[];
  };
}

export function getOlympAmPhysics(): OlympAmEntry[] {
  return olympAmData as unknown as OlympAmEntry[];
}

// --- Google Drive URL helper ---
export function getDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

// --- Problem title helper ---
export function getProblemTitle(problem: Problem, lang: string): string {
  if (lang === "hy" && problem.title_hy) return problem.title_hy;
  if (lang === "ru" && problem.title_ru) return problem.title_ru;
  return problem.title || "";
}

// --- Material title helper ---
export function getMaterialTitle(material: Material, lang: string): string {
  if (lang === "hy" && material.title_hy) return material.title_hy;
  if (lang === "ru" && material.title_ru) return material.title_ru;
  return material.title?.replace(/_/g, " ") || "";
}
