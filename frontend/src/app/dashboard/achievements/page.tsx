'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface UserAchievement {
  id: number;
  earned_at: string;
  achievement: Achievement;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data } = await api.get('/achievements');
      setAchievements(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const { data } = await api.post('/achievements/check');
      if (data.new_achievements.length > 0) {
        alert(`You earned new achievements: ${data.new_achievements.join(', ')}`);
        fetchAchievements();
      } else {
        alert('No new achievements unlocked yet. Keep going!');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  const totalPoints = achievements.reduce((acc, curr) => acc + curr.achievement.points, 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Your Achievements</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Complete financial milestones to earn badges and points.</p>
        </div>
        <button className="btn btn-primary" onClick={handleCheck} disabled={checking}>
          {checking ? 'Checking...' : 'Check for New Badges'}
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'var(--gradient)', color: 'white' }}>
          <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Points</div>
          <div className="stat-value" style={{ color: 'white' }}>{totalPoints} ✨</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Badges Earned</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{achievements.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <p>Loading achievements...</p>
        ) : achievements.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
            <h3>Your journey begins here</h3>
            <p style={{ color: 'var(--muted-foreground)', maxWidth: '400px', margin: '0 auto' }}>
              You haven't unlocked any badges yet. Start tracking budgets, goals, and scanning receipts to earn them!
            </p>
          </div>
        ) : (
          achievements.map(({ id, achievement, earned_at }) => (
            <div key={id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem', background: 'var(--muted)', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {achievement.icon}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{achievement.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: '0.25rem 0' }}>{achievement.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>+{achievement.points} pts</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{new Date(earned_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
