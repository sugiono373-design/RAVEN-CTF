// HTML escape helper to prevent XSS in user-generated content
    function escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    document.addEventListener('alpine:init', () => {
      // UserStats Alpine component
      // Combined UserActivityCard component
      Alpine.data('UserActivityCard', () => ({
        // User stats
        userScore: null,
        solvedCount: 0,
        userRank: "-",
        totalChallenges: 0,
        
        // Activity feed
        activities: [],
        activeTab: 'all',
        
        // Realtime polling
        pollInterval: null,
        lastNotificationCount: 0,
        hasNewNotifications: false,
        isRefreshing: false,
        
        async init() {
          await Promise.all([
            this.loadUserStats(),
            this.loadAllActivities()
          ]);
          
          // Store initial count
          this.lastNotificationCount = this.activities.length;
          
          // Start realtime polling (every 15 seconds)
          this.startPolling();
        },
        
        startPolling() {
          // Poll every 15 seconds for new notifications
          this.pollInterval = setInterval(async () => {
            await this.checkForUpdates();
          }, 15000);
          
          // Also listen for window focus to refresh
          window.addEventListener('focus', () => {
            this.checkForUpdates();
          });
        },
        
        stopPolling() {
          if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
          }
        },
        
        async checkForUpdates() {
          if (this.isRefreshing) return;
          this.isRefreshing = true;
          
          try {
            const oldIds = new Set(this.activities.map(a => a.id));
            await this.loadAllActivities();
            
            const newItems = this.activities.filter(a => !oldIds.has(a.id));
            
            if (newItems.length > 0) {
              this.hasNewNotifications = true;
              

              const itemsToToast = newItems.filter(item => {
                if (item.type === 'notification' || item.type === 'hint' || item.type === 'new_challenge') {
                  return true;
                }
                if (item.type === 'first_blood' || item.type === 'second_blood' || item.type === 'third_blood') {
                  return true;
                }
                if (item.type === 'solve') {
                  return item.rank && item.rank <= 3;
                }
                return false;
              });
              
              itemsToToast.forEach(item => {
                this.showToast(item);
              });
              
              if (newItems.some(item => item.type === 'new_challenge')) {
                window.dispatchEvent(new CustomEvent('load-challenges'));
              }
            }
            
            await this.loadUserStats();
            
          } catch (error) {
            // Error checking for updates silently handled
          } finally {
            this.isRefreshing = false;
          }
        },
        
        showToast(item) {
          let iconHtml = '';
          if (item.type === 'first_blood') {
            iconHtml = '<span class="blood-hexagon-small blood-hexagon-gold"></span>';
          } else if (item.type === 'second_blood') {
            iconHtml = '<span class="blood-hexagon-small blood-hexagon-silver"></span>';
          } else if (item.type === 'third_blood') {
            iconHtml = '<span class="blood-hexagon-small blood-hexagon-bronze"></span>';
          } else if (item.type === 'solve') {
            iconHtml = '<span class="solve-check"><i class="fas fa-check"></i></span>';
          } else if (item.type === 'hint') {
            iconHtml = '<i class="fas fa-lightbulb"></i>';
          } else if (item.type === 'new_challenge') {
            iconHtml = '<i class="fas fa-plus"></i>';
          } else if (item.type === 'notification') {
            iconHtml = '<i class="fas fa-bell"></i>';
          }
          
          // Create toast notification
          const toast = document.createElement('div');
          toast.className = 'realtime-toast';
          toast.innerHTML = `
            <div class="toast-icon ${item.type}">
              ${iconHtml}
            </div>
            <div class="toast-content">
              <div class="toast-message">${item.message}</div>
              <div class="toast-time">${item.date}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
              <i class="fas fa-times"></i>
            </button>
          `;
          
          // Add to container
          let container = document.querySelector('.toast-container');
          if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
          }
          
          container.appendChild(toast);
          
          this.playNotificationSound();
          
          setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 300);
          }, 5000);
        },
        
        playNotificationSound() {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
          } catch (e) {
          }
        },
        
        async loadUserStats() {
          try {
            const userResponse = await CTFd.fetch('/api/v1/users/me');
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success) {
                this.userScore = userData.data.score;
                this.userRank = userData.data.place || '-';
              }
            }
            
            const solvesResponse = await CTFd.fetch('/api/v1/users/me/solves');
            if (solvesResponse.ok) {
              const solvesData = await solvesResponse.json();
              if (solvesData.success) {
                this.solvedCount = solvesData.meta.count;
              }
            }
            
            const challengesResponse = await CTFd.fetch('/api/v1/challenges');
            if (challengesResponse.ok) {
              const challengesData = await challengesResponse.json();
              if (challengesData.success) {
                this.totalChallenges = challengesData.data.length;
              }
            }
          } catch (error) {
            console.log('Error loading user stats:', error);
          }
        },
        
        formatDate(dateStr) {
          const date = new Date(dateStr);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear()).slice(-2);
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        },
        
        async loadAllActivities() {
          const allActivities = [];
          
          try {
            const notifResponse = await CTFd.fetch('/api/v1/notifications');
            if (notifResponse.ok) {
              const notifData = await notifResponse.json();
              if (notifData.success && notifData.data) {
                notifData.data.forEach(notif => {
                  let type = 'notification';
                  let message = notif.content || notif.title;
                  
                  if (message.toLowerCase().includes('hint')) {
                    type = 'hint';
                    message = `Hint for <strong>${notif.title || 'challenge'}</strong> has been updated.`;
                  } else if (message.toLowerCase().includes('first blood')) {
                    type = 'first_blood';
                  } else if (message.toLowerCase().includes('new challenge')) {
                    type = 'new_challenge';
                    message = `New challenge <strong>${notif.title || ''}</strong> has been released.`;
                  }
                  
                  allActivities.push({
                    id: 'notif-' + notif.id,
                    type: type,
                    date: this.formatDate(notif.date),
                    message: message,
                    rawDate: new Date(notif.date),
                    category: type === 'hint' ? 'hints' : (type === 'new_challenge' ? 'challenges' : 'notifications')
                  });
                });
              }
            }
            
            const scoreboardResponse = await CTFd.fetch('/api/v1/scoreboard/top/10');
            if (scoreboardResponse.ok) {
              const scoreboardData = await scoreboardResponse.json();
              if (scoreboardData.success) {
                let challengesMap = {};
                try {
                  const challengesResponse = await CTFd.fetch('/api/v1/challenges');
                  if (challengesResponse.ok) {
                    const challengesData = await challengesResponse.json();
                    if (challengesData.success) {
                      challengesMap = challengesData.data.reduce((map, c) => {
                        map[c.id] = c.name;
                        return map;
                      }, {});
                    }
                  }
                } catch (e) {}
                
                const challengeSolves = {};
                const isTeamMode = CTFd.config.userMode === 'teams';
                
                for (const entry of Object.values(scoreboardData.data)) {
                  if (entry.solves && entry.solves.length > 0) {
                    entry.solves.forEach(solve => {
                      if (solve.challenge_id === null) return;
                      
                      if (!challengeSolves[solve.challenge_id]) {
                        challengeSolves[solve.challenge_id] = [];
                      }
                      
                      challengeSolves[solve.challenge_id].push({
                        team: isTeamMode ? entry.name : undefined,
                        user: !isTeamMode ? entry.name : undefined,
                        teamId: isTeamMode ? entry.id : undefined,
                        userId: !isTeamMode ? entry.id : undefined,
                        date: new Date(solve.date),
                        rawDate: solve.date
                      });
                    });
                  }
                }
                
                for (const challengeId in challengeSolves) {
                  challengeSolves[challengeId].sort((a, b) => a.date - b.date);
                  
                  challengeSolves[challengeId].forEach((solve, index) => {
                    solve.rank = index + 1;
                  });
                }
                
                for (const challengeId in challengeSolves) {
                  challengeSolves[challengeId].forEach(solve => {
                    const challengeName = challengesMap[challengeId] || `Challenge ${challengeId}`;
                    const rank = solve.rank;
                    
                    let message = '';
                    let type = 'solve';
                    
                    const safeName = isTeamMode ? escapeHtml(solve.team) : escapeHtml(solve.user);
                    const safeChallenge = escapeHtml(challengeName);
                    const nameLabel = isTeamMode ? 'team' : 'user';

                    if (rank === 1) {
                      message = `Congratulations to ${nameLabel} <strong>${safeName}</strong> for first blood the challenge <strong>${safeChallenge}</strong>.`;
                      type = 'first_blood';
                    } else if (rank === 2) {
                      message = `${isTeamMode ? 'Team' : 'User'} <strong>${safeName}</strong> solved <strong>${safeChallenge}</strong>`;
                      type = 'second_blood';
                    } else if (rank === 3) {
                      message = `${isTeamMode ? 'Team' : 'User'} <strong>${safeName}</strong> solved <strong>${safeChallenge}</strong>`;
                      type = 'third_blood';
                    } else {
                      message = `${isTeamMode ? 'Team' : 'User'} <strong>${safeName}</strong> solved <strong>${safeChallenge}</strong>.`;
                      type = 'solve';
                    }
                    
                    allActivities.push({
                      id: `solve-${solve.teamId || solve.userId}-${challengeId}-${solve.rawDate}`,
                      type: type,
                      rank: rank,
                      date: this.formatDate(solve.rawDate),
                      message: message,
                      rawDate: solve.date,  
                      category: 'challenges'
                    });
                  });
                }
              }
            }
            
            this.activities = allActivities.sort((a, b) => b.rawDate - a.rawDate);
            
          } catch (error) {
            // Error loading activities silently handled
            this.activities = [];
          }
        },
        
        getFilteredActivities() {
          if (this.activeTab === 'all') {
            return this.activities.slice(0, 20);
          }
          return this.activities
            .filter(a => a.category === this.activeTab)
            .slice(0, 20);
        }
      }));
      
      Alpine.data('UserStats', () => ({
        userScore: null,
        solvedCount: 0,
        userRank: null,
        totalChallenges: 0,
        
        async loadUserStats() {
          try {
            const userResponse = await CTFd.fetch('/api/v1/users/me');
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success) {
                this.userScore = userData.data.score;
                this.userRank = userData.data.place ? `#${userData.data.place}` : '#-';
              }
            }
            
            const solvesResponse = await CTFd.fetch('/api/v1/users/me/solves');
            if (solvesResponse.ok) {
              const solvesData = await solvesResponse.json();
              if (solvesData.success) {
                this.solvedCount = solvesData.meta.count;
              }
            }
            
            const challengesResponse = await CTFd.fetch('/api/v1/challenges');
            if (challengesResponse.ok) {
              const challengesData = await challengesResponse.json();
              if (challengesData.success) {
                this.totalChallenges = challengesData.data.length;
              }
            }
          } catch (error) {
            console.log('Error loading user stats:', error);
          }
        }
      }));
    });
