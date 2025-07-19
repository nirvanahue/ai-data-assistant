import { useState, FormEvent } from "react";

type QueryFormProps = {
  onSubmit: (question: string) => void;
  loading: boolean;
};

export default function QueryForm({ onSubmit, loading }: QueryFormProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    onSubmit(question.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor="question" className="font-medium text-gray-700">Your Question</label>
      <input
        id="question"
        type="text"
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        placeholder="e.g. Show me all users who signed up last week"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        disabled={loading}
        required
      />
      <button
        type="submit"
        className="bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
        disabled={loading || !question.trim()}
      >
        {loading ? "Generating..." : "Generate SQL"}
      </button>
    </form>
  );
} 