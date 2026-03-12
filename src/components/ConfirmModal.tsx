import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '0', overflow: 'hidden', animation: 'slideUp 0.3s ease-out', border: '1px solid var(--border)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: isDestructive ? 'rgba(255, 77, 79, 0.1)' : 'rgba(0, 112, 243, 0.1)', color: isDestructive ? 'var(--error)' : 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
              <AlertTriangle size={20} />
            </div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
            {message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', padding: '20px 24px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--border)', justifyContent: 'flex-end' }}>
          <button className="btn-primary" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' }} onClick={onClose}>
            {cancelText}
          </button>
          <button className="btn-primary" style={{ background: isDestructive ? 'var(--error)' : 'var(--primary)', border: 'none' }} onClick={() => { onConfirm(); onClose(); }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
