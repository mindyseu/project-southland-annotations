function getAnnotations(uri, offset, rows) {
  return new Promise((resolve, reject) => {
    _getAnnotations(uri, offset, rows, resolve);
  });
}

function _getAnnotations(uri, offset, rows, resolve) {
  var query =
    "https://hypothes.is/api/search?offset=" +
    offset +
    "&limit=200&uri=" +
    encodeURIComponent(uri);
  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", function () {
    var data = JSON.parse(xhr.responseText);
    rows = rows.concat(data.rows);
    if (data.rows.length != 0) {
      // console.log("offset: " + offset);
      _getAnnotations(uri, offset + 200, rows, resolve);
    } else {
      resolve(rows);
    }
  });
  xhr.open("GET", query);
  xhr.send();
}

function get_selector_with(selector_list, key) {
  for (var i = 0; i < selector_list.length; i++) {
    if (selector_list[i].hasOwnProperty(key)) return selector_list[i];
  }
}

function get_text_quote_selector(selector_list) {
  return get_selector_with(selector_list, "exact");
}

function get_text_position_selector(selector_list) {
  return get_selector_with(selector_list, "start");
}

function get_range(anno) {
  var selectors = anno.target[0].selector;
  if (selectors) {
    for (i = 0; i < selectors.length; i++) {
      var selector = selectors[i];
      if (selector.hasOwnProperty("start")) {
        return Math.abs(selector.start - selector.end);
      }
    }
  }
  return 0;
}

function compare(a, b) {
  range_a = get_range(a);
  range_b = get_range(b);
  if (range_a > range_b) return -1;
  else if (range_a < range_b) return 1;
  else return 0;
}

function buildInnerHtml(anno, row) {
  // console.log(row);
  var $html = $(marked(row.text));
  $html.find("a").each((idx, el) => {
    if (el.href.indexOf(".mp3") >= 0 || el.href.indexOf(".m4a") >= 0) {
      el.innerText = decodeURI(el.innerText.split("/").pop());
      el.target = "_blank";
    }
  });
  $html.find("img").each((idx, el) => {
    el.setAttribute("data-zoom-image", "true");
  });
  return $html.html();
}

function attachAnnotation(exact, prefix, anno, row) {
  var range = TextQuoteAnchor.toRange(document.body, {
    exact: exact.trim(),
    prefix: prefix,
  });

  var el = document.createElement("span");
  el.id = "hypothesis-" + row.id;
  // el.setAttribute("data-hypothesis", JSON.stringify(row));
  el.title = row.text;
  el.className = `annotation color--default color--${anno.user}`;
  el.setAttribute("data-userid", anno.user);

  el.innerHTML = `<span class="user-icon icon--default icon--${anno.user}"></span>
    <span class="user-content content--${anno.user}">${buildInnerHtml(anno, row)}</span>`;

  // Insert at end
  var endRange = range.cloneRange();
  endRange.setStart(range.endContainer, range.endOffset + 1);
  endRange.insertNode(el);
}

function stripUsername(user) {
  return user.replace("acct:", "").replace("@hypothes.is", "");
}

function attachAnnotations(rows) {
  rows.sort(compare);

  var targetLookup = {};

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    // console.log(row);
    if (row.hasOwnProperty("references")) {
      // latch reply onto parent
      for (var j = 0; j < rows.length; j++) {
        if (rows[j].id == row.references[0]) {
          row.target = rows[j].target;
          break;
        }
      }
      // continue;
    }
    var user = stripUsername(row.user);
    var selector_list = row["target"][0]["selector"];
    var text_quote_selector = get_text_quote_selector(selector_list);
    if (text_quote_selector == null) continue;
    var exact = text_quote_selector["exact"];
    var prefix = text_quote_selector["prefix"];
    anno = {
      user: user,
      exact: exact,
      prefix: prefix,
    };
    try {
      attachAnnotation(exact, prefix, anno, row);
    } catch (e) {
      console.log("attachAnnotation: " + anno.id + ": " + e.message);
    }
  }
}
