// 全域變數來儲存解析後的歌曲資料
let performancesData = {};

/**
 * 將時間字串轉換為秒數。
 * @param {string} timeStr - 時間字串，格式為 'MM:SS' 或 'HH:MM:SS'。
 * @returns {number} - 轉換後的總秒數。
 */
function timeToSeconds(timeStr) {
    if (!timeStr || timeStr.indexOf(':') === -1) {
        return 0;
    }

    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
}

/**
 * 解析 song_list.txt 的內容，建立歌曲表演資料物件。
 * @param {string} fileContent - song_list.txt 的完整內容。
 * @returns {Object} - 解析後的歌曲表演資料。
 */
function parsePerformances(fileContent) {
    const performances = {};
    let currentSession = "";
    let currentUrl = "";

    const lines = fileContent.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();

        // 檢查是否為包含 YouTube 連結的行
        if (trimmedLine.includes("https://youtu.be/")) {
            const parts = trimmedLine.split(/\s+/); // 使用空白字符分割
            let sessionPart = parts[0]; 
            if (trimmedLine.includes("補錄")) {
                currentSession = sessionPart + " 補錄";
            } else {
                currentSession = sessionPart;
            }
            currentUrl = parts[parts.length - 1]; 
        } 
        // 檢查是否為歌曲時間戳記行 (非空且包含 ":" 且不以 "#" 開頭)
        else if (trimmedLine && trimmedLine.includes(":") && !trimmedLine.startsWith("#")) {
            try {
                const firstSpaceIndex = trimmedLine.indexOf(' ');
                if (firstSpaceIndex === -1) continue; 

                const timestamp = trimmedLine.substring(0, firstSpaceIndex);
                const song = trimmedLine.substring(firstSpaceIndex + 1);

                if (!performances[song]) {
                    performances[song] = [];
                }
                performances[song].push({
                    session: currentSession,
                    url: currentUrl,
                    timestamp: timestamp
                });
            } catch (e) {
                console.error("解析歌曲行時發生錯誤:", e, "行內容:", trimmedLine);
                continue;
            }
        }
    }
    return performances;
}

/**
 * 根據歌名搜尋歌曲並顯示結果。
 * @param {string} songName - 要搜尋的歌名。
 */
function searchSong(songName) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = ''; // 清空之前的結果
    document.getElementById('loadingStatus').style.display = 'none'; // 搜尋時隱藏載入狀態

    if (!performancesData || Object.keys(performancesData).length === 0) {
        resultsDiv.innerHTML = '<p class="status-message error">歌曲資料尚未載入或載入失敗，請稍後再試。</p>';
        return;
    }

    const foundPerformances = performancesData[songName];

    if (foundPerformances && foundPerformances.length > 0) {
        const ul = document.createElement('ul');
        resultsDiv.innerHTML = `<h3>找到 '${songName}' 的演唱記錄：</h3>`;
        foundPerformances.forEach(perf => {
            const li = document.createElement('li');
            const seconds = timeToSeconds(perf.timestamp);
            const youtubeUrl = `${perf.url}?t=${seconds}`; // 結合時間戳記
            li.innerHTML = `<strong>${perf.session}</strong><br><a href="${youtubeUrl}" target="_blank">${youtubeUrl}</a>`;
            ul.appendChild(li);
        });
        resultsDiv.appendChild(ul);
    } else {
        resultsDiv.innerHTML = `<p class="status-message info">找不到 '${songName}' 的演唱記錄。</p>`;
    }
}

// 頁面載入時自動載入 song_list.txt
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const songNameInput = document.getElementById('songNameInput');
    const resultsDiv = document.getElementById('searchResults');
    const loadingStatusDiv = document.getElementById('loadingStatus');

    loadingStatusDiv.style.display = 'block'; // 顯示載入狀態
    loadingStatusDiv.textContent = '載入歌曲資料中...';

    fetch('song_list.txt')
        .then(response => {
            if (!response.ok) {
                // 如果檔案不存在或 HTTP 錯誤
                throw new Error(`無法載入 song_list.txt (HTTP 狀態: ${response.status})。請確認檔案是否存在於相同目錄。`);
            }
            return response.text();
        })
        .then(data => {
            performancesData = parsePerformances(data);
            loadingStatusDiv.textContent = '歌曲資料已載入，請輸入歌名搜尋。';
            loadingStatusDiv.style.backgroundColor = '#d4edda'; // 成功綠色背景
            loadingStatusDiv.style.color = '#155724'; // 成功綠色文字
            console.log('song_list.txt 檔案成功載入並解析！');
        })
        .catch(error => {
            loadingStatusDiv.textContent = `載入歌曲資料失敗: ${error.message}`;
            loadingStatusDiv.style.backgroundColor = '#f8d7da'; // 錯誤紅色背景
            loadingStatusDiv.style.color = '#721c24'; // 錯誤紅色文字
            console.error('載入 song_list.txt 時發生錯誤:', error);
        })
        .finally(() => {
            // 無論成功或失敗，一段時間後隱藏載入訊息，或者在使用者開始搜尋後隱藏
            setTimeout(() => {
                loadingStatusDiv.style.display = 'none';
            }, 5000); // 5 秒後自動隱藏訊息
        });

    // 處理搜尋按鈕點擊
    searchButton.addEventListener('click', () => {
        const songName = songNameInput.value.trim();
        if (songName) {
            searchSong(songName);
        } else {
            resultsDiv.innerHTML = '<p class="status-message info">請輸入要搜尋的歌名。</p>';
        }
    });

    // 允許按 Enter 鍵搜尋
    songNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });
});