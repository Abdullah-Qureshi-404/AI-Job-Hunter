import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineCloudUpload,
} from 'react-icons/hi';
import MainLayout from '../components/layout/MainLayout';
import { getCVs, uploadCV, deleteCV } from '../services/resumeApi';
import { getProfile } from '../services/profileApi';
import './Resumes.css';

export default function Resumes() {
  const [cvs, setCvs] = useState([]);
  const [profileId, setProfileId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile to obtain correct profile ID
      try {
        const profData = await getProfile();
        const pId = Array.isArray(profData) && profData.length > 0
          ? profData[0].id
          : (profData?.id || 1);
        setProfileId(pId);
      } catch {
        setProfileId(1);
      }

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
      formData.append('profile', profileId);
      formData.append('label', file.name.replace(/\.pdf$/i, ''));
      formData.append('file', file);

      await uploadCV(formData);
      await fetchCVs();
    } catch (err) {
      console.error('Failed to upload CV:', err);
      setError('Failed to upload resume. Please check backend connection.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setError(null);
      await deleteCV(id);
      await fetchCVs();
    } catch (err) {
      console.error(`Failed to delete CV ${id}:`, err);
      setError('Failed to delete resume. Please try again.');
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
    <MainLayout title="My Resumes" primaryButton="Upload Resume">
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
                    onClick={() => handleDelete(res.id, res.label)}
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
    </MainLayout>
  );
}
