import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New house project" subtitle="Set the overall budget first. Category budgets can be added later." />
      <Card>
        <ProjectForm />
      </Card>
    </div>
  );
}
