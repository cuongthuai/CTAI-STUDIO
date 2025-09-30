import React, { useState, useRef } from 'react';
import { SavedPrompt } from '../types';
import { TrashIcon, LibraryIcon } from './icons';

interface PromptLibraryProps {
  prompts: SavedPrompt[];
  onUse: (prompt: string) => void;
  onDelete: (id: number) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ prompts, onUse, onDelete, onImport, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const filteredPrompts = prompts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={importInputRef}
        onChange={onImport}
        accept=".json,application/json"
        style={{ display: 'none' }}
      />
      
      <div style={styles.header}>
        <div style={styles.titleContainer}>
            <LibraryIcon style={{ color: '#E5E7EB', width: 24, height: 24 }} />
            <h3 style={styles.title}>Thư viện Prompt</h3>
        </div>
        <div style={styles.importExport}>
            <button style={styles.linkButton} onClick={() => importInputRef.current?.click()}>Nhập</button>
            <button style={styles.linkButton} onClick={onExport}>Xuất</button>
        </div>
      </div>
      
      <input
        type="search"
        placeholder="Tìm kiếm prompt..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
      />

      {filteredPrompts.length > 0 ? (
        <div style={styles.list}>
          {filteredPrompts.map((prompt) => (
            <div key={prompt.id} style={styles.item}>
              <div style={styles.promptContent} onClick={() => onUse(prompt.prompt)} title="Nhấn để sử dụng prompt này">
                <strong style={styles.promptName}>{prompt.name}</strong>
                <p style={styles.promptText}>"{prompt.prompt}"</p>
              </div>
              <div style={styles.actions}>
                <button style={styles.actionButton} title="Xóa prompt" onClick={() => onDelete(prompt.id)}>
                  <TrashIcon style={{ width: 16, height: 16, color: '#9CA3AF' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={styles.emptyState}>{prompts.length > 0 ? "Không có prompt nào khớp với tìm kiếm." : "Thư viện của bạn trống. Lưu một prompt để bắt đầu."}</p>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        marginTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid #374151',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#E5E7EB',
        margin: 0,
    },
    importExport: {
        display: 'flex',
        gap: '1rem',
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: '#F97316',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 500,
        padding: 0,
    },
    searchInput: {
        width: '100%',
        backgroundColor: '#374151',
        border: '1px solid #4B5563',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        color: '#F9FAFB',
        fontFamily: 'inherit',
        fontSize: '1rem',
        boxSizing: 'border-box',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxHeight: '240px',
        overflowY: 'auto',
        paddingRight: '0.5rem',
    },
    item: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#374151',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        border: '1px solid #4B5563',
        transition: 'background-color 0.2s, border-color 0.2s',
    },
    promptContent: {
        flex: 1,
        marginRight: '1rem',
        cursor: 'pointer',
        minWidth: 0,
    },
    promptName: {
        color: '#E5E7EB',
        display: 'block',
        marginBottom: '0.25rem',
        fontWeight: 500,
    },
    promptText: {
        color: '#9CA3AF',
        margin: 0,
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    actions: {
        display: 'flex',
    },
    actionButton: {
        background: 'transparent',
        border: 'none',
        color: '#9CA3AF',
        padding: '0.25rem',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.2s',
    },
    emptyState: {
        color: '#9CA3AF',
        textAlign: 'center',
        padding: '2rem 0',
        fontSize: '0.9rem',
        margin: 0,
    }
};