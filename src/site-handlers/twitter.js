/**
 * x.com (Twitter) Site Handler
 * Provides x.com site-specific processing
 *
 * 注意: x.comはReact/Draft.jsベースの複雑なエディタを使用しており、
 * DOMを直接操作すると内部状態が壊れ、JavaScriptエラーが発生します。
 * そのため、音声認識テキストをモーダルダイアログで表示し、
 * ユーザーが手動でコピー＆ペーストできるようにしています。
 */

import { showStatus, showRecognitionTextModal } from '../modules/ui.js';
import { findElement, findAllElements } from '../modules/dom-utils.js';
import { publish, EVENTS } from '../modules/event-bus.js';

/**
 * Finds the post input field on x.com
 * @returns {Element|null} Input element or null
 */
export function findBestInputField() {
  console.log('x.com site handler: findBestInputField called');
  
  // twitter.comでは常にnullを返す（入力フィールドの自動検出を無効化）
  console.log('x.com site handler: Returning null to disable auto-detection on twitter.com');
  
  // Publish event to show warning about Twitter compatibility
  publish(EVENTS.STATUS_UPDATED, {
    messageKey: 'statusTwitterNotSupported',
    persistent: true
  });
  
  return null;
}

/**
 * Finds the submit button related to the input field
 * @param {Element} inputElement - Input element
 * @returns {Element|null} Submit button element or null
 */
export function findSubmitButtonForInput(inputElement) {
  console.log('x.com site handler: findSubmitButtonForInput called');
  
  if (!inputElement) return null;
  
  // x.comの送信ボタンを検索 (using the abstraction layer)
  const tweetButton = findElement('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
  
  if (tweetButton) {
    console.log('x.com site handler: Found tweet button');
    return tweetButton;
  }
  
  console.log('x.com site handler: Could not find tweet button');
  return null;
}

/**
 * Performs auto-submit after voice input
 * @returns {boolean} true if submission process started
 */
export function submitAfterVoiceInput() {
  console.log('x.com site handler: submitAfterVoiceInput called');
  
  // Get the last recognized text from state
  const lastRecognizedText = window.lastRecognizedText;
  
  // x.comでは音声認識テキストをモーダルダイアログで表示する
  if (lastRecognizedText) {
    // Show modal with recognized text for manual copy/paste
    showRecognitionTextModal(lastRecognizedText);
    
    // Publish event to show Twitter compatibility message
    publish(EVENTS.STATUS_UPDATED, {
      messageKey: 'statusTwitterUseModal',
      persistent: false
    });
    
    return true;
  }
  
  return false;
}

/**
 * Checks if current page is Twitter/X.com
 * @returns {boolean} true if current page is Twitter
 */
export function isTwitterPage() {
  const hostname = window.location.hostname;
  return hostname.includes('twitter.com') ||
         hostname.includes('x.com') ||
         hostname.includes('mobile.twitter.com');
}