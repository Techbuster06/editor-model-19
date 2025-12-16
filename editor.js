let selectedNode = null;
let floatingControls = document.getElementById('floating-media-controls');

// =========================================================
// ⚡️ GLOBAL DOM ELEMENT DECLARATIONS (MAINTAINING ROBUST SCOPE)
// Declared here, assigned in initEditor()
// =========================================================
let presetSizeSelect;
let mediaUploadInput;
let uploadBtn;
let opacitySlider;
let opacityValueSpan;
let colorPicker;
let colorHexInput;
let fontFamilySelect;
let shadowToggle;
let animationSelect;
let undoBtn;
let redoBtn;
let exportBtn;
let postBtn;
// =========================================================

document.addEventListener("keydown", function(e) {
    // Check if the focus is on a text input to prevent accidental deletion while typing
    const activeElement = document.activeElement;
    const isTyping = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

    // Only proceed if a Konva node is selected and the key is Delete or Backspace
    if ((e.key === "Delete" || e.key === "Backspace") && selectedNode) {
        // Prevent default browser behavior (e.g., navigating back on Backspace)
        // unless the user is actively typing in a form field.
        if (!isTyping) {
            e.preventDefault();
        } else {
            // Allow Backspace/Delete key to work in input fields
            return;
        }

        // Stop & clear HTML element (if any)
        if (selectedNode) {
            const mediaType = selectedNode.getAttr && selectedNode.getAttr('mediaType');
            const mediaEl = mediaType === 'video' ? selectedNode.videoElement : selectedNode.audioElement;
            if (mediaEl) {
                try {
                    mediaEl.pause();
                    mediaEl.removeAttribute('src');
                    mediaEl.load();
                } catch (e) { /* silent fail for cleanup */ }
            }
        }

        // Clear transformer (Konva.Transformer instances)
        if (typeof transformer !== 'undefined' && transformer) {
            try { transformer.nodes([]); } catch (e) {}
        }

        // Destroy the Konva node
        if (selectedNode && selectedNode.destroy) {
            selectedNode.destroy();
        }
        selectedNode = null;
        selectedShape = null; // CRITICAL: Ensure deselectShape is fully ready for next action

        // Hide floating HTML controls
        if (floatingControls) {
            floatingControls.style.display = 'none';
        }

        // Redraw layer and save
        if (typeof layer !== 'undefined' && layer) layer.draw();
        saveState && typeof saveState === 'function' && saveState();
    }
});

// --- Jules injected template loader ------------------------------------------------
function loadTemplateFromURL(url) {
    console.log(`Loading template from: ${url}`);
    Konva.Image.fromURL(url, (image) => {
        console.log('Konva.Image.fromURL callback executed.');
        const stage = getStage();
        if (!stage) {
            console.error('Stage is not available.');
            return;
        }
        console.log('Stage found.');

        const container = stage.container();
        const aspectRatio = image.width() / image.height();
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight;

        let newWidth = maxWidth;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }

        image.setAttrs({
            width: newWidth,
            height: newHeight,
            x: (maxWidth - newWidth) / 2,
            y: (maxHeight - newHeight) / 2,
            name: 'editable-shape',   // REQUIRED for unified handling
            mediaType: 'image',
            draggable: true,
            listening: true
        });

        const layer = getActiveLayer();
        if (!layer) {
            console.error('Active layer is not available.');
            return;
        }
        console.log('Active layer found.');

        layer.add(image);
        image.draggable(true);

        setupImageListeners(image);
        selectShape(image);   // Auto-select the newly added template

        layer.batchDraw(); // Explicitly redraw the layer
        console.log('Image added to layer and layer redrawn.');
        hideWelcomeMessage();
        recordState();
        console.log('Template loaded and state recorded.');
    }, (err) => {
        console.error('Failed to load image from URL:', url, err);
        alert(`Failed to load template image: ${url}. Please check the console for more details.`);
    });
}

function getStage() {
    return stage;
}

function getActiveLayer() {
    return layer;
}

function hideWelcomeMessage() {
    // Find and remove the welcome message text node
    const textNode = layer.findOne('Text');
    if (textNode && textNode.text().includes('Welcome')) {
        textNode.destroy();
    }
}

function recordState() {
    saveState();
}
// -----------------------------------------------------------------------------------

// =========================================================
// ⚡️ GLOBAL KONVA VARIABLE DECLARATIONS
// =========================================================
let selectedShape = null;
let stage;
let layer;
let transformer;
let container;
let mockup;
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 550;

// --- History/State Management ---
let history = [];
let historyPointer = -1;
const HISTORY_LIMIT = 50;

// =========================================================
// ⚡️ GLOBAL HELPER FUNCTIONS
// =========================================================

/**
 * Saves the current state of the Konva layer to the history stack.
 */
function saveState() {
    if (historyPointer < history.length - 1) {
        history = history.slice(0, historyPointer + 1);
    }
    const state = layer.toJSON();
    history.push(state);

    if (history.length > HISTORY_LIMIT) {
        history.shift();
    }
    historyPointer = history.length - 1;
}

/**
 * Handles the logic for switching between the left sidebar tabs (Templates, Media, Text).
 * @param {Event} e The click event.
 */
