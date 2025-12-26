import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-emerald-500 hover:bg-emerald-600 text-sm normal-case",
            card: "bg-slate-800 border border-slate-700",
            headerTitle: "text-white",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton:
              "bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
            formFieldLabel: "text-slate-300",
            formFieldInput:
              "bg-slate-700 border-slate-600 text-white placeholder:text-slate-500",
            footerActionLink: "text-emerald-400 hover:text-emerald-300",
          },
        }}
      />
    </div>
  );
}

