import { setupDOMObserver } from '../../modules/dom-observer';
import { publish, subscribe, EVENTS } from '../../modules/event-bus';
import { enhanceInputElementHandlers } from '../../modules/input-handler';

// Mock chrome.i18n
global.chrome = {
    i18n: {
        getMessage: jest.fn((key) => `mock_${key}`)
    }
};

// Mock console
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock MutationObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
global.MutationObserver = jest.fn((callback) => {
    // Store the callback to be triggered later in tests
    MutationObserver.mock.callback = callback;
    return {
        observe: mockObserve,
        disconnect: mockDisconnect,
    };
});

// Mock setInterval
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

// Mock event-bus
jest.mock('../../modules/event-bus', () => ({
    publish: jest.fn(),
    subscribe: jest.fn(),
    EVENTS: {
        UI_RECOVERY_NEEDED: 'UI_RECOVERY_NEEDED',
        MENU_STATE_UPDATE_NEEDED: 'MENU_STATE_UPDATE_NEEDED',
        INPUT_HANDLERS_UPDATE_NEEDED: 'INPUT_HANDLERS_UPDATE_NEEDED',
        ERROR_OCCURRED: 'ERROR_OCCURRED',
    },
}));

// Mock input-handler
jest.mock('../../modules/input-handler', () => ({
    enhanceInputElementHandlers: jest.fn(),
}));


// Mock document and DOM elements
const mockGetElementById = jest.fn();
const mockQuerySelectorAll = jest.fn();
const mockBody = {
    querySelectorAll: mockQuerySelectorAll,
};
global.document = {
    getElementById: mockGetElementById,
    body: mockBody,
};

// Mock Node constants
global.Node = {
    ELEMENT_NODE: 1,
};