function handleLeftTabClick(e) {
    const targetId = e.currentTarget.getAttribute('data-target');

    // Deactivate all left tab buttons
    document.querySelectorAll('.left-sidebar .tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Hide all left tab content
    document.querySelectorAll('.left-sidebar .tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activate the clicked button
    e.currentTarget.classList.add('active');

    // Show the target content
    const targetContent = document.getElementById(targetId);
    if (targetContent) {
        targetContent.classList.add('active');
        // Dispatch event for templates if needed (templates-sidebar.js listens to this)
        if (targetId === 'templates') {
             document.dispatchEvent(new CustomEvent('templates:open'));
        }
    }
}

/**
 * Loads a previous or next state from history (Undo/Redo).
 */

/**
 * Loads a previous or next state from history (Undo/Redo).
 */
function loadState(isUndo) {
    let newPointer = historyPointer;
    if (isUndo) {
        newPointer--;
    } else {
        newPointer++;
    }

    if (newPointer >= 0 && newPointer < history.length) {
        historyPointer = newPointer;
        const state = history[historyPointer];

        // Use Konva.Node.create to reliably parse the JSON state
        const tempLayer = Konva.Node.create(state, 'editor-canvas-container');

        // Destroy all current layer children
        layer.destroyChildren();

        // Re-add the transformer
        transformer = new Konva.Transformer();
        layer.add(transformer);

        // Move children from temp layer to real layer, and re-setup listeners
        tempLayer.children.forEach(node => {
            if (node.hasName('editable-shape')) {
                layer.add(node);

                if (node.getClassName() === 'Text') {
                    setupTextListeners(node);
                } else if (node.getClassName() === 'Image') {
                    setupImageListeners(node);
                }
            }
        });

        tempLayer.destroy();
        deselectShape();
        layer.batchDraw();
    }
}


/**
 * Attaches Konva event listeners specific to Text nodes.
 */
function setupTextListeners(textNode) {
    const floatingToolbar = document.getElementById('floating-toolbar');

    textNode.on('click tap', function () {
        selectShape(textNode);
    });
    textNode.on('dblclick dbltap', () => startTextEdit(textNode));
    textNode.on('dragend', saveState);
    textNode.on('transformend', saveState);
}

/**
 * Attaches Konva event listeners specific to Image nodes.
 */
function setupImageListeners(image) {
    image.on('click tap', function (e) {
        // *** CRITICAL FIX: Stop event from bubbling up to the stage/layer deselect handler ***
        e.cancelBubble = true;
        selectShape(image);
    });
    image.on('dragend', saveState);
    image.on('transformend', function () {
        saveState();
        updateFloatingControls(image); // Ensure position update after scaling/rotating
    });

    image.on('dragmove', function() {
        updateFloatingControls(image); // Ensure position update while dragging
    });
}


/**
 * Selects a shape on the canvas, showing the correct transformer and sidebar.
 * @param {Konva.Shape} shape The shape to select.
 */
function selectShape(shape) {
    const floatingToolbar = document.getElementById('floating-toolbar');

    selectedNode = shape;
    selectedShape = shape;

    // Use the single global transformer for all shapes
    if (transformer) {
        transformer.nodes([shape]);
    }

    setupSidebar(shape);
    if (floatingToolbar) floatingToolbar.classList.add('active');
    updateFloatingControls(shape);
    layer.batchDraw();
}

function updateFloatingControls(node) {
    if (!floatingControls) return;
    const stage = getStage(); // Assuming getStage() returns the Konva.Stage instance

    // Add this early check:
    if (!stage || !node) {
        floatingControls.style.display = 'none';
        return;
    }

    if (node && node.getAttr('isMedia')) {
        const mediaType = node.getAttr('mediaType');
        const mediaElement = mediaType === 'video' ? node.videoElement : node.audioElement;
        const playPauseBtn = document.getElementById('canvas-play-pause-btn');

        // SAFER POSITIONING: compute node center in stage coordinates and map to screen coords

        // Node client rect returns coordinates relative to stage (in many Konva setups).
        const nodeRect = node.getClientRect();
        const stagePos = stage.container().getBoundingClientRect();

        // Fallback: if nodeRect values are not numbers, hide and return
        if (!nodeRect || isNaN(nodeRect.x) || isNaN(nodeRect.y)) {
            floatingControls.style.display = 'none';
            return;
        }

        // Center of node in stage coordinates
        const center = {
            x: nodeRect.x + nodeRect.width / 2,
            y: nodeRect.y + nodeRect.height / 2
        };

        // Map to screen coordinates (stagePos.left/top are screen offsets)
        const screenX = stagePos.left + center.x;
        const screenY = stagePos.top + center.y;

        // 2. Position the floating container (ensure these match your CSS size)
        const toolbarWidth = 110; // Adjust this if your controls bar width is different
        const toolbarHeight = 50;  // Adjust this if your controls bar height is different

        floatingControls.style.left = (screenX - toolbarWidth / 2) + 'px';
        floatingControls.style.top = (screenY - toolbarHeight / 2) + 'px';
        floatingControls.style.display = 'flex';

        // 3. Update Icon (Play/Pause state)
        if (mediaElement) {
            if (mediaElement.paused) {
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        }
    } else {
        // Hide if not a media node or no node selected
        floatingControls.style.display = 'none';
    }
}


/**
 * Adds a new text element to the Konva canvas.
 */
function addTextToCanvas(initialText, size, color, x = 50, y = 150, align = 'left') {
    const newText = new Konva.Text({
        x: x,
        y: y,
        text: initialText,
        fontSize: size,
        fill: color,
        align: align,
        draggable: true,
        listening: true,
        name: 'editable-shape',
        wrap: 'word',
        width: stage.width() - 100
    });

    setupTextListeners(newText);
    layer.add(newText);
    layer.batchDraw();
    // CRITICAL: Auto-select the text to show the transformer immediately
    selectShape(newText);
    return newText;
}

function addEmojiToCanvas(emoji) {
    const stage = getStage();
    if (!stage) return;
    const defaultFontSize = 100;

    const textNode = new Konva.Text({
        text: emoji,
        x: stage.width() / 2 - (defaultFontSize / 2),
        y: stage.height() / 2 - (defaultFontSize / 2),
        fontSize: defaultFontSize,
        fill: '#ffffff',
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, sans-serif',
        draggable: true,
        name: 'editable-shape'
    });

    layer.add(textNode);
    layer.batchDraw();
    saveState();
    selectShape(textNode);
}


/**
 * Adds a new rectangle element to the Konva canvas.
 */
function addRectangleToCanvas(x, y, width, height, color) {
    const newRect = new Konva.Rect({
        x: x,
        y: y,
        width: width,
        height: height,
        fill: color,
        draggable: true,
        name: 'editable-shape'
    });

    // For simplicity, we'll use image listeners for rectangles as they share similar behaviors
    setupImageListeners(newRect);
    layer.add(newRect);
    // Move rectangle to the back
    newRect.zIndex(0);
    layer.batchDraw();
    return newRect;
}

/**
Applies current shape properties to the sidebar.
@param {Konva.Shape | Konva.Node} shape */
function setupSidebar(shape) {
    // These variables are now globally declared and assigned in initEditor.
    const opacitySliderRef = opacitySlider; // Reference global variable
    const opacityValueSpanRef = opacityValueSpan; // Reference global variable
    const shadowToggleRef = shadowToggle; // Reference global variable
    const shadowControls = document.getElementById('shadow-controls');

    // Canvas Color Pickers - (NOTE: Canvas controls not handled here, only shape)
    const canvasColorPicker = document.getElementById('canvas-color-picker');
    const canvasColorHex = document.getElementById('canvas-color-hex');

    // TAB REFERENCES
    const styleButton = document.querySelector('[data-right-target="style-props"]');
    const animButton = document.querySelector('[data-right-target="anim-props"]');
    const textButton = document.querySelector('[data-right-target="text-props"]');
    const canvasButton = document.querySelector('[data-right-target="canvas-props"]');

    // --- Phase 2: Canvas Properties (No shape selected) ---
    if (!shape) {
        // Show all buttons for the default canvas view
        document.querySelectorAll('.sidebar-tabs-right button').forEach(btn => btn.style.display = 'block');

        // Find the canvas tab and activate it (assuming canvas-props is one of the content IDs)
        if (canvasButton) {
            // Only set to active, do not force a click which can re-trigger logic
            canvasButton.classList.add('active');
        }

        // Handle canvas color picker update if needed (Logic omitted for brevity, keeping original JS structure)
        if (canvasColorPicker && stage) {
            const stageColor = stage.container().style.backgroundColor || '#333333';
            canvasColorPicker.value = rgbToHex(stageColor);
            if (canvasColorHex) canvasColorHex.value = rgbToHex(stageColor);
        }

        return; // Exit function
    }

    // --- Phase 3: Shape Properties (Shape IS selected) ---

    // 1. Show Base Tabs (Style and Animation)
    if (styleButton) styleButton.style.display = 'block';
    if (animButton) animButton.style.display = 'block';
    if (canvasButton) canvasButton.style.display = 'none'; // Hide canvas props when shape selected

    // 2. Element-specific Tabs
    const isText = shape.getClassName() === 'Text';

    if (isText) {
        if (textButton) {
            textButton.style.display = 'block';
        }

        // Font Family
        if (document.getElementById('font-family-select')) {
             document.getElementById('font-family-select').value = shape.fontFamily();
        }

        // Font Color
        const textColor = shape.fill() || '#ffffff';
        if (document.getElementById('color-picker')) document.getElementById('color-picker').value = textColor;
        if (document.getElementById('color-hex-input')) document.getElementById('color-hex-input').value = textColor;

        // Alignment
        document.querySelectorAll('.btn-align').forEach(btn => btn.classList.remove('active'));
        const currentAlign = shape.align();
        const alignBtn = document.getElementById(`align-${currentAlign}`);
        if (alignBtn) alignBtn.classList.add('active');

        // Line Height
        const lh = shape.lineHeight() || 1.2;
        if (document.getElementById('line-height-slider')) document.getElementById('line-height-slider').value = lh;
        if (document.getElementById('line-height-value')) document.getElementById('line-height-value').textContent = lh.toFixed(1);

        // Letter Spacing
        const ls = shape.letterSpacing() || 0;
        if (document.getElementById('letter-spacing-slider')) document.getElementById('letter-spacing-slider').value = ls;
        if (document.getElementById('letter-spacing-value')) document.getElementById('letter-spacing-value').textContent = ls;

        // Stroke
        const sColor = shape.stroke() || '#000000';
        if (document.getElementById('stroke-color-picker')) document.getElementById('stroke-color-picker').value = sColor;
        if (document.getElementById('stroke-color-hex')) document.getElementById('stroke-color-hex').value = sColor;

        const sWidth = shape.strokeWidth() || 0;
        if (document.getElementById('stroke-width-slider')) document.getElementById('stroke-width-slider').value = sWidth;
        if (document.getElementById('stroke-width-value')) document.getElementById('stroke-width-value').textContent = sWidth;
    } else {
         // Hide Text tab for non-Text elements
        if (textButton) {
            textButton.style.display = 'none';
        }
    }

    // 3. Update General Style/Shadow Controls (Visible in Style tab)
    // Opacity
    if (opacitySliderRef && opacityValueSpanRef) {
        opacitySliderRef.value = shape.opacity() * 100;
        opacityValueSpanRef.textContent = `${Math.round(shape.opacity() * 100)}%`;
    }

    // Shadow
    const hasShadow = shape.shadowEnabled();
    if (shadowToggleRef) {
        shadowToggleRef.checked = hasShadow;
    }
    if (shadowControls) {
        shadowControls.style.display = hasShadow ? 'block' : 'none';
        if (hasShadow) {
            if (document.getElementById('shadow-color')) document.getElementById('shadow-color').value = shape.shadowColor() || '#000000';
            if (document.getElementById('shadow-offset-x')) document.getElementById('shadow-offset-x').value = shape.shadowOffsetX() || 5;
            if (document.getElementById('shadow-offset-y')) document.getElementById('shadow-offset-y').value = shape.shadowOffsetY() || 5;
        }
    }
}

/**
 * Removes the current selected shape and transformer, and resets controls.
 */
function deselectShape() {
    const floatingToolbar = document.getElementById('floating-toolbar');
    const floatingControls = document.getElementById('floating-media-controls');

    if (floatingControls) floatingControls.style.display = 'none';

    if (floatingToolbar) floatingToolbar.classList.remove('active');
    selectedShape = null;
    selectedNode = null; // Ensure both are null

    if (transformer) transformer.nodes([]);

    // Hide all type-specific groups
    // NOTE: The sidebar element structure relies on the tab system to hide/show,
    // so we just reset the right tab to the default 'Style' tab.

    // Ensure all controls are reset/unchecked to prevent ghost state
    if (shadowToggle) shadowToggle.checked = false;
    if (animationSelect) animationSelect.value = 'none';

    // Switch back to the default Style tab
    const rightTabs = document.querySelectorAll('.right-sidebar .right-tab-button');
    const rightContents = document.querySelectorAll('.right-sidebar .right-tab-content');

    rightTabs.forEach(btn => btn.classList.remove('active'));
    rightContents.forEach(content => content.classList.remove('active'));

    const styleButton = document.querySelector('[data-right-target="style-props"]');
    const styleContent = document.getElementById('style-props');

    // Ensure style-props and canvas-props buttons are visible by default
    document.querySelectorAll('.sidebar-tabs-right button').forEach(btn => btn.style.display = 'block');
    const textButton = document.querySelector('[data-right-target="text-props"]');
    if (textButton) textButton.style.display = 'none';

    if (styleButton) styleButton.classList.add('active');
    if (styleContent) styleContent.classList.add('active');

    if (layer) layer.batchDraw();
}

/**
 * Initiates in-place text editing for the selected Konva Text node.
 * This is crucial for the template text to be editable.
 */
function startTextEdit(textNode) {
    deselectShape();
    textNode.hide();
    layer.draw();

    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    const areaPosition = {
        x: stageBox.left + textPosition.x,
        y: stageBox.top + textPosition.y,
    };

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    // Apply styles and content
    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = areaPosition.y + 'px';
    textarea.style.left = areaPosition.x + 'px';
    textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px';
    textarea.style.height = textNode.height() - textNode.padding() * 2 + 'px';
    textarea.style.fontSize = textNode.fontSize() + 'px';
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.color = textNode.fill();
    textarea.style.lineHeight = textNode.lineHeight();
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.border = '1px dashed #05eafa';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.zIndex = 999;

    textarea.focus();

    function removeTextarea() {
        textarea.removeEventListener('blur', removeTextarea);
        textarea.removeEventListener('keydown', handleKeydown);

        textNode.text(textarea.value);
        textNode.show();
        layer.draw();

        document.body.removeChild(textarea);
        saveState();
    }

    function handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            removeTextarea();
        }
    }

    textarea.addEventListener('blur', removeTextarea);
    textarea.addEventListener('keydown', handleKeydown);
}
/**
 * Applies a simple animation to a Konva node.
 */
function applyAnimation(node, type) {
    if (!Konva.Tween) return;

    // Stop and destroy any previous animation on this node
    const activeTween = node.getAttr('activeTween');
    if (activeTween) {
        activeTween.pause();
        activeTween.destroy();
        node.setAttr('activeTween', null);
    }

    // Reset properties before applying a new animation
    node.opacity(1);
    node.scaleX(1);
    node.scaleY(1);
    // Restore original position if it was saved
    const originalPos = node.getAttr('originalPos');
    if (originalPos) {
        node.position(originalPos);
    }

    node.setAttr('currentAnimation', type);

    if (type === 'none') {
        node.opacity(1); // Ensure opacity is reset
        layer.batchDraw();
        return;
    }

    if (type === 'fade_jiggle') {
        const originalY = node.y();

        node.opacity(0);

        const fadeIn = new Konva.Tween({
            node: node,
            duration: 0.5,
            opacity: 1,
            easing: Konva.Easings.EaseIn,
            onFinish: () => {
                const jiggle = new Konva.Tween({
                    node: node,
                    duration: 0.8,
                    y: originalY - 10,
                    easing: Konva.Easings.ElasticEaseOut,
                    onFinish: () => {
                        node.y(originalY);
                        layer.batchDraw();
                    }
                });
                node.setAttr('activeTween', jiggle);
                jiggle.play();
            }
        });

        node.setAttr('activeTween', fadeIn);
        fadeIn.play();
    } else if (type === 'slide_in_left') {
        const originalX = node.x();
        node.setAttr('originalPos', { x: originalX, y: node.y() });

        node.x(-node.width());
        node.opacity(0);

        const slideIn = new Konva.Tween({
            node: node,
            duration: 0.6,
            x: originalX,
            opacity: 1,
            easing: Konva.Easings.EaseOut
        });

        node.setAttr('activeTween', slideIn);
        slideIn.play();

    } else if (type === 'zoom_in') {
        node.scaleX(0.1);
        node.scaleY(0.1);
        node.opacity(0);

        const zoomIn = new Konva.Tween({
            node: node,
            duration: 0.5,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            easing: Konva.Easings.BackEaseOut
        });

        node.setAttr('activeTween', zoomIn);
        zoomIn.play();
    }
    layer.batchDraw();
}

/**
 * Loads and sets up a new image on the canvas.
 */
function loadAndSetupImage(img) {
    let imgWidth = img.width;
    let imgHeight = img.height;
    const maxWidth = stage.width() * 0.8;
    const maxHeight = stage.height() * 0.8;

    if (imgWidth > maxWidth || imgHeight > maxHeight) {
        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        imgWidth *= ratio;
        imgHeight *= ratio;
    }

    const konvaImage = new Konva.Image({
        image: img,
        x: stage.width() / 2 - imgWidth / 2,
        y: stage.height() / 2 - imgHeight / 2,
        width: imgWidth,
        height: imgHeight,
        draggable: true,
        name: 'editable-shape'
    });
    setupImageListeners(konvaImage);
    layer.add(konvaImage);
    layer.batchDraw();
}

/**
 * Creates and adds a Konva Group with an audio icon/visualizer
 * and links it to an HTML Audio element for playback.
 */
function applyAudioToCanvas(audioURL, fileName) {
    const stage = getStage();
    if (!stage) return;
    // 1. Setup HTML Audio Element
    const audio = new Audio(audioURL);
    audio.loop = true;

    // 2. Setup Konva Group/Shape to represent the audio
    const audioNode = new Konva.Group({
        x: stage.width() / 2 - 50,
        y: stage.height() / 2 - 50,
        width: 100,
        height: 100,
        draggable: true,
        name: 'editable-shape',
        isMedia: true,
        mediaType: 'audio'
    });
    audioNode.audioElement = audio; // Attach the HTML element

    const iconRect = new Konva.Rect({
        width: 100,
        height: 100,
        fill: '#05eafa',
        cornerRadius: 10
    });
    audioNode.add(iconRect);

    const iconText = new Konva.Text({
        text: '🎵\n' + fileName,
        fontSize: 30,
        align: 'center',
        verticalAlign: 'middle',
        width: 100,
        height: 100,
        fill: '#141414',
        fontFamily: 'Arial',
        listening: false
    });
    audioNode.add(iconText);

    // Disable listening for children so the Group listens for drag/click
    audioNode.children.forEach(c => c.listening(false));

    // Add other necessary listeners
    setupImageListeners(audioNode);
    layer.add(audioNode);
    layer.batchDraw();
    saveState();
    selectShape(audioNode);

    // Attempt to play immediately (will be handled by floating controls)
    audio.play().catch(e => console.log("Audio autoplay suppressed/failed:", e));
}

/**
 * Creates and adds a Konva.Image node with an HTML video element as its fill pattern.
 * This simulates a video element on the canvas.
 */
function applyVideoToCanvas(videoURL) {
    const video = document.createElement('video');
    video.src = videoURL;
    video.muted = true; // Videos with sound must be muted to play automatically
    video.loop = true;
    video.autoplay = true;

    // Load video meta data to get dimensions
    video.addEventListener('loadedmetadata', function() {
        let vidWidth = video.videoWidth;
        let vidHeight = video.videoHeight;
        const maxWidth = stage.width();
        const maxHeight = stage.height();

        // Scale down video to fit canvas if necessary
        const ratio = Math.min(maxWidth / vidWidth, maxHeight / vidHeight);
        vidWidth *= ratio;
        vidHeight *= ratio;

        const videoImage = new Konva.Image({
            x: stage.width() / 2 - vidWidth / 2,
            y: stage.height() / 2 - vidHeight / 2,
            width: vidWidth,
            height: vidHeight,
            image: video,
            fill: 'black', // fallback color
            draggable: true,
            name: 'editable-shape',
            isMedia: true,
            mediaType: 'video'
        });
        videoImage.videoElement = video; // Attach the HTML element

        // Set video as fill on the image node to play it
        videoImage.fillPatternImage(video);

        setupImageListeners(videoImage);
        layer.add(videoImage);

        const anim = new Konva.Animation(function () {
            // do nothing, animation just needs to update the layer
        }, layer);
        layer.batchDraw();
        saveState();

        // Start playing the video
        video.play().catch(e => console.error("Video autoplay failed:", e));
        anim.start();

        selectShape(videoImage);
    });
}

/**
 * Utility function to convert RGB to Hex.
 */
function rgbToHex(rgb) {
    if (!rgb || rgb.indexOf('rgb') === -1) {
        return rgb || '#333333';
    }
    const parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!parts) return '#333333';
    delete parts[0];
    for (let i = 1; i <= 3; i++) {
        parts[i] = parseInt(parts[i]).toString(16);
        if (parts[i].length === 1) parts[i] = '0' + parts[i];
    }
    return '#' + parts.join('');
}


