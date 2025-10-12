import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const PaperManager = () => {
  const [papers, setPapers] = useState([]);
  const [folders, setFolders] = useState(['Machine Learning', 'NLP', 'Deep Learning']);
  const [selectedView, setSelectedView] = useState('folders');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [recentPapers, setRecentPapers] = useState([]);
  const [showMenu, setShowMenu] = useState(null);
  const [showMoveDialog, setShowMoveDialog] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showNotImplemented, setShowNotImplemented] = useState(false);
  const [recommendedPapers, setRecommendedPapers] = useState({});
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  useEffect(() => {
    initializePapers();
  }, []);

  const initializePapers = () => {
    const initialPapers = [
      // Machine Learning
      { id: 1, title: "Attention Is All You Need", authors: "Vaswani et al.", year: 2017, folder: "Machine Learning", url: "https://arxiv.org/abs/1706.03762" },
      { id: 2, title: "Deep Residual Learning for Image Recognition", authors: "He et al.", year: 2015, folder: "Machine Learning", url: "https://arxiv.org/abs/1512.03385" },
      { id: 3, title: "Generative Adversarial Networks", authors: "Goodfellow et al.", year: 2014, folder: "Machine Learning", url: "https://arxiv.org/abs/1406.2661" },
      { id: 4, title: "Adam: A Method for Stochastic Optimization", authors: "Kingma et al.", year: 2014, folder: "Machine Learning", url: "https://arxiv.org/abs/1412.6980" },
      
      // NLP
      { id: 5, title: "BERT: Pre-training of Deep Bidirectional Transformers", authors: "Devlin et al.", year: 2018, folder: "NLP", url: "https://arxiv.org/abs/1810.04805" },
      { id: 6, title: "Language Models are Few-Shot Learners", authors: "Brown et al.", year: 2020, folder: "NLP", url: "https://arxiv.org/abs/2005.14165" },
      { id: 7, title: "Neural Machine Translation by Jointly Learning to Align", authors: "Bahdanau et al.", year: 2014, folder: "NLP", url: "https://arxiv.org/abs/1409.0473" },
      { id: 8, title: "GloVe: Global Vectors for Word Representation", authors: "Pennington et al.", year: 2014, folder: "NLP", url: "https://arxiv.org/abs/1504.06654" },
      
      // Deep Learning
      { id: 9, title: "Batch Normalization: Accelerating Deep Network Training", authors: "Ioffe et al.", year: 2015, folder: "Deep Learning", url: "https://arxiv.org/abs/1502.03167" },
      { id: 10, title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting", authors: "Srivastava et al.", year: 2014, folder: "Deep Learning", url: "https://arxiv.org/abs/1207.0580" },
      { id: 11, title: "ImageNet Classification with Deep Convolutional Neural Networks", authors: "Krizhevsky et al.", year: 2012, folder: "Deep Learning", url: "https://arxiv.org/abs/1202.05346" },
      { id: 12, title: "Deep Learning", authors: "LeCun et al.", year: 2015, folder: "Deep Learning", url: "https://arxiv.org/abs/1521.00561" },
      
      // No folder assigned
      { id: 13, title: "Visualizing and Understanding Convolutional Networks", authors: "Zeiler et al.", year: 2013, folder: null, url: "https://arxiv.org/abs/1311.2901" },
      { id: 14, title: "Auto-Encoding Variational Bayes", authors: "Kingma et al.", year: 2013, folder: null, url: "https://arxiv.org/abs/1312.6114" },
      { id: 15, title: "Playing Atari with Deep Reinforcement Learning", authors: "Mnih et al.", year: 2013, folder: null, url: "https://arxiv.org/abs/1312.5602" },
      { id: 16, title: "A Neural Algorithm of Artistic Style", authors: "Gatys et al.", year: 2015, folder: null, url: "https://arxiv.org/abs/1508.06576" },
      { id: 17, title: "Deep Speech 2: End-to-End Speech Recognition", authors: "Amodei et al.", year: 2015, folder: null, url: "https://arxiv.org/abs/1512.02595" },
      { id: 18, title: "SSD: Single Shot MultiBox Detector", authors: "Liu et al.", year: 2015, folder: null, url: "https://arxiv.org/abs/1512.02325" },
      { id: 19, title: "You Only Look Once: Unified Real-Time Object Detection", authors: "Redmon et al.", year: 2015, folder: null, url: "https://arxiv.org/abs/1506.02640" },
      { id: 20, title: "Semantic Image Segmentation with Deep Convolutional Nets", authors: "Chen et al.", year: 2014, folder: null, url: "https://arxiv.org/abs/1412.7062" },
    ];
    setPapers(initialPapers);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(papers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Papers");
    XLSX.writeFile(wb, "saved_papers.xlsx");
  };

  const handlePaperClick = (paper) => {
    window.open(paper.url, '_blank');
    setRecentPapers(prev => {
      const filtered = prev.filter(p => p.id !== paper.id);
      return [paper, ...filtered].slice(0, 10);
    });
  };

  const handleDelete = (paperId) => {
    setPapers(papers.filter(p => p.id !== paperId));
    setShowMenu(null);
  };

  const handleMoveToFolder = (paperId, folderName) => {
    setPapers(papers.map(p => 
      p.id === paperId ? { ...p, folder: folderName } : p
    ));
    setShowMoveDialog(null);
    setShowMenu(null);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders([...folders, newFolderName.trim()]);
      setNewFolderName('');
      setShowNewFolderDialog(false);
    }
  };

  const fetchRecommendedPapers = async () => {
    setLoadingRecommended(true);
    const recommended = {};
    
    // Map folder names to arXiv categories or better search terms
    const folderToQuery = {
      'Machine Learning': 'cat:cs.LG+OR+cat:stat.ML',
      'NLP': 'cat:cs.CL',
      'Deep Learning': 'all:deep+learning',
    };
    
    for (const folder of folders) {
      try {
        // Use predefined query or fall back to title/abstract search
        const terms = folder.toLowerCase();
        const startPos = 0;
        const searchQuery = `(ti:"${terms}")+OR+(abs:"${terms}")`; // e.g., (ti:"deep learning")+OR+(abs:"deep learning")
        const url = `https://export.arxiv.org/api/query?search_query=${searchQuery}&start=${startPos}&max_results=15&sortBy=submittedDate&sortOrder=descending`;
        const proxiedUrl = `https://corsproxy.io/?${url}`;
        console.log(`Fetching from arXiv for ${folder}:`, url);
        
        const response = await fetch(proxiedUrl);
        console.log(response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log(`Response length for ${folder}:`, text.length);
        console.log(`First 500 chars:`, text.substring(0, 500));
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        // Check for parsing errors
        const parserError = xml.querySelector('parsererror');
        if (parserError) {
          console.error('XML Parse Error:', parserError.textContent);
          throw new Error('Failed to parse XML response');
        }
        
        const entries = xml.querySelectorAll('entry');
        console.log(`Found ${entries.length} entries for ${folder}`);
        
        // Log first entry for debugging
        if (entries.length > 0) {
          const firstEntry = entries[0];
          console.log('First entry title:', firstEntry.querySelector('title')?.textContent);
        }
        
        const folderPapers = [];
        const existingUrls = papers.filter(p => p.folder === folder).map(p => p.url);
        const existingTitles = papers.map(p => p.title.toLowerCase());
        
        for (let i = 0; i < entries.length && folderPapers.length < 3; i++) {
          const entry = entries[i];
          const id = entry.querySelector('id')?.textContent?.trim() || '';
          const title = entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() || '';
          const authors = entry.querySelectorAll('author name');
          const authorText = authors.length > 0 ? `${authors[0].textContent} et al.` : 'Unknown';
          const published = entry.querySelector('published')?.textContent || '';
          const year = published ? new Date(published).getFullYear() : '';
          
          // Check if paper is not already in collection (by URL or title)
          if (!existingUrls.includes(id) && !existingTitles.includes(title.toLowerCase())) {
            folderPapers.push({
              id: `rec-${folder}-${folderPapers.length}`,
              title,
              authors: authorText,
              year,
              folder: null,
              url: id
            });
          }
        }
        
        console.log(`Recommended papers for ${folder}:`, folderPapers.length);
        recommended[folder] = folderPapers;
      } catch (error) {
        console.error(`Error fetching papers for ${folder}:`, error);
        recommended[folder] = [];
      }
    }
    
    setRecommendedPapers(recommended);
    setLoadingRecommended(false);
  };

  useEffect(() => {
    if (selectedView === 'recommended') {
      fetchRecommendedPapers();
    }
  }, [selectedView, folders]);

  const renderPaperRow = (paper, showFolder = true) => (
    <div key={paper.id} style={styles.paperRow}>
      <div style={styles.paperTitle} onClick={() => handlePaperClick(paper)}>
        {paper.title}
      </div>
      <div style={styles.paperAuthors}>{paper.authors}</div>
      <div style={styles.paperYear}>{paper.year}</div>
      {showFolder && <div style={styles.paperFolder}>{paper.folder || 'Unorganized'}</div>}
      <a href={paper.url} target="_blank" rel="noopener noreferrer" style={styles.paperLink}>
        Link
      </a>
      <div style={styles.hamburgerContainer}>
        <div style={styles.hamburger} onClick={() => setShowMenu(showMenu === paper.id ? null : paper.id)}>
          ☰
        </div>
        {showMenu === paper.id && (
          <div style={styles.menu}>
            <div style={styles.menuItem} onClick={() => handleDelete(paper.id)}>
              Delete from Saved
            </div>
            <div style={styles.menuItem} onClick={() => setShowMoveDialog(paper.id)}>
              Move to Folder
            </div>
          </div>
        )}
      </div>
      
      {showMoveDialog === paper.id && (
        <div style={styles.dialog}>
          <div style={styles.dialogContent}>
            <h3 style={styles.dialogTitle}>Move to Folder</h3>
            <div style={styles.folderList}>
              {folders.map(folder => (
                <div
                  key={folder}
                  style={styles.folderOption}
                  onClick={() => handleMoveToFolder(paper.id, folder)}
                >
                  {folder}
                </div>
              ))}
              <div
                style={styles.folderOption}
                onClick={() => {
                  setShowMoveDialog(null);
                  setShowNewFolderDialog(true);
                }}
              >
                + Create New Folder
              </div>
            </div>
            <button style={styles.cancelButton} onClick={() => setShowMoveDialog(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderMainContent = () => {
    if (selectedView === 'all') {
      return (
        <div style={styles.mainContent}>
          <h2 style={styles.contentTitle}>All Papers</h2>
          {papers.map(paper => renderPaperRow(paper))}
        </div>
      );
    }
    
    if (selectedView === 'folders') {
      if (selectedFolder) {
        const folderPapers = papers.filter(p => p.folder === selectedFolder);
        return (
          <div style={styles.mainContent}>
            <div style={styles.folderHeader}>
              <button style={styles.backButton} onClick={() => setSelectedFolder(null)}>
                ← Back to Folders
              </button>
              <h2 style={styles.contentTitle}>{selectedFolder}</h2>
            </div>
            {folderPapers.map(paper => renderPaperRow(paper, false))}
          </div>
        );
      }
      
      return (
        <div style={styles.mainContent}>
          <div style={styles.folderHeader}>
            <h2 style={styles.contentTitle}>Folders</h2>
            <button style={styles.newFolderButton} onClick={() => setShowNewFolderDialog(true)}>
              + New Folder
            </button>
          </div>
          <div style={styles.folderGrid}>
            {folders.map(folder => {
              const count = papers.filter(p => p.folder === folder).length;
              return (
                <div
                  key={folder}
                  style={styles.folderCard}
                  onClick={() => setSelectedFolder(folder)}
                >
                  <div style={styles.folderIcon}>📁</div>
                  <div style={styles.folderName}>{folder}</div>
                  <div style={styles.folderCount}>{count} papers</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    if (selectedView === 'recent') {
      return (
        <div style={styles.mainContent}>
          <h2 style={styles.contentTitle}>Recently Viewed (Last 10)</h2>
          {recentPapers.length === 0 ? (
            <p style={styles.emptyMessage}>No recently viewed papers. Click on paper links to track them here.</p>
          ) : (
            recentPapers.map(paper => renderPaperRow(paper))
          )}
        </div>
      );
    }
    
    if (selectedView === 'recommended') {
      return (
        <div style={styles.mainContent}>
          <div style={styles.folderHeader}>
            <h2 style={styles.contentTitle}>Recommended Papers</h2>
            <button 
              style={styles.refreshButton} 
              onClick={fetchRecommendedPapers}
              disabled={loadingRecommended}
            >
              {loadingRecommended ? 'Loading...' : '↻ Refresh'}
            </button>
          </div>
          {loadingRecommended ? (
            <p style={styles.loadingMessage}>Loading recommendations from arXiv...</p>
          ) : (
            folders.map(folder => (
              <div key={folder} style={styles.recommendedSection}>
                <h3 style={styles.recommendedFolderTitle}>{folder}</h3>
                <div style={styles.horizontalLine}></div>
                {recommendedPapers[folder]?.length > 0 ? (
                  recommendedPapers[folder].map(paper => renderPaperRow(paper, false))
                ) : (
                  <p style={styles.emptyMessage}>No recommendations found</p>
                )}
              </div>
            ))
          )}
        </div>
      );
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Banner */}
      <div style={styles.topBanner}>
        <div style={styles.logo}>Paper Manager</div>
        <div style={styles.menuItems}>
          <div style={styles.menuItem} onClick={() => setShowNotImplemented(true)}>Query</div>
          <div style={{...styles.menuItem, ...styles.activeMenuItem}}>Saved</div>
          <div style={styles.menuItem} onClick={() => setShowNotImplemented(true)}>Portfolio</div>
        </div>
      </div>

      <div style={styles.mainLayout}>
        {/* Left Sidebar */}
        <div style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>SAVED</h2>
          <div
            style={{...styles.sidebarButton, ...(selectedView === 'all' ? styles.activeSidebarButton : {})}}
            onClick={() => { setSelectedView('all'); setSelectedFolder(null); }}
          >
            All
          </div>
          <div
            style={{...styles.sidebarButton, ...(selectedView === 'folders' ? styles.activeSidebarButton : {})}}
            onClick={() => { setSelectedView('folders'); setSelectedFolder(null); }}
          >
            Folders
          </div>
          <div
            style={{...styles.sidebarButton, ...(selectedView === 'recent' ? styles.activeSidebarButton : {})}}
            onClick={() => { setSelectedView('recent'); setSelectedFolder(null); }}
          >
            Recent
          </div>
          <div
            style={{...styles.sidebarButton, ...(selectedView === 'recommended' ? styles.activeSidebarButton : {})}}
            onClick={() => { setSelectedView('recommended'); setSelectedFolder(null); }}
          >
            Recommended
          </div>
        </div>

        {/* Main Content */}
        {renderMainContent()}
      </div>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div style={styles.dialog}>
          <div style={styles.dialogContent}>
            <h3 style={styles.dialogTitle}>Create New Folder</h3>
            <input
              type="text"
              style={styles.input}
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div style={styles.dialogButtons}>
              <button style={styles.createButton} onClick={handleCreateFolder}>Create</button>
              <button style={styles.cancelButton} onClick={() => { setShowNewFolderDialog(false); setNewFolderName(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Not Implemented Dialog */}
      {showNotImplemented && (
        <div style={styles.dialog} onClick={() => setShowNotImplemented(false)}>
          <div style={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.dialogTitle}>Not Implemented</h3>
            <p style={styles.dialogMessage}>This feature is not yet implemented.</p>
            <button style={styles.cancelButton} onClick={() => setShowNotImplemented(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  topBanner: {
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#58a6ff',
  },
  menuItems: {
    display: 'flex',
    gap: '32px',
  },
  menuItem: {
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  activeMenuItem: {
    backgroundColor: '#21262d',
    color: '#58a6ff',
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#161b22',
    borderRight: '1px solid #30363d',
    padding: '24px 16px',
  },
  sidebarTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#8b949e',
    marginBottom: '16px',
    letterSpacing: '0.5px',
  },
  sidebarButton: {
    padding: '10px 16px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
    fontSize: '14px',
  },
  activeSidebarButton: {
    backgroundColor: '#21262d',
    color: '#58a6ff',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto',
  },
  contentTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#c9d1d9',
  },
  paperRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 80px 150px 80px 40px',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#161b22',
    borderRadius: '6px',
    marginBottom: '12px',
    alignItems: 'center',
    border: '1px solid #30363d',
    position: 'relative',
  },
  paperTitle: {
    fontWeight: '500',
    cursor: 'pointer',
    color: '#58a6ff',
    textDecoration: 'none',
  },
  paperAuthors: {
    color: '#8b949e',
    fontSize: '14px',
  },
  paperYear: {
    color: '#8b949e',
    fontSize: '14px',
  },
  paperFolder: {
    color: '#8b949e',
    fontSize: '14px',
  },
  paperLink: {
    color: '#58a6ff',
    textDecoration: 'none',
    fontSize: '14px',
  },
  hamburgerContainer: {
    position: 'relative',
  },
  hamburger: {
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: '#21262d',
    border: '1px solid #30363d',
    borderRadius: '6px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    zIndex: 100,
    minWidth: '180px',
    marginTop: '4px',
  },
  folderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  folderCard: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
    textAlign: 'center',
  },
  folderIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  folderName: {
    fontWeight: '500',
    marginBottom: '8px',
    color: '#c9d1d9',
  },
  folderCount: {
    fontSize: '12px',
    color: '#8b949e',
  },
  folderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  newFolderButton: {
    padding: '8px 16px',
    backgroundColor: '#238636',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#21262d',
    color: '#c9d1d9',
    border: '1px solid #30363d',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  dialog: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContent: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '8px',
    padding: '24px',
    minWidth: '400px',
    maxWidth: '500px',
  },
  dialogTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#c9d1d9',
  },
  input: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#c9d1d9',
    fontSize: '14px',
    marginBottom: '16px',
  },
  dialogButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  createButton: {
    padding: '8px 16px',
    backgroundColor: '#238636',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#21262d',
    color: '#c9d1d9',
    border: '1px solid #30363d',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  folderList: {
    marginBottom: '16px',
  },
  folderOption: {
    padding: '10px',
    cursor: 'pointer',
    borderRadius: '4px',
    marginBottom: '4px',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
  },
  emptyMessage: {
    color: '#8b949e',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '24px',
  },
  dialogMessage: {
    color: '#8b949e',
    marginBottom: '16px',
  },
  recommendedSection: {
    marginBottom: '40px',
  },
  recommendedFolderTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#c9d1d9',
  },
  horizontalLine: {
    height: '1px',
    backgroundColor: '#30363d',
    marginBottom: '16px',
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#21262d',
    color: '#58a6ff',
    border: '1px solid #30363d',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  loadingMessage: {
    color: '#8b949e',
    textAlign: 'center',
    padding: '24px',
  },
};

export default PaperManager;