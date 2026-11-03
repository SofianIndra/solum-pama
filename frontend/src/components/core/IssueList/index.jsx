// Clicking an issue jumps to its field, which helps when the form is long and the field is off-screen.
const IssueList = ({ issues }) => (
  <div role="alert" className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger">
    <p className="font-semibold">Belum bisa dikirim. Lengkapi field berikut:</p>
    <ul className="mt-1.5 list-disc space-y-1 pl-4">
      {issues.map((issue) => (
        <li key={issue.id}>
          <a
            href={`#${issue.id}`}
            onClick={(event) => {
              event.preventDefault();
              const field = document.getElementById(issue.id);
              field?.scrollIntoView({ behavior: "smooth", block: "center" });
              field?.focus({ preventScroll: true });
            }}
            className="underline-offset-2 hover:underline"
          >
            <span className="font-medium">{issue.label}</span>: {issue.message}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default IssueList;
