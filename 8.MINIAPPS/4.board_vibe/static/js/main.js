/* Board Vibe Premium Interactions & Frontend Script */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------
    // 1. 요소 셀렉터 설정
    // ----------------------------------
    const form = document.getElementById('vibe-form');
    const titleInput = document.getElementById('title');
    const messageInput = document.getElementById('message');
    const titleCounter = document.getElementById('title-counter');
    const messageCounter = document.getElementById('message-counter');
    const searchInput = document.getElementById('search-input');
    const cardsGrid = document.getElementById('cards-grid');
    const emptyState = document.getElementById('empty-state');
    const noSearchResults = document.getElementById('no-search-results');
    const vibesCountEl = document.getElementById('vibes-count');
    const dateElements = document.querySelectorAll('.card-date');

    // ----------------------------------
    // 2. 글자 수 실시간 카운터 및 유효성 피드백
    // ----------------------------------
    const setupCharCounter = (inputEl, counterEl, maxLength) => {
        const updateCounter = () => {
            const currentLen = inputEl.value.length;
            counterEl.textContent = `${currentLen} / ${maxLength}`;
            
            // 한계치에 다다르면 경고 컬러 부여 (90% 이상 입력 시)
            if (currentLen >= maxLength * 0.9) {
                counterEl.classList.add('warning');
            } else {
                counterEl.classList.remove('warning');
            }
        };

        inputEl.addEventListener('input', updateCounter);
        // 초기 로드 시 카운트 적용
        updateCounter();
    };

    if (titleInput && titleCounter) setupCharCounter(titleInput, titleCounter, 80);
    if (messageInput && messageCounter) setupCharCounter(messageInput, messageCounter, 500);

    // ----------------------------------
    // 3. 입력 폼 유효성 검증 및 쉐이크 애니메이션
    // ----------------------------------
    if (form) {
        form.addEventListener('submit', (e) => {
            let isValid = true;
            
            // 앞뒤 공백 제거 후 빈 값 검증
            if (!titleInput.value.trim()) {
                shakeElement(titleInput);
                isValid = false;
            }
            if (!messageInput.value.trim()) {
                shakeElement(messageInput);
                isValid = false;
            }

            if (!isValid) {
                e.preventDefault();
            }
        });
    }

    // 요소 흔들기 효과 (시각적 피드백)
    function shakeElement(element) {
        element.style.animation = 'none';
        // 강제 리플로우 유발
        element.offsetHeight; 
        element.style.animation = 'shake 0.4s ease-in-out';
        element.focus();
        
        // 애니메이션 끝나면 인라인 스타일 삭제
        setTimeout(() => {
            element.style.animation = '';
        }, 400);
    }

    // Shake CSS 애니메이션 동적 삽입
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
        }
    `;
    document.head.appendChild(styleSheet);

    // ----------------------------------
    // 4. 실시간 바닐라 JS 카드 검색 필터링 (초고속 반응)
    // ----------------------------------
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.vibe-card');
            let visibleCount = 0;

            cards.forEach(card => {
                const searchContent = card.getAttribute('data-search-content') || '';
                
                if (searchContent.includes(query)) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // 화면에 보이는 카드 개수 통계 갱신
            if (vibesCountEl) {
                vibesCountEl.textContent = visibleCount;
            }

            // 검색 결과 화면 처리
            if (cards.length > 0) {
                if (visibleCount === 0) {
                    noSearchResults.classList.remove('hidden');
                    if (cardsGrid) cardsGrid.classList.add('hidden');
                } else {
                    noSearchResults.classList.add('hidden');
                    if (cardsGrid) cardsGrid.classList.remove('hidden');
                }
            }
        });
    }

    // ----------------------------------
    // 5. 날짜 포맷 고급화 (상대 시간: 방금 전, 몇 분 전 등)
    // ----------------------------------
    const getRelativeTime = (dateString) => {
        // SQLite 날짜는 UTC 기준으로 오므로 로컬 타임존 변환을 염두에 둡니다.
        // 포맷 형태: 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DDTHH:MM:SSZ' 형식으로 보정하여 UTC 인식시킴
        const formattedDateString = dateString.replace(' ', 'T') + 'Z';
        const date = new Date(formattedDateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (isNaN(date.getTime())) {
            return dateString; // 변환 불가시 원본 출력
        }

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        // 미래 시간이 찍히거나 로컬 타임존 오차로 마이너스가 나면 '방금 전' 처리
        if (diffInSeconds < 5) {
            return '방금 전';
        }

        let counter;
        for (const [key, value] of Object.entries(intervals)) {
            counter = Math.floor(diffInSeconds / value);
            if (counter > 0) {
                if (key === 'year') return `${counter}년 전`;
                if (key === 'month') return `${counter}달 전`;
                if (key === 'week') return `${counter}주 전`;
                if (key === 'day') return `${counter}일 전`;
                if (key === 'hour') return `${counter}시간 전`;
                if (key === 'minute') return `${counter}분 전`;
            }
        }
        return `${diffInSeconds}초 전`;
    };

    dateElements.forEach(el => {
        const rawTime = el.getAttribute('data-utc-time');
        if (rawTime) {
            el.textContent = getRelativeTime(rawTime);
            // 정밀 표시용 툴팁 추가
            el.setAttribute('title', new Date(rawTime.replace(' ', 'T') + 'Z').toLocaleString('ko-KR'));
        }
    });

    // ----------------------------------
    // 6. 삭제 시 부드러운 아웃 애니메이션 처리
    // ----------------------------------
    const deleteForms = document.querySelectorAll('.delete-form');
    deleteForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // 즉시 제출 중단
            
            // 프리미엄 브라우저 컨펌
            const confirmDelete = confirm("이 바이브를 정말로 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.");
            
            if (confirmDelete) {
                const card = form.closest('.vibe-card');
                
                // 삭제 페이드 아웃 애니메이션 적용
                card.classList.add('card-exit');
                
                // 애니메이션 시간(400ms) 대기 후 폼 제출 실행
                setTimeout(() => {
                    form.submit();
                }, 400);
            }
        });
    });
});
