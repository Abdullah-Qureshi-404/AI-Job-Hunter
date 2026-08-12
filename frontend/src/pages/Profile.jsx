import { useState, useEffect } from 'react';
import { Briefcase, User, Globe, CircleDollarSign, FileText, Sparkles, Code, Target } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { getProfile, createProfile } from '../services/profileApi';
import { getCVs } from '../services/resumeApi';
import { getMatches } from '../services/jobsApi';
import { parseApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

import { getCachedValue } from '../services/cache';
import { ProfileSkeleton } from '../components/ui/Skeleton';

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

  const cachedProf = getCachedValue('profile');
  const initialProf = Array.isArray(cachedProf) && cachedProf.length > 0 ? cachedProf[0] : (cachedProf?.id ? cachedProf : null);

  const [profile, setProfile] = useState(initialProf);
  const [loading, setLoading] = useState(!initialProf);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [cvCount, setCvCount] = useState(null);
  const [matchCount, setMatchCount] = useState(null);

  const [formData, setFormData] = useState({
    ...emptyForm,
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  });

  const fetchProfileData = async () => {
    try {
      if (!initialProf) {
        setLoading(true);
      }
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
        <ProfileSkeleton />
      </MainLayout>
    );
  }


  if (error && !profile && !isEditing) {
    return (
      <MainLayout title="Profile">
        <div className="glass-card p-12 text-center text-rose-400 font-semibold text-sm">
          {error}
        </div>
      </MainLayout>
    );
  }

  if (!profile || isEditing) {
    return (
      <MainLayout title="Profile">
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {isEditing ? 'Edit Your Profile' : 'Create Your Profile'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                {isEditing
                  ? 'Update your details. These drive AI job matching.'
                  : 'No career profile found. Setup your profile details below to enable AI job matching.'}
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Preferred Roles (comma separated)</label>
                <input
                  type="text"
                  value={formData.preferred_roles}
                  onChange={(e) => setFormData({ ...formData, preferred_roles: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Target Countries (comma separated)</label>
                <input
                  type="text"
                  value={formData.target_countries}
                  onChange={(e) => setFormData({ ...formData, target_countries: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Job Types Wanted (comma separated)</label>
                <input
                  type="text"
                  value={formData.job_types_wanted}
                  onChange={(e) => setFormData({ ...formData, job_types_wanted: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Experience Level</label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="junior" className="bg-[#12121a]">Junior</option>
                    <option value="mid" className="bg-[#12121a]">Mid Level</option>
                    <option value="senior" className="bg-[#12121a]">Senior Level</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Min Salary ($)</label>
                  <input
                    type="text"
                    value={formData.min_salary}
                    onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all"
                >
                  {isCreating ? 'Saving...' : 'Save Profile'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setError(null); }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
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

  const parsedSkills = typeof profile.skills === 'string'
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : Array.isArray(profile.skills)
    ? profile.skills
    : [];

  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const stats = [
    { label: 'Jobs Matched', value: matchCount ?? '—', icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/15' },
    { label: 'Resumes', value: cvCount ?? '—', icon: FileText, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15' },
    { label: 'Skills Detected', value: parsedSkills.length, icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  ];

  const preferences = [
    { label: 'Preferred Roles', value: profile.preferred_roles, icon: Target },
    { label: 'Target Countries', value: profile.target_countries, icon: Globe },
    { label: 'Job Types Wanted', value: profile.job_types_wanted, icon: Briefcase },
  ].filter((item) => item.value);

  return (
    <MainLayout title="Profile" primaryButton="Edit Profile" onPrimaryClick={startEditing}>
      <div className="space-y-6">
        {/* HERO CARD */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-5">
            {/* 80px Avatar Circle with Gradient */}
            <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-xl border-2 border-purple-400/40 shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{profile.name}</h2>
              <p className="text-xs font-medium text-zinc-400 mt-0.5">{profile.email}</p>
            </div>
          </div>

          {/* STATS ROW (3 Glassmorphic Mini Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s) => {
              const IconComp = s.icon;
              return (
                <div key={s.label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">{s.label}</p>
                    <p className="text-2xl font-extrabold text-white font-mono">{s.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* LEVEL / JOB TYPE / SALARY ROW AS BADGE PILLS */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border bg-white/5 border-white/10 text-xs font-semibold text-zinc-300">
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              Level: <strong className="text-white capitalize">{profile.experience_level || '—'}</strong>
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border bg-white/5 border-white/10 text-xs font-semibold text-zinc-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Types: <strong className="text-white">{profile.job_types_wanted || '—'}</strong>
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border bg-white/5 border-white/10 text-xs font-semibold text-zinc-300">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Min Salary: <strong className="text-white">{profile.min_salary ? `$${profile.min_salary}` : '—'}</strong>
            </span>
          </div>

          {/* TECHNICAL SKILLS AS VIOLET PILL BADGES */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-400" />
              Technical Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {parsedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ROLE PREFERENCES SECTION */}
        <div className="glass-card p-6 md:p-8 space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight border-b border-white/5 pb-3">
            Role Preferences
          </h2>
          {preferences.length > 0 ? (
            <div className="space-y-3">
              {preferences.map((pref) => {
                const PrefIcon = pref.icon;
                return (
                  <div key={pref.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-4 hover:border-white/20 transition-all">
                    <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 shrink-0 border border-purple-500/20">
                      <PrefIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white mb-0.5">{pref.label}</h3>
                      <p className="text-xs text-zinc-400 font-medium">{pref.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              No preferences set yet. Use Edit Profile to add them.
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
