export const generateSearchHtml = (): string => `
  <div class="search-container">
    <input type="text" class="search-input" placeholder="Search members...">
    <div class="search-results"></div>
  </div>
`;

export const generateSearchScript = (): string => `
  const searchInput = document.querySelector('.search-input');
  const searchResults = document.querySelector('.search-results');

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      const results = members.filter(member => 
        member.name?.toLowerCase().includes(query) ||
        member.location?.toLowerCase().includes(query)
      );

      searchResults.innerHTML = results
        .map(member => \`
          <div class="search-result-item" 
               data-lat="\${member.latitude}" 
               data-lng="\${member.longitude}">
            <img class="search-result-image" 
                 src="\${member.image || defaultAvatar}" 
                 alt="\${member.name || ''}" 
                 onerror="this.src='\${defaultAvatar}'">
            <span>\${member.name || 'Unknown Member'}\${
              member.location ? \` - \${member.location}\` : ''
            }</span>
          </div>
        \`).join('');

      searchResults.style.display = results.length > 0 ? 'block' : 'none';
    });

    searchResults.addEventListener('click', function(e) {
      const item = e.target.closest('.search-result-item');
      if (item) {
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], 13);
          searchResults.style.display = 'none';
          searchInput.value = '';
        }
      }
    });
  }
`;
