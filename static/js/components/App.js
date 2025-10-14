const { useState } = React;

const App = () => {
    const [currentPage, setCurrentPage] = useState('search');
    const [selectedPaper, setSelectedPaper] = useState(null);

    const navigateToGraph = (paper) => {
        setSelectedPaper(paper);
        setCurrentPage('graph');
    };

    const navigateToSearch = () => {
        setCurrentPage('search');
        setSelectedPaper(null);
    };

    return (
        <div className="app">
            <header className="header">
                <h1>Research Graph Explorer</h1>
                <p>Advanced citation network analysis for experienced researchers</p>
            </header>
            
            <nav className="nav">
                <a 
                    href="#" 
                    className={`nav-item ${currentPage === 'search' ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); navigateToSearch(); }}
                >
                    Search & Discovery
                </a>
                <a 
                    href="#" 
                    className={`nav-item ${currentPage === 'graph' ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); }}
                >
                    Graph Visualization
                </a>
            </nav>

            <main className="main-content">
                {currentPage === 'search' && (
                    <SearchPage onNavigateToGraph={navigateToGraph} />
                )}
                {currentPage === 'graph' && selectedPaper && (
                    <GraphPage paper={selectedPaper} onBack={navigateToSearch} />
                )}
            </main>
        </div>
    );
};
