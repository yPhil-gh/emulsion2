function initGamepad() {
    const gamepads = navigator.getGamepads();
    const connected = Array.from(gamepads).some(gamepad => gamepad !== null);

    if (connected) {
        console.log('Gamepad connected at startup:', gamepads[0].id);
    } else {
        console.log('No gamepad connected at startup.');
    }

    const buttonStates = {
        0: false, // Cross /South button (X)
        1: false, // Circle /East button (O)
        2: false, // Square / West button
        3: false, // Triangle button
        4: false, // L1 button
        5: false, // R1 button
        6: false, // L2 button
        7: false, // R2 button
        8: false, // Share button
        9: false, // Options button
        10: false, // L3 button (Left stick click)
        11: false, // R3 button (Right stick click)
        12: false, // D-pad up
        13: false, // D-pad down
        14: false, // D-pad left
        15: false, // D-pad right
        16: false, // PS button (Home button)
    };

    let animationFrameId = null;

    // Listen for gamepad connection events
    window.addEventListener('gamepadconnected', (event) => {
        console.log('Gamepad connected:', event.gamepad.id);
        Neutralino.events.dispatch('gameControllerInit', {});
        startPolling();
    });

    window.addEventListener('gamepaddisconnected', (event) => {
        console.log('Gamepad disconnected:', event.gamepad.id);
        stopPolling();
    });

    function startPolling() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(pollGamepad);
    }

    function stopPolling() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    async function pollGamepad() {
        if (!document.hasFocus()) {
            animationFrameId = requestAnimationFrame(pollGamepad);
            return;
        }

        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0];

        if (gamepad) {
            [0,1,2,3,4,5,8,12,13,14,15].forEach((buttonIndex) => {
                const button = gamepad.buttons[buttonIndex];
                const wasPressed = buttonStates[buttonIndex];

                if (button.pressed && !wasPressed) {
                    buttonStates[buttonIndex] = true;
                } else if (!button.pressed && wasPressed) {
                    buttonStates[buttonIndex] = false;

                    if (buttonIndex === 12 && buttonStates[8]) {
                        console.log('Share + Up combo!');
                        Neutralino.events.dispatch('restartApp', {});
                        return;
                    }

                    handleButtonPress(buttonIndex);
                }
            });
        }

        animationFrameId = requestAnimationFrame(pollGamepad);
    }

    async function handleButtonPress(buttonIndex) {
        // Cross-platform keyboard simulation
        const keyMap = {
            0: 'Return',      // Enter
            1: 'Escape',      // Escape
            2: 'i',           // i key
            4: 'Shift+Left',  // Shift+Left
            5: 'Shift+Right', // Shift+Right
            12: 'Up',         // Up arrow
            13: 'Down',       // Down arrow
            14: 'Left',       // Left arrow
            15: 'Right'       // Right arrow
        };

        const key = keyMap[buttonIndex];
        if (key) {
            await simulateKeyPress(key);
        }

        // Log triangle button
        if (buttonIndex === 3) {
            console.log("3 (triangle)");
        }
    }

    async function simulateKeyPress(key) {
        // This is a simple simulation - you might need platform-specific tools
        // or a more advanced solution for complex key combinations
        const activeElement = document.activeElement;
        if (activeElement) {
            const event = new KeyboardEvent('keydown', {
                key: key.replace('Shift+', ''),
                shiftKey: key.includes('Shift+'),
                bubbles: true
            });
            activeElement.dispatchEvent(event);
        }
    }

    // #FIX: More robust
    function simulateKeyEvent(key, modifiers = {}) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: `Key${key.toUpperCase()}`,
            keyCode: key.charCodeAt(0),
            which: key.charCodeAt(0),
            shiftKey: modifiers.shift || false,
            ctrlKey: modifiers.ctrl || false,
            altKey: modifiers.alt || false,
            metaKey: modifiers.meta || false,
            bubbles: true
        });

        document.activeElement.dispatchEvent(event);
    }

    // Initialize if gamepad is already connected at startup
    if (connected) {
        startPolling();
    }
}
