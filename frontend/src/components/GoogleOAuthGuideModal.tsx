import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, ShieldAlert, KeyRound } from 'lucide-react';

interface GoogleOAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleOAuthGuideModal: React.FC<GoogleOAuthGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const envSnippet = `# Google OAuth 2.0 Configuration for MastiCare AI
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
`;

  const copySnippet = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF9F3] text-[#183629] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#244D38]/15 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-oauth-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#244D38]/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 id="google-oauth-title" className="font-serif text-xl font-bold text-[#183629]">
                Google Sign-In Configuration Guide
              </h3>
              <p className="text-xs text-stone-600">
                Setup real Google OAuth with your Google Cloud Console project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-amber-900 text-xs">
              <span className="font-semibold">Credentials Required:</span> Google OAuth requires a valid Google Client ID from Google Cloud Console. Follow the 4 quick steps below to enable it.
            </div>
          </div>

          <ol className="list-decimal pl-5 space-y-2.5">
            <li>
              <strong>Open Google Cloud Console:</strong> Navigate to{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[#244D38] underline font-semibold inline-flex items-center gap-1 hover:text-[#183629]"
              >
                APIs &amp; Services &gt; Credentials <ExternalLink className="w-3.5 h-3.5" />
              </a>
              .
            </li>
            <li>
              <strong>Configure OAuth Consent Screen:</strong> Set User Type to <em>External</em>, enter App Name (e.g. <em>MastiCare AI</em>), and add authorized scopes: <code>openid</code>, <code>email</code>, <code>profile</code>.
            </li>
            <li>
              <strong>Create OAuth 2.0 Client ID:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-600 text-xs">
                <li>Application Type: <strong>Web application</strong></li>
                <li>
                  Authorized JavaScript origins:{' '}
                  <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">http://localhost:5173</code>,{' '}
                  <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">http://127.0.0.1:5173</code>
                </li>
              </ul>
            </li>
            <li>
              <strong>Copy Client ID into your .env file:</strong>
            </li>
          </ol>

          <div className="relative mt-2">
            <div className="bg-[#183629] text-stone-200 font-mono text-xs p-3.5 rounded-xl overflow-x-auto border border-[#244D38]">
              <pre>{envSnippet}</pre>
            </div>
            <button
              onClick={copySnippet}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition border border-white/20"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-stone-500 text-xs">
            After updating <code className="font-semibold text-stone-700">.env</code>, restart the frontend and backend to apply the changes.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-[#244D38]/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#244D38] hover:bg-[#1d3e2d] text-white text-xs sm:text-sm font-semibold transition"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthGuideModal;
