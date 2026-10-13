import React from 'react';

interface SampleQuestionsProps {
  onSelect: (question: string) => void;
  disabled: boolean;
}

const SAMPLE_QUESTIONS = [
  'How many customers are there?',
  'Top 3 customers by total spending',
  'Customers who never placed an order',
  'Monthly revenue in 2025',
  'List all orders from 2024',
  'Show employee salaries',
  'Delete all cancelled orders',
  'What is the best product?',
];

export const SampleQuestions: React.FC<SampleQuestionsProps> = ({ onSelect, disabled }) => {
  return (
    <div className="sample-bar">
      <div className="sample-title">Câu hỏi kiểm thử mẫu (Test Questions)</div>
      <div className="sample-list">
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            className="sample-chip"
            onClick={() => onSelect(q)}
            disabled={disabled}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
