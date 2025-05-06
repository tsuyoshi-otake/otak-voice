/**
 * site-detector.js (サイト検出エンジン) のテスト
 */

import { detectSiteType, getSiteHandler } from '../../site-handlers/site-detector.js';
import { SITE_TYPES } from '../../constants.js';
import * as SystemExeHandler from '../../site-handlers/systemexe.js';
import * as AIChatHandler from '../../site-handlers/ai-chat.js';
import * as TwitterHandler from '../../site-handlers/twitter.js';
import * as DefaultHandler from '../../site-handlers/default.js';

// 環境セットアップ
beforeEach(() => {
  // ウィンドウロケーションのモック
  delete window.location;
  window.location = { hostname: '' };
  
  // ドキュメントボディのリセット
  document.body.innerHTML = '';
  
  // コンソールログのモック
  global.console.log = jest.fn();
});

// テスト後のクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
});

describe('Site Detector Tests', () => {
  // System.exeサイト検出テスト
  it('should detect System.exe site by hostname', () => {
    // System.exeドメインを設定
    window.location.hostname = 'systemexe-research-and-development.com';
    
    // 検出テスト
    const siteType = detectSiteType();
    
    // 検証
    expect(siteType).toBe(SITE_TYPES.SYSTEMEXE);
  });
  
  // Twitterサイト検出テスト
  it('should detect Twitter site by hostname', () => {
    // Twitterドメインを設定
    window.location.hostname = 'twitter.com';
    
    // 検出テスト
    const siteType = detectSiteType();
    
    // 検証
    expect(siteType).toBe(SITE_TYPES.TWITTER);
    
    // X.comドメインでも同様
    window.location.hostname = 'x.com';
    expect(detectSiteType()).toBe(SITE_TYPES.TWITTER);
  });
  
  // AIチャットサイト検出テスト（DOMベース）
  it('should detect AI chat site by DOM elements', () => {
    // AIチャットサイト特有の要素を作成
    const submitButton = document.createElement('button');
    submitButton.setAttribute('data-testid', 'send-button');
    document.body.appendChild(submitButton);
    
    // 検出テスト
    const siteType = detectSiteType();
    
    // 検証
    expect(siteType).toBe(SITE_TYPES.AI_CHAT);
  });
  
  // AIチャットサイト検出テスト（SVGパターンベース）
  it('should detect AI chat site by SVG pattern', () => {
    // ペーパープレーンSVGパターンを持つボタンを作成
    const button = document.createElement('button');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
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
    
    // 検出テスト
    const siteType = detectSiteType();
    
    // 検証
    expect(siteType).toBe(SITE_TYPES.AI_CHAT);
  });
  
  // デフォルトサイト検出テスト
  it('should return DEFAULT for unknown sites', () => {
    // 未知のドメインを設定
    window.location.hostname = 'unknown-site.com';
    
    // 検証
    expect(detectSiteType()).toBe(SITE_TYPES.DEFAULT);
  });
  
  // ハンドラー取得テスト（System.exe）
  it('should get SystemExe handler for System.exe sites', () => {
    // System.exeドメインを設定
    window.location.hostname = 'systemexe-research-and-development.com';
    
    // ハンドラー取得
    const handler = getSiteHandler();
    
    // 検証
    expect(handler).toBe(SystemExeHandler);
  });
  
  // ハンドラー取得テスト（Twitter）
  it('should get Twitter handler for Twitter sites', () => {
    // Twitterドメインを設定
    window.location.hostname = 'twitter.com';
    
    // ハンドラー取得
    const handler = getSiteHandler();
    
    // 検証
    expect(handler).toBe(TwitterHandler);
  });
  
  // ハンドラー取得テスト（AIチャット）
  it('should get AI chat handler for AI chat sites', () => {
    // AIチャットサイト特有の要素を作成
    const submitButton = document.createElement('button');
    submitButton.setAttribute('aria-label', 'Send message');
    document.body.appendChild(submitButton);
    
    // ハンドラー取得
    const handler = getSiteHandler();
    
    // 検証
    expect(handler).toBe(AIChatHandler);
  });
  
  // ハンドラー取得テスト（デフォルト）
  it('should get Default handler for unknown sites', () => {
    // 未知のドメインを設定
    window.location.hostname = 'unknown-site.com';
    
    // ハンドラー取得
    const handler = getSiteHandler();
    
    // 検証
    expect(handler).toBe(DefaultHandler);
  });
});