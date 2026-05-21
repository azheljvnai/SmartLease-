import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase/app';
import { getUserProfile, logOut as authLogOut } from '../../services/auth.service';
import { getTenant, getTenantByUserId } from '../../services/tenants.service';
import type { Tenant, UserProfile } from '../../types';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  tenant: Tenant | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (firebaseUser: User) => {
    const userProfile = await getUserProfile(firebaseUser.uid);
    setProfile(userProfile);
    if (userProfile?.role === 'tenant') {
      const tenantRecord = userProfile.tenantId
        ? await getTenant(userProfile.tenantId)
        : await getTenantByUserId(firebaseUser.uid);
      setTenant(tenantRecord);
    } else {
      setTenant(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await loadProfile(firebaseUser);
        } catch {
          setProfile(null);
          setTenant(null);
        }
      } else {
        setProfile(null);
        setTenant(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await authLogOut();
    setUser(null);
    setProfile(null);
    setTenant(null);
  }, []);

  const value = useMemo(
    () => ({ user, profile, tenant, loading, signOut, refreshProfile }),
    [user, profile, tenant, loading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
