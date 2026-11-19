import { getUsers } from "../../api/users";
import { useCurrentUser } from "../../context/CurrentUserContext";
import { useApi } from "../../hooks/useApi";

/** Demo "login": choose which user you are acting as. No password — see docs/PROJECT_PLAN.md. */
export function UserPicker() {
  const { userId, setUserId } = useCurrentUser();
  const { data: users, error } = useApi(getUsers);

  if (error) return <span className="text-sm text-red-600">Users unavailable</span>;

  return (
    <select
      className="rounded border px-2 py-1 text-sm"
      value={userId ?? ""}
      onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">Pick a user…</option>
      {users?.map((u) => (
        <option key={u.userId} value={u.userId}>
          {u.fullName} ({u.role})
        </option>
      ))}
    </select>
  );
}
