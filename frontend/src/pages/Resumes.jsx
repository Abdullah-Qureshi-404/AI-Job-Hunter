import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Trash2,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getCVs, uploadCV, deleteCV } from '../services/resumeApi';
import { parseApiError } from '../services/api';

export default function Resumes() {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getCVs();
      setCvs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load CVs:', err);
      setError('Failed to load resumes from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCVs();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('label', file.name.replace(/\.pdf$/i, ''));
      formData.append('file', file);

      const newCv = await uploadCV(formData);

      if (newCv?.apply_ai_warning) {
        setError(newCv.apply_ai_warning);
      }

      if (newCv?.id) {
        setCvs((rows) => [newCv, ...rows.filter((cv) => cv.id !== newCv.id)]);
      } else {
        await fetchCVs();
      }
    } catch (err) {
      console.error('Failed to upload CV:', err);
      setError(parseApiError(err) || 'Failed to upload resume. Please check backend connection.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const requestDelete = (id, title) => setPendingDelete({ id, title });

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    const { id } = pendingDelete;
    const previous = cvs;

    setDeleting(true);
    setError(null);

    setCvs((rows) => rows.filter((cv) => cv.id !== id));

    try {
      await deleteCV(id);
      setPendingDelete(null);
    } catch (err) {
      console.error(`Failed to delete CV ${id}:`, err);
      setCvs(previous);
      setError(parseApiError(err) || 'Failed to delete resume. Please try again.');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (fileUrl, title) => {
    if (!fileUrl) {
      alert(`No file URL available for ${title}`);
      return;
    }
    const fullUrl = fileUrl.startsWith('http')
      ? fileUrl
      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${fileUrl}`;
    window.open(fullUrl, '_blank');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const parseSkills = (skillsStr) => {
    if (!skillsStr) return ['General Purpose'];
    if (Array.isArray(skillsStr)) return skillsStr;
    const items = skillsStr
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !s.toLowerCase().includes('skills'));
    return items.length > 0 ? items.slice(0, 4) : ['General Purpose'];
  };

  return (
    <MainLayout
      title="My Resumes"
      primaryButton="Upload Resume"
      onPrimaryClick={() => fileInputRef.current?.click()}
    >
      <div className="space-y-6">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files?.[0])}
        />

        {error && (
          <div className="p-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {error}
          </div>
        )}

        {uploading && (
          <div className="p-4 rounded-xl text-xs font-semibold text-purple-300 bg-purple-950/40 border border-purple-500/30 text-center animate-pulse flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            Uploading PDF &amp; extracting resume skills...
          </div>
        )}

        {/* Resume Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full glass-card p-12 text-center text-zinc-400 text-sm">
              Loading resumes...
            </div>
          ) : cvs.length > 0 ? (
            cvs.map((res) => (
              <div
                key={res.id}
                className="glass-card p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:scale-[1.01] hover:border-purple-500/30 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Gradient Document Avatar Icon */}
                      <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 text-purple-400 border border-purple-500/30 shrink-0 shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                          {res.label || 'Resume Document'}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium mt-0.5">
                          Uploaded {formatDate(res.uploaded_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills / Metadata Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-4">
                    {parseSkills(res.extracted_skills).map((skill, idx) => (
                      <span
                        key={`${skill}-${idx}`}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Download / Delete Action Buttons with Hover Glow */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    className="p-2 rounded-xl text-zinc-400 border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                    aria-label="Download resume"
                    onClick={() => handleDownload(res.file, res.label)}
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-xl text-zinc-400 border border-transparent hover:border-rose-500/30 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                    aria-label="Delete resume"
                    onClick={() => requestDelete(res.id, res.label)}
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full glass-card p-12 text-center text-zinc-500 text-sm">
              No resumes uploaded yet.
            </div>
          )}
        </div>

        {/* Upload Dropzone */}
        <div
          className="glass-card p-8 border-2 border-dashed border-purple-500/30 hover:border-purple-400/80 bg-purple-950/10 hover:bg-purple-900/20 hover:shadow-lg hover:shadow-purple-950/40 glow-purple transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 text-center group"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-3 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 mb-1 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8 animate-bounce" />
          </div>
          <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
            {uploading ? 'Processing resume...' : 'Drop your resume here or click to browse'}
          </p>
          <p className="text-xs text-zinc-500 font-mono">PDF only · Max 10MB</p>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete resume?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently removed, along with its entries in the AI search index.`
            : ''
        }
        confirmLabel="Delete resume"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </MainLayout>
  );
}
