/**
 * DOMテスト用ヘルパー関数
 * テスト間の重複コードを削減し、一貫性のある設定を提供します
 */

/**
 * ホスト名を指定してwindow.locationをモック
 * @param {string} hostname - 設定するホスト名
 * @returns {Object} - 設定されたwindow.location
 */
export function setupLocationMock(hostname) {
  delete window.location;
  window.location = { hostname };
  return window.location;
}

/**
 * 送信ボタンをDOMに追加
 * @param {Object} options - オプション設定
 * @param {string} [options.ariaLabel] - aria-label属性の値
 * @param {string} [options.testId] - data-testid属性の値
 * @param {boolean} [options.disabled] - 無効状態にするかどうか
 * @param {string} [options.selector] - カスタムセレクター用のクラスまたはID
 * @returns {HTMLElement} - 作成されたボタン要素
 */
export function createSubmitButton(options = {}) {
  const button = document.createElement('button');
  if (options.ariaLabel) button.setAttribute('aria-label', options.ariaLabel);
  if (options.testId) button.setAttribute('data-testid', options.testId);
  if (options.disabled) button.disabled = true;
  if (options.selector) {
    if (options.selector.startsWith('.')) {
      button.className = options.selector.substring(1);
    } else if (options.selector.startsWith('#')) {
      button.id = options.selector.substring(1);
    }
  }
  document.body.appendChild(button);
  return button;
}

/**
 * 入力フィールドをDOMに追加
 * @param {Object} options - オプション設定
 * @param {string} [options.placeholder] - プレースホルダーテキスト
 * @param {boolean} [options.isVisible] - 表示状態にするかどうか
 * @param {string} [options.value] - 初期値
 * @returns {HTMLElement} - 作成されたテキストエリア要素
 */
export function createInputField(options = {}) {
  const input = document.createElement('textarea');
  if (options.placeholder) input.setAttribute('placeholder', options.placeholder);
  if (options.value) input.value = options.value;
  
  // 表示状態を設定
  if (options.isVisible === false) {
    input.style.display = 'none';
  }
  
  document.body.appendChild(input);
  return input;
}

/**
 * ペーパープレーンアイコン（SVG）を持つボタンを作成
 * AIチャットプラットフォームに共通する送信ボタンのSVGパターン
 * @returns {HTMLElement} - 作成されたボタン要素
 */
export function createPaperPlaneButton() {
  const button = document.createElement('button');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  // ペーパープレーンのパターンを持つ要素を作成
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '22');
  line.setAttribute('y1', '2');
  line.setAttribute('x2', '11');
  line.setAttribute('y2', '13');
  
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '22 2 15 22 11 13 2 9 22 2');
  
  svg.appendChild(line);
  svg.appendChild(polygon);
  button.appendChild(svg);
  
  document.body.appendChild(button);
  return button;
}

/**
 * テスト用のDOMリセット
 * document.bodyをクリアして初期状態に戻します
 */
export function resetDOM() {
  document.body.innerHTML = '';
  
  // 追加のDOM状態リセットが必要な場合はここに追加
}

/**
 * 要素を画面上の特定位置に配置するためのヘルパー
 * getBoundingClientRectをモックして要素の位置をシミュレートします
 * @param {HTMLElement} element - 位置を設定する要素
 * @param {Object} position - 位置情報（top, left, width, height）
 */
export function mockElementPosition(element, position) {
  // jestが利用できない場合のフォールバック
  const mockFn = typeof jest !== 'undefined' && jest.fn
    ? jest.fn()
    : () => {};
  
  // mockReturnValueが利用できない場合は単純な関数を作成
  const mockReturnValue = mockFn.mockReturnValue
    ? mockFn.mockReturnValue.bind(mockFn)
    : (val) => {
        mockFn.returnValue = val;
        return mockFn;
      };
  
  element.getBoundingClientRect = mockReturnValue({
    top: position.top || 0,
    left: position.left || 0,
    width: position.width || 100,
    height: position.height || 30,
    bottom: position.bottom || (position.top || 0) + (position.height || 30),
    right: position.right || (position.left || 0) + (position.width || 100)
  });
  
  return element;
}