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
      initClientUI();
    });
  }
  setup();
}

function initClientUI() {
  $("input.maxtickets_enable_cb")
  .change(function () {
    if ($(this).is(":checked")) $(this).next("span.max_tickets").show();
    else $("span.max_tickets").hide();
  })
  .change();
  function toggle(className, obj) {
    var $input = $(obj);
    if ($input.prop("checked")) $(className).show();
    else $(className).hide();
  }
}

function main() {
  var pageId = document.location.origin + document.location.pathname;
  var search = document.location.search;

  if (search.indexOf("edit=1") >= 0) {
    initEditor(pageId);
  } else {
    // Append /?edit=1 so we get annotations from edit page
    initClient(pageId + "?edit=1");
  }
}

main();
