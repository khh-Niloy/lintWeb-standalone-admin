import os
import mimetypes
import logging
import subprocess
import json
from pathlib import Path
from datetime import datetime
from flask import Flask, send_from_directory, request, jsonify, redirect

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
PROJECTS_DIR = Path(os.getenv("PROJECTS_DIR", BASE_DIR / "projects")).resolve()

app = Flask(__name__)



@app.route("/health")
def health():
    return jsonify({"status": "healthy"}), 200











# 🟢 git tag and git push +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


def get_next_version_tag():
    """Get the next version tag (v1, v2, v3, etc.)"""
    try:
        PROJECT_PATH = "projects/jbswebpage"
        result = subprocess.run(['git', 'tag', '--list'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if result.returncode != 0:
            return "v1"  # First tag
        
        tags = result.stdout.strip().split('\n') if result.stdout.strip() else []
        version_numbers = []
        
        for tag in tags:
            if tag.startswith('v') and tag[1:].isdigit():
                version_numbers.append(int(tag[1:]))
        
        if not version_numbers:
            return "v1"
        
        return f"v{max(version_numbers) + 1}"
    except Exception as e:
        logger.error(f"Error getting next version tag: {e}")
        return "v1"


def generate_smart_commit_message(project_path):
    """Generate smart commit message by analyzing git changes"""
    try:
        # Get staged changes
        result = subprocess.run(['git', 'diff', '--cached', '--name-only'], capture_output=True, text=True, timeout=10, cwd=project_path)
        if result.returncode != 0 or not result.stdout.strip():
            return "Update content"
        
        files = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
        
        # Categorize changes
        html_files = [f for f in files if f.endswith('.html')]
        
        # Generate message
        if len(html_files) == 1:
            filename = html_files[0].replace('.html', '').replace('index', 'homepage')
            return f"Update {filename}"
        elif len(html_files) > 1:
            return f"Update {len(html_files)} pages"
        elif files:
            return "Update assets"
        else:
            return "Update content"
            
    except Exception as e:
        logger.error(f"Error generating commit message: {e}")
        return "Update content"


# def commit_and_tag_changes(description: str):
#     """Commit changes and create version tag following git.txt instructions"""
#     try:
#         PROJECT_PATH = "projects/jbswebpage"
#         # Ensure we're on main branch
#         subprocess.run(['git', 'checkout', 'main'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        
#         # Stage all changes
#         result = subprocess.run(['git', 'add', '.'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
#         if result.returncode != 0:
#             logger.error(f"Git add failed: {result.stderr}")
#             return False, f"Git add failed: {result.stderr}"
        
#         # Get next version tag
#         next_tag = get_next_version_tag()
        
#         # Commit changes
#         commit_message = f"{description}"
#         result = subprocess.run(['git', 'commit', '-m', commit_message], capture_output=True, text=True, timeout=15, cwd=PROJECT_PATH)
#         if result.returncode != 0:
#             if "nothing to commit" in result.stdout:
#                 return True, "No changes to commit"
#             logger.error(f"Git commit failed: {result.stderr}")
#             return False, f"Git commit failed: {result.stderr}"
        
#         # Create version tag
#         result = subprocess.run(['git', 'tag', next_tag], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
#         if result.returncode != 0:
#             logger.error(f"Git tag failed: {result.stderr}")
#             return False, f"Git tag failed: {result.stderr}"
        
#         # Push to origin with tags
#         result = subprocess.run(['git', 'push', 'origin', 'main', '--tags'], capture_output=True, text=True, timeout=30, cwd=PROJECT_PATH)
#         if result.returncode != 0:
#             logger.warning(f"Git push failed: {result.stderr}")
#             # Continue even if push fails (might be network issue)
        
#         return True, f"Successfully committed and tagged as {next_tag}"
#     except Exception as e:
#         logger.error(f"Error in commit_and_tag_changes: {e}")
#         return False, f"Git operation failed: {str(e)}"


@app.route("/api/publish", methods=["POST"])
def publish_changes():
    """Commit and push all changes to GitHub with version tagging for rollbacks"""
    try:
        PROJECT_PATH = "projects/jbswebpage"
        
        # Check if there are any changes to commit
        status_result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if status_result.returncode != 0:
            logger.error(f"Git status failed: {status_result.stderr}")
            return jsonify({"success": False, "error": f"Git status failed: {status_result.stderr}"}), 500
        
        if not status_result.stdout.strip():
            logger.info("No changes to publish")
            return jsonify({"success": True, "message": "No changes to publish"})
        
        # Ensure we're on main branch
        subprocess.run(['git', 'checkout', 'main'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        
        # Stage all changes
        result = subprocess.run(['git', 'add', '.'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.error(f"Git add failed: {result.stderr}")
            return jsonify({"success": False, "error": f"Git add failed: {result.stderr}"}), 500
        
        # Get next version tag
        next_tag = get_next_version_tag()
        
        # Generate smart commit message by analyzing changes
        commit_message = generate_smart_commit_message(PROJECT_PATH)
        result = subprocess.run(['git', 'commit', '-m', commit_message], capture_output=True, text=True, timeout=15, cwd=PROJECT_PATH)
        if result.returncode != 0:
            if "nothing to commit" in result.stdout:
                return jsonify({"success": True, "message": "No changes to commit"})
            logger.error(f"Git commit failed: {result.stderr}")
            return jsonify({"success": False, "error": f"Git commit failed: {result.stderr}"}), 500
        
        # Create version tag
        result = subprocess.run(['git', 'tag', next_tag], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.error(f"Git tag failed: {result.stderr}")
            return jsonify({"success": False, "error": f"Git tag failed: {result.stderr}"}), 500
        
        # Push to origin with tags
        result = subprocess.run(['git', 'push', 'origin', 'main', '--tags'], capture_output=True, text=True, timeout=30, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.error(f"Git push failed: {result.stderr}")
            return jsonify({"success": False, "error": f"Push failed: {result.stderr}"}), 500
        
        return jsonify({"success": True, "message": f"Successfully published all changes to GitHub as {next_tag}"})
    except Exception as e:
        logger.exception("publish_changes error")
        return jsonify({"success": False, "error": f"Publish failed: {str(e)}"}), 500


# 🟢 git tag and git push +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++












# 🟡 git version history +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



def get_version_history():
    """Get list of version tags with commit info, including initial state option"""
    try:
        PROJECT_PATH = "projects/jbswebpage"
        # Get all tags
        result = subprocess.run(['git', 'tag', '--list'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if result.returncode != 0:
            return []
        
        tags = result.stdout.strip().split('\n') if result.stdout.strip() else []
        version_tags = [tag for tag in tags if tag.startswith('v') and tag[1:].isdigit()]
        version_tags.sort(key=lambda x: int(x[1:]), reverse=True)  # Sort by version number, newest first
        
        history = []
        
        # Add "Initial State" option if there are any version tags
        if version_tags:
            # Get the commit before the first version tag (v1)
            first_tag = sorted(version_tags, key=lambda x: int(x[1:]))[0]  # Get v1, v2, etc. in ascending order
            try:
                # Get the commit before the first tag
                result = subprocess.run([
                    'git', 'log', '--format=%H|%s|%ai', f'{first_tag}^1', '-1'
                ], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
                
                if result.returncode == 0 and result.stdout.strip():
                    commit_hash, message, date = result.stdout.strip().split('|', 2)
                    history.append({
                        'tag': 'initial',
                        'message': 'Initial State (before any versions)',
                        'date': date,
                        'hash': commit_hash[:8]
                    })
            except Exception as e:
                logger.warning(f"Could not get initial state commit: {e}")
        
        # Add all version tags
        for tag in version_tags:
            # Get commit info for tag
            result = subprocess.run([
                'git', 'log', '--format=%H|%s|%ai', '-1', tag
            ], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
            
            if result.returncode == 0 and result.stdout.strip():
                commit_hash, message, date = result.stdout.strip().split('|', 2)
                history.append({
                    'tag': tag,
                    'message': message,
                    'date': date,
                    'hash': commit_hash[:8]
                })
        
        return history
    except Exception as e:
        logger.error(f"Error getting version history: {e}")
        return []


@app.route("/api/version-history", methods=["GET"])
def version_history():
    """Get version history for the admin UI"""
    try:
        history = get_version_history()
        return jsonify({"success": True, "history": history})
    except Exception as e:
        logger.exception("version_history error")
        return jsonify({"success": False, "error": f"Failed to get version history: {str(e)}"}), 500




# 🟡 git version history +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++











# 🔵 git rollback +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++




def rollback_to_version(tag: str):
    """Rollback to specific version tag or initial state following git.txt instructions"""
    try:
        PROJECT_PATH = "projects/jbswebpage"
        # Ensure we're on main branch
        subprocess.run(['git', 'checkout', 'main'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        
        if tag == 'initial':
            # Special handling for initial state - rollback to commit before first version tag
            # Get the first version tag
            result = subprocess.run(['git', 'tag', '--list'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
            if result.returncode != 0:
                return False, "Could not get tag list"
            
            tags = result.stdout.strip().split('\n') if result.stdout.strip() else []
            version_tags = [tag for tag in tags if tag.startswith('v') and tag[1:].isdigit()]
            
            if not version_tags:
                return False, "No version tags found"
            
            # Get the first tag (v1)
            first_tag = sorted(version_tags, key=lambda x: int(x[1:]))[0]
            
            # Reset to commit before first tag
            result = subprocess.run(['git', 'reset', '--hard', f'{first_tag}^1'], capture_output=True, text=True, timeout=15, cwd=PROJECT_PATH)
            if result.returncode != 0:
                logger.error(f"Git reset to initial state failed: {result.stderr}")
                return False, f"Git reset to initial state failed: {result.stderr}"
            
            rollback_message = "Successfully rolled back to initial state (before any versions)"
        else:
            # Verify tag exists
            result = subprocess.run(['git', 'tag', '--list', tag], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
            if result.returncode != 0 or not result.stdout.strip():
                return False, f"Tag {tag} not found"
            
            # Reset branch to desired version tag
            result = subprocess.run(['git', 'reset', '--hard', tag], capture_output=True, text=True, timeout=15, cwd=PROJECT_PATH)
            if result.returncode != 0:
                logger.error(f"Git reset failed: {result.stderr}")
                return False, f"Git reset failed: {result.stderr}"
            
            rollback_message = f"Successfully rolled back to {tag}"
        
        # Force push to origin
        result = subprocess.run(['git', 'push', 'origin', 'main', '--force'], capture_output=True, text=True, timeout=30, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.warning(f"Git push failed: {result.stderr}")
            # Continue even if push fails
        
        return True, rollback_message
    except Exception as e:
        logger.error(f"Error in rollback_to_version: {e}")
        return False, f"Rollback failed: {str(e)}"



@app.route("/api/rollback", methods=["POST"])
def rollback():
    """Rollback to a specific version tag"""
    try:
        data = request.get_json(force=True, silent=True) or {}
        tag = data.get("tag", "").strip()

        print("✅ Rollback data:", data)


        
        if not tag:
            return jsonify({"success": False, "error": "Missing tag parameter"}), 400
        
        if tag != 'initial' and (not tag.startswith('v') or not tag[1:].isdigit()):
            return jsonify({"success": False, "error": "Invalid tag format. Expected format: v1, v2, v3, etc. or 'initial'"}), 400
        
        rollback_success, rollback_message = rollback_to_version(tag)
        
        return jsonify({
            "success": rollback_success,
            "message": rollback_message,
            "rolledback_to": tag if rollback_success else None
        })
        
    except Exception as e:
        logger.exception("rollback error")
        return jsonify({"success": False, "error": f"Rollback failed: {str(e)}"}), 500




# 🔵 git rollback +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++














def safe_join_projects(path_fragment: str) -> Path:
    candidate = (PROJECTS_DIR / path_fragment).resolve()
    if PROJECTS_DIR not in candidate.parents and candidate != PROJECTS_DIR:
        raise PermissionError("Blocked path traversal")
    return candidate









# 🔵 git direct text edit - manual editing +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++




@app.route("/api/direct-text-edit", methods=["POST"])
def direct_text_edit():
    try:
        data = request.get_json(force=True, silent=True) or {}
        url = data.get("url", "")
        element_selector = data.get("elementSelector", "")
        new_text = data.get("newText", "")
        original_text = data.get("originalText", "")

        if not (url and element_selector and new_text):
            return jsonify({"success": False, "error": "Missing url, elementSelector, newText"}), 400

        parts = url.strip("/").split("/")
        logger.info(f"Direct text edit - URL: {url}, Parts: {parts}")
        
        # Handle both formats: /user_xxx/project and /project
        if len(parts) >= 2 and parts[0].startswith("user_"):
            # Format: /user_xxx/project_name
            user_dir = parts[0]
            project_dir = parts[1]
            project_path = safe_join_projects(f"{user_dir}/{project_dir}")
            logger.info(f"Using user format - Path: {project_path}")
        elif len(parts) >= 1 and parts[0]:  # Check if first part is not empty
            # Format: /project_name (direct project)
            project_dir = parts[0]
            project_path = safe_join_projects(project_dir)
            logger.info(f"Using direct format - Path: {project_path}")
        else:
            logger.error(f"Cannot parse URL: {url}, parts: {parts}")
            return jsonify({"success": False, "error": "Cannot determine project path from URL"}), 400

        if parts[-1].endswith(".html"):
            html_file_path = project_path / parts[-1]
        else:
            html_file_path = project_path / "index.html"

        if not html_file_path.exists():
            return jsonify({"success": False, "error": f"HTML file not found: {html_file_path}"}), 404

        html = html_file_path.read_text(encoding="utf-8")

        if original_text and original_text in html:
            updated = html.replace(original_text, new_text)
        else:
            updated = html
            if original_text:
                import re
                escaped = re.escape(original_text.strip())
                pattern = re.sub(r"\\\s+", r"\\s+", escaped)
                m = re.search(pattern, html, re.IGNORECASE | re.MULTILINE)
                if m:
                    updated = html.replace(m.group(0), new_text)
                else:
                    return jsonify({"success": False, "error": "Original text not found"}), 404
            else:
                return jsonify({"success": False, "error": "originalText required for replacement"}), 400

        html_file_path.write_text(updated, encoding="utf-8")
        
        # Note: Changes are saved to file but not committed to git
        # User will use "Save Changes" button to commit and push all edits at once
        
        response = {
            "success": True, 
            "message": f"Updated {html_file_path.name}", 
            "file_path": str(html_file_path),
            "git_status": False,
            "git_message": "Changes saved locally (not committed)"
        }
        
        return jsonify(response)

    except Exception as e:
        logger.exception("direct_text_edit error")
        return jsonify({"success": False, "error": f"Internal error: {e}"}), 500


@app.route("/api/undo", methods=["POST"])
def undo_changes():
    """Undo all uncommitted changes by resetting to HEAD"""
    try:
        PROJECT_PATH = "projects/jbswebpage"
        
        # Check if there are any changes to undo
        status_result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if status_result.returncode != 0:
            logger.error(f"Git status failed: {status_result.stderr}")
            return jsonify({"success": False, "error": f"Git status failed: {status_result.stderr}"}), 500
        
        if not status_result.stdout.strip():
            logger.info("No changes to undo")
            return jsonify({"success": True, "message": "No changes to undo"})
        
        # Reset all changes to HEAD (undo all uncommitted changes)
        result = subprocess.run(['git', 'checkout', '--', '.'], capture_output=True, text=True, timeout=15, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.error(f"Git checkout failed: {result.stderr}")
            return jsonify({"success": False, "error": f"Undo failed: {result.stderr}"}), 500
        
        # Also remove any untracked files that might have been created
        result = subprocess.run(['git', 'clean', '-fd'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.warning(f"Git clean failed: {result.stderr}")
            # Continue even if clean fails - checkout is the main operation
        
        return jsonify({"success": True, "message": "Successfully undid all uncommitted changes"})
    except Exception as e:
        logger.exception("undo_changes error")
        return jsonify({"success": False, "error": f"Undo failed: {str(e)}"}), 500


@app.route("/api/get-file-content", methods=["GET"])
def get_file_content():
    """Get current file content for preview after AI edit"""
    try:
        url = request.args.get('url')
        if not url:
            return jsonify({"success": False, "error": "URL parameter required"}), 400
        
        # Determine project path from URL
        PROJECT_PATH = "projects/jbswebpage"
        
        # Parse URL to get file path
        if url.startswith('/'):
            url = url[1:]  # Remove leading slash
        
        if not url or url == '':
            file_path = os.path.join(PROJECT_PATH, 'index.html')
        else:
            file_path = os.path.join(PROJECT_PATH, url)
            if os.path.isdir(file_path):
                file_path = os.path.join(file_path, 'index.html')
            elif not file_path.endswith('.html'):
                file_path += '.html'
        
        # Security check
        file_path = os.path.abspath(file_path)
        project_abs = os.path.abspath(PROJECT_PATH)
        if not file_path.startswith(project_abs):
            return jsonify({"success": False, "error": "Access denied"}), 403
        
        # Read file content
        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": f"File not found: {file_path}"}), 404
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return jsonify({
            "success": True, 
            "content": content,
            "file_path": file_path,
            "url": url
        })
        
    except Exception as e:
        logger.exception("get_file_content error")
        return jsonify({"success": False, "error": f"Failed to read file: {str(e)}"}), 500


# 🔵 git direct text edit - manual editing +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++















# 🟢 git admin edit - AI editing +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++






# def generate_qwen_suggestions_prompt(elements, user_request, batch_mode=False):
#     """Generate prompt for Qwen to provide text suggestions without file editing"""
    
#     # Format selected elements with their current text
#     element_details = []
#     for i, el in enumerate(elements):
#         element_details.append(f"""
# Element {i+1}:
# - Tag: <{el.get('tag', 'unknown')}>
# - ID: {el.get('id', 'none')} 
# - Classes: {el.get('classes', 'none')}
# - Current Text: "{el.get('text', '')}"
# """)
    
#     elements_context = "\n".join(element_details)
    
#     batch_instruction = ""
#     if batch_mode and len(elements) > 1:
#         batch_instruction = f"""
# BATCH MODE: Provide suggestions for all {len(elements)} elements. Apply the user's request consistently to ALL selected elements.
# """
    
#     return f"""You are an AI assistant that provides text suggestions for HTML elements. The user has selected specific elements and wants to modify their text content.

# USER REQUEST: {user_request}

# SELECTED ELEMENTS:
# {elements_context}

# {batch_instruction}

# INSTRUCTIONS:
# 1. Analyze the user's request and provide NEW TEXT suggestions for each element
# 2. DO NOT edit files or make changes - only provide suggestions
# 3. Return ONLY valid JSON in this exact format:

# {{
#   "status": "success",
#   "suggestions": [
#     {{
#       "element_index": 0,
#       "tag": "div",
#       "id": "element-id",
#       "classes": "class1 class2",
#       "original_text": "current text",
#       "suggested_text": "new suggested text"
#     }}
#   ]
# }}

# IMPORTANT: 
# - Preserve existing CSS classes and styling
# - Only modify the text content as requested
# - Provide natural, contextually appropriate suggestions
# - Return valid JSON only - no explanations or additional text
# """

def generate_qwen_selective_prompt(elements, user_request, target_file, project_path, batch_mode=False):
    """Generate prompt for Qwen to return element-specific content updates only"""
    
    # Format selected elements with detailed context
    element_details = []
    for i, el in enumerate(elements):
        element_details.append(f"""
Element {i+1}:
- Tag: <{el.get('tag', 'unknown')}>
- ID: {el.get('id', 'none')} 
- Classes: {el.get('classes', 'none')}
- Current Content: "{el.get('text', '')[:200]}..."
- Attributes: {el.get('attributes', {})}""")
    
    elements_context = "\n".join(element_details)
    
    batch_instruction = ""
    if batch_mode and len(elements) > 1:
        batch_instruction = f"""
BATCH MODE: Apply the user's request consistently to ALL {len(elements)} selected elements. Generate updated content for each element.
"""
    
    return f"""You are an AI assistant that generates element-specific HTML content updates for preview.

WORKING DIRECTORY: {project_path}
TARGET FILE PATH: {target_file}

SELECTED ELEMENTS FOR EDITING:
{elements_context}

USER REQUEST: {user_request}
{batch_instruction}

INSTRUCTIONS:
1. Read the current {target_file} to understand context around these elements
2. Generate ONLY the inner HTML content for each selected element based on the user's request
3. PRESERVE existing CSS classes, IDs, and styling attributes
4. DO NOT return full HTML documents - only the content that goes INSIDE each element
5. Match existing design patterns and styling from the original file

IMPORTANT: You MUST respond with valid JSON in EXACTLY this format:
{{
  "status": "success",
  "message": "Description of changes made",
  "element_updates": [
    {{
      "element_index": 0,
      "new_content": "Updated inner HTML content for element 0",
      "summary": "Brief description of what changed for this element"
    }},
    {{
      "element_index": 1, 
      "new_content": "Updated inner HTML content for element 1",
      "summary": "Brief description of what changed for this element"
    }}
  ],
  "changes_summary": "Overall summary of all changes"
}}

CRITICAL REQUIREMENTS:
- Return ONLY the inner HTML content for each element, NOT full HTML documents
- Preserve all CSS classes and styling attributes
- Return ONLY valid JSON - no explanations, no code blocks
- Generate content for ALL selected elements (indices 0 to {len(elements)-1})
- If you cannot access the file, return {{"status": "error", "message": "File access failed"}}

Generate the element-specific updates now."""









@app.route("/api/admin-edit", methods=["POST"])
def admin_edit():
    try:
        data = request.get_json(force=True, silent=True) or {}
        prompt = data.get("prompt", "").strip()
        elements = data.get("elements", [])
        url = data.get("url", "")
        batch_mode = data.get("batchMode", False)
        
        logger.info(f"Received admin-edit request: prompt={prompt[:50]}..., elements={len(elements)}, url={url}, batch_mode={batch_mode}")
        
        if not prompt or not elements or not url:
            return jsonify({"success": False, "error": "Missing prompt, elements, or url"}), 400
        
        # Parse project path from URL
        parts = url.strip("/").split("/")
        if len(parts) < 1:
            return jsonify({"success": False, "error": "Cannot determine project path from URL"}), 400
        
        if parts[0].startswith("user_") and len(parts) >= 2:
            # Legacy format: /user_xxx/project_name
            user_dir = parts[0]
            project_dir = parts[1]
            project_path = safe_join_projects(f"{user_dir}/{project_dir}")
        else:
            # New format: /project_name
            project_dir = parts[0]
            project_path = safe_join_projects(project_dir)
        
        # Determine target HTML file
        if parts[-1].endswith(".html"):
            target_file = parts[-1]
        else:
            target_file = "index.html"
        
        html_file_path = project_path / target_file
        if not html_file_path.exists():
            return jsonify({"success": False, "error": f"HTML file not found: {target_file}"}), 404
        
        # Read original content before Qwen processing
        original_content = html_file_path.read_text(encoding="utf-8")
        
        # Generate selective element prompt for Qwen Code CLI
        qwen_prompt = generate_qwen_selective_prompt(elements, prompt, target_file, str(project_path), batch_mode)
        
        # Log the prompt for debugging
        logger.info(f"Sending prompt to Qwen: {qwen_prompt[:200]}...")
        
        # Check if Qwen CLI is available
        import shutil
        if not shutil.which("qwen"):
            logger.error("Qwen CLI not found in PATH")
            return jsonify({"success": False, "error": "Qwen CLI not found. Please install Qwen CLI and ensure it's in your PATH."}), 500
        
        # Execute AI editing with subprocess timeout
        import subprocess
        import json as json_lib
        
        logger.info(f"Executing Qwen CLI with cwd: {project_path}")
        logger.info(f"Target file exists: {html_file_path.exists()}")
        logger.info(f"Target file readable: {os.access(html_file_path, os.R_OK)}")
        logger.info(f"Prompt length: {len(qwen_prompt)} characters")
        
        try:
            # Get current environment and ensure PATH is available
            env = os.environ.copy()
            env['PWD'] = str(project_path)
            
            result = subprocess.run([
                "qwen", "-m", "qwen-turbo", "-p", "-y"
            ], 
            input=qwen_prompt, 
            cwd=str(project_path), 
            env=env,
            capture_output=True, 
            text=True, 
            timeout=180)
        except subprocess.TimeoutExpired:
            logger.error("Qwen CLI timeout")
            return jsonify({"success": False, "error": "AI processing timeout"}), 500
        except Exception as e:
            logger.exception("Qwen CLI execution error")
            return jsonify({"success": False, "error": f"AI processing failed: {str(e)}"}), 500
        
        logger.info(f"Qwen CLI result: returncode={result.returncode}, stdout={result.stdout[:200]}..., stderr={result.stderr[:200]}...")
        
        if result.returncode == 0:
            try:
                # Try to parse JSON response
                response_data = json_lib.loads(result.stdout)
                if response_data.get("status") == "success":
                    # Return element-specific updates - no file saving yet
                    response = {
                        "success": True, 
                        "message": response_data.get("message", "AI preview generated successfully"),
                        "element_updates": response_data.get("element_updates", []),
                        "changes_summary": response_data.get("changes_summary", ""),
                        "qwen_response": response_data,
                        "is_selective_preview": True,
                        "target_file": target_file,
                        "project_path": str(project_path)
                    }
                    
                    return jsonify(response)
                else:
                    return jsonify({
                        "success": False, 
                        "error": response_data.get("message", "AI processing failed"),
                        "qwen_response": response_data
                    }), 500
            except json_lib.JSONDecodeError:
                # Fallback for non-JSON response - try to extract content manually
                logger.warning("Qwen returned non-JSON response, attempting to parse manually")
                
                # Try to find HTML content in the response
                qwen_output = result.stdout
                
                # Check if file was modified first
                try:
                    current_content = html_file_path.read_text(encoding="utf-8")
                    
                    if current_content != original_content:
                        # Qwen modified the file despite preview instructions
                        # Use the modified content as preview and restore original
                        modified_content = current_content
                        
                        # Restore original content since this should be preview-only
                        html_file_path.write_text(original_content, encoding="utf-8")
                        logger.info("Restored original file content after unauthorized modification")
                        
                        response = {
                            "success": True,
                            "message": "AI preview generated (file modification detected)",
                            "preview_content": modified_content,
                            "changes_summary": "AI generated changes. File was modified but restored for preview.",
                            "is_preview": True,
                            "target_file": target_file,
                            "project_path": str(project_path)
                        }
                        
                        return jsonify(response)
                        
                except Exception as e:
                    logger.error(f"Failed to check file modifications: {e}")
                
                # Try to extract HTML content from the non-JSON response
                try:
                    # Look for HTML content patterns in the response
                    import re
                    
                    # Try to find complete HTML document in response
                    html_pattern = r'<!DOCTYPE html>.*?</html>'
                    html_match = re.search(html_pattern, qwen_output, re.DOTALL | re.IGNORECASE)
                    
                    if html_match:
                        modified_content = html_match.group(0)
                        
                        logger.info(f"Extracted HTML content (first 200 chars): {modified_content[:200]}...")
                        logger.info(f"Original vs Modified content differ: {modified_content != original_content}")
                        
                        response = {
                            "success": True,
                            "message": "AI preview generated (content extracted from response)",
                            "preview_content": modified_content,
                            "changes_summary": "AI generated changes. Content extracted from non-JSON response.",
                            "is_preview": True,
                            "target_file": target_file,
                            "project_path": str(project_path)
                        }
                        
                        return jsonify(response)
                    
                    # If no complete HTML found, return error with output for debugging
                    response = {
                        "success": False,
                        "error": "AI did not return valid JSON format and no HTML content could be extracted", 
                        "qwen_output": qwen_output[:1000],  # Show more output for debugging
                        "debug_info": "Please check Qwen CLI response format"
                    }
                    
                    return jsonify(response), 500
                    
                except Exception as e:
                    logger.error(f"Failed to extract HTML content: {e}")
                    response = {
                        "success": False,
                        "error": f"AI processing error: {str(e)}", 
                        "qwen_output": qwen_output[:500]
                    }
                    
                    return jsonify(response), 500
        else:
            logger.error(f"Qwen CLI error: {result.stderr}")
            # Provide more detailed error information
            error_msg = result.stderr[:500] if result.stderr else "Unknown error occurred"
            return jsonify({
                "success": False, 
                "error": f"AI processing failed: {error_msg}",
                "qwen_error": result.stderr[:1000]  # Include more detailed error info
            }), 500
            
    except Exception as e:
        logger.exception("admin_edit error")
        return jsonify({"success": False, "error": f"Internal error: {str(e)[:200]}"}), 500


@app.route("/api/save-ai-changes", methods=["POST"])
def save_ai_changes():
    """Save AI-generated element changes to file after user approves preview"""
    try:
        data = request.get_json(force=True, silent=True) or {}
        element_updates = data.get("element_updates", [])
        target_file = data.get("target_file", "")
        project_path_str = data.get("project_path", "")
        elements = data.get("elements", [])  # Original element info with selectors
        
        if not element_updates or not target_file or not project_path_str or not elements:
            return jsonify({"success": False, "error": "Missing element_updates, target_file, project_path, or elements"}), 400
        
        # Validate project path
        try:
            project_path = Path(project_path_str)
            html_file_path = project_path / target_file
            
            # Security check - ensure path is within projects directory
            if not str(project_path).startswith(str(PROJECTS_DIR)):
                return jsonify({"success": False, "error": "Invalid project path"}), 403
            
            if not html_file_path.exists():
                return jsonify({"success": False, "error": f"HTML file not found: {target_file}"}), 404
            
        except Exception as e:
            return jsonify({"success": False, "error": f"Invalid path: {str(e)}"}), 400
        
        # Read current file content
        current_content = html_file_path.read_text(encoding="utf-8")
        
        # Apply element-specific updates using simple string replacement
        updated_content = current_content
        
        try:
            # Apply each element update
            for update in element_updates:
                element_index = update.get("element_index")
                new_content = update.get("new_content", "")
                
                if element_index is None or element_index >= len(elements):
                    continue
                
                # Get element info
                element_info = elements[element_index]
                original_text = element_info.get('text', '').strip()
                
                # Simple approach: Replace the original text content with new content
                if original_text and original_text in updated_content:
                    # Find and replace the original text
                    updated_content = updated_content.replace(original_text, new_content, 1)
                    logger.info(f"Updated element {element_index} by replacing text")
                else:
                    # Fallback: Try to find by pattern matching
                    import re
                    escaped_text = re.escape(original_text)
                    pattern = re.sub(r"\\\s+", r"\\s+", escaped_text)
                    match = re.search(pattern, updated_content, re.IGNORECASE | re.MULTILINE)
                    
                    if match:
                        updated_content = updated_content.replace(match.group(0), new_content, 1)
                        logger.info(f"Updated element {element_index} by pattern matching")
                    else:
                        logger.warning(f"Could not find original content to replace for element {element_index}")
            
            # Save the updated HTML
            html_file_path.write_text(updated_content, encoding="utf-8")
            
            logger.info(f"AI element changes saved to {html_file_path}")
            
            response = {
                "success": True, 
                "message": f"AI changes saved to {target_file}", 
                "file_path": str(html_file_path),
                "updates_applied": len(element_updates),
                "git_status": False,
                "git_message": "AI changes saved locally (not committed)"
            }
            
            return jsonify(response)
            
        except Exception as e:
            logger.error(f"Error applying element updates: {e}")
            return jsonify({"success": False, "error": f"Failed to apply updates: {str(e)}"}), 500

    except Exception as e:
        logger.exception("save_ai_changes error")
        return jsonify({"success": False, "error": f"Failed to save AI changes: {str(e)}"}), 500











# 🟢 git admin edit - AI editing +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++














@app.route("/admin-static/<path:filename>")
def admin_static(filename):
    admin_static_dir = BASE_DIR / "admin" / "toolbar"
    if not admin_static_dir.exists():
        return "Admin static directory not found", 404
    return send_from_directory(str(admin_static_dir), filename)



def load_admin_template() -> str:
    template_path = BASE_DIR / "admin" / "templates" / "admin-inject.html"
    try:
        return template_path.read_text(encoding="utf-8")
    except Exception as e:
        logger.warning(f"Admin template not found or failed to read: {e}")
        return ""


# Load template dynamically in development mode instead of caching
ADMIN_INJECT = load_admin_template() if not app.debug else ""


def is_admin_route(path: str) -> bool:
    if not path:
        return False
    p = path.lower()
    return "/admin" in p or "admin=true" in p


def inject_admin_toolbar(html_content: str, admin: bool) -> str:
    if not admin:
        return html_content
    
    # Load template dynamically in debug mode for hot reloading
    admin_inject = ADMIN_INJECT if not app.debug else load_admin_template()
    
    if not admin_inject:
        return html_content
    if "Admin Toolbar Injection Template" in html_content:
        return html_content
    if "</body>" in html_content:
        return html_content.replace("</body>", f"{admin_inject}</body>")
    if "</html>" in html_content:
        return html_content.replace("</html>", f"{admin_inject}</html>")
    return html_content + admin_inject





@app.route("/", defaults={"filename": ""})
@app.route("/<path:filename>")
def serve_any(filename: str):
    try:
        admin = is_admin_route(request.path) or is_admin_route(request.url)
        actual_filename = filename
        
        # Handle admin routes
        if "/admin/" in filename:
            actual_filename = filename.replace("/admin/", "/")
            admin = True
        elif filename.endswith("/admin"):
            actual_filename = filename[:-len("/admin")]
            admin = True
        
        # Handle case like "/jbswebpage/index.html/admin" 
        # This should redirect to "/jbswebpage/admin"
        if ".html/admin" in filename:
            # Extract project path before .html
            project_part = filename.split(".html/admin")[0]
            if "/" in project_part:
                project_name = project_part.split("/")[0]
                return redirect(f"/{project_name}/admin", 302)
            else:
                return redirect(f"/{project_part}/admin", 302)
        
        # Handle case like "/jbswebpage/index.html/about.html"
        # This should redirect to "/jbswebpage/about.html"
        if ".html/" in filename and not filename.endswith("/admin"):
            # Extract the part after .html/
            parts = filename.split(".html/", 1)
            if len(parts) == 2:
                project_part = parts[0].split("/")[0] if "/" in parts[0] else parts[0]
                target_file = parts[1]
                return redirect(f"/{project_part}/{target_file}", 302)

        file_path = safe_join_projects(actual_filename)

        if file_path.exists() and file_path.is_file():
            if file_path.suffix.lower() == ".html" and admin:
                html = file_path.read_text(encoding="utf-8")
                return inject_admin_toolbar(html, admin), 200, {"Content-Type": "text/html; charset=utf-8"}
            mime, _ = mimetypes.guess_type(str(file_path))
            return send_from_directory(str(file_path.parent), file_path.name, mimetype=mime or "application/octet-stream")

        if file_path.exists() and file_path.is_dir():
            index_file = file_path / "index.html"
            if index_file.exists():
                if admin:
                    html = index_file.read_text(encoding="utf-8")
                    return inject_admin_toolbar(html, admin), 200, {"Content-Type": "text/html; charset=utf-8"}
                return send_from_directory(str(file_path), "index.html", mimetype="text/html; charset=utf-8")

            entries = []
            for p in sorted(file_path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
                try:
                    size = "-" if p.is_dir() else f"{p.stat().st_size} bytes"
                    mtime = datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d %H:%M")
                except Exception:
                    size, mtime = "-", "-"
                entries.append((p.name, p.is_dir(), size, mtime))

            rows = "\n".join(
                f'<tr><td><a href="{name}{"/" if is_dir else ""}">{name}{"/" if is_dir else ""}</a></td>'
                f"<td>{size}</td><td>{mtime}</td></tr>"
                for name, is_dir, size, mtime in entries
            )
            html = f"""<!doctype html><html><head><meta charset="utf-8"><title>{actual_filename}</title>
<style>body{{font-family:system-ui,Arial}}table{{width:100%;border-collapse:collapse}}td,th{{padding:8px;border-bottom:1px solid #eee}}</style>
</head><body><h1>{actual_filename}</h1>
<table><thead><tr><th>Name</th><th>Size</th><th>Modified</th></tr></thead><tbody>
<tr><td><a href="../">../</a></td><td>-</td><td>-</td></tr>
{rows}
</tbody></table><p><a href="/">← Back to Projects</a></p></body></html>"""
            return html, 200, {"Content-Type": "text/html; charset=utf-8"}

        return "Not found", 404
    except PermissionError:
        return "Forbidden", 403
    except Exception as e:
        logger.exception("serve_any error")
        return f"Internal server error: {e}", 500



if __name__ == "__main__":
    port = int(os.getenv("PORT", "47261"))
    print(f"Serving projects from: {PROJECTS_DIR}")
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
