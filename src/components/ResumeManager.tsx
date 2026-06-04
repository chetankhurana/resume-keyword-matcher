import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, Trash2, ShieldAlert, Settings } from 'lucide-react';
import { ResumeVersion } from '../types';
import { getResumes, saveResume, deleteResume, getActiveResumeId, setActiveResumeId } from '../utils/storage';
import { parsePdf, parseDocx } from '../utils/parser';

interface ResumeManagerProps {
  onActiveResumeChange: () => void;
}

export const ResumeManager: React.FC<ResumeManagerProps> = ({ onActiveResumeChange }) => {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resumeType, setResumeType] = useState<string>('SDE Resume');
  const [customName, setCustomName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [keySaved, setKeySaved] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResumes();
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    const isExtension = typeof chrome !== 'undefined' && chrome.storage?.local;
    if (isExtension) {
      const data = await chrome.storage.local.get('geminiApiKey') as { geminiApiKey?: string };
      setApiKeyInput(data.geminiApiKey || '');
    } else {
      setApiKeyInput(localStorage.getItem('geminiApiKey') || '');
    }
  };

  const handleSaveApiKey = async () => {
    const isExtension = typeof chrome !== 'undefined' && chrome.storage?.local;
    if (isExtension) {
      await chrome.storage.local.set({ geminiApiKey: apiKeyInput });
    } else {
      localStorage.setItem('geminiApiKey', apiKeyInput);
    }
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
    onActiveResumeChange(); // Re-run analysis with new API key if active
  };

  const loadResumes = async () => {
    try {
      const stored = await getResumes();
      const active = await getActiveResumeId();
      setResumes(stored);
      setActiveId(active || (stored[0]?.id || null));
    } catch (err: any) {
      console.error('Failed to load resumes:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setErrorMsg(null);
    setIsParsing(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let text = '';

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsArrayBuffer(file);
      });

      if (extension === 'pdf') {
        text = await parsePdf(arrayBuffer);
      } else if (extension === 'docx') {
        text = await parseDocx(arrayBuffer);
      } else {
        throw new Error('Unsupported format. Please upload a PDF or DOCX file.');
      }

      if (!text.trim()) {
        throw new Error('Could not extract text. The document might be scanned or empty.');
      }

      const displayName = resumeType === 'Custom' ? (customName || file.name.split('.')[0]) : resumeType;

      const newResume: ResumeVersion = {
        id: crypto.randomUUID(),
        name: displayName,
        fileName: file.name,
        parsedText: text,
        uploadedAt: new Date().toLocaleDateString(),
        fileSize: file.size
      };

      await saveResume(newResume);
      await setActiveResumeId(newResume.id);
      
      // Reset inputs
      setCustomName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      await loadResumes();
      onActiveResumeChange();
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(err.message || 'An error occurred during file parsing.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSelectActive = async (id: string) => {
    await setActiveResumeId(id);
    setActiveId(id);
    onActiveResumeChange();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      await deleteResume(id);
      await loadResumes();
      onActiveResumeChange();
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-4 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Resume Manager</h3>
          <span className="text-[10px] text-slate-400 font-medium">{resumes.length} stored</span>
        </div>

        {/* Selector and Name input */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Resume Version</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              value={resumeType}
              onChange={(e) => setResumeType(e.target.value)}
            >
              <option value="SDE Resume">SDE Resume</option>
              <option value="Data Resume">Data Resume</option>
              <option value="ML Resume">ML Resume</option>
              <option value="Custom">Custom Label</option>
            </select>
          </div>
          {resumeType === 'Custom' && (
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Custom Name</label>
              <input
                type="text"
                placeholder="e.g. Fullstack Dev"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Upload Box */}
        <div
          className={`border-2 border-dashed rounded-lg p-5 text-center transition-all ${
            isParsing
              ? 'border-brand-500 bg-brand-500/5 animate-pulse'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
          }`}
        >
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isParsing}
          />
          <div
            className="flex flex-col items-center justify-center cursor-pointer space-y-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-8 h-8 ${isParsing ? 'text-brand-400' : 'text-slate-400'}`} />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white">
                {isParsing ? 'Extracting text locally...' : 'Upload your resume'}
              </p>
              <p className="text-[10px] text-slate-500">Supports PDF & DOCX up to 10MB</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex gap-2 p-2.5 rounded bg-rose-500/10 border border-rose-900/30 text-rose-400 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Stored Resumes List */}
        {resumes.length > 0 && (
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {resumes.map((res) => {
              const isActive = res.id === activeId;
              return (
                <div
                  key={res.id}
                  onClick={() => handleSelectActive(res.id)}
                  className={`flex justify-between items-center p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-950/20 border-brand-800/60 text-white'
                      : 'bg-slate-950/40 border-slate-900 hover:bg-slate-900/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {isActive ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-brand-500 shrink-0" />
                    ) : (
                      <FileText className="w-4.5 h-4.5 text-slate-600 shrink-0" />
                    )}
                    <div className="overflow-hidden">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {res.name}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        {res.fileName} • {formatSize(res.fileSize)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(res.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-500 rounded hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gemini API Configurations */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-400 shrink-0" />
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Gemini API Settings</h3>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          The extension contains a default API key. Paste your custom Google Gemini API Key here to override it.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="AI Key (API_KEY)"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={handleSaveApiKey}
            className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded text-[10px] font-bold cursor-pointer shrink-0"
          >
            Save Key
          </button>
        </div>
        {keySaved && (
          <p className="text-[9px] text-emerald-400 font-semibold">Gemini API key configured successfully!</p>
        )}
      </div>
    </div>
  );
};
