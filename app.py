import os
import mimetypes
import logging
import subprocess
import json
from pathlib import Path
from datetime import datetime
from flask import Flask, send_from_directory, request, jsonify

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


def commit_and_tag_changes(description: str):
    """Commit changes and create version tag following git.txt instructions"""
    try:
        PROJECT_PATH = "projects/jbswebpage"
        # Ensure we're on git-integration branch
        subprocess.run(['git', 'checkout', 'git-integration'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        
        # Stage all changes
        result = subprocess.run(['git', 'add', '.'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.error(f"Git add failed: {result.stderr}")
            return False, f"Git add failed: {result.stderr}"
        
        # Get next version tag
        next_tag = get_next_version_tag()
        
        # Commit changes
        commit_message = f"{description}"
        result = subprocess.run(['git', 'commit', '-m', commit_message], capture_output=True, text=True, timeout=15, cwd=PROJECT_PATH)
        if result.returncode != 0:
            if "nothing to commit" in result.stdout:
                return True, "No changes to commit"
            logger.error(f"Git commit failed: {result.stderr}")
            return False, f"Git commit failed: {result.stderr}"
        
        # Create version tag
        result = subprocess.run(['git', 'tag', next_tag], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.error(f"Git tag failed: {result.stderr}")
            return False, f"Git tag failed: {result.stderr}"
        
        # Push to origin with tags
        result = subprocess.run(['git', 'push', 'origin', 'git-integration', '--tags'], capture_output=True, text=True, timeout=30, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.warning(f"Git push failed: {result.stderr}")
            # Continue even if push fails (might be network issue)
        
        return True, f"Successfully committed and tagged as {next_tag}"
    except Exception as e:
        logger.error(f"Error in commit_and_tag_changes: {e}")
        return False, f"Git operation failed: {str(e)}"



# 🟢 git tag and git push +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++












# 🟡 git version history +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



def get_version_history():
    """Get list of version tags with commit info"""
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
    """Rollback to specific version tag following git.txt instructions"""
    try:
        PROJECT_PATH = "projects/jbswebpage"
        # Ensure we're on git-integration branch
        subprocess.run(['git', 'checkout', 'git-integration'], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        
        # Verify tag exists
        result = subprocess.run(['git', 'tag', '--list', tag], capture_output=True, text=True, timeout=10, cwd=PROJECT_PATH)
        if result.returncode != 0 or not result.stdout.strip():
            return False, f"Tag {tag} not found"
        
        # Reset branch to desired version tag
        result = subprocess.run(['git', 'reset', '--hard', tag], capture_output=True, text=True, timeout=15, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.error(f"Git reset failed: {result.stderr}")
            return False, f"Git reset failed: {result.stderr}"
        
        # Force push to origin
        result = subprocess.run(['git', 'push', 'origin', 'git-integration', '--force'], capture_output=True, text=True, timeout=30, cwd=PROJECT_PATH)
        if result.returncode != 0:
            logger.warning(f"Git push failed: {result.stderr}")
            # Continue even if push fails
        
        return True, f"Successfully rolled back to {tag}"
    except Exception as e:
        logger.error(f"Error in rollback_to_version: {e}")
        return False, f"Rollback failed: {str(e)}"



@app.route("/api/rollback", methods=["POST"])
def rollback():
    """Rollback to a specific version tag"""
    try:
        data = request.get_json(force=True, silent=True) or {}
        tag = data.get("tag", "").strip()
        
        if not tag:
            return jsonify({"success": False, "error": "Missing tag parameter"}), 400
        
        if not tag.startswith('v') or not tag[1:].isdigit():
            return jsonify({"success": False, "error": "Invalid tag format. Expected format: v1, v2, v3, etc."}), 400
        
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
        if len(parts) < 2 or not parts[0].startswith("user_"):
            return jsonify({"success": False, "error": "Cannot determine project path from URL"}), 400

        user_dir = parts[0]
        project_dir = parts[1]
        project_path = safe_join_projects(f"{user_dir}/{project_dir}")

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
        
        # Commit and tag changes
        git_success, git_message = commit_and_tag_changes(f"Direct text edit in {html_file_path.name}")
        
        response = {
            "success": True, 
            "message": f"Updated {html_file_path.name}", 
            "file_path": str(html_file_path),
            "git_status": git_success,
            "git_message": git_message
        }
        
        return jsonify(response)

    except Exception as e:
        logger.exception("direct_text_edit error")
        return jsonify({"success": False, "error": f"Internal error: {e}"}), 500



# 🔵 git direct text edit - manual editing +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++















# 🟢 git admin edit - AI editing +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++






def generate_qwen_edit_prompt(elements, user_request, target_file, batch_mode=False):
    """Generate optimized prompt for Qwen Code CLI with batch editing support"""
    
    # Format selected elements with detailed context
    element_details = []
    for i, el in enumerate(elements):
        element_details.append(f"""
Element {i+1}:
- Tag: <{el.get('tag', 'unknown')}>
- ID: {el.get('id', 'none')}
- Classes: {el.get('classes', 'none')}
- Current Text: "{el.get('text', '')[:100]}..."
- Attributes: {el.get('attributes', {})}""")
    
    elements_context = "\n".join(element_details)
    
    batch_instruction = ""
    if batch_mode and len(elements) > 1:
        batch_instruction = f"""
BATCH MODE: You are editing {len(elements)} elements simultaneously. Apply the user's request consistently to ALL selected elements. Make similar changes to each element while respecting their individual context and content.
"""
    
    return f"""You are an AI assistant specialized in editing HTML files. The user has selected specific elements in a webpage and wants to make changes to them.

TARGET FILE: {target_file}

SELECTED ELEMENTS FOR EDITING:
{elements_context}

USER REQUEST: {user_request}
{batch_instruction}
INSTRUCTIONS:
1. Read the current {target_file} file to understand the full context
2. Modify only the selected elements or their children according to the user's request
3. PRESERVE all existing CSS classes, IDs, and styling attributes unless changes require styling modifications
4. When adding new elements, match existing design patterns and styling
5. For batch operations, apply changes consistently across all selected elements
6. Save the modified content back to {target_file}
7. Respond in valid JSON format with the following structure:
   {{
     "status": "success" or "error",
     "message": "Description of what was done or what went wrong",
     "details": "Any additional information"
   }}

CRITICAL: Make intelligent changes that fulfill the user's request. If they want shape changes, modify the appropriate CSS classes. If they want new content, add it in the right location.

Please read the file, make the requested changes, and save it back. Respond ONLY in valid JSON format as specified above. You are using the qwen-turbo model, which is optimized for speed and efficiency."""









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
        
        # Generate optimized prompt for Qwen Code CLI with batch editing support
        qwen_prompt = generate_qwen_edit_prompt(elements, prompt, target_file, batch_mode)
        
        # Log the prompt for debugging
        logger.info(f"Sending prompt to Qwen: {qwen_prompt[:200]}...")
        
        # Check if Qwen CLI is available
        import shutil
        if not shutil.which("qwen"):
            logger.error("Qwen CLI not found in PATH")
            return jsonify({"success": False, "error": "Qwen CLI not found. Please install Qwen CLI and ensure it's in your PATH."}), 500
        
        # Execute Qwen Code CLI with optimized parameters
        import subprocess
        import json as json_lib
        
        logger.info(f"Executing Qwen CLI with cwd: {project_path}")
        logger.info(f"Prompt length: {len(qwen_prompt)} characters")
        
        try:
            result = subprocess.run([
                "qwen", "-m", "qwen-30b", "-p", "-y"
            ], input=qwen_prompt, cwd=str(project_path), capture_output=True, text=True, timeout=60)
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
                    # Commit and tag changes after successful AI edit
                    git_success, git_message = commit_and_tag_changes(f"AI edit: {prompt[:50]}...")
                    
                    response = {
                        "success": True, 
                        "message": response_data.get("message", "AI changes applied successfully"),
                        "qwen_response": response_data,
                        "git_status": git_success,
                        "git_message": git_message
                    }
                    
                    return jsonify(response)
                else:
                    return jsonify({
                        "success": False, 
                        "error": response_data.get("message", "AI processing failed"),
                        "qwen_response": response_data
                    }), 500
            except json_lib.JSONDecodeError:
                # Fallback for non-JSON response
                logger.warning("Qwen returned non-JSON response")
                
                # Commit and tag changes after successful AI edit
                git_success, git_message = commit_and_tag_changes(f"AI edit: {prompt[:50]}...")
                
                response = {
                    "success": True,
                    "message": "AI changes applied successfully", 
                    "qwen_output": result.stdout[:500],
                    "git_status": git_success,
                    "git_message": git_message
                }
                
                return jsonify(response)
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
        if "/admin/" in filename:
            actual_filename = filename.replace("/admin/", "/")
            admin = True
        elif filename.endswith("/admin"):
            actual_filename = filename[:-len("/admin")] + "/"
            admin = True

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
