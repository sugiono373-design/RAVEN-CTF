// TopRankings Alpine component for real-time top 3 display
document.addEventListener("alpine:init", () => {
      Alpine.data('TopRankings', () => ({
        topThree: [null, null, null],
        
        async loadTopRankings() {
          try {
            const response = await CTFd.fetch('/api/v1/scoreboard');
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data.length > 0) {
                this.topThree = [
                  data.data[0] || null,
                  data.data[1] || null, 
                  data.data[2] || null
                ];
              }
            }
          } catch (error) {
            // Error loading top rankings silently handled
            this.topThree = [null, null, null];
          }
        },
        
        init() {
          setInterval(() => {
            this.loadTopRankings();
          }, 60000);
        }
      }));
      
      // ChallengeMatrix Alpine component for matrix view
      Alpine.data('ChallengeMatrix', () => ({
        challenges: [],
        challengesByCategory: {},
        sortedChallenges: [],
        solveData: {},
        searchQuery: '',
        currentPage: 1,
        pageSize: 10,
        
        getAllFilteredStandings() {
          const scoreboardEl = this.$el.closest('#scoreboard');
          if (!scoreboardEl || !scoreboardEl._x_dataStack) {
            return [];
          }
          
          const parentData = scoreboardEl._x_dataStack[0];
          let allStandings = parentData.standings || [];
          
          if (parentData.activeBracket) {
            allStandings = allStandings.filter(i => i.bracket_id == parentData.activeBracket);
          }
          
          allStandings = allStandings.map((standing, idx) => ({
            ...standing,
            pos: standing.pos || idx + 1
          }));
          
          let filtered = allStandings;
          
          if (this.searchQuery && this.searchQuery.trim() !== '') {
            const query = this.searchQuery.toLowerCase().trim();
            filtered = filtered.filter(standing => 
              standing.name.toLowerCase().includes(query)
            );
          }
          
          return filtered;
        },
        
        getFilteredStandings() {
          const filtered = this.getAllFilteredStandings();
          const start = (this.currentPage - 1) * this.pageSize;
          const end = start + this.pageSize;
          return filtered.slice(start, end);
        },
        
        getTotalPages() {
          const filtered = this.getAllFilteredStandings();
          return Math.max(1, Math.ceil(filtered.length / this.pageSize));
        },
        
        prevPage() {
          if (this.currentPage > 1) {
            this.currentPage--;
          }
        },
        
        nextPage() {
          if (this.currentPage < this.getTotalPages()) {
            this.currentPage++;
          }
        },
        
        goToPage(page) {
          if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
          }
        },
        
        filterStandings() {
          this.currentPage = 1;
        },
        
        async loadChallengeData() {
          try {
            const challengesResponse = await CTFd.fetch('/api/v1/challenges');
            if (challengesResponse.ok) {
              const challengesData = await challengesResponse.json();
              if (challengesData.success) {
                this.challenges = challengesData.data;
                this.organizeChallengesByCategory();
                this.createSortedChallenges();
              }
            }
            
            await this.loadSolveData();
          } catch (error) {
            // Error loading challenge data silently handled
          }
        },
        
        organizeChallengesByCategory() {
          const categories = {};
          this.challenges.forEach(challenge => {
            if (!categories[challenge.category]) {
              categories[challenge.category] = [];
            }
            categories[challenge.category].push(challenge);
          });
          Object.keys(categories).forEach(category => {
            categories[category].sort((a, b) => a.value - b.value);
          });
          this.challengesByCategory = categories;
        },
        
        createSortedChallenges() {
          const sortedCategories = Object.keys(this.challengesByCategory).sort();
          this.sortedChallenges = [];
          
          sortedCategories.forEach(category => {
            this.challengesByCategory[category].forEach(challenge => {
              this.sortedChallenges.push(challenge);
            });
          });
        },
        
        async loadSolveData() {
          for (const challenge of this.challenges) {
            try {
              const response = await CTFd.fetch(`/api/v1/challenges/${challenge.id}/solves`);
              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  this.solveData[challenge.id] = data.data;
                }
              }
            } catch (error) {
              console.log(`Error loading solves for challenge ${challenge.id}:`, error);
            }
          }
        },
        
        getCategoryHeaderStyle(category) {
          const colors = {
            'misc': { text: '#20c897', bg: 'rgba(32, 200, 151, 0.25)' },
            'crypto': { text: '#845ef7', bg: 'rgba(132, 94, 247, 0.25)' },
            'pwn': { text: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.25)' },
            'web': { text: '#329af1', bg: 'rgba(50, 154, 241, 0.25)' },
            'reverse': { text: '#fdc419', bg: 'rgba(253, 196, 25, 0.25)' },
            'blockchain': { text: '#50cf66', bg: 'rgba(80, 207, 102, 0.25)' },
            'forensics': { text: '#5473e1', bg: 'rgba(84, 115, 225, 0.25)' },
            'hardware': { text: '#d1d0d1', bg: 'rgba(209, 208, 209, 0.25)' },
            'mobile': { text: '#f16594', bg: 'rgba(241, 101, 148, 0.25)' },
            'ai': { text: '#94d82c', bg: 'rgba(148, 216, 44, 0.25)' },
            'redteam': { text: '#cd5de8', bg: 'rgba(205, 93, 232, 0.25)' },
            'pentest': { text: '#cd5de8', bg: 'rgba(205, 93, 232, 0.25)' },
            'osint': { text: '#ff922b', bg: 'rgba(255, 146, 43, 0.25)' },
            'ppc': { text: '#9C27B0', bg: 'rgba(156, 39, 176, 0.25)' }
          };
          const style = colors[category.toLowerCase()] || { text: '#329af1', bg: 'rgba(50, 154, 241, 0.25)' };
          return `color: ${style.text} !important; background: ${style.bg} !important; border: 1px solid ${style.text}20 !important;`;
        },
        
        getCategoryIcon(category) {
          const icons = {
            'web': 'fas fa-globe',
            'crypto': 'fas fa-lock',
            'pwn': 'fas fa-bug',
            'reverse': 'fas fa-cogs',
            'forensics': 'fas fa-search',
            'misc': 'fas fa-puzzle-piece',
            'blockchain': 'fas fa-link',
            'hardware': 'fas fa-microchip',
            'mobile': 'fas fa-mobile-alt',
            'ppc': 'fas fa-code',
            'ai': 'fas fa-robot',
            'pentest': 'fas fa-user-secret',
            'redteam': 'fas fa-user-secret',
            'osint': 'fas fa-eye'
          };
          return icons[category.toLowerCase()] || 'fas fa-flag';
        },
        
        getSolveCount(standing) {
          let count = 0;
          for (const challenge of this.challenges) {
            const solves = this.solveData[challenge.id];
            if (solves && solves.length > 0) {
              const solved = solves.find(s => s.account_id === standing.account_id);
              if (solved) {
                count++;
              }
            }
          }
          return count;
        },
        
        getCategoryColor(category) {
          const colors = {
            'misc': '#20c897',
            'crypto': '#845ef7',
            'pwn': '#ff6b6b',
            'web': '#329af1',
            'reverse': '#fdc419',
            'blockchain': '#50cf66',
            'forensics': '#5473e1',
            'hardware': '#d1d0d1',
            'mobile': '#f16594',
            'ai': '#94d82c',
            'redteam': '#cd5de8',
            'pentest': '#cd5de8',
            'osint': '#ff922b',
            'ppc': '#9C27B0'
          };
          return colors[category.toLowerCase()] || '#329af1';
        },
        
        getTeamColor(name) {
          const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8B500', '#00CED1', '#FF7F50', '#20B2AA', '#9370DB',
            '#3CB371', '#FFD700', '#48D1CC', '#C71585', '#00FA9A'
          ];
          let hash = 0;
          for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
          }
          return colors[Math.abs(hash) % colors.length];
        },
        
        getSolveDate(standing, challenge) {
          const solves = this.solveData[challenge.id];
          if (!solves || solves.length === 0) return '';
          
          const solve = solves.find(s => s.account_id === standing.account_id);
          if (!solve) return '';
          
          const date = new Date(solve.date);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          
          return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        },
        
        getSolveStatus(standing, challenge) {
          const solves = this.solveData[challenge.id];
          if (!solves || solves.length === 0) return 'unsolved';
          
          const solve = solves.find(s => s.account_id === standing.account_id);
          if (!solve) return 'unsolved';
          
          const solveIndex = solves.findIndex(s => s.account_id === standing.account_id);
          if (solveIndex === 0) return 'first';
          if (solveIndex === 1) return 'second';
          if (solveIndex === 2) return 'third';
          return 'solved';
        }
      }));

      Alpine.data("SolveTooltip", () => ({
        showTooltip: false,
      }));
    });
