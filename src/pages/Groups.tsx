import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Groups.css';

interface Group {
  id: string;
  name: string;
  members: number;
  debutYear: number;
  image: string;
  company: string;
  fandom: string;
  isActive: boolean;
}

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [groups] = useState<Group[]>([
    {
      id: '1',
      name: 'BTS',
      members: 7,
      debutYear: 2013,
      image: 'https://picsum.photos/seed/bts/300/300',
      company: 'HYBE',
      fandom: 'ARMY',
      isActive: true,
    },
    {
      id: '2',
      name: 'BLACKPINK',
      members: 4,
      debutYear: 2016,
      image: 'https://picsum.photos/seed/blackpink/300/300',
      company: 'YG',
      fandom: 'BLINK',
      isActive: true,
    },
    {
      id: '3',
      name: 'TWICE',
      members: 9,
      debutYear: 2015,
      image: 'https://picsum.photos/seed/twice/300/300',
      company: 'JYP',
      fandom: 'ONCE',
      isActive: true,
    },
    {
      id: '4',
      name: 'TXT',
      members: 5,
      debutYear: 2019,
      image: 'https://picsum.photos/seed/txt/300/300',
      company: 'HYBE',
      fandom: 'MOA',
      isActive: true,
    },
    {
      id: '5',
      name: 'ENHYPEN',
      members: 7,
      debutYear: 2020,
      image: 'https://picsum.photos/seed/enhypen/300/300',
      company: 'BELIFT LAB',
      fandom: 'ENGENE',
      isActive: true,
    },
    {
      id: '6',
      name: 'SEVENTEEN',
      members: 13,
      debutYear: 2015,
      image: 'https://picsum.photos/seed/seventeen/300/300',
      company: 'Pledis',
      fandom: 'CARAT',
      isActive: true,
    },
    {
      id: '7',
      name: 'NCT',
      members: 23,
      debutYear: 2016,
      image: 'https://picsum.photos/seed/nct/300/300',
      company: 'SM',
      fandom: 'NCTzen',
      isActive: true,
    },
    {
      id: '8',
      name: 'aespa',
      members: 4,
      debutYear: 2020,
      image: 'https://picsum.photos/seed/aespa/300/300',
      company: 'SM',
      fandom: 'MY',
      isActive: true,
    },
  ]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.fandom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="groups-page">
      {/* HEADER */}
      <div className="groups-header">
        <h1 className="groups-title">
          <i className="fas fa-users" style={{ color: '#00CED1' }} />
          Groups
        </h1>
        <div className="groups-search">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Search groups, fandom, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="groups-search-clear" onClick={() => setSearchQuery('')}>
              <i className="fas fa-times-circle" />
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="groups-stats">
        <div className="stat-card">
          <span className="stat-value">{groups.length}</span>
          <span className="stat-label">Total Groups</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{groups.filter((g) => g.isActive).length}</span>
          <span className="stat-label">Active Groups</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{groups.reduce((sum, g) => sum + g.members, 0)}</span>
          <span className="stat-label">Total Members</span>
        </div>
      </div>

      {/* GRID */}
      <div className="groups-content">
        <div className="groups-grid">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                className="group-card"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <div className="group-image">
                  <img src={group.image} alt={group.name} loading="lazy" />
                  {group.isActive && <span className="group-active-badge">Active</span>}
                </div>
                <div className="group-info">
                  <h3 className="group-name">{group.name}</h3>
                  <p className="group-members">{group.members} members</p>
                  <p className="group-company">{group.company}</p>
                  <div className="group-meta">
                    <span className="group-debut">Debut: {group.debutYear}</span>
                    <span className="group-fandom">Fandom: {group.fandom}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="groups-empty">
              <i className="fas fa-users" />
              <h3>No groups found</h3>
              <p>Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Groups;