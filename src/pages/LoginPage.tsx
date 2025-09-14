import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');

  const renderForm = () => {
    switch (mode) {
      case 'register':
        return <RegisterForm onLogin={() => setMode('login')} />;
      case 'forgot':
        return <ForgotPasswordForm onLogin={() => setMode('login')} />;
      default:
        return (
          <LoginForm 
            onForgotPassword={() => setMode('forgot')} 
            onRegister={() => setMode('register')}
          />
        );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'register':
        return t('auth.register');
      case 'forgot':
        return t('auth.resetPassword');
      default:
        return t('auth.login');
    }
  };

  return (
    <Layout showNavigation={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 my-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">MHV</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {getTitle()}
              </h1>
              <p className="text-gray-600 text-sm">
              <span dir="rtl" style={{ display: 'block' }}>
                نظام تصاريح المواد والمركبات الثقيلة
                </span>
                <span dir="ltr" style={{ display: 'block' }}>
                  Materials and Heavy Vehicles Permit System
                  </span>
              </p>
            </div>
            
            {renderForm()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;