/**
 * Site Detector Module Tests
 */

// モジュールのモック
jest.mock('../../site-handlers/systemexe.js');
jest.mock('../../site-handlers/ai-chat.js');
jest.mock('../../site-handlers/twitter.js');
jest.mock('../../site-handlers/default.js');

// インポート
import { detectSiteType, getSiteHandler } from '../../site-handlers/site-detector';
import { SITE_TYPES } from '../../constants';
import * as SystemExeHandler from '../../site-handlers/systemexe.js';
import * as AIChatHandler from '../../site-handlers/ai-chat.js';
import * as TwitterHandler from '../../site-handlers/twitter.js';
import * as DefaultHandler from '../../site-handlers/default.js';

describe('Site Detector', () => {
  // テスト前の準備
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    
    // consoleのモック
    console.log = jest.fn();
    
    // locationのモック
    delete window.location;
    window.location = {
      hostname: '',
      includes: jest.fn(str => window.location.hostname.includes(str))
    };
    
    // documentのquerySelectorのモック
    document.querySelector = jest.fn(() => null);
    
    // documentのquerySelectorAllのモック
    document.querySelectorAll = jest.fn(() => []);
  });
  
  describe('detectSiteType', () => {
    it('should detect SystemExe site', () => {
      // SystemExeドメインをシミュレート
      window.location.hostname = 'systemexe-research-and-development.com';
      
      // 関数呼び出し
      const result = detectSiteType();
      
      // 検証
      expect(result).toBe(SITE_TYPES.SYSTEMEXE);
    });
    
    it('should detect Twitter site', () => {
      // Twitterドメインをシミュレート
      window.location.hostname = 'twitter.com';
      
      // 関数呼び出し
      const result = detectSiteType();
      
      // 検証
      expect(result).toBe(SITE_TYPES.TWITTER);
    });
    
    it('should detect x.com site', () => {
      // x.comドメインをシミュレート
      window.location.hostname = 'x.com';
      
      // 関数呼び出し
      const result = detectSiteType();
      
      // 検証
      expect(result).toBe(SITE_TYPES.TWITTER);
    });
    
    it('should detect AI chat site by selectors', () => {
      // AIチャットセレクタによる検出をシミュレート
      document.querySelector.mockImplementation((selector) => {
        if (selector === 'button[aria-label="Send message"]') {
          return document.createElement('button');
        }
        return null;
      });
      
      // 関数呼び出し
      const result = detectSiteType();
      
      // 検証
      expect(result).toBe(SITE_TYPES.AI_CHAT);
      expect(document.querySelector).toHaveBeenCalledWith('button[aria-label="Send message"]');
    });
    
    it('should detect AI chat site by SVG pattern', () => {
      // SVGパターン検出をシミュレート
      const mockButton = {
        querySelector: jest.fn().mockReturnValue({
          // SVGのモック
          querySelector: jest.fn().mockImplementation((selector) => {
            if (selector === 'line[x1="22"][y1="2"][x2="11"][y2="13"]') {
              return { /* line element */ };
            } else if (selector === 'polygon[points="22 2 15 22 11 13 2 9 22 2"]') {
              return { /* polygon element */ };
            }
            return null;
          })
        })
      };
      
      // ボタンのリストをシミュレート
      document.querySelectorAll.mockReturnValue([mockButton]);
      
      // 関数呼び出し
      const result = detectSiteType();
      
      // 検証
      expect(result).toBe(SITE_TYPES.AI_CHAT);
      expect(document.querySelectorAll).toHaveBeenCalledWith('button');
    });
    
    it('should return DEFAULT when no specific site is detected', () => {
      // 特定のサイトパターンが検出されない状態
      window.location.hostname = 'example.com';
      
      // 関数呼び出し
      const result = detectSiteType();
      
      // 検証
      expect(result).toBe(SITE_TYPES.DEFAULT);
    });
  });
  
  describe('getSiteHandler', () => {
    it('should return SystemExe handler for SystemExe site', () => {
      // SystemExeサイト検出をシミュレート
      jest.spyOn(window.location, 'includes').mockReturnValue(true);
      window.location.hostname = 'systemexe-research-and-development.com';
      
      // 関数呼び出し
      const handler = getSiteHandler();
      
      // 検証
      expect(handler).toBe(SystemExeHandler);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('SystemExe'));
    });
    
    it('should return Twitter handler for Twitter site', () => {
      // Twitterサイト検出をシミュレート
      window.location.hostname = 'twitter.com';
      
      // 関数呼び出し
      const handler = getSiteHandler();
      
      // 検証
      expect(handler).toBe(TwitterHandler);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Twitter'));
    });
    
    it('should return AI Chat handler for AI chat site', () => {
      // AIチャットサイト検出をシミュレート
      document.querySelector.mockImplementation((selector) => {
        if (selector === 'button[aria-label="Send"]') {
          return document.createElement('button');
        }
        return null;
      });
      
      // 関数呼び出し
      const handler = getSiteHandler();
      
      // 検証
      expect(handler).toBe(AIChatHandler);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AI Chat'));
    });
    
    it('should return Default handler for unknown site', () => {
      // 不明なサイトをシミュレート
      window.location.hostname = 'example.com';
      
      // 関数呼び出し
      const handler = getSiteHandler();
      
      // 検証
      expect(handler).toBe(DefaultHandler);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Default'));
    });
  });
});