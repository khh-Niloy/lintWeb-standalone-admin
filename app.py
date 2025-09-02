import os
import mimetypes
import logging
from pathlib import Path
from datetime import datetime
from flask import Flask, send_from_directory, request, jsonify

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
PROJECTS_DIR = Path(os.getenv("PROJECTS_DIR", BASE_DIR / "projects")).resolve()

app = Flask(__name__)


def load_admin_template() -> str:
    template_path = BASE_DIR / "admin" / "templates" / "admin-inject.html"
    try:
        return template_path.read_text(encoding="utf-8")
    except Exception as e:
        logger.warning(f"Admin template not found or failed to read: {e}")
        return ""


ADMIN_INJECT = load_admin_template()


def is_admin_route(path: str) -> bool:
    if not path:
        return False
    p = path.lower()
    return "/admin" in p or "admin=true" in p


def inject_admin_toolbar(html_content: str, admin: bool) -> str:
    if not admin or not ADMIN_INJECT:
        return html_content
    if "Admin Toolbar Injection Template" in html_content:
        return html_content
    if "</body>" in html_content:
        return html_content.replace("</body>", f"{ADMIN_INJECT}</body>")
    if "</html>" in html_content:
        return html_content.replace("</html>", f"{ADMIN_INJECT}</html>")
    return html_content + ADMIN_INJECT


def safe_join_projects(path_fragment: str) -> Path:
    candidate = (PROJECTS_DIR / path_fragment).resolve()
    if PROJECTS_DIR not in candidate.parents and candidate != PROJECTS_DIR:
        raise PermissionError("Blocked path traversal")
    return candidate


@app.route("/health")
def health():
    return jsonify({"status": "healthy"}), 200


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
        return jsonify({"success": True, "message": f"Updated {html_file_path.name}", "file_path": str(html_file_path)})

    except Exception as e:
        logger.exception("direct_text_edit error")
        return jsonify({"success": False, "error": f"Internal error: {e}"}), 500


@app.route("/api/admin-edit", methods=["POST"])
def admin_edit():
    try:
        data = request.get_json(force=True, silent=True) or {}
        prompt = data.get("prompt", "").strip()
        elements = data.get("elements", [])
        url = data.get("url", "")
        batch_mode = data.get("batchMode", False)
        
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
        
        # Generate optimized prompt for Claude
        claude_prompt = generate_claude_edit_prompt(elements, prompt, target_file, batch_mode)
        
        # Execute Claude Code CLI
        import subprocess
        import json as json_lib
        
        result = subprocess.run([
            "claude", "-p",
            "--max-turns", "5",
            "--dangerously-skip-permissions",
            claude_prompt
        ], cwd=str(project_path), capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            try:
                # Try to parse JSON response
                response_data = json_lib.loads(result.stdout)
                return jsonify({
                    "success": True, 
                    "message": "AI changes applied successfully",
                    "claude_response": response_data
                })
            except json_lib.JSONDecodeError:
                # Fallback for non-JSON response
                return jsonify({
                    "success": True,
                    "message": "AI changes applied successfully", 
                    "claude_output": result.stdout[:500]
                })
        else:
            logger.error(f"Claude CLI error: {result.stderr}")
            return jsonify({
                "success": False, 
                "error": f"AI processing failed: {result.stderr[:200]}"
            }), 500
            
    except subprocess.TimeoutExpired:
        return jsonify({"success": False, "error": "AI processing timeout"}), 500
    except Exception as e:
        logger.exception("admin_edit error")
        return jsonify({"success": False, "error": f"Internal error: {str(e)[:200]}"}), 500


def generate_claude_edit_prompt(elements, user_request, target_file, batch_mode=False):
    """Generate optimized prompt for Claude Code CLI with batch editing support"""
    
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
    
    return f"""You are helping edit a website HTML file. The user has selected specific elements and wants to make changes.

TARGET FILE: {target_file}

SELECTED ELEMENTS FOR EDITING:
{elements_context}

USER REQUEST: {user_request}
{batch_instruction}
INSTRUCTIONS:
1. Read the current {target_file} file to understand the full context
2. Modify the selected elements or their children according to the user's request
3. PRESERVE all existing CSS classes, IDs, and styling attributes unless changes require styling modifications
4. When adding new elements, match existing design patterns and styling
5. For batch operations, apply changes consistently across all selected elements
6. Save the modified content back to {target_file}

CRITICAL: Make intelligent changes that fulfill the user's request. If they want shape changes, modify the appropriate CSS classes. If they want new content, add it in the right location.

Please read the file, make the requested changes, and save it back."""


def generate_element_selector_for_claude(element):
    """Generate CSS selector for element that Claude can use to identify changes"""
    selector = element.get('tag', 'div')
    
    if element.get('id'):
        selector += f"#{element.get('id')}"
    
    if element.get('classes'):
        # Use first few classes for selector
        classes = element.get('classes').split()[:2]
        selector += '.' + '.'.join(classes)
    
    return selector


@app.route("/admin-static/<path:filename>")
def admin_static(filename):
    admin_static_dir = BASE_DIR / "admin" / "toolbar"
    if not admin_static_dir.exists():
        return "Admin static directory not found", 404
    return send_from_directory(str(admin_static_dir), filename)


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
