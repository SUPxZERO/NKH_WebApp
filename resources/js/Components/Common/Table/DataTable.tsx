import type { ReactNode } from 'react';

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
};

export default function DataTable<T extends Record<string, any>>({ columns, data }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-4 py-2 text-sm">
                  {c.render ? c.render(row) : String(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
