'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, FileText, Mail, Phone } from 'lucide-react';

interface SellerApproval {
  approvalId: string;
  sellerId: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
  };
  companyName: string;
  businessType: string;
  logo: string | null;
  documents: Array<{
    id: string;
    documentType: string;
    documentNumber: string;
    documentUrl: string;
    expiryDate: string | null;
  }>;
  submittedAt: string;
}

export default function SellerApprovalDashboard() {
  const [approvals, setApprovals] = useState<SellerApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<SellerApproval | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending approvals
  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          '/api/admin/seller-approvals/pending',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setApprovals(data.data.approvals);
        } else {
          toast.error('Failed to fetch approvals');
        }
      } catch (error) {
        console.error('Error fetching approvals:', error);
        toast.error('Error fetching approvals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovals();
  }, []);

  const handleApprove = async (approvalId: string) => {
    if (!window.confirm('Are you sure you want to approve this seller?')) {
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/seller-approvals/${approvalId}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Seller ${selectedApproval?.companyName} approved!`);
        setApprovals(
          approvals.filter((a) => a.approvalId !== approvalId)
        );
        setSelectedApproval(null);
      } else {
        toast.error(data.message || 'Failed to approve seller');
      }
    } catch (error) {
      console.error('Error approving seller:', error);
      toast.error('Error approving seller');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this seller?')) {
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/seller-approvals/${approvalId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Seller ${selectedApproval?.companyName} rejected`);
        setApprovals(
          approvals.filter((a) => a.approvalId !== approvalId)
        );
        setSelectedApproval(null);
        setRejectionReason('');
      } else {
        toast.error(data.message || 'Failed to reject seller');
      }
    } catch (error) {
      console.error('Error rejecting seller:', error);
      toast.error('Error rejecting seller');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Seller Approvals
          </h1>
          <p className="text-gray-600">
            Review and approve pending seller applications
          </p>
        </div>

        {approvals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">
              No pending seller applications at the moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List of Approvals */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-indigo-600 text-white p-4">
                  <h2 className="font-semibold">
                    Pending Approvals ({approvals.length})
                  </h2>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {approvals.map((approval) => (
                    <button
                      key={approval.approvalId}
                      onClick={() => setSelectedApproval(approval)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedApproval?.approvalId === approval.approvalId
                          ? 'bg-indigo-50 border-l-4 border-indigo-600'
                          : ''
                      }`}
                    >
                      <div className="font-semibold text-gray-900 mb-1">
                        {approval.companyName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {approval.user.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(approval.submittedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Detail View */}
            {selectedApproval && (
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                    <h2 className="text-2xl font-bold mb-2">
                      {selectedApproval.companyName}
                    </h2>
                    <p className="text-indigo-100">
                      {selectedApproval.businessType}
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Seller Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Seller Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail size={18} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-gray-900">
                              {selectedApproval.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone size={18} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-gray-900">
                              {selectedApproval.user.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Logo */}
                    {selectedApproval.logo && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Company Logo
                        </h3>
                        <img
                          src={selectedApproval.logo}
                          alt={selectedApproval.companyName}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Documents */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Uploaded Documents
                      </h3>
                      <div className="space-y-3">
                        {selectedApproval.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <FileText
                                  size={20}
                                  className="text-indigo-600"
                                />
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {doc.documentType}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {doc.documentNumber}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                              >
                                View
                              </a>
                            </div>
                            {doc.expiryDate && (
                              <p className="text-xs text-gray-500">
                                Expires:{' '}
                                {new Date(doc.expiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rejection Reason (if rejecting) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a detailed reason if you're rejecting this application..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          handleApprove(selectedApproval.approvalId)
                        }
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle size={20} />
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleReject(selectedApproval.approvalId)
                        }
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        <XCircle size={20} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
