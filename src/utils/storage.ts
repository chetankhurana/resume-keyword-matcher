import { ResumeVersion, AnalysisResult } from '../types';

const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage !== undefined;

export async function getResumes(): Promise<ResumeVersion[]> {
  if (isChromeExtension) {
    const data = await chrome.storage.local.get('resumes') as { resumes?: ResumeVersion[] };
    return data.resumes || [];
  } else {
    const resumes = localStorage.getItem('resumes');
    return resumes ? JSON.parse(resumes) : [];
  }
}

export async function saveResume(resume: ResumeVersion): Promise<void> {
  const resumes = await getResumes();
  const existingIndex = resumes.findIndex(r => r.id === resume.id);
  
  if (existingIndex >= 0) {
    resumes[existingIndex] = resume;
  } else {
    resumes.push(resume);
  }
  
  if (isChromeExtension) {
    await chrome.storage.local.set({ resumes });
  } else {
    localStorage.setItem('resumes', JSON.stringify(resumes));
  }
}

export async function deleteResume(id: string): Promise<void> {
  const resumes = await getResumes();
  const filtered = resumes.filter(r => r.id !== id);
  
  if (isChromeExtension) {
    await chrome.storage.local.set({ resumes });
  } else {
    localStorage.setItem('resumes', JSON.stringify(filtered));
  }
  
  // Clean up active resume selection if it was deleted
  const activeId = await getActiveResumeId();
  if (activeId === id) {
    await setActiveResumeId(null);
  }
}

export async function getActiveResumeId(): Promise<string | null> {
  if (isChromeExtension) {
    const data = await chrome.storage.local.get('activeResumeId') as { activeResumeId?: string };
    return data.activeResumeId || null;
  } else {
    return localStorage.getItem('activeResumeId');
  }
}

export async function setActiveResumeId(id: string | null): Promise<void> {
  if (isChromeExtension) {
    await chrome.storage.local.set({ activeResumeId: id });
  } else {
    if (id) {
      localStorage.setItem('activeResumeId', id);
    } else {
      localStorage.removeItem('activeResumeId');
    }
  }
}

export async function getActiveResume(): Promise<ResumeVersion | null> {
  const resumes = await getResumes();
  const activeId = await getActiveResumeId();
  if (!activeId) return resumes[0] || null;
  return resumes.find(r => r.id === activeId) || resumes[0] || null;
}

export async function saveAnalysisResult(result: AnalysisResult): Promise<void> {
  if (isChromeExtension) {
    const data = await chrome.storage.local.get('analysisResults') as { analysisResults?: Record<string, AnalysisResult> };
    const results = data.analysisResults || {};
    results[result.jobUrl] = result;
    await chrome.storage.local.set({ analysisResults: results });
  } else {
    const resultsStr = localStorage.getItem('analysisResults');
    const results = resultsStr ? JSON.parse(resultsStr) : {};
    results[result.jobUrl] = result;
    localStorage.setItem('analysisResults', JSON.stringify(results));
  }
}

export async function getAnalysisResult(jobUrl: string): Promise<AnalysisResult | null> {
  if (isChromeExtension) {
    const data = await chrome.storage.local.get('analysisResults') as { analysisResults?: Record<string, AnalysisResult> };
    const results = data.analysisResults || {};
    return results[jobUrl] || null;
  } else {
    const resultsStr = localStorage.getItem('analysisResults');
    const results = resultsStr ? JSON.parse(resultsStr) : {};
    return results[jobUrl] || null;
  }
}
