/** Temporary placeholder for pages that are not built yet. Delete when all pages are done. */
export function PageStub({ title, todo }: { title: string; todo: string[] }) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      <p className="mb-2 text-sm text-neutral-500">Not built yet. TODO:</p>
      <ul className="list-disc pl-6 text-sm text-neutral-700">
        {todo.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
