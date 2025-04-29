// DOM変更の監視機能を追加（SPA対応）
function setupDOMObserver() {
    console.log(chrome.i18n.getMessage('logDomObserverStart'));

    // MutationObserverの設定
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // 新しい要素が追加された場合
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 追加された要素内にテキストエリアがあるか確認
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const textareas = node.querySelectorAll('textarea');
                        if (textareas.length > 0) {
                            console.log(chrome.i18n.getMessage('logSpaNavigationDetected'), textareas);

                            // UIが既に初期化されているか確認し、必要なら再初期化
                            const voiceMenuBtn = document.getElementById('voice-menu-btn');
                            if (!voiceMenuBtn) {
                                console.log(chrome.i18n.getMessage('logSpaUiReinit'));
                                initVoiceInput(); // APIキーの非同期読み込みを考慮する必要があるかも
                            }

                            // テキストエリアにイベントリスナーを設定
                            enhanceInputElementHandlers();
                            break;
                        }
                    }
                }
            }
        }
    });

    // 監視の開始（document全体の変更を監視）
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 定期的なポーリングも設定（SPAの遷移を確実に捉えるため）
    setInterval(() => {
        // UIが初期化されているか確認
        const voiceMenuBtn = document.getElementById('voice-menu-btn');
        if (!voiceMenuBtn) {
            console.log(chrome.i18n.getMessage('logPollingUiNotFound'));
            initVoiceInput(); // APIキーの非同期読み込みを考慮する必要があるかも
        }

        // テキストエリアのイベントリスナーを更新
        enhanceInputElementHandlers();
    }, 5000); // 5秒ごとにチェック
}    // 直接DOMを操作してテキストエリアに値を設定する
function forceSetTextAreaValue(element, value) {
    if (!element) return false;

    try {
        // 1. 元のプロパティ記述子を保存
        const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');

        // 2. React制御をバイパスして直接値を設定
        Object.defineProperty(element, 'value', {
            configurable: true,
            writable: true,
            value: value
        });

        // 3. 入力イベントを発火
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // 4. 元のプロパティ記述子を復元（任意）
        if (descriptor) {
            Object.defineProperty(element, 'value', descriptor);
        }

        console.log(chrome.i18n.getMessage('logForceSetSuccess'), value);
        return true;
    } catch (e) {
        console.error(chrome.i18n.getMessage('logForceSetError'), e);
        return false;
    }
}    // React対応の強化：テキスト入力をシミュレートする関数
function simulateTypingIntoElement(element, text) {
    if (!element || !text) return false;

    try {
        // フォーカスを確保
        element.focus();

        // 既存の値を一旦クリア
        if (element.isContentEditable) {
            element.textContent = '';
        } else {
            element.value = '';
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));

        // 一文字ずつ入力を再現
        let currentText = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            currentText += char;

            if (element.isContentEditable) {
                element.textContent = currentText;
            } else {
                element.value = currentText;
            }

            // 各種イベントを発火
            element.dispatchEvent(new Event('input', { bubbles: true }));

            // キーイベントをシミュレート
            const keyCode = char.charCodeAt(0);

            const keyDownEvent = new KeyboardEvent('keydown', {
                key: char,
                code: char.match(/[a-z]/i) ? 'Key' + char.toUpperCase() : 'Digit' + char,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(keyDownEvent);

            const keyPressEvent = new KeyboardEvent('keypress', {
                key: char,
                code: char.match(/[a-z]/i) ? 'Key' + char.toUpperCase() : 'Digit' + char,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(keyPressEvent);

            const keyUpEvent = new KeyboardEvent('keyup', {
                key: char,
                code: char.match(/[a-z]/i) ? 'Key' + char.toUpperCase() : 'Digit' + char,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(keyUpEvent);
        }

        // 最終的な変更イベントを発火
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new Event('focus', { bubbles: true }));

        return true;
    } catch (e) {
        console.error(chrome.i18n.getMessage('logTypingSimulateError'), e);
        return false;
    }
}    // 紙飛行機SVGアイコンを持つボタンを検出
function findPaperPlaneButton() {
    // 特定のSVGパターンを持つボタンを探す
    const allButtons = document.querySelectorAll('button');

    for (const button of allButtons) {
        // この特定のSVGパターン（line と polygon の組み合わせ）を持つか確認
        const svg = button.querySelector('svg');
        if (svg) {
            const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
            const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');

            if (hasLine && hasPolygon) {
                console.log(chrome.i18n.getMessage('logPaperPlaneButtonFound'));
                return button;
            }
        }

        // クラスで判定
        if (button.classList.contains('bg-primary/40') &&
            button.getAttribute('type') === 'submit') {
            const svg = button.querySelector('svg');
            if (svg) {
                console.log(chrome.i18n.getMessage('logBgPrimaryButtonFound'));
                return button;
            }
        }
    }

    return null;
}

// ----- グローバル変数 -----
let isListening = false;
let currentInputElement = null;
let appendMode = false; // 追記モードフラグ
let lastClickedInput = null;
let menuExpanded = false;
// 自動送信モード関連削除
let alwaysOnMode = false; // 常時オンモードフラグ
let micButtonDoubleClickTimer = null;
let micButtonClickCount = 0;
let recognitionInstance = null; // SpeechRecognitionインスタンスを保持
let isEditing = false; // 編集モードフラグ

// 音声入力履歴（最大10件）
let voiceHistory = [];
const MAX_HISTORY = 10;

// 追記モード用の変数
let originalText = ""; // 追記モード時の元のテキスト
let interimText = ""; // 中間認識結果

// 設定保存キー
const API_KEY_STORAGE_KEY = 'gpt_api_key';
const ALWAYS_ON_MODE_STORAGE_KEY = 'always_on_mode'; // 常時オンモード保存キー
const RECOGNITION_LANG_STORAGE_KEY = 'recognition_lang'; // 認識言語保存キー
let apiKey = ''; // 初期値は空。非同期で読み込む
let recognitionLang = 'ja-JP'; // デフォルトは日本語

// SPA対応用変数
let isObserverInitialized = false;
let lastUrl = location.href;

// ----- スタイル定義 -----
// GM_addStyle は削除 (style.css で読み込む)

// ----- ステータス表示関数 -----
// この関数をスクリプトの最初の方で定義
function showStatus(messageKey, substitutions) {
    const statusElem = document.getElementById('voice-status');
    if (!statusElem) return;

    const msg = chrome.i18n.getMessage(messageKey, substitutions);
    statusElem.textContent = msg;
    statusElem.style.display = 'block';

    // 3秒後に非表示
    setTimeout(() => {
        if (statusElem) { // 要素が存在するか再確認
             statusElem.style.display = 'none';
        }
    }, 3000);
}

// ----- AI専用の自動送信機能 -----
// AIチャットインターフェース専用の送信ボタン検出（強化版）
function findAIChatSubmitButton() {
    // AIチャット特有の要素を探す
    const aiChatSelectors = [
        // OpenAI ChatGPT
        'form.stretch button.absolute, button[data-testid="send-button"]',
        // Claude
        'button[aria-label="Send message"], .claude-submit-button',
        // Bard / Gemini
        'button[aria-label="Send"], button.send-button',
        // Bing Chat
        'button.submit-button, button.chat-send-button',
        // Perplexity
        'button.send-message-button',
        // System.exe Research and Development
        '#buttonSubmitMessageConversation, .buttonSubmitMessageConversation',
        // 紙飛行機SVGアイコンを持つボタン
        'button[type="submit"] svg[viewBox="0 0 24 24"]',
        // 一般的なAIチャット
        'button.chat-submit, button.ai-submit-button, button.ai-chat-send'
    ];

    // すべてのセレクタで検索
    for (const selector of aiChatSelectors) {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
            // 可視状態のボタンのみをフィルタリング
            const visibleButtons = Array.from(buttons).filter(button => {
                const style = window.getComputedStyle(button);
                const rect = button.getBoundingClientRect();

                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       style.opacity !== '0' &&
                       rect.width > 0 &&
                       rect.height > 0;
            });

            if (visibleButtons.length > 0) {
                return visibleButtons[0]; // 最初の可視ボタンを返す
            }
        }
    }

    // 特殊なアイコンを持つボタンを探す
    const iconButtons = document.querySelectorAll('button');
    for (const button of iconButtons) {
        // 送信アイコンを含む可能性のある要素をチェック
        const hasSendIcon = button.querySelector('svg, i.fa-paper-plane, i.fa-send, i.fa-arrow, img[src*="send"]');
        if (hasSendIcon) {
            const rect = button.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                // ボタンが画面内の下部に位置するか確認
                if (rect.top > window.innerHeight * 0.5) {
                    return button;
                }
            }
        }
    }

    return null;
}

// 音声入力完了後に自動的に送信する
function autoSubmitAfterVoiceInput() {
    // 一旦少し待ってからボタンの状態を確認 (Reactの状態更新のため)
    setTimeout(() => {
        // 特定の紙飛行機アイコンのボタンを最優先で探す
        const paperPlaneButton = findPaperPlaneButton();
        if (paperPlaneButton) {
            // showStatus('statusPaperPlaneFound'); // Example key if needed

            // ボタンが無効状態かチェック
            const isDisabled = paperPlaneButton.disabled ||
                              paperPlaneButton.getAttribute('aria-disabled') === 'true' ||
                              paperPlaneButton.classList.contains('disabled') ||
                              paperPlaneButton.classList.contains('cursor-not-allowed') ||
                              paperPlaneButton.classList.contains('opacity-50') ||
                              getComputedStyle(paperPlaneButton).opacity < '0.9';

           if (isDisabled) {
               console.log(chrome.i18n.getMessage('logPaperPlaneButtonDisabled'));

               // 現在のテキスト入力フィールドを取得して再度イベント発火
               retryInputEvents();
                return;
            }

            // ボタンを強調表示
            const originalBackgroundColor = paperPlaneButton.style.backgroundColor;
            paperPlaneButton.style.backgroundColor = '#4CAF50';

            // 少し待ってから送信
            setTimeout(() => {
                paperPlaneButton.style.backgroundColor = originalBackgroundColor;
                paperPlaneButton.click();
                // showStatus('statusPaperPlaneSent'); // Example key if needed
            }, 300);
            return;
        }

        // 紙飛行機ボタンがなければ通常のAIチャット用送信ボタンを探す
        const submitButton = findAIChatSubmitButton();

        if (submitButton) {
            // showStatus('statusAIChatButtonFound'); // Example key if needed

            // ボタンが無効かチェック
            const isDisabled = submitButton.disabled ||
                            submitButton.getAttribute('aria-disabled') === 'true' ||
                            submitButton.classList.contains('disabled') ||
                            submitButton.classList.contains('cursor-not-allowed') ||
                            submitButton.classList.contains('opacity-50') ||
                            getComputedStyle(submitButton).opacity < '0.9' ||
                            submitButton.closest('.disabled');

            if (isDisabled) {
                console.log(chrome.i18n.getMessage('logSubmitButtonDisabled'));

                // 再度イベントをトリガーして、Reactのステート更新を促す
                retryInputEvents();
                return;
            }

            // ボタンを強調表示
            const originalBackgroundColor = submitButton.style.backgroundColor;
            submitButton.style.backgroundColor = '#4CAF50';

            // 少し待ってから送信
            setTimeout(() => {
                submitButton.style.backgroundColor = originalBackgroundColor;
                submitButton.click();
                // showStatus('statusMessageSent'); // Example key if needed
            }, 300);
        } else {
            // 一般的な送信ボタン検索にフォールバック
            findAndClickSubmitButton();
        }
    }, 500); // 初期待機時間
}

// React用のステート更新を促す関数
function retryInputEvents() {
    // 現在のテキスト入力フィールドを取得
    const inputField = currentInputElement || document.activeElement;
    if (isInputElement(inputField)) {
        // 再度イベントをトリガーして、Reactのステート更新を促す
        const currentText = inputField.isContentEditable ?
            inputField.textContent : inputField.value;

        if (currentText && currentText.trim() !== '') {
            // キー入力をシミュレートしてReactのステート更新を強制的に促す
            try {
                // 様々なイベントの発火を試みる
                for (const eventType of ['keydown', 'keyup', 'keypress', 'input', 'change']) {
                    const event = eventType.startsWith('key') ?
                        new KeyboardEvent(eventType, {
                            key: 'a',
                            code: 'KeyA',
                            bubbles: true,
                            cancelable: true
                        }) :
                        new Event(eventType, { bubbles: true, cancelable: true });

                    inputField.dispatchEvent(event);
                }

                // 値を一時的に変更してステート更新を促す
                if (!inputField.isContentEditable) {
                    const tempValue = currentText + " ";
                    inputField.value = tempValue;
                    inputField.dispatchEvent(new Event('input', { bubbles: true }));

                    // 元の値に戻す
                    setTimeout(() => {
                        inputField.value = currentText;
                        inputField.dispatchEvent(new Event('input', { bubbles: true }));
                        inputField.dispatchEvent(new Event('change', { bubbles: true }));

                        // さらに少し待ってから再度送信を試みる
                        setTimeout(() => autoSubmitAfterVoiceInput(), 300);
                    }, 50);
                    return;
                }
            } catch (e) {
                console.error(chrome.i18n.getMessage('logStateUpdateError'), e);
            }
        }
        
    }

    // Status for disabled button handled elsewhere or implicitly
}

// エンターキー押下時のハンドラ(提出機能を強化)
function enhanceInputElementHandlers() {
    // 画面上のすべての入力要素を取得
    const inputElements = document.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]');

    // 各入力要素にイベントハンドラを追加
    inputElements.forEach(input => {
        // 既に処理済みかどうかをチェック
        if (input._enhancedByVoiceInput) return;

        // エンターキー押下時の処理
        input.addEventListener('keydown', function(e) {
            // Enterキーが押された時 (Shift+Enterは除外)
            if (e.key === 'Enter' && !e.shiftKey) {
                // textareaの場合は複数行入力を許可するため、Ctrl+Enterのみで送信
                if (this.tagName.toLowerCase() === 'textarea' && !e.ctrlKey) {
                    return;
                }

                // フォーカスされている入力要素を保存
                currentInputElement = this;

                // 送信ボタンを探して自動クリック
                findAndClickSubmitButton();
            }
        });

        // 処理済みとしてマーク
        input._enhancedByVoiceInput = true;
    });
}

