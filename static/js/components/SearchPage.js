const { useState, useEffect, useRef } = React;

const SearchPage = ({ onNavigateToGraph }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);

    // Debounced autocomplete
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (query.length >= 2) {
            timeoutRef.current = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (err) {
                    console.error('Autocomplete error:', err);
                }
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [query]);

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion.type === 'paper' ? suggestion.title : suggestion.name);
        setShowSuggestions(false);
        handleSearch(suggestion);
    };

    const handleSearch = async (suggestion = null) => {
        if (!suggestion && !query.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            let response;
            if (suggestion) {
                const endpoint = suggestion.type === 'paper' 
                    ? `/api/search/paper?id=${suggestion.id}`
                    : `/api/search/author?id=${suggestion.id}`;
                response = await fetch(endpoint);
            } else {
                // Fallback to text search
                response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (data.length > 0) {
                    handleSearch(data[0]);
                    return;
                }
            }

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            
            if (suggestion?.type === 'paper' || data.paper) {
                onNavigateToGraph(data.paper || data);
            } else if (suggestion?.type === 'author' || data.author) {
                // For authors, show their papers and let user select one
                setError('Author search not yet implemented. Please search for a specific paper.');
            }
        } catch (err) {
            setError('Error searching. Please try again.');
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            setShowSuggestions(false);
            handleSearch();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        setError(null);
    };

    return (
        <div>
            <div className="search-container">
                <h2 className="search-title">Research Discovery</h2>
                <p className="search-subtitle">
                    Search for papers or authors to explore citation networks and research communities
                </p>

                <div className="search-input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Enter paper title or author name..."
                        className="search-input"
                        disabled={isLoading}
                    />
                    
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="autocomplete-dropdown">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="autocomplete-item"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <div className="autocomplete-type">
                                        {suggestion.type === 'paper' ? 'Paper' : 'Author'}
                                    </div>
                                    <div className="autocomplete-title">
                                        {suggestion.type === 'paper' ? suggestion.title : suggestion.name}
                                    </div>
                                    {suggestion.type === 'paper' && suggestion.year && (
                                        <div className="autocomplete-meta">
                                            {suggestion.year}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => handleSearch()}
                    disabled={isLoading || !query.trim()}
                    className="search-button"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>

                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}
            </div>

            <div className="search-container">
                <h3>Search Tips</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#64748b' }}>
                    <li>Start typing a paper title or author name to see suggestions</li>
                    <li>Co-citation analysis reveals papers that cite similar works</li>
                    <li>Co-authorship analysis shows research collaborations</li>
                    <li>Graph visualization helps identify research communities</li>
                </ul>
            </div>
        </div>
    );
};
