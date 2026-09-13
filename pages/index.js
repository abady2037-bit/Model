import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase.from('questions').select('*');
      if (!error) setQuestions(data || []);
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', direction: 'rtl', textAlign: 'right' }}>
      <h1>🎯 منصة مدار (Madar) - MVP v0.1</h1>
      <p>اختبارات وتوصيات دراسية مخصصة</p>
      <hr />
      <h2>أسئلة تحديد المستوى:</h2>
      {loading ? (
        <p>جاري تحميل الأسئلة من Supabase...</p>
      ) : questions.length === 0 ? (
        <p>لا توجد أسئلة مضافة حتى الآن في قاعدة البيانات.</p>
      ) : (
        <ul>
          {questions.map((q) => (
            <li key={q.id} style={{ marginBottom: '10px' }}>
              <strong>[{q.subject}]</strong> {q.question_text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