// 定期的に入力要素を監視・拡張
setInterval(enhanceInputElementHandlers, 3000);

// ----- 送信ボタン検出と自動クリック機能 -----
// 送信ボタンを見つけてクリックする
function findAndClickSubmitButton() {
    // 現在のフォーカス要素またはクリックされた入力要素を見つける
    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
        targetElement = lastClickedInput && isInputElement(lastClickedInput)
            ? lastClickedInput
            : findBestInputField();

        if (targetElement) {
            targetElement.focus();
            showStatus('statusInputFound');
        } else {
            showStatus('statusInputNotFound');
            return;
        }
    }

    // System.exe Research and Developmentサイト特有の処理
    if (window.location.hostname.includes('systemexe-research-and-development.com')) {
        // System.exeサイト特有の対応（入力に反応する送信ボタン）
        const systemExeButton = document.getElementById('buttonSubmitMessageConversation');
        if (systemExeButton) {
            // ボタンが無効状態かどうかチェック
            const isDisabled = systemExeButton.disabled ||
                              systemExeButton.getAttribute('aria-disabled') === 'true' ||
                              systemExeButton.classList.contains('disabled') ||
                              systemExeButton.classList.contains('cursor-not-allowed') ||
                              systemExeButton.classList.contains('opacity-50') ||
                              getComputedStyle(systemExeButton).opacity < '0.9';

            if (isDisabled) {
                // showStatus('statusSubmitDisabled'); // Example key if needed
                return;
            }

            // showStatus('statusSubmitFound'); // Example key if needed

            // ボタンをハイライト表示
            const originalBackgroundColor = systemExeButton.style.backgroundColor;
            const originalBorder = systemExeButton.style.border;

            systemExeButton.style.backgroundColor = '#4CAF50';
            systemExeButton.style.border = '2px solid #2E7D32';

            // 少し待ってからクリック
            setTimeout(() => {
                // スタイルを元に戻す
                systemExeButton.style.backgroundColor = originalBackgroundColor;
                systemExeButton.style.border = originalBorder;

                // イベントを発火
                systemExeButton.click();
                // showStatus('statusSubmitClicked'); // Example key if needed
            }, 500);

            return;
        }
    }

    // 送信ボタンを見つける
    let submitButton = findSubmitButtonForInput(targetElement);

    if (submitButton) {
        // ボタンが無効状態かどうかチェック
        const isDisabled = submitButton.disabled ||
                          submitButton.getAttribute('aria-disabled') === 'true' ||
                          submitButton.classList.contains('disabled') ||
                          submitButton.classList.contains('cursor-not-allowed') ||
                          submitButton.classList.contains('opacity-50') ||
                          getComputedStyle(submitButton).opacity < '0.9';

        if (isDisabled) {
            // showStatus('statusSubmitDisabled'); // Example key if needed
            return;
        }

        // showStatus('statusSubmitFound'); // Example key if needed

        // ボタンをハイライト表示(一時的に)
        const originalBackgroundColor = submitButton.style.backgroundColor;
        const originalBorder = submitButton.style.border;

        submitButton.style.backgroundColor = '#4CAF50';
        submitButton.style.border = '2px solid #2E7D32';

        // 少し待ってからクリック
        setTimeout(() => {
            // スタイルを元に戻す
            submitButton.style.backgroundColor = originalBackgroundColor;
            submitButton.style.border = originalBorder;

            // イベントを発火
            submitButton.click();
            // showStatus('statusSubmitClicked'); // Example key if needed
        }, 500);
    } else {
        showStatus('statusInputNotFound'); // Keep this specific message key
    }
}

