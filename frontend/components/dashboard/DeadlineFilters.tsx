import { Dispatch, SetStateAction } from "react";

import { Priority, Status } from "@/lib/agent";
import type { DeadlineFiltersState } from "@/hooks/useDeadlines";

type Props = {
  filters: DeadlineFiltersState;
  setFilters: Dispatch<SetStateAction<DeadlineFiltersState>>;
};

export default function DeadlineFilters({ filters, setFilters }: Props) {
  return (
    <>
      <input
        type="text"
        placeholder="Search deadlines..."
        value={filters.searchTerm}
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            searchTerm: event.target.value,
          }))
        }
        className="mt-4 w-full rounded-lg border border-gray-700 bg-zinc-900 p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value as Status | "All",
            }))
          }
          className="w-full rounded-lg border border-gray-700 bg-zinc-900 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="All">All Status</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              priority: event.target.value as Priority | "All",
            }))
          }
          className="w-full rounded-lg border border-gray-700 bg-zinc-900 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="All">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
    </>
  );
}
