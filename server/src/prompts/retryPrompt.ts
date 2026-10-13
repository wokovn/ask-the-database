export interface RetryPromptContext {
  originalQuestion: string;
  failedSql: string;
  errorMessage: string;
  attemptNumber: number;
  maxAttempts: number;
}

export function buildRetryPrompt(context: RetryPromptContext): string {
  return `The previous SQL query that you generated resulted in an execution error on PostgreSQL.

User Question: "${context.originalQuestion}"
Attempt: ${context.attemptNumber} of ${context.maxAttempts}

Failed SQL:
${context.failedSql}

PostgreSQL Error Message:
${context.errorMessage}

Please analyze the PostgreSQL error message, fix the query, and provide the corrected SQL.
Remember:
- Only generate a valid, safe, read-only SELECT statement.
- Maintain all business rules (paid orders for revenue/spending, VND currency).
- Respond ONLY with the JSON format:
{
  "reasoning": "Brief explanation in Vietnamese of how the error was corrected",
  "sql": "Corrected SELECT query",
  "isAmbiguous": false,
  "isRefusal": false,
  "followUpQuestion": null
}`;
}
