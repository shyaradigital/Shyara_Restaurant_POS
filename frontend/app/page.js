'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getAllSessions } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const result = await getAllSessions();
      if (result.success && result.sessions.length > 0) {
        setSessions(result.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">QR Order System</h1>
          <p className="text-gray-600 mb-8 text-center">Real-time order management</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => router.push('/admin')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              Admin Dashboard
            </button>
            
            <button
              onClick={() => router.push('/admin/sessions')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              Manage Sessions
            </button>
          </div>

          {/* Customer Access Section */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Customer Order Page</h2>
            <p className="text-gray-600 mb-4 text-center">Access customer ordering interface</p>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <p className="text-gray-500 mt-2">Loading sessions...</p>
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center mb-4">Select a session to view customer page:</p>
                {sessions.map((session) => (
                  <div key={session.sessionId} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{session.name}</h3>
                        {session.tableNumber && (
                          <p className="text-sm text-gray-500">Table: {session.tableNumber}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {session.customerUrl?.substring(0, 50)}...
                        </p>
                      </div>
                      <button
                        onClick={() => window.open(`/customer/${session.sessionId}`, '_blank')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-semibold"
                      >
                        Open Customer Page
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No sessions created yet.</p>
                <button
                  onClick={() => router.push('/admin/sessions')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create Your First Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How to Use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Go to <strong>Manage Sessions</strong> and create a new session</li>
            <li>Click <strong>Show QR</strong> to see the QR code for customers</li>
            <li>Customers scan the QR code or use the customer page link</li>
            <li>Watch orders appear in real-time on the <strong>Admin Dashboard</strong></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

