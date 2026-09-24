import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup, signInAnonymously } from 'firebase/auth';
import Logo from './ui/Logo';

const isNative = Capacitor.isNativePlatform();

export default function PinScreen({ onUnlock }) {
  const { t } = useTranslation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Only initialize the Capacitor Google Auth plugin on native platforms
    if (isNative) {
      import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
        GoogleAuth.initialize({
          clientId: '236979354452-dlt4329gv7vmtba8f6jvvubd1f4ud41m.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      });
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const auth = getAuth();
      if (isNative) {
        // Native Android/iOS — use Capacitor plugin
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        await signInWithCredential(auth, credential);
      } else {
        // Web browser — use Firebase popup (no origin registration needed for Firebase Auth)
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      const errorMsg = error?.message || error?.error || JSON.stringify(error) || String(error);
      alert('Помилка авторизації: ' + errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000000] flex justify-center sm:items-center sm:py-8 z-[100] overflow-hidden font-sans selection:bg-transparent">
      <style>{`
        * { -webkit-tap-highlight-color: transparent !important; }
      `}</style>
      <div className="w-full max-w-[420px] bg-[#151212] h-full sm:h-[850px] sm:rounded-[48px] sm:border-[8px] border-[#2A2323] flex flex-col items-center justify-center relative shadow-2xl overflow-hidden p-6">
        
        <div className="mb-12 flex flex-col items-center">
          <Logo size={48} className="mb-6" />
          <p className="text-[#8C7A7A] text-sm font-medium text-center max-w-[250px]">
            {t('auth.description', 'Увійдіть за допомогою Google, щоб синхронізувати ваші рецепти та продажі')}
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-[280px]">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-[#F4EFEA] text-[#151212] font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoggingIn ? 'Завантаження...' : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                {t('auth.loginWithGoogle', 'Увійти через Google')}
              </>
            )}
          </button>

          <button 
            onClick={async () => {
              setIsLoggingIn(true);
              try {
                await signInAnonymously(getAuth());
              } catch (e) {
                alert('Помилка входу: ' + e.message);
                setIsLoggingIn(false);
              }
            }}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-transparent border-2 border-[#2A2323] text-[#8C7A7A] font-bold py-3.5 rounded-2xl active:scale-95 transition-all disabled:opacity-50"
          >
            {t('auth.continueAsGuest', 'Продовжити без авторизації')}
          </button>
        </div>
      </div>
    </div>
  );
}