// 入力フィールドに関連する送信ボタンを探す
function findSubmitButtonForInput(inputElement) {
    if (!inputElement) return null;

    // 候補となるボタン要素を集める
    const candidates = [];

    // System.exe Research and Development サイト特有の対応
    if (window.location.hostname.includes('systemexe-research-and-development.com')) {
        // このサイト特有のボタンを優先的に探す
        const systemExeButton = document.getElementById('buttonSubmitMessageConversation');
        if (systemExeButton) {
            candidates.push(systemExeButton);
        }
        // クラス名でも探す
        const systemExeButtons = Array.from(document.querySelectorAll('.buttonSubmitMessageConversation'));
        candidates.push(...systemExeButtons);
    }

    // 方法1: 同じフォーム内の送信ボタンを探す
    if (inputElement.form) {
        const formButtons = Array.from(inputElement.form.querySelectorAll('button, input[type="submit"], input[type="button"]'));
        candidates.push(...formButtons);
    }

    // 方法2: フォームがなければ近くのボタンを探す
    if (!inputElement.form) {
        // 入力フィールドの親要素を10階層まで遡る
        let parent = inputElement.parentElement;
        let depth = 0;

        while (parent && depth < 10) {
            // この親要素内のボタンを取得
            const buttons = Array.from(parent.querySelectorAll('button, input[type="submit"], input[type="button"]'));
            candidates.push(...buttons);

            // 次の親へ
            parent = parent.parentElement;
            depth++;
        }
    }

    // 方法3: 画面内のすべてのボタンを対象にする
    const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));

    // 重複を削除しつつ、すべての候補を集める
    const allCandidates = [...new Set([...candidates, ...allButtons])];

    // 可視状態のボタンだけにフィルタリング
    const visibleButtons = allCandidates.filter(button => {
        const style = window.getComputedStyle(button);
        const rect = button.getBoundingClientRect();

        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               rect.width > 0 &&
               rect.height > 0;
    });

    // 送信ボタンっぽい特徴を持つものをスコアリング
    const scoredButtons = visibleButtons.map(button => {
        let score = 0;
        const text = (button.textContent || '').toLowerCase();
        const value = (button.value || '').toLowerCase();
        const id = (button.id || '').toLowerCase();
        const className = (button.className || '').toLowerCase();
        const type = (button.type || '').toLowerCase();

        // テキスト内容によるスコアリング
        const submitKeywords = ['送信', '投稿', 'submit', 'post', 'send', '確定', '実行', 'ok', '了解'];
        for (const keyword of submitKeywords) {
            if (text.includes(keyword)) score += 5;
            if (value.includes(keyword)) score += 4;
            if (id.includes(keyword)) score += 3;
            if (className.includes(keyword)) score += 2;
        }

        // 属性によるスコアリング
        if (type === 'submit') score += 10;
        if (button.getAttribute('role') === 'button') score += 2;

        // フォーム内の唯一のボタンなら高スコア
        if (inputElement.form && inputElement.form.querySelectorAll('button, input[type="submit"]').length === 1) {
            score += 8;
        }

        // アイコンによるスコアリング (FontAwesomeなど)
        const hasSubmitIcon = button.querySelector('i.fa-paper-plane, i.fa-send, svg[data-icon="paper-plane"]');
        if (hasSubmitIcon) score += 5;

        // ウェブサイト固有の識別
        const currentHost = window.location.hostname;
        if (currentHost.includes('systemexe-research-and-development.com') &&
           (button.id === 'buttonSubmitMessageConversation' ||
            button.classList.contains('buttonSubmitMessageConversation'))) {
            score += 50; // 特定サイトの既知のボタンには高いスコアを与える
        }

        // 位置関係によるスコアリング
        const inputRect = inputElement.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();

        // 右側や下にあるボタンのスコアを上げる
        if (Math.abs(buttonRect.left - inputRect.right) < 100 && Math.abs(buttonRect.top - inputRect.top) < 50) {
            score += 3;
        }
        if (buttonRect.top > inputRect.bottom && Math.abs(buttonRect.left - inputRect.left) < 100) {
            score += 3;
        }

        // チャットUIのような配置パターンを検出
        if (buttonRect.top > inputRect.top &&
            buttonRect.left > inputRect.left &&
            buttonRect.left < inputRect.right + 100) {
            score += 4;
        }

        // AIチャットUIによく見られる特徴的な配置
        if (button.classList.contains('send') ||
            button.classList.contains('submit-button') ||
            button.classList.contains('chat-submit')) {
            score += 5;
        }

        // 画像のみのボタンもチェック
        const hasImage = button.querySelector('img');
        if (hasImage) {
            const imgSrc = hasImage.src.toLowerCase();
            if (imgSrc.includes('send') || imgSrc.includes('submit') || imgSrc.includes('arrow')) {
                score += 3;
            }
        }

        // AIチャットUI特有のSVGアイコン
        const hasSVG = button.querySelector('svg');
        if (hasSVG) {
            score += 2; // SVGアイコンはチャットUIでよく使われる
        }

        return { button, score };
    });

    // ReactのUIフレームワークによくある「無効なボタン」の特徴をチェックする
    scoredButtons.forEach(item => {
        const button = item.button;
        // disabled属性やaria-disabledがあるか
        if (button.disabled || button.getAttribute('aria-disabled') === 'true') {
            item.score -= 20;
        }
        // 無効っぽいクラスを持っているか
        if (button.classList.contains('disabled') ||
            button.classList.contains('cursor-not-allowed') ||
            button.classList.contains('opacity-50')) {
            item.score -= 15;
        }
        // 透明度が低くないか
        if (getComputedStyle(button).opacity < '0.9') {
            item.score -= 10;
        }
    });

    // スコアで並べ替え
    scoredButtons.sort((a, b) => b.score - a.score);

    // デバッグ情報
    console.log(chrome.i18n.getMessage('logSubmitButtonCandidates'), scoredButtons);

    // 最高スコアのボタンを返す（そのボタンが無効でない場合）
    if (scoredButtons.length > 0) {
        const bestButton = scoredButtons[0].button;
        // もし最もスコアの高いボタンが明らかに無効なら、次のボタンを試す
        if (bestButton.disabled ||
            bestButton.getAttribute('aria-disabled') === 'true' ||
            bestButton.classList.contains('disabled')) {
            return scoredButtons.length > 1 ? scoredButtons[1].button : null;
        }
        return bestButton;
    }
    return null;
}

// ----- 初期化関数 -----
async function initVoiceInput() { // APIキー読み込みのため非同期に
    console.log(chrome.i18n.getMessage('logInitializing', '1.7'));

    // APIキーと設定は runInitialization で読み込み済み

    // SpeechRecognition APIチェック
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error(chrome.i18n.getMessage('logSpeechNotSupported'));
        alert(chrome.i18n.getMessage('alertSpeechNotSupported')); // Use a dedicated alert message key
        return;
    }

    // UI要素を作成 (既に存在しない場合のみ)
    if (!document.getElementById('voice-menu-btn')) {
        createUI();
        // イベントリスナーを登録
        setupEventListeners();
    } else {
        console.log(chrome.i18n.getMessage('logUiAlreadyExists'));
    }


    console.log(chrome.i18n.getMessage('logInitializationComplete', '1.7'));
}

// ----- UI作成 -----
function createUI() {
    // 既存の要素を削除 (念のため)
    removeExistingElements();

    // メインメニューボタン
    const menuButton = document.createElement('div');
    menuButton.id = 'voice-menu-btn';
    menuButton.innerHTML = '≡';
    menuButton.title = chrome.i18n.getMessage('menuTooltip');
    document.body.appendChild(menuButton);

    // メニューコンテナ
    const menuContainer = document.createElement('div');
    menuContainer.id = 'voice-menu-container';
    document.body.appendChild(menuContainer);

    // マイクボタン (シンプルなマイクアイコン)
    const micButton = createMenuItem('voice-input-btn', '🎙', chrome.i18n.getMessage(alwaysOnMode ? 'micTooltipAlwaysOn' : 'micTooltip')); // ツールチップを動的に設定
    menuContainer.appendChild(micButton);

    // 追記モードボタン (プラス記号)
    const appendButton = createMenuItem('voice-append-btn', '+', chrome.i18n.getMessage('appendTooltip'));
    menuContainer.appendChild(appendButton);

    // クリアボタン (バツ印)
    const clearButton = createMenuItem('voice-clear-btn', '✕', chrome.i18n.getMessage('clearTooltip'));
    menuContainer.appendChild(clearButton);

    // 校閲ボタン (チェックマーク)
    const proofreadButton = createMenuItem('voice-proofread-btn', '✔', chrome.i18n.getMessage('proofreadTooltip'));
    menuContainer.appendChild(proofreadButton);

    // 編集ボタン (鉛筆アイコン)
    const editButton = createMenuItem('voice-edit-btn', '✎', chrome.i18n.getMessage('editTooltip', 'テキストを編集 (GPT-4.1)'));
    menuContainer.appendChild(editButton);

    // 送信ボタン削除

    // 設定ボタン (歯車アイコン)
    const settingsButton = createMenuItem('voice-settings-btn', '⚙', chrome.i18n.getMessage('settingsTooltip')); // モデル名も更新
    menuContainer.appendChild(settingsButton);

    // 履歴ボタン (時計アイコン)
    const historyButton = createMenuItem('voice-history-btn', '🕒', chrome.i18n.getMessage('historyTooltip'));
    menuContainer.appendChild(historyButton);

    // ステータス表示
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'voice-status';
    document.body.appendChild(statusDisplay);

    // 設定モーダル
    createSettingsModal();

    // 履歴パネル
    createHistoryPanel();
}

// メニューアイテムを作成
function createMenuItem(id, icon, tooltip) {
    const item = document.createElement('div');
    item.id = id;
    item.className = 'voice-menu-item';
    item.innerHTML = icon;

    const label = document.createElement('div');
    label.className = 'voice-menu-label';
    label.textContent = tooltip;
    item.appendChild(label);

    return item;
}

