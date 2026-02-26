/**
 * Input Menu Module
 * Provides menu and settings modal UI operations
 */

import { saveAutoSubmitState, saveMenuState } from './input-storage.js';
import { getState, setState } from './state.js';
import { publish, EVENTS } from './event-bus.js';
import { updateSettingsModalValues } from './ui.js';
import { MENU_ICON } from '../icons.js';

/**
 * Toggle menu display
 */
export function toggleMenu() {
    const menuContainer = document.getElementById('otak-voice-menu-container');
    const menuButton = document.getElementById('otak-voice-menu-btn');

    if (!menuContainer || !menuButton) return;

    // Get current menu state from state management
    const currentMenuExpanded = getState('menuExpanded');

    // Toggle menu state
    const newMenuExpanded = !currentMenuExpanded;

    // Update state in state management
    setState('menuExpanded', newMenuExpanded);

    // Update menu state
    updateMenuState();

    // Save menu state
    // await might not be necessary, but consider wrapping in try...catch for error handling
    saveMenuState(newMenuExpanded);
}

/**
 * Update menu state
 */
export function updateMenuState() {
    const menuContainer = document.getElementById('otak-voice-menu-container');
    const menuButton = document.getElementById('otak-voice-menu-btn');

    if (!menuContainer || !menuButton) {
        console.log('Menu elements not found');
        return;
    }

    // Update menu container state
    const menuExpanded = getState('menuExpanded');
    if (menuExpanded) {
        menuContainer.classList.add('otak-voice-menu__container--expanded');
        menuButton.classList.add('otak-voice-menu__btn--expanded');

        // Update menu button icon - directly set the innerHTML since it doesn't have an icon container
        menuButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="15" y1="5" x2="5" y2="15"></line>
          <line x1="5" y1="5" x2="15" y2="15"></line>
        </svg>`;
    } else {
        menuContainer.classList.remove('otak-voice-menu__container--expanded');
        menuButton.classList.remove('otak-voice-menu__btn--expanded');

        // Update menu button icon - directly set the innerHTML
        // Use MENU_ICON directly from import
        menuButton.innerHTML = MENU_ICON;
        // Close history panel when menu is closed
        const historyPanel = document.getElementById('otak-voice-history-panel');
        if (historyPanel) historyPanel.style.display = 'none';
        // Close settings modal as well
        const settingsModal = document.getElementById('otak-voice-settings-modal');
        if (settingsModal) settingsModal.style.display = 'none';
    }
}

/**
 * Updates the auto submit button state
 * @param {boolean} autoSubmit - Auto submit state
 */
export function updateAutoSubmitButtonState(autoSubmit) {
    const autoSubmitButton = document.querySelector('.otak-voice-menu__append-btn');
    if (!autoSubmitButton) return;

    // モーダル表示トグルボタンと一致させるため、
    // 自動送信がONの場合はアクティブクラスを削除し、
    // 自動送信がOFFの場合はアクティブクラスを追加します。

    if (autoSubmit) {
        // 自動送信がONの場合、アクティブ状態のクラスを削除
        autoSubmitButton.classList.remove('otak-voice-menu__append-btn--active');

        // インラインスタイルを削除（CSSクラスに依存）
        autoSubmitButton.style.backgroundColor = '';
        autoSubmitButton.style.color = '';
        autoSubmitButton.style.borderColor = '';
        autoSubmitButton.style.boxShadow = '';

        publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusAutoSubmitOn', persistent: false });
    } else {
        // 自動送信がOFFの場合、アクティブ状態のクラスを追加
        autoSubmitButton.classList.add('otak-voice-menu__append-btn--active');

        // インラインスタイルを削除（CSSクラスに依存）
        autoSubmitButton.style.backgroundColor = '';
        autoSubmitButton.style.color = '';
        autoSubmitButton.style.borderColor = '';
        autoSubmitButton.style.boxShadow = '';

        publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusAutoSubmitOff', persistent: false });
    }
}

/**
 * 自動送信機能を切り替えます
 */
export function toggleAutoSubmit(fromMenuButton = false) {
    // Check if the toggle is coming from the settings modal or menu button
    const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');

    // メニューボタンからの呼び出しの場合、または設定画面のチェックボックスが存在しない場合は即時に反映
    if (fromMenuButton || !autoSubmitCheckbox) {
        // 現在の状態を取得して反転
        const currentAutoSubmit = getState('autoSubmit');
        const newAutoSubmit = !currentAutoSubmit;

        // Update state
        setState('autoSubmit', newAutoSubmit);

        // Save state to sync storage
        console.log('Toggling auto submit state to:', newAutoSubmit);
        saveAutoSubmitState(newAutoSubmit);

        // Update UI to reflect the new state
        updateAutoSubmitButtonState(newAutoSubmit);

        // 設定モーダルが表示されている場合は、設定モーダル内のすべての値を更新
        const settingsModal = document.getElementById('otak-voice-settings-modal');
        if (settingsModal && settingsModal.style.display === 'block' && typeof updateSettingsModalValues === 'function') {
            // ui.jsのupdateSettingsModalValues関数を呼び出す
            updateSettingsModalValues();
        } else {
            // 設定モーダルが表示されていない場合は、チェックボックスのみ更新
            const modalAutoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
            if (modalAutoSubmitCheckbox) {
                // チェックボックスの状態を自動送信の状態と一致させる（ONの場合はチェックをON、OFFの場合はチェックをOFF）
                modalAutoSubmitCheckbox.checked = newAutoSubmit;
            }
        }
    } else {
        // 設定画面からの呼び出しの場合は、保存ボタンを押したときに反映されるように、即時保存しない
        // 変更は一時的な状態として保持される
        console.log('Auto submit checkbox changed, will be applied when Save is clicked');
    }
}
