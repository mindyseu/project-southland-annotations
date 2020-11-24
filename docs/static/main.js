function addScript(src) {
  return new Promise((resolve, reject) => {
    var script = document.createElement("script");
    script.onload = resolve;
    script.setAttribute("src", src);
    document.body.appendChild(script);
  });
}

/**
 * Initializes the hypothesis editor interface.
 * Triggered with ?edit=1 on the URL
 */
function initEditor(pageId) {
  // <script async src="https://hypothes.is/embed.js"></script>
  window.hypothesisConfig = function () {
    return {
      showHighlights: true,
    };
  };
  addScript("https://hypothes.is/embed.js");
}

/**
 * Initializes the custom UI for displaying annotations
 */
function initClient(pageId) {
  const setup = () => {
    getAnnotations(pageId, 0, []).then((rows) => {
      attachAnnotations(rows);
      initClientUI(rows);
      // Initialize plugins
      document.querySelectorAll('[data-zoom-image]').forEach(function(img) {
        new imageZoom(img);
      });
      addScript("static/vendor/soundmanager2-inlineplayer.js");
    });
  };
  setup();
}

function makeCssFromUsernameState(usernameState) {
  return Object.keys(usernameState)
    .map((userId) => {
      return `.content--${userId} {
      display: ${usernameState[userId].on ? "inline" : "none"};
    }`;
    })
    .join("\n");
}

function initClientUI(rows) {
  var usernameState = {};
  rows.forEach((row) => {
    var userId = stripUsername(row.user);
    usernameState[userId] = {on: true, displayName: userId};
    try {
      if (row.user_info.display_name) {
        usernameState[userId].displayName = row.user_info.display_name;
      }
    } catch(e) {
    }
  });

  var styleEl = document.createElement("style");
  // styleEl.type = "text/css";
  document.head.appendChild(styleEl);

  function updatePageCss(css) {
    styleEl.innerText = "";
    styleEl.appendChild(document.createTextNode(css));
  }

  window.updateDisplayState = () => {
    updatePageCss(makeCssFromUsernameState(usernameState));
  };

  window.updateDisplayState();

  var navEl = document.getElementById("checkboxes");
  var userIds = Object.keys(usernameState);
  userIds = userIds.sort((a, b) => (
      usernameState[a].displayName.toLowerCase() > usernameState[b].displayName.toLowerCase()
    ) ? 1 : -1)
  userIds.forEach((userId) => {
    $(`<div class="color--default color--${userId}">
      <label>
      <input type="checkbox" onclick="updateDisplayState" checked />
      ${usernameState[userId].displayName}
      </label>
    </div>`)
      .appendTo(navEl)
      .find("input")
      .change((e) => {
        usernameState[userId].on = e.target.checked; //== "checked" ? true : false;
        window.updateDisplayState();
      });
  });

  // Add base
  $(`<div class="base">
    <label>
      <input type="checkbox" onclick="toggle('.base', this)" checked />
        base
    </label>
    </div>`)
    .appendTo(navEl)
    .find("input")
    .change((e) => {
      $('.base--content').css('color', e.target.checked ? '' : 'transparent');
    });
}

function main() {
  var pageId;

  try {
    var namespace = document.querySelector('meta[name="dc.relation.ispartof"]').content;
    var id = document.querySelector('meta[name="dc.identifier"]').content;
    // urn:x-dc:elifesciences.org/blog-article/e3d858b3
    pageId = `urn:x-dc:${namespace}/${id}`;
  } catch (e) {}

  if (!pageId) {
    try {
      pageId = document.querySelector('link[rel="canonical"]').href;
    } catch (e) {}
  }

  if (!pageId) {
    // Append /?edit=1 so we get annotations from edit page
    pageId = document.location.origin + document.location.pathname + "?edit=1";
  }

  if (document.location.search.indexOf("edit=1") >= 0) {
    initEditor();
  } else {
    initClient(pageId);
  }
}

main();