// =========================================================
// ⚡️ FLOATING TOOLBAR ACTIONS (Used by buttons in editor.html)
// =========================================================

/**
 * Deletes the currently selected shape.
 */
function deleteSelectedShape() {
    if (!selectedNode) return;

    // Media cleanup logic (stop playback, etc.)
    const mediaType = selectedNode.getAttr && selectedNode.getAttr('mediaType');
    const mediaElement = mediaType === 'video' ? selectedNode.videoElement : selectedNode.audioElement;

    // 1. Stop & clear HTML element
    if (mediaElement) {
        mediaElement.pause();
        mediaElement.removeAttribute('src');
        mediaElement.load();
    }

    // 2. Clear Konva Transformer handles
    if (transformer) {
        transformer.nodes([]);
        layer.draw();
    }

    // 3. Remove Konva node
    selectedNode.destroy();
    selectedShape = null;
    selectedNode = null;

    // 4. Hide HTML Floating Controls
    updateFloatingControls(null);
    layer.draw();
    saveState();
}

/**
 * Duplicates the currently selected shape.
 */
function duplicateSelectedShape() {
    if (!selectedShape) return;

    // Konva's clone() method is ideal for duplication
    const clone = selectedShape.clone();

    // Adjust position slightly so the clone is visible
    clone.x(selectedShape.x() + 10);
    clone.y(selectedShape.y() + 10);

    // Ensure the clone is draggable and has the correct name
    clone.draggable(true);
    clone.name('editable-shape');

    // Re-attach listeners based on type
    if (clone.getClassName() === 'Text') {
        setupTextListeners(clone);
    } else {
        setupImageListeners(clone);
    }

    // Add to layer, draw, and select the new shape
    layer.add(clone);
    layer.batchDraw();
    selectShape(clone);
}

