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
            // 找到第一個部分作為 session 名稱
            let sessionPart = parts[0]; 
            if (trimmedLine.includes("補錄")) {
                currentSession = sessionPart + " 補錄";
            } else {
                currentSession = sessionPart;
            }
            // 找到最後一個部分作為 URL
            currentUrl = parts[parts.length - 1]; 
        } 
        // 檢查是否為歌曲時間戳記行 (非空且包含 ":" 且不以 "#" 開頭)
        else if (trimmedLine && trimmedLine.includes(":") && !trimmedLine.startsWith("#")) {
            try {
                // 找出第一個空白字元作為時間戳記和歌名的分隔
                const firstSpaceIndex = trimmedLine.indexOf(' ');
                if (firstSpaceIndex === -1) continue; // 如果沒有空白字元，跳過

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

    if (!performancesData || Object.keys(performancesData).length === 0) {
        resultsDiv.innerHTML = '<p>請先上傳 song_list.txt 檔案並等待解析。</p>';
        return;
    }

    const foundPerformances = performancesData[songName];

    if (foundPerformances && foundPerformances.length > 0) {
        const ul = document.createElement('ul');
        resultsDiv.innerHTML = `<h3>找到 '${songName}' 的演唱記錄：</h3>`;
        foundPerformances.forEach(perf => {
            const li = document.createElement('li');
            const seconds = timeToSeconds(perf.timestamp);
            const youtubeUrl = `${perf.url}?t=${seconds}`;
            li.innerHTML = `${perf.session} - <a href="${youtubeUrl}" target="_blank">${youtubeUrl}</a>`;
            ul.appendChild(li);
        });
        resultsDiv.appendChild(ul);
    } else {
        resultsDiv.innerHTML = `<p>找不到 '${songName}' 的演唱記錄。</p>`;
    }
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('songListFile');
    const searchButton = document.getElementById('searchButton');
    const songNameInput = document.getElementById('songNameInput');

    // 處理檔案上傳
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    performancesData = parsePerformances(e.target.result);
                    alert('song_list.txt 檔案已成功載入並解析！');
                } catch (error) {
                    alert('解析檔案時發生錯誤，請檢查檔案格式。');
                    console.error('檔案解析錯誤:', error);
                }
            };
            reader.readAsText(file, 'UTF-8'); // 指定 UTF-8 編碼
        }
    });

    // 處理搜尋按鈕點擊
    searchButton.addEventListener('click', () => {
        const songName = songNameInput.value.trim();
        if (songName) {
            searchSong(songName);
        } else {
            document.getElementById('searchResults').innerHTML = '<p>請輸入要搜尋的歌名。</p>';
        }
    });

    // 允許按 Enter 鍵搜尋
    songNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });
});