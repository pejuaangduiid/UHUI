"use client";

import React from "react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  renderMobileCard?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  renderMobileCard,
  emptyMessage = "Tidak ada data.",
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {}
      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            {renderMobileCard ? (
              renderMobileCard(item)
            ) : (
              <div className="space-y-2 text-sm">
                {columns.map((col, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">
                      {col.header}
                    </span>
                    <span className="text-right text-zinc-900 dark:text-zinc-100">
                      {col.cell ? col.cell(item) : String(col.accessorKey ? item[col.accessorKey] : "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm md:block dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-4 py-3 font-semibold ${col.className ?? ""}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3.5 ${col.className ?? ""}`}>
                      {col.cell ? col.cell(item) : String(col.accessorKey ? item[col.accessorKey] : "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

