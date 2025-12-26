import { ProblemForm } from "../problem-form";

export default function NewProblemPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create Problem</h1>
        <p className="text-slate-400">Add a new coding challenge</p>
      </div>

      <ProblemForm />
    </div>
  );
}

