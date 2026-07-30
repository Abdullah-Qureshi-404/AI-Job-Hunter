import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineCloudUpload,
  HiOutlineCheckCircle,
  HiOutlineClipboardCopy,
} from 'react-icons/hi';
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
import './Apply.css';

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

  const [error, setError] = useState(null);

  const steps = [
    { number: 1, label: 'Job Input' },
    { number: 2, label: 'Resume' },
    { number: 3, label: 'Email' },
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
      let analysis = null;

      if (mode === 'text') {
        analysis = await analyzeJob({ job_description: jobText });
      } else {
        analysis = await analyzeJobImage(selectedFile);
      }

      setAnalysisResult(analysis);
      setAnalyzing(false);
      setCurrentStep(2);

      // Prefer full JD text for resume generation (short titles fail RAG quality).
      const resumeJd = jobText.trim().length >= 30
        ? jobText
        : [
            analysis?.job_title,
            analysis?.company,
            ...(analysis?.key_responsibilities || []),
            ...(analysis?.required_skills || []),
          ].filter(Boolean).join('\n');

      setGeneratingResumeState(true);
      const resData = await generateResume({
        job_description: resumeJd || 'Software Engineer role',
      });
      setResumeResult(resData);
      setEditableResume(resData?.resume_content || null);

      // Name and contact details come from the user's profile, never from the
      // model - it has no reliable source for them.
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
      setError(parseApiError(err) || 'Analysis failed. Paste a fuller job description and ensure Apply AI is running on :8001.');
    } finally {
      setAnalyzing(false);
      setGeneratingResumeState(false);
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
      // No stub template: a two-line placeholder presented as a generated
      // email is worse than an honest failure.
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
      <div className="apply-container">
        {/* Step Indicator Header */}
        <div className="apply-steps-bar">
          {steps.map((s, index) => {
            const isCompleted = currentStep > s.number;
            const isActive = currentStep === s.number;
            let statusClass = 'inactive';
            if (isCompleted) statusClass = 'completed';
            else if (isActive) statusClass = 'active';

            return (
              <div key={s.number} style={{ display: 'contents' }}>
                <div className="apply-step-item">
                  <div className={`apply-step-number ${statusClass}`}>
                    {isCompleted ? <HiOutlineCheckCircle style={{ fontSize: 18 }} /> : s.number}
                  </div>
                  <span className={`apply-step-label ${statusClass}`}>{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`apply-step-line${currentStep > s.number ? ' active' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '12px 16px', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* STEP 1: Job Input */}
        {currentStep === 1 && (
          <div className="apply-card">
            <div className="apply-card-header">
              <div>
                <h2 className="apply-title">
                  {job ? `Applying for ${job.title} at ${job.company}` : 'Add job details'}
                </h2>
                <p className="apply-subtitle">Paste the job description or upload a screenshot</p>
              </div>
            </div>

            {loadingJob && (
              <div style={{ fontSize: 12, color: '#7c6ff7' }}>Loading job details...</div>
            )}

            {/* Selectable Mode Cards */}
            <div className="apply-mode-grid">
              <div
                className={`apply-mode-card${mode === 'text' ? ' selected' : ''}`}
                onClick={() => setMode('text')}
                role="button"
                tabIndex={0}
              >
                <HiOutlineDocumentText className="apply-mode-icon" />
                <span className="apply-mode-title">Paste text</span>
              </div>

              <div
                className={`apply-mode-card${mode === 'screenshot' ? ' selected' : ''}`}
                onClick={() => setMode('screenshot')}
                role="button"
                tabIndex={0}
              >
                <HiOutlinePhotograph className="apply-mode-icon" />
                <span className="apply-mode-title">Upload screenshot</span>
              </div>
            </div>

            {/* Paste Textarea vs Screenshot Dropzone */}
            {mode === 'text' ? (
              <textarea
                className="apply-textarea"
                placeholder="Paste full job description here..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
            ) : (
              <div
                className="apply-dropzone"
                onClick={() => document.getElementById('screenshot-upload')?.click()}
              >
                <HiOutlineCloudUpload className="apply-dropzone-icon" />
                <p style={{ margin: 0, fontWeight: 500, color: '#e8e8f0' }}>
                  {selectedFile ? selectedFile.name : 'Click to upload or drag screenshot here'}
                </p>
                <p style={{ margin: 0, fontSize: 11 }}>PNG, JPG or WEBP up to 5MB</p>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            <div className="apply-footer-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="apply-btn-next"
                onClick={handleAnalyzeJob}
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing job...' : 'Analyze job →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Resume */}
        {currentStep === 2 && (
          <div className="apply-card">
            <div className="apply-card-header">
              <div>
                <h2 className="apply-title">
                  {analysisResult?.job_title ? `Tailored Resume for ${analysisResult.job_title}` : 'Tailored Resume'}
                </h2>
                <p className="apply-subtitle">AI-optimized bullet points matched to target job description</p>
              </div>
            </div>

            {generatingResumeState ? (
              <div className="apply-preview-box" style={{ textAlign: 'center', color: '#7c6ff7' }}>
                Generating tailored resume content...
              </div>
            ) : editableResume ? (
              <>
                <p className="apply-subtitle" style={{ marginBottom: 12 }}>
                  Click any line to edit it, then export. Text stays selectable
                  in the PDF so applicant tracking systems can read it.
                </p>
                <ResumeEditor
                  content={editableResume}
                  header={resumeHeader}
                  onChange={setEditableResume}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="button" className="apply-btn-next" onClick={() => window.print()}>
                    Export PDF
                  </button>
                  <button
                    type="button"
                    className="apply-btn-back"
                    onClick={() => setEditableResume(resumeResult?.resume_content || null)}
                  >
                    Reset edits
                  </button>
                </div>
              </>
            ) : (
              <div className="apply-preview-box">
                <span style={{ color: '#9090a8' }}>
                  No resume was generated. Upload a resume on the Resumes page,
                  then try again once Apply AI is reachable.
                </span>
              </div>
            )}

            <div className="apply-footer-actions">
              <button
                type="button"
                className="apply-btn-back"
                onClick={() => setCurrentStep(1)}
              >
                ← Back
              </button>
              <button
                type="button"
                className="apply-btn-next"
                onClick={handleGenerateEmail}
              >
                Generate email →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Email */}
        {currentStep === 3 && (
          <div className="apply-card">
            <div className="apply-card-header">
              <div>
                <h2 className="apply-title">Personalized Cold Email</h2>
                <p className="apply-subtitle">Review and copy your tailored cover letter / outreach message</p>
              </div>
            </div>

            {generatingEmailState ? (
              <div style={{ textAlign: 'center', color: '#7c6ff7', padding: 40 }}>
                Generating personalized application email...
              </div>
            ) : (
              <>
                <div className="apply-input-group">
                  <label className="apply-input-label">Subject</label>
                  <input
                    type="text"
                    className="apply-input"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="apply-input-group">
                  <label className="apply-input-label">Message Body</label>
                  <textarea
                    className="apply-textarea"
                    style={{ minHeight: 180 }}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="apply-footer-actions">
              <button
                type="button"
                className="apply-btn-back"
                onClick={() => setCurrentStep(2)}
              >
                ← Back
              </button>
              <button
                type="button"
                className="apply-btn-next"
                onClick={handleCopy}
              >
                <HiOutlineClipboardCopy />
                {copied ? 'Copied to Clipboard!' : 'Copy email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
