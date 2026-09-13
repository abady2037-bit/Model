import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error('❌ يرجى التأكد من ضبط المتغيرات السرية بشكل صحيح.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

async function processAllPDFs() {
  try {
    const files = fs.readdirSync('./').filter(file => file.endsWith('.pdf'));

    if (files.length === 0) {
      console.log('⚠️ لم يتم العثور على أي ملفات PDF في المستودع.');
      return;
    }

    console.log(`🔍 تم العثور على ${files.length} ملف PDF للمعالجة:`, files);

    for (const filePath of files) {
      console.log(`\n🚀 بدء معالجة الملف: ${filePath}...`);
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `
      أنت خبير في اختبارات الهيئة السعودية للتخصصات الصحية (SNLE). 
      قم باستخراج جميع الأسئلة من هذا الملف وتصنيف كل سؤال إلى أحد الأقسام الخمسة التالية حصراً:
      1. Nursing Fundamentals
      2. Adult Nursing
      3. Maternal-Child Health Nursing
      4. Community and Mental Health Nursing
      5. Nursing Management and Leadership

      أرجع البيانات في صيغة JSON Array بحيث تحتوي كل خانة على:
      - question_text: نص السؤال باللغة الإنجليزية.
      - options: مصفوفة تحتوي على الخيارات (A, B, C, D).
      - correct_option: الحرف الممثل للخيار الصحيح.
      - domain: اسم القسم من الأقسام الخمسة أعلاه.
      - explanation: الشرح والتوضيح العلمي إن وجد.
      `;

      console.log('🧠 جاري معالجة الأسئلة عبر Gemini API...');
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        }
      ]);

      const responseText = result.response.text();
      const questions = JSON.parse(responseText);

      console.log(`✅ تم استخراج وتصنيف ${questions.length} سؤال من الملف ${filePath}.`);

      console.log('إرسال البيانات إلى قاعدة بيانات Supabase...');
      const { data, error } = await supabase.from('questions').insert(questions);

      if (error) {
        console.error(`❌ خطأ أثناء الرفع إلى Supabase للملف ${filePath}:`, error.message);
      } else {
        console.log(`🎉 تم حفظ كافة أسئلة ${filePath} في قاعدة البيانات بنجاح!`);
      }
    }

  } catch (err) {
    console.error('❌ حدث خطأ أثناء المعالجة:', err);
    process.exit(1);
  }
}

processAllPDFs();
