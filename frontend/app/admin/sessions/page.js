'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createSession, getAllSessions } from '../../../lib/api';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', tableNumber: '' });
  const [selectedSession, setSelectedSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      const result = await getAllSessions();
      if (result.success) {
        setSessions(result.sessions);
      } else {
        setError('Failed to load sessions');
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to connect to server. Please check if backend is running.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createSession(formData.name, formData.tableNumber);
      if (result.success) {
        setSessions(prev => [result.session, ...prev]);
        setFormData({ name: '', tableNumber: '' });
        setShowCreateForm(false);
        setSelectedSession(result.session);
        // Reload sessions to ensure consistency
        loadSessions();
      } else {
        setError(result.error || 'Failed to create session');
        alert(result.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create session. Please check if backend is running.';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintQR = (session) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${session.name}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: Arial, sans-serif;
            }
            h1 { margin-bottom: 20px; }
            svg { border: 2px solid #000; padding: 20px; }
          </style>
        </head>
        <body>
          <h1>${session.name}</h1>
          <div>${document.getElementById(`qr-${session.sessionId}`).innerHTML}</div>
          <p style="margin-top: 20px;">Scan to place an order</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Manage Sessions</h1>
            <div className="space-x-3">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {showCreateForm ? 'Cancel' : 'Create Session'}
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
            <form onSubmit={handleCreateSession}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Table 5, Counter 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </form>
          </div>
        )}

        {/* QR Code Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">{selectedSession.name}</h2>
              <div className="flex justify-center mb-4" id={`qr-${selectedSession.sessionId}`}>
                <QRCodeSVG value={selectedSession.customerUrl} size={256} />
              </div>
              <p className="text-sm text-gray-600 mb-4 text-center break-all">
                {selectedSession.customerUrl}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handlePrintQR(selectedSession)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Print QR Code
                </button>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">All Sessions ({sessions.length})</h2>
          </div>
          {initialLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={loadSessions}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Retry
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No sessions created yet. Create your first session to get started.
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session) => (
                <div key={session.sessionId} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                      {session.tableNumber && (
                        <p className="text-sm text-gray-500">Table: {session.tableNumber}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(session.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600 mt-2 break-all">
                        {session.customerUrl}
                      </p>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                      >
                        Show QR
                      </button>
                      <button
                        onClick={() => window.open(session.customerUrl, '_blank')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        Open Link
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

