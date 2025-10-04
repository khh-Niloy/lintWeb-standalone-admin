/**
 * Universal Admin Access Button
 *
 * This script creates a floating admin access button that works on any page
 * and automatically detects the correct admin route.
 *
 * Usage: Include this script in any HTML file
 * <script src="/admin-static/universal-admin-button.js"></script>
 */

(function () {
  "use strict";

  // Prevent multiple instances
  if (window.universalAdminButtonLoaded) {
    return;
  }
  window.universalAdminButtonLoaded = true;

  function createAdminButton() {
    // Check if button already exists
    if (document.getElementById("universal-admin-access-button")) {
      return;
    }

    // Create the button container
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "universal-admin-access-button";
    buttonContainer.className = "fixed bottom-4 right-4 z-50 hidden";

    // Determine the correct admin URL based on current path
    function getAdminUrl() {
      const currentPath = window.location.pathname;

      // Remove trailing slash and split path
      const pathParts = currentPath
        .replace(/\/$/, "")
        .split("/")
        .filter((part) => part);

      if (pathParts.length === 0) {
        // Root path
        return "/admin";
      } else if (pathParts.length === 1) {
        // Single path like /jbswebpage
        return `/${pathParts[0]}/admin`;
      } else {
        // Multiple parts like /user_123/project
        return `/${pathParts[0]}/${pathParts[1]}/admin`;
      }
    }

    const adminUrl = getAdminUrl();

    // Create the button HTML
    buttonContainer.innerHTML = `
            <a href="${adminUrl}" class="inline-flex items-center px-4 py-2 bg-black/90 hover:-translate-y-2 text-white text-sm font-medium rounded-md shadow-lg transition-all duration-200 hover:shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
                <h1 class="ml-2">customize your website</h1>
            </a>
        `;

    return buttonContainer;
  }

  function isInAdminMode() {
    // Check URL for admin parameter or admin path
    const url = window.location.href;
    const isAdminUrl = url.includes("/admin") || url.includes("admin=true");

    // Check for admin toolbar or other admin indicators
    const hasAdminToolbar =
      document.getElementById("admin-toolbar") ||
      document.getElementById("admin-toolbar-button") ||
      document.querySelector(".admin-toolbar-popup");

    return isAdminUrl || hasAdminToolbar;
  }

  function initializeButton() {
    const button = createAdminButton();
    if (!button) return;

    // Add to page
    document.body.appendChild(button);

    // Show/hide based on admin mode
    if (!isInAdminMode()) {
      button.classList.remove("hidden");
      console.log("🔧 Universal Admin Button: Shown (not in admin mode)");
    } else {
      button.classList.add("hidden");
      console.log("🔧 Universal Admin Button: Hidden (in admin mode)");
    }

    // Add observer to detect admin mode changes
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList") {
          // Check if admin elements were added
          const adminAdded = Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeType === 1 &&
              (node.id === "admin-toolbar" ||
                node.id === "admin-toolbar-button" ||
                node.classList?.contains("admin-toolbar-popup"))
          );

          if (adminAdded) {
            button.classList.add("hidden");
            console.log(
              "🔧 Universal Admin Button: Hidden (admin mode detected)"
            );
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeButton);
  } else {
    initializeButton();
  }

  // Expose utility functions globally
  window.UniversalAdminButton = {
    show: function () {
      const button = document.getElementById("universal-admin-access-button");
      if (button) button.classList.remove("hidden");
    },
    hide: function () {
      const button = document.getElementById("universal-admin-access-button");
      if (button) button.classList.add("hidden");
    },
    toggle: function () {
      const button = document.getElementById("universal-admin-access-button");
      if (button) button.classList.toggle("hidden");
    },
    remove: function () {
      const button = document.getElementById("universal-admin-access-button");
      if (button) button.remove();
    },
  };
})();