// 既存の要素を削除
function removeExistingElements() {
    const elementIds = [
        'voice-menu-btn',
        'voice-menu-container',
        'voice-input-btn',
        'voice-append-btn',
        'voice-proofread-btn',
        'voice-edit-btn',
        'voice-settings-btn',
        'voice-history-btn',
        'voice-clear-btn',
        // 'voice-submit-btn', // 削除
        'voice-status',
        'voice-settings-modal',
        'voice-history-panel'
    ];

    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.remove();
    });
}

// 設定モーダル作成
function createSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'voice-settings-modal';

    // 言語選択オプションを生成
    const langOptions = [
        { value: 'ja-JP', textKey: 'modalSettingsLangJa' },
        { value: 'en-US', textKey: 'modalSettingsLangEn' },
        { value: 'vi-VN', textKey: 'modalSettingsLangVi' }
    ];

    const langSelectOptionsHTML = langOptions.map(lang =>
        `<option value="${lang.value}">${chrome.i18n.getMessage(lang.textKey)}</option>`
    ).join('');

    modal.innerHTML = `
        <h3>${chrome.i18n.getMessage('modalSettingsTitle')}</h3>
        <p>${chrome.i18n.getMessage('modalSettingsDescription')}</p>
        <label for="api-key-input">API Key:</label>
        <input type="password" id="api-key-input" placeholder="${chrome.i18n.getMessage('modalSettingsInputPlaceholder')}">

        <label for="recognition-lang-select">${chrome.i18n.getMessage('modalSettingsLangLabel')}:</label>
        <select id="recognition-lang-select">
            ${langSelectOptionsHTML}
        </select>

        <div class="button-row">
            <button id="settings-cancel">${chrome.i18n.getMessage('modalSettingsButtonCancel')}</button>
            <button id="settings-save">${chrome.i18n.getMessage('modalSettingsButtonSave')}</button>
        </div>
    `;

    document.body.appendChild(modal);

    // モーダル内の要素にスタイルを適用するためのクラスを追加 (任意)
    modal.querySelector('label[for="api-key-input"]').style.display = 'block';
    modal.querySelector('label[for="api-key-input"]').style.marginBottom = '5px';
    modal.querySelector('label[for="recognition-lang-select"]').style.display = 'block';
    modal.querySelector('label[for="recognition-lang-select"]').style.marginTop = '15px';
    modal.querySelector('label[for="recognition-lang-select"]').style.marginBottom = '5px';
    modal.querySelector('select#recognition-lang-select').style.width = '100%';
    modal.querySelector('select#recognition-lang-select').style.padding = '8px';
    modal.querySelector('select#recognition-lang-select').style.marginBottom = '20px';
    modal.querySelector('select#recognition-lang-select').style.border = '1px solid #ccc';
    modal.querySelector('select#recognition-lang-select').style.borderRadius = '4px';

}

// 履歴パネル作成
function createHistoryPanel() {
    const panel = document.createElement('div');
    panel.id = 'voice-history-panel';
    // Title is now handled by CSS :first-child selector, but keep a placeholder div
    panel.innerHTML = `<div>${chrome.i18n.getMessage('historyPanelTitle')}</div>`;
    document.body.appendChild(panel);

    updateHistoryPanel();
}

// 履歴パネル更新
function updateHistoryPanel() {
    const panel = document.getElementById('voice-history-panel');
    if (!panel) return;

    // 前回の履歴部分をクリア（タイトル部分は残す）
    const titleElement = panel.firstChild;
    panel.innerHTML = '';
    if (titleElement) panel.appendChild(titleElement); // titleElementが存在する場合のみ追加

    // 履歴がない場合
    if (voiceHistory.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = chrome.i18n.getMessage('historyPanelEmpty');
        emptyMsg.style.color = '#888';
        emptyMsg.style.padding = '10px 4px'; // Adjusted padding
        emptyMsg.style.fontSize = '13px';
        panel.appendChild(emptyMsg);
        return;
    }

    // 履歴表示（新しいものから）
    [...voiceHistory].reverse().forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const timeElem = document.createElement('div');
        timeElem.className = 'history-time';
        timeElem.textContent = item.timestamp;

        const textElem = document.createElement('div');
        textElem.className = 'history-text';
        textElem.textContent = item.text;

        historyItem.appendChild(timeElem);
        historyItem.appendChild(textElem);
        panel.appendChild(historyItem);
    });
}

// ----- イベントリスナー設定 -----
function setupEventListeners() {
    // 入力フィールドクリック監視
    document.addEventListener('click', e => {
        if (isInputElement(e.target)) lastClickedInput = e.target;
    }, true);

    // メインメニューボタン
    const menuButton = document.getElementById('voice-menu-btn');
    if (menuButton) {
        menuButton.addEventListener('click', toggleMenu);
    }

    // マイクボタン
    const micButton = document.getElementById('voice-input-btn');
    if (micButton) {
        micButton.addEventListener('click', handleMicButtonInteraction); // シングル/ダブルクリック判定用ハンドラに変更
    }

    // 追記モードボタン
    const appendButton = document.getElementById('voice-append-btn');
    if (appendButton) {
        appendButton.addEventListener('click', toggleAppendMode);
    }

    // クリアボタン
    const clearButton = document.getElementById('voice-clear-btn');
    if (clearButton) {
        clearButton.addEventListener('click', clearCurrentInput);
    }

    // 校閲ボタン
    const proofreadButton = document.getElementById('voice-proofread-btn');
    if (proofreadButton) {
        proofreadButton.addEventListener('click', proofreadCurrentInput); // proofreadCurrentInput は async になっている
    }

    // 編集ボタン
    const editButton = document.getElementById('voice-edit-btn');
    if (editButton) {
        editButton.addEventListener('click', handleEditButtonClick);
    }

    // 設定ボタン
    const settingsButton = document.getElementById('voice-settings-btn');
    if (settingsButton) {
        settingsButton.addEventListener('click', toggleSettingsModal);
    }

    // 履歴ボタン
    const historyButton = document.getElementById('voice-history-btn');
    if (historyButton) {
        historyButton.addEventListener('click', toggleHistoryPanel);
    }

    // 送信ボタンのリスナー削除

    // 設定モーダルの保存・キャンセルボタン (ID変更)
    const saveButton = document.getElementById('settings-save');
    const cancelButton = document.getElementById('settings-cancel');

    if (saveButton) {
        saveButton.addEventListener('click', saveSettings); // 関数名を変更
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', toggleSettingsModal);
    }

    // キーボードショートカット
    document.addEventListener('keydown', e => {
        // Ctrl + L (macOSではCmd + L) で音声認識トグル
        // Note: macOSでのCmdキーは e.metaKey で判定
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') { // 小文字の 'l'
            e.preventDefault();
            handleMicButtonClick(); // マイクボタンクリックと同じ処理を呼ぶ
        }
    });

    // メニュー外クリックで閉じる機能 (必要であれば復活させる)
    /*
    document.addEventListener('click', function(e) {
        if (menuExpanded) {
            const menuContainer = document.getElementById('voice-menu-container');
            const menuButton = document.getElementById('voice-menu-btn');

            // クリックされた要素がメニュー内またはメニューボタンでなければメニューを閉じる
            if (menuContainer && !menuContainer.contains(e.target) &&
                menuButton && e.target !== menuButton && !menuButton.contains(e.target)) { // ボタン内のアイコンクリックも考慮
                toggleMenu();
            }
        }
    });
    */
}

// メニュー表示切替
function toggleMenu() {
    const menuContainer = document.getElementById('voice-menu-container');
    const menuButton = document.getElementById('voice-menu-btn');

    if (!menuContainer || !menuButton) return;

    menuExpanded = !menuExpanded;

    if (menuExpanded) {
        menuContainer.classList.add('expanded');
        menuButton.classList.add('expanded-state'); // クラスを追加
        menuButton.innerHTML = '×'; // メニュー展開時は閉じるアイコン
        // menuButton.style.backgroundColor = '#DB4437'; // 削除
    } else {
        menuContainer.classList.remove('expanded');
        menuButton.classList.remove('expanded-state'); // クラスを削除
        menuButton.innerHTML = '≡'; // メニュー閉じる時はハンバーガーアイコン
        // menuButton.style.backgroundColor = '#4285F4'; // 削除
        // メニューを閉じたら履歴パネルも閉じる
        const historyPanel = document.getElementById('voice-history-panel');
        if (historyPanel) historyPanel.style.display = 'none';
        // 設定モーダルも閉じる
        const settingsModal = document.getElementById('voice-settings-modal');
        if (settingsModal) settingsModal.style.display = 'none';
    }
}

// ----- イベントハンドラ -----
// マイクボタンのインタラクション（シングル/ダブルクリック判定）
function handleMicButtonInteraction() {
    micButtonClickCount++;

    if (micButtonClickCount === 1) {
        // シングルクリックタイマー開始
        micButtonDoubleClickTimer = setTimeout(() => {
            micButtonClickCount = 0; // カウントリセット
            handleMicButtonClick(); // シングルクリック処理を実行
        }, 300); // 300ms以内に次のクリックがなければシングルクリックと判定
    } else if (micButtonClickCount === 2) {
        // ダブルクリック検出
        clearTimeout(micButtonDoubleClickTimer); // シングルクリックタイマー解除
        micButtonClickCount = 0; // カウントリセット
        toggleAlwaysOnMode(); // ダブルクリック処理を実行
    }
}

