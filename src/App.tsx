import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { auth, db } from './firebase/config';
import { useStore } from './store';
import { Toaster } from 'react-hot-toast';
import { handleDatabaseError, OperationType } from './firebase/utils';

// Pages (will create these)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetPage from './pages/BudgetPage';
import GoalsPage from './pages/GoalsPage';
import DebtsPage from './pages/DebtsPage';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useStore();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { setUser, setLoading } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Set basic user info first so the app isn't stuck if Firestore is slow/offline
          const basicUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            createdAt: new Date(),
          };
          
          setUser(basicUser as any);
          setLoading(false); // Enable navigation as soon as we have basic info

          // Fetch or create user doc in background - DO NOT AWAIT
          const syncUser = async () => {
            try {
              const userDocRef = ref(db, `users/${firebaseUser.uid}`);
              const userSnapshot = await get(userDocRef);
              
              if (userSnapshot.exists()) {
                setUser(userSnapshot.val() as any);
              } else {
                const userData = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || '',
                  photoURL: firebaseUser.photoURL || '',
                  createdAt: serverTimestamp(),
                };
                await set(userDocRef, userData);
                setUser({ ...userData, createdAt: Date.now() } as any);
              }
            } catch (error: any) {
              console.warn("Database background sync failed (Offline):", error.message);
            }
          };
          syncUser();
        } else {
          useStore.getState().clearData();
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth sync error:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
        <Route path="/debts" element={<ProtectedRoute><DebtsPage /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