/**
 * Toggles the playback state of a selected media element (audio or video).
 */
function toggleMediaPlayback() {
    if (!selectedNode || !selectedNode.getAttr('isMedia')) return;

    const mediaType = selectedNode.getAttr('mediaType');
    // Get the underlying HTML media element (audioElement for audio, videoElement for video)
    const mediaElement = mediaType === 'video' ? selectedNode.videoElement : selectedNode.audioElement;
    const playPauseBtn = document.getElementById('canvas-play-pause-btn');
    const playIcon = '<i class="fas fa-play"></i>';
    const pauseIcon = '<i class="fas fa-pause"></i>';

    if (mediaElement) {
        if (mediaElement.paused) {
            // Play media and catch potential Autoplay Policy errors
            mediaElement.play().catch(e => console.error("Media play failed (Autoplay Policy?):", e));
            // Update button icon to PAUSE
            if (playPauseBtn) playPauseBtn.innerHTML = pauseIcon;
        } else {
            mediaElement.pause();
            // Update button icon to PLAY
            if (playPauseBtn) playPauseBtn.innerHTML = playIcon;
        }
    }
}

/**
 * Toggles bold style for a selected text node.
 */
function toggleTextBold() {
    if (selectedShape && selectedShape.getClassName() === 'Text') {
        const currentStyle = selectedShape.fontStyle() || 'normal';
        const isBold = currentStyle.includes('bold');
        const isItalic = currentStyle.includes('italic');
        let newStyle;
        if (isBold) {
            newStyle = isItalic ? 'italic' : 'normal';
        } else {
            newStyle = isItalic ? 'bold italic' : 'bold';
        }
        selectedShape.fontStyle(newStyle);
        layer.batchDraw();
    }
}

