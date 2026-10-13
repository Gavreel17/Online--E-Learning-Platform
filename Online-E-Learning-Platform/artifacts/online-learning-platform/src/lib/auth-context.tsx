import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'student' | 'admin';
  studentId: string;
  avatarUrl?: string | null;
}

export const DEFAULT_STUDENT: UserProfile = {
  id: '',
  fullName: 'Student',
  email: '',
  role: 'student',
  studentId: '',
  avatarUrl: null,
};

export const DEFAULT_ADMIN: UserProfile = {
  id: '',
  fullName: 'Administrator',
  email: '',
  role: 'admin',
  studentId: '',
  avatarUrl: null,
};

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: UserProfile | null;
  role: 'student' | 'admin';
  signIn: (role?: 'student' | 'admin', name?: string, email?: string) => void;
  signUp: (name: string, email: string, role?: 'student' | 'admin') => void;
  signOut: () => void;
  switchRole: (role: 'student' | 'admin') => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'lumenpath_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const signIn = (role: 'student' | 'admin' = 'student', name?: string, email?: string) => {
    const id = `user_${Date.now()}`;
    const studentId = role === 'admin' ? `ADM-${Date.now().toString().slice(-4)}` : `STU-${Date.now().toString().slice(-4)}`;
    if (role === 'admin') {
      setUser({
        ...DEFAULT_ADMIN,
        id,
        fullName: name || 'Administrator',
        email: email || 'admin@lumenpath.edu',
        studentId,
      });
    } else {
      setUser({
        ...DEFAULT_STUDENT,
        id,
        fullName: name || 'Student',
        email: email || 'student@lumenpath.edu',
        studentId,
      });
    }
  };

  const signUp = (name: string, email: string, role: 'student' | 'admin' = 'student') => {
    const id = `user_${Date.now()}`;
    const studentId = role === 'admin' ? `ADM-${Date.now().toString().slice(-4)}` : `STU-${Date.now().toString().slice(-4)}`;
    setUser({
      id,
      fullName: name || (role === 'admin' ? 'Administrator' : 'Student'),
      email: email || `${id}@lumenpath.edu`,
      role,
      studentId,
      avatarUrl: null,
    });
  };

  const signOut = () => {
    setUser(null);
  };

  const switchRole = (newRole: 'student' | 'admin') => {
    if (!user) {
      signIn(newRole);
      return;
    }
    const studentId = newRole === 'admin' ? `ADM-${Date.now().toString().slice(-4)}` : `STU-${Date.now().toString().slice(-4)}`;
    setUser({
      ...user,
      role: newRole,
      studentId,
    });
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: !!user,
        isLoaded,
        user,
        role: user?.role ?? 'student',
        signIn,
        signUp,
        signOut,
        switchRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
