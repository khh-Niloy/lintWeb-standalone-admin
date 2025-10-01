/**
 * Simple Admin Toolbar - Clean and Minimal
 * Core functionality: Element selection, text editing, AI editing, save to file
 */

class AdminToolbar {
    constructor() {
        this.isVisible = false;
        this.selectedElements = [];
        this.editingIndex = -1;
        this.isSelecting = false;
        this.highlightedElement = null;
        this.state = 'idle'; // idle, selecting, loading, success, error
        this.init();
    }
    
    init() {
        this.createToolbar();
        this.createTopDiv();
        this.attachEvents();
        this.hide(); // Hide toolbar by default
        console.log('🔧 Simple Admin Toolbar ready');
    }
    
    createTopDiv() {
        // Remove existing top div
        const existingDiv = document.getElementById('admin-top-div');
        if (existingDiv) existingDiv.remove();
        
        // Create top div
        this.topDiv = document.createElement('div');
        this.topDiv.id = 'admin-top-div';
        this.topDiv.className = 'admin-top-div';
        document.body.appendChild(this.topDiv);
        console.log('✅ Top div created');
    }
    
    
    createToolbar() {
        // Remove existing
        const existing = document.getElementById('admin-toolbar');
        if (existing) existing.remove();
        
        
        this.container = document.createElement('div');
        this.container.id = 'admin-toolbar';
        this.container.className = 'admin-toolbar-popup';
        this.container.innerHTML = `
            <div class="toolbar-popup-content">
                <!-- Close Button -->
                <button id="close-btn" class="close-btn">✖</button>
                
                <!-- Edit Mode Toggle -->
                <div class="edit-mode-section" id="edit-mode-section" style="display: none;">
                    <div class="edit-mode-toggle">
                        <button class="toggle-btn active" id="text-mode-btn" data-mode="text">
                            ✏️ Text Edit
                        </button>
                        <button class="toggle-btn" id="ai-mode-btn" data-mode="ai">
                            ✨ AI Edit
                        </button>
                    </div>
                </div>
                
                <!-- Text Editing Section -->
                <div class="text-editing-section" id="text-editing-section" style="display: none;">
                    <div class="text-edit-actions">
                        <button class="text-edit-btn save-btn" id="save-text-btn">
                            save
                        </button>
                        <button class="text-edit-btn cancel-btn" id="cancel-text-btn">
                            cancel
                        </button>
                    </div>
                </div>
                
                <!-- AI Edit Section -->
                <div class="ai-edit-section" id="ai-edit-section" style="display: none;">
                    <div class="batch-edit-options">
                        <label class="batch-checkbox">
                            <input type="checkbox" id="batch-edit-mode" />
                            <span class="checkmark"></span>
                            Apply the same edit instruction to all selected elements
                        </label>

                    </div>
                    <textarea 
                        id="prompt-input" 
                        class="edit-input"
                        placeholder="Describe the changes you want AI to make..."
                        rows="3"
                    ></textarea>
                    <div class="ai-edit-actions">
                        <button class="edit-submit-btn" id="submit-prompt">
                            Apply AI Changes
                        </button>
                        <button class="text-edit-btn cancel-btn" id="cancel-ai-btn">
                            cancel
                        </button>
                    </div>
                </div>
                
                <!-- Image Upload Section -->
                <div class="image-upload-section">
                    <input type="file" id="image-upload-input" accept="image/png,image/jpg,image/jpeg,image/gif,image/svg+xml,image/webp" style="display: none;">
                    <input type="file" id="image-replace-input" accept="image/png,image/jpg,image/jpeg,image/gif,image/svg+xml,image/webp" style="display: none;">
                    <button class="toolbar-btn upload-btn" id="btn-upload-image">
                        📷 Upload Image
                    </button>
                    <div class="upload-status" id="upload-status" style="display: none;"></div>
                </div>

                <!-- Image Actions Section (shown when image is selected) -->
                <div class="image-actions-section" id="image-actions-section" style="display: none;">
                    <button class="toolbar-btn replace-btn" id="btn-replace-image">
                        🔄 Replace Image
                    </button>
                    <button class="toolbar-btn delete-btn" id="btn-delete-image">
                        🗑️ Delete Image
                    </button>
                </div>

                <!-- Element Selection -->
                <div class="toolbar-actions">
                    <button class="toolbar-btn select-btn" id="btn-toggle-select">
                        Start Selecting
                    </button>
                </div>
            </div>
        `;
        
        this.injectStyles();
        document.body.appendChild(this.container);
        
        // Get references
        this.editModeSection = document.getElementById('edit-mode-section');
        this.textEditingSection = document.getElementById('text-editing-section');
        this.aiEditSection = document.getElementById('ai-edit-section');
        this.promptInput = document.getElementById('prompt-input');
        this.selectBtn = document.getElementById('btn-toggle-select');
        this.textModeBtn = document.getElementById('text-mode-btn');
        this.aiModeBtn = document.getElementById('ai-mode-btn');
        this.saveTextBtn = document.getElementById('save-text-btn');
        this.cancelTextBtn = document.getElementById('cancel-text-btn');
        this.cancelAiBtn = document.getElementById('cancel-ai-btn');
        this.submitPromptBtn = document.getElementById('submit-prompt');
        this.closeBtn = document.getElementById('close-btn');

        this.batchEditCheckbox = document.getElementById('batch-edit-mode');
        this.currentEditMode = 'text'; // Default to text edit mode
        this.hasUnsavedEdits = false;

        // Image upload references
        this.uploadBtn = document.getElementById('btn-upload-image');
        this.uploadInput = document.getElementById('image-upload-input');
        this.uploadStatus = document.getElementById('upload-status');

        // Image actions references
        this.imageActionsSection = document.getElementById('image-actions-section');
        this.replaceImageBtn = document.getElementById('btn-replace-image');
        this.deleteImageBtn = document.getElementById('btn-delete-image');
        this.replaceImageInput = document.getElementById('image-replace-input');
    }
    
    
    attachEvents() {
        this.selectBtn.addEventListener('click', () => this.startEditing());
        this.textModeBtn.addEventListener('click', () => this.setEditMode('text'));
        this.aiModeBtn.addEventListener('click', () => this.setEditMode('ai'));
        this.saveTextBtn.addEventListener('click', () => this.saveTextToFile());
        this.cancelTextBtn.addEventListener('click', () => this.cancelTextEdit());
        this.cancelAiBtn.addEventListener('click', () => this.cancelAiEdit());
        this.submitPromptBtn.addEventListener('click', () => this.submitPrompt());
        this.closeBtn.addEventListener('click', () => this.hide());

        // Image upload events
        this.uploadBtn.addEventListener('click', () => this.triggerImageUpload());
        this.uploadInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Image action events
        this.replaceImageBtn.addEventListener('click', () => this.triggerImageReplace());
        this.deleteImageBtn.addEventListener('click', () => this.deleteSelectedImage());
        this.replaceImageInput.addEventListener('change', (e) => this.handleImageReplace(e));

        // Keyboard shortcuts
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitPrompt();
            }
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isVisible && !this.container.contains(e.target) && !this.isUIElement(e.target)) {
                this.hide();
            }
        });
    }
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.container.classList.add('visible');
        this.setState('idle');
        
        // If we have selected elements, restore the editing interface
        if (this.selectedElements.length > 0) {
            this.renderSelected();
            
            // If we were in the middle of editing, restore the text editing mode
            if (this.editingIndex >= 0) {
                this.editElement(this.editingIndex);
            }
        }
        
        // Show save changes button when toolbar opens and ensure it's properly initialized
        if (window.showSaveChangesButton) {
            window.showSaveChangesButton();
        }
        if (window.showUndoButton) {
            window.showUndoButton();
        }
        if (window.updateSaveChangesButton) {
            window.updateSaveChangesButton();
        }
        
        console.log('✅ Toolbar shown - restored editing state');
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.container.classList.remove('visible');
        this.exitSelectMode();
        this.setState('idle');
        
        // Don't clear selections when hiding toolbar - keep elements selected
        // Don't clean up editable elements - preserve editing state
        
        // Hide save changes button when toolbar closes
        if (window.hideSaveChangesButton) {
            window.hideSaveChangesButton();
        }
        if (window.hideUndoButton) {
            window.hideUndoButton();
        }
        
        console.log('🔻 Toolbar hidden - selections and editing state preserved');
    }
    
    startEditing() {
        if (this.isSelecting) {
            this.exitSelectMode();
        } else {
            this.enterSelectMode();
        }
    }
    
    setEditMode(mode) {
        this.currentEditMode = mode;
        
        // Update toggle button states
        this.textModeBtn.classList.toggle('active', mode === 'text');
        this.aiModeBtn.classList.toggle('active', mode === 'ai');
        
        // Show appropriate edit section
        if (this.editingIndex >= 0) {
            if (mode === 'text') {
                this.textEditingSection.style.display = 'block';
                this.aiEditSection.style.display = 'none';
                
                // Re-enable text editing mode with cursor
                const elementInfo = this.selectedElements[this.editingIndex];
                if (elementInfo && elementInfo.element) {
                    this.makeElementEditable(elementInfo.element);
                }
            } else {
                this.textEditingSection.style.display = 'none';
                this.aiEditSection.style.display = 'block';
                
                // Disable contentEditable when switching to AI mode
                const elementInfo = this.selectedElements[this.editingIndex];
                if (elementInfo && elementInfo.element && this.cleanupEditableElement) {
                    elementInfo.element.contentEditable = false;
                    elementInfo.element.blur();
                }
                
                this.promptInput.focus();
            }
        }
    }
    
    toggleSelect() {
        if (this.isSelecting) {
            this.exitSelectMode();
        } else {
            this.enterSelectMode();
        }
    }
    
    enterSelectMode() {
        this.isSelecting = true;
        this.selectBtn.textContent = '⏹ Stop Selecting';
        this.selectBtn.classList.add('active');
        document.body.style.setProperty('cursor', 'crosshair', 'important');
        document.body.classList.add('admin-selecting');
        document.addEventListener('mouseover', this.handleHover.bind(this), true);
        document.addEventListener('click', this.handleSelect.bind(this), true);
        this.showStatus('Click on elements to select them for editing', 'info');
        console.log('🎯 Selection mode ON - crosshair cursor should show');
    }
    
    exitSelectMode() {
        this.isSelecting = false;
        this.selectBtn.textContent = 'Start Selecting';
        this.selectBtn.classList.remove('active');
        document.body.style.removeProperty('cursor');
        document.body.classList.remove('admin-selecting');
        document.removeEventListener('mouseover', this.handleHover, true);
        document.removeEventListener('click', this.handleSelect, true);
        this.clearHighlight();
        console.log('🎯 Selection mode OFF - cursor restored');
    }
    
    handleHover(e) {
        if (!this.isSelecting || this.isUIElement(e.target)) return;
        this.highlightElement(e.target);
    }
    
    handleSelect(e) {
        if (!this.isSelecting || this.isUIElement(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(e.target);
        this.exitSelectMode();
    }
    
    selectElement(element) {
        // Check if already selected
        if (this.selectedElements.find(el => el.element === element)) {
            this.showStatus('Element already selected', 'error');
            return;
        }

        const elementInfo = {
            element: element,
            tag: element.tagName.toLowerCase(),
            id: element.id || '',
            classes: Array.from(element.classList).join(' '),
            text: element.textContent?.trim() || '',
            originalText: element.textContent?.trim() || '',
            originalHTML: element.innerHTML, // Store original HTML structure
            attributes: this.getElementAttributes(element),
            isImage: element.tagName.toLowerCase() === 'img'
        };

        this.selectedElements.push(elementInfo);
        this.renderSelected();

        // Add visual selection indicator
        this.addSelectionBorder(element);

        // Position toolbar below the selected element
        this.positionToolbarBelowElement(element);

        // Auto-open editing interface for the newly selected element
        this.editElement(this.selectedElements.length - 1);

        this.showStatus('Element selected - use toggle to switch edit modes', 'success');
        console.log('✅ Element selected:', elementInfo);
    }
    
    
    addSelectionBorder(element) {
        // Add blue dashed border to selected element
        element.style.setProperty('outline', '2px dashed #3b82f6', 'important');
        element.style.setProperty('outline-offset', '2px', 'important');
        element.classList.add('admin-selected-element');

        // Add drag handle bar at the top of the element
        this.addDragHandle(element);

        console.log('✅ Added selection border to element:', element.tagName);
    }

    addDragHandle(element) {
        // Remove any existing drag handle
        const existingHandle = element.querySelector('.admin-drag-handle');
        if (existingHandle) {
            existingHandle.remove();
        }

        // Create drag handle container
        const dragHandle = document.createElement('div');
        dragHandle.className = 'admin-drag-handle';
        dragHandle.innerHTML = `
            <div class="drag-handle-bar">
                <span class="drag-icon">⋮⋮</span>
                <span class="drag-text">Drag to move</span>
                <button class="save-position-btn" title="Save position">💾</button>
            </div>
        `;

        // Insert at the beginning of the element
        element.style.position = 'relative';
        element.insertBefore(dragHandle, element.firstChild);

        // Get the save button
        const saveBtn = dragHandle.querySelector('.save-position-btn');

        // Make element draggable
        this.makeDraggableWithHandle(element, dragHandle, saveBtn);

        console.log('✅ Added drag handle to element:', element.tagName);
    }

    makeDraggableWithHandle(element, dragHandle, saveBtn) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // Store original position for potential restore
        const originalPosition = {
            position: element.style.position || window.getComputedStyle(element).position,
            left: element.style.left,
            top: element.style.top,
            transform: element.style.transform
        };

        // Make element absolutely positioned for dragging
        const rect = element.getBoundingClientRect();
        if (element.style.position !== 'absolute' && element.style.position !== 'fixed') {
            element.style.position = 'absolute';
            element.style.left = rect.left + window.scrollX + 'px';
            element.style.top = rect.top + window.scrollY + 'px';
            element.style.zIndex = '1000';
        }

        dragHandle.addEventListener('mousedown', (e) => {
            // Don't drag if clicking the save button
            if (e.target.closest('.save-position-btn')) {
                return;
            }

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = element.getBoundingClientRect();
            initialLeft = rect.left + window.scrollX;
            initialTop = rect.top + window.scrollY;

            element.style.cursor = 'grabbing';
            dragHandle.style.cursor = 'grabbing';

            console.log('🎯 Started dragging element');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            e.preventDefault();

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newLeft = initialLeft + deltaX;
            const newTop = initialTop + deltaY;

            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                dragHandle.style.cursor = 'grab';
                console.log('🎯 Stopped dragging element');
            }
        });

        // Save position button handler
        saveBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.saveElementPosition(element);
        });

        // Set initial cursor
        dragHandle.style.cursor = 'grab';
        element.style.cursor = 'move';
    }

    async saveElementPosition(element) {
        this.showStatus('Saving element position...', 'loading');

        try {
            const rect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);

            // Get current position values
            const position = {
                position: element.style.position,
                left: element.style.left,
                top: element.style.top,
                zIndex: element.style.zIndex || computedStyle.zIndex
            };

            // Find the element info in selected elements
            const elementInfo = this.selectedElements.find(el => el.element === element);
            if (!elementInfo) {
                this.showStatus('Element not found in selection', 'error');
                return;
            }

            const response = await fetch('/api/save-element-position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: window.location.pathname,
                    elementSelector: this.generateElementSelector(elementInfo),
                    position: position,
                    elementTag: elementInfo.tag,
                    elementId: elementInfo.id,
                    elementClasses: elementInfo.classes
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('✅ Position saved to HTML file!', 'success');

                // Increment edit counter
                if (window.incrementEditCount) {
                    window.incrementEditCount();
                }
            } else {
                this.showStatus(`❌ Failed to save: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('❌ Network error while saving', 'error');
            console.error('Save position error:', error);
        }
    }
    
    removeSelectionBorder(element) {
        // Remove selection border
        element.style.removeProperty('outline');
        element.style.removeProperty('outline-offset');
        element.classList.remove('admin-selected-element');

        // Remove drag handle
        const dragHandle = element.querySelector('.admin-drag-handle');
        if (dragHandle) {
            dragHandle.remove();
        }

        console.log('🗑️ Removed selection border from element:', element.tagName);
    }
    
    positionToolbarBelowElement(element) {
        // Store reference to the element we're following
        this.followingElement = element;
        
        // Update position immediately
        this.updateToolbarPosition();
        
        // Add scroll listener to keep toolbar with element
        this.scrollListener = () => this.updateToolbarPosition();
        window.addEventListener('scroll', this.scrollListener);
        window.addEventListener('resize', this.scrollListener);
        
        console.log('🎯 Toolbar now following selected element');
    }
    
    updateToolbarPosition() {
        if (!this.followingElement) return;
        
        const rect = this.followingElement.getBoundingClientRect();
        const padding = 10;
        
        // Calculate position relative to the document
        const left = rect.left + window.scrollX;
        const top = rect.bottom + window.scrollY + padding;
        
        // Apply the position using absolute positioning
        this.container.style.position = 'absolute';
        this.container.style.left = left + 'px';
        this.container.style.top = top + 'px';
        this.container.style.right = 'auto';
        this.container.style.bottom = 'auto';
        
        // Ensure high z-index to stay on top
        this.container.style.zIndex = '99999';
    }
    
    resetToolbarPosition() {
        // Remove scroll listeners
        if (this.scrollListener) {
            window.removeEventListener('scroll', this.scrollListener);
            window.removeEventListener('resize', this.scrollListener);
            this.scrollListener = null;
        }
        
        // Clear following element reference
        this.followingElement = null;
        
        // Reset to default bottom-right position
        this.container.style.position = 'fixed';
        this.container.style.left = 'auto';
        this.container.style.top = 'auto';
        this.container.style.right = '20px';
        this.container.style.bottom = '110px';
        this.container.style.zIndex = '99999';
        
        console.log('🔄 Reset toolbar to default position');
    }
    
    makeElementEditable(element) {
        // Store original content for comparison
        const elementInfo = this.selectedElements[this.editingIndex];
        
        // Check current state and set save button accordingly
        const currentText = element.textContent?.trim() || '';
        const originalText = elementInfo.originalText;
        const hasChanges = currentText !== originalText;
        this.updateSaveButtonState(hasChanges);
        
        // Clean up existing event listeners if any (but don't change contentEditable yet)
        if (this.cleanupEditableElement) {
            // Remove old listeners only
            element.removeEventListener('input', this.currentCheckForChanges);
            element.removeEventListener('keyup', this.currentCheckForChanges);
        }
        
        // Make element editable and focus
        element.contentEditable = true;
        element.focus();
        
        // Move cursor to the end of the text
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false); // false = collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Monitor content changes
        const checkForChanges = () => {
            const currentText = element.textContent?.trim() || '';
            const originalText = elementInfo.originalText;
            const hasChanges = currentText !== originalText;
            
            // Update element info with current text
            elementInfo.text = currentText;
            
            // Update save button state based on changes
            this.updateSaveButtonState(hasChanges);
            
            console.log(`Content check: "${currentText}" vs "${originalText}" - Changed: ${hasChanges}`);
        };
        
        // Store reference to current function for cleanup
        this.currentCheckForChanges = checkForChanges;
        
        // Add event listeners for content changes
        element.addEventListener('input', checkForChanges);
        element.addEventListener('keyup', checkForChanges);
        element.addEventListener('paste', () => {
            // Check for changes after paste
            setTimeout(checkForChanges, 10);
        });
        
        // Store event cleanup function
        this.cleanupEditableElement = () => {
            element.contentEditable = false;
            element.removeEventListener('input', checkForChanges);
            element.removeEventListener('keyup', checkForChanges);
            element.blur();
        };
    }
    
    updateSaveButtonState(hasChanges) {
        if (this.saveTextBtn) {
            if (hasChanges) {
                this.saveTextBtn.disabled = false;
                this.saveTextBtn.style.opacity = '1';
                this.saveTextBtn.style.cursor = 'pointer';
                console.log('✅ Save button enabled - changes detected');
            } else {
                this.saveTextBtn.disabled = true;
                this.saveTextBtn.style.opacity = '0.5';
                this.saveTextBtn.style.cursor = 'not-allowed';
                console.log('❌ Save button disabled - no changes');
            }
        }
    }
    
    clearAllSelections() {
        // Clean up any editable elements
        if (this.cleanupEditableElement) {
            this.cleanupEditableElement();
            this.cleanupEditableElement = null;
        }
        
        // Remove selection borders from all selected elements
        this.selectedElements.forEach(elementInfo => {
            this.removeSelectionBorder(elementInfo.element);
        });
        
        // Clear the selections array
        this.selectedElements = [];
        this.renderSelected();
        this.editingIndex = -1;
        
        // Reset toolbar position when selections are cleared
        this.resetToolbarPosition();
        
        // Hide editing sections
        this.textEditingSection.style.display = 'none';
        this.aiEditSection.style.display = 'none';
        
        this.showStatus('All selections cleared', 'info');
        console.log('🗑️ Cleared all selections');
    }
    
    getElementAttributes(element) {
        const attributes = {};
        for (let attr of element.attributes) {
            attributes[attr.name] = attr.value;
        }
        return attributes;
    }
    
    renderSelected() {
        // Show edit mode section if we have elements
        if (this.selectedElements.length > 0) {
            this.editModeSection.style.display = 'block';

            // Show image actions section if the selected element is an image
            const currentElement = this.selectedElements[this.editingIndex];
            if (currentElement && currentElement.isImage) {
                this.imageActionsSection.style.display = 'block';
            } else {
                this.imageActionsSection.style.display = 'none';
            }
        } else {
            this.editModeSection.style.display = 'none';
            this.imageActionsSection.style.display = 'none';
        }
    }
    
    editElement(index) {
        this.editingIndex = index;
        const element = this.selectedElements[index];
        
        // Update the selected element visual state
        this.renderSelected();
        
        // Show edit interface based on current mode
        if (this.currentEditMode === 'text') {
            this.textEditingSection.style.display = 'block';
            this.aiEditSection.style.display = 'none';
            
            // Make element editable and set up content monitoring
            this.makeElementEditable(element.element);
            
        } else {
            this.promptInput.value = '';
            this.aiEditSection.style.display = 'block';
            this.textEditingSection.style.display = 'none';
            this.promptInput.focus();
        }
    }
    
    async saveTextToFile() {
        if (this.editingIndex < 0) return;
        
        const element = this.selectedElements[this.editingIndex];
        const newText = element.text.trim();
        
        if (newText === element.originalText) {
            this.showStatus('No changes to save', 'info');
            return;
        }
        
        this.showStatus('Saving changes to file...', 'loading');
        
        try {
            const response = await fetch('/api/direct-text-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: window.location.pathname,
                    elementSelector: this.generateElementSelector(element),
                    newText: newText,
                    originalText: element.originalText
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update the DOM element's text content to show the saved changes
                element.element.textContent = newText;
                
                // Update the stored element info
                element.text = newText;
                element.originalText = newText;
                element.originalHTML = element.element.innerHTML; // Update stored HTML to reflect changes
                
                this.renderSelected();
                this.cancelTextEdit();
                this.showStatus('✅ Saved to file successfully!', 'success');
                
                // Increment edit counter when user saves text edits
                console.log('🔍 Checking for incrementEditCount function:', typeof window.incrementEditCount);
                console.log('🔍 Current edit count:', window.editCount);
                if (window.incrementEditCount) {
                    window.incrementEditCount();
                } else {
                    console.error('❌ incrementEditCount function not found!');
                }
            } else {
                this.showStatus('❌ Failed to save: ' + (result.error || result.message), 'error');
            }
        } catch (error) {
            this.showStatus('❌ Network error', 'error');
            console.error('Save error:', error);
        }
    }
    
    async submitPrompt() {
        const prompt = this.promptInput.value.trim();
        const isBatchMode = this.batchEditCheckbox && this.batchEditCheckbox.checked;
        
        if (!prompt) {
            this.showStatus('Please enter AI edit instructions', 'error');
            return;
        }
        
        if (this.selectedElements.length === 0) {
            this.showStatus('Please select at least one element', 'error');
            return;
        }
        
        // Show loading state on buttons and elements
        this.setAIProcessingState(true);
        this.setState('loading');
        
        if (isBatchMode && this.selectedElements.length > 1) {
            this.showStatus(`Generating preview for ${this.selectedElements.length} elements...`, 'loading');
        } else {
            this.showStatus('Generating AI preview...', 'loading');
        }
        
        try {
            const elementsToEdit = isBatchMode ? this.selectedElements : [this.selectedElements[this.editingIndex] || this.selectedElements[0]];
            const fullPrompt = this.generateBatchPrompt(prompt, elementsToEdit, isBatchMode);
            
            // Show "AI is processing..." on selected elements
            this.showAIProcessingOnElements(elementsToEdit);
            
            const result = await this.sendToBackend(fullPrompt, elementsToEdit);
            
            if (result.success && result.is_selective_preview) {
                this.setState('success');
                this.showStatus('AI preview generated! Review changes on the page.', 'success');
                
                // Hide processing indicators and show selective preview interface
                this.hideAIProcessingOnElements(elementsToEdit);
                this.showSelectivePreview(result, elementsToEdit);
                
            } else {
                this.setState('error');
                this.showStatus(result.error || 'Failed to generate AI preview', 'error');
                this.hideAIProcessingOnElements(elementsToEdit);
            }
        } catch (error) {
            console.error('Error submitting prompt:', error);
            this.setState('error');
            this.showStatus('Error processing AI request', 'error');
            
            // Hide processing indicators on error
            const elementsToEdit = isBatchMode ? this.selectedElements : [this.selectedElements[this.editingIndex] || this.selectedElements[0]];
            this.hideAIProcessingOnElements(elementsToEdit);
        } finally {
            // Always restore button states
            this.setAIProcessingState(false);
        }
    }
    
    showSelectivePreview(result, elementsToEdit) {
        console.log('🔍 Selective AI Preview Result:', result);
        console.log('🔍 Element updates:', result.element_updates);
        
        // Store original content of each element for restore
        this.originalElementContent = {};
        
        // Apply selective preview to specific elements only
        this.applySelectivePreview(result.element_updates, elementsToEdit);
        
        // Show preview interface in toolbar
        this.aiEditSection.innerHTML = `
            <div class="ai-preview-content">
                <div class="preview-actions">
                    <button class="preview-btn save-ai-btn" id="save-ai-changes">
                        💾 Save Changes
                    </button>
                    <button class="preview-btn discard-ai-btn" id="discard-ai-changes">
                        ❌ Discard & Restore
                    </button>
                </div>
            </div>
        `;
        
        // Store preview data for saving
        this.currentPreview = {
            element_updates: result.element_updates,
            target_file: result.target_file,
            project_path: result.project_path,
            elementsToEdit: elementsToEdit
        };
        
        console.log('🔍 Stored selective preview data:', this.currentPreview);
        
        // Attach event listeners
        document.getElementById('save-ai-changes').addEventListener('click', () => this.saveSelectiveAIChanges());
        document.getElementById('discard-ai-changes').addEventListener('click', () => this.discardSelectiveAIChanges());
    }
    
    applySelectivePreview(elementUpdates, elementsToEdit) {
        console.log('🔍 Applying selective preview to', elementUpdates.length, 'elements');
        
        try {
            // Apply updates to each specific element
            elementUpdates.forEach((update, index) => {
                const elementIndex = update.element_index;
                const newContent = update.new_content;
                
                // Get the corresponding selected element
                const selectedElement = elementsToEdit[elementIndex];
                if (!selectedElement || !selectedElement.element) {
                    console.warn(`⚠️ Element ${elementIndex} not found in selected elements`);
                    return;
                }
                
                const domElement = selectedElement.element;
                
                // Store original content for restore functionality
                this.originalElementContent[elementIndex] = {
                    innerHTML: domElement.innerHTML,
                    textContent: domElement.textContent
                };
                
                // Apply the new content to this specific element
                domElement.innerHTML = newContent;
                
                // Add visual indicator that this element is in preview mode
                domElement.classList.add('admin-preview-active');
                
                console.log(`✅ Applied preview to element ${elementIndex}:`, domElement.tagName);
            });
            
            this.showStatus(`✅ Preview applied to ${elementUpdates.length} element(s) - images and other content untouched!`, 'success');
            
        } catch (error) {
            console.error('❌ Error applying selective preview:', error);
            this.showStatus('❌ Error applying preview to selected elements', 'error');
        }
    }
    
    async saveSelectiveAIChanges() {
        if (!this.currentPreview) {
            this.showStatus('No preview data available', 'error');
            return;
        }
        
        this.showStatus('Saving AI changes to file...', 'loading');
        
        try {
            const response = await fetch('/api/save-ai-changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    element_updates: this.currentPreview.element_updates,
                    target_file: this.currentPreview.target_file,
                    project_path: this.currentPreview.project_path,
                    elements: this.currentPreview.elementsToEdit.map(el => ({
                        tag: el.tag,
                        id: el.id,
                        classes: el.classes,
                        text: el.text,
                        attributes: el.attributes
                    }))
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showStatus(`✅ AI changes saved! Updated ${result.updates_applied} element(s).`, 'success');
                
                // Increment edit counter when AI edits are saved
                console.log('🔍 AI Edit Save - Checking for incrementEditCount function:', typeof window.incrementEditCount);
                if (window.incrementEditCount) {
                    window.incrementEditCount();
                } else {
                    console.error('❌ AI Edit Save - incrementEditCount function not found!');
                }
                
                // Remove preview indicators from elements
                this.removePreviewIndicators();
                
                // Clear preview data and restore normal UI
                this.currentPreview = null;
                this.originalElementContent = null;
                
                // Reset AI edit section to normal state
                this.resetAIEditSection();
                
                // Remove selection styles and clear selections
                this.selectedElements = [];
                this.renderSelected();
                this.aiEditSection.style.display = 'none';
                this.editingIndex = -1;
                
                // Reset toolbar position since selections are cleared
                this.resetToolbarPosition();
                
                
                // Update status
                this.showStatus('✅ AI changes saved! Use "Save Changes" button to commit to git.', 'success');
            } else {
                this.showStatus('❌ Failed to save AI changes: ' + (result.error || result.message), 'error');
            }
        } catch (error) {
            this.showStatus('❌ Network error while saving', 'error');
            console.error('Save selective AI changes error:', error);
        }
    }
    
    discardSelectiveAIChanges() {
        console.log('🗑️ Discarding selective AI preview...');
        
        try {
            // Remove all selected elements from the DOM
            if (this.currentPreview?.elementsToEdit) {
                this.currentPreview.elementsToEdit.forEach((elementInfo, index) => {
                    if (elementInfo.element) {
                        elementInfo.element.remove();
                        console.log(`🗑️ Removed element ${index}:`, elementInfo.tag);
                    }
                });
            }
            
            this.showStatus('🗑️ Elements removed successfully', 'success');
            
        } catch (error) {
            console.error('❌ Error removing elements:', error);
            this.showStatus('❌ Error removing elements', 'error');
        }
        
        // Clear preview data
        this.currentPreview = null;
        this.originalElementContent = null;
        
        // Reset AI edit section
        this.resetAIEditSection();
        
        // Clear selections and hide editing interface
        this.selectedElements = [];
        this.renderSelected();
        this.aiEditSection.style.display = 'none';
        this.editingIndex = -1;
        
        // Reset toolbar position since selections are cleared
        this.resetToolbarPosition();
        
        
        console.log('🗑️ Elements discarded and removed from DOM');
    }
    
    removePreviewIndicators() {
        // Remove preview indicators from all elements that have them
        const previewElements = document.querySelectorAll('.admin-preview-active');
        previewElements.forEach(element => {
            element.classList.remove('admin-preview-active');
        });
        console.log(`🔧 Removed preview indicators from ${previewElements.length} elements`);
    }
    
    resetAIEditSection() {
        // Reset the AI edit section to original state
        this.aiEditSection.innerHTML = `
            <div class="batch-edit-options">
                <label class="batch-checkbox">
                    <input type="checkbox" id="batch-edit-mode" />
                    <span class="checkmark"></span>
                    Apply the same edit instruction to all selected elements
                </label>
            </div>
            <textarea 
                id="prompt-input" 
                class="edit-input"
                placeholder="Describe the changes you want AI to make..."
                rows="3"
            ></textarea>
            <div class="ai-edit-actions">
                <button class="edit-submit-btn" id="submit-prompt">
                    ✨ Apply AI Changes
                </button>
                <button class="text-edit-btn cancel-btn" id="cancel-ai-btn">
                    cancel
                </button>
            </div>
        `;
        
        // Re-attach event listeners
        this.batchEditCheckbox = document.getElementById('batch-edit-mode');
        this.promptInput = document.getElementById('prompt-input');
        this.submitPromptBtn = document.getElementById('submit-prompt');
        this.cancelAiBtn = document.getElementById('cancel-ai-btn');
        this.submitPromptBtn.addEventListener('click', () => this.submitPrompt());
        this.cancelAiBtn.addEventListener('click', () => this.cancelAiEdit());
        
        // Clear prompt input
        if (this.promptInput) {
            this.promptInput.value = '';
        }
    }
    
    generateBatchPrompt(userPrompt, elementsToEdit, isBatchMode) {
        const elements = elementsToEdit.map((el, index) => {
            return `Element ${index + 1} - ${el.tag}${el.id ? '#' + el.id : ''}${el.classes ? '.' + el.classes.replace(/\s+/g, '.') : ''}: "${el.text}"`;
        }).join('\n');
        
        const batchInstruction = isBatchMode && elementsToEdit.length > 1 ? 
            `\n\nBATCH MODE: Apply the same changes to ALL ${elementsToEdit.length} selected elements consistently.` : 
            '';
        
        return `User Request: ${userPrompt}\n\nSelected Elements:\n${elements}${batchInstruction}\n\nIMPORTANT: Preserve all existing CSS classes, styling, and theme elements. Only modify the specific content requested while maintaining the current design and layout.`;
    }
    
    async sendToBackend(prompt, elementsToEdit = null) {
        const elements = elementsToEdit || this.selectedElements;
        const isBatchMode = elements.length > 1;
        
        try {
            const response = await fetch('/api/admin-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    elements: elements.map(el => ({
                        tag: el.tag,
                        id: el.id,
                        classes: el.classes,
                        text: el.text,
                        originalText: el.originalText,
                        attributes: el.attributes
                    })),
                    url: window.location.pathname,
                    batchMode: isBatchMode
                })
            });
            
            console.log('response', response);
            
            // Check if response is OK
            if (!response.ok) {
                // Try to parse error response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If we can't parse JSON, use the status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in sendToBackend:', error);
            throw error;
        }
    }
    
    generateElementSelector(element) {
        // Generate a unique selector for the element
        let selector = element.tag;
        
        if (element.id) {
            selector += '#' + element.id;
        }
        
        if (element.classes) {
            selector += '.' + element.classes.split(' ').join('.');
        }
        
        return selector;
    }
    
    cancelTextEdit() {
        // Restore original content if editing
        if (this.editingIndex >= 0 && this.cleanupEditableElement) {
            const elementInfo = this.selectedElements[this.editingIndex];
            if (elementInfo && elementInfo.element) {
                // Restore original HTML structure to preserve formatting
                elementInfo.element.innerHTML = elementInfo.originalHTML;
                elementInfo.text = elementInfo.originalText;
                console.log('🔄 Restored original HTML structure');
            }
        }
        
        // Clear all selections and remove borders
        this.clearAllSelections();
        
        this.showStatus('Edit cancelled - original structure restored', 'info');
    }
    
    setAIProcessingState(isProcessing) {
        if (this.submitPromptBtn) {
            if (isProcessing) {
                this.submitPromptBtn.disabled = true;
                this.submitPromptBtn.innerHTML = `
                    <div class="spinner"></div>
                    Apply AI Changes
                `;
                this.submitPromptBtn.style.cursor = 'not-allowed';
            } else {
                this.submitPromptBtn.disabled = false;
                this.submitPromptBtn.innerHTML = '✨ Apply AI Changes';
                this.submitPromptBtn.style.cursor = 'pointer';
            }
        }
        
        if (this.cancelAiBtn) {
            this.cancelAiBtn.disabled = isProcessing;
            this.cancelAiBtn.style.opacity = isProcessing ? '0.5' : '1';
            this.cancelAiBtn.style.cursor = isProcessing ? 'not-allowed' : 'pointer';
        }
        
        console.log(`🔄 AI processing state: ${isProcessing ? 'enabled' : 'disabled'}`);
    }
    
    showAIProcessingOnElements(elementsToEdit) {
        elementsToEdit.forEach(elementInfo => {
            if (elementInfo.element) {
                // Store current content for restoration
                elementInfo.processingBackupHTML = elementInfo.element.innerHTML;
                
                // Replace element content with processing message
                elementInfo.element.innerHTML = 'AI is processing...';
                elementInfo.element.classList.add('ai-processing-element');
                
                console.log('🤖 Replaced element content with processing message');
            }
        });
    }
    
    hideAIProcessingOnElements(elementsToEdit) {
        elementsToEdit.forEach(elementInfo => {
            if (elementInfo.processingBackupHTML !== undefined) {
                // Restore original content
                elementInfo.element.innerHTML = elementInfo.processingBackupHTML;
                elementInfo.element.classList.remove('ai-processing-element');
                delete elementInfo.processingBackupHTML;
                
                console.log('🔄 Restored original element content');
            }
        });
    }
    
    cancelAiEdit() {
        // Clear the AI prompt input
        if (this.promptInput) {
            this.promptInput.value = '';
        }
        
        // Clear all selections and remove borders
        this.clearAllSelections();
        
        this.showStatus('AI edit cancelled - selections cleared', 'info');
    }
    
    highlightElement(element) {
        this.clearHighlight();
        element.style.outline = '2px solid #3b82f6';
        element.style.outlineOffset = '2px';
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        this.highlightedElement = element;
    }
    
    clearHighlight() {
        if (this.highlightedElement) {
            this.highlightedElement.style.outline = '';
            this.highlightedElement.style.outlineOffset = '';
            this.highlightedElement.style.backgroundColor = '';
            this.highlightedElement = null;
        }
    }
    
    isUIElement(element) {
        return element.closest('#admin-toolbar') || 
               element.closest('#admin-toolbar-button') ||
               element.closest('#lintai-watermark') ||
               element.closest('#admin-status-display');
    }
    
    setState(newState) {
        this.state = newState;
        this.container.className = `admin-toolbar-popup ${newState}`;
        if (this.isVisible) {
            this.container.classList.add('visible');
        }
    }
    
    showStatus(message, type = 'info') {
        // Create or update status display
        let statusDisplay = document.getElementById('admin-status-display');
        if (!statusDisplay) {
            statusDisplay = document.createElement('div');
            statusDisplay.id = 'admin-status-display';
            statusDisplay.className = 'admin-status-display';
            document.body.appendChild(statusDisplay);
        }

        statusDisplay.textContent = message;
        statusDisplay.className = `admin-status-display visible ${type}`;

        // Auto-hide after 5 seconds for non-loading states
        if (type !== 'loading') {
            setTimeout(() => {
                statusDisplay.classList.remove('visible');
            }, 5000);
        }

        console.log('📢', message);
    }

    triggerImageUpload() {
        this.uploadInput.click();
    }

    triggerImageReplace() {
        if (this.editingIndex < 0) {
            this.showStatus('Please select an image first', 'error');
            return;
        }

        const currentElement = this.selectedElements[this.editingIndex];
        if (!currentElement || !currentElement.isImage) {
            this.showStatus('Selected element is not an image', 'error');
            return;
        }

        this.replaceImageInput.click();
    }

    async handleImageReplace(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showStatus('Invalid file type. Please upload an image (PNG, JPG, GIF, SVG, WebP)', 'error');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showStatus('File too large. Maximum size is 5MB', 'error');
            return;
        }

        this.showStatus('Replacing image...', 'loading');

        try {
            // Determine project path from current URL
            const pathname = window.location.pathname;
            const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');

            let projectPath;
            if (parts.length >= 2 && parts[0].startsWith("user_")) {
                const userDir = parts[0];
                const projectDir = parts[1].replace('/admin', '').replace('.html', '');
                projectPath = `/Users/admin/Documents/Projects /lintWeb-standalone-admin/projects/${userDir}/${projectDir}`;
            } else if (parts.length >= 1 && parts[0]) {
                const projectDir = parts[0].replace('/admin', '').replace('.html', '');
                projectPath = `/Users/admin/Documents/Projects /lintWeb-standalone-admin/projects/${projectDir}`;
            } else {
                this.showStatus('Cannot determine project path from URL', 'error');
                return;
            }

            // Upload the new image
            const formData = new FormData();
            formData.append('image', file);
            formData.append('project_path', projectPath);

            const uploadResponse = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                this.showStatus(`❌ Upload failed: ${uploadResult.error}`, 'error');
                return;
            }

            // Get the current element
            const currentElement = this.selectedElements[this.editingIndex];
            const imgElement = currentElement.element;
            const oldSrc = imgElement.getAttribute('src');

            // Replace the image src in the HTML file
            const response = await fetch('/api/replace-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: window.location.pathname,
                    oldImageSrc: oldSrc,
                    newImageSrc: uploadResult.path,
                    elementSelector: this.generateElementSelector(currentElement)
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update the DOM to show the new image
                imgElement.src = uploadResult.path;

                // Update stored element info
                currentElement.attributes.src = uploadResult.path;
                currentElement.originalHTML = imgElement.outerHTML;

                this.showStatus(`✅ Image replaced successfully!`, 'success');

                // Increment edit counter
                if (window.incrementEditCount) {
                    window.incrementEditCount();
                }
            } else {
                this.showStatus(`❌ Failed to replace: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('❌ Network error during replacement', 'error');
            console.error('Replace error:', error);
        } finally {
            // Reset file input
            this.replaceImageInput.value = '';
        }
    }

    async deleteSelectedImage() {
        if (this.editingIndex < 0) {
            this.showStatus('Please select an image first', 'error');
            return;
        }

        const currentElement = this.selectedElements[this.editingIndex];
        if (!currentElement || !currentElement.isImage) {
            this.showStatus('Selected element is not an image', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this image from the HTML file?')) {
            return;
        }

        this.showStatus('Deleting image...', 'loading');

        try {
            const imgElement = currentElement.element;
            const imageSrc = imgElement.getAttribute('src');

            const response = await fetch('/api/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: window.location.pathname,
                    imageSrc: imageSrc,
                    elementSelector: this.generateElementSelector(currentElement)
                })
            });

            const result = await response.json();

            if (result.success) {
                // Remove the image from DOM
                imgElement.remove();

                // Remove from selected elements
                this.selectedElements.splice(this.editingIndex, 1);
                this.editingIndex = -1;

                // Update UI
                this.renderSelected();
                this.resetToolbarPosition();

                this.showStatus('✅ Image deleted successfully!', 'success');

                // Increment edit counter
                if (window.incrementEditCount) {
                    window.incrementEditCount();
                }
            } else {
                this.showStatus(`❌ Failed to delete: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('❌ Network error during deletion', 'error');
            console.error('Delete error:', error);
        }
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showStatus('Invalid file type. Please upload an image (PNG, JPG, GIF, SVG, WebP)', 'error');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showStatus('File too large. Maximum size is 5MB', 'error');
            return;
        }

        this.showStatus('Uploading image...', 'loading');

        try {
            // Determine project path from current URL
            const pathname = window.location.pathname;
            const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');

            // Parse URL to get project path (similar to backend logic)
            let projectPath;
            if (parts.length >= 2 && parts[0].startsWith("user_")) {
                // Format: /user_xxx/project_name
                const userDir = parts[0];
                const projectDir = parts[1].replace('/admin', '').replace('.html', '');
                projectPath = `/Users/admin/Documents/Projects /lintWeb-standalone-admin/projects/${userDir}/${projectDir}`;
            } else if (parts.length >= 1 && parts[0]) {
                // Format: /project_name
                const projectDir = parts[0].replace('/admin', '').replace('.html', '');
                projectPath = `/Users/admin/Documents/Projects /lintWeb-standalone-admin/projects/${projectDir}`;
            } else {
                this.showStatus('Cannot determine project path from URL', 'error');
                return;
            }

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', file);
            formData.append('project_path', projectPath);

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus(`✅ Image uploaded: ${result.filename}`, 'success');

                // Insert image into the page
                this.insertImageIntoPage(result.path, result.filename);

                // Increment edit counter
                if (window.incrementEditCount) {
                    window.incrementEditCount();
                }
            } else {
                this.showStatus(`❌ Upload failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('❌ Network error during upload', 'error');
            console.error('Upload error:', error);
        } finally {
            // Reset file input
            this.uploadInput.value = '';
        }
    }

    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('✅ Copied to clipboard:', text);
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            console.log('✅ Copied to clipboard (fallback):', text);
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
    }

    insertImageIntoPage(imagePath, filename) {
        // Create image wrapper with draggable and resizable capabilities
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'admin-uploaded-image-wrapper';
        imageWrapper.style.position = 'absolute';
        imageWrapper.style.left = '50%';
        imageWrapper.style.top = '200px';
        imageWrapper.style.transform = 'translateX(-50%)';
        imageWrapper.style.zIndex = '1000';
        imageWrapper.style.cursor = 'move';

        // Create the image element
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = filename;
        img.className = 'admin-uploaded-image';
        img.style.width = '300px';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.maxWidth = '100%';

        // Create resize handles
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'admin-image-resize-handle';
        resizeHandle.innerHTML = '⇲';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.width = '20px';
        resizeHandle.style.height = '20px';
        resizeHandle.style.cursor = 'nwse-resize';
        resizeHandle.style.background = '#3b82f6';
        resizeHandle.style.color = 'white';
        resizeHandle.style.borderRadius = '0 0 4px 0';
        resizeHandle.style.display = 'flex';
        resizeHandle.style.alignItems = 'center';
        resizeHandle.style.justifyContent = 'center';
        resizeHandle.style.fontSize = '14px';

        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'admin-image-save-btn';
        saveBtn.innerHTML = '💾';
        saveBtn.title = 'Save image to HTML';
        saveBtn.style.position = 'absolute';
        saveBtn.style.top = '-10px';
        saveBtn.style.left = '-10px';
        saveBtn.style.width = '24px';
        saveBtn.style.height = '24px';
        saveBtn.style.background = '#22c55e';
        saveBtn.style.color = 'white';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '50%';
        saveBtn.style.cursor = 'pointer';
        saveBtn.style.fontSize = '12px';
        saveBtn.style.display = 'flex';
        saveBtn.style.alignItems = 'center';
        saveBtn.style.justifyContent = 'center';
        saveBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'admin-image-delete-btn';
        deleteBtn.innerHTML = '✖';
        deleteBtn.title = 'Remove image';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '-10px';
        deleteBtn.style.right = '-10px';
        deleteBtn.style.width = '24px';
        deleteBtn.style.height = '24px';
        deleteBtn.style.background = '#ef4444';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '12px';
        saveBtn.style.display = 'flex';
        deleteBtn.style.alignItems = 'center';
        deleteBtn.style.justifyContent = 'center';
        deleteBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

        // Add selection border
        imageWrapper.style.border = '2px dashed #3b82f6';
        imageWrapper.style.padding = '4px';
        imageWrapper.style.background = 'rgba(59, 130, 246, 0.05)';

        // Append elements
        imageWrapper.appendChild(img);
        imageWrapper.appendChild(resizeHandle);
        imageWrapper.appendChild(saveBtn);
        imageWrapper.appendChild(deleteBtn);
        document.body.appendChild(imageWrapper);

        // Store original data
        imageWrapper.dataset.imagePath = imagePath;
        imageWrapper.dataset.filename = filename;

        // Make draggable
        this.makeDraggable(imageWrapper);

        // Make resizable
        this.makeResizable(imageWrapper, img, resizeHandle);

        // Save functionality
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.saveImageToHTML(imageWrapper, img, imagePath);
        });

        // Delete functionality
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Remove this image from the page?')) {
                imageWrapper.remove();
                this.showStatus('Image removed from page', 'info');
            }
        });

        this.showStatus('✅ Image inserted! Drag to reposition, resize from corner', 'success');
        console.log('✅ Image inserted into page:', imagePath);
    }

    makeDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        element.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on resize handle or delete button
            if (e.target.classList.contains('admin-image-resize-handle') ||
                e.target.classList.contains('admin-image-delete-btn')) {
                return;
            }

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === element || e.target.classList.contains('admin-uploaded-image')) {
                isDragging = true;
                element.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
            }
        });
    }

    makeResizable(wrapper, img, handle) {
        let isResizing = false;
        let originalWidth = 0;
        let originalHeight = 0;
        let originalX = 0;
        let originalY = 0;
        let originalMouseX = 0;
        let originalMouseY = 0;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;

            const rect = img.getBoundingClientRect();
            originalWidth = rect.width;
            originalHeight = rect.height;
            originalX = rect.left;
            originalY = rect.top;
            originalMouseX = e.clientX;
            originalMouseY = e.clientY;

            document.body.style.cursor = 'nwse-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                e.preventDefault();
                const deltaX = e.clientX - originalMouseX;
                const deltaY = e.clientY - originalMouseY;

                // Use the larger delta to maintain aspect ratio
                const delta = Math.max(deltaX, deltaY);
                const newWidth = originalWidth + delta;

                if (newWidth > 50) { // Minimum width
                    img.style.width = newWidth + 'px';
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
    }

    async saveImageToHTML(wrapper, img, imagePath) {
        this.showStatus('Saving image to HTML...', 'loading');

        try {
            // Get the computed position and size
            const wrapperRect = wrapper.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();

            // Extract transform values
            const transform = window.getComputedStyle(wrapper).transform;
            let translateX = 0;
            let translateY = 0;

            if (transform && transform !== 'none') {
                const matrix = transform.match(/matrix\((.+)\)/);
                if (matrix) {
                    const values = matrix[1].split(', ');
                    translateX = parseFloat(values[4]) || 0;
                    translateY = parseFloat(values[5]) || 0;
                }
            }

            // Calculate actual position (accounting for initial positioning)
            const actualLeft = wrapperRect.left + window.scrollX;
            const actualTop = wrapperRect.top + window.scrollY;

            // Get image width
            const imageWidth = img.style.width || '300px';

            // Create clean HTML for the image
            const imageHTML = `<img src="${imagePath}" alt="${wrapper.dataset.filename}" style="position: absolute; left: ${actualLeft}px; top: ${actualTop}px; width: ${imageWidth}; z-index: 100;">`;

            // Determine target element (body or a container)
            let targetSelector = 'body';
            let insertionMethod = 'append'; // append to end of body

            const response = await fetch('/api/save-image-to-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: window.location.pathname,
                    imageHTML: imageHTML,
                    targetSelector: targetSelector,
                    insertionMethod: insertionMethod
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('✅ Image saved to HTML file!', 'success');

                // Remove the temporary wrapper and replace with permanent image
                wrapper.remove();

                // Increment edit counter
                if (window.incrementEditCount) {
                    window.incrementEditCount();
                }

                // Show message about needing to commit
                setTimeout(() => {
                    this.showStatus('Use "Save Changes" button to commit to git', 'info');
                }, 2000);
            } else {
                this.showStatus(`❌ Failed to save: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus('❌ Network error while saving', 'error');
            console.error('Save image error:', error);
        }
    }
    
    
    injectStyles() {
        const styleId = 'admin-toolbar-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Modern Admin Toolbar - Minimal Clean Design */
            .admin-toolbar-popup {
                position: fixed;
                bottom: 110px;
                right: 20px;
                width: 360px;
                max-height: 520px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                box-shadow: 
                    0 32px 64px rgba(0, 0, 0, 0.12),
                    0 16px 32px rgba(0, 0, 0, 0.08),
                    0 8px 16px rgba(0, 0, 0, 0.06),
                    0 4px 8px rgba(0, 0, 0, 0.04),
                    0 0 0 1px rgba(0, 0, 0, 0.08);
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                font-size: 14px;
                transform: translateY(100%) scale(0.96);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                pointer-events: none;
                overflow: hidden;
                backdrop-filter: blur(12px);
            }
            
            .admin-toolbar-popup.visible {
                transform: translateY(0) scale(1);
                opacity: 1;
                pointer-events: auto;
                animation: slideUpFadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            
            .admin-toolbar-popup * {
                pointer-events: auto;
            }
            
            .admin-toolbar-popup button {
                pointer-events: auto !important;
                position: relative;
                z-index: 100003;
            }
            
            @keyframes slideUpFadeIn {
                0% {
                    transform: translateY(100%) scale(0.96);
                    opacity: 0;
                }
                100% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
            
            .admin-toolbar-popup.loading {
                border-color: #e2e8f0;
                box-shadow: 
                    0 20px 40px rgba(59, 130, 246, 0.08),
                    0 4px 16px rgba(59, 130, 246, 0.04),
                    0 0 0 0.5px rgba(59, 130, 246, 0.1);
            }
            
            .admin-toolbar-popup.success {
                border-color: #e2e8f0;
                box-shadow: 
                    0 20px 40px rgba(34, 197, 94, 0.08),
                    0 4px 16px rgba(34, 197, 94, 0.04),
                    0 0 0 0.5px rgba(34, 197, 94, 0.1);
            }
            
            .admin-toolbar-popup.error {
                border-color: #e2e8f0;
                box-shadow: 
                    0 20px 40px rgba(239, 68, 68, 0.08),
                    0 4px 16px rgba(239, 68, 68, 0.04),
                    0 0 0 0.5px rgba(239, 68, 68, 0.1);
            }
            
            .toolbar-popup-content {
                padding-top: 7px;
                padding-bottom: 18px;
                padding-left: 22px;
                padding-right: 22px;
                display: flex;
                flex-direction: column;
                gap: 18px;
                max-height: 480px;
                overflow-y: auto;
                position: relative;
                z-index: 1;
            }
            
            .toolbar-popup-content h4 {
                margin: 0 0 12px 0;
                font-size: 15px;
                font-weight: 600;
                color: #0f172a;
                letter-spacing: -0.025em;
            }
            
            .close-btn {
                position: absolute;
                top: 10px;
                right: 0px;
                left: auto;
                width: 28px;
                height: 28px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                color: #64748b;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 11px;
                z-index: 100010;
                margin-left: auto;
            }
            
            .close-btn:hover {
                background: #f1f5f9;
                color: #334155;
                transform: scale(1.05);
            }
            
            .edit-mode-section {
                border-bottom: 1px solid #f1f5f9;
            }
            
            .edit-mode-toggle {
                display: flex;
                background: #f8fafc;
                border-radius: 10px;
                padding: 6px;
                gap: 4px;
                border: 1px solid #f1f5f9;
            }
            
            .toggle-btn {
                flex: 1;
                padding: 10px 14px;
                border: none;
                border-radius: 8px;
                background: transparent;
                color: #64748b;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            
            .toggle-btn:hover {
                background: #f1f5f9;
                color: #475569;
            }
            
            .toggle-btn.active {
                background: #ffffff;
                color: #0f172a;
                box-shadow: 
                    0 2px 4px rgba(0, 0, 0, 0.04),
                    0 0 0 1px rgba(0, 0, 0, 0.06);
                font-weight: 600;
            }
            
            .text-editing-section, .ai-edit-section {
                position: relative;
            }
            
            .ai-edit-section {
                border-color: #e2e8f0;
                background: #fafbfc;
            }
            
            .edit-input {
                width: 100%;
                padding: 14px 16px;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                background: #ffffff;
                color: #0f172a;
                font-size: 13px;
                font-family: inherit;
                resize: vertical;
                min-height: 68px;
                transition: all 0.2s ease;
                outline: none;
                margin-bottom: 12px;
                line-height: 1.5;
            }
            
            .edit-input:focus {
                border-color: #94a3b8;
                box-shadow: 
                    0 0 0 3px rgba(148, 163, 184, 0.1),
                    0 2px 8px rgba(0, 0, 0, 0.04);
            }
            
            .text-edit-actions, .ai-edit-actions {
                display: flex;
                gap: 8px;
            }
            
            .ai-edit-actions {
                margin-top: 12px;
            }
            
            .text-edit-btn {
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                text-transform: lowercase;
                font-family: inherit;
            }
            
            .text-edit-btn.save-btn {
                background: #22c55e;
                color: white;
                flex: 1;
                min-width: 80px;
            }
            
            .text-edit-btn.save-btn:hover:not(:disabled) {
                background: #16a34a;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
            }
            
            .text-edit-btn.save-btn:disabled {
                background: #94a3b8 !important;
                cursor: not-allowed !important;
                opacity: 0.5 !important;
                transform: none !important;
                box-shadow: none !important;
            }
            
            .text-edit-btn.cancel-btn {
                background: #ef4444;
                color: white;
                flex: 1;
                min-width: 80px;
            }
            
            .text-edit-btn.cancel-btn:hover {
                background: #dc2626;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }
            
            .edit-submit-btn {
                width: 100%;
                background: #0f172a;
                border: none;
                border-radius: 10px;
                padding: 14px 18px;
                cursor: pointer;
                color: white;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .edit-submit-btn:hover:not(:disabled) {
                background: #1e293b;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .edit-submit-btn:disabled {
                background: #64748b !important;
                cursor: not-allowed !important;
                transform: none !important;
                box-shadow: none !important;
            }
            
            .toolbar-actions {
                display: flex;
                gap: 8px;
            }
            
            .toolbar-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 14px 20px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                color: #334155;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
                font-weight: 600;
                flex: 1;
                justify-content: center;
            }
            
            .toolbar-btn:hover {
                background: #f1f5f9;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            }
            
            .toolbar-btn.active {
                background: #0f172a;
                border-color: #334155;
                color: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            /* Image Upload Section */
            .image-upload-section {
                border-bottom: 1px solid #f1f5f9;
                padding-bottom: 12px;
            }

            .upload-btn {
                width: 100%;
                background: #8b5cf6;
                border: none;
                border-radius: 10px;
                padding: 12px 18px;
                color: white;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .upload-btn:hover {
                background: #7c3aed;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
            }

            /* Image Actions Section */
            .image-actions-section {
                border-bottom: 1px solid #f1f5f9;
                padding-bottom: 12px;
                display: flex;
                gap: 8px;
            }

            .replace-btn {
                flex: 1;
                background: #3b82f6;
                border: none;
                border-radius: 10px;
                padding: 12px 18px;
                color: white;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .replace-btn:hover {
                background: #2563eb;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }

            .delete-btn {
                flex: 1;
                background: #ef4444;
                border: none;
                border-radius: 10px;
                padding: 12px 18px;
                color: white;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .delete-btn:hover {
                background: #dc2626;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }

            .upload-status {
                margin-top: 8px;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                text-align: center;
            }

            .upload-status.success {
                background: #f0fdf4;
                color: #166534;
                border: 1px solid #bbf7d0;
            }

            .upload-status.error {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }

            /* Element Selection Styles */
            body.admin-selecting {
                cursor: crosshair !important;
            }

            body.admin-selecting * {
                cursor: crosshair !important;
            }

            body.admin-selecting *:hover {
                background-color: rgba(59, 130, 246, 0.1) !important;
                outline: 2px solid #3b82f6 !important;
                outline-offset: -2px !important;
                cursor: crosshair !important;
            }

            /* Prevent selection on toolbar elements */
            body.admin-selecting #admin-toolbar,
            body.admin-selecting #admin-toolbar *,
            body.admin-selecting #admin-status-display,
            body.admin-selecting #admin-status-display *,
            body.admin-selecting #lintai-watermark,
            body.admin-selecting #lintai-watermark * {
            }
            
            /* Status Display */
            .admin-status-display {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ffffff;
                color: #0f172a;
                padding: 14px 18px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 500;
                z-index: 99998;
                transform: translateY(-100px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                pointer-events: none;
                max-width: 320px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
                backdrop-filter: blur(8px);
            }
            
            .admin-status-display.visible {
                transform: translateY(0);
                opacity: 1;
            }
            
            .admin-status-display.success {
                background: #f0fdf4;
                border-color:rgb(141, 254, 181);
                color: #166534;
            }
            
            .admin-status-display.error {
                background: #fef2f2;
                border-color: #fecaca;
                color: #dc2626;
            }
            
            .admin-status-display.loading {
                background: #eff6ff;
                border-color: #bfdbfe;
                color: #1d4ed8;
            }
            
            .admin-status-display.info {
                background: #f0f9ff;
                border-color: #bae6fd;
                color: #0c4a6e;
            }
            
            /* Batch Edit Options */
            .batch-edit-options {
                margin-bottom: 12px;
            }
            
            .batch-checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: #64748b;
                cursor: pointer;
                user-select: none;
            }
            
            .batch-checkbox input[type="checkbox"] {
                width: 16px;
                height: 16px;
                accent-color: #9333ea;
                cursor: pointer;
            }
            
            .batch-checkbox:hover {
                color: #475569;
            }
            
            /* AI Preview Styles */
            .ai-preview-content {
                text-align: center;
            }
            
            .preview-actions {
                display: flex;
                gap: 8px;
            }
            
            .preview-btn {
                flex: 1;
                padding: 12px 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            
            .save-ai-btn {
                background: #16a34a;
                color: white;
            }
            
            .save-ai-btn:hover {
                background: #15803d;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
            }
            
            .discard-ai-btn {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                color: #64748b;
            }
            
            .discard-ai-btn:hover {
                background: #f1f5f9;
                color: #ef4444;
                border-color: #fecaca;
            }
            
            /* Spinner for loading states */
            .spinner {
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid #ffffff40;
                border-top: 2px solid #ffffff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* AI Processing Overlay */
            .ai-processing-overlay {
                background: #1e293b;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                pointer-events: none;
                z-index: 99999;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            /* AI Processing Element */
            .ai-processing-element {
                background: #f3f4f6 !important;
                color: #6b7280 !important;
                font-style: italic !important;
                text-align: center !important;
                padding: 20px !important;
                border: 2px dashed #d1d5db !important;
                border-radius: 8px !important;
                animation: pulse 2s infinite;
            }
            
            /* Preview indicator for elements in selective preview mode */
            .admin-preview-active {
                outline: 2px solid #16a34a !important;
                outline-offset: 2px !important;
                background-color: rgba(22, 163, 74, 0.1) !important;
                position: relative !important;
            }
            
            .admin-preview-active::before {
                content: "🔍 Preview";
                position: absolute;
                top: -25px;
                left: 0;
                background: #16a34a;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                z-index: 99999;
                pointer-events: none;
            }
            
            /* Selected Element Border */
            .admin-selected-element {
                outline: 2px dashed #3b82f6 !important;
                outline-offset: 2px !important;
            }

            /* Drag Handle Styles */
            .admin-drag-handle {
                position: absolute;
                top: -32px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100000;
                pointer-events: auto;
            }

            .drag-handle-bar {
                background: #3b82f6;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                cursor: grab;
                user-select: none;
                font-size: 12px;
                font-weight: 600;
                white-space: nowrap;
            }

            .drag-handle-bar:active {
                cursor: grabbing;
            }

            .drag-icon {
                font-size: 14px;
                font-weight: bold;
                line-height: 1;
            }

            .drag-text {
                font-size: 11px;
                opacity: 0.9;
            }

            .save-position-btn {
                background: white;
                color: #3b82f6;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .save-position-btn:hover {
                background: #f0f9ff;
                transform: scale(1.05);
            }

            .save-position-btn:active {
                transform: scale(0.95);
            }

            /* Uploaded Image Wrapper */
            .admin-uploaded-image-wrapper {
                transition: box-shadow 0.2s ease;
            }

            .admin-uploaded-image-wrapper:hover {
                box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
            }

            .admin-uploaded-image {
                pointer-events: none;
                user-select: none;
            }

            .admin-image-resize-handle:hover {
                background: #2563eb !important;
                transform: scale(1.1);
            }

            .admin-image-delete-btn:hover {
                background: #dc2626 !important;
                transform: scale(1.1);
            }

            .admin-image-save-btn:hover {
                background: #16a34a !important;
                transform: scale(1.1);
            }
            
            /* Edit Button */
            #admin-toolbar-button {
                position: fixed;
                bottom: 21px;
                right: 29px;
                z-index: 99999;
                align-items: center;
                background: white !important;
                color: black !important;
                padding: 10px 24px;
                border-radius: 12px;
                font-weight: 600;
                border: 1px solid #1a1a1a;
                box-shadow: 
                    0 8px 24px rgba(0, 0, 0, 0.25),
                    0 2px 8px rgba(0, 0, 0, 0.15);
                backdrop-filter: blur(8px);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
                display: flex;
            }
            
            #admin-toolbar-button:hover {
                background: #ffffff !important;
                color: #000000 !important;
                transform: translateY(-1px);
                box-shadow: 
                    0 12px 32px rgba(0, 0, 0, 0.3),
                    0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            /* Top Div */
            .admin-top-div {
                position: fixed;
                bottom: 15px;
                left: 50%;
                transform: translateX(-50%);
                width: 96%;
                z-index: 99999;
                align-items: center;
                background: #000000;
                color: #ffffff;
                padding: 14px 24px;
                padding-bottom: 35px;
                padding-top: 20px;
                border-radius: 12px;
                font-weight: 600;
                border: 1px solid #1a1a1a;
                box-shadow: 
                    0 8px 24px rgba(0, 0, 0, 0.25),
                    0 2px 8px rgba(0, 0, 0, 0.15);
                backdrop-filter: blur(8px);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                font-size: 14px;
                transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
                display: flex;
                justify-content: center;
            }
            
            
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .admin-toolbar-popup {
                    width: 320px;
                }
                
                
            }
            
            @media (max-width: 480px) {
                .admin-toolbar-popup {
                    width: calc(100vw - 20px);
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Only create instance if not already created
if (!window.adminToolbar) {
    window.adminToolbar = new AdminToolbar();
}