function toggleTextItalic() {
    if (selectedShape && selectedShape.getClassName() === 'Text') {
        const currentStyle = selectedShape.fontStyle() || 'normal';
        const isBold = currentStyle.includes('bold');
        const isItalic = currentStyle.includes('italic');
        let newStyle;
        if (isItalic) {
            newStyle = isBold ? 'bold' : 'normal';
        } else {
            newStyle = isBold ? 'bold italic' : 'italic';
        }
        selectedShape.fontStyle(newStyle);
        layer.batchDraw();
    }
}

function increaseFontSize() {
    if (selectedShape && selectedShape.getClassName() === 'Text') {
        selectedShape.fontSize(selectedShape.fontSize() + 2);
        layer.batchDraw();
    }
}

function decreaseFontSize() {
    if (selectedShape && selectedShape.getClassName() === 'Text') {
        selectedShape.fontSize(Math.max(10, selectedShape.fontSize() - 2)); // Minimum size 10
        layer.batchDraw();
    }
}

function exportCanvas() {
    const dataURL = stage.toDataURL({
        mimeType: 'image/png',
        quality: 1
    });

    const link = document.createElement('a');
    link.download = 'twinclouds-design.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function simulatePost() {
    // This is a simulation. In a real app, this would be an API call
    console.log("Simulating social media post API...");
    // Simulate a delay for the API call
    setTimeout(() => {
        alert("Post Scheduled!");
    }, 1500);
}

function resizeCanvas(newWidth, newHeight) {
    const mockup = document.querySelector('.device-mockup');
    if (mockup) {
        mockup.style.width = `${newWidth}px`;
        mockup.style.height = `${newHeight}px`;
    }
    if (stage) {
        stage.width(newWidth);
        stage.height(newHeight);
    }
    if (layer) layer.batchDraw();
}

// ❌ DELETED: The function setupSidebarTabs() which was causing conflicts/was unused.

