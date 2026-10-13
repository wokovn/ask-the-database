import React from 'react';
import type { QueryExecutionResult } from '../types.js';

interface DataTableProps {
  result: QueryExecutionResult;
}

function formatCellValue(value: unknown, fieldName: string): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  const lowerField = fieldName.toLowerCase();
  const isCurrency =
    lowerField.includes('vnd') ||
    lowerField.includes('revenue') ||
    lowerField.includes('spending') ||
    lowerField.includes('price') ||
    lowerField.includes('amount');

  if (typeof value === 'number' || (!isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '')) {
    const num = Number(value);
    if (isCurrency && Number.isInteger(num)) {
      return `${num.toLocaleString('vi-VN')} ₫`;
    }
    return num.toLocaleString('vi-VN');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function isNumericValue(value: unknown): boolean {
  if (typeof value === 'number') return true;
  if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') return true;
  return false;
}

export const DataTable: React.FC<DataTableProps> = ({ result }) => {
  const { rows, fields, rowCount, durationMs, truncated, totalRowCount } = result;

  if (rowCount === 0) {
    return (
      <div className="table-wrapper">
        <div className="table-header-info">
          <span>0 kết quả</span>
          <span>{durationMs}ms</span>
        </div>
        <div className="empty-data-alert">
          Không có dòng dữ liệu nào được tìm thấy.
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-header-info">
        <span>
          {truncated
            ? `Hiển thị 100 trên tổng số ${totalRowCount} dòng`
            : `${rowCount} dòng`}
        </span>
        <span>Thời gian chạy: {durationMs}ms</span>
      </div>

      <div className="table-scroll">
        <table className="clean-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
              {fields.map((field) => (
                <th key={field}>{field}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {rowIdx + 1}
                </td>
                {fields.map((field) => {
                  const val = row[field];
                  const isNum = isNumericValue(val);
                  return (
                    <td key={field} className={isNum ? 'numeric' : ''}>
                      {formatCellValue(val, field)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