// マイクボタン シングルクリック処理 (元の handleMicButtonClick)
function handleMicButtonClick() {
    currentInputElement = document.activeElement;
    if (!isInputElement(currentInputElement)) {
        currentInputElement = lastClickedInput && isInputElement(lastClickedInput)
            ? lastClickedInput
            : findBestInputField();

        if (currentInputElement) {
            currentInputElement.focus();
            showStatus('statusInputFound');
        } else {
            return showStatus('statusInputNotFound');
        }
    }

    toggleSpeechRecognition();
}

// クリアボタンクリック - 新機能
function clearCurrentInput() {
    // 現在フォーカスされている要素またはクリックされた入力要素を取得
    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
        targetElement = lastClickedInput && isInputElement(lastClickedInput)
            ? lastClickedInput
            : findBestInputField();

        if (targetElement) {
            targetElement.focus();
            showStatus('statusInputFound');
        } else {
            showStatus('statusClearNotFound');
            return;
        }
    }

    // 入力フィールドをクリア
    if (targetElement.isContentEditable) {
        targetElement.textContent = '';
    } else {
        targetElement.value = '';
    }

    // 入力イベントを発火
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.dispatchEvent(new Event('change', { bubbles: true }));

    // 追記モード時の元テキストもクリア
    if (targetElement === currentInputElement) {
        originalText = '';
    }

    showStatus('statusClearSuccess');
}

// 編集ボタンクリック - 新機能
function handleEditButtonClick() {
    // 現在フォーカスされている要素またはクリックされた入力要素を取得
    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
        targetElement = lastClickedInput && isInputElement(lastClickedInput)
            ? lastClickedInput
            : findBestInputField();

        if (targetElement) {
            targetElement.focus();
            showStatus('statusInputFound');
        } else {
            showStatus('statusEditNotFound');
            return;
        }
    }

    // 入力フィールドが空の場合
    const currentText = targetElement.isContentEditable ?
        targetElement.textContent : targetElement.value;
    
    if (!currentText || currentText.trim() === '') {
        showStatus('statusEditEmpty');
        return;
    }

    // APIキーがない場合
    if (!apiKey || apiKey.trim() === '') {
        showStatus('statusApiKeyMissing');
        toggleSettingsModal(); // 設定モーダルを開く
        return;
    }

    // 編集指示の入力をプロンプト
    const instruction = prompt('編集指示を入力してください:');
    
    // キャンセルされた場合
    if (instruction === null) {
        return;
    }
    
    // 指示が空の場合
    if (!instruction.trim()) {
        showStatus('statusEditInstructionEmpty');
        return;
    }

    // 編集モードをオンに
    isEditing = true;
    
    // 編集処理を実行
    processEditInstruction(instruction);
}

// 追記モード切替
function toggleAppendMode() {
    appendMode = !appendMode;

    const appendButton = document.getElementById('voice-append-btn');
    if (!appendButton) return;

    if (appendMode) {
        appendButton.classList.add('active');
        showStatus('statusAppendOn');
    } else {
        appendButton.classList.remove('active');
        showStatus('statusAppendOff');
    }
}

// 設定モーダル表示切替
function toggleSettingsModal() {
    const modal = document.getElementById('voice-settings-modal');
    if (!modal) return;

    const currentDisplay = window.getComputedStyle(modal).display;
    modal.style.display = currentDisplay === 'none' ? 'block' : 'none';

    // 表示するときはAPIキー入力欄と言語選択の値を更新
    if (currentDisplay === 'none') {
        const apiKeyInput = document.getElementById('api-key-input');
        const langSelect = document.getElementById('recognition-lang-select');
        if (apiKeyInput) apiKeyInput.value = apiKey;
        if (langSelect) langSelect.value = recognitionLang;
    }
}

// 履歴パネル表示切替
function toggleHistoryPanel() {
    const panel = document.getElementById('voice-history-panel');
    if (!panel) return;

    const currentDisplay = window.getComputedStyle(panel).display;

    if (currentDisplay === 'none') {
        updateHistoryPanel();
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// 設定読み込み (APIキー、常時オンモード、言語)
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get([
            API_KEY_STORAGE_KEY,
            ALWAYS_ON_MODE_STORAGE_KEY,
            RECOGNITION_LANG_STORAGE_KEY
        ]);
        apiKey = result[API_KEY_STORAGE_KEY] || '';
        alwaysOnMode = result[ALWAYS_ON_MODE_STORAGE_KEY] || false;
        recognitionLang = result[RECOGNITION_LANG_STORAGE_KEY] || 'ja-JP'; // 言語設定読み込み、デフォルト'ja-JP'

        console.log(chrome.i18n.getMessage('logSettingsLoaded'), {
            apiKey: apiKey ? chrome.i18n.getMessage('logApiKeySet') : chrome.i18n.getMessage('logApiKeyNotSet'),
            alwaysOn: alwaysOnMode ? 'On' : 'Off',
            language: recognitionLang
        });
        // UIに初期状態を反映
        updateMicButtonState(isListening);
    } catch (e) {
        console.error(chrome.i18n.getMessage('logSettingsLoadError'), e);
        apiKey = '';
        alwaysOnMode = false;
        recognitionLang = 'ja-JP'; // エラー時もデフォルト設定
    }
}

// 常時オンモードの状態を保存
async function saveAlwaysOnMode() {
    try {
        await chrome.storage.local.set({ [ALWAYS_ON_MODE_STORAGE_KEY]: alwaysOnMode });
        console.log(chrome.i18n.getMessage('logAlwaysOnModeSaved'), alwaysOnMode);
    } catch (e) {
        console.error(chrome.i18n.getMessage('logAlwaysOnModeSaveError'), e);
    }
}

// 設定保存 (APIキーと言語)
async function saveSettings() {
    const apiKeyInput = document.getElementById('api-key-input');
    const langSelect = document.getElementById('recognition-lang-select');
    if (!apiKeyInput || !langSelect) return;

    const newApiKey = apiKeyInput.value.trim();
    const newLang = langSelect.value;

    // APIキーの簡易バリデーション (空でもOKとする)
    if (newApiKey !== '' && !newApiKey.startsWith('sk-')) {
        alert(chrome.i18n.getMessage('alertApiKeyInvalid'));
        return;
    }

    // 設定をオブジェクトにまとめる
    const settingsToSave = {
        [API_KEY_STORAGE_KEY]: newApiKey,
        [RECOGNITION_LANG_STORAGE_KEY]: newLang
    };

    // 設定を保存
    try {
        await chrome.storage.local.set(settingsToSave);
        apiKey = newApiKey; // グローバル変数更新
        recognitionLang = newLang; // グローバル変数更新
        console.log(chrome.i18n.getMessage('logSettingsSaved'), { apiKey: newApiKey ? 'Set' : 'Not Set', language: newLang });
        showStatus('statusSettingsSaveSuccess'); // 汎用的な成功メッセージ

        // モーダルを閉じる
        setTimeout(() => {
            toggleSettingsModal();
        }, 1000);
    } catch (e) {
        console.error(chrome.i18n.getMessage('logSettingsSaveError'), e); // 汎用的なエラーログ
        showStatus('statusSettingsSaveError'); // 汎用的なエラーメッセージ
    }
}

// 常時オンモード切り替え
async function toggleAlwaysOnMode() {
    alwaysOnMode = !alwaysOnMode;
    await saveAlwaysOnMode(); // 状態を保存

    updateMicButtonState(isListening); // ボタンの見た目とツールチップを更新

    if (alwaysOnMode) {
        showStatus('statusAlwaysOnEnabled');
        // 常時オンが有効になったら、現在認識中でなければ開始
        if (!isListening) {
            startSpeechRecognition();
        }
    } else {
        showStatus('statusAlwaysOnDisabled');
        // 常時オンが無効になったら、認識中であれば停止
        if (isListening) {
            stopSpeechRecognition();
        }
    }
}

// ----- 音声認識 -----
// 音声認識の開始・停止 (シングルクリック時)
function toggleSpeechRecognition() {
    if (isListening) {
        stopSpeechRecognition();
    } else {
        startSpeechRecognition();
    }
}

