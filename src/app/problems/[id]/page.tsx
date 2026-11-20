import { getProblem, getProblems } from "@/lib/data";
import ProblemDetailClient from "./ProblemDetailClient";

export function generateStaticParams() {
  const problems = getProblems();
  const set = new Set<string>();
  Object.keys(problems).forEach((key) => {
    set.add(key);
    const stripped = key.replace(/^0+/, "");
    if (stripped) set.add(stripped);
  });
  return Array.from(set).map((id) => ({ id }));
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = getProblem(id);

  return (
    <ProblemDetailClient
      id={id}
      matchedKey={match?.key || id}
      problem={match?.problem || null}
    />
  );
}
