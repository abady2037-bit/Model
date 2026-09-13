import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase.from('questions').select('*');
      if (!error && data && data.length > 0) {
        setQuestions(data);
      } else {
        // بيانات تجريبية للعرض والديكور في حال عدم وجود أسئلة في Supabase بعد
        setQuestions([
          {
            id: 1,
            subject: 'التمريض العام',
            question_text: 'ما هو المدى الطبيعي لمعدل نبضات القلب لدى الإنساني البالغ أثناء الراحة؟',
            options: ['40-60 نبضة/دقيقة', '60-100 نبضة/دقيقة', '100-120 نبضة/دقيقة', '120-140 نبضة/دقيقة'],
            correct_option: 1,
            recommendation: 'مراجعة العلامات الحيوية والمدى الطبيعي لكل عمر.'
          },
          {
            id: 2,
            subject: 'العناية المركزة',
            question_text: 'أي من المحاليل التالية يُعتبر Isotonic Solution؟',
            options: ['0.45% Normal Saline', '0.9% Normal Saline', '3% Normal Saline', 'Dextrose 10%'],
            correct_option: 1,
            recommendation: 'تركيز أكبر على أنواع المحاليل الوريدية واستخداماتها.'
          }
        ]);
      }
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  const handleNext = () => {
    if (selectedOption === questions[currentIndex].correct_option) {
      setScore(score + 1);
    }
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: '#64748b' }}>جاري تحضير بيئة اختبار مدار...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div style={styles.pageBackground}>
      <header style={styles.header}>
        <div style={styles.logoBadge}>🎯 مَـدَار | Madar</div>
        <span style={styles.versionBadge}>MVP v0.1</span>
      </header>

      <main style={styles.mainContainer}>
        {!isFinished ? (
          <div style={styles.card}>
            {/* Progress Bar */}
            <div style={styles.progressHeader}>
              <span style={styles.progressText}>السؤال {currentIndex + 1} من {questions.length}</span>
              <span style={styles.subjectTag}>{currentQ.subject}</span>
            </div>
            <div style={styles.progressBarTrack}>
              <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }}></div>
            </div>

            {/* Question Text */}
            <h2 style={styles.questionText}>{currentQ.question_text}</h2>

            {/* Options */}
            <div style={styles.optionsContainer}>
              {currentQ.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  style={{
                    ...styles.optionButton,
                    ...(selectedOption === idx ? styles.selectedOption : {})
                  }}
                >
                  <span style={styles.optionIndex}>{String.fromCharCode(65 + idx)}</span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              disabled={selectedOption === null}
              onClick={handleNext}
              style={{
                ...styles.nextButton,
                opacity: selectedOption === null ? 0.5 : 1,
                cursor: selectedOption === null ? 'not-allowed' : 'pointer'
              }}
            >
              {currentIndex + 1 === questions.length ? 'إنهاء الاختبار ومعاينة التوصية' : 'السؤال التالي ←'}
            </button>
          </div>
        ) : (
          /* Result & Recommendation Screen */
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={styles.successIcon}>🎉</div>
              <h2 style={styles.resultTitle}>كتمل اختبار تحديد المستوى!</h2>
              <p style={styles.scoreText}>
                النتيجة: <strong style={{ color: '#2563eb' }}>{score}</strong> من <strong>{questions.length}</strong>
              </p>

              <div style={styles.recommendationBox}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>💡 خطة الدراسة الموصى بها:</h3>
                <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>
                  بناءً على إجاباتك، يوصي المحرك بالتركيز على مراجعة مفاهيم <strong>{currentQ.subject}</strong> وإتاحة بنك الأسئلة المخصص لها اليوم.
                </p>
              </div>

              <button onClick={() => { setCurrentIndex(0); setScore(0); setIsFinished(false); setSelectedOption(null); }} style={styles.nextButton}>
                إعادة الاختبار 🔄
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  pageBackground: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    direction: 'rtl',
    color: '#0f172a'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  logoBadge: { fontWeight: '800', fontSize: '1.25rem', color: '#1e3a8a' },
  versionBadge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' },
  mainContainer: { maxWidth: '680px', margin: '40px auto', padding: '0 20px' },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)', border: '1px solid #e2e8f0' },
  progressHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: '#64748b' },
  subjectTag: { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 10px', borderRadius: '6px', fontWeight: '600' },
  progressBarTrack: { height: '8px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', marginBottom: '28px' },
  progressBarFill: { height: '100%', backgroundColor: '#2563eb', transition: 'width 0.3s ease' },
  questionText: { fontSize: '1.35rem', fontWeight: '700', lineHeight: '1.5', marginBottom: '24px', color: '#1e293b' },
  optionsContainer: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' },
  optionButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', backgroundColor: '#ffffff', textAlign: 'right', fontSize: '1rem', color: '#334155', transition: 'all 0.2s ease', cursor: 'pointer' },
  selectedOption: { borderColor: '#2563eb', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: '600' },
  optionIndex: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700' },
  nextButton: { width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '1rem', fontWeight: '700', transition: 'background 0.2s ease' },
  centerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' },
  spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  successIcon: { fontSize: '3rem', marginBottom: '12px' },
  resultTitle: { fontSize: '1.5rem', color: '#0f172a', marginBottom: '8px' },
  scoreText: { fontSize: '1.1rem', color: '#475569', marginBottom: '24px' },
  recommendationBox: { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '20px', borderRadius: '12px', textAlign: 'right', marginBottom: '24px' }
};
