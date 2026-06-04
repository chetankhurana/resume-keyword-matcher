import React, { useState, useEffect } from 'react';
import { 
  Briefcase, FileCheck2, RefreshCw, FileText, 
  Sparkles, CheckCircle, AlertTriangle, Printer, FileJson, 
  ChevronRight, Lightbulb
} from 'lucide-react';
import { JobDetails, AnalysisResult, ResumeVersion } from '../types';
import { getActiveResume, saveAnalysisResult } from '../utils/storage';
import { analyzeResume } from '../utils/analyzer';
import { fetchAISuggestions } from '../utils/ai';
import { ScoreRing } from '../components/ScoreRing';
import { ProgressBar } from '../components/ProgressBar';
import { KeywordChip } from '../components/KeywordChip';
import { ResumeManager } from '../components/ResumeManager';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'resumes'>('analyze');
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [activeResume, setActiveResume] = useState<ResumeVersion | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [manualJdInput, setManualJdInput] = useState<boolean>(false);
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualCompany, setManualCompany] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>('');
  
  const [skillCategoryTab, setSkillCategoryTab] = useState<string>('Programming Languages');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  useEffect(() => {
    initializePanel();
  }, []);

  const runFullAnalysis = async (resume: ResumeVersion, jd: JobDetails) => {
    // 1. Run local matching instantly
    const localResult = analyzeResume(resume.parsedText, jd, resume.id);
    setAnalysisResult(localResult);
    await saveAnalysisResult(localResult);

    // 2. Fetch AI-based suggestions and projects asynchronously
    setAiLoading(true);
    try {
      let geminiApiKey: string | undefined;
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const data = await chrome.storage.local.get('geminiApiKey') as { geminiApiKey?: string };
        geminiApiKey = data.geminiApiKey;
      } else {
        geminiApiKey = localStorage.getItem('geminiApiKey') || undefined;
      }
      
      const aiSuggestions = await fetchAISuggestions(resume.parsedText, jd, geminiApiKey);
      
      // Update result with AI feedback
      const updatedResult = {
        ...localResult,
        suggestions: aiSuggestions.suggestions,
        projectIdeas: aiSuggestions.projectIdeas
      };
      setAnalysisResult(updatedResult);
      await saveAnalysisResult(updatedResult);
    } catch (err) {
      console.warn('AI suggestions failed, utilizing local heuristics:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const initializePanel = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check for active resume
      const resume = await getActiveResume();
      setActiveResume(resume);

      // 2. Check if context menu saved a pending analysis
      if (typeof chrome !== 'undefined' && chrome.storage?.session) {
        const sessionData = await chrome.storage.session.get('pendingJdAnalysis') as { pendingJdAnalysis?: JobDetails };
        if (sessionData.pendingJdAnalysis && resume) {
          const jd = sessionData.pendingJdAnalysis;
          setJobDetails(jd);
          // Clear it
          await chrome.storage.session.remove('pendingJdAnalysis');
          
          // Run analysis
          await runFullAnalysis(resume, jd);
          setLoading(false);
          return;
        }
      }

      // 3. Fallback: scrape the active webpage
      await scanWebpage(resume);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError('Failed to load active tab details.');
      setLoading(false);
    }
  };

  const scanWebpage = async (currentResume?: ResumeVersion | null) => {
    setLoading(true);
    setError(null);
    const targetResume = currentResume !== undefined ? currentResume : activeResume;

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id || !tab.url) {
          setLoading(false);
          return;
        }

        // Send scrape message
        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_JOB' }, async (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Scraping service unavailable on this tab.');
            // Only show message if user explicitly clicked rescan
            setLoading(false);
            return;
          }

          if (response && response.success && response.data) {
            const jd = response.data;
            setJobDetails(jd);

            if (targetResume) {
              await runFullAnalysis(targetResume, jd);
            }
          }
          setLoading(false);
        });
      } else {
        // Dev Fallback Simulation
        const jd = {
          title: "Senior Full Stack Developer",
          company: "Vercel Inc.",
          description: "We are seeking a Senior Full Stack Engineer. Requirements: Experience with React, Next.js, Node.js, and TypeScript. Experience with PostgreSQL and Redis. AWS lambda is a plus. Good system design knowledge and team mentoring experience are required.",
          url: "https://example.com/vercel-jobs"
        };
        setJobDetails(jd);
        
        if (targetResume) {
          await runFullAnalysis(targetResume, jd);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setLoading(false);
    }
  };

  const handleActiveResumeChanged = async () => {
    setLoading(true);
    try {
      const resume = await getActiveResume();
      setActiveResume(resume);
      
      if (jobDetails && resume) {
        await runFullAnalysis(resume, jobDetails);
      } else {
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error('Error changing active resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualDescription || !activeResume) return;

    setLoading(true);
    try {
      const jd: JobDetails = {
        title: manualTitle,
        company: manualCompany || "Custom Company",
        description: manualDescription,
        url: `manual-paste-${Date.now()}`
      };

      setJobDetails(jd);
      setManualJdInput(false);

      await runFullAnalysis(activeResume, jd);
    } catch (err) {
      setError("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const exportToJson = () => {
    if (!analysisResult) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysisResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ATS_Analysis_${jobDetails?.company.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const printReport = () => {
    if (!analysisResult || !jobDetails) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const presentList = analysisResult.presentKeywords.map(k => `<li>${k}</li>`).join('');
    const missingList = analysisResult.missingKeywords.map(k => `<li>${k}</li>`).join('');
    const recommendations = analysisResult.suggestions.map(s => `<li>${s}</li>`).join('');
    const projects = analysisResult.projectIdeas.map(p => `
      <div style="margin-bottom: 12px; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
        <strong>${p.title}</strong>
        <p style="margin: 4px 0; font-size: 13px; color: #555;">${p.description}</p>
        <small style="color: #6366f1;">Stack: ${p.technologies.join(', ')}</small>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>ATS Report - ${jobDetails.title} @ ${jobDetails.company}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .company { font-size: 18px; color: #666; margin: 5px 0 0 0; }
            .score-container { display: flex; gap: 40px; margin: 20px 0; }
            .score-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; text-align: center; width: 120px; }
            .score-num { font-size: 32px; font-weight: bold; color: #6366f1; }
            .skills-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .skills-list { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
            ul { padding-left: 20px; margin: 8px 0; }
            li { font-size: 14px; margin-bottom: 4px; }
            h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 6px; color: #111; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Resume Compatibility Report</div>
            <div class="company">${jobDetails.title} — ${jobDetails.company}</div>
          </div>
          <div class="score-container">
            <div class="score-card">
              <div class="score-num">${analysisResult.overallScore}%</div>
              <small>Overall ATS</small>
            </div>
            <div style="flex-grow: 1;">
              <div>Skills Score: ${analysisResult.skillsScore}%</div>
              <div>Keyword Coverage: ${analysisResult.keywordScore}%</div>
              <div>Experience Alignment: ${analysisResult.experienceScore}%</div>
              <div>Education Alignment: ${analysisResult.educationScore}%</div>
            </div>
          </div>
          <div class="skills-section">
            <div class="skills-list" style="border-left: 4px solid #10b981;">
              <h2>Matching Keywords</h2>
              <ul>${presentList || '<li>None</li>'}</ul>
            </div>
            <div class="skills-list" style="border-left: 4px solid #ef4444;">
              <h2>Missing Keywords</h2>
              <ul>${missingList || '<li>None</li>'}</ul>
            </div>
          </div>
          <div style="margin-top: 20px; background: #eef2ff; padding: 15px; border-radius: 8px; border: 1px solid #c7d2fe;">
            <h2>Optimization Suggestions</h2>
            <ul>${recommendations}</ul>
          </div>
          <div style="margin-top: 20px;">
            <h2>Personalized Project Ideas</h2>
            ${projects}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <div className="flex justify-between items-center px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-brand-600 text-white">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">ATS Keyword Matcher</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
              activeTab === 'analyze'
                ? 'bg-brand-600 text-white shadow shadow-brand-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('resumes')}
            className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
              activeTab === 'resumes'
                ? 'bg-brand-600 text-white shadow shadow-brand-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Resumes
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'resumes' ? (
          <ResumeManager onActiveResumeChange={handleActiveResumeChanged} />
        ) : (
          <>
            {/* Active Resume and Action Controls */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Active Resume Profile</p>
                <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                  <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {activeResume ? activeResume.name : 'No resume uploaded'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scanWebpage()}
                  disabled={loading || !activeResume}
                  title="Rescan active page"
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setManualJdInput(!manualJdInput)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-[10px] font-semibold text-slate-200 rounded-lg hover:text-white cursor-pointer"
                >
                  {manualJdInput ? 'Cancel' : 'Paste JD'}
                </button>
              </div>
            </div>

            {/* Manual Paste Box */}
            {manualJdInput && (
              <form onSubmit={handleManualAnalyze} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Briefcase className="w-4 h-4 text-brand-400" />
                  <h4 className="text-xs font-semibold text-white">Manual Job Posting Input</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">Job Title*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SDE II"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="e.g. OpenAI"
                      value={manualCompany}
                      onChange={(e) => setManualCompany(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">Job Description*</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Paste job description requirements and skills..."
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!activeResume}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Analyze Text Match
                </button>
              </form>
            )}

            {/* Error notifications */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-900/30 text-rose-400 text-xs rounded-lg flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* If no resume uploaded */}
            {!activeResume && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-slate-950 text-slate-500">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">No active resume profile</p>
                  <p className="text-xs text-slate-500 max-w-[220px] mx-auto">
                    Please upload and label your resume in the 'Resumes' tab to unlock matching diagnostics.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('resumes')}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Go to Resume Uploads
                </button>
              </div>
            )}

            {/* Loading screen */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500 font-medium">Processing matching algorithms...</span>
              </div>
            )}

            {/* Dashboard Results (If loaded, not loading, has resume) */}
            {!loading && activeResume && jobDetails && !analysisResult && (
              <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-6 text-center space-y-2">
                <p className="text-xs text-slate-400 font-semibold">Ready to Analyze</p>
                <p className="text-[10px] text-slate-500">
                  Select a resume version or scan the current job listing tab to generate an ATS compatibility match.
                </p>
                <button
                  onClick={() => scanWebpage()}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-white text-xs rounded-lg mt-2 font-semibold cursor-pointer"
                >
                  Scan Active Tab
                </button>
              </div>
            )}

            {!loading && activeResume && analysisResult && jobDetails && (
              <div className="space-y-4">
                {/* Job Metadata Header */}
                <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-extrabold text-white truncate">{jobDetails.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{jobDetails.company}</p>
                    </div>
                  </div>
                </div>

                {/* Score Summary Grid */}
                <div className="grid grid-cols-5 items-center bg-slate-900/40 border border-slate-900 rounded-xl p-3 gap-2">
                  <div className="col-span-2 border-r border-slate-900 pr-2">
                    <ScoreRing score={analysisResult.overallScore} size={96} strokeWidth={7} />
                  </div>
                  <div className="col-span-3 pl-2 space-y-2">
                    <ProgressBar label="Skills Score" value={analysisResult.skillsScore} />
                    <ProgressBar label="Keyword Coverage" value={analysisResult.keywordScore} />
                    <ProgressBar label="Experience Alignment" value={analysisResult.experienceScore} />
                    <ProgressBar label="Education Match" value={analysisResult.educationScore} />
                  </div>
                </div>

                {/* Export Options */}
                <div className="flex gap-2">
                  <button
                    onClick={printReport}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-slate-800 bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-slate-200 hover:text-white rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF Report</span>
                  </button>
                  <button
                    onClick={exportToJson}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-slate-800 bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-slate-200 hover:text-white rounded-lg cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>

                {/* Skill Keyword Match Details */}
                <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-slate-850 bg-slate-900/60 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white tracking-wide uppercase">Keyword Diagnostics</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 font-semibold uppercase">
                      {analysisResult.presentKeywords.length} / {analysisResult.presentKeywords.length + analysisResult.missingKeywords.length} Match
                    </span>
                  </div>

                  {/* Horizontal Category Switcher */}
                  <div className="flex gap-1 overflow-x-auto px-2 py-2 border-b border-slate-850 bg-slate-950/20">
                    {Object.keys(analysisResult.categorizedSkills).map((category) => {
                      const presentCount = analysisResult.categorizedSkills[category].present.length;
                      const missingCount = analysisResult.categorizedSkills[category].missing.length;
                      const total = presentCount + missingCount;
                      if (total === 0) return null;

                      const isSelected = skillCategoryTab === category;
                      return (
                        <button
                          key={category}
                          onClick={() => setSkillCategoryTab(category)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap tracking-wide uppercase shrink-0 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                          }`}
                        >
                          {category} ({presentCount}/{total})
                        </button>
                      );
                    })}
                  </div>

                  {/* Skills Display Grid */}
                  <div className="p-3 space-y-3 max-h-[220px] overflow-y-auto">
                    {analysisResult.categorizedSkills[skillCategoryTab] ? (
                      <>
                        {/* Matching Skills */}
                        {analysisResult.categorizedSkills[skillCategoryTab].present.length > 0 && (
                          <div className="space-y-1.5">
                            <h5 className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Present Keywords</span>
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisResult.categorizedSkills[skillCategoryTab].present.map((skill) => (
                                <KeywordChip key={skill} name={skill} isPresent={true} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills */}
                        {analysisResult.categorizedSkills[skillCategoryTab].missing.length > 0 && (
                          <div className="space-y-1.5">
                            <h5 className="text-[9px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Missing Keywords</span>
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisResult.categorizedSkills[skillCategoryTab].missing.map((skill) => (
                                <KeywordChip key={skill} name={skill} isPresent={false} />
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResult.categorizedSkills[skillCategoryTab].present.length === 0 && 
                         analysisResult.categorizedSkills[skillCategoryTab].missing.length === 0 && (
                          <p className="text-[10px] text-slate-500 text-center py-2">
                            No keywords analyzed under this category.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-500 text-center py-2">
                        Select a category tab above.
                      </p>
                    )}
                  </div>
                </div>

                {/* Recommendations and suggested changes */}
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                    <Lightbulb className="w-4 h-4 text-brand-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">ATS Optimizations</h4>
                  </div>
                  {aiLoading ? (
                    <div className="space-y-2 animate-pulse py-2">
                      <div className="h-3 bg-slate-800/40 rounded w-5/6"></div>
                      <div className="h-3 bg-slate-800/40 rounded w-4/6"></div>
                      <div className="h-3 bg-slate-800/40 rounded w-3/4"></div>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex gap-2 text-[10px] text-slate-300 leading-normal">
                          <ChevronRight className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Project Ideas Generation */}
                {((analysisResult.projectIdeas && analysisResult.projectIdeas.length > 0) || aiLoading) && (
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                      <Sparkles className="w-4 h-4 text-brand-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Tailored Project Ideas</h4>
                    </div>
                    {aiLoading ? (
                      <div className="space-y-3 animate-pulse py-2">
                        <div className="h-16 bg-slate-800/40 rounded"></div>
                        <div className="h-16 bg-slate-800/40 rounded"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysisResult.projectIdeas.map((project, index) => (
                          <div key={index} className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
                            <h5 className="text-[11px] font-bold text-white">{project.title}</h5>
                            <p className="text-[9px] text-slate-400 mt-1 leading-normal">{project.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.technologies.map(tech => (
                                      <span key={tech} className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-slate-900 border border-slate-800 text-slate-400">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[9px] text-slate-700 py-2 border-t border-slate-900 bg-slate-950 shrink-0">
        Resume Keyword Matcher v1.0.0
      </div>
    </div>
  );
};
