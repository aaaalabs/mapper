import React from 'react';
import { cn } from '@/lib/utils';
import { adminStyles as styles } from '../admin/styles/adminStyles';

interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
}

export function AdminTable<T>({ data, columns, className }: AdminTableProps<T>): JSX.Element {
  return (
    <div className={cn("w-full overflow-auto", className)}>
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            {columns.map((column, i) => (
              <th key={i} className={styles.tableHeaderCell}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((column, j) => (
                <td key={j} className={styles.tableCell}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
