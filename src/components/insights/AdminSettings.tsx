import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient';
import { cn } from '@/lib/utils';
import { adminStyles as styles } from '../admin/styles/adminStyles';

interface User {
  id: string;
  email: string;
  role?: 'admin' | 'user';
  created_at: string;
}

interface AdminSettingsProps {
  currentUserId: string;
  isLoading: boolean;
}

export function AdminSettings({ currentUserId, isLoading }: AdminSettingsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: userRoles, error: rolesError } = await supabase
        .from('map_user_roles')
        .select('user_id, role, email');

      if (rolesError) throw rolesError;

      const usersWithRoles = userRoles?.map(user => ({
        id: user.user_id,
        email: user.email,
        created_at: new Date().toISOString(),
        role: user.role
      })) || [];

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      setError(null);
      setSuccessMessage(null);

      const { error } = await supabase.rpc('assign_user_role', {
        p_user_id: userId,
        p_role: newRole
      });

      if (error) throw error;

      setSuccessMessage(`Successfully updated user role to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className={styles.loading}>Loading users...</div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Search Bar */}
      <div className={styles.pageHeader}>
        <input
          type="text"
          placeholder="Search users by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(styles.input.base, "w-64")}
        />
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.alert.error}>
          {error}
        </div>
      )}
      {successMessage && (
        <div className={styles.alert.success}>
          {successMessage}
        </div>
      )}

      {/* Users List */}
      <div className={styles.panel}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHeaderCell}>Email</th>
              <th className={styles.tableHeaderCell}>Role</th>
              <th className={styles.tableHeaderCell}>Joined</th>
              <th className={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className="text-foreground">{user.email}</div>
                </td>
                <td className={styles.tableCell}>
                  <span className={cn(
                    styles.badge.base,
                    user.role === 'admin' ? styles.badge.purple : styles.badge.gray
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className={styles.tableCell}>
                  {user.id !== currentUserId && (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                      className={cn(styles.select.base, "w-full")}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
