
import React, { useState } from 'react';
import { authService } from '../services/supabase';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error } = isLogin 
        ? await authService.signIn(email, password)
        : await authService.signUp(email, password);

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border">
      <div className="flex border-b">
        <button
          className={`flex-1 py-4 font-medium text-sm transition-colors ${isLogin ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500'}`}
          onClick={() => setIsLogin(true)}
        >
          <div className="flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Log In
          </div>
        </button>
        <button
          className={`flex-1 py-4 font-medium text-sm transition-colors ${!isLogin ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500'}`}
          onClick={() => setIsLogin(false)}
        >
           <div className="flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" /> Sign Up
          </div>
        </button>
      </div>
      
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
          Secure authentication via Supabase
        </div>
      </div>
    </div>
  );
};

export default Auth;
