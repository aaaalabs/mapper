export const generateStyles = (): string => `
  body { 
    margin: 0; 
    padding: 0; 
  }
  
  #map { 
    width: 100vw; 
    height: 100vh; 
  }
  
  .member-popup { 
    text-align: center; 
    padding: 1rem; 
    min-width: 200px; 
  }
  
  .member-popup h3 { 
    margin: 0.5rem 0; 
    font-size: 1.1rem; 
    color: #1D3640; 
  }
  
  .member-popup p { 
    margin: 0.25rem 0; 
    color: #3D4F4F;
    font-size: 0.9rem;
  }
  
  .member-marker { 
    width: 40px; 
    height: 40px; 
    border-radius: 50%; 
    border: 2px solid white; 
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    background-color: #E9B893;
  }
  
  .member-links { 
    margin-top: 0.5rem; 
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .member-links a { 
    color: #E9B893; 
    text-decoration: none; 
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(233, 184, 147, 0.1);
  }
  
  .search-container {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    width: 300px;
  }

  .search-input {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-family: var(--font-sans);
    font-size: 14px;
  }

  .search-results {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    max-height: 300px;
    overflow-y: auto;
  }

  .search-result-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-family: var(--font-sans);
  }

  .search-result-item:hover {
    background-color: rgba(0,0,0,0.05);
  }

  .search-result-image {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .search-result-item span {
    font-size: 14px;
    color: #1D3640;
  }
`;
