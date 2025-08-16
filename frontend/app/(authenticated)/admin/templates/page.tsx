'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Mail, Eye, Code, Copy, Check, FileText, User, Link } from 'lucide-react';
import { templatesApi } from '@/lib/api';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  variables: string[];
}

interface TemplatePreview {
  type: string;
  subject: string;
  html: string;
  preview: string;
  variables: Record<string, string>;
}

export default function AdminTemplatesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('verification');
  const [previewData, setPreviewData] = useState<TemplatePreview | null>(null);
  const [customData, setCustomData] = useState({
    fullName: 'John Doe',
    url: 'https://example.com/token/sample-token-123456'
  });
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Load preview when template changes
  useEffect(() => {
    if (selectedTemplate) {
      loadPreview();
    }
  }, [selectedTemplate, customData]);

  const fetchTemplates = async () => {
    try {
      const response = await templatesApi.getEmailTemplates();
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const loadPreview = async () => {
    setLoading(true);
    try {
      const preview = await templatesApi.previewEmailTemplate(
        selectedTemplate as 'verification' | 'reset-password',
        customData
      );
      setPreviewData(preview);
    } catch (error) {
      console.error('Failed to load preview:', error);
      toast.error('Failed to load template preview');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderPreview = () => {
    if (!previewData) return null;

    if (showCode) {
      return (
        <div className="relative">
          <button
            onClick={() => copyToClipboard(previewData.html)}
            className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <pre className={`p-4 rounded-lg overflow-x-auto text-sm ${
            theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'
          }`}>
            <code>{previewData.html}</code>
          </pre>
        </div>
      );
    }

    return (
      <div className={`rounded-lg border ${
        theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
      }`}>
        <iframe
          srcDoc={previewData.html}
          className="w-full h-[600px] rounded-lg"
          title="Email Template Preview"
        />
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Email Templates
        </h1>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          Preview and customize email templates for system notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selector */}
        <div className="lg:col-span-1">
          <div className={`rounded-lg border p-6 ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <FileText className="w-5 h-5" />
              Available Templates
            </h2>

            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTemplate === template.id
                      ? theme === 'dark'
                        ? 'bg-purple-900/20 border-purple-500'
                        : 'bg-purple-50 border-purple-500'
                      : theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Mail className={`w-5 h-5 mt-0.5 ${
                      selectedTemplate === template.id
                        ? 'text-purple-500'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {template.name}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className={`text-xs px-2 py-1 rounded ${
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Data Input */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <User className="w-4 h-4" />
                Preview Variables
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm mb-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={customData.fullName}
                    onChange={(e) => setCustomData({ ...customData, fullName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Link className="w-3 h-3 inline mr-1" />
                    Sample URL
                  </label>
                  <input
                    type="text"
                    value={customData.url}
                    onChange={(e) => setCustomData({ ...customData, url: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <div className={`rounded-lg border p-6 ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Preview Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <Eye className="w-5 h-5" />
                  Template Preview
                </h2>
                {previewData && (
                  <p className={`text-sm mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Subject: <span className="font-medium">{previewData.subject}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCode(false)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    !showCode
                      ? 'bg-purple-600 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Preview
                </button>
                <button
                  onClick={() => setShowCode(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    showCode
                      ? 'bg-purple-600 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-1" />
                  HTML Code
                </button>
              </div>
            </div>

            {/* Preview Content */}
            {loading ? (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Loading preview...
                  </p>
                </div>
              </div>
            ) : (
              renderPreview()
            )}
          </div>

          {/* Template Info */}
          {previewData && (
            <div className={`mt-4 rounded-lg border p-4 ${
              theme === 'dark' 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Template Variables Used
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(previewData.variables).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`text-sm font-mono px-2 py-1 rounded ${
                      theme === 'dark'
                        ? 'bg-gray-800 text-purple-400'
                        : 'bg-gray-100 text-purple-600'
                    }`}>
                      {key}
                    </span>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      →
                    </span>
                    <span className={`text-sm truncate ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
