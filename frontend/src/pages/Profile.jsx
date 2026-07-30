import { useState, useEffect } from 'react';
import { HiOutlineBriefcase, HiOutlineUser, HiOutlineGlobe, HiOutlineCurrencyDollar } from 'react-icons/hi';
import MainLayout from '../components/layout/MainLayout';
import { getProfile, createProfile } from '../services/profileApi';
import { getCVs } from '../services/resumeApi';
import { getMatches } from '../services/jobsApi';
import { parseApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const emptyForm = {
  name: '',
  email: '',
  skills: '',
  experience_level: 'mid',
  preferred_roles: '',
  target_countries: '',
  job_types_wanted: '',
  min_salary: '',
};

export default function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Real counts, not placeholders.
  const [cvCount, setCvCount] = useState(null);
  const [matchCount, setMatchCount] = useState(null);

  // Seeded from the signed-in account so users never create a profile under
  // someone else's identity.
  const [formData, setFormData] = useState({
    ...emptyForm,
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  });

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProfile();
      if (Array.isArray(data) && data.length > 0) {
        setProfile(data[0]);
      } else if (data && typeof data === 'object' && !Array.isArray(data) && data.id) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Keep the form seeded once the auth user resolves.
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user?.user_metadata?.full_name || '',
      email: prev.email || user?.email || '',
    }));
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    getCVs()
      .then((cvs) => isMounted && setCvCount(Array.isArray(cvs) ? cvs.length : 0))
      .catch(() => isMounted && setCvCount(null));

    getMatches()
      .then(({ results }) => isMounted && setMatchCount(results.length))
      .catch(() => isMounted && setMatchCount(null));

    return () => {
      isMounted = false;
    };
  }, []);

  const startEditing = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || user?.email || '',
      skills: profile?.skills || '',
      experience_level: profile?.experience_level || 'mid',
      preferred_roles: profile?.preferred_roles || '',
      target_countries: profile?.target_countries || '',
      job_types_wanted: profile?.job_types_wanted || '',
      min_salary: profile?.min_salary || '',
    });
    setIsEditing(true);
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      setError(null);
      // POST upserts server-side, so this saves both new and edited profiles.
      await createProfile(formData);
      setIsEditing(false);
      await fetchProfileData();
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(parseApiError(err) || 'Failed to save profile. Please check inputs.');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Profile">
        <div className="profile-container">
          <div className="profile-card" style={{ textAlign: 'center', color: '#9090a8', padding: 60 }}>
            Loading profile...
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !profile && !isEditing) {
    return (
      <MainLayout title="Profile">
        <div className="profile-container">
          <div className="profile-card" style={{ textAlign: 'center', color: '#ff6b6b', padding: 60 }}>
            {error}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Create / edit form
  if (!profile || isEditing) {
    return (
      <MainLayout title="Profile">
        <div className="profile-container">
          <div className="profile-card">
            <h2 className="profile-section-title">
              {isEditing ? 'Edit Your Profile' : 'Create Your Profile'}
            </h2>
            <p style={{ fontSize: 13, color: '#9090a8', margin: '0 0 16px' }}>
              {isEditing
                ? 'Update your details. These drive AI job matching.'
                : 'No career profile found. Setup your profile details below to enable AI job matching.'}
            </p>

            {error && (
              <div style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '10px 14px', borderRadius: 6, fontSize: 12, marginBottom: 14, whiteSpace: 'pre-line' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#9090a8', display: 'block', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', height: 38, background: '#1a1a2e', border: '0.5px solid #2a2a3a', borderRadius: 6, color: '#e8e8f0', padding: '0 12px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#9090a8', display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', height: 38, background: '#1a1a2e', border: '0.5px solid #2a2a3a', borderRadius: 6, color: '#e8e8f0', padding: '0 12px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#9090a8', display: 'block', marginBottom: 4 }}>Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  style={{ width: '100%', height: 38, background: '#1a1a2e', border: '0.5px solid #2a2a3a', borderRadius: 6, color: '#e8e8f0', padding: '0 12px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#9090a8', display: 'block', marginBottom: 4 }}>Preferred Roles (comma separated)</label>
                <input
                  type="text"
                  value={formData.preferred_roles}
                  onChange={(e) => setFormData({ ...formData, preferred_roles: e.target.value })}
                  style={{ width: '100%', height: 38, background: '#1a1a2e', border: '0.5px solid #2a2a3a', borderRadius: 6, color: '#e8e8f0', padding: '0 12px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#9090a8', display: 'block', marginBottom: 4 }}>Target Countries (comma separated)</label>
                <input
                  type="text"
                  value={formData.target_countries}
                  onChange={(e) => setFormData({ ...formData, target_countries: e.target.value })}
                  style={{ width: '100%', height: 38, background: '#1a1a2e', border: '0.5px solid #2a2a3a', borderRadius: 6, color: '#e8e8f0', padding: '0 12px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#9090a8', display: 'block', marginBottom: 4 }}>Job Types Wanted (comma separated)</label>
                <input
                  type="text"
                  value={formData.job_types_wanted}
                  onChange={(e) => setFormData({ ...formData, job_types_wanted: e.target.value })}
                  style={{ width: '100%', height: 38, background: '#1a1a2e', border: '0.5px solid #2a2a3a', borderRadius: 6, color: '#e8e8f0', padding: '0 12px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#9090a8', display: 'block', marginBottom: 4 }}>Experience Level</label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                    style={{ width: '100%', height: 38, background: '#1a1a2e', border: '0.5px solid #2a2a3a', borderRadius: 6, color: '#e8e8f0', padding: '0 12px', boxSizing: 'border-box' }}
                  >
                    <option value="junior">Junior</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#9090a8', display: 'block', marginBottom: 4 }}>Min Salary ($)</label>
                  <input
                    type="text"
                    value={formData.min_salary}
                    onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                    style={{ width: '100%', height: 38, background: '#1a1a2e', border: '0.5px solid #2a2a3a', borderRadius: 6, color: '#e8e8f0', padding: '0 12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{ flex: 1, height: 40, background: '#7c6ff7', border: 'none', borderRadius: 8, color: 'white', fontWeight: 500, cursor: 'pointer' }}
                >
                  {isCreating ? 'Saving...' : 'Save Profile'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setError(null); }}
                    style={{ height: 40, padding: '0 18px', background: 'none', border: '0.5px solid #2a2a3a', borderRadius: 8, color: '#9090a8', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Parse skills from backend string or array
  const parsedSkills = typeof profile.skills === 'string'
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : Array.isArray(profile.skills)
    ? profile.skills
    : [];

  // Initials for avatar
  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const stats = [
    { label: 'Jobs Matched', value: matchCount ?? '—' },
    { label: 'Resumes', value: cvCount ?? '—' },
    { label: 'Skills Detected', value: parsedSkills.length },
  ];

  // Role preferences only. This app has no work-history data source, so
  // nothing here is presented as employment history.
  const preferences = [
    { label: 'Preferred Roles', value: profile.preferred_roles },
    { label: 'Target Countries', value: profile.target_countries },
    { label: 'Job Types Wanted', value: profile.job_types_wanted },
  ].filter((item) => item.value);

  return (
    <MainLayout title="Profile" primaryButton="Edit Profile" onPrimaryClick={startEditing}>
      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <h1 className="profile-name">{profile.name}</h1>
              <p className="profile-email">{profile.email}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="profile-stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="profile-stat-box">
                <p className="profile-stat-label">{s.label}</p>
                <p className="profile-stat-val">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Additional Preferences Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12, color: '#9090a8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlineBriefcase style={{ color: '#7c6ff7' }} />
              <span>Level: <strong style={{ color: '#e8e8f0' }}>{profile.experience_level || '—'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlineGlobe style={{ color: '#7c6ff7' }} />
              <span>Job Types: <strong style={{ color: '#e8e8f0' }}>{profile.job_types_wanted || '—'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlineCurrencyDollar style={{ color: '#7c6ff7' }} />
              <span>Min Salary: <strong style={{ color: '#e8e8f0' }}>{profile.min_salary ? `$${profile.min_salary}` : '—'}</strong></span>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="profile-section-title">Technical Skills</h2>
            <div className="profile-skills-row">
              {parsedSkills.map((skill) => (
                <span key={skill} className="profile-skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Role Preferences Card */}
        <div className="profile-card">
          <h2 className="profile-section-title">Role Preferences</h2>
          {preferences.length > 0 ? (
            <div className="profile-exp-list">
              {preferences.map((pref) => (
                <div key={pref.label} className="profile-exp-item">
                  <div className="profile-exp-icon">
                    <HiOutlineBriefcase />
                  </div>
                  <div className="profile-exp-details">
                    <h3 className="profile-exp-role">{pref.label}</h3>
                    <p className="profile-exp-company">{pref.value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#9090a8', margin: 0 }}>
              No preferences set yet. Use Edit Profile to add them.
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