// 音声認識開始
function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
         alert(chrome.i18n.getMessage('alertSpeechApiNotAvailable')); // Use dedicated alert key
         return;
    }
    // 既存のインスタンスがあれば停止させてから新しいインスタンスを作成
    if (recognitionInstance) {
        try {
            recognitionInstance.stop();
        } catch (e) {
            console.warn("Previous recognition stop error:", e);
        }
        recognitionInstance = null;
    }
    recognitionInstance = new SpeechRecognition(); // グローバル変数に保存
    const recognition = recognitionInstance; // ローカル変数で参照

    recognition.lang = recognitionLang; // 保存された言語設定を使用
    recognition.interimResults = true;
    recognition.continuous = false; // 一文ずつ認識させる
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        isListening = true;
        updateMicButtonState(true);

        // テキストエリアが空でない場合は内容をクリア（上書きモードの場合）
        if (!appendMode && currentInputElement) {
            const currentValue = currentInputElement.isContentEditable ?
                currentInputElement.textContent : currentInputElement.value;

            if (currentValue && currentValue.trim() !== '') {
                // 開始時にクリア
                if (currentInputElement.tagName.toLowerCase() === 'textarea') {
                    forceSetTextAreaValue(currentInputElement, '');
                } else if (currentInputElement.isContentEditable) {
                    currentInputElement.textContent = '';
                } else {
                    currentInputElement.value = '';
                }
                currentInputElement.dispatchEvent(new Event('input', { bubbles: true }));
                // showStatus('テキストエリアをクリアしました'); // No need to show status here
            }
        }

        // 追記モードの場合、現在のテキストを保存
        if (appendMode && currentInputElement) {
            if (currentInputElement.isContentEditable) {
                originalText = currentInputElement.textContent || '';
            } else {
                originalText = currentInputElement.value || '';
            }
            interimText = '';
        }

        showStatus(appendMode ? 'statusListeningAppend' : 'statusListening');
    };

    recognition.onresult = async function(event) { // async に変更
        const results = event.results;
        const result = results[results.length - 1]; // 最新の結果を取得
        const transcript = result[0].transcript;

        if (!currentInputElement) return;

        // 追記モードの処理
        if (appendMode) {
            if (result.isFinal) {
                // 最終結果の場合
                const cleaned = basicCleanup(transcript);

                try {
                    // 校閲結果を取得
                    const corrected = await correctWithGPT(cleaned); // await を使用

                    // 元のテキストに追記（ReactUIでも確実に反映されるように改善）
                    if (simulateTypingIntoElement(currentInputElement, originalText + corrected)) {
                        // showStatus('React対応：タイピングシミュレーションで入力しました'); // Internal log
                    } else {
                        writeAppendedText(currentInputElement, corrected, true);
                    }

                    // 履歴に追加
                    addToHistory(corrected);

                    // showStatus(`校閲完了: ${corrected}`); // Show combined status below

                    // 追記モードでは自動送信しない
                    showStatus('statusCorrectionSuccess'); // Use key, append status handled below if needed
                } catch (error) {
                    console.error(chrome.i18n.getMessage('logCorrectionErrorAppend'), error);

                    // エラー時は元のテキストを使用
                    if (simulateTypingIntoElement(currentInputElement, originalText + cleaned)) {
                       // showStatus('React対応：タイピングシミュレーションで入力しました');
                    } else {
                        writeAppendedText(currentInputElement, cleaned, true);
                    }

                    addToHistory(cleaned);

                    // showStatus('校閲エラー: 元の認識結果を使用します');

                     // 追記モードでは自動送信しない
                     showStatus('statusCorrectionError', error.message || 'Unknown error');
                }
            } else {
                // 中間結果の場合
                // 現在の中間テキストを保存
                interimText = transcript;

                // 元のテキスト + 中間テキストを表示
                writeAppendedText(currentInputElement, transcript, false);
            }
        } else {
            // 通常の上書きモード
            if (result.isFinal) {
                // 基本クリーンアップ
                const cleaned = basicCleanup(transcript);

                // 文脈を考慮した校閲を実行
                try {
                    // 校閲結果を取得
                    const corrected = await correctWithGPT(cleaned); // await を使用

                    // React対応：タイピングシミュレーションを優先して試す
                    if (simulateTypingIntoElement(currentInputElement, corrected)) {
                        // showStatus('React対応：タイピングシミュレーションで入力しました');
                    } else {
                        // 従来の方法にフォールバック（Reactで認識されない可能性あり）
                        writeToInputField(currentInputElement, corrected);
                    }

                    // 校閲後のテキストを履歴に追加
                    addToHistory(corrected);

                    // showStatus(`校閲完了: ${corrected}`);
                    showStatus('statusCorrectionSuccess');

                    // 通常モードでは自動送信する
                    autoSubmitAfterVoiceInput();
               } catch (error) {
                   console.error(chrome.i18n.getMessage('logCorrectionErrorOverwrite'), error);

                   // エラー時は元のテキストを使用
                   if (simulateTypingIntoElement(currentInputElement, cleaned)) {
                        // showStatus('React対応：タイピングシミュレーションで入力しました');
                    } else {
                        writeToInputField(currentInputElement, cleaned);
                    }

                    addToHistory(cleaned);

                    // showStatus('校閲エラー: 元の認識結果を使用します');
                    showStatus('statusCorrectionError', error.message || 'Unknown error');

                     // エラー時でも通常モードなら自動送信する
                     autoSubmitAfterVoiceInput();
                }
            } else {
                // 途中経過は上書き
                writeToInputField(currentInputElement, transcript);
            }
        }
    };


    recognition.onend = function() {
        const wasListening = isListening; // 終了前の状態を保持
        isListening = false;
        updateMicButtonState(false);
        // 認識終了時にステータスをクリアしないように変更
        // showStatus('音声入力停止');

        // 常時オンモードが有効で、エラー以外で自然終了した場合に再開
        // (stopSpeechRecognitionによる意図的な停止の場合は再開しない)
        if (alwaysOnMode && wasListening) {
             console.log(chrome.i18n.getMessage('logRestartingAlwaysOn'));
             setTimeout(() => {
                 // isListening が false のままであれば再開
                 if (!isListening && alwaysOnMode) {
                    startSpeechRecognition();
                 }
             }, 100); // 少し待ってから再開
        }
    };

    recognition.onerror = function(event) {
        console.error(chrome.i18n.getMessage('logSpeechRecognitionError'), event.error);
        let messageKey = 'statusSpeechError';
        let substitutions = event.error;

        if (event.error === 'no-speech') {
            messageKey = 'statusSpeechErrorNoSpeech';
            substitutions = undefined;
        } else if (event.error === 'audio-capture') {
            messageKey = 'statusSpeechErrorAudioCapture';
             substitutions = undefined;
        } else if (event.error === 'not-allowed') {
            messageKey = 'statusSpeechErrorNotAllowed';
             substitutions = undefined;
        }
        showStatus(messageKey, substitutions);

        isListening = false; // エラー時は必ず停止状態にする
        updateMicButtonState(false);
        recognitionInstance = null; // エラー時はインスタンスもクリア
    };

    try {
        recognition.start();
    } catch (e) {
        console.error(chrome.i18n.getMessage('logSpeechStartError'), e);
        showStatus('statusSpeechStartError');
        isListening = false; // エラー時も状態をリセット
        updateMicButtonState(false);
        recognitionInstance = null; // エラー時はインスタンスもクリア
    }
}

// 音声認識停止 (明示的に停止する場合)
function stopSpeechRecognition() {
    // recognition インスタンスが存在し、かつ認識中の場合に停止
    if (recognitionInstance && isListening) {
        try {
            recognitionInstance.stop();
            // isListening とボタン状態は onend で更新される
            showStatus('statusSpeechStop');
        } catch (e) {
            console.error(chrome.i18n.getMessage('logSpeechStopError'), e);
            // エラーが発生した場合でも強制的に状態をリセット
            isListening = false;
            updateMicButtonState(false);
            recognitionInstance = null;
        }
    } else {
         // 認識中でない場合は状態だけ更新
         isListening = false;
         updateMicButtonState(false);
    }
}

// マイクボタンの状態更新 (常時オンモード対応)
function updateMicButtonState(active) {
    const micButton = document.getElementById('voice-input-btn');
    if (!micButton) return;

    // 通常の認識中アクティブ状態
    if (active) {
        micButton.classList.add('active');
    } else {
        micButton.classList.remove('active');
    }

    // 常時オンモードの視覚的フィードバック
    if (alwaysOnMode) {
        micButton.classList.add('always-on');
        micButton.title = chrome.i18n.getMessage('micTooltipAlwaysOn'); // ツールチップ更新
    } else {
        micButton.classList.remove('always-on');
        micButton.title = chrome.i18n.getMessage('micTooltip'); // ツールチップ更新
    }

    // ツールチップ表示用のラベル要素を取得して更新
    const label = micButton.querySelector('.voice-menu-label');
    if (label) {
        label.textContent = micButton.title;
    }
}

// ----- ヘルパー関数 -----
// 入力要素かどうかを判定
function isInputElement(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    const type = el.type ? el.type.toLowerCase() : '';
    // 読み取り専用でないことも確認
    const isReadOnly = el.readOnly || el.disabled || el.getAttribute('aria-readonly') === 'true';
    return !isReadOnly && (
        tag === 'textarea' ||
        (tag === 'input' && ['text', 'search', 'email', 'password', 'url', 'tel', ''].includes(type)) || // input typeを追加
        el.isContentEditable
    );
}

