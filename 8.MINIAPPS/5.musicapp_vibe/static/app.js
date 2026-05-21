/* ==========================================================================
   VIBE MUSIC SNS - CLIENT SIDE ORCHESTRATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initRealtimeNotifications();
    initMusicSearch();
    initCustomAudioPlayer();
    initLikeButtons();
    initNotificationActions();
});

// ==========================================
// 1. REAL-TIME SSE NOTIFICATION LISTENER
// ==========================================
function initRealtimeNotifications() {
    const badge = document.getElementById('notif-badge');
    const toastContainer = document.getElementById('toast-container');
    
    // Connect to Server-Sent Events (SSE) notification stream
    const source = new EventSource('/api/notifications/stream');
    
    source.addEventListener('connect', (e) => {
        console.log('SSE Stream: Connected to real-time notification engine.');
    });
    
    source.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (!payload || !payload.sender) return;
        
        console.log('SSE Stream: New notification received:', payload);
        
        // 1. Increment Navigation badge count
        if (badge) {
            let count = parseInt(badge.textContent.trim()) || 0;
            count += 1;
            badge.textContent = count;
            badge.style.display = 'inline-block';
        }
        
        // 2. Spawn a beautiful Toast alert
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = 'toast-alert';
            toast.innerHTML = `
                <img class="toast-artwork" src="${payload.artwork_url || 'https://via.placeholder.com/60'}" alt="cover">
                <div class="toast-content">
                    <div class="toast-msg"><strong>${payload.sender}</strong> ${payload.message}</div>
                    <div class="toast-time">${payload.timestamp}</div>
                </div>
                <button class="toast-close">&times;</button>
            `;
            
            // Close toast button
            toast.querySelector('.toast-close').addEventListener('click', () => {
                toast.remove();
            });
            
            // Clicking the toast redirects to the song detail
            toast.addEventListener('click', (e) => {
                if (!e.target.classList.contains('toast-close')) {
                    window.location.href = `/song/${payload.song_id}`;
                }
            });
            
            toastContainer.appendChild(toast);
            
            // Play a soft dynamic system note (non-blocking)
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            } catch (err) {
                // Ignore audio context blocker
            }
            
            // Self-destruct toast after 7.5 seconds
            setTimeout(() => {
                toast.style.animation = 'slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) reverse forwards';
                setTimeout(() => toast.remove(), 300);
            }, 7500);
        }
        
        // 3. Dynamic reload of notifications page if currently open
        const notifPageList = document.getElementById('notifications-page-list');
        if (notifPageList) {
            // Prepend a fresh item to the list
            const emptyState = document.getElementById('notif-empty-state');
            if (emptyState) emptyState.remove();
            
            const li = document.createElement('li');
            li.className = 'comment-card unread-notif';
            li.innerHTML = `
                <div class="comment-meta">
                    <span class="comment-author">${payload.sender}</span>
                    <span class="comment-time">${payload.timestamp}</span>
                </div>
                <div class="comment-body">
                    내가 좋아요 한 노래 <a href="/song/${payload.song_id}" style="color: var(--primary-cyan); font-weight: 600;">${payload.song_title}</a>에 새로운 댓글을 남겼습니다.
                </div>
            `;
            notifPageList.insertBefore(li, notifPageList.firstChild);
        }
    };
    
    source.onerror = (error) => {
        console.warn('SSE Stream: Disconnected or server closed. ReadyState:', source.readyState);
    };
}

// ==========================================
// 2. SEARCH BOX & AUTO-COMPLETE DEBOUNCER
// ==========================================
function initMusicSearch() {
    const input = document.getElementById('search-input');
    const spinner = document.getElementById('search-spinner');
    const container = document.getElementById('search-results-container');
    const exploreFeed = document.getElementById('explore-feed');
    
    if (!input || !container) return;
    
    let debounceTimer;
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);
        
        if (query.length < 2) {
            container.innerHTML = '';
            if (exploreFeed) exploreFeed.style.display = 'block';
            return;
        }
        
        if (spinner) spinner.style.display = 'block';
        if (exploreFeed) exploreFeed.style.display = 'none';
        
        debounceTimer = setTimeout(() => {
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    if (spinner) spinner.style.display = 'none';
                    renderSearchResults(data);
                })
                .catch(err => {
                    if (spinner) spinner.style.display = 'none';
                    console.error('Search failed:', err);
                });
        }, 350);
    });
}

function renderSearchResults(tracks) {
    const container = document.getElementById('search-results-container');
    if (!container) return;
    
    if (!tracks || tracks.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;">
                검색 결과가 없습니다. 다른 곡을 검색해 보세요.
            </div>
        `;
        return;
    }
    
    container.innerHTML = tracks.map(track => `
        <div class="song-card">
            <div class="artwork-wrapper">
                <img class="artwork-image" src="${track.artworkUrl || 'https://via.placeholder.com/300'}" alt="${track.trackName}">
            </div>
            <div class="song-info">
                <h4 class="song-title" title="${track.trackName}">${track.trackName}</h4>
                <div class="song-artist" title="${track.artistName}">${track.artistName}</div>
                <div class="song-album" title="${track.collectionName}">${track.collectionName}</div>
            </div>
            <div class="song-card-actions">
                <a href="/song/${track.trackId}" class="view-btn">Vibe 보기 &rarr;</a>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 3. INLINE HTML5 AUDIO PREVIEW CONTROLLER
// ==========================================
let globalAudio = null;
let currentPlayButton = null;

function initCustomAudioPlayer() {
    const playBtn = document.getElementById('detail-play-btn');
    const vinyl = document.getElementById('vinyl-disc');
    
    if (!playBtn) return;
    
    const previewUrl = playBtn.dataset.previewUrl;
    
    playBtn.addEventListener('click', () => {
        if (!previewUrl) {
            alert('이 곡은 1분 미리듣기를 제공하지 않습니다.');
            return;
        }
        
        // Stop current audio if playing elsewhere
        if (globalAudio && currentPlayButton !== playBtn) {
            globalAudio.pause();
            if (currentPlayButton) {
                currentPlayButton.innerHTML = '&#9658;'; // Play symbol
            }
            const activeVinyls = document.querySelectorAll('.vinyl-disc');
            activeVinyls.forEach(v => v.classList.remove('playing'));
        }
        
        if (globalAudio && !globalAudio.paused && currentPlayButton === playBtn) {
            // Already playing this song, pause it
            globalAudio.pause();
            playBtn.innerHTML = '&#9658;'; // Play symbol
            if (vinyl) vinyl.classList.remove('playing');
        } else {
            // Play or resume
            if (!globalAudio || currentPlayButton !== playBtn) {
                globalAudio = new Audio(previewUrl);
                currentPlayButton = playBtn;
            }
            
            globalAudio.play()
                .then(() => {
                    playBtn.innerHTML = '&#10074;&#10074;'; // Pause symbol
                    if (vinyl) vinyl.classList.add('playing');
                })
                .catch(err => {
                    console.error('Audio failed to play:', err);
                    alert('미리듣기 재생에 실패했습니다.');
                });
                
            globalAudio.onended = () => {
                playBtn.innerHTML = '&#9658;';
                if (vinyl) vinyl.classList.remove('playing');
            };
        }
    });
}

// ==========================================
// 4. AJAX LIKE TOGGLE SYSTEM
// ==========================================
function initLikeButtons() {
    const likeBtn = document.getElementById('like-btn');
    if (!likeBtn) return;
    
    likeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const trackId = likeBtn.dataset.trackId;
        
        fetch(`/song/${trackId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (res.redirected) {
                // If flask redirects us, it means login is required
                window.location.href = res.url;
                return;
            }
            return res.json();
        })
        .then(data => {
            if (!data) return;
            
            const likeIcon = document.getElementById('like-icon');
            const countLabel = document.getElementById('likes-count-label');
            
            if (data.liked) {
                likeBtn.classList.add('liked');
                if (likeIcon) likeIcon.innerHTML = '&#9829;'; // Filled heart
                likeBtn.style.color = '#ff1744';
            } else {
                likeBtn.classList.remove('liked');
                if (likeIcon) likeIcon.innerHTML = '&#9825;'; // Empty heart
                likeBtn.style.color = 'var(--text-white)';
            }
            
            if (countLabel) {
                countLabel.textContent = `${data.likes_count} Likes`;
            }
        })
        .catch(err => console.error('Like toggle failed:', err));
    });
}

// ==========================================
// 5. NOTIFICATION READ STATE AXIS
// ==========================================
function initNotificationActions() {
    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
            fetch('/api/notifications/read-all', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Mark all UI lists as read
                        const unreads = document.querySelectorAll('.unread-notif');
                        unreads.forEach(el => el.classList.remove('unread-notif'));
                        
                        // Set badge to 0 or hide
                        const badge = document.getElementById('notif-badge');
                        if (badge) badge.style.display = 'none';
                    }
                })
                .catch(err => console.error('Read-all notification failed:', err));
        });
    }
}

// ==========================================
// 6. GLOBAL UTILITY TOAST NOTIFIER
// ==========================================
window.showToast = function(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast-alert';
    if (type === 'error') {
        toast.style.border = '1px solid var(--danger)';
        toast.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 23, 68, 0.25)';
    } else {
        toast.style.border = '1px solid var(--border-active)';
        toast.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5), var(--shadow-cyan)';
    }
    
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const icon = type === 'error' ? '❌' : '✅';
    
    toast.innerHTML = `
        <div style="font-size: 1.2rem; padding: 0.2rem 0.4rem;">${icon}</div>
        <div class="toast-content">
            <div class="toast-msg">${message}</div>
            <div class="toast-time">${timeString}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    toastContainer.appendChild(toast);
    
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === 'error') {
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        } else {
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        }
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (err) {}
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
};
