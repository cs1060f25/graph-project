require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// arXiv categories for diverse topics
const CATEGORIES = [
  { code: 'cs.AI', name: 'Artificial Intelligence' },
  { code: 'cs.LG', name: 'Machine Learning' },
  { code: 'q-bio.GN', name: 'Genomics' },
  { code: 'physics.optics', name: 'Optics' },
  { code: 'math.CO', name: 'Combinatorics' }
];

async function fetchArxivPapers(category, maxResults = 4) {
  const baseUrl = 'http://export.arxiv.org/api/query';
  const query = `search_query=cat:${category}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
  
  try {
    const response = await axios.get(`${baseUrl}?${query}`);
    const xml = response.data;
    
    // Simple XML parsing
    const entries = xml.split('<entry>').slice(1);
    const papers = [];
    
    for (const entry of entries) {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
      const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
      const idMatch = entry.match(/<id>(.*?)<\/id>/);
      
      // Extract authors
      const authorMatches = entry.match(/<author>.*?<name>(.*?)<\/name>.*?<\/author>/gs);
      const authors = authorMatches 
        ? authorMatches.map(a => a.match(/<name>(.*?)<\/name>/)[1].trim())
        : ['Unknown Author'];
      
      if (titleMatch && summaryMatch && publishedMatch && idMatch) {
        const arxivId = idMatch[1].split('/abs/')[1];
        papers.push({
          arxiv_id: arxivId,
          title: titleMatch[1].trim().replace(/\s+/g, ' '),
          authors: authors,
          abstract: summaryMatch[1].trim().replace(/\s+/g, ' '),
          category: category,
          published_date: publishedMatch[1].split('T')[0],
          pdf_url: `https://arxiv.org/pdf/${arxivId}.pdf`
        });
      }
    }
    
    return papers;
  } catch (error) {
    console.error(`Error fetching papers for ${category}:`, error.message);
    return [];
  }
}

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seed...\n');
    
    // Clear existing data
    await client.query('TRUNCATE papers, related_papers RESTART IDENTITY CASCADE');
    console.log('Cleared existing data\n');
    
    let savedCount = 0;
    const allPaperIds = [];
    
    // Fetch and insert papers for each category
    for (const category of CATEGORIES) {
      console.log(`Fetching papers for ${category.name} (${category.code})...`);
      const papers = await fetchArxivPapers(category.code, 4);
      
      for (const paper of papers) {
        try {
          const result = await client.query(
            `INSERT INTO papers (arxiv_id, title, authors, abstract, category, published_date, pdf_url, is_saved)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (arxiv_id) DO NOTHING
             RETURNING id`,
            [
              paper.arxiv_id,
              paper.title,
              paper.authors,
              paper.abstract,
              paper.category,
              paper.published_date,
              paper.pdf_url,
              true // Mark first 20 as saved
            ]
          );
          
          if (result.rows.length > 0) {
            allPaperIds.push({ id: result.rows[0].id, category: paper.category });
            savedCount++;
            console.log(`  ✓ ${paper.title.substring(0, 60)}...`);
          }
        } catch (error) {
          console.error(`  ✗ Error inserting paper: ${error.message}`);
        }
      }
      
      console.log('');
      
      // Add delay to respect arXiv API rate limits
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\nInserted ${savedCount} saved papers`);
    
    // Fetch additional related papers (not saved)
    console.log('\nFetching related papers...');
    for (const category of CATEGORIES) {
      const papers = await fetchArxivPapers(category.code, 6);
      
      // Skip first 4 (already saved), insert next 2 as related
      for (let i = 4; i < Math.min(6, papers.length); i++) {
        const paper = papers[i];
        try {
          await client.query(
            `INSERT INTO papers (arxiv_id, title, authors, abstract, category, published_date, pdf_url, is_saved)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (arxiv_id) DO NOTHING`,
            [
              paper.arxiv_id,
              paper.title,
              paper.authors,
              paper.abstract,
              paper.category,
              paper.published_date,
              paper.pdf_url,
              false // Not saved, these are suggestions
            ]
          );
          console.log(`  ✓ Related: ${paper.title.substring(0, 50)}...`);
        } catch (error) {
          console.error(`  ✗ Error inserting related paper: ${error.message}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('\n✓ Database seeded successfully!');
    console.log(`Total saved papers: ${savedCount}`);
    console.log('\nYou can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();