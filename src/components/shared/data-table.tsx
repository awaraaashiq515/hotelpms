'use client';

import React from 'react';

interface Column<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
}

export function DataTable<T>({ columns, data, loading }: DataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((_, j) => (
                  <td key={j} className="px-6 py-5">
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center text-gray-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest">
                No records found
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 text-[13px] text-gray-700 dark:text-slate-300 font-medium">
                    {col.cell ? col.cell(row) : (row[col.accessorKey!] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