// 最適な入力フィールドを探す
function findBestInputField() {
    // ユーザーが指定した特定のテキストエリアを最優先で検索
    const specificTextarea = document.querySelector('textarea.textarea.w-full.resize-none.pl-2.pr-2[placeholder="メッセージを入力..."]');
    if (specificTextarea && isInputElement(specificTextarea)) {
        console.log(chrome.i18n.getMessage('logSpecificTextareaFound'));
        // showStatus('指定のテキストエリアを発見しました'); // No i18n needed for console log related status
        return specificTextarea;
    }

    // パディングクラスを含まない場合の検索（より広範囲）
    const specificTextareaAlt = document.querySelector('textarea.textarea.w-full.resize-none[placeholder="メッセージを入力..."]');
    if (specificTextareaAlt && isInputElement(specificTextareaAlt)) {
        console.log(chrome.i18n.getMessage('logSimilarTextareaFound'));
        // showStatus('近い仕様のテキストエリアを発見しました');
        return specificTextareaAlt;
    }

    // 一般的なTailwindスタイルのテキストエリアを検索
    const tailwindTextarea = document.querySelector('textarea.textarea.w-full.resize-none');
    if (tailwindTextarea && isInputElement(tailwindTextarea)) {
        console.log(chrome.i18n.getMessage('logTailwindTextareaFound'));
        return tailwindTextarea;
    }

    // 特定のplaceholderテキストを持つテキストエリアも優先
    const placeholderTextareas = Array.from(document.querySelectorAll('textarea[placeholder*="メッセージ"], textarea[placeholder*="message"]'));
    const visiblePlaceholderTextarea = placeholderTextareas.find(isInputElement);
    if (visiblePlaceholderTextarea) {
        console.log(chrome.i18n.getMessage('logMessageTextareaFound'));
        return visiblePlaceholderTextarea;
    }

    // それ以外のケースは通常通り処理
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], input[type="password"], input[type="url"], input[type="tel"], textarea, [contenteditable="true"]'));
    const visibleInputs = inputs.filter(isInputElement); // 編集可能な要素のみフィルタリング
    if (!visibleInputs.length) return null;

    // 画面内の要素を優先
    const inView = visibleInputs.filter(i => {
        const r = i.getBoundingClientRect();
        return r.top >= 0 && r.left >= 0 && // 画面左上からの位置も考慮
               r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
               r.right <= (window.innerWidth || document.documentElement.clientWidth) &&
               r.width > 0 && r.height > 0 && // サイズが0でないことを確認
               getComputedStyle(i).visibility !== 'hidden' &&
               getComputedStyle(i).display !== 'none' &&
               getComputedStyle(i).opacity !== '0'; // 透明でないことも確認
    });

    const targetInputs = inView.length > 0 ? inView : visibleInputs;

    // 検索ボックスらしき要素を探す
    const searchLike = targetInputs.find(i => {
        return ['id', 'name', 'className', 'placeholder', 'aria-label', 'title'].some(k => { // aria-label, titleも追加
            const value = i[k] || i.getAttribute(k); // 属性も取得
            return value && value.toString().toLowerCase().includes('search');
        });
    });

    if (searchLike) return searchLike;

    // チャット入力欄らしき要素を探す
    const chatLike = targetInputs.find(i => {
        return ['id', 'name', 'className', 'placeholder', 'aria-label', 'title'].some(k => {
            const value = i[k] || i.getAttribute(k);
            return value && value.toString().toLowerCase().match(/chat|message|入力|送信/); // 正規表現でキーワード検索
        });
    });
     if (chatLike) return chatLike;


    // 最も大きい要素を選択 (ただし、contenteditableは優先度を下げる)
    let largest = null;
    let maxArea = 0;
    for (const el of targetInputs) {
        const r = el.getBoundingClientRect();
        let area = r.width * r.height;
        // contenteditable の優先度を少し下げる
        if (el.isContentEditable) {
            area *= 0.8;
        }
        if (area > maxArea) {
            maxArea = area;
            largest = el;
        }
    }

    return largest || targetInputs[0]; // 見つからなければ最初の要素
}


