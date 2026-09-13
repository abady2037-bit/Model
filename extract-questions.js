import { GoogleGenAI, Schema } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SCFHS_CATEGORIES = [
  'Nursing Fundamentals',
  'Adult Nursing (Med-Surg)',
  'Maternal-Child Nursing',
  'Community & Mental Health',
  'Leadership & Professional Practice'
];

const questionSchema = Schema.array({
  items: Schema.object({
    properties: {
      subject: Schema.enum(SCFHS_CATEGORIES, {
        description: 'التصنيف المعتمد للسؤال وفق أقسام الهيئة السعودية للتخصصات الصحية'
      }),
      question_text: Schema.string({ description: 'نص السؤال كاملاً كما ورد في الملف' }),
      options: Schema.array({
        items: Schema.string(),
        description: 'خيارات الإجابة الأربعة'
      }),
      correct_option: Schema.integer({ description: 'رقم الإجابة الصحيحة (0 للخيار الأول، 1 للثاني...)' }),
      recommendation: Schema.string({ description: 'توصية مراجعة قصيرة باللغة العربية بناءً على المعيار العلمي للسؤال' })
    },
    required: ['subject', 'question_text', 'options', 'correct_option', 'recommendation']
  })
});

async function processPDF(filePath) {
  try {
    console.log('⏳ جاري تحليل الـ PDF وتصنيف الأسئلة وفق معايير الهيئة (SCFHS)...');
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
        'استخرج جميع أسئلة الاختبار المرفقة وصنف كل سؤال بدقة تامة إلى أحد أقسام الهيئة (SCFHS).'
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: questionSchema
      }
    });

    const questions = JSON.parse(response.text);
    console.log(`✅ تم استخراج وتصنيف ${questions.length} سؤالاً بنجاح!`);

    const { error } = await supabase.from('questions').insert(questions);
    if (error) console.error('❌ خطأ في الحفظ:', error.message);
    else console.log('🎉 تم حفظ كافة الأسئلة في قاعدة البيانات بنجاح!');
  } catch (err) {
    console.error('❌ حدث خطأ:', err);
  }
}

processPDF('./snle-questions.pdf');
