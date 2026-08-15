'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Shield, Crown, LayoutGrid, Key, LogIn } from 'lucide-react';
import { familyService, authService, storageService } from '../services/supabase';
import { FamilyGroupWithMembers, FamilyMember, PecsBoard } from '../types';
import InviteCodeModal from './InviteCodeModal';
import JoinGroupModal from './JoinGroupModal';

interface FamilyGroupsProps {
  onBoardCreate?: (groupId: string) => void;
}

export default function FamilyGroups({ onBoardCreate }: FamilyGroupsProps) {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [groupBoards, setGroupBoards] = useState<Record<string, PecsBoard[]>>({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState<{ code: string; expiresAt: string; groupName: string } | null>(null);

  useEffect(() => {
    loadFamilyGroups();
  }, []);

  const loadFamilyGroups = async () => {
    try {
      const user = await authService.getUser();
      if (!user) return;

      setUserId(user.id);
      const groups = await familyService.getFamilyGroups(user.id);
      setFamilyGroups(groups);

      // Load boards for each group
      const allBoards = await storageService.getBoards(user.id, true);
      const boardsByGroup: Record<string, PecsBoard[]> = {};

      groups.forEach(group => {
        boardsByGroup[group.id] = allBoards.filter(board => board.familyGroupId === group.id);
      });

      setGroupBoards(boardsByGroup);
    } catch (error) {
      console.error('Error loading family groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newGroupName.trim()) return;

    try {
      const group = await familyService.createFamilyGroup(newGroupName, userId);
      if (group) {
        await loadFamilyGroups();
        setNewGroupName('');
        setShowCreateForm(false);
        alert('Family group created successfully!');
      } else {
        alert('Failed to create family group. Please check the console for errors and ensure the migration has been applied.');
      }
    } catch (error) {
      console.error('Error creating family group:', error);
      alert('Error creating family group. Please check the console for details.');
    }
  };



  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the family group?')) return;

    try {
      const success = await familyService.removeFamilyMember(memberId);
      if (success) {
        await loadFamilyGroups();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this family group? All members will lose access to shared boards.')) return;

    try {
      const success = await familyService.deleteFamilyGroup(groupId);
      if (success) {
        await loadFamilyGroups();

      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleGenerateInviteCode = async (groupId: string, groupName: string) => {
    try {
      const result = await familyService.generateInviteCode(groupId);
      if (result) {
        setCurrentInviteCode({
          code: result.code,
          expiresAt: result.expiresAt,
          groupName
        });
        setShowInviteModal(true);
      } else {
        alert('Failed to generate invite code');
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      alert('Failed to generate invite code');
    }
  };

  const handleJoinWithCode = async (code: string) => {
    const result = await familyService.joinWithCode(code);
    if (result.success) {
      await loadFamilyGroups();
    }
    return result;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const canManageGroup = (group: FamilyGroupWithMembers) => {
    const userMember = group.members.find(m => m.userId === userId);
    return userMember?.role === 'owner' || userMember?.role === 'admin';
  };

  if (loading) {
    return <div className="p-12 text-center text-stone-500">Loading groups…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div><p className="section-kicker">Shared care</p><h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Users className="w-7 h-7 text-teal-700" />Family groups</h2><p className="text-stone-500 mt-1">Keep communication boards consistent across home, school, and care teams.</p></div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="secondary-button !min-h-10 !py-2"
          >
            <LogIn className="w-4 h-4" />
            Join group
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="primary-button !min-h-10 !py-2"
          >
            <Plus className="w-4 h-4" />
            Create group
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateGroup} className="editor-toolbar mb-6 p-5">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Family group name"
            className="search-input w-full px-4 py-3 mb-3"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="primary-button !min-h-10 !py-2"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {familyGroups.map((group) => (
          <div key={group.id} className="board-tile !p-5">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{group.name}</h3>
              {canManageGroup(group) && (
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Members</h4>
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className="text-sm">
                      {member.profile?.displayName || member.profile?.email || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">({member.role})</span>
                  </div>
                  {canManageGroup(group) && member.userId !== userId && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove member"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Shared Boards</h4>
                <button
                  onClick={() => onBoardCreate?.(group.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
                  title="Create board for this group"
                >
                  <Plus className="w-3 h-3" />
                  New board
                </button>
              </div>
              {groupBoards[group.id]?.length > 0 ? (
                <div className="space-y-1">
                  {groupBoards[group.id].map((board) => (
                    <div key={board.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                      <LayoutGrid className="w-3 h-3 text-gray-400" />
                      <span className="flex-1">{board.title}</span>
                      <span className="text-xs text-gray-500">{board.cards.length} cards</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No shared boards yet</p>
              )}
            </div>

            {canManageGroup(group) && (
              <div className="border-t pt-4">
                <button
                  onClick={() => handleGenerateInviteCode(group.id, group.name)}
                  className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                >
                  <Key className="w-4 h-4" />
                  Create invite code
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {familyGroups.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon"><Users className="w-7 h-7" /></span>
          <h3>No groups yet</h3><p>Create a private group to share boards with family members, teachers, or caregivers.</p>
        </div>
      )}

      {/* Invite Code Modal */}
      {currentInviteCode && (
        <InviteCodeModal
          isOpen={showInviteModal}
          groupName={currentInviteCode.groupName}
          inviteCode={currentInviteCode.code}
          expiresAt={currentInviteCode.expiresAt}
          onClose={() => {
            setShowInviteModal(false);
            setCurrentInviteCode(null);
          }}
          onRefresh={() => {
            setShowInviteModal(false);
            setCurrentInviteCode(null);
            if (currentInviteCode) {
              const group = familyGroups.find(g => g.name === currentInviteCode.groupName);
              if (group) {
                handleGenerateInviteCode(group.id, group.name);
              }
            }
          }}
        />
      )}

      {/* Join Group Modal */}
      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinWithCode}
      />
    </div>
  );
}
