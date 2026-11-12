(function () {
  "use strict";

  const info = window.SEOHYUN_INFO;
  const rootNode = {
    id: "home",
    number: "00",
    title: "서현고",
    summary: "서현고 학생을 위한 정보 지도입니다.",
    overview: "학교정보와 그 아래 교내 시설, 학사 일정, 동아리·학생 참여 정보를 한곳에서 찾아볼 수 있도록 구성한 지도입니다. 주제를 선택해 준비 중인 안내와 콘텐츠 편집 위치를 확인해 보세요."
  };
  const branchesLayer = document.getElementById("branches-layer");
  const mobileList = document.getElementById("mobile-map-list");
  const mapScrollContent = document.getElementById("map-scroll-content");
  const mapStage = document.getElementById("map-stage");
  const mapViewport = document.getElementById("map-viewport");
  const mapZoomOut = document.getElementById("map-zoom-out");
  const mapZoomIn = document.getElementById("map-zoom-in");
  const mapZoomReset = document.getElementById("map-zoom-reset");
  const mapZoomLevel = document.getElementById("map-zoom-level");
  const linesSvg = document.getElementById("tree-lines");
  const searchInput = document.getElementById("site-search");
  const searchResults = document.getElementById("search-results");
  const themeButton = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-label");
  const themeIcon = document.getElementById("theme-icon");
  const detailCard = document.getElementById("detail-card");
  const detailClose = document.getElementById("detail-close");
  const explorerLayout = document.querySelector(".explorer-layout");
  const supabaseConfig = window.SEOHYUN_SUPABASE_CONFIG || {};
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const adminSettingsButton = document.getElementById("admin-settings-button");
  const adminSettingsDialog = document.getElementById("admin-settings-dialog");
  const adminWritingForm = document.getElementById("admin-writing-form");
  const writingStartInput = document.getElementById("writing-start-at");
  const writingEndInput = document.getElementById("writing-end-at");
  const writingPeriodStatus = document.getElementById("writing-period-status");
  const writingToggleButton = document.getElementById("writing-toggle-button");
  const adminSettingsClose = document.getElementById("admin-settings-close");
  const writingStatus = document.getElementById("writing-status");
  const authUserLabel = document.getElementById("auth-user");
  const articleList = document.getElementById("article-list");
  const articleCount = document.getElementById("article-count");
  const writerTools = document.getElementById("writer-tools");
  const newArticleButton = document.getElementById("new-article-button");
  const newChildNodeButton = document.getElementById("new-child-node-button");
  const articleForm = document.getElementById("article-form");
  const childNodeForm = document.getElementById("child-node-form");
  const childNodeParentLabel = document.getElementById("child-node-parent-label");
  const appToast = document.getElementById("app-toast");
  const nodeIndex = new Map([[rootNode.id, rootNode]]);
  const nodeChildren = new Map();
  const collapsedBranches = new Set();
  const collapsedLeaves = new Set();
  const pendingClicks = new Map();
  let selectedId = rootNode.id;
  let supabaseClient = null;
  let currentUser = null;
  let isGoogleUser = false;
  let isWriter = false;
  let isAdmin = false;
  let writingIsOpen = false;
  let writingSettings = null;
  let currentArticles = [];
  let editingArticleId = null;
  let articleLoadToken = 0;
  let customMapNodes = [];
  let customNodeLoadToken = 0;
  let childNodeParentId = null;
  let toastTimer = null;
  let mapZoom = 1;
  let mapBaseWidth = 760;
  let mapBaseHeight = 1000;
  let mapZoomOffsetX = 0;
  let mapZoomOffsetY = 0;
  let mapContentMarginLeft = 0;
  let mapPanOffsetX = 0;
  let mapPanOffsetY = 0;
  let mapPan = null;
  let suppressedDragClick = null;
  let suppressedDragClickTimer = null;

  function makeNodeButton(node, className, smallLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className + " map-node";
    button.dataset.nodeId = node.id;
    button.setAttribute("aria-label", node.title + " 정보 열기");

    if (smallLabel) {
      const mark = document.createElement("span");
      mark.className = "node-mark";
      mark.textContent = smallLabel;
      mark.setAttribute("aria-hidden", "true");
      button.appendChild(mark);
    }

    const copy = document.createElement("span");
    copy.className = "node-copy";
    const title = document.createElement("span");
    title.className = "node-title";
    title.textContent = node.title;
    const caption = document.createElement("span");
    caption.className = "node-caption";
    caption.textContent = node.subtitle || node.summary;
    copy.append(title, caption);
    button.appendChild(copy);
    return button;
  }

  function placeNode(element, coordinates) {
    element.style.left = coordinates[0] + "px";
    element.style.top = coordinates[1] + "px";
  }

  function graphPositions(width, height) {
    const centerX = width / 2;
    const centerY = height / 2 + 20;
    const categoryOffset = Math.min(400, Math.max(163, width * 0.23));
    const sideLeafOffset = Math.min(180, Math.max(65, width * 0.1));
    const categoryVerticalOffset = Math.min(260, Math.max(100, height * 0.25));
    const outerVerticalOffset = Math.min(380, Math.max(160, height * 0.32));
    const sideVerticalOffset = Math.min(180, Math.max(80, height * 0.16));
    const rowPositions = function (count, y) {
      return Array.from({ length: count }, function (_, index) { return [width * (index + 1) / (count + 1), y]; });
    };
    const schoolCategory = info.categories.find(function (item) { return item.id === "school"; });
    const facilityCategory = (schoolCategory.subcategories || []).find(function (item) { return item.id === "facilities"; });
    const facilityX = centerX - categoryOffset * 0.72;
    const facilityY = centerY - 40;
    return {
      school: {
        category: [centerX, centerY - categoryVerticalOffset],
        topics: rowPositions(schoolCategory.topics.length, centerY - outerVerticalOffset),
        subcategories: {
          facilities: {
            category: [facilityX, facilityY],
            topics: Array.from({ length: facilityCategory.topics.length }, function (_, index) {
              const spacing = Math.max(78, Math.min(126, 500 / Math.max(1, facilityCategory.topics.length - 1)));
              return [Math.max(82, centerX - categoryOffset * 1.45), facilityY + (index - (facilityCategory.topics.length - 1) / 2) * spacing];
            })
          }
        }
      },
      calendar: { category: [centerX + categoryOffset, centerY], topics: [[width - sideLeafOffset, centerY - sideVerticalOffset], [width - sideLeafOffset, centerY], [width - sideLeafOffset, centerY + sideVerticalOffset]] },
      activities: { category: [centerX, centerY + categoryVerticalOffset], topics: rowPositions(info.categories.find(function (item) { return item.id === "activities"; }).topics.length, centerY + outerVerticalOffset) },
      home: { root: [centerX, centerY] }
    };
  }

  function syncMapZoomLayout() {
    const scaledWidth = mapBaseWidth * mapZoom;
    const scaledHeight = mapBaseHeight * mapZoom;
    const layoutWidth = Math.max(mapBaseWidth, scaledWidth);
    const layoutHeight = Math.max(mapBaseHeight, scaledHeight);
    mapZoomOffsetX = (layoutWidth - scaledWidth) / 2;
    mapZoomOffsetY = (layoutHeight - scaledHeight) / 2;
    mapScrollContent.style.width = layoutWidth + "px";
    mapScrollContent.style.height = layoutHeight + "px";
    mapContentMarginLeft = Math.max(0, (mapViewport.clientWidth - layoutWidth) / 2);
    mapScrollContent.style.marginLeft = mapContentMarginLeft + "px";
    mapScrollContent.style.marginRight = mapContentMarginLeft + "px";
    mapStage.style.transform = "translate(" + (mapZoomOffsetX + mapPanOffsetX) + "px, " + (mapZoomOffsetY + mapPanOffsetY) + "px) scale(" + mapZoom + ")";
    mapZoomLevel.textContent = Math.round(mapZoom * 100) + "%";
  }

  function setMapZoom(nextZoom, clientX, clientY) {
    const previousZoom = mapZoom;
    const clampedZoom = Math.min(2.25, Math.max(0.6, nextZoom));
    if (clampedZoom === previousZoom) return;

    const viewportBounds = mapViewport.getBoundingClientRect();
    const anchorX = clientX == null ? mapViewport.clientWidth / 2 : clientX - viewportBounds.left;
    const anchorY = clientY == null ? mapViewport.clientHeight / 2 : clientY - viewportBounds.top;
    const previousOffsetX = mapContentMarginLeft + mapZoomOffsetX + mapPanOffsetX;
    const previousOffsetY = mapZoomOffsetY + mapPanOffsetY;
    const previousScrollLeft = mapViewport.scrollLeft;
    const previousScrollTop = mapViewport.scrollTop;
    const scaleRatio = clampedZoom / previousZoom;

    mapZoom = clampedZoom;
    syncMapZoomLayout();

    const nextOffsetX = mapContentMarginLeft + mapZoomOffsetX + mapPanOffsetX;
    const nextOffsetY = mapZoomOffsetY + mapPanOffsetY;
    mapViewport.scrollLeft = (previousScrollLeft + anchorX - previousOffsetX) * scaleRatio + nextOffsetX - anchorX;
    mapViewport.scrollTop = (previousScrollTop + anchorY - previousOffsetY) * scaleRatio + nextOffsetY - anchorY;
  }

  function addNodeToTree(node, parentId, kind) {
    if (!nodeIndex.has(parentId)) return false;
    node.kind = kind;
    node.parentId = parentId;
    nodeIndex.set(node.id, node);
    if (!nodeChildren.has(node.id)) nodeChildren.set(node.id, []);
    if (!nodeChildren.has(parentId)) nodeChildren.set(parentId, []);
    nodeChildren.get(parentId).push(node);
    return true;
  }

  function buildNodeTree() {
    nodeIndex.clear();
    nodeChildren.clear();
    nodeIndex.set(rootNode.id, rootNode);
    nodeChildren.set(rootNode.id, []);
    info.categories.forEach(function (category) {
      category.topLevelParentId = category.id;
      addNodeToTree(category, rootNode.id, "category");
      category.topics.forEach(function (topic, index) {
        topic.number = category.number + "." + String(index + 1).padStart(2, "0");
        topic.topLevelParentId = category.id;
        topic.parentTitle = category.title;
        addNodeToTree(topic, category.id, "topic");
      });
      (category.subcategories || []).forEach(function (subcategory) {
        subcategory.topLevelParentId = category.id;
        addNodeToTree(subcategory, category.id, "category");
        subcategory.topics.forEach(function (topic, index) {
          topic.number = subcategory.number + "." + String(index + 1).padStart(2, "0");
          topic.topLevelParentId = category.id;
          topic.parentTitle = subcategory.title;
          addNodeToTree(topic, subcategory.id, "topic");
        });
      });
    });

    const pending = customMapNodes.slice();
    let added = true;
    while (pending.length && added) {
      added = false;
      for (let index = pending.length - 1; index >= 0; index -= 1) {
        const row = pending[index];
        if (!nodeIndex.has(row.parent_node_id)) continue;
        const node = {
          id: String(row.id),
          title: row.title,
          number: "＋",
          summary: row.summary,
          guidance: row.guidance || "",
          sourceUrl: row.source_url || "",
          updatedAt: row.created_at ? formatArticleDate(row.created_at) : "",
          authorId: row.author_id,
          custom: true
        };
        const parent = nodeIndex.get(row.parent_node_id);
        node.topLevelParentId = parent.topLevelParentId || (parent.id !== "home" ? parent.id : "");
        node.parentTitle = parent.title;
        addNodeToTree(node, row.parent_node_id, "topic");
        pending.splice(index, 1);
        added = true;
      }
    }
  }

  function getNodeChildren(nodeOrId) {
    const id = typeof nodeOrId === "string" ? nodeOrId : nodeOrId && nodeOrId.id;
    return nodeChildren.get(id) || [];
  }

  function getNodePath(node) {
    const path = [];
    let current = node;
    while (current && current.id !== "home") {
      path.unshift(current);
      current = nodeIndex.get(current.parentId);
    }
    return path;
  }

  function updateGraphLayout() {
    const maxDepth = customMapNodes.reduce(function (max, row) {
      let depth = 0;
      let current = nodeIndex.get(row.parent_node_id);
      while (current && current.id !== "home") {
        depth += 1;
        current = nodeIndex.get(current.parentId);
      }
      return Math.max(max, depth + 1);
    }, 0);
    const largestCustomBranch = Array.from(nodeChildren.values()).reduce(function (max, children) {
      return Math.max(max, children.filter(function (child) { return child.custom; }).length);
    }, 0);
    const baseWidth = Math.min(1800, Math.max(1200, mapViewport.clientWidth));
    const baseHeight = Math.max(1000, mapViewport.clientHeight);
    const reserveWidth = maxDepth * 500;
    const reserveHeight = maxDepth * 100 + Math.max(0, largestCustomBranch - 1) * 84;
    mapBaseWidth = baseWidth + reserveWidth;
    mapBaseHeight = baseHeight + reserveHeight;
    mapStage.style.width = mapBaseWidth + "px";
    mapStage.style.minWidth = mapBaseWidth + "px";
    mapStage.style.height = mapBaseHeight + "px";
    syncMapZoomLayout();

    const layout = graphPositions(mapBaseWidth, mapBaseHeight);
    const shiftX = reserveWidth / 2;
    const shiftY = reserveHeight / 2;
    const positions = new Map();
    const shifted = function (point) { return [point[0] - shiftX, point[1] - shiftY]; };
    positions.set("home", shifted(layout.home.root));
    const rootButton = mapStage.querySelector('[data-node-id="home"]');
    if (rootButton) placeNode(rootButton, positions.get("home"));
    info.categories.forEach(function (category) {
      const categoryPoint = shifted(layout[category.id].category);
      positions.set(category.id, categoryPoint);
      const categoryButton = branchesLayer.querySelector('.category-node[data-node-id="' + category.id + '"]');
      if (categoryButton) placeNode(categoryButton, categoryPoint);
      category.topics.forEach(function (topic, index) {
        const point = shifted(layout[category.id].topics[index]);
        positions.set(topic.id, point);
        const topicButton = branchesLayer.querySelector('.topic-node[data-node-id="' + topic.id + '"]');
        if (topicButton) placeNode(topicButton, point);
      });
      (category.subcategories || []).forEach(function (subcategory) {
        const subcategoryLayout = layout[category.id].subcategories[subcategory.id];
        const subcategoryPoint = shifted(subcategoryLayout.category);
        positions.set(subcategory.id, subcategoryPoint);
        const subcategoryButton = branchesLayer.querySelector('.category-node[data-node-id="' + subcategory.id + '"]');
        if (subcategoryButton) placeNode(subcategoryButton, subcategoryPoint);
        subcategory.topics.forEach(function (topic, index) {
          const point = shifted(subcategoryLayout.topics[index]);
          positions.set(topic.id, point);
          const topicButton = branchesLayer.querySelector('.topic-node[data-node-id="' + topic.id + '"]');
          if (topicButton) placeNode(topicButton, point);
        });
      });
    });

    function pointIsAvailable(point, nodeId) {
      const button = branchesLayer.querySelector('[data-node-id="' + nodeId + '"]');
      const width = button ? button.offsetWidth : 126;
      const height = button ? button.offsetHeight : 48;
      if (point[0] < width / 2 + 20 || point[0] > mapBaseWidth - width / 2 - 20) return false;
      if (point[1] < height / 2 + 20 || point[1] > mapBaseHeight - height / 2 - 20) return false;
      let available = true;
      positions.forEach(function (otherPoint, otherId) {
        if (!available || otherId === nodeId) return;
        const other = branchesLayer.querySelector('[data-node-id="' + otherId + '"]') || mapStage.querySelector('[data-node-id="' + otherId + '"]');
        const otherWidth = other ? other.offsetWidth : 126;
        const otherHeight = other ? other.offsetHeight : 48;
        if (Math.abs(point[0] - otherPoint[0]) < (width + otherWidth) / 2 + 14
          && Math.abs(point[1] - otherPoint[1]) < (height + otherHeight) / 2 + 14) available = false;
      });
      return available;
    }

    function placeCustomChildren(parentId, visited) {
      if (visited.has(parentId)) return;
      visited.add(parentId);
      const children = getNodeChildren(parentId).filter(function (node) { return node.custom; });
      const parentPoint = positions.get(parentId);
      if (!parentPoint) return;
      children.forEach(function (node, index) {
        const fanOffset = (index - (children.length - 1) / 2) * 86;
        const directions = [
          [1, 0, 0, 1], [0, 1, -1, 0], [0, -1, 1, 0], [-1, 0, 0, -1]
        ];
        let point = null;
        for (const distance of [190, 250, 310, 370]) {
          for (const direction of directions) {
            const candidate = [
              parentPoint[0] + direction[0] * distance + direction[2] * fanOffset,
              parentPoint[1] + direction[1] * distance + direction[3] * fanOffset
            ];
            if (pointIsAvailable(candidate, node.id)) {
              point = candidate;
              break;
            }
          }
          if (point) break;
        }
        if (!point) point = [parentPoint[0] + 190, parentPoint[1] + fanOffset];
        positions.set(node.id, point);
        const button = branchesLayer.querySelector('.topic-node[data-node-id="' + node.id + '"]');
        if (button) placeNode(button, point);
        placeCustomChildren(node.id, visited);
      });
    }
    placeCustomChildren("home", new Set());
    info.categories.forEach(function (category) {
      placeCustomChildren(category.id, new Set());
      (category.subcategories || []).forEach(function (subcategory) {
        placeCustomChildren(subcategory.id, new Set());
        subcategory.topics.forEach(function (topic) { placeCustomChildren(topic.id, new Set()); });
      });
      category.topics.forEach(function (topic) { placeCustomChildren(topic.id, new Set()); });
    });
  }

  function renderTree() {
    buildNodeTree();
    branchesLayer.replaceChildren();
    mobileList.replaceChildren();

    const mobileHome = document.createElement("button");
    mobileHome.type = "button";
    mobileHome.className = "mobile-home-node map-node";
    mobileHome.dataset.nodeId = "home";
    const mobileHomeMark = document.createElement("span");
    mobileHomeMark.className = "mobile-home-mark";
    mobileHomeMark.textContent = "S";
    const mobileHomeCopy = document.createElement("span");
    mobileHomeCopy.className = "mobile-home-copy";
    const mobileHomeTitle = document.createElement("strong");
    mobileHomeTitle.textContent = "서현고";
    const mobileHomeCaption = document.createElement("span");
    mobileHomeCaption.textContent = "정보의 중심";
    mobileHomeCopy.append(mobileHomeTitle, mobileHomeCaption);
    const mobileHomeArrow = document.createElement("span");
    mobileHomeArrow.className = "mobile-home-arrow";
    mobileHomeArrow.textContent = "↗";
    mobileHome.append(mobileHomeMark, mobileHomeCopy, mobileHomeArrow);
    mobileList.appendChild(mobileHome);

    function renderDesktopNode(node) {
      const className = node.kind === "category"
        ? (node.parentId === "home" ? "category-node" : "category-node subcategory-node")
        : "topic-node";
      const button = makeNodeButton(node, className, node.kind === "category" ? node.number : "");
      button.dataset.categoryId = node.topLevelParentId || node.id;
      branchesLayer.appendChild(button);
      getNodeChildren(node).forEach(renderDesktopNode);
    }
    getNodeChildren("home").forEach(renderDesktopNode);
    getNodeChildren("home").forEach(function (category, index) {
      renderMobileCategory(category, index === 0, mobileList);
    });

    updateGraphLayout();
    requestAnimationFrame(drawConnections);
  }

  function renderMobileNode(node, parentContainer) {
    if (node.kind === "category") {
      renderMobileCategory(node, false, parentContainer);
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-topic-node map-node";
    button.dataset.nodeId = node.id;
    const title = document.createElement("span");
    title.textContent = node.title;
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    button.append(title, arrow);
    parentContainer.appendChild(button);
    const children = getNodeChildren(node);
    if (children.length) {
      const childList = document.createElement("div");
      childList.className = "mobile-topic-list mobile-nested-topic-list";
      childList.dataset.parentNodeId = node.id;
      children.forEach(function (child) { renderMobileNode(child, childList); });
      parentContainer.appendChild(childList);
    }
  }

  function renderMobileCategory(category, expanded, parentContainer) {
    const details = document.createElement("details");
    details.className = "mobile-category";
    details.dataset.categoryId = category.id;
    if (expanded) details.open = true;
    const summary = document.createElement("summary");
    const number = document.createElement("span");
    number.className = "mobile-category-number";
    number.textContent = category.number || "＋";
    const categoryCopy = document.createElement("span");
    categoryCopy.className = "mobile-category-copy";
    const title = document.createElement("strong");
    title.textContent = category.title;
    const subtitle = document.createElement("span");
    subtitle.textContent = category.subtitle || category.summary;
    categoryCopy.append(title, subtitle);
    const chevron = document.createElement("span");
    chevron.className = "mobile-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";
    summary.append(number, categoryCopy, chevron);
    details.appendChild(summary);
    details.appendChild(makeNodeButton(category, "mobile-category-overview"));

    const topicList = document.createElement("div");
    topicList.className = "mobile-topic-list";
    topicList.dataset.parentNodeId = category.id;
    getNodeChildren(category).forEach(function (node) { renderMobileNode(node, topicList); });
    details.appendChild(topicList);
    parentContainer.appendChild(details);
    return details;
  }

  function nodeCenter(element, stageBounds) {
    const rect = element.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2 - stageBounds.left) / mapZoom,
      y: (rect.top + rect.height / 2 - stageBounds.top) / mapZoom,
      width: rect.width / mapZoom,
      height: rect.height / mapZoom
    };
  }

  function edgePoint(node, dx, dy) {
    const horizontalScale = dx === 0 ? Infinity : node.width / 2 / Math.abs(dx);
    const verticalScale = dy === 0 ? Infinity : node.height / 2 / Math.abs(dy);
    const scale = Math.min(horizontalScale, verticalScale);
    return { x: node.x + dx * scale, y: node.y + dy * scale };
  }

  function connect(source, target, active) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const start = edgePoint(source, dx, dy);
    const end = edgePoint(target, -dx, -dy);
    const curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const bend = Math.min(35, Math.max(10, Math.hypot(dx, dy) * 0.09));
    const perpendicularX = dy === 0 ? 0 : -Math.sign(dy) * bend;
    const perpendicularY = dx === 0 ? 0 : Math.sign(dx) * bend;
    const c1x = start.x + dx * 0.34 + perpendicularX;
    const c1y = start.y + dy * 0.34 + perpendicularY;
    const c2x = end.x - dx * 0.34 + perpendicularX;
    const c2y = end.y - dy * 0.34 + perpendicularY;
    curve.setAttribute("d", "M " + start.x + " " + start.y + " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + end.x + " " + end.y);
    curve.setAttribute("class", "tree-connector" + (active ? " active" : ""));
    linesSvg.appendChild(curve);
  }

  function drawConnections() {
    const bounds = mapStage.getBoundingClientRect();
    const width = mapStage.offsetWidth;
    const height = mapStage.offsetHeight;
    linesSvg.setAttribute("width", String(width));
    linesSvg.setAttribute("height", String(height));
    linesSvg.setAttribute("viewBox", "0 0 " + width + " " + height);
    linesSvg.replaceChildren();

    const rootButton = mapStage.querySelector('[data-node-id="home"]');
    if (!rootButton) return;
    function isOnSelectedPath(id) {
      let current = nodeIndex.get(selectedId);
      while (current) {
        if (current.id === id) return true;
        current = nodeIndex.get(current.parentId);
      }
      return false;
    }
    nodeIndex.forEach(function (node) {
      if (node.id === "home" || !node.parentId) return;
      const childButton = branchesLayer.querySelector('[data-node-id="' + node.id + '"]');
      const parentButton = node.parentId === "home"
        ? rootButton
        : branchesLayer.querySelector('[data-node-id="' + node.parentId + '"]');
      if (!childButton || !parentButton || childButton.classList.contains("is-folded-away") || parentButton.classList.contains("is-folded-away")) return;
      if (collapsedBranches.has(node.parentId)) return;
      connect(nodeCenter(parentButton, bounds), nodeCenter(childButton, bounds), isOnSelectedPath(node.id));
    });
  }

  function applyCollapseState() {
    const rootCollapsed = collapsedBranches.has("home");
    const rootButton = mapStage.querySelector('[data-node-id="home"]');
    if (rootButton) {
      rootButton.classList.toggle("is-branch-collapsed", rootCollapsed);
      rootButton.title = rootCollapsed ? "전체 가지가 접혔어요. 더블 클릭 또는 우클릭으로 펼치기" : "더블 클릭 또는 우클릭으로 전체 가지 접기";
      rootButton.setAttribute("aria-label", rootButton.title);
    }
    const mobileRootButton = mobileList.querySelector('.mobile-home-node[data-node-id="home"]');
    if (mobileRootButton) {
      mobileRootButton.classList.toggle("is-branch-collapsed", rootCollapsed);
      mobileRootButton.title = rootButton ? rootButton.title : "전체 가지 접기 또는 펼치기";
      mobileRootButton.setAttribute("aria-label", mobileRootButton.title);
    }

    const hiddenByAncestor = new Set();
    if (rootCollapsed) hiddenByAncestor.add("home");
    nodeIndex.forEach(function (node) {
      if (node.id === "home") return;
      const hidden = hiddenByAncestor.has(node.parentId);
      const hasChildren = getNodeChildren(node).length > 0;
      const branchCollapsed = hasChildren && collapsedBranches.has(node.id);
      const nodeCollapsed = !hasChildren && collapsedLeaves.has(node.id);
      const desktopButton = branchesLayer.querySelector('[data-node-id="' + node.id + '"]');
      if (desktopButton) {
        desktopButton.classList.toggle("is-folded-away", hidden);
        desktopButton.classList.toggle("is-branch-collapsed", branchCollapsed);
        desktopButton.classList.toggle("is-node-collapsed", nodeCollapsed);
        desktopButton.title = hasChildren
          ? (branchCollapsed ? node.title + " 가지가 접혔어요. 더블 클릭 또는 우클릭으로 펼치기" : "더블 클릭 또는 우클릭으로 " + node.title + "의 하위 노드 접기")
          : (nodeCollapsed ? node.title + " 노드가 접혔어요. 더블 클릭 또는 우클릭으로 펼치기" : "더블 클릭 또는 우클릭으로 이 노드 접기");
        desktopButton.setAttribute("aria-label", desktopButton.title);
      }

      const mobileButton = mobileList.querySelector('.mobile-topic-node[data-node-id="' + node.id + '"], .mobile-category-overview[data-node-id="' + node.id + '"]');
      if (mobileButton) {
        mobileButton.classList.toggle("is-folded-away", hidden);
        mobileButton.classList.toggle("is-branch-collapsed", branchCollapsed);
        mobileButton.classList.toggle("is-node-collapsed", nodeCollapsed);
        mobileButton.title = desktopButton ? desktopButton.title : node.title;
        mobileButton.setAttribute("aria-label", mobileButton.title);
      }

      const mobileCategory = mobileList.querySelector('.mobile-category[data-category-id="' + node.id + '"]');
      if (mobileCategory) {
        mobileCategory.classList.toggle("is-folded-away", hidden);
        mobileCategory.classList.toggle("is-branch-collapsed", branchCollapsed);
      }
      const childList = mobileList.querySelector('.mobile-topic-list[data-parent-node-id="' + node.id + '"]');
      if (childList) childList.classList.toggle("is-folded-away", hidden || branchCollapsed || nodeCollapsed);
      if (hidden || branchCollapsed || nodeCollapsed) hiddenByAncestor.add(node.id);
    });

    requestAnimationFrame(drawConnections);
  }

  function clearPendingClick(id) {
    const timer = pendingClicks.get(id);
    if (timer) window.clearTimeout(timer);
    pendingClicks.delete(id);
  }

  function scheduleNodeClick(id) {
    if (pendingClicks.has(id)) {
      clearPendingClick(id);
      return;
    }
    const timer = window.setTimeout(function () {
      pendingClicks.delete(id);
      selectNode(id, { openDetail: true });
    }, 240);
    pendingClicks.set(id, timer);
  }

  function toggleNodeCollapse(id) {
    const node = nodeIndex.get(id);
    if (!node) return;
    const hasChildren = getNodeChildren(node).length > 0;
    const collapsedSet = id === "home" || hasChildren ? collapsedBranches : collapsedLeaves;
    if (collapsedSet.has(id)) collapsedSet.delete(id);
    else collapsedSet.add(id);
    selectedId = id;
    closeDetail();
    applyCollapseState();
    updateActiveNodeClasses(node);
  }

  function selectNode(id, options) {
    const node = nodeIndex.get(id);
    if (!node) return;
    let revealed = false;
    let parentId = node.parentId;
    while (parentId) {
      revealed = collapsedBranches.delete(parentId) || revealed;
      const parent = nodeIndex.get(parentId);
      if (!parent) break;
      const mobileParent = mobileList.querySelector('.mobile-category[data-category-id="' + parent.id + '"]');
      if (mobileParent) mobileParent.open = true;
      parentId = parent.parentId;
    }
    revealed = collapsedLeaves.delete(id) || revealed;
    const mobileSelectedCategory = mobileList.querySelector('.mobile-category[data-category-id="' + id + '"]');
    if (mobileSelectedCategory) mobileSelectedCategory.open = true;
    if (revealed) applyCollapseState();
    selectedId = id;
    updateActiveNodeClasses(node);
    updateDetail(node);
    requestAnimationFrame(drawConnections);
    if (options && options.openDetail) {
      detailCard.classList.add("is-open");
      detailCard.setAttribute("aria-hidden", "false");
    }
  }

  function closeDetail() {
    detailCard.classList.remove("is-open");
    detailCard.setAttribute("aria-hidden", "true");
  }

  function updateActiveNodeClasses(node) {
    const parentIds = new Set();
    let parent = node;
    while (parent && parent.parentId) {
      parentIds.add(parent.parentId);
      parent = nodeIndex.get(parent.parentId);
    }
    document.querySelectorAll(".map-node[data-node-id]").forEach(function (button) {
      const active = button.dataset.nodeId === node.id;
      const parentActive = parentIds.has(button.dataset.nodeId);
      button.classList.toggle("is-selected", active);
      button.classList.toggle("is-branch-active", parentActive);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function updateDetail(node) {
    const isRoot = node.id === "home";
    const title = document.getElementById("detail-title");
    const summary = document.getElementById("detail-summary");
    const breadcrumb = document.getElementById("breadcrumb");
    const number = document.getElementById("detail-number");
    const content = document.getElementById("detail-content");
    const source = document.getElementById("detail-source");
    const updated = document.getElementById("detail-updated");
    const path = getNodePath(node);
    const children = getNodeChildren(node);

    title.textContent = node.title;
    summary.textContent = node.summary || "확인된 안내를 출처와 함께 정리해 주세요.";
    number.textContent = node.number || "00";
    breadcrumb.replaceChildren();
    const homeCrumb = document.createElement("span");
    homeCrumb.textContent = "정보 지도";
    breadcrumb.appendChild(homeCrumb);
    (isRoot ? [{ title: "홈" }] : path).forEach(function (crumb) {
      const slash = document.createElement("span");
      slash.textContent = "/";
      const crumbLabel = document.createElement("span");
      crumbLabel.textContent = crumb.title;
      breadcrumb.append(slash, crumbLabel);
    });

    content.replaceChildren();
    if (isRoot || node.kind === "category") {
      const description = document.createElement("p");
      description.className = "detail-description";
      description.textContent = node.overview || node.summary;
      content.appendChild(description);
    } else {
      addContentBlock(content, "안내", node.guidance || "확인된 안내와 출처를 여기에 추가해 주세요.");
    }
    if (children.length) {
      const heading = document.createElement("div");
      heading.className = "content-label";
      heading.textContent = isRoot ? "정보 주제" : "하위 정보";
      content.appendChild(heading);
      const items = document.createElement("div");
      items.className = "detail-topic-list";
      children.forEach(function (child) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "detail-topic-link map-node";
        item.dataset.nodeId = child.id;
        const itemTitle = document.createElement("span");
        itemTitle.textContent = child.title;
        const arrow = document.createElement("span");
        arrow.textContent = "↗";
        arrow.setAttribute("aria-hidden", "true");
        item.append(itemTitle, arrow);
        items.appendChild(item);
      });
      content.appendChild(items);
    }

    let sourceEntries = [];
    const sourceOwners = path.slice().reverse();
    for (const owner of sourceOwners) {
      if (Array.isArray(owner.sources) && owner.sources.length) { sourceEntries = owner.sources; break; }
      if (owner.sourceUrl) { sourceEntries = [{ label: "출처 페이지", url: owner.sourceUrl }]; break; }
    }
    const validSources = sourceEntries.map(function (item) {
      return { label: item.label || "출처 페이지", url: safeHttpUrl(item.url || item.sourceUrl) };
    }).filter(function (item) { return Boolean(item.url); });
    if (validSources.length) {
      const links = document.createDocumentFragment();
      validSources.forEach(function (item, index) {
        if (index) links.appendChild(document.createTextNode(" · "));
        const link = document.createElement("a");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = item.label + " ↗";
        links.appendChild(link);
      });
      source.replaceChildren(links);
    } else {
      source.textContent = "공식 자료를 확인한 뒤 링크를 추가해 주세요.";
    }
    updated.textContent = (!isRoot && node.updatedAt) || path.slice().reverse().map(function (item) { return item.updatedAt; }).find(Boolean) || info.updatedAt || "등록 전";
    resetArticleEditor();
    resetChildNodeEditor();
    loadArticles(node.id);
  }

  function showToast(message) {
    if (!appToast) return;
    appToast.textContent = message;
    appToast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { appToast.hidden = true; }, 5200);
  }

  function parseKstDateTime(value) {
    if (!value) return null;
    const date = new Date(value + ":00+09:00");
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function formatKstDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date).reduce(function (result, part) {
      result[part.type] = part.value;
      return result;
    }, {});
    return parts.year + "-" + parts.month + "-" + parts.day + "T" + parts.hour + ":" + parts.minute;
  }

  function formatKstLabel(value) {
    if (!value) return "미설정";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "미설정";
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(date) + " (한국시간)";
  }

  function getWritingPeriodFromInputs() {
    const startsAt = parseKstDateTime(writingStartInput.value);
    const endsAt = parseKstDateTime(writingEndInput.value);
    if (!startsAt || !endsAt) {
      showToast("한국시간 기준 시작 시각과 종료 시각을 모두 입력해 주세요.");
      return null;
    }
    if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
      showToast("종료 시각은 시작 시각보다 뒤여야 해요.");
      return null;
    }
    return { starts_at: startsAt, ends_at: endsAt };
  }

  function formatArticleDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "날짜 미정";
    return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(date);
  }

  function safeHttpUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function setArticleMessage(message) {
    articleList.replaceChildren();
    const note = document.createElement("p");
    note.className = "article-empty";
    note.textContent = message;
    articleList.appendChild(note);
    articleCount.textContent = "0";
  }

  function renderArticles(articles) {
    currentArticles = articles || [];
    articleList.replaceChildren();
    articleCount.textContent = String(currentArticles.length);
    if (!currentArticles.length) {
      setArticleMessage(supabaseClient ? "아직 등록된 안내가 없어요." : "온라인 글 기능을 연결하면 등록된 안내가 여기에 보여요.");
      return;
    }

    currentArticles.forEach(function (article) {
      const card = document.createElement("article");
      card.className = "article-card" + (article.published ? "" : " is-draft");
      const heading = document.createElement("div");
      heading.className = "article-card-heading";
      const title = document.createElement("h4");
      title.textContent = article.title;
      heading.appendChild(title);
      if (!article.published) {
        const draft = document.createElement("span");
        draft.className = "article-draft-label";
        draft.textContent = "비공개";
        heading.appendChild(draft);
      }
      const body = document.createElement("p");
      body.className = "article-card-body";
      body.textContent = article.body;
      const meta = document.createElement("p");
      meta.className = "article-card-meta";
      meta.textContent = "마지막 수정 " + formatArticleDate(article.updated_at || article.created_at);
      card.append(heading, body, meta);
      const sourceUrl = safeHttpUrl(article.source_url);
      if (sourceUrl) {
        const sourceLink = document.createElement("a");
        sourceLink.className = "article-source-link";
        sourceLink.href = sourceUrl;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = "출처 열기 ↗";
        card.appendChild(sourceLink);
      }
      if (isWriter && currentUser && article.author_id === currentUser.id) {
        const actions = document.createElement("div");
        actions.className = "article-card-actions";
        const edit = document.createElement("button");
        edit.type = "button";
        edit.dataset.articleAction = "edit";
        edit.dataset.articleId = article.id;
        edit.textContent = "수정";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.dataset.articleAction = "delete";
        remove.dataset.articleId = article.id;
        remove.textContent = "삭제";
        actions.append(edit, remove);
        card.appendChild(actions);
      }
      articleList.appendChild(card);
    });
  }

  async function loadArticles(nodeId) {
    const loadToken = ++articleLoadToken;
    if (!supabaseClient) {
      setArticleMessage("온라인 글 기능을 연결하면 등록된 안내가 여기에 보여요.");
      return;
    }
    articleList.replaceChildren();
    const loading = document.createElement("p");
    loading.className = "article-empty";
    loading.textContent = "안내를 불러오는 중이에요…";
    articleList.appendChild(loading);
    articleCount.textContent = "…";

    const result = await supabaseClient
      .from("school_articles")
      .select("id,node_id,title,body,source_url,published,author_id,created_at,updated_at")
      .eq("node_id", nodeId)
      .order("updated_at", { ascending: false });
    if (loadToken !== articleLoadToken || selectedId !== nodeId) return;
    if (result.error) {
      setArticleMessage("안내를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.");
      return;
    }
    renderArticles(result.data || []);
  }

  function resetArticleEditor() {
    if (!articleForm) return;
    articleForm.reset();
    articleForm.hidden = true;
    editingArticleId = null;
    if (writerTools) writerTools.hidden = !isWriter;
  }

  function resetChildNodeEditor() {
    if (!childNodeForm) return;
    childNodeForm.reset();
    childNodeForm.hidden = true;
    childNodeParentId = null;
    if (writerTools) writerTools.hidden = !isWriter;
  }

  function openArticleEditor(article) {
    if (!currentUser) {
      showToast("글을 쓰려면 Google 로그인을 해 주세요.");
      return;
    }
    if (!isWriter) {
      showToast("관리자가 글쓰기를 허용한 기간에만 작성할 수 있어요.");
      return;
    }
    resetChildNodeEditor();
    editingArticleId = article ? article.id : null;
    document.getElementById("article-title").value = article ? article.title : "";
    document.getElementById("article-body").value = article ? article.body : "";
    document.getElementById("article-source").value = article ? (article.source_url || "") : "";
    document.getElementById("article-published").checked = article ? Boolean(article.published) : true;
    writerTools.hidden = true;
    articleForm.hidden = false;
    document.getElementById("article-title").focus();
  }

  function openChildNodeEditor() {
    if (!currentUser) {
      showToast("하위 노드를 추가하려면 Google 로그인을 해 주세요.");
      return;
    }
    if (!isWriter) {
      showToast("관리자가 글쓰기를 허용한 기간에만 하위 노드를 추가할 수 있어요.");
      return;
    }
    const parent = nodeIndex.get(selectedId);
    if (!parent) return;
    resetArticleEditor();
    childNodeParentId = parent.id;
    childNodeParentLabel.textContent = "상위 노드: " + parent.title;
    writerTools.hidden = true;
    childNodeForm.hidden = false;
    document.getElementById("child-node-title").focus();
  }

  async function loadCustomMapNodes(preferredSelectionId) {
    if (!supabaseClient) return false;
    const loadToken = ++customNodeLoadToken;
    const result = await supabaseClient
      .from("school_map_nodes")
      .select("id,parent_node_id,title,summary,guidance,source_url,author_id,created_at")
      .order("created_at", { ascending: true });
    if (loadToken !== customNodeLoadToken) return false;
    if (result.error) {
      customMapNodes = [];
      renderTree();
      applyCollapseState();
      const nextId = nodeIndex.has(selectedId) ? selectedId : "home";
      selectNode(nextId);
      const missingTable = result.error.code === "42P01" || result.error.code === "PGRST205";
      if (!missingTable) showToast("추가 노드를 불러오지 못했어요. Supabase 권한을 확인해 주세요.");
      return false;
    }
    customMapNodes = result.data || [];
    renderTree();
    applyCollapseState();
    const nextId = preferredSelectionId && nodeIndex.has(preferredSelectionId)
      ? preferredSelectionId
      : (nodeIndex.has(selectedId) ? selectedId : "home");
    selectNode(nextId);
    return true;
  }

  function applyWritingSettings(settings) {
    writingSettings = settings || { starts_at: null, ends_at: null, enabled: false, is_open: false };
    writingIsOpen = Boolean(writingSettings.is_open);
    writingStartInput.value = formatKstDateTime(writingSettings.starts_at);
    writingEndInput.value = formatKstDateTime(writingSettings.ends_at);
    writingToggleButton.textContent = writingSettings.enabled ? "작성 허용 중지" : "작성 허용 시작";
    if (writingSettings.is_open) {
      writingPeriodStatus.textContent = "현재 작성 허용 중이에요.";
    } else if (writingSettings.enabled && writingSettings.starts_at && new Date(writingSettings.starts_at) > new Date()) {
      writingPeriodStatus.textContent = "예약된 시작 시각: " + formatKstLabel(writingSettings.starts_at);
    } else if (writingSettings.enabled && writingSettings.ends_at && new Date(writingSettings.ends_at) <= new Date()) {
      writingPeriodStatus.textContent = "설정한 작성 기간이 끝났어요.";
    } else {
      writingPeriodStatus.textContent = "현재 작성이 중지되어 있어요.";
    }
  }

  async function loadAdminWritingSettings(openDialog) {
    if (!isAdmin || !supabaseClient) return;
    const result = await supabaseClient.rpc("get_article_writing_settings");
    if (result.error) {
      showToast("관리자 기간 설정을 불러오지 못했어요.");
      return;
    }
    applyWritingSettings(result.data);
    setSignedInUser(currentUser, writingIsOpen && isGoogleUser, true);
    loadArticles(selectedId);
    if (openDialog && !adminSettingsDialog.open) adminSettingsDialog.showModal();
  }

  function getSavedPeriod() {
    return {
      starts_at: writingSettings && writingSettings.starts_at ? writingSettings.starts_at : null,
      ends_at: writingSettings && writingSettings.ends_at ? writingSettings.ends_at : null
    };
  }

  async function saveWritingSettings(period, enabled) {
    if (!isAdmin || !supabaseClient) return false;
    const result = await supabaseClient.rpc("set_article_writing_settings", {
      p_starts_at: period.starts_at,
      p_ends_at: period.ends_at,
      p_enabled: enabled
    });
    if (result.error) {
      showToast("기간을 저장하지 못했어요. 시작·종료 시각을 확인해 주세요.");
      return false;
    }
    applyWritingSettings(result.data);
    setSignedInUser(currentUser, writingIsOpen && isGoogleUser, true);
    loadArticles(selectedId);
    return true;
  }

  function setSignedInUser(user, writer, admin) {
    currentUser = user || null;
    isWriter = Boolean(user && writer && isGoogleUser);
    isAdmin = Boolean(user && admin);
    if (authUserLabel) {
      authUserLabel.textContent = user ? (user.email || "로그인됨") : "";
      authUserLabel.hidden = !user;
    }
    loginButton.hidden = Boolean(user);
    logoutButton.hidden = !user;
    adminSettingsButton.hidden = !isAdmin;
    writerTools.hidden = !isWriter;
    if (writingStatus) {
      writingStatus.hidden = !user;
      writingStatus.textContent = writingIsOpen
        ? "현재 글쓰기 기간이에요. 로그인한 사용자는 안내 글을 작성할 수 있어요."
        : "현재 글쓰기 기간이 아니에요. 안내는 계속 읽을 수 있어요.";
    }
    if (!isWriter) {
      articleForm.hidden = true;
      editingArticleId = null;
      childNodeForm.hidden = true;
      childNodeParentId = null;
    }
    if (!user && adminSettingsDialog.open) adminSettingsDialog.close();
  }

  let authStateToken = 0;
  async function handleAuthSession(session) {
    const token = ++authStateToken;
    const user = session && session.user ? session.user : null;
    if (!user) {
      isGoogleUser = false;
      writingIsOpen = false;
      writingSettings = null;
      setSignedInUser(null, false, false);
      await loadCustomMapNodes();
      if (token !== authStateToken) return;
      return;
    }
    const results = await Promise.all([
      supabaseClient.rpc("is_article_admin"),
      supabaseClient.rpc("is_article_writing_open"),
      supabaseClient.rpc("is_google_authenticated_user")
    ]);
    if (token !== authStateToken) return;
    isAdmin = !results[0].error && results[0].data === true;
    writingIsOpen = !results[1].error && results[1].data === true;
    isGoogleUser = !results[2].error && results[2].data === true;
    setSignedInUser(user, writingIsOpen && isGoogleUser, isAdmin);
    await loadCustomMapNodes();
    if (token !== authStateToken) return;
    if (results[0].error || results[1].error || results[2].error) showToast("로그인은 됐지만 글쓰기 상태를 확인하지 못했어요.");
    else if (!isGoogleUser) showToast("글을 쓰려면 Google 계정으로 로그인해 주세요.");
    else if (!writingIsOpen) showToast("로그인했어요. 현재 글쓰기 기간은 닫혀 있어요.");
  }

  async function refreshWritingAvailability() {
    if (!supabaseClient || !currentUser) return;
    const result = await supabaseClient.rpc("is_article_writing_open");
    if (result.error) return;
    const open = result.data === true;
    if (open !== writingIsOpen) {
      writingIsOpen = open;
      setSignedInUser(currentUser, open && isGoogleUser, isAdmin);
      loadArticles(selectedId);
    }
  }

  function initializeBackend() {
    const hasConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
    if (!hasConfig || !window.supabase || typeof window.supabase.createClient !== "function") {
      loginButton.addEventListener("click", function () {
        showToast("Google 로그인을 사용하려면 Supabase 설정을 확인해 주세요.");
      });
      logoutButton.hidden = true;
      writerTools.hidden = true;
      adminSettingsButton.hidden = true;
      return;
    }

    supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    loginButton.addEventListener("click", async function () {
      if (window.location.protocol === "file:") {
        showToast("Google 로그인은 localhost 또는 HTTPS 주소에서 열어야 해요.");
        return;
      }
      const result = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.href,
          queryParams: { prompt: "select_account" }
        }
      });
      if (result.error) showToast("로그인 화면을 열지 못했어요. OAuth 설정을 확인해 주세요.");
    });
    logoutButton.addEventListener("click", async function () {
      const result = await supabaseClient.auth.signOut();
      if (result.error) showToast("로그아웃하지 못했어요. 다시 시도해 주세요.");
      else showToast("로그아웃했어요.");
    });
    adminSettingsButton.addEventListener("click", function () { loadAdminWritingSettings(true); });
    adminSettingsClose.addEventListener("click", function () { adminSettingsDialog.close(); });
    adminWritingForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const period = getWritingPeriodFromInputs();
      if (!period) return;
      const saved = await saveWritingSettings(period, Boolean(writingSettings && writingSettings.enabled));
      if (saved) showToast("작성 기간을 저장했어요. (한국시간)");
    });
    writingToggleButton.addEventListener("click", async function () {
      if (!isAdmin) return;
      const enabled = !Boolean(writingSettings && writingSettings.enabled);
      const period = enabled ? getWritingPeriodFromInputs() : getSavedPeriod();
      if (!period) return;
      const saved = await saveWritingSettings(period, enabled);
      if (!saved) return;
      if (!enabled) showToast("글쓰기를 중지했어요.");
      else if (writingIsOpen) showToast("글쓰기를 허용했어요.");
      else showToast("작성 허용을 예약했어요. 시작 시각이 되면 글을 쓸 수 있어요.");
    });
    supabaseClient.auth.onAuthStateChange(function (_event, session) {
      window.setTimeout(function () { handleAuthSession(session); }, 0);
    });
    supabaseClient.auth.getSession().then(function (result) {
      if (result.error) showToast("로그인 상태를 확인하지 못했어요.");
      else handleAuthSession(result.data.session);
    });
    window.setInterval(refreshWritingAvailability, 60000);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) refreshWritingAvailability();
    });
  }

  newArticleButton.addEventListener("click", function () { openArticleEditor(null); });
  document.getElementById("cancel-article-button").addEventListener("click", resetArticleEditor);
  newChildNodeButton.addEventListener("click", openChildNodeEditor);
  document.getElementById("cancel-child-node-button").addEventListener("click", resetChildNodeEditor);
  childNodeForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!currentUser) {
      showToast("하위 노드를 추가하려면 Google 로그인을 해 주세요.");
      return;
    }
    if (!isWriter) {
      showToast("관리자가 글쓰기를 허용한 기간에만 하위 노드를 추가할 수 있어요.");
      return;
    }
    if (!supabaseClient || !childNodeParentId) return;
    const title = document.getElementById("child-node-title").value.trim();
    const summary = document.getElementById("child-node-summary").value.trim();
    const guidance = document.getElementById("child-node-guidance").value.trim();
    const source = document.getElementById("child-node-source").value.trim();
    const sourceUrl = source ? safeHttpUrl(source) : null;
    if (!title || !summary) {
      showToast("하위 노드 이름과 짧은 설명을 입력해 주세요.");
      return;
    }
    if (source && !sourceUrl) {
      showToast("출처 링크는 http 또는 https 주소를 입력해 주세요.");
      return;
    }
    const payload = {
      parent_node_id: childNodeParentId,
      title: title,
      summary: summary,
      guidance: guidance,
      source_url: sourceUrl
    };
    const saveButton = childNodeForm.querySelector('[type="submit"]');
    saveButton.disabled = true;
    const result = await supabaseClient.from("school_map_nodes").insert(payload).select("id").single();
    saveButton.disabled = false;
    if (result.error) {
      const missingTable = result.error.code === "42P01" || result.error.code === "PGRST205";
      if (missingTable) showToast("하위 노드 테이블이 아직 없어요. Supabase SQL Editor에서 20261112_add_school_map_nodes.sql을 실행해 주세요.");
      else if (result.error.code === "42501") showToast("작성 기간이 닫혔거나 하위 노드를 추가할 권한이 없어요.");
      else showToast("하위 노드를 저장하지 못했어요. 상위 노드와 Supabase 설정을 확인해 주세요.");
      return;
    }
    childNodeForm.hidden = true;
    childNodeParentId = null;
    showToast("하위 노드를 추가했어요.");
    await loadCustomMapNodes(result.data && result.data.id);
  });
  articleForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!currentUser) {
      showToast("글을 쓰려면 Google 로그인을 해 주세요.");
      return;
    }
    if (!isWriter) {
      showToast("관리자가 글쓰기를 허용한 기간에만 작성할 수 있어요.");
      return;
    }
    if (!supabaseClient) return;
    const title = document.getElementById("article-title").value.trim();
    const body = document.getElementById("article-body").value.trim();
    const source = document.getElementById("article-source").value.trim();
    const sourceUrl = source ? safeHttpUrl(source) : null;
    if (source && !sourceUrl) {
      showToast("출처 링크는 http 또는 https 주소를 입력해 주세요.");
      return;
    }
    const payload = {
      node_id: selectedId,
      title: title,
      body: body,
      source_url: sourceUrl,
      published: document.getElementById("article-published").checked
    };
    const saveButton = articleForm.querySelector('[type="submit"]');
    saveButton.disabled = true;
    let result;
    if (editingArticleId) {
      result = await supabaseClient.from("school_articles").update(payload).eq("id", editingArticleId);
    } else {
      payload.author_id = currentUser.id;
      result = await supabaseClient.from("school_articles").insert(payload);
    }
    saveButton.disabled = false;
    if (result.error) {
      showToast("저장하지 못했어요. 권한과 연결 설정을 확인해 주세요.");
      return;
    }
    resetArticleEditor();
    showToast("안내를 저장했어요.");
    loadArticles(selectedId);
  });

  articleList.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-article-action]");
    if (!button || !isWriter) return;
    const article = currentArticles.find(function (item) { return item.id === button.dataset.articleId; });
    if (!article) return;
    if (button.dataset.articleAction === "edit") {
      openArticleEditor(article);
      return;
    }
    if (button.dataset.articleAction === "delete" && window.confirm("이 안내 글을 삭제할까요?")) {
      const result = await supabaseClient.from("school_articles").delete().eq("id", article.id);
      if (result.error) showToast("삭제하지 못했어요. 권한과 연결 설정을 확인해 주세요.");
      else {
        showToast("안내를 삭제했어요.");
        loadArticles(selectedId);
      }
    }
  });

  function addContentBlock(container, label, text) {
    const labelElement = document.createElement("div");
    labelElement.className = "content-label";
    labelElement.textContent = label;
    const block = document.createElement("div");
    block.className = "guidance-block";
    const icon = document.createElement("span");
    icon.className = "guidance-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";
    const copy = document.createElement("p");
    copy.textContent = text;
    block.append(icon, copy);
    container.append(labelElement, block);
  }

  function getSearchableNodes() {
    const results = [];
    nodeIndex.forEach(function (node) {
      if (node.id === "home") return;
      const path = getNodePath(node);
      const pathLabel = path.map(function (item) { return item.title; }).join(" · ");
      results.push({
        node: node,
        category: pathLabel,
        searchable: [node.title, node.subtitle, node.summary, node.guidance, pathLabel].filter(Boolean).join(" ")
      });
    });
    return results;
  }

  function updateSearch() {
    const query = searchInput.value.trim().toLocaleLowerCase("ko");
    searchResults.replaceChildren();
    searchResults.hidden = !query;
    searchInput.setAttribute("aria-expanded", query ? "true" : "false");
    const searchable = getSearchableNodes();
    const matches = query ? searchable.filter(function (entry) { return entry.searchable.toLocaleLowerCase("ko").includes(query); }) : [];
    const matchingIds = new Set();
    matches.forEach(function (entry) {
      getNodePath(entry.node).forEach(function (node) { matchingIds.add(node.id); });
    });

    document.querySelectorAll(".map-node[data-node-id]").forEach(function (button) {
      const id = button.dataset.nodeId;
      button.classList.toggle("is-dimmed", Boolean(query && id !== "home" && !matchingIds.has(id)));
    });

    if (!query) return;
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "검색 결과가 없어요. 다른 단어를 입력해 보세요.";
      searchResults.appendChild(empty);
      return;
    }

    matches.slice(0, 8).forEach(function (entry) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "search-option";
      option.setAttribute("role", "option");
      option.dataset.nodeId = entry.node.id;
      const copy = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = entry.node.title;
      const category = document.createElement("small");
      category.textContent = entry.category;
      copy.append(title, category);
      const arrow = document.createElement("span");
      arrow.className = "search-option-arrow";
      arrow.textContent = "↗";
      option.append(copy, arrow);
      searchResults.appendChild(option);
    });
  }

  function setTheme(theme, persist) {
    const isNight = theme === "night";
    document.documentElement.dataset.theme = isNight ? "night" : "day";
    themeButton.setAttribute("aria-pressed", isNight ? "true" : "false");
    themeButton.setAttribute("aria-label", isNight ? "낮 모드로 전환" : "밤 모드로 전환");
    themeLabel.textContent = isNight ? "낮 모드" : "밤 모드";
    themeIcon.textContent = isNight ? "☀" : "☾";
    document.querySelector('meta[name="theme-color"]').content = isNight ? "#08182a" : "#f5f7f2";
    if (persist) {
      try { localStorage.setItem("seohyun-info-theme", isNight ? "night" : "day"); } catch (error) { /* Storage can be disabled for local files. */ }
    }
  }

  explorerLayout.addEventListener("click", function (event) {
    const mapNode = event.target.closest(".root-node, .category-node, .topic-node");
    if (suppressedDragClick && mapNode && mapNode.dataset.nodeId === suppressedDragClick) {
      event.preventDefault();
      suppressedDragClick = null;
      window.clearTimeout(suppressedDragClickTimer);
      return;
    }
    const button = event.target.closest("[data-node-id]");
    if (!button) return;
    scheduleNodeClick(button.dataset.nodeId);
  });

  explorerLayout.addEventListener("dblclick", function (event) {
    const button = event.target.closest("[data-node-id]");
    if (!button) return;
    event.preventDefault();
    clearPendingClick(button.dataset.nodeId);
    toggleNodeCollapse(button.dataset.nodeId);
  });

  explorerLayout.addEventListener("contextmenu", function (event) {
    const button = event.target.closest("[data-node-id]");
    if (!button) return;
    event.preventDefault();
    clearPendingClick(button.dataset.nodeId);
    toggleNodeCollapse(button.dataset.nodeId);
  });
  detailClose.addEventListener("click", closeDetail);

  mapViewport.addEventListener("wheel", function (event) {
    event.preventDefault();
    let delta = event.deltaY;
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= mapViewport.clientHeight;
    setMapZoom(mapZoom * Math.exp(-delta * 0.001), event.clientX, event.clientY);
  }, { passive: false });
  mapViewport.addEventListener("pointerdown", function (event) {
    if (event.pointerType !== "mouse" || event.button !== 0 || event.isPrimary === false) return;
    window.clearTimeout(suppressedDragClickTimer);
    suppressedDragClick = null;
    const node = event.target.closest(".root-node, .category-node, .topic-node");
    mapPan = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanOffsetX: mapPanOffsetX,
      startPanOffsetY: mapPanOffsetY,
      nodeId: node && node.dataset.nodeId,
      moved: false
    };
  });
  window.addEventListener("pointermove", function (event) {
    if (!mapPan || event.pointerId !== mapPan.pointerId) return;
    const deltaX = event.clientX - mapPan.startX;
    const deltaY = event.clientY - mapPan.startY;
    if (!mapPan.moved && Math.hypot(deltaX, deltaY) < 4) return;
    if (!mapPan.moved && mapPan.nodeId) clearPendingClick(mapPan.nodeId);
    mapPan.moved = true;
    mapViewport.classList.add("is-panning");
    mapPanOffsetX = mapPan.startPanOffsetX + deltaX;
    mapPanOffsetY = mapPan.startPanOffsetY + deltaY;
    syncMapZoomLayout();
    const selection = window.getSelection();
    if (selection && selection.rangeCount) selection.removeAllRanges();
    event.preventDefault();
  });
  function finishMapPan(event) {
    if (!mapPan || event.pointerId !== mapPan.pointerId) return;
    const finishedPan = mapPan;
    mapPan = null;
    mapViewport.classList.remove("is-panning");
    if (event.type === "pointerup" && finishedPan.moved && finishedPan.nodeId) {
      suppressedDragClick = finishedPan.nodeId;
      suppressedDragClickTimer = window.setTimeout(function () { suppressedDragClick = null; }, 400);
    }
  }
  window.addEventListener("pointerup", finishMapPan);
  window.addEventListener("pointercancel", finishMapPan);
  window.addEventListener("blur", function () {
    mapPan = null;
    mapViewport.classList.remove("is-panning");
  });
  mapZoomOut.addEventListener("click", function () { setMapZoom(mapZoom / 1.15); });
  mapZoomIn.addEventListener("click", function () { setMapZoom(mapZoom * 1.15); });
  mapZoomReset.addEventListener("click", function () {
    mapPanOffsetX = 0;
    mapPanOffsetY = 0;
    setMapZoom(1);
    syncMapZoomLayout();
    mapViewport.scrollLeft = 0;
    mapViewport.scrollTop = 0;
  });

  searchInput.addEventListener("input", updateSearch);
  searchResults.addEventListener("click", function (event) {
    const option = event.target.closest("[data-node-id]");
    if (!option) return;
    selectNode(option.dataset.nodeId, { openDetail: true });
    searchInput.value = "";
    updateSearch();
    searchInput.blur();
  });

  themeButton.addEventListener("click", function () {
    setTheme(document.documentElement.dataset.theme === "night" ? "day" : "night", true);
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".search-wrap")) {
      searchResults.hidden = true;
      searchInput.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      updateSearch();
      searchInput.blur();
    } else if (event.key === "Escape" && detailCard.classList.contains("is-open")) {
      closeDetail();
    }
  });

  themeButton.setAttribute("aria-pressed", "false");
  let storedTheme = "day";
  try {
    storedTheme = localStorage.getItem("seohyun-info-theme") || "day";
  } catch (error) { /* Storage can be disabled for local files. */ }
  setTheme(storedTheme, false);
  window.addEventListener("resize", function () {
    updateGraphLayout();
    requestAnimationFrame(drawConnections);
  });
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () {
      updateGraphLayout();
      requestAnimationFrame(drawConnections);
    }).observe(mapViewport);
  }

  renderTree();
  applyCollapseState();
  selectNode("home");
  initializeBackend();
})();
