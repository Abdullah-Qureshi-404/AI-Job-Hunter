import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import {
  getJobDetail,
  analyzeJob,
  analyzeJobImage,
  generateResume,
  generateEmail,
} from '../services/jobsApi';
import { parseApiError } from '../services/api';
import ResumeEditor from '../components/ui/ResumeEditor';
import { getProfile } from '../services/profileApi';

export default function Apply() {
  const params = useParams();
  const jobId = params.id || params.jobId;

  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState('text'); // 'text' | 'screenshot'
  const [jobText, setJobText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [copied, setCopied] = useState(false);

  // Loaded job data
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);

  // Workflow states & data
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [generatingResumeState, setGeneratingResumeState] = useState(false);
  const [resumeResult, setResumeResult] = useState(null);

  const [generatingEmailState, setGeneratingEmailState] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Working copy of the generated resume that the user can edit in place.
  const [editableResume, setEditableResume] = useState(null);
  const [resumeHeader, setResumeHeader] = useState({ name: '', contact: '' });

  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState(null);

  const steps = [
    { number: 1, label: 'Job Input' },
    { number: 2, label: 'Tailored Resume' },
    { number: 3, label: 'Cold Email' },
  ];

  // Step 1: Load selected job if ID exists
  useEffect(() => {
    let isMounted = true;
    if (!jobId || jobId === 'new') return;

    const fetchJob = async () => {
      try {
        setLoadingJob(true);
        const data = await getJobDetail(jobId);
        if (isMounted && data) {
          setJob(data);
          const fullDesc = [data.title, data.company, data.description, data.requirements]
            .filter(Boolean)
            .join('\n\n');
          setJobText(fullDesc || data.description || '');
        }
      } catch (err) {
        console.error(`Error loading job ${jobId} in Apply flow:`, err);
      } finally {
        if (isMounted) setLoadingJob(false);
      }
    };

    fetchJob();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  // Handle Step 1 -> Step 2 (Analyze job & Generate resume)
  const handleAnalyzeJob = async () => {
    if (analyzing || generatingResumeState) return;

    setError(null);
    if (mode === 'text' && !jobText.trim()) {
      setError('Please enter a job description before analyzing.');
      return;
    }
    if (mode === 'text' && jobText.trim().length < 30) {
      setError('Job description must be at least 30 characters. Paste the full posting.');
      return;
    }
    if (mode === 'screenshot' && !selectedFile) {
      setError('Please select an image screenshot file.');
      return;
    }

    try {
      setAnalyzing(true);
      setProgressMessage('Analyzing job requirements with AI...');
      let analysis = null;

      if (mode === 'text') {
        analysis = await analyzeJob({ job_description: jobText });
      } else {
        analysis = await analyzeJobImage(selectedFile);
      }

      setAnalysisResult(analysis);
      setAnalyzing(false);
      setCurrentStep(2);

      const resumeJd = jobText.trim().length >= 30
        ? jobText
        : [
            analysis?.job_title,
            analysis?.company,
            ...(analysis?.key_responsibilities || []),
            ...(analysis?.required_skills || []),
          ].filter(Boolean).join('\n');

      setGeneratingResumeState(true);
      setProgressMessage('Generating tailored resume bullets...');
      const resData = await generateResume({
        job_description: resumeJd || 'Software Engineer role',
      });
      setResumeResult(resData);
      setEditableResume(resData?.resume_content || null);

      try {
        const profData = await getProfile();
        const prof = Array.isArray(profData) ? profData[0] : profData;
        if (prof) {
          setResumeHeader({
            name: prof.name || '',
            contact: [prof.email, prof.target_countries].filter(Boolean).join('  |  '),
          });
        }
      } catch {
        /* header stays blank and editable */
      }
    } catch (err) {
      console.error('Analysis / Resume generation failed:', err);
      setError(parseApiError(err) || 'AI analysis request timed out or failed. Please check connection and try again.');
    } finally {
      setAnalyzing(false);
      setGeneratingResumeState(false);
      setProgressMessage('');
    }
  };


  // Handle Step 2 -> Step 3 (Generate Email)
  const handleGenerateEmail = async () => {
    setError(null);
    try {
      setGeneratingEmailState(true);
      setCurrentStep(3);

      const emailData = await generateEmail({
        job_title: analysisResult?.job_title || job?.title || 'Software Engineer',
        company_name: analysisResult?.company || job?.company || 'Company',
        job_description: jobText || 'Job Application',
      });

      if (emailData) {
        setEmailSubject(emailData.subject || '');
        setEmailBody(emailData.body || '');
      }
    } catch (err) {
      console.error('Email generation failed:', err);
      setError(parseApiError(err) || 'Email generation failed. Ensure Apply AI is running on :8001.');
      setEmailSubject('');
      setEmailBody('');
    } finally {
      setGeneratingEmailState(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MainLayout title="Apply to Job">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* 3-STEP PROGRESS STEPPER */}
        <div className="glass-card p-6 flex items-center justify-between">
          {steps.map((s, index) => {
            const isCompleted = currentStep > s.number;
            const isActive = currentStep === s.number;

            return (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 glow-emerald'
                        : isActive
                        ? 'bg-purple-600 text-white border-2 border-purple-400 shadow-lg shadow-purple-900/60 animate-pulse'
                        : 'bg-white/5 text-zinc-500 border border-white/10'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                  </div>
                  <span
                    className={`text-xs font-bold hidden sm:inline-block ${
                      isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                      currentStep > s.number ? 'bg-purple-500 shadow-sm shadow-purple-500/50' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {error}
          </div>
        )}

        {/* STEP 1: Job Input */}
        {currentStep === 1 && (
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {job ? `Applying for ${job.title} at ${job.company}` : 'Add job details'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                Paste the job description or upload a screenshot to generate tailored application assets
              </p>
            </div>

            {loadingJob && (
              <div className="text-xs font-semibold text-purple-400 animate-pulse">
                Loading job details...
              </div>
            )}

            {/* Selection Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                role="button"
                tabIndex={0}
                className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer text-center group ${
                  mode === 'text'
                    ? 'bg-purple-950/30 border-purple-500/60 text-white shadow-xl shadow-purple-950/40 glow-purple'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                }`}
                onClick={() => setMode('text')}
              >
                <div className={`p-3 rounded-xl ${mode === 'text' ? 'bg-purple-600 text-white' : 'bg-white/5 text-zinc-400'}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Paste Job Text</h3>
                  <p className="text-xs text-zinc-400">Copy &amp; paste plain text job description</p>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer text-center group ${
                  mode === 'screenshot'
                    ? 'bg-purple-950/30 border-purple-500/60 text-white shadow-xl shadow-purple-950/40 glow-purple'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                }`}
                onClick={() => setMode('screenshot')}
              >
                <div className={`p-3 rounded-xl ${mode === 'screenshot' ? 'bg-purple-600 text-white' : 'bg-white/5 text-zinc-400'}`}>
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Upload Screenshot</h3>
                  <p className="text-xs text-zinc-400">AI extracts text directly from job listing images</p>
                </div>
              </div>
            </div>

            {/* Textarea or Dropzone */}
            {mode === 'text' ? (
              <textarea
                className="w-full h-52 p-4 bg-black/40 border border-white/10 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all font-mono leading-relaxed"
                placeholder="Paste full job description here..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
            ) : (
              <div
                className="p-8 border-2 border-dashed border-purple-500/30 rounded-2xl bg-black/30 hover:border-purple-400/80 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center group"
                onClick={() => document.getElementById('screenshot-upload')?.click()}
              >
                <UploadCloud className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-semibold text-zinc-200">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag screenshot image here'}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">PNG, JPG or WEBP up to 5MB</p>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all"
                onClick={handleAnalyzeJob}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-purple-300" />
                    Analyzing job...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    Analyze job
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Resume */}
        {currentStep === 2 && (
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {analysisResult?.job_title ? `Tailored Resume for ${analysisResult.job_title}` : 'Tailored Resume'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                AI-optimized bullet points matched to target job description
              </p>
            </div>

            {generatingResumeState ? (
              <div className="p-12 text-center text-purple-400 font-semibold text-xs animate-pulse flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin text-purple-400" />
                Generating tailored resume content...
              </div>
            ) : editableResume ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Click any line to edit it, then export. Text stays selectable in the PDF so applicant tracking systems can read it.
                </p>
                <ResumeEditor
                  content={editableResume}
                  header={resumeHeader}
                  onChange={setEditableResume}
                />
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-900/40 transition-all"
                    onClick={() => window.print()}
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    onClick={() => setEditableResume(resumeResult?.resume_content || null)}
                  >
                    Reset edits
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No resume was generated. Upload a resume on the Resumes page, then try again once Apply AI is reachable.
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/40 transition-all"
                onClick={handleGenerateEmail}
              >
                Generate email →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Email */}
        {currentStep === 3 && (
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Personalized Cold Email</h2>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                Review and copy your tailored cover letter / outreach message
              </p>
            </div>

            {generatingEmailState ? (
              <div className="p-12 text-center text-purple-400 font-semibold text-xs animate-pulse flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin text-purple-400" />
                Generating personalized application email...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Subject</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Message Body</label>
                  <textarea
                    className="w-full h-56 p-4 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all font-mono leading-relaxed"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/40 transition-all"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