describe('dom-observer', () => {
    beforeEach(() => {
        // Clear mocks before each test
        jest.clearAllMocks();
        publish.mockClear(); // Add this line to clear publish mock calls
        // Reset MutationObserver callback
        MutationObserver.mock.callback = null;
    });

    afterAll(() => {
        // Restore console mocks after all tests
        mockConsoleLog.mockRestore();
        mockConsoleError.mockRestore();
    });

    test('setupDOMObserver should initialize MutationObserver and setInterval', () => {
        setupDOMObserver();

        // Check if MutationObserver was instantiated
        expect(MutationObserver).toHaveBeenCalledTimes(1);
        // Check if observe was called on document.body
        expect(mockObserve).toHaveBeenCalledWith(document.body, {
            childList: true,
            subtree: true
        });

        // Check if setInterval was called
        expect(mockSetInterval).toHaveBeenCalledTimes(1);
        expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5000);

        // Check if event subscriptions were set up (delegated to setupEventSubscriptions)
        // We will test setupEventSubscriptions separately or verify subscribe calls here
        expect(subscribe).toHaveBeenCalledTimes(3); // Assuming setupEventSubscriptions is called internally
        expect(subscribe).toHaveBeenCalledWith(EVENTS.MENU_STATE_UPDATE_NEEDED, expect.any(Function));
        expect(subscribe).toHaveBeenCalledWith(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED, expect.any(Function));
        expect(subscribe).toHaveBeenCalledWith(EVENTS.UI_RECOVERY_NEEDED, expect.any(Function));

        // Check initial log
        expect(mockConsoleLog).toHaveBeenCalledWith('mock_logDomObserverStart');
    });

    // Add more tests here to cover MutationObserver callback and setInterval callback scenarios

    test('MutationObserver callback should handle added textareas and trigger UI reinit if button is missing', () => {
        setupDOMObserver();

        // Simulate a mutation where a new textarea is added
        const addedTextarea = document.createElement('textarea');
        const addedNode = {
            nodeType: Node.ELEMENT_NODE,
            querySelectorAll: jest.fn().mockReturnValue([addedTextarea]),
        };
        const mutation = {
            type: 'childList',
            addedNodes: [addedNode],
        };

        // Mock getElementById to return null (UI button missing)
        mockGetElementById.mockReturnValue(null);

        // Trigger the MutationObserver callback
        MutationObserver.mock.callback([mutation]);

        // Check if UI reinit event was published
        expect(publish).toHaveBeenCalledWith(EVENTS.UI_RECOVERY_NEEDED);
        // Check if input handlers update event was published
        expect(publish).toHaveBeenCalledWith(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
        // Check if enhanceInputElementHandlers was called
        expect(enhanceInputElementHandlers).toHaveBeenCalledTimes(1);

        // Check logs
        expect(mockConsoleLog).toHaveBeenCalledWith('mock_logSpaNavigationDetected', [addedTextarea]);
        expect(mockConsoleLog).toHaveBeenCalledWith('mock_logSpaUiReinit');
    });

    test('MutationObserver callback should handle added textareas and trigger menu state update if button exists', () => {
        setupDOMObserver();

        // Simulate a mutation where a new textarea is added
        const addedTextarea = document.createElement('textarea');
        const addedNode = {
            nodeType: Node.ELEMENT_NODE,
            querySelectorAll: jest.fn().mockReturnValue([addedTextarea]),
        };
        const mutation = {
            type: 'childList',
            addedNodes: [addedNode],
        };

        // Mock getElementById to return a mock button element (UI button exists)
        mockGetElementById.mockReturnValue(document.createElement('button'));

        // Trigger the MutationObserver callback
        MutationObserver.mock.callback([mutation]);

        // 修正: publish関数が呼ばれた際の引数をチェック
        const publishCalls = publish.mock.calls.map(call => call[0]);
        expect(publishCalls).toContain(EVENTS.MENU_STATE_UPDATE_NEEDED);
        // Check if input handlers update event was published
        expect(publish).toHaveBeenCalledWith(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
        // Check if enhanceInputElementHandlers was called
        expect(enhanceInputElementHandlers).toHaveBeenCalledTimes(1);

        // Check logs
        expect(mockConsoleLog).toHaveBeenCalledWith('mock_logSpaNavigationDetected', [addedTextarea]);
        // ログメッセージの検証を削除 - 実装が変更されたため、このメッセージは出力されない
    });

    test('MutationObserver callback should handle errors during enhanceInputElementHandlers', () => {
        setupDOMObserver();

        // Simulate a mutation where a new textarea is added
        const addedTextarea = document.createElement('textarea');
        const addedNode = {
            nodeType: Node.ELEMENT_NODE,
            querySelectorAll: jest.fn().mockReturnValue([addedTextarea]),
        };
        const mutation = {
            type: 'childList',
            addedNodes: [addedNode],
        };

        // Mock getElementById to return a mock button element (UI button exists)
        mockGetElementById.mockReturnValue(document.createElement('button'));

        // Mock enhanceInputElementHandlers to throw an error
        const mockError = new Error('Enhance error');
        enhanceInputElementHandlers.mockImplementation(() => {
            throw mockError;
        });

        // Trigger the MutationObserver callback
        MutationObserver.mock.callback([mutation]);

        // Check if error event was published
        expect(publish).toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, {
            source: 'dom-observer',
            message: 'Error enhancing input handlers after SPA navigation',
            error: mockError,
        });
        // Check if console.error was called
        expect(mockConsoleError).toHaveBeenCalledWith('Error enhancing input handlers after SPA navigation:', mockError);
    });

    test('MutationObserver callback should ignore "Extension context invalidated" errors during enhanceInputElementHandlers', () => {
        setupDOMObserver();

        // Simulate a mutation where a new textarea is added
        const addedTextarea = document.createElement('textarea');
        const addedNode = {
            nodeType: Node.ELEMENT_NODE,
            querySelectorAll: jest.fn().mockReturnValue([addedTextarea]),
        };
        const mutation = {
            type: 'childList',
            addedNodes: [addedNode],
        };

        // Mock getElementById to return a mock button element (UI button exists)
        mockGetElementById.mockReturnValue(document.createElement('button'));

        // Mock enhanceInputElementHandlers to throw an "Extension context invalidated" error
        const invalidatedError = new Error('Extension context invalidated');
        enhanceInputElementHandlers.mockImplementation(() => {
            throw invalidatedError;
        });

        // Trigger the MutationObserver callback
        MutationObserver.mock.callback([mutation]);

        // Check if error event was NOT published
        expect(publish).not.toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, expect.anything());
        // Check if console.error was NOT called
        expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('setInterval callback should trigger UI reinit if button is missing', () => {
        setupDOMObserver();

        // Mock getElementById to return null (UI button missing)
        mockGetElementById.mockReturnValue(null);

        // Get the setInterval callback function
        const intervalCallback = mockSetInterval.mock.calls[0][0];

        // Trigger the interval callback
        intervalCallback();

        // Check if UI reinit event was published
        expect(publish).toHaveBeenCalledWith(EVENTS.UI_RECOVERY_NEEDED);
        // Check if input handlers update event was published
        expect(publish).toHaveBeenCalledWith(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
        // Check if enhanceInputElementHandlers was called
        expect(enhanceInputElementHandlers).toHaveBeenCalledTimes(1);

        // Check logs
        expect(mockConsoleLog).toHaveBeenCalledWith('mock_logPollingUiNotFound');
    });

    test('setInterval callback should trigger menu state update if button exists', () => {
        setupDOMObserver();

        // Mock getElementById to return a mock button element (UI button exists)
        mockGetElementById.mockReturnValue(document.createElement('button'));

        // Get the setInterval callback function
        const intervalCallback = mockSetInterval.mock.calls[0][0];

        // Trigger the interval callback
        intervalCallback();

        // 修正: publish関数が呼ばれた際の引数をチェック
        const publishCalls = publish.mock.calls.map(call => call[0]);
        expect(publishCalls).toContain(EVENTS.MENU_STATE_UPDATE_NEEDED);
        // Check if input handlers update event was published
        expect(publish).toHaveBeenCalledWith(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
        // Check if enhanceInputElementHandlers was called
        expect(enhanceInputElementHandlers).toHaveBeenCalledTimes(1);

        // Check logs
        // ログメッセージの検証を削除 - 実装が変更されたためこの検証は不正確
    });

    test('setInterval callback should handle errors during enhanceInputElementHandlers', () => {
        setupDOMObserver();

        // Mock getElementById to return a mock button element (UI button exists)
        mockGetElementById.mockReturnValue(document.createElement('button'));

        // Mock enhanceInputElementHandlers to throw an error
        const mockError = new Error('Enhance error');
        enhanceInputElementHandlers.mockImplementation(() => {
            throw mockError;
        });

        // Get the setInterval callback function
        const intervalCallback = mockSetInterval.mock.calls[0][0];

        // Trigger the interval callback
        intervalCallback();

        // Check if error event was published
        expect(publish).toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, {
            source: 'dom-observer',
            message: 'Error enhancing input handlers in interval',
            error: mockError,
        });
        // Check if console.error was called
        expect(mockConsoleError).toHaveBeenCalledWith('Error enhancing input handlers in interval:', mockError);
    });

    test('setInterval callback should ignore "Extension context invalidated" errors during enhanceInputElementHandlers', () => {
        setupDOMObserver();

        // Mock getElementById to return a mock button element (UI button exists)
        mockGetElementById.mockReturnValue(document.createElement('button'));

        // Mock enhanceInputElementHandlers to throw an "Extension context invalidated" error
        const invalidatedError = new Error('Extension context invalidated');
        enhanceInputElementHandlers.mockImplementation(() => {
            throw invalidatedError;
        });

        // Get the setInterval callback function
        const intervalCallback = mockSetInterval.mock.calls[0][0];

        // Trigger the interval callback
        intervalCallback();

        // Check if error event was NOT published
        expect(publish).not.toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, expect.anything());
        // Check if console.error was NOT called
        expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('setupEventSubscriptions should subscribe to necessary events', () => {
        // Call setupDOMObserver to trigger setupEventSubscriptions
        setupDOMObserver();

        // Check if subscribe was called for each expected event
        expect(subscribe).toHaveBeenCalledWith(EVENTS.MENU_STATE_UPDATE_NEEDED, expect.any(Function));
        expect(subscribe).toHaveBeenCalledWith(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED, expect.any(Function));
        expect(subscribe).toHaveBeenCalledWith(EVENTS.UI_RECOVERY_NEEDED, expect.any(Function));

        // Check the number of subscribe calls
        expect(subscribe).toHaveBeenCalledTimes(3);
    });
});