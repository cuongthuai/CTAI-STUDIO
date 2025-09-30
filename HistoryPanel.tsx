
import React, { useRef } from 'react';
import { HistoryEntry } from '../types';
import { DownloadIcon, ReuseIcon, LoadIcon } from './components/icons';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onView: (item: HistoryEntry) => void;
  onReuse: (item: HistoryEntry) => void;
  onDownload: (image: string) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onView, onReuse, onDownload, onImport, onExport }) => {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={styles.container}>
      <input
        type="file"
        ref={importInputRef}
        onChange={onImport}
        accept=".json,application/json"
        style={{ display: 'none' }}
      />
      <div style={styles.header}>
        <h3 style={styles.title}>Lịch sử tạo ảnh</h3>
        <div style={styles.headerActions}>
            <button style={styles.headerButton} title="Nhập Lịch sử" onClick={() => importInputRef.current?.click()}>
              <LoadIcon style={{ width: 16, height: 16 }} />
            </button>
            <button style={styles.headerButton} title="Xuất Lịch sử" onClick={onExport}>
              <DownloadIcon style={{ width: 16, height: 16 }} />
            </button>
        </div>
      </div>
      <div style={styles.list}>
        {history.map((item) => (
          <div key={item.id} style={styles.item} className="history-item">
            <img
              src={item.image}
              alt="Ảnh xem trước trong lịch sử"
              style={styles.thumbnail}
              onClick={() => onView(item)}
              title="Nhấn để phóng to ảnh"
            />
            <div style={styles.actions} className="history-item-actions">
              <button style={styles.actionButton} title="Tái sử dụng cài đặt" onClick={() => onReuse(item)}>
                <ReuseIcon style={{ width: 16, height: 16 }} />
              </button>
              <button style={styles.actionButton} title="Tải xuống" onClick={() => onDownload(item.image)}>
                <DownloadIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .history-item .history-item-actions {
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
        }
        .history-item:hover .history-item-actions {
            opacity: 1;
        }
        .history-item:hover .history-item-actions button:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        .header-button:hover {
            background-color: #4B5563;
        }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        borderTop: '1px solid #374151',
        paddingTop: '2rem',
        marginTop: '1rem',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    title: {
        fontSize: '1.1rem',
        fontWeight: 500,
        color: '#D1D5DB',
        margin: '0',
    },
    headerActions: {
        display: 'flex',
        gap: '0.5rem',
    },
    headerButton: {
        background: 'transparent',
        border: '1px solid #4B5563',
        color: '#D1D5DB',
        cursor: 'pointer',
        padding: '0.35rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.375rem',
        transition: 'background-color 0.2s',
    },
    list: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '0.75rem',
    },
    item: {
        position: 'relative',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        aspectRatio: '1 / 1',
        border: '1px solid #374151'
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
    },
    actions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '0.25rem',
    },
    actionButton: {
        background: 'none',
        border: 'none',
        color: '#E5E7EB',
        cursor: 'pointer',
        padding: '0.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background-color 0.2s',
    },
};