function handleRightTabClick(event) {
    const targetButton = event.currentTarget;
    const targetId = targetButton.getAttribute('data-right-target');
    // Deactivate all buttons and hide all content
    document.querySelectorAll('.sidebar-tabs-right button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.right-tab-content').forEach(el => el.classList.remove('active'));
    // Activate the clicked button and show the corresponding content
    targetButton.classList.add('active');
    const targetContent = document.getElementById(targetId);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

// =========================================================
// ⚡️ TEMPLATE DATA & FUNCTIONS
// =========================================================
// =========================================================
// ⚡️ TEMPLATE DATA DEFINITIONS (All 5 Templates)
// =========================================================
const TEMPLATE_DATA = {
    carousel1: {
        className: "Layer",
        children: [
            { className: "Image", attrs: { src: "assets/templates/carousel1.jpg", width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }, isBackground: true, id: "bg" },
            { className: "Text", text: "HEADLINE", x: 40, y: 70, fontSize: 50, fill: "#FFFFFF", fontFamily: "Bebas Neue", draggable: true, id: "headline_text" },
            { className: "Text", text: "Supporting text goes here", x: 40, y: 130, width: DEFAULT_WIDTH - 80, fontSize: 18, fill: "#FFFFFF", fontFamily: "Raleway", draggable: true, id: "body_text" }
        ]
    },
    carousel2: {
        className: "Layer",
        children: [
            { className: "Rect", x: 0, y: 0, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, fill: "#A0522D", draggable: false, id: "bg_rect" },
            { className: "Text", text: "TIP", x: 40, y: 50, fontSize: 36, fill: "#FFB531", fontFamily: "Anton", draggable: true, id: "tip_title" },
            { className: "Text", text: "Use high-contrast colors for accessibility.", x: 40, y: 100, width: DEFAULT_WIDTH - 80, fontSize: 24, fill: "#FFFFFF", fontFamily: "Oswald", draggable: true, id: "tip_body" }
        ]
    },
    carousel3: {
        className: "Layer",
        children: [
            { className: "Image", attrs: { src: "assets/templates/carousel3.jpg", width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }, isBackground: true, id: "bg" },
            { className: "Text", text: "“The best way to predict the future is to create it.”", x: 40, y: 70, width: DEFAULT_WIDTH - 80, fontSize: 36, fill: "#FFFFFF", fontFamily: "Oswald", draggable: true, id: "quote_title" },
            { className: "Text", text: "- Peter Drucker. Add your text here", x: 40, y: 140, width: DEFAULT_WIDTH - 80, fontSize: 18, fill: "#FFFFFF", fontFamily: "Raleway", draggable: true, id: "quote_body" }
        ]
    },
    carousel4: {
        className: "Layer",
        children: [
            { className: "Image", attrs: { src: "assets/templates/carousel4.jpg", width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }, isBackground: true, id: "bg" },
            { className: "Text", text: "CALL TO ACTION", x: 40, y: 70, fontSize: 42, fill: "#FFFFFF", fontFamily: "Oswald", draggable: true, id: "cta_title" },
            { className: "Rect", x: 40, y: 150, width: 180, height: 50, cornerRadius: 8, fill: "#FFB531", draggable: true, id: "cta_rect" },
            { className: "Text", text: "LEARN MORE", x: 60, y: 162, fontSize: 20, fill: "#141414", fontFamily: "Anton", draggable: true, id: "cta_text" }
        ]
    }
};

async function loadTemplate(templateKey) {
    const template = TEMPLATE_DATA[templateKey];
    if (!template) {
        console.error(`Template "${templateKey}" not found`);
        return;
    }
    // Clear the layer and reset state
    layer.destroyChildren();
    transformer = new Konva.Transformer(); // Re-add transformer
    layer.add(transformer);
    deselectShape();

    const imageNodesData = template.children.filter(node => node.className === 'Image');
    const otherNodesData = template.children.filter(node => node.className !== 'Image');

    // Create promises for loading all images using Konva's built-in method
    const imageLoadPromises = imageNodesData.map(nodeData => {
        return new Promise((resolve, reject) => {
            Konva.Image.fromURL(
                nodeData.attrs.src,
                (konvaImage) => {
                    konvaImage.setAttrs({
                        ...nodeData.attrs,
                        name: 'editable-shape',
                        id: nodeData.id,
                        isBackground: nodeData.isBackground
                    });
                    layer.add(konvaImage);
                    setupImageListeners(konvaImage);
                    if (nodeData.isBackground) {
                        konvaImage.zIndex(0); // Send background to back
                    }
                    resolve();
                },
                (err) => {
                    console.error('Failed to load image:', nodeData.attrs.src, err);
                    reject(err);
                }
            );
        });
    });

    try {
        await Promise.all(imageLoadPromises);

        // Add all other non-image nodes (Text, Rect, etc.)
        otherNodesData.forEach(nodeData => {
            let newNode;
            switch (nodeData.className) {
                case 'Text':
                    newNode = new Konva.Text({
                        ...nodeData.attrs,
                        text: nodeData.text,
                        name: 'editable-shape',
                        id: nodeData.id,
                        draggable: nodeData.draggable !== false
                    });
                    setupTextListeners(newNode);
                    break;
                case 'Rect':
                    newNode = new Konva.Rect({
                        ...nodeData.attrs,
                        name: 'editable-shape',
                        id: nodeData.id,
                        draggable: nodeData.draggable !== false
                    });
                    setupImageListeners(newNode);
                    break;
                // Add other Konva types here if needed (Circle, etc.)
                default:
                    return;
            }
            if (newNode) {
                layer.add(newNode);
                // Simple way to handle z-index for this template set
                if (newNode.getClassName() === 'Rect') newNode.zIndex(1);
            }
        });

        layer.batchDraw();
        saveState();
    } catch (error) {
        console.error("Error applying template:", error);
        alert("Failed to load template assets. Check console for details.");
    }
}

// =========================================================
// ⚡️ EVENT LISTENERS
// =========================================================

function setupEventListeners() {
    // --- Left Sidebar Tab Listeners (FIX) ---
    document.querySelectorAll('.left-sidebar .tab-button').forEach(button => {
        button.addEventListener('click', handleLeftTabClick);
    });

    // --- Preset Size Selector ---
    if (presetSizeSelect) {
        presetSizeSelect.addEventListener('change', function() {
            const [width, height] = this.value.split('x').map(Number);
            resizeCanvas(width, height);
            saveState();
        });
    }

    // --- Media Upload ---
    if (uploadBtn && mediaUploadInput) {
        uploadBtn.addEventListener('click', () => mediaUploadInput.click());
        mediaUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        loadAndSetupImage(img);
                        saveState();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
            e.target.value = null; // Clear input to allow re-uploading the same file
        });
    }

    // --- Color Pickers ---
    function updateColor(color) {
        if (selectedShape) {
            selectedShape.fill(color);
            layer.batchDraw();
        }
    }

    if (colorPicker) {
        colorPicker.addEventListener('input', function() {
            updateColor(this.value);
            colorHexInput.value = this.value;
        });
        colorPicker.addEventListener('change', saveState);
    }
    if (colorHexInput) {
        colorHexInput.addEventListener('change', function() {
            updateColor(this.value);
            colorPicker.value = this.value;
            saveState();
        });
    }

    // --- Opacity Slider ---
    if (opacitySlider) {
        opacitySlider.addEventListener('input', function() {
            if (selectedShape) {
                const opacity = parseFloat(this.value) / 100;
                selectedShape.opacity(opacity);
                opacityValueSpan.textContent = `${this.value}%`;
                layer.batchDraw();
            }
        });
        opacitySlider.addEventListener('change', saveState);
    }

    // --- Font Family ---
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', function() {
            if (selectedShape && selectedShape.getClassName() === 'Text') {
                selectedShape.fontFamily(this.value);
                layer.batchDraw();
                saveState();
            }
        });
    }

    // --- Shadow Toggle ---
    if (shadowToggle) {
        shadowToggle.addEventListener('change', function() {
            if (selectedShape) {
                const isChecked = this.checked;
                selectedShape.shadowEnabled(isChecked);
                const shadowControls = document.getElementById('shadow-controls');
                if (shadowControls) {
                    shadowControls.style.display = isChecked ? 'block' : 'none';
                }
                layer.batchDraw();
                saveState();
            }
        });
    }

    // --- Shadow Controls ---
    const shadowColor = document.getElementById('shadow-color');
    const shadowOffsetX = document.getElementById('shadow-offset-x');
    const shadowOffsetY = document.getElementById('shadow-offset-y');

    function updateShadow() {
        if (selectedShape) {
            selectedShape.shadowColor(shadowColor.value);
            selectedShape.shadowOffsetX(parseInt(shadowOffsetX.value));
            selectedShape.shadowOffsetY(parseInt(shadowOffsetY.value));
            layer.batchDraw();
            saveState();
        }
    }

    if (shadowColor) shadowColor.addEventListener('change', updateShadow);
    if (shadowOffsetX) shadowOffsetX.addEventListener('input', updateShadow);
    if (shadowOffsetY) shadowOffsetY.addEventListener('input', updateShadow);

    // --- Animation Selector ---
    if (animationSelect) {
        animationSelect.addEventListener('change', function() {
            if (selectedShape) {
                applyAnimation(selectedShape, this.value);
                saveState();
            }
        });
    }

    // --- Undo/Redo ---
    if (undoBtn) undoBtn.addEventListener('click', () => loadState(true));
    if (redoBtn) redoBtn.addEventListener('click', () => loadState(false));

    // --- Text Alignment, Line Height, Letter Spacing, Stroke ---

    //// ALIGNMENT
    ['left', 'center', 'right'].forEach(align => {
        const btn = document.getElementById(`align-${align}`);
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (selectedShape && selectedShape.getClassName() === 'Text') {
                selectedShape.align(align);
                document.querySelectorAll('.btn-align').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                layer.batchDraw();
                saveState();
            }
        });
    });

    //// LINE HEIGHT
    const lhSlider = document.getElementById('line-height-slider');
    const lhValue = document.getElementById('line-height-value');
    if (lhSlider) {
        lhSlider.addEventListener('input', function () {
            if (selectedShape && selectedShape.getClassName() === 'Text') {
                const v = parseFloat(this.value);
                selectedShape.lineHeight(v);
                lhValue.textContent = v.toFixed(1);
                layer.batchDraw();
            }
        });
        lhSlider.addEventListener('change', saveState);
    }

    //// LETTER SPACING
    const lsSlider = document.getElementById('letter-spacing-slider');
    const lsValue = document.getElementById('letter-spacing-value');
    if (lsSlider) {
        lsSlider.addEventListener('input', function () {
            if (selectedShape && selectedShape.getClassName() === 'Text') {
                const v = parseInt(this.value, 10);
                selectedShape.letterSpacing(v);
                lsValue.textContent = v;
                layer.batchDraw();
            }
        });
        lsSlider.addEventListener('change', saveState);
    }

    //// STROKE COLOR & WIDTH
    const strokePicker = document.getElementById('stroke-color-picker');
    const strokeHex = document.getElementById('stroke-color-hex');

    function updateStrokeColor(color) {
        if (selectedShape && selectedShape.getClassName() === 'Text') {
            selectedShape.stroke(color);
            layer.batchDraw();
        }
    }

    if (strokePicker) {
        strokePicker.addEventListener('input', function () {
            updateStrokeColor(this.value);
            strokeHex.value = this.value;
        });
        strokePicker.addEventListener('change', saveState);
    }

    if (strokeHex) {
        strokeHex.addEventListener('change', function () {
            updateStrokeColor(this.value);
            strokePicker.value = this.value;
            saveState();
        });
    }

    const sWidthSlider = document.getElementById('stroke-width-slider');
    const sWidthValue = document.getElementById('stroke-width-value');
    if (sWidthSlider) {
        sWidthSlider.addEventListener('input', function () {
            if (selectedShape && selectedShape.getClassName() === 'Text') {
                const v = parseInt(this.value, 10);
                selectedShape.strokeWidth(v);
                sWidthValue.textContent = v;
                layer.batchDraw();
            }
        });
        sWidthSlider.addEventListener('change', saveState);
    }

    // --- Floating Toolbar Logic ---
    const floatDelete = document.getElementById('float-delete');
    if (floatDelete) floatDelete.addEventListener('click', () => {
        deleteSelectedShape();
        saveState();
    });
    const floatDuplicate = document.getElementById('float-duplicate');
    if (floatDuplicate) floatDuplicate.addEventListener('click', () => {
        duplicateSelectedShape();
        saveState();
    });
    const floatBold = document.getElementById('float-bold');
    if (floatBold) floatBold.addEventListener('click', () => {
        toggleTextBold();
        saveState();
    });
    const floatItalic = document.getElementById('float-italic');
    if (floatItalic) floatItalic.addEventListener('click', () => {
        toggleTextItalic();
        saveState();
    });
    const floatSize = document.getElementById('float-size');
    if (floatSize) floatSize.addEventListener('click', () => {
        increaseFontSize();
        saveState();
    });
    const floatToFront = document.getElementById('float-to-front');
    if (floatToFront) floatToFront.addEventListener('click', () => {
        if (selectedShape) {
            selectedShape.moveToTop();
            layer.draw();
            saveState();
        }
    });
    const floatToBack = document.getElementById('float-to-back');
    if (floatToBack) floatToBack.addEventListener('click', () => {
        if (selectedShape) {
            selectedShape.moveToBottom();
            layer.draw();
            saveState();
        }
    });

    // --- Keyboard Listeners ---
    // Note: The global keydown listener at the top of the file handles media/non-media delete

    // --- Content Adding ---
    document.querySelectorAll('#text .asset-card').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.dataset.textType;
            let size = type === 'heading' ? 36 :
                       type === 'subheading' ? 24 : 16;
            let text = type === 'heading' ? 'HEADING TEXT' :
                       type === 'subheading' ? 'Subheading text here' : 'Body text here.';

            const newText = addTextToCanvas(text, size, '#FFFFFF');
            selectShape(newText);
            saveState();
        });
    });

    // --- Emoji Adding ---
    document.querySelectorAll('.emoji-grid button').forEach(button => {
        button.addEventListener('click', function() {
            addEmojiToCanvas(this.textContent.trim());
        });
    });


    // --- Right Sidebar Tab Listeners ---
    document.querySelectorAll('.sidebar-tabs-right button').forEach(button => {
        button.addEventListener('click', handleRightTabClick);
    });

    // --- Export Listener ---
    if (exportBtn) exportBtn.addEventListener('click', exportCanvas);

    // --- VIDEO UPLOAD LISTENER ---
    document.addEventListener('sidebar:loaded', bindVideoUploadHandlers);

    // **NEW LISTENER TO DISPLAY VIDEO**
    document.addEventListener('video:apply', function(e) {
        const url = e.detail && e.detail.url;
        if (url && typeof applyVideoToCanvas === 'function') {
            applyVideoToCanvas(url);
        } else {
            console.error('applyVideoToCanvas not defined or video URL missing.');
        }
    });

    // --- ON-CANVAS MEDIA CONTROL LISTENERS (Play/Pause & Delete) ---
    const canvasPlayPauseBtn = document.getElementById('canvas-play-pause-btn');
    if (canvasPlayPauseBtn) {
        canvasPlayPauseBtn.addEventListener('click', toggleMediaPlayback);
    }

    const canvasDeleteBtn = document.getElementById('canvas-delete-btn');
    if (canvasDeleteBtn) {
        canvasDeleteBtn.addEventListener('click', () => {
            if (!selectedNode || !selectedNode.getAttr('isMedia')) return;

            const mediaType = selectedNode.getAttr && selectedNode.getAttr('mediaType');
            const mediaElement = mediaType === 'video' ? selectedNode.videoElement : selectedNode.audioElement;

            // 1. Stop & clear HTML element
            if (mediaElement) {
                mediaElement.pause();
                mediaElement.removeAttribute('src');
                mediaElement.load();
            }

            // 2. Clear Konva Transformer handles
            // Assuming the active Transformer is named 'transformer' (not imageTransformer)
            if (transformer) {
                transformer.nodes([]);
                layer.draw();
            }

            // 3. Remove Konva node
            selectedNode.destroy();
            selectedNode = null;

            // 4. Hide HTML Floating Controls
            updateFloatingControls(null);
            layer.draw();
            saveState();
        });
    }

    // --- Post Listener ---
    if (postBtn) postBtn.addEventListener('click', simulatePost);

    // --- Drag and Drop Setup ---
    if (container) {
        container.addEventListener('dragover', function (e) {
            e.preventDefault();
            if (mockup) mockup.style.boxShadow = '0 0 0 5px #05eafa, 0 10px 30px rgba(0, 0, 0, 0.5)';
        });

        container.addEventListener('dragleave', function (e) {
            if (mockup) mockup.style.boxShadow = '0 0 0 5px #000, 0 10px 30px rgba(0, 0, 0, 0.5)';
        });

        container.addEventListener('drop', function (e) {
            e.preventDefault();
            if (mockup) mockup.style.boxShadow = '0 0 0 5px #000, 0 10px 30px rgba(0, 0, 0, 0.5)';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const img = new Image();
                        img.onload = function() {
                            loadAndSetupImage(img);
                            saveState();
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                } else if (file.type.startsWith('video/')) {
                    const videoURL = URL.createObjectURL(file);
                    applyVideoToCanvas(videoURL);
                } else if (file.type.startsWith('audio/')) {
                    const audioURL = URL.createObjectURL(file);
                    applyAudioToCanvas(audioURL, file.name);
                } else {
                    alert('Unsupported file type dropped.');
                }
            }
        });
    }
}

