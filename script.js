// 全域變數來儲存解析後的歌曲資料
let performancesData = {};

// ... (timeToSeconds 函式不變) ...

/**
 * 解析 song_list.txt 的內容，建立歌曲表演資料物件。
 * @param {string} fileContent - song_list.txt 的完整內容。
 * @returns {Object} - 解析後的歌曲表演資料。
 */
function parsePerformances(fileContent) {
    console.log("parsePerformances: 開始解析檔案內容...");
    // 檢查收到的檔案內容是否為字串
    if (typeof fileContent !== 'string') {
        console.error("parsePerformances: 檔案內容不是字串類型！", fileContent);
        return {};
    }
    console.log("parsePerformances: 檔案內容長度:", fileContent.length); // 輸出內容長度
    // console.log("parsePerformances: 檔案內容前500字元:", fileContent.substring(0, 500)); // 輸出部分內容，方便檢查

    const performances = {};
    let currentSession = "";
    let currentUrl = "";

    const lines = fileContent.split('\n');
    console.log("parsePerformances: 總行數:", lines.length);

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.includes("https://youtu.be/")) {
            const parts = trimmedLine.split(/\s+/);
            let sessionPart = parts[0]; 
            if (trimmedLine.includes("補錄")) {
                currentSession = sessionPart + " 補錄";
            } else {
                currentSession = sessionPart;
            }
            currentUrl = parts[parts.length - 1]; 
            console.log(`parsePerformances: 偵測到新場次: ${currentSession}, URL: ${currentUrl}`);
        } 
        else if (trimmedLine && trimmedLine.includes(":") && !trimmedLine.startsWith("#")) {
            try {
                const firstSpaceIndex = trimmedLine.indexOf(' ');
                if (firstSpaceIndex === -1) {
                    console.warn("parsePerformances: 忽略無效歌曲行 (無空格):", trimmedLine);
                    continue; 
                }

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
                // console.log(`parsePerformances: 新增歌曲: ${song} (${currentSession})`); // 啟用此行可能會輸出大量訊息
            } catch (e) {
                console.error("parsePerformances: 解析歌曲行時發生錯誤:", e, "行內容:", trimmedLine);
                continue;
            }
        }
    }
    console.log("parsePerformances: 解析完成，總共找到歌曲數量:", Object.keys(performances).length);
    return performances;
}

// ... (searchSong 函式不變) ...

// 頁面載入時自動載入 song_list.txt
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const songNameInput = document.getElementById('songNameInput');
    const resultsDiv = document.getElementById('searchResults');
    const loadingStatusDiv = document.getElementById('loadingStatus');

    loadingStatusDiv.style.display = 'block';
    loadingStatusDiv.textContent = '載入歌曲資料中...';

    fetch('song_list.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error(`無法載入 song_list.txt (HTTP 狀態: ${response.status})。請確認檔案是否存在於相同目錄。`);
            }
            console.log("fetch: song_list.txt 檔案已成功獲取。");
            return response.text();
        })
        .then(data => {
            console.log("fetch: 檔案內容已轉換為文字。開始解析...");
            performancesData = parsePerformances(data);
            console.log("fetch: parsePerformances 執行完畢。performancesData:", performancesData); // 輸出最終的資料物件
            
            // 檢查 performancesData 是否為空
            if (Object.keys(performancesData).length > 0) {
                loadingStatusDiv.textContent = '歌曲資料已載入，請輸入歌名搜尋。';
                loadingStatusDiv.style.backgroundColor = '#d4edda';
                loadingStatusDiv.style.color = '#155724';
            } else {
                loadingStatusDiv.textContent = '歌曲資料已載入，但未解析到任何歌曲。請檢查 song_list.txt 格式。';
                loadingStatusDiv.style.backgroundColor = '#fff3cd'; // 警告黃色背景
                loadingStatusDiv.style.color = '#664d03'; // 警告黃色文字
            }
            console.log('song_list.txt 檔案成功載入並解析！');
        })
        .catch(error => {
            loadingStatusDiv.textContent = `載入歌曲資料失敗: ${error.message}`;
            loadingStatusDiv.style.backgroundColor = '#f8d7da';
            loadingStatusDiv.style.color = '#721c24';
            console.error('載入 song_list.txt 時發生錯誤:', error);
        })
        .finally(() => {
            setTimeout(() => {
                loadingStatusDiv.style.display = 'none';
            }, 5000);
        });

    // ... (搜尋按鈕和 Enter 鍵處理不變) ...
});