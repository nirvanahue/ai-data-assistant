type OutputBoxProps = {
  sql: string;
  loading: boolean;
  error: string;
};

export default function OutputBox({ sql, loading, error }: OutputBoxProps) {
  return (
    <div className="mt-6 min-h-[80px]">
      {loading && (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
          <span>Generating SQL...</span>
        </div>
      )}
      {error && !loading && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-3 mt-2">{error}</div>
      )}
      {sql && !loading && !error && (
        <pre className="bg-gray-100 border border-gray-200 rounded p-4 mt-2 text-sm overflow-x-auto whitespace-pre-wrap text-gray-800">
          {sql}
        </pre>
      )}
    </div>
  );
} 