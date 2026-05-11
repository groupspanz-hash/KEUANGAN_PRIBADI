import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { useStore } from './store';
import { Toaster } from 'react-hot-toast';
import { handleFirestoreError, OperationType } from './firebase/utils';

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
    // Initial connection test
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_health_check_', 'ping'));
      } catch (error: any) {
        if (error.message?.includes('offline')) {
          console.warn("Firestore appears offline. Check console for database configuration instructions.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUser(userDoc.data() as any);
          } else {
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, userData);
            setUser({ ...userData, createdAt: new Date() } as any);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        if (firebaseUser) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } finally {
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