// 追記モード用のテキスト書き込み関数
function writeAppendedText(el, txt, isFinal = false) {
    if (!el) return;

    // フォーカスを確保
    el.focus();

    // 元の値を保存
    const originalValue = el.isContentEditable ? el.textContent : el.value;

    // 新しいテキスト（元のテキスト + 新しいテキスト）
    const newText = originalText + txt;

    if (isFinal) {
        // 最終結果: 元テキスト + 認識結果を確定
        if (el.isContentEditable) {
            el.textContent = newText;
            // 次の認識のために元テキストを更新
            originalText = el.textContent;
        } else {
            el.value = newText;
            // 次の認識のために元テキストを更新
            originalText = el.value;
        }
        // 中間テキストをクリア
        interimText = '';
    } else {
        // 中間結果: 元テキスト + 中間認識結果を表示
        if (el.isContentEditable) {
            el.textContent = newText;
        } else {
            el.value = newText;
        }
    }

    // React対応: 複数のイベントを発火させてステート更新を確実にする
    try {
        // 1. inputイベント - 入力中の変更を検出
        el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        // 2. changeイベント - 値の変更を検出
        if (isFinal) {
            el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        }

        // 3. keydownイベント - キー入力をシミュレート（最後の文字）
        if (txt.length > 0) {
            const lastChar = txt[txt.length - 1];
            const keyEvent = new KeyboardEvent('keydown', {
                key: lastChar,
                code: 'Key' + lastChar.toUpperCase(), // 簡単なマッピング
                bubbles: true,
                cancelable: true
            });
            el.dispatchEvent(keyEvent);

            // 4. keyup イベントも発火
            const keyUpEvent = new KeyboardEvent('keyup', {
                key: lastChar,
                code: 'Key' + lastChar.toUpperCase(), // 簡単なマッピング
                bubbles: true,
                cancelable: true
            });
            el.dispatchEvent(keyUpEvent);
        }

        // ReactのonChangeをトリガーするには、値を一度変更して戻す方法も効果的
        if (!el.isContentEditable && originalValue !== newText && isFinal) {
            // 値を一時的に別の値に変更
            const tempValue = newText + " ";
            el.value = tempValue;
            el.dispatchEvent(new Event('input', { bubbles: true }));

            // 元の目的の値に戻す
            setTimeout(() => {
                el.value = newText;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }, 5);
        }
    } catch (e) {
        console.error(chrome.i18n.getMessage('logEventDispatchErrorAppend'), e);
        // 基本的なイベントだけ発火を試みる
        el.dispatchEvent(new Event('input', { bubbles: true }));
        if (isFinal) {
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

// フォーム内容を校閲する
async function proofreadCurrentInput() { // async に変更
    // 現在フォーカスされている要素またはクリックされた入力要素を取得
    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
        targetElement = lastClickedInput && isInputElement(lastClickedInput)
            ? lastClickedInput
            : findBestInputField();

        if (targetElement) {
            targetElement.focus();
            showStatus('statusInputFound');
        } else {
            showStatus('statusProofreadNotFound');
            return;
        }
    }

    // 入力内容を取得
    let content = '';
    if (targetElement.isContentEditable) {
        content = targetElement.textContent || '';
    } else {
        content = targetElement.value || '';
    }

    // 入力内容が空の場合
    if (!content.trim()) {
        showStatus('statusProofreadEmpty');
        return;
    }

    // APIキーがない場合
    if (!apiKey || apiKey.trim() === '') {
        showStatus('statusApiKeyMissing');
        toggleSettingsModal(); // 設定モーダルを開く
        return;
    }

    // 校閲中のステータス表示
    showStatus('statusProofreading');

    try {
        // GPT-4.1-miniで校閲
        const corrected = await proofreadWithGPT(content); // await を使用

        // 校閲結果を反映
        if (corrected) {
             // React対応：タイピングシミュレーションを試す
            if (simulateTypingIntoElement(targetElement, corrected)) {
                 // showStatus('React対応：タイピングシミュレーションで入力しました'); // Internal log
            } else {
                 // フォールバック
                 if (targetElement.isContentEditable) {
                     targetElement.textContent = corrected;
                 } else {
                     targetElement.value = corrected;
                 }
                 // イベント発火
                 targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                 targetElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
            showStatus('statusProofreadSuccess');
        } else {
            // corrected が null や undefined の場合のエラー処理は proofreadWithGPT 内で行われる想定
            // ここでは特に何もしないか、別のメッセージを表示
             showStatus('statusProofreadError'); // 例: 校閲結果が不正
        }
    } catch (error) {
        console.error(chrome.i18n.getMessage('logProofreadError'), error);
        showStatus('statusProofreadErrorDetail', error.message || 'Unknown error');
    }
}

// GPT-4.1でテキスト全体を校閲する (fetch を使用)
async function proofreadWithGPT(text) {
    if (!apiKey) throw new Error(chrome.i18n.getMessage('statusApiKeyMissing')); // Use i18n for error message

    try {
        showStatus('statusProofreadingModel', 'gpt-4.1'); // Use a new status key

        const requestBody = {
            model: "gpt-4.1", // Use gpt-4.1 for manual proofreading
            messages: [
                {
                    role: "system",
                    content: "あなたは日本語の文章を校正するアシスタントです。ユーザーが提供したテキスト全体に対して、誤字脱字、文法的な誤り、不自然な表現を修正し、より自然で読みやすい文章にしてください。元の文章の意味やニュアンスはできるだけ保ってください。修正後の文章のみを出力してください。" // Prompt adjusted for full text proofreading
                },
                {
                    role: "user",
                    content: text
                }
            ],
            max_tokens: 32768, // Increase max output tokens (adjust as needed, max depends on specific model version)
            temperature: 0.5 // Keep creativity low for proofreading
        };

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(chrome.i18n.getMessage('logOpenAiApiError'), errorData);
            throw new Error(`APIリクエスト失敗: ${response.status} ${response.statusText} - ${errorData.error?.message || '詳細不明'}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const correctedText = data.choices[0].message.content.trim();
            // showStatus('GPT校閲完了'); // Status handled by caller
            return correctedText;
        } else {
            console.error(chrome.i18n.getMessage('logOpenAiApiResponseUnexpected'), data);
            throw new Error(chrome.i18n.getMessage('statusCorrectionResponseError'));
        }
    } catch (error) {
        console.error(chrome.i18n.getMessage('logProofreadRequestError'), error);
        // showStatus(`GPT校閲エラー: ${error.message}`); // Status handled by caller
        throw error; // エラーを再スローして呼び出し元で処理
    }
}


// 入力フィールドにテキストを書き込む (React対応強化)
function writeToInputField(el, txt) {
    if (!el) return;

    // フォーカスを確保
    el.focus();

    // React対応：タイピングシミュレーションを試す
    if (simulateTypingIntoElement(el, txt)) {
        console.log(chrome.i18n.getMessage('logReactTypingSimulated'));
        return; // シミュレーション成功ならここで終了
    }

    // --- フォールバック：従来の方法 ---
    console.log(chrome.i18n.getMessage('logFallbackMethod'));
    const originalValue = el.isContentEditable ? el.textContent : el.value;

    if (el.isContentEditable) {
        el.textContent = txt;
    } else {
        el.value = txt;
    }

    // React対応: 複数のイベントを発火させてステート更新を確実にする
    try {
        // 1. inputイベント
        el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        // 2. changeイベント
        el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

        // 3. キーイベント (最後の文字)
        if (txt.length > 0) {
            const lastChar = txt[txt.length - 1];
            const keyDownEvent = new KeyboardEvent('keydown', {
                key: lastChar,
                code: 'Key' + lastChar.toUpperCase(),
                bubbles: true,
                cancelable: true
            });
            el.dispatchEvent(keyDownEvent);

            const keyPressEvent = new KeyboardEvent('keypress', { // keypressも追加
                key: lastChar,
                code: 'Key' + lastChar.toUpperCase(),
                bubbles: true,
                cancelable: true
            });
            el.dispatchEvent(keyPressEvent);

            const keyUpEvent = new KeyboardEvent('keyup', {
                key: lastChar,
                code: 'Key' + lastChar.toUpperCase(),
                bubbles: true,
                cancelable: true
            });
            el.dispatchEvent(keyUpEvent);
        }

        // 4. blur/focus イベント
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.dispatchEvent(new Event('focus', { bubbles: true }));


        // ReactのonChangeをトリガーする別の方法
        if (!el.isContentEditable && originalValue !== txt) {
            const tempValue = txt + " ";
            el.value = tempValue;
            el.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                el.value = txt;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }, 5);
        }
    } catch (e) {
        console.error(chrome.i18n.getMessage('logEventDispatchErrorFallback'), e);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
}


// 基本的なテキストクリーンアップ
function basicCleanup(text) {
    // 文頭・文末の空白削除
    let cleaned = text.trim();
    // 句読点の修正（例：連続する句読点を一つに）
    cleaned = cleaned.replace(/([、。]){2,}/g, '$1');
    // 不自然な空白の削除（例：句読点の前の空白）
    cleaned = cleaned.replace(/\s+([、。])/g, '$1');
    return cleaned;
}

// 音声入力履歴に追加
function addToHistory(text) {
    if (!text || text.trim() === '') return;

    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    voiceHistory.push({
        text: text,
        timestamp: timestamp
    });

    // 履歴が最大数を超えたら古いものから削除
    if (voiceHistory.length > MAX_HISTORY) {
        voiceHistory.shift();
    }

    // 履歴パネルが表示されていれば更新
    const panel = document.getElementById('voice-history-panel');
    if (panel && window.getComputedStyle(panel).display !== 'none') {
        updateHistoryPanel();
    }
}

// GPT-4o-miniで文脈を考慮して校閲 (fetch を使用)
async function correctWithGPT(text) {
    if (!apiKey) {
        showStatus('statusCorrectionSkip');
        console.log(chrome.i18n.getMessage('logApiKeyMissingSkip')); // Changed from console.warn to console.log
        return text; // APIキーがない場合は元のテキストを返す
    }
    if (!text || text.trim() === '') return text; // 空のテキストはそのまま返す

    try {
        showStatus('statusCorrecting');

        // 直近の会話履歴をコンテキストとして含める（最大5件）
        const conversationHistory = voiceHistory.slice(-5).map(item => ({
            role: "user", // 履歴はユーザーの発話として扱う
            content: item.text
        }));

        const requestBody = {
            model: "gpt-4o-mini", // モデル名を最新版に更新
            messages: [
                {
                    role: "system",
                    content: "あなたは日本語の音声入力をリアルタイムで校正するアシスタントです。ユーザーが話した内容（最後のメッセージ）を、誤字脱字、文法的な誤り、不自然な表現を修正し、より自然で読みやすい文章にしてください。直前の会話履歴（もしあれば）を文脈として考慮してください。修正後の文章のみを出力してください。"
                },
                ...conversationHistory, // 会話履歴を展開
                {
                    role: "user",
                    content: text // 今回の音声入力
                }
            ],
            max_tokens: 150, // 短い応答を期待
            temperature: 0.3 // より決定的な出力を促す
        };

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI APIエラー:', errorData);
            // APIキー不正などの特定のエラーを判定
            if (response.status === 401) {
                 showStatus('statusCorrectionApiKeyInvalid');
                 toggleSettingsModal(); // 設定モーダルを開く
            } else {
                 showStatus('statusCorrectionApiError', response.status.toString());
            }
            // エラーが発生しても、元のテキストを返すことで処理を継続
            console.warn(chrome.i18n.getMessage('logApiRequestFailedUseOriginal', response.status.toString()));
            return text;
            // throw new Error(`APIリクエスト失敗: ${response.status} ${response.statusText} - ${errorData.error?.message || '詳細不明'}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const correctedText = data.choices[0].message.content.trim();
            // showStatus('GPT校閲完了'); // Status handled by caller
            return correctedText;
        } else {
            console.warn(chrome.i18n.getMessage('logApiResponseUnexpected'), data);
            showStatus('statusCorrectionResponseError');
            return text; // 予期せぬ応答でも元のテキストを返す
            // throw new Error(chrome.i18n.getMessage('statusCorrectionResponseError'));
        }
    } catch (error) {
        console.error('GPT校閲リクエストエラー:', error);
        showStatus('statusCorrectionError', error.message || 'Unknown error');
        // ネットワークエラーなどでも元のテキストを返す
        console.warn(chrome.i18n.getMessage('logCorrectionRequestErrorUseOriginal'));
        return text;
        // throw error; // エラーを再スローしない
    }
}


// Function to process the recognized edit instruction
async function processEditInstruction(instruction) {
    const activeElement = document.activeElement;

    if (!activeElement || !['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
        console.warn(chrome.i18n.getMessage('logNoActiveElement'));
        showStatus('statusError'); // Or a specific error status
        isEditing = false; // Exit editing mode
        isListening = false;
        updateMicButtonState(false);
        return;
    }

    const currentText = activeElement.value;

    if (!apiKey) {
        showStatus('errorEditApiKeyMissing');
        console.log(chrome.i18n.getMessage('logEditApiKeyMissing')); // Use log level
        isEditing = false; // Exit editing mode
        isListening = false;
        updateMicButtonState(false);
        return;
    }

    showStatus('statusProofreading'); // "編集中..." (Using proofreading status for now)
    await editWithGPT(currentText, instruction, activeElement);

    isEditing = false; // Exit editing mode after processing
    isListening = false;
    updateMicButtonState(false);
}

// Function to edit text using GPT based on instructions
async function editWithGPT(currentText, instruction, activeElement) {
    // API Key check is done in processEditInstruction
    console.log("Editing with GPT:", { currentText, instruction });

    const model = "gpt-4.1"; // Using GPT-4 Turbo as requested (closest available identifier)
    const maxTokens = 32768;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant that edits text based on user instructions. Apply the instructions to the provided text and output only the resulting edited text, without any explanations or introductory phrases."
                    },
                    {
                        role: "user",
                        content: `Existing text:\n---\n${currentText}\n---\n\nEdit instruction:\n---\n${instruction}\n---\n\nEdited text:`
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.5 // Lower temperature for more predictable editing
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', response.status, errorData);
            showStatus('statusEditingError'); // "編集エラー"
            return; // Don't proceed if API call failed
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const editedText = data.choices[0].message.content.trim();
            console.log('Edited text:', editedText);
            activeElement.value = editedText; // Update the input field
            showStatus('statusEditingComplete'); // "編集完了"
        } else {
            console.error('Invalid response from OpenAI API:', data);
            showStatus('statusEditingError');
        }
    } catch (error) {
        console.error('Error calling OpenAI API for editing:', error);
        showStatus('statusEditingError');
    }
}


// 定期的な自己修復機能（UI要素が消えた場合に再生成）
function setupPeriodicSelfHealing() {
    setInterval(() => {
        const menuButton = document.getElementById('voice-menu-btn');
        if (!menuButton) {
            console.warn(chrome.i18n.getMessage('logUiNotFoundHealing'));
            initVoiceInput(); // UIとイベントリスナーを再初期化
        }
    }, 10000); // 10秒ごとにチェック
}

// ----- 初期化処理の実行 -----
async function runInitialization() {
    await loadSettings(); // 設定を先に読み込む
    initVoiceInput(); // UIなどを初期化

    // SPA対応の監視を開始
    setupDOMObserver();

    // 自己修復機能を開始
    setupPeriodicSelfHealing();

    console.log(chrome.i18n.getMessage('logExtensionLoaded'));
}

runInitialization();