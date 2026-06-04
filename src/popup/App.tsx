import React, { useState, useEffect } from 'react';
import { Briefcase, Layout, FileCheck2, Settings } from 'lucide-react';
import { JobDetails } from '../types';
import { getActiveResume } from '../utils/storage';

export const App: React.FC = () => {
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [activeResumeName, setActiveResumeName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkActiveTab();
  }, []);

  const checkActiveTab = async () => {
    try {
      const activeResume = await getActiveResume();
      if (activeResume) {
        setActiveResumeName(activeResume.name);
      }

      // Check if running as extension
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id || !tab.url) {
          setLoading(false);
          return;
        }

        // Support scraping only on declared matches
        const url = tab.url;
        const supported = /linkedin\.com|indeed\.com|naukri\.com|internshala\.com|greenhouse\.io|lever\.co/i.test(url);

        if (supported) {
          // Send request to content script to scrape
          chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_JOB' }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Content script not loaded on this tab yet.');
              setLoading(false);
              return;
            }
            if (response && response.success && response.data) {
              setJobDetails(response.data);
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } else {
        // Dev fallback simulation
        setJobDetails({
          title: "Frontend Software Engineer",
          company: "Acme Corporation",
          description: "Required skills: React, TypeScript, Tailwind CSS, Git...",
          url: "https://www.linkedin.com/jobs/view/12345"
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in popup tab check:', error);
      setLoading(false);
    }
  };

  const handleOpenSidePanel = async () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.windows) {
      try {
        const currWindow = await chrome.windows.getLastFocused();
        if (currWindow.id) {
          await chrome.sidePanel.open({ windowId: currWindow.id });
          // Close popup window
          window.close();
        }
      } catch (err) {
        console.error('Failed to open side panel:', err);
      }
    } else {
      alert("Side Panel API is only available in Chrome Extension environment. Access sidepanel.html directly to test.");
    }
  };

  return (
    <div className="w-[320px] bg-slate-950 text-slate-100 p-4 font-sans select-none border border-slate-900 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-600 text-white shadow-lg shadow-brand-500/20">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Resume Matcher</h1>
            <p className="text-[9px] text-slate-500 font-medium">ATS Compatibility Scanner</p>
          </div>
        </div>
        <button className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-900 rounded">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="py-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500">Checking current page...</span>
          </div>
        ) : jobDetails ? (
          <div className="bg-slate-900/40 border border-slate-900 rounded-lg p-3 space-y-2.5">
            <div className="flex gap-2">
              <Briefcase className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{jobDetails.title}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{jobDetails.company}</p>
              </div>
            </div>
            
            {activeResumeName && (
              <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Matching against:</span>
                <span className="font-semibold text-brand-400 truncate max-w-[140px]">{activeResumeName}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/20 border border-dashed border-slate-900 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-400 font-medium">No job description detected.</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Open a job posting on LinkedIn, Naukri, Indeed, or use manual highlight in side panel.
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleOpenSidePanel}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/10 cursor-pointer"
        >
          <Layout className="w-4 h-4" />
          <span>Open Dashboard in Side Panel</span>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-[9px] text-slate-600 pt-2 border-t border-slate-900">
        Resume Keyword Matcher v1.0.0
      </div>
    </div>
  );
};
