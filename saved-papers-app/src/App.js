import React, { useState, useEffect } from 'react';
import { Folder, Plus, Menu, Trash2, FolderOpen } from 'lucide-react';

const SavedPapersApp = () => {
  const [papers, setPapers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeTab, setActiveTab] = useState('saved');
  const [activeSidebar, setActiveSidebar] = useState('folders');
  const [recentPapers, setRecentPapers] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showNotImplemented, setShowNotImplemented] = useState(false);
  const [notImplementedTab, setNotImplementedTab] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(null);

  // Initialize data
  useEffect(() => {
    const initialFolders = ['Machine Learning', 'Computer Vision', 'Reinforcement Learning'];
    setFolders(initialFolders);

    const initialPapers = [
      { id: 1, title: 'Attention Is All You Need', authors: 'Vaswani, A., et al.', year: 2017, folder: null, link: 'https://arxiv.org/abs/1706.03762' },
      { id: 2, title: 'BERT: Pre-training of Deep Bidirectional Transformers', authors: 'Devlin, J., et al.', year: 2018, folder: null, link: 'https://arxiv.org/abs/1810.04805' },
      { id: 3, title: 'Language Models are Unsupervised Multitask Learners', authors: 'Radford, A., et al.', year: 2019, folder: null, link: 'https://arxiv.org/abs/1907.06032' },
      { id: 4, title: 'GPT-3: Language Models are Few-Shot Learners', authors: 'Brown, T., et al.', year: 2020, folder: null, link: 'https://arxiv.org/abs/2005.14165' },
      { id: 5, title: 'Vision Transformer', authors: 'Dosovitskiy, A., et al.', year: 2021, folder: null, link: 'https://arxiv.org/abs/2010.11929' },
      { id: 6, title: 'Deep Residual Learning for Image Recognition', authors: 'He, K., et al.', year: 2015, folder: null, link: 'https://arxiv.org/abs/1512.03385' },
      { id: 7, title: 'Convolutional Neural Networks for Sentence Classification', authors: 'Kim, Y.', year: 2014, folder: null, link: 'https://arxiv.org/abs/1408.5882' },
      { id: 8, title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition', authors: 'Dosovitskiy, A., et al.', year: 2020, folder: null, link: 'https://arxiv.org/abs/2010.11929' },
      { id: 9, title: 'Reinforcement Learning from Human Feedback', authors: 'Christiano, P., et al.', year: 2017, folder: null, link: 'https://arxiv.org/abs/1706.03741' },
      { id: 10, title: 'Proximal Policy Optimization Algorithms', authors: 'Schulman, J., et al.', year: 2017, folder: null, link: 'https://arxiv.org/abs/1707.06347' },
      { id: 11, title: 'AlphaGo Zero: Mastering the game of Go without human knowledge', authors: 'Silver, D., et al.', year: 2017, folder: null, link: 'https://arxiv.org/abs/1712.01724' },
      { id: 12, title: 'Deep Q-Networks', authors: 'Mnih, V., et al.', year: 2013, folder: null, link: 'https://arxiv.org/abs/1312.5602' },
      { id: 13, title: 'Generative Adversarial Networks', authors: 'Goodfellow, I., et al.', year: 2014, folder: null, link: 'https://arxiv.org/abs/1406.2661' },
      { id: 14, title: 'Auto-Encoding Variational Bayes', authors: 'Kingma, D., Welling, M.', year: 2013, folder: null, link: 'https://arxiv.org/abs/1312.6114' },
      { id: 15, title: 'Diffusion Models Beat GANs on Image Synthesis', authors: 'Dhariwal, P., Nichol, A.', year: 2021, folder: null, link: 'https://arxiv.org/abs/2105.05233' },
      { id: 16, title: 'Denoising Diffusion Probabilistic Models', authors: 'Ho, J., et al.', year: 2020, folder: null, link: 'https://arxiv.org/abs/2006.11239' },
      { id: 17, title: 'Neural Architecture Search with Reinforcement Learning', authors: 'Zoph, B., Le, Q.', year: 2017, folder: null, link: 'https://arxiv.org/abs/1611.01578' },
      { id: 18, title: 'EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks', authors: 'Tan, M., Le, Q.', year: 2019, folder: null, link: 'https://arxiv.org/abs/1905.11946' },
      { id: 19, title: 'MobileNets: Efficient Convolutional Neural Networks', authors: 'Howard, A., et al.', year: 2017, folder: null, link: 'https://arxiv.org/abs/1704.04861' },
      { id: 20, title: 'Squeeze-and-Excitation Networks', authors: 'Hu, J., et al.', year: 2018, folder: null, link: 'https://arxiv.org/abs/1709.01507' }
    ];
    
    setPapers(initialPapers);
  }, []);

  const handleNavClick = (tab) => {
    if (tab !== 'saved') {
      setNotImplementedTab(tab);
      setShowNotImplemented(true);
    } else {
      setActiveTab('saved');
    }
  };

  const handlePaperLinkClick = (paperId) => {
    setRecentPapers(prev => {
      const updated = [paperId, ...prev.filter(id => id !== paperId)];
      return updated.slice(0, 10);
    });
  };

  const handleDeletePaper = (paperId) => {
    setPapers(papers.filter(p => p.id !== paperId));
  };

  const openMoveModal = (paperId) => {
    setSelectedPaperId(paperId);
    setShowMoveModal(true);
  };

  const movePaperToFolder = (folderName) => {
    setPapers(papers.map(p => 
      p.id === selectedPaperId ? { ...p, folder: folderName } : p
    ));
    setShowMoveModal(false);
  };



  const displayedPapers = () => {
    let filtered = papers;
    
    if (activeSidebar === 'all') {
      return filtered;
    } else if (activeSidebar === 'folders' && selectedFolder) {
      return filtered.filter(p => p.folder === selectedFolder);
    } else if (activeSidebar === 'recent') {
      return filtered.filter(p => recentPapers.includes(p.id));
    }
    
    return [];
  };

  const renderMainContent = () => {
    if (activeSidebar === 'folders' && !selectedFolder) {
      return (
        <div>
        <div style={styles.folderGrid}>
          <div 
            style={styles.addFolderCard}
            onClick={() => setShowFolderModal(true)}
          >
            <Plus size={40} color="#9CA3AF" />
            <span style={styles.addFolderText}>New Folder</span>
          </div>
          {folders.map(folder => (
            <div 
              key={folder}
              style={styles.folderCard}
              onClick={() => setSelectedFolder(folder)}
            >
              <Folder size={48} color="#9CA3AF" />
              <span style={styles.folderName}>{folder}</span>
            </div>
          ))}
        </div>
      </div>
      );
    }

    const toDisplay = displayedPapers();

    return (
      <div style={styles.mainContent}>
        {toDisplay.length === 0 ? (
          <div style={styles.emptyState}>
            {activeSidebar === 'recent' 
              ? 'No recently accessed papers' 
              : 'No papers to display'}
          </div>
        ) : (
          <div style={styles.papersList}>
            {toDisplay.map(paper => (
              <PaperRow 
                key={paper.id}
                paper={paper}
                onDelete={handleDeletePaper}
                onMove={openMoveModal}
                onLinkClick={() => handlePaperLinkClick(paper.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Top Banner */}
      <div style={styles.banner}>
        <div style={styles.bannerContent}>
          <span style={styles.logo}>Research Papers</span>
          <div style={styles.navButtons}>
            <button 
              style={{...styles.navButton, ...(activeTab === 'saved' ? styles.navButtonActive : {})}}
              onClick={() => handleNavClick('saved')}
            >
              saved
            </button>
            <button 
              style={styles.navButton}
              onClick={() => handleNavClick('query')}
            >
              query
            </button>
            <button 
              style={styles.navButton}
              onClick={() => handleNavClick('portfolio')}
            >
              portfolio
            </button>
          </div>
        </div>
      </div>

      <div style={styles.mainContainer}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>SAVED</div>
          <button 
            style={{...styles.sidebarButton, ...(activeSidebar === 'all' ? styles.sidebarButtonActive : {})}}
            onClick={() => {
              setActiveSidebar('all');
              setSelectedFolder(null);
            }}
          >
            all
          </button>
          <button 
            style={{...styles.sidebarButton, ...(activeSidebar === 'folders' ? styles.sidebarButtonActive : {})}}
            onClick={() => {
              setActiveSidebar('folders');
              setSelectedFolder(null);
            }}
          >
            folders
          </button>
          <button 
            style={{...styles.sidebarButton, ...(activeSidebar === 'recent' ? styles.sidebarButtonActive : {})}}
            onClick={() => {
              setActiveSidebar('recent');
              setSelectedFolder(null);
            }}
          >
            recent
          </button>
        </div>

        {/* Main Content Area */}
        <div style={styles.contentArea}>
          {renderMainContent()}
          
          {/* Back button for folder view */}
          {activeSidebar === 'folders' && selectedFolder && (
            <div style={styles.folderHeader}>
              <button 
                style={styles.backButton}
                onClick={() => setSelectedFolder(null)}
              >
                ← Back to Folders
              </button>
              <h2 style={styles.folderTitle}>{selectedFolder}</h2>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNotImplemented && (
        <Modal 
          title="Not Implemented" 
          message={`The "${notImplementedTab}" page is not yet implemented.`}
          onClose={() => setShowNotImplemented(false)}
        />
      )}

      {showFolderModal && (
        <FolderModal 
          onClose={() => {
            setShowFolderModal(false);
            setNewFolderName('');
          }}
          onCreate={() => {
            if (newFolderName.trim()) {
              setFolders([...folders, newFolderName]);
              setNewFolderName('');
              setShowFolderModal(false);
            }
          }}
          value={newFolderName}
          onChange={setNewFolderName}
        />
      )}

      {showMoveModal && (
        <MoveModal 
          folders={folders}
          onClose={() => setShowMoveModal(false)}
          onSelectFolder={movePaperToFolder}
          onCreateNew={() => {
            setShowMoveModal(false);
            setShowFolderModal(true);
          }}
        />
      )}
    </div>
  );
};

const PaperRow = ({ paper, onDelete, onMove, onLinkClick }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={styles.paperRow}>
      <a 
        href={paper.link}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.paperLink}
        onClick={onLinkClick}
      >
        {paper.title}
      </a>
      <span style={styles.paperAuthors}>{paper.authors}</span>
      <span style={styles.paperYear}>{paper.year}</span>
      <span style={styles.paperFolder}>{paper.folder || '—'}</span>
      <div style={styles.paperMenuContainer}>
        <button 
          style={styles.hamburger}
          onClick={() => setShowMenu(!showMenu)}
        >
          ⋮
        </button>
        {showMenu && (
          <div style={styles.dropdownMenu}>
            <button 
              style={styles.menuItem}
              onClick={() => {
                onMove(paper.id);
                setShowMenu(false);
              }}
            >
              Move to Folder
            </button>
            <button 
              style={{...styles.menuItem, ...styles.deleteItem}}
              onClick={() => {
                onDelete(paper.id);
                setShowMenu(false);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Modal = ({ title, message, onClose }) => (
  <div style={styles.modalOverlay} onClick={onClose}>
    <div style={styles.modal} onClick={e => e.stopPropagation()}>
      <h2 style={styles.modalTitle}>{title}</h2>
      <p style={styles.modalMessage}>{message}</p>
      <button style={styles.modalButton} onClick={onClose}>OK</button>
    </div>
  </div>
);

const FolderModal = ({ onClose, onCreateNew, value, onChange }) => (
  <div style={styles.modalOverlay} onClick={onClose}>
    <div style={styles.modal} onClick={e => e.stopPropagation()}>
      <h2 style={styles.modalTitle}>New Folder</h2>
      <input 
        type="text" 
        placeholder="Folder name" 
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && onCreateNew()}
        style={styles.input}
        autoFocus
      />
      <div style={styles.modalButtons}>
        <button style={styles.modalButton} onClick={onCreateNew}>Create</button>
        <button style={{...styles.modalButton, ...styles.cancelButton}} onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

const MoveModal = ({ folders, onClose, onSelectFolder, onCreateNew }) => (
  <div style={styles.modalOverlay} onClick={onClose}>
    <div style={styles.modal} onClick={e => e.stopPropagation()}>
      <h2 style={styles.modalTitle}>Move Paper</h2>
      <div style={styles.folderList}>
        {folders.length === 0 ? (
          <p style={styles.noFolders}>No folders yet</p>
        ) : (
          folders.map(folder => (
            <button 
              key={folder}
              style={styles.folderOption}
              onClick={() => onSelectFolder(folder)}
            >
              {folder}
            </button>
          ))
        )}
      </div>
      <div style={styles.modalButtons}>
        <button style={styles.modalButton} onClick={onCreateNew}>+ New Folder</button>
        <button style={{...styles.modalButton, ...styles.cancelButton}} onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  banner: {
    backgroundColor: '#1E293B',
    borderBottom: '1px solid #334155',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
  },
  bannerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#F1F5F9',
  },
  navButtons: {
    display: 'flex',
    gap: '8px',
  },
  navButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    backgroundColor: '#334155',
    color: '#F1F5F9',
  },
  mainContainer: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '200px',
    backgroundColor: '#1E293B',
    borderRight: '1px solid #334155',
    padding: '24px 0',
    overflowY: 'auto',
  },
  sidebarTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0 16px 16px',
  },
  sidebarButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    color: '#CBD5E1',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  sidebarButtonActive: {
    backgroundColor: '#334155',
    color: '#F1F5F9',
    borderLeft: '3px solid #60A5FA',
  },
  contentArea: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  papersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  paperRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: '#1E293B',
    borderRadius: '6px',
    border: '1px solid #334155',
    transition: 'all 0.2s',
  },
  paperLink: {
    flex: 1,
    color: '#60A5FA',
    textDecoration: 'none',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
  },
  paperAuthors: {
    flex: 0.8,
    color: '#94A3B8',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  paperYear: {
    flex: 0.3,
    color: '#94A3B8',
    fontSize: '13px',
    textAlign: 'center',
  },
  paperFolder: {
    flex: 0.5,
    color: '#94A3B8',
    fontSize: '13px',
    textAlign: 'center',
  },
  paperMenuContainer: {
    position: 'relative',
  },
  hamburger: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: '0',
    backgroundColor: '#334155',
    border: '1px solid #475569',
    borderRadius: '6px',
    minWidth: '150px',
    zIndex: 1000,
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#E2E8F0',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  deleteItem: {
    color: '#F87171',
    borderTop: '1px solid #475569',
  },
  folderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '24px',
  },
  folderCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    backgroundColor: '#1E293B',
    borderRadius: '8px',
    border: '1px solid #334155',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  folderName: {
    fontSize: '13px',
    color: '#E2E8F0',
    textAlign: 'center',
    wordBreak: 'break-word',
  },
  addFolderCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    backgroundColor: '#1E293B',
    borderRadius: '8px',
    border: '2px dashed #475569',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  addFolderText: {
    fontSize: '13px',
    color: '#94A3B8',
  },
  folderHeader: {
    marginBottom: '24px',
  },
  backButton: {
    backgroundColor: 'transparent',
    color: '#60A5FA',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '16px',
    padding: '8px 0',
  },
  folderTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#F1F5F9',
  },
  emptyState: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: '14px',
    padding: '48px 24px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: '#1E293B',
    borderRadius: '8px',
    border: '1px solid #334155',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#F1F5F9',
  },
  modalMessage: {
    color: '#CBD5E1',
    fontSize: '14px',
    marginBottom: '24px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#E2E8F0',
    fontSize: '14px',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  modalButton: {
    padding: '10px 16px',
    backgroundColor: '#60A5FA',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  cancelButton: {
    backgroundColor: '#475569',
    color: '#E2E8F0',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  folderList: {
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: '16px',
  },
  folderOption: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
    marginBottom: '8px',
    transition: 'all 0.2s',
  },
  noFolders: {
    color: '#94A3B8',
    fontSize: '14px',
    textAlign: 'center',
    padding: '16px',
  },
};

export default SavedPapersApp;