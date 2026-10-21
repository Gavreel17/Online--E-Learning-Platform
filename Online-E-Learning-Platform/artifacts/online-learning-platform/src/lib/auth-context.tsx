import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  studentId: string;
  avatarUrl?: string | null;
  department?: string;
}

export const DEFAULT_STUDENT: UserProfile = {
  id: '',
  fullName: 'Student',
  email: '',
  role: 'student',
  studentId: '',
  avatarUrl: null,
};

export const DEFAULT_TEACHER: UserProfile = {
  id: '',
  fullName: 'Instructor',
  email: '',
  role: 'teacher',
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
  role: 'student' | 'teacher' | 'admin';
  signIn: (role?: 'student' | 'teacher' | 'admin', name?: string, email?: string, studentId?: string, department?: string) => void;
  signUp: (name: string, email: string, role?: 'student' | 'teacher' | 'admin') => void;
  signOut: () => void;
  switchRole: (role: 'student' | 'teacher' | 'admin') => void;
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

  const signIn = (role: 'student' | 'teacher' | 'admin' = 'student', name?: string, email?: string, customStudentId?: string, department?: string) => {
    const id = `user_${Date.now()}`;
    const studentId = customStudentId || (role === 'admin' ? `ADM-${Date.now().toString().slice(-4)}` : role === 'teacher' ? `TCH-${Date.now().toString().slice(-4)}` : `STU-${Date.now().toString().slice(-4)}`);
    if (role === 'admin') {
      setUser({
        ...DEFAULT_ADMIN,
        id,
        fullName: name || 'Administrator',
        email: email || 'admin@lumenpath.edu',
        studentId,
        department,
      });
    } else if (role === 'teacher') {
      setUser({
        ...DEFAULT_TEACHER,
        id,
        fullName: name || 'Instructor',
        email: email || 'teacher@lumenpath.edu',
        studentId,
        department: department || 'General Education',
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

  const signUp = (name: string, email: string, role: 'student' | 'teacher' | 'admin' = 'student') => {
    const id = `user_${Date.now()}`;
    const studentId = role === 'admin' ? `ADM-${Date.now().toString().slice(-4)}` : role === 'teacher' ? `TCH-${Date.now().toString().slice(-4)}` : `STU-${Date.now().toString().slice(-4)}`;
    setUser({
      id,
      fullName: name || (role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Instructor' : 'Student'),
      email: email || `${id}@lumenpath.edu`,
      role,
      studentId,
      avatarUrl: null,
    });
  };

  const signOut = () => {
    setUser(null);
  };

  const switchRole = (newRole: 'student' | 'teacher' | 'admin') => {
    if (!user) {
      signIn(newRole);
      return;
    }
    const studentId = newRole === 'admin' ? `ADM-${Date.now().toString().slice(-4)}` : newRole === 'teacher' ? `TCH-${Date.now().toString().slice(-4)}` : `STU-${Date.now().toString().slice(-4)}`;
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
