"use client";

import React, { useState, useRef } from "react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from "recharts";
import { 
  UploadCloud, AlertTriangle, FileWarning, Zap 
} from "lucide-react";

export default function MiqyasDashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      // --- التعديل هنا: التعامل مع الأخطاء بذكاء ---
      if (!response.ok) {
        if (response.status === 413) {
          alert("❌ عذراً، حجم ملف الـ ZIP يتجاوز الحد المسموح (20 ميجابايت). الرجاء رفع ملف أصغر.");
          return;
        } else if (response.status === 422) {
          alert("❌ عذراً، الملف لا يحتوي على أكواد برمجية مدعومة.");
          return;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      // ----------------------------------------------

      const result = await response.json();
      setData(result);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("⚠️ حدث خطأ غير متوقع أثناء تحليل الملف.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // دالة لتحديد لون النص بناءً على الدرجة
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  // دالة لتحديد لون شريط التقدم (Progress Bar) بناءً على الدرجة
  const getProgressBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getIssueStyle = (issue: string) => {
    if (issue.startsWith("Critical")) return "bg-rose-50 border-rose-200 text-rose-800";
    if (issue.startsWith("Moderate")) return "bg-amber-50 border-amber-200 text-amber-800";
    return "bg-blue-50 border-blue-200 text-blue-800";
  };

  // مكوّن فرعي (Component) لرسم شريط التقدم لكل معيار
  const ScoreBar = ({ label, score }: { label: string, score: number }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className={`text-sm font-bold ${getScoreTextColor(score)}`}>{score} / 100</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 shadow-inner">
        <div 
          className={`${getProgressBarColor(score)} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      
      <input 
        type="file" 
        accept=".zip" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Miqyas <span className="text-blue-600">AI</span>
        </h1>
        <p className="text-slate-500 mt-2">DGA Compliance & Code Quality Evaluator</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Upload Section */}
        {!data && !loading && (
          <div 
            className="border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mx-auto h-16 w-16 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Project Source Code</h3>
            <p className="text-slate-500 mb-6">Click here to select your .zip file</p>
            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition shadow-sm">
              Select ZIP File
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-xl font-semibold text-slate-700">Analyzing Codebase...</h3>
            <p className="text-slate-500 mt-2">Miqyas is evaluating the project against DGA standards. This takes 8-14 seconds.</p>
          </div>
        )}

        {/* Results Dashboard */}
        {data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Top Row: Main Score & Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Score Card */}
              <div className="col-span-1 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-sm uppercase tracking-wider font-semibold text-slate-400 mb-2">Overall Score</p>
                <h2 className={`text-7xl font-bold ${getScoreTextColor(data.analysis.score)}`}>
                  {data.analysis.score}
                </h2>
                <div className="mt-4 px-5 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                  <span className="font-semibold text-slate-700">Rating: {data.analysis.rating}</span>
                </div>
              </div>

              {/* Detailed Breakdown (Radar + Progress Bars) */}
              <div className="col-span-1 lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
                
                {/* Progress Bars (Left side) */}
                <div className="w-full md:w-1/2">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-2">Pillar Scores (Out of 100)</h3>
                  <ScoreBar label="Cybersecurity" score={data.analysis.breakdown.cybersecurity} />
                  <ScoreBar label="Performance" score={data.analysis.breakdown.performance} />
                  <ScoreBar label="Clean Code" score={data.analysis.breakdown.clean_code} />
                  <ScoreBar label="DGA Compliance" score={data.analysis.breakdown.dga_compliance} />
                </div>

                {/* Radar Chart (Right side) */}
                <div className="w-full md:w-1/2 h-64 border-l-0 md:border-l border-slate-100 pl-0 md:pl-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                      { subject: 'Cyber', A: data.analysis.breakdown.cybersecurity, fullMark: 100 },
                      { subject: 'Performance', A: data.analysis.breakdown.performance, fullMark: 100 },
                      { subject: 'Clean Code', A: data.analysis.breakdown.clean_code, fullMark: 100 },
                      { subject: 'DGA', A: data.analysis.breakdown.dga_compliance, fullMark: 100 },
                    ]}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                      <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#60a5fa" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
              </div>
            </div>

            {/* Recommendation Alert */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
              <Zap className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-blue-900 font-semibold text-lg">Primary AI Recommendation</h3>
                <p className="text-blue-800 mt-1 leading-relaxed">{data.analysis.recommendation}</p>
              </div>
            </div>

            {/* Issues & Meta Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Issues List */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Detected Issues ({data.analysis.issues?.length || 0})
                </h3>
                <div className="space-y-3">
                  {data.analysis.issues?.map((issue: string, index: number) => (
                    <div key={index} className={`p-4 rounded-xl border ${getIssueStyle(issue)} shadow-sm`}>
                      {issue}
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata & Skipped Files */}
              <div className="col-span-1 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-5 border-b border-slate-100 pb-3">Scan Details</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">File Name</span>
                      <span className="font-medium truncate ml-4 max-w-[150px]" title={data.meta.filename}>
                        {data.meta.filename}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Files Processed</span>
                      <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {data.meta.files_read}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Characters</span>
                      <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {data.meta.total_chars.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {data.meta.skipped?.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-slate-700">
                      <FileWarning className="h-4 w-4 text-slate-500" />
                      Skipped Files ({data.meta.skipped.length})
                    </h3>
                    <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
                      {data.meta.skipped.map((file: string, index: number) => (
                        <li key={index} className="truncate" title={file}>
                          {file.split('/').pop()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-2">
              <button 
                onClick={() => setData(null)}
                className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium shadow-sm"
              >
                Scan Another Project
              </button>
            </div>
            
          </div>
        )}
      </div>
      {/* Footer / Attribution Section */}
            <div className="mt-16 border-t border-slate-200 pt-8 text-center text-sm text-slate-400">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p>
                  © {new Date().getFullYear()} <strong>Miqyas AI</strong>. All rights reserved.
                </p>
                <p className="flex items-center gap-1.5">
                  Engineered by{" "}
                  <a 
                    href="https://www.linkedin.com/in/reem-alwafi-12498029a/" // <-- ضعي رابط لينكد إن الخاص بك هنا
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold text-slate-600 hover:text-blue-600 transition underline decoration-dotted"
                  >
                    Reem
                  </a>
                </p>
                <div className="text-xs bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-mono">
                  v1.0.0-production
                </div>
              </div>
            </div>
    </div>
  );
}