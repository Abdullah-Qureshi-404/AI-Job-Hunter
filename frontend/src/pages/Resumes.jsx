import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineCloudUpload,
} from 'react-icons/hi';
import MainLayout from '../components/layout/MainLayout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getCVs, uploadCV, deleteCV } from '../services/resumeApi';
import { parseApiError } from '../services/api';
import './Resumes.css';

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

      // No `profile` field: the server resolves the owner from the auth
      // token. Sending a client-chosen id would attach the CV to the wrong
      // account.
      const formData = new FormData();
      formData.append('label', file.name.replace(/\.pdf$/i, ''));
      formData.append('file', file);

      const newCv = await uploadCV(formData);

      // Surface the Apply AI mirror failure instead of silently dropping it.
      if (newCv?.apply_ai_warning) {
        setError(newCv.apply_ai_warning);
      }

      // The upload response is the new row, so prepend it rather than
      // re-downloading the whole list.
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

    // Drop the row immediately. The list is already correct locally, so
    // re-fetching everything just to remove one item made deletion feel like
    // a page reload.
    setCvs((rows) => rows.filter((cv) => cv.id !== id));

    try {
      await deleteCV(id);
      setPendingDelete(null);
    } catch (err) {
      console.error(`Failed to delete CV ${id}:`, err);
      setCvs(previous); // put it back
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
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      <div className="resumes-container">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e.target.files?.[0])}
        />

        {error && (
          <div style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '12px 16px', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        {uploading && (
          <div style={{ color: '#7c6ff7', background: 'rgba(124,111,247,0.1)', padding: '12px 16px', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>
            Uploading PDF & extracting resume skills...
          </div>
        )}

        {/* Resume Cards Grid */}
        <div className="resumes-grid">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#9090a8', padding: '40px 0' }}>
              Loading resumes...
            </div>
          ) : cvs.length > 0 ? (
            cvs.map((res) => (
              <div key={res.id} className="resume-card">
                <div>
                  <div className="resume-card-header">
                    <div className="resume-file-icon">
                      <HiOutlineDocumentText />
                    </div>
                    <div className="resume-meta">
                      <h3 className="resume-title">{res.label || 'Resume Document'}</h3>
                      <span className="resume-date">{formatDate(res.uploaded_at)}</span>
                    </div>
                  </div>

                  <div className="resume-skills-chips" style={{ marginTop: 14 }}>
                    {parseSkills(res.extracted_skills).map((skill, idx) => (
                      <span key={`${skill}-${idx}`} className="resume-skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="resume-card-actions">
                  <button
                    type="button"
                    className="resume-icon-btn"
                    aria-label="Download resume"
                    onClick={() => handleDownload(res.file, res.label)}
                  >
                    <HiOutlineDownload />
                  </button>
                  <button
                    type="button"
                    className="resume-icon-btn delete"
                    aria-label="Delete resume"
                    onClick={() => requestDelete(res.id, res.label)}
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b6b80', padding: '40px 0' }}>
              No resumes uploaded yet.
            </div>
          )}
        </div>

        {/* Bottom Upload Dropzone */}
        <div
          className="resumes-dropzone"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
        >
          <HiOutlineCloudUpload className="resumes-dropzone-icon" />
          <p className="resumes-dropzone-text">
            {uploading ? 'Processing resume...' : 'Drop your resume here or click to browse'}
          </p>
          <p className="resumes-dropzone-subtext">PDF only · Max 10MB</p>
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
