import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';

/**
 * Manages Firebase Auth state and all Firestore real-time subscriptions.
 * Call this once at the top of App.
 */
export function useFirebaseData() {
  const {
    setUser, setIsLoading, setLoadingStep, resetAllData,
    setInventory, setRecipes, setSales, setCustomers,
    setPreps, setCategories, setWaste, setInventoryLogs,
  } = useStore();

  const { t } = useTranslation();

  // --- Auth listener ---
  useEffect(() => {
    setLoadingStep(t('common.authorizing', 'Авторизація...'));
    let unsubProfile = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...currentUser, profile: docSnap.data() });
          } else {
            const profileData = currentUser.isAnonymous
              ? { role: 'user', subscriptionUntil: null, createdAt: new Date().toISOString() }
              : { email: currentUser.email, name: currentUser.displayName, role: 'user', subscriptionUntil: null, createdAt: new Date().toISOString() };
            setDoc(userRef, profileData).catch(e => console.error('Profile create error:', e));
            setUser({ ...currentUser, profile: { role: 'user', subscriptionUntil: null } });
          }
          setIsLoading(false);
        }, (e) => {
          console.error('Profile listen error:', e);
          setUser({ ...currentUser, profile: { role: 'user', subscriptionUntil: null } });
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => { if (unsubProfile) unsubProfile(); unsubscribe(); };
  }, []);

  // --- Data subscriptions (fires when uid changes) ---
  const uid = useStore(s => s.user?.uid);

  useEffect(() => {
    resetAllData();
    if (!uid) return;

    setIsLoading(true);
    setLoadingStep(t('common.syncing', 'Синхронізація баз...'));
    let loaded = 0;
    const checkLoaded = () => { loaded++; if (loaded >= 8) setIsLoading(false); };

    const setErr = (e) => console.error('Snapshot error:', e.message);
    const map = (s) => s.docs.map(d => ({ id: d.id, ...d.data() }));

    const u1 = onSnapshot(collection(db, 'bakery', uid, 'inventory'),      s => { setInventory(map(s));    checkLoaded(); }, setErr);
    const u2 = onSnapshot(collection(db, 'bakery', uid, 'recipes'),        s => { setRecipes(map(s));      checkLoaded(); }, setErr);
    const u3 = onSnapshot(collection(db, 'bakery', uid, 'sales'),          s => { setSales(map(s));        checkLoaded(); }, setErr);
    const u4 = onSnapshot(collection(db, 'bakery', uid, 'preps'),          s => { setPreps(map(s));        checkLoaded(); }, setErr);
    const u5 = onSnapshot(collection(db, 'bakery', uid, 'categories'),     s => { setCategories(map(s));   checkLoaded(); }, setErr);
    const u6 = onSnapshot(collection(db, 'bakery', uid, 'customers'),      s => { setCustomers(map(s));    checkLoaded(); }, setErr);
    const u7 = onSnapshot(collection(db, 'bakery', uid, 'waste'),          s => { setWaste(map(s));        checkLoaded(); }, setErr);
    const u8 = onSnapshot(collection(db, 'bakery', uid, 'inventory_logs'), s => { setInventoryLogs(map(s)); checkLoaded(); }, setErr);

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); };
  }, [uid]);
}
