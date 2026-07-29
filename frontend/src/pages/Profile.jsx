import { useState, useEffect } from 'react';
import { HiOutlineBriefcase, HiOutlineUser, HiOutlineGlobe, HiOutlineCurrencyDollar } from 'react-icons/hi';
import MainLayout from '../components/layout/MainLayout';
import { getProfile, createProfile } from '../services/profileApi';
import './Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creation if empty
  const [formData, setFormData] = useState({
    name: 'Abdul Kareem',
    email: 'abdulkareem@email.com',
    skills: 'Python, FastAPI, Django, PostgreSQL, React, Node.js',
    experience_level: 'mid',
    preferred_roles: 'Backend Developer, Full Stack Engineer',
    target_countries: 'Remote, United States',
    job_types_wanted: 'full-time, remote',
    min_salary: '95000.00',
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

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      setError(null);
      await createProfile(formData);
      await fetchProfileData();
    } catch (err) {
      console.error('Failed to create profile:', err);
      setError('Failed to create profile. Please check inputs.');
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

  if (error) {
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

  // Empty Profile State
  if (!profile) {
    return (
      <MainLayout title="Profile" primaryButton="Create Profile">
        <div className="profile-container">
          <div className="profile-card">
            <h2 className="profile-section-title">Create Your Profile</h2>
            <p style={{ fontSize: 13, color: '#9090a8', margin: '0 0 16px' }}>
              No career profile found. Setup your profile details below to enable AI job matching.
            </p>

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

              <button
                type="submit"
                disabled={isCreating}
                style={{ height: 40, marginTop: 10, background: '#7c6ff7', border: 'none', borderRadius: 8, color: 'white', fontWeight: 500, cursor: 'pointer' }}
              >
                {isCreating ? 'Creating Profile...' : 'Save Profile'}
              </button>
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
    : ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'React'];

  // Initials for avatar
  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AK';

  const stats = [
    { label: 'Jobs Matched', value: 47 },
    { label: 'Resumes', value: 3 },
    { label: 'Skills Detected', value: parsedSkills.length },
  ];

  const experiences = [
    {
      role: profile.preferred_roles ? profile.preferred_roles.split(',')[0] : 'Backend Developer Intern',
      company: profile.target_countries ? `Target: ${profile.target_countries}` : 'TechFlow AI · Remote',
      date: `Min Salary: $${profile.min_salary || '95,000'}`,
    },
    {
      role: 'Full Stack Developer',
      company: 'DevStudio · Contract',
      date: 'Jun 2023 - Dec 2023',
    },
  ];

  return (
    <MainLayout title="Profile" primaryButton="Edit Profile">
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
              <span>Level: <strong style={{ color: '#e8e8f0' }}>{profile.experience_level || 'Mid'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlineGlobe style={{ color: '#7c6ff7' }} />
              <span>Job Types: <strong style={{ color: '#e8e8f0' }}>{profile.job_types_wanted || 'Full-time'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlineCurrencyDollar style={{ color: '#7c6ff7' }} />
              <span>Min Salary: <strong style={{ color: '#e8e8f0' }}>${profile.min_salary || '95,000'}</strong></span>
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

        {/* Experience Card */}
        <div className="profile-card">
          <h2 className="profile-section-title">Work Experience & Role Preferences</h2>
          <div className="profile-exp-list">
            {experiences.map((exp, idx) => (
              <div key={idx} className="profile-exp-item">
                <div className="profile-exp-icon">
                  <HiOutlineBriefcase />
                </div>
                <div className="profile-exp-details">
                  <h3 className="profile-exp-role">{exp.role}</h3>
                  <p className="profile-exp-company">{exp.company}</p>
                  <span className="profile-exp-date">{exp.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