function bindVideoUploadHandlers() {
    const uploadVideoBtn = document.getElementById('upload-video-btn');
    const videoInput = document.getElementById('video-input');

    if (uploadVideoBtn && videoInput) {
        uploadVideoBtn.addEventListener('click', () => {
            videoInput.click();
        });

        videoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const videoURL = URL.createObjectURL(file);
                document.dispatchEvent(
                    new CustomEvent('video:apply', { detail: { url: videoURL } })
                );
                e.target.value = null;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initEditor);

function initEditor() {
    // Injected listener to apply templates from sidebar
    document.addEventListener('template:apply', function(e) {
        const url = e.detail && e.detail.url;
        if (!url) return;
        console.log('Editor received template request for:', url);
        if (typeof loadTemplateFromURL === 'function') {
            loadTemplateFromURL(url);
        } else {
            console.error('loadTemplateFromURL not defined.');
        }
    });

    // --- Konva Initialization ---
    function initKonva(width, height) {
        container = document.getElementById('editor-canvas-container'); // Must match the ID in editor.html
        if (!container) {
            console.error("Konva canvas container 'editor-canvas-container' not found. Stage failed to initialize.");
            return;
        }

        stage = new Konva.Stage({
            container: 'editor-canvas-container',
            width: width,
            height: height,
            draggable: true
        });

        layer = new Konva.Layer();
        stage.add(layer);

        transformer = new Konva.Transformer();
        layer.add(transformer);

        addTextToCanvas('Welcome to Twin Clouds Editor!', 30, '#FFFFFF', 30, 100);
        saveState();

        stage.on('click tap', function (e) {
            if (e.target === stage || !e.target.hasName('editable-shape')) {
                deselectShape();
            }
        });
    }

    // DOM ELEMENT REFERENCES
    // Assign to global variables declared earlier
    mockup = document.querySelector('.device-mockup');
    presetSizeSelect = document.getElementById('preset-size');
    mediaUploadInput = document.getElementById('media-upload');
    uploadBtn = document.getElementById('upload-btn');
    opacitySlider = document.getElementById('opacity-slider');
    opacityValueSpan = document.getElementById('opacity-value');
    colorPicker = document.getElementById('color-picker');
    colorHexInput = document.getElementById('color-hex-input');
    fontFamilySelect = document.getElementById('font-family-select');
    shadowToggle = document.getElementById('shadow-toggle');
    animationSelect = document.getElementById('animation-select');
    undoBtn = document.getElementById('undo-btn');
    redoBtn = document.getElementById('redo-btn');
    exportBtn = document.querySelector('.btn-export');
    postBtn = document.querySelector('.btn-post');

    // --- Core Initialization ---
    initKonva(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    setupEventListeners();

    // =========================================================
    // 2. ADDITIONAL GLOBAL FUNCTIONS FOR EXTERNAL USE
    // =========================================================

    window.addTextToCanvas = addTextToCanvas;
    window.addEmojiToCanvas = addEmojiToCanvas;
    window.addRectangleToCanvas = addRectangleToCanvas;
    window.loadTemplate = loadTemplate;
    window.deleteSelectedShape = deleteSelectedShape;
    window.duplicateSelectedShape = duplicateSelectedShape;
    window.toggleTextBold = toggleTextBold;
    window.toggleTextItalic = toggleTextItalic;
    window.increaseFontSize = increaseFontSize;
    window.decreaseFontSize = decreaseFontSize;
    window.exportCanvas = exportCanvas;
    window.resizeCanvas = resizeCanvas;
    // ✅ PATCH 3 FIX: Replaced with an empty function to prevent a ReferenceError crash
    window.updateShadow = function () {};
    window.loadState = loadState;
    window.toggleMediaPlayback = toggleMediaPlayback;
    window.applyAudioToCanvas = applyAudioToCanvas;
    window.applyVideoToCanvas = applyVideoToCanvas;
    window.initEditor = initEditor;
}