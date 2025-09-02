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
        this.attachEvents();
        this.hide(); // Hide toolbar by default
        console.log('🔧 Simple Admin Toolbar ready');
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
                
                <!-- Selected Elements Display -->
                <div class="selected-elements-section">
                    <h4>Selected Elements</h4>
                    <div class="selected-elements-container" id="selected-elements-container">
                        <div class="no-elements">No elements selected</div>
                    </div>
                </div>
                
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
                    <textarea 
                        id="text-edit-input" 
                        class="text-edit-input"
                        placeholder="Enter the new text content..."
                        rows="3"
                    ></textarea>
                    <div class="text-edit-actions">
                        <button class="text-edit-btn save-btn" id="save-text-btn">
                            💾 Save
                        </button>
                        <button class="text-edit-btn cancel-text" id="cancel-text-btn">
                            ❌ Cancel
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
                    <button class="edit-submit-btn" id="submit-prompt">
                        ✨ Apply AI Changes
                    </button>
                </div>
                
                <!-- Element Selection -->
                <div class="toolbar-actions">
                    <button class="toolbar-btn select-btn" id="btn-toggle-select">
                        🎯 Start Editing
                    </button>
                </div>
            </div>
        `;
        
        this.injectStyles();
        document.body.appendChild(this.container);
        
        // Get references
        this.selectedContainer = document.getElementById('selected-elements-container');
        this.editModeSection = document.getElementById('edit-mode-section');
        this.textEditingSection = document.getElementById('text-editing-section');
        this.textEditInput = document.getElementById('text-edit-input');
        this.aiEditSection = document.getElementById('ai-edit-section');
        this.promptInput = document.getElementById('prompt-input');
        this.selectBtn = document.getElementById('btn-toggle-select');
        this.textModeBtn = document.getElementById('text-mode-btn');
        this.aiModeBtn = document.getElementById('ai-mode-btn');
        this.saveTextBtn = document.getElementById('save-text-btn');
        this.cancelTextBtn = document.getElementById('cancel-text-btn');
        this.submitPromptBtn = document.getElementById('submit-prompt');
        this.closeBtn = document.getElementById('close-btn');

        this.batchEditCheckbox = document.getElementById('batch-edit-mode');
        this.currentEditMode = 'text'; // Default to text edit mode
    }
    
    
    attachEvents() {
        this.selectBtn.addEventListener('click', () => this.startEditing());
        this.textModeBtn.addEventListener('click', () => this.setEditMode('text'));
        this.aiModeBtn.addEventListener('click', () => this.setEditMode('ai'));
        this.saveTextBtn.addEventListener('click', () => this.saveTextToFile());
        this.cancelTextBtn.addEventListener('click', () => this.cancelTextEdit());
        this.submitPromptBtn.addEventListener('click', () => this.submitPrompt());
        this.closeBtn.addEventListener('click', () => this.hide());
        

        
        // Auto-update text preview as user types
        this.textEditInput.addEventListener('input', () => this.updatePreview());
        
        // Keyboard shortcuts
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitPrompt();
            }
        });
        
        this.textEditInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.saveTextToFile();
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
        console.log('✅ Toolbar shown');
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.container.classList.remove('visible');
        this.exitSelectMode();
        this.setState('idle');
        console.log('🔻 Toolbar hidden');
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
                this.textEditInput.focus();
            } else {
                this.textEditingSection.style.display = 'none';
                this.aiEditSection.style.display = 'block';
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
        document.body.style.cursor = 'crosshair';
        document.body.classList.add('admin-selecting');
        document.addEventListener('mouseover', this.handleHover.bind(this), true);
        document.addEventListener('click', this.handleSelect.bind(this), true);
        this.showStatus('Click on elements to select them for editing', 'info');
        console.log('🎯 Selection mode ON');
    }
    
    exitSelectMode() {
        this.isSelecting = false;
        this.selectBtn.textContent = '🎯 Start Editing';
        this.selectBtn.classList.remove('active');
        document.body.style.cursor = 'default';
        document.body.classList.remove('admin-selecting');
        document.removeEventListener('mouseover', this.handleHover, true);
        document.removeEventListener('click', this.handleSelect, true);
        this.clearHighlight();
        console.log('🎯 Selection mode OFF');
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
            attributes: this.getElementAttributes(element)
        };
        
        this.selectedElements.push(elementInfo);
        this.renderSelected();
        
        // Auto-open editing interface for the newly selected element
        this.editElement(this.selectedElements.length - 1);
        
        this.showStatus('Element selected - use toggle to switch edit modes', 'success');
        console.log('✅ Element selected:', elementInfo);
    }
    
    getElementAttributes(element) {
        const attributes = {};
        for (let attr of element.attributes) {
            attributes[attr.name] = attr.value;
        }
        return attributes;
    }
    
    renderSelected() {
        if (this.selectedElements.length === 0) {
            this.selectedContainer.innerHTML = '<div class="no-elements">No elements selected</div>';
            this.editModeSection.style.display = 'none';
            return;
        }
        
        this.selectedContainer.innerHTML = this.selectedElements.map((el, i) => {
            let displayText = el.text || 'No text content';
            if (displayText.length > 30) {
                displayText = displayText.substring(0, 30) + '...';
            }
            
            return `
                <div class="selected-element ${this.editingIndex === i ? 'editing' : ''}" onclick="window.adminToolbar.editElement(${i})">
                    <div class="element-info">
                        <div class="element-tag">&lt;${el.tag}&gt;</div>
                        <div class="element-text" title="${el.text}">${displayText}</div>
                    </div>
                    <div class="element-actions">
                        <button class="btn-remove" onclick="event.stopPropagation(); window.adminToolbar.removeElement(${i})" title="Remove">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Show edit mode section if we have elements
        this.editModeSection.style.display = 'block';
    }
    
    editElement(index) {
        this.editingIndex = index;
        const element = this.selectedElements[index];
        
        // Update the selected element visual state
        this.renderSelected();
        
        // Show edit interface based on current mode
        if (this.currentEditMode === 'text') {
            this.textEditInput.value = element.text;
            this.textEditingSection.style.display = 'block';
            this.aiEditSection.style.display = 'none';
            this.textEditInput.focus();
        } else {
            this.promptInput.value = '';
            this.aiEditSection.style.display = 'block';
            this.textEditingSection.style.display = 'none';
            this.promptInput.focus();
        }
    }
    
    updatePreview() {
        if (this.editingIndex < 0) return;
        const newText = this.textEditInput.value;
        const element = this.selectedElements[this.editingIndex];
        
        // Live preview - update the actual element
        element.element.textContent = newText;
    }
    
    async saveTextToFile() {
        if (this.editingIndex < 0) return;
        
        const newText = this.textEditInput.value.trim();
        const element = this.selectedElements[this.editingIndex];
        
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
                element.text = newText;
                element.originalText = newText;
                this.renderSelected();
                this.cancelTextEdit();
                this.showStatus('✅ Saved to file successfully!', 'success');
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
        
        this.setState('loading');
        
        if (isBatchMode && this.selectedElements.length > 1) {
            this.showStatus(`Processing AI request for ${this.selectedElements.length} elements...`, 'loading');
        } else {
            this.showStatus('Processing AI request...', 'loading');
        }
        
        try {
            const elementsToEdit = isBatchMode ? this.selectedElements : [this.selectedElements[this.editingIndex] || this.selectedElements[0]];
            const fullPrompt = this.generateBatchPrompt(prompt, elementsToEdit, isBatchMode);
            const result = await this.sendToBackend(fullPrompt, elementsToEdit);
            
            if (result.success) {
                this.setState('success');
                const message = isBatchMode ? 
                    `AI changes applied to ${elementsToEdit.length} elements successfully!` : 
                    'AI changes applied successfully!';
                this.showStatus(message, 'success');
                this.promptInput.value = '';
                this.aiEditSection.style.display = 'none';
                this.editingIndex = -1;
                // Clear selections before reload
                this.selectedElements = [];
                this.renderSelected();
                // Refresh the page to show changes
                setTimeout(() => window.location.reload(), 1000);
            } else {
                this.setState('error');
                this.showStatus(result.error || 'Failed to apply AI changes', 'error');
            }
        } catch (error) {
            console.error('Error submitting prompt:', error);
            this.setState('error');
            this.showStatus('Error processing AI request', 'error');
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
    
    async sendToBatchBackend(prompt, elementsToEdit) {
        try {
            const response = await fetch('/api/admin-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    elements: elementsToEdit.map(el => ({
                        tag: el.tag,
                        id: el.id,
                        classes: el.classes,
                        text: el.text,
                        originalText: el.originalText,
                        attributes: el.attributes
                    })),
                    url: window.location.pathname,
                    batchMode: elementsToEdit.length > 1
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in sendToBatchBackend:', error);
            throw error;
        }
    }
    
    generatePrompt(userPrompt) {
        const elements = this.selectedElements.map(el => {
            return `Element ${el.tag}${el.id ? '#' + el.id : ''}${el.classes ? '.' + el.classes.replace(/\s+/g, '.') : ''}: "${el.text}"`;
        }).join('\n');
        
        return `User Request: ${userPrompt}\n\nSelected Elements:\n${elements}\n\nIMPORTANT: Preserve all existing CSS classes, styling, and theme elements. Only modify the specific content requested while maintaining the current design and layout.`;
    }
    
    async sendToBackend(prompt, elementsToEdit = null) {
        const elements = elementsToEdit || this.selectedElements;
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
                    url: window.location.pathname
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
        this.textEditingSection.style.display = 'none';
        this.aiEditSection.style.display = 'none';
        this.editingIndex = -1;
        
        // Update visual state
        this.renderSelected();
        
        this.showStatus('Edit cancelled', 'info');
    }
    
    removeElement(index) {
        if (this.editingIndex === index) {
            this.cancelTextEdit();
        } else if (this.editingIndex > index) {
            this.editingIndex--;
        }
        
        this.selectedElements.splice(index, 1);
        this.renderSelected();
        this.showStatus('Element removed', 'info');
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
    

    
    injectStyles() {
        const styleId = 'admin-toolbar-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Simple Admin Toolbar - Clean White Design */
            .admin-toolbar-popup {
                position: fixed;
                bottom: 60px;
                right: 10px;
                width: 350px;
                max-height: 500px;
                background: #ffffff !important;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                box-shadow: 
                    0 25px 50px rgba(0, 0, 0, 0.1),
                    0 8px 32px rgba(0, 0, 0, 0.08);
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                font-size: 14px;
                transform: translateY(100%) scale(0.9);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: none;
                overflow: hidden;
            }
            

            
            .admin-toolbar-popup.visible {
                transform: translateY(0) scale(1);
                opacity: 1;
                pointer-events: auto;
                animation: slideUpFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
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
                    transform: translateY(100%) scale(0.9);
                    opacity: 0;
                }
                100% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
            
            .admin-toolbar-popup.loading {
                border-color: rgba(59, 130, 246, 0.4);
                background: #ffffff !important;
            }
            
            .admin-toolbar-popup.success {
                border-color: rgba(16, 185, 129, 0.4);
                background: #ffffff !important;
            }
            
            .admin-toolbar-popup.error {
                border-color: rgba(239, 68, 68, 0.4);
                background: #ffffff !important;
            }
            
            
            .toolbar-popup-content {
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                max-height: 460px;
                overflow-y: auto;
                position: relative;
                z-index: 1;
            }
            
            .toolbar-popup-content h4 {
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: #1e293b;
                background:rgb(255, 255, 255);
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            

            
            .close-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 32px;
                height: 32px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f1f5f9 !important;
                border: 1px solid #cbd5e1 !important;
                color: #64748b !important;
                border-radius: 8px !important;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
            }
            
            .close-btn:hover {
                background: #e2e8f0 !important;
                color: #475569 !important;
            }
            
            .selected-elements-section {
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 16px;
            }
            
            .selected-elements-container {
                max-height: 120px;
                overflow-y: auto;
            }
            
            .no-elements {
                color: #64748b;
                font-style: italic;
                font-size: 12px;
                padding: 12px;
                text-align: center;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
            }
            
            .selected-element {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 14px;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 10px;
                margin-bottom: 8px;
                font-size: 12px;
                box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
                transition: all 0.2s ease;
                cursor: pointer;
            }
            
            .selected-element:hover {
                background: #dbeafe;
                border-color: #93c5fd;
                transform: translateY(-1px);
            }
            
            .selected-element.editing {
                background: #dcfce7;
                border: 1px solid #86efac;
                box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
            }
            
            .edit-mode-section {
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 16px;
                margin-bottom: 16px;
            }
            
            .edit-mode-toggle {
                display: flex;
                background: #f8fafc;
                border-radius: 8px;
                padding: 4px;
                gap: 2px;
            }
            
            .toggle-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: #64748b;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            
            .toggle-btn:hover {
                background: #e2e8f0;
                color: #475569;
            }
            
            .toggle-btn.active {
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                color: #3b82f6;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
            }
            
            .element-info {
                flex: 1;
                min-width: 0;
            }
            
            .element-tag {
                font-weight: 600;
                color: #3b82f6;
                font-size: 11px;
                background: #eff6ff;
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid #bfdbfe;
                display: inline-block;
            }
            
            .element-text {
                color: #374151;
                margin-top: 4px;
                font-size: 11px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-weight: 500;
            }
            
            .element-actions {
                display: flex;
                gap: 4px;
                margin-left: 8px;
            }
            
            .btn-remove {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                border-radius: 6px;
                padding: 6px 8px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.2s ease;
            }
            
            .btn-remove:hover {
                background: #fee2e2;
                transform: translateY(-1px);
            }
            
            .text-editing-section, .ai-edit-section {
                border: 1px solid #bbf7d0;
                border-radius: 12px;
                padding: 16px;
                background: #f0fdf4;
                position: relative;
            }
            
            .ai-edit-section {
                border-color: #c4b5fd;
                background: #faf5ff;
            }
            
            .text-edit-hint {
                display: flex;
                align-items: center;
                gap: 8px;
                background: #dcfce7;
                border: 1px solid #86efac;
                border-radius: 8px;
                padding: 8px 12px;
                margin-bottom: 12px;
                font-size: 11px;
                color: #16a34a;
                font-weight: 500;
            }
            
            .text-edit-input, .edit-input {
                width: 100%;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background: #ffffff;
                color: #1e293b;
                font-size: 12px;
                font-family: inherit;
                resize: vertical;
                min-height: 60px;
                transition: all 0.2s ease;
                outline: none;
                margin-bottom: 8px;
            }
            
            .text-edit-input:focus, .edit-input:focus {
                border-color: #16a34a;
                box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
            }
            
            .text-edit-actions {
                display: flex;
                gap: 8px;
            }
            
            .text-edit-btn {
                flex: 1;
                padding: 9px 12px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            
            .text-edit-btn.save-btn {
                background: linear-gradient(135deg, #16a34a, #15803d);
                color: white;
            }
            
            .text-edit-btn.save-btn:hover {
                background: linear-gradient(135deg, #15803d, #166534);
                transform: translateY(-1px);
            }
            
            .text-edit-btn.cancel-text {
                background: rgba(148, 163, 184, 0.08);
                border: 1px solid rgba(148, 163, 184, 0.15);
                color: #64748b;
            }
            
            .text-edit-btn.cancel-text:hover {
                background: rgba(148, 163, 184, 0.15);
            }
            
            .edit-submit-btn {
                width: 100%;
                background: linear-gradient(135deg, #9333ea, #7c3aed);
                border: none;
                border-radius: 10px;
                padding: 12px 18px;
                cursor: pointer;
                color: white;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .edit-submit-btn:hover {
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                transform: translateY(-1px);
            }
            
            .toolbar-actions {
                display: flex;
                gap: 8px;
            }
            
            .toolbar-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 18px;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                color: #3b82f6;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
                font-weight: 500;
                flex: 1;
                justify-content: center;
            }
            
            .toolbar-btn:hover {
                background: #dbeafe;
                transform: translateY(-1px);
            }
            
            .toolbar-btn.active {
                background: #dcfce7;
                border-color: #86efac;
                color: #16a34a;
            }
            
            /* Element Selection Styles */
            body.admin-selecting * {
                outline: none !important;
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
                bottom: 20px;
                left: 20px;
                background: #0f172a;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                z-index: 99998;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
                max-width: 300px;
                border: 1px solid #334155;
            }
            
            .admin-status-display.visible {
                transform: translateY(0);
                opacity: 1;
            }
            
            .admin-status-display.success {
                background: #16a34a;
                border-color: #22c55e;
            }
            
            .admin-status-display.error {
                background: #dc2626;
                border-color: #ef4444;
            }
            
            .admin-status-display.loading {
                background: #2563eb;
                border-color: #3b82f6;
            }
            
            .admin-status-display.info {
                background: #0891b2;
                border-color: #06b6d4;
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