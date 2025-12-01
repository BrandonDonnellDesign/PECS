'use client';

import { useState, useEffect } from 'react';
import { authService } from '../services/supabase';
import { X } from 'lucide-react';

export default function UserDebug() {
  const [info, setInfo] = useState<any>(null);
  const [show, setShow] = useState(false);

  const checkUser = async () => {
    const user = await authService.getUser();
    const profile = user ? await authService.getProfile(user.id) : null;
    
    setInfo({
      user: user ? {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      } : null,
      profile: profile,
      hasProfile: !!profile
    });
  };

  useEffect(() => {
    checkUser();
  }, []);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 left-4 px-3 py-2 bg-purple-500 text-white rounded-lg text-xs shadow-lg hover:bg-purple-600"
      >
        Debug User
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-md border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">User Debug Info</h3>
        <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <button 
        onClick={checkUser}
        className="mb-3 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
      >
        Refresh
      </button>

      {info && (
        <div className="space-y-2 text-xs">
          <div>
            <strong>User ID:</strong>
            <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 font-mono text-[10px] break-all">
              {info.user?.id || 'Not logged in'}
            </div>
          </div>

          <div>
            <strong>Email:</strong>
            <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1">
              {info.user?.email || 'N/A'}
            </div>
          </div>

          <div>
            <strong>Has Profile:</strong>
            <div className={`p-2 rounded mt-1 ${info.hasProfile ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {info.hasProfile ? '✅ Yes' : '❌ No - Run SQL to create profile'}
            </div>
          </div>

          {info.profile && (
            <div>
              <strong>Profile Display Name:</strong>
              <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1">
                {info.profile.displayName || 'Not set'}
              </div>
            </div>
          )}

          {!info.hasProfile && info.user && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Action Required:</p>
              <p className="mb-2 text-yellow-700 dark:text-yellow-300">Run this SQL in Supabase:</p>
              <pre className="bg-gray-900 text-green-400 p-2 rounded text-[10px] overflow-x-auto">
{`INSERT INTO public.profiles (id, email, display_name)
VALUES (
  '${info.user.id}',
  '${info.user.email}',
  '${info.user.email?.split('@')[0]}'
)
ON CONFLICT (id) DO NOTHING;`}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
