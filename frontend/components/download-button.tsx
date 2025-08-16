'use client';

import { useState } from 'react';
import { Download, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadButtonProps {
  downloadLink: string;
  productName: string;
  productKind: 'KEYS' | 'SOURCE_CODE' | 'ACCESS_LINK' | 'DIGITAL_ACCOUNT';
  itemValue?: string;
  theme?: 'dark' | 'light';
}

export default function DownloadButton({
  downloadLink,
  productName,
  productKind,
  itemValue,
  theme = 'dark',
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  // For non-file products, just display the value
  if (productKind !== 'SOURCE_CODE' && itemValue) {
    return (
      <div className={`p-3 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-card/50 border-border/50' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium mb-1">
              {productKind === 'KEYS' && 'License Key'}
              {productKind === 'ACCESS_LINK' && 'Access Link'}
              {productKind === 'DIGITAL_ACCOUNT' && 'Account Credentials'}
            </p>
            <code className={`text-xs font-mono ${
              theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'
            }`}>
              {itemValue}
            </code>
          </div>
        </div>
      </div>
    );
  }

  // For source code files, show download button
  const checkDownloadInfo = async () => {
    if (!downloadLink) return;
    
    setChecking(true);
    try {
      // Extract token and data from URL
      const url = new URL(downloadLink);
      const token = url.pathname.split('/').pop();
      const data = url.searchParams.get('data');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/download/info/${token}?data=${data}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const info = await response.json();
        setDownloadInfo(info);
      }
    } catch (error) {
      console.error('Error checking download info:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadLink) {
      toast.error('Download link not available');
      return;
    }

    setDownloading(true);
    try {
      // Open download link in new tab
      window.open(downloadLink, '_blank');
      toast.success('Download started');
      
      // Refresh download info after a delay
      setTimeout(() => {
        checkDownloadInfo();
      }, 2000);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start download');
    } finally {
      setDownloading(false);
    }
  };

  // Check download info on mount
  useState(() => {
    if (productKind === 'SOURCE_CODE' && downloadLink) {
      checkDownloadInfo();
    }
  }, []);

  if (productKind !== 'SOURCE_CODE') {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border ${
      theme === 'dark' 
        ? 'bg-card/50 border-neon-blue/20' 
        : 'bg-gray-50 border-blue-200'
    }`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className={`h-4 w-4 ${
              theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'
            }`} />
            <h4 className="text-sm font-semibold">Download {productName}</h4>
          </div>
          {checking && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>

        {downloadInfo && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">File Size:</span>
              <span className="font-medium">
                {(downloadInfo.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Downloads Remaining:</span>
              <span className={`font-medium ${
                downloadInfo.downloadsRemaining <= 1 
                  ? 'text-red-500' 
                  : 'text-green-500'
              }`}>
                {downloadInfo.downloadsRemaining} / 5
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(downloadInfo.expiresAt).toLocaleDateString()}
                </span>
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={downloading || (downloadInfo && downloadInfo.downloadsRemaining === 0)}
          className={`w-full px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
            theme === 'dark'
              ? 'bg-neon-blue text-black hover:bg-neon-blue/90 disabled:bg-gray-700 disabled:text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500'
          } ${downloading ? 'cursor-wait' : ''}`}
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Starting Download...</span>
            </>
          ) : downloadInfo?.downloadsRemaining === 0 ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Download Limit Reached</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download File</span>
            </>
          )}
        </button>

        {downloadInfo?.downloadsRemaining === 0 && (
          <div className={`p-2 rounded border ${
            theme === 'dark' 
              ? 'bg-red-500/10 border-red-500/20' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-xs text-red-600 dark:text-red-400">
              You have reached the maximum download limit for this file. 
              Please contact support if you need additional downloads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
