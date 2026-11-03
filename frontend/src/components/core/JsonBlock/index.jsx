// Collapsible, pretty-printed JSON, e.g. the payload sent to SOLUM and its response.
const JsonBlock = ({ title, value, isOpen = true }) => (
  <details className="rounded-lg border border-border" open={isOpen}>
    <summary className="cursor-pointer select-none bg-surface px-4 py-2.5 text-sm font-medium text-heading">
      {title}
    </summary>
    <pre className="max-h-96 overflow-auto border-t border-border p-4 font-mono text-xs leading-relaxed text-body">
      {JSON.stringify(value, null, 2)}
    </pre>
  </details>
);

export default JsonBlock;
