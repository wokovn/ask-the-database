import React, { useState } from 'react';

interface SqlBlockProps {
  sql: string;
}

export const SqlBlock: React.FC<SqlBlockProps> = ({ sql }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sql-wrapper">
      <div className="sql-header">
        <span>PostgreSQL</span>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? 'Đã sao chép' : 'Sao chép'}
        </button>
      </div>
      <pre className="sql-code">
        <code>{sql}</code>
      </pre>
    </div>
  );
};
