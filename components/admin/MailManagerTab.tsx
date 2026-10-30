'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Inbox,
  Send,
  Settings,
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Clock,
  ChevronRight,
  Filter,
  User,
  Phone,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Trash2,
  MessageSquare,
  CornerDownRight,
  ArrowRight,
  SendHorizontal,
} from 'lucide-react';

interface InboxItem {
  id: string;
  source: 'CONTACT_FORM' | 'CUSTOM_ORDER';
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subject: string;
  message: string;
  eventDate?: string;
  extraDetails?: Record<string, any>;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  createdAt: string;
}

interface EmailLogItem {
  _id: string;
  referenceId: string;
  to: string;
  recipientName?: string;
  from: string;
  subject: string;
  type: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  provider: string;
  errorMessage?: string;
  htmlBody?: string;
  sentAt: string;
  metadata?: any;
}

interface MailConfig {
  provider: 'msg91' | 'brevo' | 'smtp';
  msg91AuthKey: string;
  hasAuthKey: boolean;
  msg91FromEmail: string;
  msg91FromName: string;
  msg91Domain: string;
  msg91TemplateId: string;
  brevoApiKey: string;
  hasBrevoApiKey: boolean;
  brevoFromEmail: string;
  brevoFromName: string;
  adminNotificationEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  hasSmtpPass: boolean;
  smtpSecure: boolean;
  replySignature: string;
}

