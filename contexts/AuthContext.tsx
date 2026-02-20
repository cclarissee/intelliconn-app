import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';

interface AuthContextType {
  user: User | null;
  role: string | null;
  username: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  role: null, 
  username: null, 
  loading: true, 
  isSuperAdmin: false,
  isAdmin: false 
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role || 'user');
            setUsername(userData.username || null);
          } else {
            setRole('user'); // Default role if not found
            setUsername(null);
          }
        } catch (error) {
          // Silently handle errors (e.g., permission denied after logout)
          setRole('user');
          setUsername(null);
        }
      } else {
        setRole(null);
        setUsername(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

const normalizedRole = role?.toLowerCase();

const isSuperAdmin = normalizedRole === 'superadmin';
const isAdmin = normalizedRole === 'admin' || normalizedRole === 'superadmin';


  return (
    <AuthContext.Provider value={{ user, role, username, loading, isSuperAdmin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
