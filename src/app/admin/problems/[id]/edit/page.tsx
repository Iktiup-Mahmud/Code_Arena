import { notFound } from "next/navigation";
import { getProblemById } from "@/lib/actions/problems";
import { ProblemForm } from "../../problem-form";

interface EditProblemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProblemPage({ params }: EditProblemPageProps) {
  const { id } = await params;
  const problem = await getProblemById(id);

  if (!problem) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Problem</h1>
        <p className="text-slate-400">Update {problem.title}</p>
      </div>

      <ProblemForm
        initialData={{
          id: problem.id,
          title: problem.title,
          slug: problem.slug,
          description: problem.description,
          difficulty: problem.difficulty,
          testCases: problem.testCases as Array<{
            input: string;
            expectedOutput: string;
            isHidden: boolean;
          }>,
          starterCode: problem.starterCode as Record<string, string>,
          constraints: problem.constraints,
          hints: problem.hints,
          isPublished: problem.isPublished,
        }}
      />
    </div>
  );
}

