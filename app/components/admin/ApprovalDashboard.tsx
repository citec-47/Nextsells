'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SellerApprovalRequest {
  id: string;
  seller: {
    id: string;
    companyName: string;
    businessAddress: string;
    city: string;
    state: string;
    status: string;
  };
  documents: Array<{
    id: string;
    documentType: string;
    documentUrl: string;
    status: string;
  }>;
  status: string;
  createdAt: string;
}

export default function AdminApprovalDashboard() {
  const [requests, setRequests] = useState<SellerApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SellerApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  const fetchApprovalRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/sellers/pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      } else {
        toast.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/sellers/${requestId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Seller approved successfully');
        setSelectedRequest(null);
        fetchApprovalRequests();
      } else {
        toast.error(data.error || 'Approval failed');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('An error occurred');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/sellers/${requestId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Seller rejected');
        setSelectedRequest(null);
        setRejectionReason('');
        fetchApprovalRequests();
      } else {
        toast.error(data.error || 'Rejection failed');
      }
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Seller Approval Requests</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-2">
            {requests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-600">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-md ${
                      selectedRequest?.id === request.id ? 'ring-2 ring-indigo-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.seller.companyName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {request.seller.city}, {request.seller.state}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        request.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>Address: {request.seller.businessAddress}</p>
                      <p>Documents: {request.documents.length}</p>
                      <p className="mt-2 text-gray-500">
                        Submitted: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details & Actions */}
          {selectedRequest && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedRequest.seller.companyName}
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Address</label>
                  <p className="text-gray-600">{selectedRequest.seller.businessAddress}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">City, State</label>
                  <p className="text-gray-600">
                    {selectedRequest.seller.city}, {selectedRequest.seller.state}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Documents
                  </label>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-indigo-600 hover:text-indigo-700 text-sm underline"
                      >
                        {doc.documentType}
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                            doc.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why you're rejecting this application..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
