# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a standalone admin server for managing static websites and HTML projects. It provides:

1. **Static File Serving** - Serves HTML projects from the `projects/` directory
2. **Admin Interface** - Web-based editing tools with AI integration
3. **AI-Powered Editing** - Integration with Qwen CLI for intelligent content modifications
4. **Direct Text Editing** - Manual text replacement functionality

## Architecture

### Core Components

**Flask Server (`app.py`)**
- Main application serving static files and API endpoints
- Admin toolbar injection for editing capabilities
- Path traversal protection with `safe_join_projects()`
- Health check endpoint at `/health`

**Admin System**
- `admin/toolbar/toolbar.js` - Client-side editing interface with element selection
- `admin/templates/admin-inject.html` - Admin toolbar injection template
- Admin routes accessible via `/admin/` prefix or `?admin=true` parameter

**Project Structure**
- `projects/` - Contains all website projects (user projects and company websites)
- Each project can contain HTML files, assets, images, and configuration files
- Projects follow structure: `projects/{user_id}/{project_name}/` or `projects/{project_name}/`

### Key API Endpoints

- **POST `/api/direct-text-edit`** - Direct text replacement in HTML files
- **POST `/api/admin-edit`** - AI-powered editing via Qwen CLI integration
- **GET `/admin-static/<filename>`** - Serves admin toolbar assets

### Admin Editing Features

1. **Element Selection** - Click-to-select HTML elements for editing
2. **Text Mode** - Direct text content editing with live preview
3. **AI Mode** - Natural language instructions for content modifications
4. **Batch Editing** - Apply changes to multiple selected elements simultaneously

## Common Development Commands

### Running the Server
```bash
# Default port (47261)
python app.py

# Custom port via environment variable
PORT=8000 python app.py

# Development with debug mode (already enabled in app.py)
python app.py
```

### Installing Dependencies
```bash
pip install -r requirements.txt
```

### Project Structure Commands
```bash
# List all projects
ls projects/

# Access project via URL structure
# Format: /{project_name} or /user_{id}/{project_name}
# Admin mode: /{project_name}/admin or /{project_name}?admin=true
```

## Key Technical Details

### Security Features
- **Path Traversal Protection** - `safe_join_projects()` prevents directory traversal attacks
- **Admin Route Detection** - `is_admin_route()` identifies admin access attempts
- **Safe HTML Injection** - Admin toolbar only injected in admin mode

### AI Integration Requirements
- **Qwen CLI** must be installed and available in PATH for AI editing features
- Server checks for Qwen availability before processing AI edit requests
- Timeout protection (60 seconds) for AI operations

### Project Serving Logic
- Directory listing with file browser for directories without index.html
- Automatic index.html serving for directories
- MIME type detection for proper content serving
- Admin toolbar injection for HTML files in admin mode

### Environment Configuration
- `PROJECTS_DIR` environment variable (defaults to `./projects`)
- `PORT` environment variable (defaults to 47261)

## Development Tips

### Adding New Projects
1. Create directory in `projects/` following naming convention
2. Add HTML files and assets
3. Test via browser at `http://localhost:47261/{project_name}`
4. Use admin mode for editing: `http://localhost:47261/{project_name}/admin`

### Debugging Admin Features
- Check browser console for admin toolbar initialization messages
- Verify Qwen CLI installation: `qwen --version`
- Monitor server logs for API endpoint responses
- Admin button appears bottom-right when in admin mode

### Working with HTML Projects
- HTML files are served with admin toolbar injection in admin mode
- Original files are preserved; toolbar is injected at runtime
- Changes made via admin interface are written directly to HTML files
- Admin interface preserves CSS classes and styling during edits

### Error Handling
- 404 errors for missing projects or files
- 403 errors for path traversal attempts
- 500 errors logged with detailed error messages
- Admin edit failures return detailed error responses

## File Organization

- **Static assets** in project directories are served directly
- **Admin assets** served from `/admin-static/` route
- **Project metadata** can be stored as JSON files within projects
- **Image assets** typically stored in `images/` subdirectories within projects