export default function MailManagerTab() {
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'logs' | 'config' | 'templates'>('inbox');

  // Inbox State
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxStatusFilter, setInboxStatusFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [inboxSourceFilter, setInboxSourceFilter] = useState<'ALL' | 'CUSTOM_ORDER' | 'CONTACT_FORM'>('ALL');
  const [selectedInboxItem, setSelectedInboxItem] = useState<InboxItem | null>(null);

  // Reply Modal State
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyToast, setReplyToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sent Logs State
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState<'ALL' | 'SENT' | 'FAILED' | 'SIMULATED'>('ALL');
  const [logsTypeFilter, setLogsTypeFilter] = useState('ALL');
  const [selectedLogPreview, setSelectedLogPreview] = useState<EmailLogItem | null>(null);
  const [logStats, setLogStats] = useState({ totalAll: 0, sent: 0, simulated: 0, failed: 0 });

  // Config State
  const [config, setConfig] = useState<MailConfig>({
    provider: 'msg91',
    msg91AuthKey: '',
    hasAuthKey: false,
    msg91FromEmail: 'orders@theindianflowers.com',
    msg91FromName: 'The Indian Flowers',
    msg91Domain: 'theindianflowers.com',
    msg91TemplateId: '',
    brevoApiKey: '',
    hasBrevoApiKey: false,
    brevoFromEmail: 'orders@theindianflowers.com',
    brevoFromName: 'The Indian Flowers',
    adminNotificationEmail: 'indianflowersorder@gmail.com',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    hasSmtpPass: false,
    smtpSecure: false,
    replySignature: 'Warm regards,\nThe Indian Flowers Team\n(909) 379-3678 | theindianflowers.com',
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [showAuthKey, setShowAuthKey] = useState(false);
  const [showBrevoKey, setShowBrevoKey] = useState(false);
  const [configToast, setConfigToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Test Email State
  const [testEmailTarget, setTestEmailTarget] = useState('indianflowersorder@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; simulated?: boolean } | null>(null);

  // Load initial data
  useEffect(() => {
    fetchInbox();
    fetchLogs();
    fetchConfig();
  }, []);

  // Fetch Inbox Data
  const fetchInbox = async () => {
    try {
      setInboxLoading(true);
      const res = await fetch('/api/admin/mail/inbox');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setInboxItems(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setInboxLoading(false);
    }
  };

  // Fetch Sent Logs
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch('/api/admin/mail/logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
        if (data.stats) setLogStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch Config
  const fetchConfig = async () => {
    try {
      setConfigLoading(true);
      const res = await fetch('/api/admin/mail/config');
      const data = await res.json();
      if (data.success && data.data) {
        setConfig((prev) => ({ ...prev, ...data.data }));
        if (data.data.adminNotificationEmail) {
          setTestEmailTarget(data.data.adminNotificationEmail);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mail config:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  // Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingConfig(true);
      const res = await fetch('/api/admin/mail/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setConfigToast({ message: 'Mail settings saved successfully', type: 'success' });
        fetchConfig();
      } else {
        setConfigToast({ message: data.message || 'Failed to save settings', type: 'error' });
      }
    } catch (err: any) {
      setConfigToast({ message: err.message || 'Network error saving settings', type: 'error' });
    } finally {
      setIsSavingConfig(false);
      setTimeout(() => setConfigToast(null), 4000);
    }
  };

  // Dispatch Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailTarget) return;
    try {
      setIsSendingTest(true);
      setTestResult(null);
      const res = await fetch('/api/admin/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmailTarget }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Test email dispatched' : 'Test failed'),
        simulated: data.simulated,
      });
      fetchLogs(); // refresh logs
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test email',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Update Status of Inbox Item
  const handleUpdateStatus = async (item: InboxItem, newStatus: InboxItem['status']) => {
    try {
      const res = await fetch('/api/admin/mail/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, source: item.source, status: newStatus }),
      });
      if (res.ok) {
        setInboxItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
        );
        if (selectedInboxItem?.id === item.id) {
          setSelectedInboxItem((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Open Reply Modal
  const handleOpenReply = (item: InboxItem) => {
    setSelectedInboxItem(item);
    setReplySubject(`Regarding your inquiry [${item.referenceId}] - The Indian Flowers`);
    setReplyMessage(
      `Hello ${item.customerName},\n\nThank you for reaching out to The Indian Flowers regarding your request for ${item.eventDate ? `event date ${item.eventDate}` : 'fresh Indian flowers'}.\n\n`
    );
    setIsReplyModalOpen(true);
  };

  // Dispatch Reply Email
  const handleSendReply = async () => {
    if (!selectedInboxItem || !replyMessage.trim()) return;
    try {
      setIsSendingReply(true);
      const res = await fetch('/api/admin/mail/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInboxItem.id,
          source: selectedInboxItem.source,
          to: selectedInboxItem.customerEmail,
          recipientName: selectedInboxItem.customerName,
          subject: replySubject,
          messageBody: replyMessage,
          inquiryReference: selectedInboxItem.referenceId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyToast({ message: 'Reply sent successfully to customer!', type: 'success' });
        // Mark as resolved in local state
        setInboxItems((prev) =>
          prev.map((i) => (i.id === selectedInboxItem.id ? { ...i, status: 'RESOLVED' } : i))
        );
        setTimeout(() => {
          setIsReplyModalOpen(false);
          setReplyToast(null);
        }, 1500);
        fetchLogs();
      } else {
        setReplyToast({ message: data.message || 'Failed to dispatch reply', type: 'error' });
      }
    } catch (err: any) {
      setReplyToast({ message: err.message || 'Network error while replying', type: 'error' });
    } finally {
      setIsSendingReply(false);
    }
  };

  // Filtered Inbox Items
  const filteredInbox = useMemo(() => {
    return inboxItems.filter((item) => {
      if (inboxStatusFilter !== 'ALL' && item.status !== inboxStatusFilter) return false;
      if (inboxSourceFilter !== 'ALL' && item.source !== inboxSourceFilter) return false;
      if (inboxSearch) {
        const q = inboxSearch.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(q) ||
          item.customerEmail.toLowerCase().includes(q) ||
          item.customerPhone.toLowerCase().includes(q) ||
          item.referenceId.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inboxItems, inboxStatusFilter, inboxSourceFilter, inboxSearch]);

  // Filtered Sent Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (logsStatusFilter !== 'ALL' && log.status !== logsStatusFilter) return false;
      if (logsTypeFilter !== 'ALL' && log.type !== logsTypeFilter) return false;
      if (logsSearch) {
        const q = logsSearch.toLowerCase();
        return (
          log.to.toLowerCase().includes(q) ||
          (log.recipientName && log.recipientName.toLowerCase().includes(q)) ||
          log.subject.toLowerCase().includes(q) ||
          log.referenceId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, logsStatusFilter, logsTypeFilter, logsSearch]);

  const newInquiriesCount = useMemo(() => {
    return inboxItems.filter((i) => i.status === 'NEW').length;
  }, [inboxItems]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Quick Status Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B3B24] text-white flex items-center justify-center shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Mail &amp; Communications Center
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  MSG91 Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Centralized inbox for floral consultations &amp; contact forms, sent logs, and MSG91 email gateway controls.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchInbox();
              fetchLogs();
              fetchConfig();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('config')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B3B24] text-white text-xs font-bold hover:bg-[#134633] shadow-xs transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Mail Settings</span>
          </button>
        </div>
      </div>

      {/* 2. Top-level Subnavigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'inbox'
              ? 'bg-[#0B3B24] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Customer Inbox</span>
          {newInquiriesCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === 'inbox' ? 'bg-emerald-400 text-[#0B3B24]' : 'bg-rose-500 text-white'
              }`}
            >
              {newInquiriesCount} new
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-[#0B3B24] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Sent Mail Logs</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {logs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'config'
              ? 'bg-[#0B3B24] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Gateway &amp; Credentials</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'templates'
              ? 'bg-[#0B3B24] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Email Templates &amp; Previews</span>
        </button>
      </div>

      {/* 3. SUBTAB CONTENT: CUSTOMER INBOX */}
      {activeSubTab === 'inbox' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, email, reference ID, message..."
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B3B24] focus:bg-white transition-all font-normal"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setInboxStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      inboxStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'NEW' ? 'New' : st === 'IN_PROGRESS' ? 'In Progress' : 'Resolved'}
                  </button>
                ))}
              </div>

              <select
                value={inboxSourceFilter}
                onChange={(e) => setInboxSourceFilter(e.target.value as any)}
                aria-label="Filter inbox by message source"
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Sources</option>
                <option value="CUSTOM_ORDER">Custom Floral Inquiries</option>
                <option value="CONTACT_FORM">Contact Us Submissions</option>
              </select>
            </div>
          </div>

          {/* Inbox List Table */}
          {inboxLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Loading customer inquiries...</p>
            </div>
          ) : filteredInbox.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Messages Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {inboxSearch
                  ? `No inquiries match "${inboxSearch}". Clear the search to view all.`
                  : 'Customer inquiries submitted through your storefront will arrive here automatically.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Status &amp; ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Type &amp; Subject</th>
                      <th className="py-3 px-4">Event Date</th>
                      <th className="py-3 px-4">Received</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInbox.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          item.status === 'NEW' ? 'bg-emerald-50/20 font-medium' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.status === 'NEW'
                                  ? 'bg-rose-500 ring-4 ring-rose-100'
                                  : item.status === 'IN_PROGRESS'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <div>
                              <span className="font-mono text-[11px] font-bold text-slate-900 block">
                                {item.referenceId}
                              </span>
                              <span className="text-[10px] text-slate-400 capitalize">
                                {item.status.replace('_', ' ').toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-900">{item.customerName}</p>
                            <p className="text-[11px] text-slate-500">{item.customerEmail}</p>
                            <p className="text-[10.5px] text-slate-400 font-mono">{item.customerPhone}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                item.source === 'CUSTOM_ORDER'
                                  ? 'bg-[#F4F8F4] text-[#0B3B24] border border-[#0B3B24]/20'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {item.source === 'CUSTOM_ORDER' ? 'Custom Floral' : 'General Contact'}
                            </span>
                            <p className="font-semibold text-slate-800 truncate">{item.subject}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{item.message}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.eventDate ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              {item.eventDate}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedInboxItem(item)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                              title="View Details"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReply(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="Reply via Email"
                            >
                              <Send className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal: View Message Details */}
          {selectedInboxItem && !isReplyModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
                <div className="px-6 py-4 bg-[#0B3B24] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-emerald-300" />
                    <div>
                      <h3 className="font-bold text-sm">
                        {selectedInboxItem.source === 'CUSTOM_ORDER' ? 'Custom Floral Inquiry' : 'Contact Us Message'}
                      </h3>
                      <p className="text-[11px] text-emerald-200 font-mono">Reference: {selectedInboxItem.referenceId}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInboxItem(null)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                  {/* Customer Bar */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{selectedInboxItem.customerName}</p>
                      <a href={`mailto:${selectedInboxItem.customerEmail}`} className="text-emerald-700 font-medium hover:underline block">
                        {selectedInboxItem.customerEmail}
                      </a>
                      <a href={`tel:${selectedInboxItem.customerPhone}`} className="text-slate-600 font-mono hover:underline block">
                        {selectedInboxItem.customerPhone}
                      </a>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Received At</span>
                      <span className="text-slate-700 font-medium text-[11px]">
                        {new Date(selectedInboxItem.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Subject & Extra fields */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject / Occasion</span>
                    <p className="text-sm font-bold text-slate-800">{selectedInboxItem.subject}</p>
                  </div>

                  {selectedInboxItem.eventDate && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Target Event Date: </span>
                        <span>{selectedInboxItem.eventDate}</span>
                      </div>
                    </div>
                  )}

                  {selectedInboxItem.extraDetails && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedInboxItem.extraDetails.cityState && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase block font-bold">City &amp; State</span>
                          <span className="font-semibold text-slate-800">{selectedInboxItem.extraDetails.cityState}</span>
                        </div>
                      )}
                      {selectedInboxItem.extraDetails.budget && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase block font-bold">Estimated Budget</span>
                          <span className="font-semibold text-slate-800">{selectedInboxItem.extraDetails.budget}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Message / Specifications</span>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed text-xs">
                      {selectedInboxItem.message}
                    </div>
                  </div>

                  {/* Status Toggle & Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Mark status:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedInboxItem, 'IN_PROGRESS')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          selectedInboxItem.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedInboxItem, 'RESOLVED')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          selectedInboxItem.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Resolved
                      </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenReply(selectedInboxItem)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0B3B24] text-white hover:bg-[#134633] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply via Email</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Reply to Customer via Email */}
          {isReplyModalOpen && selectedInboxItem && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
                <div className="px-6 py-4 bg-[#0B3B24] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-emerald-300" />
                    <div>
                      <h3 className="font-bold text-sm">Send Email Reply via MSG91</h3>
                      <p className="text-[11px] text-emerald-200">
                        Replying to: {selectedInboxItem.customerName} ({selectedInboxItem.customerEmail})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReplyModalOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  {replyToast && (
                    <div
                      className={`p-3 rounded-xl border flex items-center gap-2 ${
                        replyToast.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {replyToast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span className="font-semibold">{replyToast.message}</span>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Subject</label>
                    <input
                      type="text"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Message Body</label>
                    <textarea
                      rows={8}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your response to the customer..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white leading-relaxed font-sans"
                    />
                  </div>

                  {/* Quick Snippets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Insert:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyMessage((prev) => prev + '\nWe have reviewed your floral specifications and confirm our garland artisans can prepare this bespoke design for your celebration.')
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700 font-semibold"
                    >
                      + Confirm Availability
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyMessage((prev) => prev + '\nCould you please let us know the exact delivery time needed on your event date so we can arrange Southwest Cargo or FedEx Overnight priority dispatch?')
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700 font-semibold"
                    >
                      + Request Delivery Time
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] space-y-0.5">
                    <p className="font-bold text-slate-700">Appended Email Signature:</p>
                    <p className="whitespace-pre-line text-slate-600">{config.replySignature}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsReplyModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSendingReply || !replyMessage.trim()}
                      onClick={handleSendReply}
                      className="px-5 py-2 rounded-xl bg-[#0B3B24] text-white font-bold hover:bg-[#134633] disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {isSendingReply ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending via MSG91...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SUBTAB CONTENT: SENT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Dispatched</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{logStats.totalAll || logs.length}</span>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Delivered / Sent</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">{logStats.sent}</span>
            </div>
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Simulated (Dev)</span>
              <span className="text-xl font-black text-amber-700 mt-1 block">{logStats.simulated}</span>
            </div>
            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Failed</span>
              <span className="text-xl font-black text-rose-700 mt-1 block">{logStats.failed}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipient email, subject, reference ID..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B3B24] focus:bg-white transition-all font-normal"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'SENT', 'SIMULATED', 'FAILED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLogsStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logsStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'SENT' ? 'Sent' : st === 'SIMULATED' ? 'Simulated' : 'Failed'}
                  </button>
                ))}
              </div>

              <select
                value={logsTypeFilter}
                onChange={(e) => setLogsTypeFilter(e.target.value)}
                aria-label="Filter email logs by type"
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="CUSTOM_ORDER_CONFIRMATION">Floral Confirmation</option>
                <option value="CUSTOM_ORDER_ADMIN_ALERT">Floral Admin Alert</option>
                <option value="CONTACT_CONFIRMATION">Contact Confirmation</option>
                <option value="CONTACT_ADMIN_ALERT">Contact Admin Alert</option>
                <option value="MANUAL_REPLY">Manual Customer Reply</option>
                <option value="TEST_EMAIL">Diagnostic Test Email</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          {logsLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Loading sent logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Sent Logs Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All transactional emails dispatched via MSG91 are logged here with delivery confirmation.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Status &amp; ID</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                log.status === 'SENT'
                                  ? 'bg-emerald-500'
                                  : log.status === 'SIMULATED'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <div>
                              <span
                                className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${
                                  log.status === 'SENT'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : log.status === 'SIMULATED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {log.status}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                                {log.referenceId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900">{log.recipientName || 'Customer'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{log.to}</p>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate">
                          <span className="font-medium text-slate-800">{log.subject}</span>
                          {log.errorMessage && (
                            <p className="text-[10px] text-rose-600 truncate mt-0.5">Err: {log.errorMessage}</p>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {log.type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            log.provider === 'BREVO'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : log.provider === 'MSG91'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {log.provider}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          {new Date(log.sentAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedLogPreview(log)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal: View Full Rendered Sent Email */}
          {selectedLogPreview && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150 flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 bg-[#0B3B24] text-white flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-bold text-sm">Dispatched Email Preview</h3>
                    <p className="text-[11px] text-emerald-200 font-mono">
                      To: {selectedLogPreview.to} &bull; Ref: {selectedLogPreview.referenceId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLogPreview(null)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-1 shrink-0">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Subject:</span>
                    <span className="font-semibold text-slate-900">{selectedLogPreview.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">From:</span>
                    <span className="font-mono text-slate-700">{selectedLogPreview.from}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Status:</span>
                    <span
                      className={`font-black uppercase ${
                        selectedLogPreview.status === 'SENT'
                          ? 'text-emerald-700'
                          : selectedLogPreview.status === 'SIMULATED'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {selectedLogPreview.status} ({selectedLogPreview.provider})
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-[#FAF6F0]">
                  {selectedLogPreview.htmlBody ? (
                    <div
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
                      dangerouslySetInnerHTML={{ __html: selectedLogPreview.htmlBody }}
                    />
                  ) : (
                    <div className="p-8 text-center text-slate-400">No HTML payload recorded</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SUBTAB CONTENT: GATEWAY & CREDENTIALS CONFIG */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">MSG91 Gateway Credentials</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure your MSG91 Email API v5 credentials for high-deliverability transactional emails.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>MSG91 API v5</span>
                </div>
              </div>

              {configToast && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                    configToast.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {configToast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{configToast.message}</span>
                </div>
              )}

              {/* Provider Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Primary Email Gateway</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, provider: 'brevo' })}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      config.provider === 'brevo'
                        ? 'border-[#0B3B24] bg-emerald-50/50 shadow-xs ring-1 ring-[#0B3B24]/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      B
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        Brevo
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">REST API</span>
                      </p>
                      <p className="text-[11px] text-slate-500">Sendinblue (300 free/day)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, provider: 'msg91' })}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      config.provider === 'msg91'
                        ? 'border-[#0B3B24] bg-emerald-50/50 shadow-xs ring-1 ring-[#0B3B24]/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#0B3B24] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      M
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">MSG91 Email API</p>
                      <p className="text-[11px] text-slate-500">v5 REST &amp; Templates</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, provider: 'smtp' })}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      config.provider === 'smtp'
                        ? 'border-[#0B3B24] bg-emerald-50/50 shadow-xs ring-1 ring-[#0B3B24]/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      S
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Custom SMTP</p>
                      <p className="text-[11px] text-slate-500">Self-hosted / Google</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Brevo Fields */}
              {config.provider === 'brevo' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Brevo API Key (v3)</label>
                      <button
                        type="button"
                        onClick={() => setShowBrevoKey(!showBrevoKey)}
                        className="text-[11px] text-[#0B3B24] font-semibold hover:underline cursor-pointer"
                      >
                        {showBrevoKey ? 'Hide key' : 'Show / edit key'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showBrevoKey ? 'text' : 'password'}
                        placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx"
                        value={config.brevoApiKey}
                        onChange={(e) => setConfig({ ...config, brevoApiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Found in your Brevo dashboard under <strong>Account &gt; SMTP &amp; API &gt; API Keys</strong> (Generate a new API key).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">From Sender Email</label>
                      <input
                        type="email"
                        value={config.brevoFromEmail}
                        onChange={(e) => setConfig({ ...config, brevoFromEmail: e.target.value })}
                        placeholder="orders@theindianflowers.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                        Must be a verified sender or authenticated domain in your Brevo account (under <strong>Senders &amp; IP</strong>).
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">From Sender Name</label>
                      <input
                        type="text"
                        value={config.brevoFromName}
                        onChange={(e) => setConfig({ ...config, brevoFromName: e.target.value })}
                        placeholder="The Indian Flowers"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                      <p className="text-[10.5px] text-slate-400 mt-1">
                        The display name appearing in the customer&apos;s email inbox.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* MSG91 Fields */}
              {config.provider === 'msg91' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">MSG91 Auth Key</label>
                      <button
                        type="button"
                        onClick={() => setShowAuthKey(!showAuthKey)}
                        className="text-[11px] text-[#0B3B24] font-semibold hover:underline cursor-pointer"
                      >
                        {showAuthKey ? 'Hide key' : 'Show / edit key'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showAuthKey ? 'text' : 'password'}
                        placeholder="Enter your MSG91 Auth Key (e.g. 382914Abcd...)"
                        value={config.msg91AuthKey}
                        onChange={(e) => setConfig({ ...config, msg91AuthKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Found in your MSG91 control panel under Developers &gt; AuthKey.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">From Email Address</label>
                      <input
                        type="email"
                        value={config.msg91FromEmail}
                        onChange={(e) => setConfig({ ...config, msg91FromEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                        Must use your verified MSG91 domain (e.g. <span className="font-mono text-emerald-800">orders@{config.msg91Domain || 'yourdomain.com'}</span>).
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">From Sender Name</label>
                      <input
                        type="text"
                        value={config.msg91FromName}
                        onChange={(e) => setConfig({ ...config, msg91FromName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                      <p className="text-[10.5px] text-slate-400 mt-1">The display name appearing in the customer&apos;s email inbox.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Sending Domain</label>
                      <input
                        type="text"
                        value={config.msg91Domain}
                        onChange={(e) => setConfig({ ...config, msg91Domain: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                        The exact domain registered &amp; verified in your MSG91 dashboard (under <strong>Email &gt; Domains</strong>).
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Template ID (Optional)</label>
                      <input
                        type="text"
                        value={config.msg91TemplateId}
                        onChange={(e) => setConfig({ ...config, msg91TemplateId: e.target.value })}
                        placeholder="Optional custom template ID"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                      <p className="text-[10.5px] text-slate-400 mt-1">Leave empty to use built-in HTML responsive templates.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SMTP Fields */}
              {config.provider === 'smtp' && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={config.smtpHost}
                        onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                        placeholder="smtp-relay.brevo.com or smtp.gmail.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Port</label>
                      <input
                        type="number"
                        value={config.smtpPort}
                        onChange={(e) => setConfig({ ...config, smtpPort: Number(e.target.value) || 587 })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">SMTP Username</label>
                      <input
                        type="text"
                        value={config.smtpUser}
                        onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">SMTP Password</label>
                      <input
                        type="password"
                        value={config.smtpPass}
                        onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                        placeholder={config.hasSmtpPass ? '••••••••' : 'Enter password'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Destination & Signature */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Admin Notification Alert Email</label>
                  <input
                    type="email"
                    value={config.adminNotificationEmail}
                    onChange={(e) => setConfig({ ...config, adminNotificationEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                  />
                  <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                    Your personal inbox (<span className="font-mono text-emerald-800">indianflowersorder@gmail.com</span>) where order alerts, inquiry notices, and customer replies arrive.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Default Customer Reply Signature</label>
                  <textarea
                    rows={3}
                    value={config.replySignature}
                    onChange={(e) => setConfig({ ...config, replySignature: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white font-sans leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-6 py-2.5 rounded-xl bg-[#0B3B24] text-white text-xs font-bold hover:bg-[#134633] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Configuration...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Mail Configuration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Diagnostic Test Panel */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">Email Gateway Diagnostics</h3>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                  config.provider === 'brevo'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : config.provider === 'msg91'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  Active: {config.provider === 'brevo' ? 'Brevo' : config.provider === 'msg91' ? 'MSG91' : 'SMTP'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Test your {config.provider === 'brevo' ? 'Brevo (Sendinblue)' : config.provider === 'msg91' ? 'MSG91' : 'SMTP'} connection in real time. Dispatches a diagnostic test email to verify credentials and sender domain delivery.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Destination Email</label>
                  <input
                    type="email"
                    value={testEmailTarget}
                    onChange={(e) => setTestEmailTarget(e.target.value)}
                    placeholder="Enter test recipient email"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B3B24] focus:bg-white"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSendingTest || !testEmailTarget}
                  onClick={handleSendTestEmail}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Test...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Diagnostic Test Email</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 animate-in fade-in ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                      <span>{testResult.success ? 'Dispatch Succeeded!' : 'Dispatch Failed'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                    {testResult.simulated && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-1">
                        Notice: Simulated mode active because MSG91_AUTH_KEY is not configured.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block">Status Monitor</span>
              <h4 className="font-bold text-sm text-white">The Indian Flowers Email Engine</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                All customer notifications are sent with UTF-8 encoding, responsive email HTML, and automatic tracking reference numbers.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Alert Inbox:</span>
                <span className="font-mono text-emerald-300 text-[11px]">{config.adminNotificationEmail}</span>
              </div>
            </div>

            {/* MSG91 Step-by-Step Setup Guide */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-xs text-slate-900">How to get MSG91 Credentials in 3 Steps</h4>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-0.5">1. Get your Auth Key</span>
                  <p className="text-[11px] text-slate-500">
                    Log in to <a href="https://control.msg91.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold underline">control.msg91.com</a>. Navigate to <strong>Developers &gt; Authkey</strong>. Copy your AuthKey and paste it into the field above.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-0.5">2. Register Your Domain in MSG91</span>
                  <p className="text-[11px] text-slate-500">
                    In MSG91, go to <strong>Campaign / Email &gt; Domains &gt; Add Domain</strong> (e.g. <span className="font-mono text-slate-700">indian-flowers.com</span> or <span className="font-mono text-slate-700">theindianflowers.com</span>). MSG91 will show 3 DNS records (DKIM, SPF, CNAME). Add them in your DNS provider (Cloudflare / GoDaddy / Namecheap) until MSG91 marks it <strong>Active</strong>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-0.5">3. Sender Address &amp; Customer Replies</span>
                  <p className="text-[11px] text-slate-500">
                    Set <strong>From Email</strong> to <span className="font-mono text-slate-700">orders@your-registered-domain</span>. MSG91 forbids public webmail (@gmail.com) as the sender. We automatically route all customer replies to your Gmail (<span className="font-mono text-slate-700">indianflowersorder@gmail.com</span>) via Reply-To!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUBTAB CONTENT: TEMPLATES & PREVIEWS */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
            <h3 className="text-base font-extrabold text-slate-900">Automated Email Templates</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review the branded email templates automatically dispatched to customers and admins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template 1: Floral Inquiry Confirmation */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-emerald-950">1. Customer Floral Confirmation</h4>
                  <p className="text-[10.5px] text-emerald-700">Triggered upon custom wedding/temple request submission</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                  Automated
                </span>
              </div>
              <div className="p-5 flex-1 bg-[#FAF6F0] space-y-3 text-xs text-slate-700">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="p-2.5 bg-[#0B3B24] text-white text-center rounded-xl font-bold text-xs">
                    The Indian Flowers
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                    Inquiry Reference: INQ-17924-XXXX
                  </span>
                  <p className="font-semibold text-slate-900">Dear Customer Name,</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Thank you for submitting your custom floral inquiry. Our master garland artisan has received your requirements and is reviewing availability.
                  </p>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                    <div className="flex justify-between"><span>Occasion:</span><span className="font-bold">Wedding / Jai Mala</span></div>
                    <div className="flex justify-between"><span>Delivery Date:</span><span className="font-bold">Oct 28, 2026</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template 2: General Contact Confirmation */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="p-4 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-indigo-950">2. Customer Contact Acknowledgment</h4>
                  <p className="text-[10.5px] text-indigo-700">Triggered upon Contact Us form submission (/contact)</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-indigo-800 border border-indigo-200">
                  Automated
                </span>
              </div>
              <div className="p-5 flex-1 bg-[#FAF6F0] space-y-3 text-xs text-slate-700">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="p-2.5 bg-[#0B3B24] text-white text-center rounded-xl font-bold text-xs">
                    The Indian Flowers
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800">
                    Reference: CNT-17924-XXXX
                  </span>
                  <p className="font-semibold text-slate-900">Hi Customer Name,</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    We received your message regarding &quot;Delivery schedule for Jasmine Strings&quot;. A member of our support team will respond within 24 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Template 3: Admin Immediate Alert */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="p-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-amber-950">3. Admin Immediate Lead Alert</h4>
                  <p className="text-[10.5px] text-amber-700">Dispatched directly to {config.adminNotificationEmail}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-amber-800 border border-amber-200">
                  Admin Alert
                </span>
              </div>
              <div className="p-5 flex-1 bg-slate-900 text-white space-y-2 text-xs">
                <p className="font-mono text-emerald-400 text-[11px] font-bold">[NEW INQUIRY INQ-XXXX] Wedding - Priya S.</p>
                <div className="p-3 bg-slate-800 rounded-xl space-y-1 text-[11px] text-slate-300">
                  <p><strong>Customer:</strong> Priya Sharma (priya@example.com)</p>
                  <p><strong>Phone:</strong> (909) 555-0192</p>
                  <p><strong>Location:</strong> Dallas, TX</p>
                  <p><strong>Requirements:</strong> 2 Jai malas with red rose and jasmine</p>
                </div>
              </div>
            </div>

            {/* Template 4: Manual Consultation Reply */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="p-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-rose-950">4. Direct Customer Consultation Reply</h4>
                  <p className="text-[10.5px] text-rose-700">Sent when you click &quot;Reply&quot; in Customer Inbox</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-rose-800 border border-rose-200">
                  Manual Response
                </span>
              </div>
              <div className="p-5 flex-1 bg-[#FAF6F0] space-y-3 text-xs text-slate-700">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="p-2.5 bg-[#0B3B24] text-white text-center rounded-xl font-bold text-xs">
                    The Indian Flowers
                  </div>
                  <p className="font-semibold text-slate-900">Dear Customer Name,</p>
                  <div className="p-3 bg-slate-50 border-l-4 border-[#0B3B24] rounded text-[11px] text-slate-700">
                    Your personalized message drafted in the admin dashboard appears here...
                  </div>
                  <p className="text-[10.5px] text-slate-500 whitespace-pre-line border-t border-slate-100 pt-2">
                    {config.replySignature}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
