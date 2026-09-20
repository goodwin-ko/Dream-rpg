// Dream RPG Item Crafting & Farming Helper
(function () {
  'use strict';

  // Alias & typo normalizer dictionary
  const ALIAS_MAP = {
    "천공의 성스로운 갑옷": "천공의 성스러운 갑옷",
    "여혼 정화의 성목": "영혼 정화의 성목",
    "빛의 그레 일린": "빛의 그레일린",
    "빛의 그러일런": "빛의 그레일린",
    "얼음 그림자 아퀄리스": "얼음 그림자 아퀼리스",
    "속세의 및-우키요에 두루마리": "속세의 빛-우키요에 두루마리",
    "속세의및-우키요에 두루마리": "속세의 빛-우키요에 두루마리",
    "피의문양": "피의 문양",
    "영혼정화의 성목": "영혼 정화의 성목",
    "암흑의 회환": "암흑의 회한",
    "별의정령 알갈론": "별의정령 알갈론",
    "별의 정령 알갈론": "별의정령 알갈론",
    "빛의 정령 알갈론": "별의정령 알갈론",
    "별의 정령 알칼론": "별의정령 알갈론",
    "전생의 천사 임페리우스": "전쟁의 천사 임페리우스",
    "전쟁의 전사 임페리우스": "전쟁의 천사 임페리우스",
    "셩역의 대사제": "성역의 대사제",
    "여왕 아즈사라": "아즈샤라 여왕",
    "여왕 아즈샤라": "아즈샤라 여왕",
    "작열하는 용 이그닐": "작열하는 용 이그니르",
    "빙하의 죽음벌래 형제": "빙하의 죽음 벌레",
    "빙하의 죽음벌레 형제": "빙하의 죽음 벌레",
    "빙하의 죽음벌레": "빙하의 죽음 벌레",
    "마리안느": "저주받은 인형 마리안느",
    "실프": "광풍의 실프",
    "화염의 만샤": "광염의 만샤",
    "망령 메르겔": "망령 메르켈",
    "혈마의 시체": "피의 시체",
    "용망의 눈": "욕망의 눈",
    "명하의 수정 가지": "명해의 수정 가지",
    "점염마의 피": "적염마의 피",
    "열세의 화염깃": "멸세의 화염깃",
    "얼음 환상 바닞": "얼음 환상 반지",
    "결울 빙모": "겨울 빙모",
    "만샤의 영혼 햇불": "만샤의 영혼 횃불",
    "혼돈의 결정": "혼돈의 혈정",
    "성령의 조각": "성령석 조각",
    "지옥볼의 핵": "지옥불의 핵",
    "파천의뇌석": "파천의 뇌석",
    "빅옹의 결정": "빙옥의 결정",
    "끝없는 어룸의 로브": "끝없는 어둠의 로브",
    "프로토스 왕관": "프로스트 왕관",
    "지옥투구": "지옥 투구",
    "혼동의 혈정": "혼돈의 혈정",
    "영혼 녹이는 화염 결정": "혼을 녹이는 화염 결정",
    "성스러운 및의 수호석": "성스러운 빛의 수호석",
    "영혼 구술의 족쇄": "영혼 구슬의 족쇄",
    "용의 격노-용혼갑옷": "용의 격노-용혼 갑옷",
    "잊힌 고대의 마나석": "잊힌 고대 마나석",
    "검은 쌍둥이 반지-성광 파편": "검은 쌍둥이 반지-섬광 파편",
    "붉은 화염 전투 세트": "붉은 화염 전투 셋트",
    "격노한 화염의 전쟁신 도끼": "격노한 화염의 전생신 도끼",
    "청공의 분노 뇌전홀": "천공의 분노 뇌전홀"
  };

  const CATEGORIES = ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"];

  function normalizeName(name) {
    if (!name) return "";
    const trimmed = String(name).trim();
    return ALIAS_MAP[trimmed] || trimmed;
  }

  // App State
  let gameData = null;
  let currentJob = "프리스트";
  let currentLoadout = {}; // { "무기": "...", "갑옷": "...", ... }
  let currentTab = "tree"; // "tree", "boss-route", "codex", "gear-codex"
  let currentSlot = "ALL";
  let currentViewMode = "tree"; // "tree" or "flow"
  let checkedNodes = new Set();
  let userInventory = {}; // { [itemName: string]: number }

  // Filter States
  let showOnlyRemaining = true;
  let sideSearchQuery = "";
  let sideLevelFilter = "ALL";
  let sideSlotSync = false;
  let sidePanelMode = "sticky";
  let isAllCollapsed = false;
  let invCollapsed = false;

  // Gear Codex Tab States
  let gearCodexCat = "무기";
  let gearCodexSynergyOnly = false;
  let gearCodexSearchQuery = "";
  let weaponSubFilter = "ALL"; // "ALL" | "근접무기" | "원거리무기" | "지팡이"

  // Modal State
  let modalSlot = "무기";
  let modalSearchQuery = "";
  let modalWeaponSubFilter = "ALL";

  // DOM Elements
  const jobSelect = document.getElementById("jobSelect");
  const navTabs = document.querySelectorAll(".tab-btn");
  const slotButtons = document.querySelectorAll(".slot-btn");
  const viewModeButtons = document.querySelectorAll(".view-mode-btn");
  const tabContents = {
    tree: document.getElementById("tabTreeContent"),
    bossRoute: document.getElementById("tabBossRouteContent"),
    codex: document.getElementById("tabCodexContent"),
    gearCodex: document.getElementById("tabGearCodexContent")
  };
  const btnResetChecks = document.getElementById("btnResetChecks");
  const btnOpenUpload = document.getElementById("btnOpenUpload");
  const uploadModal = document.getElementById("uploadModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const dropZone = document.getElementById("dropZone");
  const excelFileInput = document.getElementById("excelFileInput");

  // Global Search Elements
  const globalSearchInput = document.getElementById("globalSearchInput");
  const btnClearSearch = document.getElementById("btnClearSearch");
  const globalSearchResults = document.getElementById("globalSearchResults");

  // Progress Banner Elements
  const overallProgressFill = document.getElementById("overallProgressFill");
  const overallProgressText = document.getElementById("overallProgressText");
  const loadoutJobName = document.getElementById("loadoutJobName");

  // Side Panel Elements
  const btnToggleCompleted = document.getElementById("btnToggleCompleted");
  const btnToggleSideSync = document.getElementById("btnToggleSideSync");
  const btnToggleCollapseAll = document.getElementById("btnToggleCollapseAll");
  const btnTogglePanelMode = document.getElementById("btnTogglePanelMode");
  const sideSearchInput = document.getElementById("sideSearchInput");
  const sideLevelList = document.getElementById("sideLevelList");
  const sideLevelFilterButtons = document.querySelectorAll(".level-filter-btn");

  // Inventory Elements
  const invBody = document.getElementById("invBody");
  const invCountBadge = document.getElementById("invCountBadge");
  const btnAutoCheckFromInv = document.getElementById("btnAutoCheckFromInv");
  const btnToggleInvCollapse = document.getElementById("btnToggleInvCollapse");
  const invItemSearch = document.getElementById("invItemSearch");
  const invItemQty = document.getElementById("invItemQty");
  const btnAddInvItem = document.getElementById("btnAddInvItem");
  const invSearchSuggestions = document.getElementById("invSearchSuggestions");
  const invQuickChips = document.getElementById("invQuickChips");
  const invItemsList = document.getElementById("invItemsList");

  // Gear Modal Elements
  const gearSelectModal = document.getElementById("gearSelectModal");
  const gearSelectModalTitle = document.getElementById("gearSelectModalTitle");
  const gearModalSlotBadge = document.getElementById("gearModalSlotBadge");
  const btnCloseGearModal = document.getElementById("btnCloseGearModal");
  const gearModalSearch = document.getElementById("gearModalSearch");
  const gearModalSynergyNote = document.getElementById("gearModalSynergyNote");
  const gearSelectList = document.getElementById("gearSelectList");

  // Tab 4 Gear Codex Elements
  const gearCatButtons = document.querySelectorAll(".gear-cat-btn");
  const gearCodexSearch = document.getElementById("gearCodexSearch");
  const chkSynergyOnly = document.getElementById("chkSynergyOnly");
  const currentJobSynergyLabel = document.getElementById("currentJobSynergyLabel");
  const gearCodexGrid = document.getElementById("gearCodexGrid");

  // Initialize
  function init() {
    loadGameData();
    restoreSavedState();
    loadActiveLoadout();
    loadCheckedNodes();
    loadInventory();
    renderJobSelector();
    bindEvents();
    restoreUIState();
    renderAll();
  }

  function loadGameData() {
    let savedData = null;
    const saved = localStorage.getItem("dream_custom_data");
    if (saved) {
      try {
        savedData = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved game data:", e);
      }
    }

    if (window.PRELOADED_GAME_DATA) {
      gameData = window.PRELOADED_GAME_DATA;
      if (savedData && savedData.jobs) {
        Object.keys(savedData.jobs).forEach(job => {
          if (!gameData.jobs[job]) {
            gameData.jobs[job] = savedData.jobs[job];
            if (!gameData.job_list.includes(job)) gameData.job_list.push(job);
          }
        });
      }
    } else if (savedData) {
      gameData = savedData;
    }

    if (!gameData) {
      alert("게임 데이터를 불러올 수 없습니다. dream01.xlsx 파일을 업로드해주세요.");
    }
  }

  function restoreSavedState() {
    try {
      const savedJob = localStorage.getItem("dream_selected_job");
      if (savedJob && gameData && gameData.jobs && gameData.jobs[savedJob]) {
        currentJob = savedJob;
      } else if (gameData && gameData.jobs && !gameData.jobs[currentJob]) {
        currentJob = Object.keys(gameData.jobs)[0] || "프리스트";
      }

      const savedTab = localStorage.getItem("dream_selected_tab");
      if (savedTab && tabContents[savedTab === "boss-route" ? "bossRoute" : (savedTab === "gear-codex" ? "gearCodex" : savedTab)]) {
        currentTab = savedTab;
      }

      const savedSlot = localStorage.getItem("dream_selected_slot");
      if (savedSlot) currentSlot = savedSlot;

      const savedViewMode = localStorage.getItem("dream_selected_view_mode");
      if (savedViewMode) currentViewMode = savedViewMode;

      const savedRemaining = localStorage.getItem("dream_show_only_remaining");
      if (savedRemaining !== null) showOnlyRemaining = JSON.parse(savedRemaining);

      const savedSideFilter = localStorage.getItem("dream_side_level_filter");
      if (savedSideFilter) sideLevelFilter = savedSideFilter;

      const savedSideSlotSync = localStorage.getItem("dream_side_slot_sync");
      if (savedSideSlotSync !== null) sideSlotSync = JSON.parse(savedSideSlotSync);

      const savedSidePanelMode = localStorage.getItem("dream_side_panel_mode");
      if (savedSidePanelMode) sidePanelMode = savedSidePanelMode;

      const savedInvCollapsed = localStorage.getItem("dream_inv_collapsed");
      if (savedInvCollapsed !== null) invCollapsed = JSON.parse(savedInvCollapsed);
    } catch (e) {
      console.error("Failed to restore saved state:", e);
    }
  }

  function loadActiveLoadout() {
    currentLoadout = {};
    const jobData = getJobData();
    const defaultLoadout = (jobData && jobData.default_loadout) ? jobData.default_loadout : {};

    try {
      const saved = localStorage.getItem("dream_rpg_loadout_" + currentJob);
      if (saved) {
        currentLoadout = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load loadout:", e);
    }

    CATEGORIES.forEach(slot => {
      if (!currentLoadout[slot]) {
        currentLoadout[slot] = defaultLoadout[slot] || 
          (gameData && gameData.category_gear && gameData.category_gear[slot] && gameData.category_gear[slot].top_gear[0]) || "";
      }
    });
  }

  function saveActiveLoadout() {
    try {
      localStorage.setItem("dream_rpg_loadout_" + currentJob, JSON.stringify(currentLoadout));
    } catch (e) {
      console.error("Failed to save loadout:", e);
    }
  }

  function loadCheckedNodes() {
    try {
      const key = "dream_v2_checked_nodes_" + currentJob;
      const saved = localStorage.getItem(key);
      checkedNodes = new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.error("Failed to load checked nodes:", e);
      checkedNodes = new Set();
    }
  }

  function saveCheckedNodes() {
    try {
      const key = "dream_v2_checked_nodes_" + currentJob;
      localStorage.setItem(key, JSON.stringify(Array.from(checkedNodes)));
    } catch (e) {
      console.error("Failed to save checked nodes:", e);
    }
  }

  function loadInventory() {
    try {
      const saved = localStorage.getItem("dream_rpg_inventory");
      userInventory = saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load inventory:", e);
      userInventory = {};
    }
  }

  function saveInventory() {
    try {
      localStorage.setItem("dream_rpg_inventory", JSON.stringify(userInventory));
    } catch (e) {
      console.error("Failed to save inventory:", e);
    }
  }

  function getJobData() {
    if (!gameData || !gameData.jobs) return null;
    return gameData.jobs[currentJob] || null;
  }

  function getRecipe(name) {
    if (!gameData) return null;
    const clean = normalizeName(name);
    if (gameData.global_recipe_map && gameData.global_recipe_map[clean]) {
      return gameData.global_recipe_map[clean];
    }
    const jobData = getJobData();
    if (jobData && jobData.recipe_map && jobData.recipe_map[clean]) {
      return jobData.recipe_map[clean];
    }
    return null;
  }

  function restoreUIState() {
    if (jobSelect) jobSelect.value = currentJob;
    if (loadoutJobName) loadoutJobName.textContent = currentJob;
    if (currentJobSynergyLabel) currentJobSynergyLabel.textContent = currentJob;

    navTabs.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === currentTab);
    });

    Object.keys(tabContents).forEach(key => {
      if (tabContents[key]) tabContents[key].style.display = "none";
    });
    if (currentTab === "tree" && tabContents.tree) tabContents.tree.style.display = "block";
    else if (currentTab === "boss-route" && tabContents.bossRoute) tabContents.bossRoute.style.display = "block";
    else if (currentTab === "codex" && tabContents.codex) tabContents.codex.style.display = "block";
    else if (currentTab === "gear-codex" && tabContents.gearCodex) tabContents.gearCodex.style.display = "block";

    slotButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.slot === currentSlot);
    });

    viewModeButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === currentViewMode);
    });

    if (btnToggleCompleted) {
      btnToggleCompleted.classList.toggle("active", showOnlyRemaining);
      btnToggleCompleted.textContent = showOnlyRemaining ? "남은 것만 보기" : "전체 재료 보기";
    }

    if (btnToggleSideSync) {
      btnToggleSideSync.classList.toggle("active", sideSlotSync);
      btnToggleSideSync.textContent = sideSlotSync ? "선택 부위만 보기" : "선택 부위 연동";
    }

    if (btnTogglePanelMode) {
      btnTogglePanelMode.classList.toggle("active", sidePanelMode === "expanded");
      btnTogglePanelMode.textContent = sidePanelMode === "expanded" ? "📜 전체 펼침" : "📌 화면 고정";
    }

    const sidePanelEl = document.querySelector(".side-panel-sticky");
    if (sidePanelEl) {
      sidePanelEl.classList.toggle("mode-expanded", sidePanelMode === "expanded");
    }

    sideLevelFilterButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.range === sideLevelFilter);
    });

    if (invBody && btnToggleInvCollapse) {
      invBody.classList.toggle("collapsed", invCollapsed);
      btnToggleInvCollapse.textContent = invCollapsed ? "펼치기" : "접기";
    }
    updateInvBarHeight();
  }

  function updateInvBarHeight() {
    const el = document.getElementById("tab1StickyTop");
    if (el && el.offsetHeight > 0) {
      document.documentElement.style.setProperty("--tab1-top-height", `${el.offsetHeight}px`);
    } else {
      const tab1H = invCollapsed ? "96px" : "200px";
      document.documentElement.style.setProperty("--tab1-top-height", tab1H);
    }
    const h = invCollapsed ? "44px" : "145px";
    document.documentElement.style.setProperty("--inv-bar-height", h);
  }

  function renderJobSelector() {
    if (!jobSelect || !gameData) return;
    jobSelect.innerHTML = "";

    const availableJobs = Object.keys(gameData.jobs || {});
    const allJobs = gameData.all_job_list || availableJobs;

    const optgroupAvailable = document.createElement("optgroup");
    optgroupAvailable.label = "준비된 직업 (시너지 및 6부위 추천 활성화)";
    availableJobs.forEach(job => {
      const opt = document.createElement("option");
      opt.value = job;
      opt.textContent = `★ ${job}`;
      if (job === currentJob) opt.selected = true;
      optgroupAvailable.appendChild(opt);
    });
    jobSelect.appendChild(optgroupAvailable);

    const otherJobs = allJobs.filter(j => !availableJobs.includes(j));
    if (otherJobs.length > 0) {
      const optgroupOthers = document.createElement("optgroup");
      optgroupOthers.label = "대기 중인 직업";
      otherJobs.forEach(job => {
        const opt = document.createElement("option");
        opt.value = job;
        opt.textContent = `${job} (업데이트 예정)`;
        opt.disabled = true;
        optgroupOthers.appendChild(opt);
      });
      jobSelect.appendChild(optgroupOthers);
    }
  }

  // Get leaf materials for an item
  function getLeafMaterials(rootItemName, slot) {
    const leaves = [];
    if (!rootItemName) return leaves;

    const rootRecipe = getRecipe(rootItemName);
    // If root item itself is a boss drop item (0 craft materials)
    if (rootRecipe && (rootRecipe.is_drop || (!rootRecipe.materials || rootRecipe.materials.length === 0))) {
      const boss = rootRecipe.drop_boss || (gameData && gameData.item_to_boss && gameData.item_to_boss[rootItemName] && gameData.item_to_boss[rootItemName].boss) || "";
      if (boss) {
        const lvl = rootRecipe.drop_level || rootRecipe.level || 0;
        leaves.push({
          id: `${slot}__${rootItemName}__drop__1`,
          slot: slot,
          parentRecipe: rootItemName,
          rootItem: rootItemName,
          path: `${slot}: ${rootItemName}`,
          name: rootItemName,
          qty: 1,
          boss: boss,
          level: lvl,
          level_str: rootRecipe.level_str || (lvl ? `Lv.${lvl}` : ""),
          location: rootRecipe.drop_location || "",
          is_drop: true
        });
        return leaves;
      }
    }

    function traverse(itemName, currentPath, pathDisplay) {
      const recipe = getRecipe(itemName);
      if (!recipe || !recipe.materials || recipe.materials.length === 0) return;

      recipe.materials.forEach((mat, idx) => {
        const subRecipe = getRecipe(mat.name);
        const isCombo = (mat.boss === "조합템" || !!subRecipe) && subRecipe && subRecipe.materials && subRecipe.materials.length > 0 && !subRecipe.is_drop;
        const nextCurrentPath = [...currentPath, `${mat.name}#${idx}`];
        const nextPathDisplay = `${pathDisplay} > ${mat.name}`;

        if (isCombo) {
          traverse(mat.name, nextCurrentPath, nextPathDisplay);
        } else {
          const nodeId = nextCurrentPath.join("__");
          const boss = (mat.boss && mat.boss !== "조합템") ? mat.boss : (subRecipe && subRecipe.drop_boss ? subRecipe.drop_boss : (mat.boss || "조합템"));
          const lvl = mat.level || (subRecipe ? (subRecipe.drop_level || subRecipe.level) : 0);
          const lvlStr = mat.level_str || (subRecipe ? subRecipe.level_str : (lvl ? `Lv.${lvl}` : ""));
          const loc = mat.location || (subRecipe ? subRecipe.drop_location : "");

          leaves.push({
            id: nodeId,
            slot: slot,
            parentRecipe: recipe.name,
            rootItem: rootItemName,
            path: nextPathDisplay,
            name: mat.name,
            qty: mat.qty || 1,
            boss: boss,
            level: lvl,
            level_str: lvlStr,
            location: loc,
            is_drop: !!(mat.is_drop || (subRecipe && subRecipe.is_drop))
          });
        }
      });
    }

    traverse(rootItemName, [slot, rootItemName], `${slot}: ${rootItemName}`);
    return leaves;
  }

  // Get all leaf descendants under an arbitrary subtree node
  function getSubtreeLeaves(itemName, slot, currentPath, pathDisplay) {
    const leaves = [];
    const targetRec = getRecipe(itemName);
    if (!targetRec) return leaves;

    if (targetRec.is_drop || (!targetRec.materials || targetRec.materials.length === 0)) {
      leaves.push({
        id: currentPath.join("__"),
        name: itemName
      });
      return leaves;
    }

    function traverse(name, path, disp) {
      const rec = getRecipe(name);
      if (!rec || !rec.materials || rec.materials.length === 0) return;

      rec.materials.forEach((m, idx) => {
        const sub = getRecipe(m.name);
        const isCombo = (m.boss === "조합템" || !!sub) && sub && sub.materials && sub.materials.length > 0 && !sub.is_drop;
        const nextPath = [...path, `${m.name}#${idx}`];
        const nextDisp = `${disp} > ${m.name}`;

        if (isCombo) {
          traverse(m.name, nextPath, nextDisp);
        } else {
          leaves.push({
            id: nextPath.join("__"),
            name: m.name
          });
        }
      });
    }

    traverse(itemName, currentPath, pathDisplay);
    return leaves;
  }

  // Get all leaves across the current 6-slot loadout
  function getAllCurrentLeaves() {
    const allLeaves = [];
    CATEGORIES.forEach(slot => {
      const topItem = currentLoadout[slot];
      if (topItem) {
        const leaves = getLeafMaterials(topItem, slot);
        allLeaves.push(...leaves);
      }
    });
    return allLeaves;
  }

  // Master Render Function
  function renderAll() {
    updateProgressStats();
    renderInventory();

    if (currentTab === "tree") {
      renderTreeTab();
      renderSideLevelList();
    } else if (currentTab === "boss-route") {
      renderBossRouteTab();
    } else if (currentTab === "codex") {
      renderCodexTab();
    } else if (currentTab === "gear-codex") {
      renderGearCodexTab();
    }
  }

  function updateProgressStats() {
    let totalNodes = 0;
    let checkedCount = 0;

    CATEGORIES.forEach(slot => {
      const topItem = currentLoadout[slot];
      const leaves = topItem ? getLeafMaterials(topItem, slot) : [];
      let slotTotal = leaves.length;
      let slotChecked = 0;

      leaves.forEach(leaf => {
        if (checkedNodes.has(leaf.id)) slotChecked++;
      });

      totalNodes += slotTotal;
      checkedCount += slotChecked;

      const slotBtn = document.querySelector(`.slot-btn[data-slot="${slot}"]`);
      if (slotBtn) {
        const badge = slotBtn.querySelector(".slot-badge-count");
        if (badge) {
          const pct = slotTotal > 0 ? Math.round((slotChecked / slotTotal) * 100) : 0;
          badge.textContent = `${pct}%`;
        }
      }
    });

    const allBtn = document.querySelector(`.slot-btn[data-slot="ALL"]`);
    if (allBtn) {
      const badge = allBtn.querySelector(".slot-badge-count");
      if (badge) {
        const pct = totalNodes > 0 ? Math.round((checkedCount / totalNodes) * 100) : 0;
        badge.textContent = `${pct}%`;
      }
    }

    const overallPct = totalNodes > 0 ? Math.round((checkedCount / totalNodes) * 100) : 0;
    if (overallProgressFill) overallProgressFill.style.width = `${overallPct}%`;
    if (overallProgressText) {
      overallProgressText.innerHTML = `전체 파밍 진행률: <strong>${overallPct}%</strong> (보유 재료: ${checkedCount} / 총 필요: ${totalNodes})`;
    }
  }

  // =========================================================================
  // Tab 1: Crafting Tree View
  // =========================================================================
  function renderTreeTab() {
    const container = document.getElementById("gearGrid");
    if (!container) return;
    container.innerHTML = "";

    const slotsToShow = currentSlot === "ALL" ? CATEGORIES : [currentSlot];

    slotsToShow.forEach(slot => {
      const topItemName = currentLoadout[slot];
      if (!topItemName) return;

      const card = createGearCard(topItemName, slot);
      container.appendChild(card);
    });
  }

  function createGearCard(itemName, slot) {
    const card = document.createElement("div");
    card.className = `gear-card slot-${slot}`;

    const recipe = getRecipe(itemName);
    const leaves = getLeafMaterials(itemName, slot);
    let checkedInCard = 0;
    leaves.forEach(l => { if (checkedNodes.has(l.id)) checkedInCard++; });
    const pct = leaves.length > 0 ? Math.round((checkedInCard / leaves.length) * 100) : 0;

    const hasSynergy = recipe && recipe.synergy_jobs && recipe.synergy_jobs.includes(currentJob);
    const itemSynergy = recipe ? (recipe.synergy || recipe.special_effect || "") : "";
    const isDropItem = recipe && (recipe.is_drop || (leaves.length === 1 && leaves[0].is_drop && leaves[0].name === itemName));
    const itemLvlStr = recipe ? (recipe.level_str || (recipe.level ? `Lv.${recipe.level}` : "")) : "";

    const header = document.createElement("div");
    header.className = "gear-card-header";
    header.innerHTML = `
      <div class="gear-info">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="slot-tag ${slot}">${slot}</span>
          ${itemLvlStr ? `<span class="badge-level">${itemLvlStr}</span>` : ""}
          <h3 class="gear-title">${itemName}</h3>
          ${isDropItem ? `<span class="badge-drop-item">👹 보스 완제품 드랍</span>` : ""}
          ${hasSynergy ? `<span class="badge-synergy active">⭐ ${currentJob} 추천 [시너지: ${itemSynergy}]</span>` : (itemSynergy ? `<span class="badge-synergy other">✨ 시너지: ${itemSynergy}</span>` : "")}
          <button class="btn-change-gear" data-slot="${slot}" title="다른 장비로 변경">🔄 장비 변경</button>
        </div>
        ${itemSynergy ? `<div class="synergy-effect-box">✨ <strong>[특수직업효과]</strong> ${itemSynergy}</div>` : ""}
      </div>
      <div class="gear-card-actions">
        <span class="gear-progress-text">${leaves.length > 0 ? `달성률: <strong>${pct}%</strong> (${checkedInCard}/${leaves.length})` : `<span style="color: var(--text-muted); font-size: 0.85rem;">조합 정보 준비 중</span>`}</span>
        <button class="btn-toggle-tree" data-target="body-${slot}-${itemName.replace(/\s+/g, '_')}">펼치기/접기</button>
      </div>
    `;

    const body = document.createElement("div");
    body.className = "gear-card-body";
    body.id = `body-${slot}-${itemName.replace(/\s+/g, '_')}`;

    if (isDropItem) {
      const dropLeaf = leaves[0];
      const isChecked = dropLeaf && checkedNodes.has(dropLeaf.id);
      const dropBoss = (recipe && recipe.drop_boss) || (dropLeaf && dropLeaf.boss) || "보스";
      const dropLoc = (recipe && recipe.drop_location) || (dropLeaf && dropLeaf.location) || "";
      const dropLvlStr = (recipe && recipe.level_str) || (dropLeaf && dropLeaf.level_str) || itemLvlStr;

      const dropBox = document.createElement("div");
      dropBox.className = `gear-drop-card-box ${isChecked ? 'completed' : ''}`;
      dropBox.innerHTML = `
        <div class="gear-drop-header">
          <span class="gear-drop-title">👹 [보스 완제품 드랍] 이 장비는 제작이 아닌 보스 처치 시 직접 획득하는 아이템입니다.</span>
        </div>
        <div class="gear-drop-details">
          <div class="gear-drop-source">
            <span class="badge-boss" style="font-size: 0.95rem;">👹 드랍 보스: <strong>${dropBoss}</strong></span>
            ${dropLvlStr ? `<span class="badge-level" style="font-size: 0.9rem;">${dropLvlStr}</span>` : ""}
            ${dropLoc ? `<span class="boss-loc-tag" style="font-size: 0.9rem;">🗺️ ${dropLoc}</span>` : ""}
          </div>
          <div class="gear-drop-action">
            <label class="gear-drop-check-label">
              <input type="checkbox" class="tree-checkbox drop-gear-checkbox" ${isChecked ? "checked" : ""} />
              <span><strong>${itemName}</strong> 획득 완료 (${isChecked ? '보유 중 ✓' : '미보유 - 클릭하여 체크'})</span>
            </label>
            <button class="btn-view-boss-route" data-boss="${dropBoss}">🗺️ 드랍 보스 위치/정보 보기</button>
          </div>
        </div>
      `;

      const chk = dropBox.querySelector(".drop-gear-checkbox");
      chk.addEventListener("change", () => {
        if (dropLeaf) toggleNodeCheck(dropLeaf.id, chk.checked);
      });

      const btnRoute = dropBox.querySelector(".btn-view-boss-route");
      btnRoute.addEventListener("click", () => {
        currentTab = "boss-route";
        try { localStorage.setItem("dream_selected_tab", currentTab); } catch(e) {}
        restoreUIState();
        renderAll();
        setTimeout(() => {
          const bossEl = document.getElementById(`boss-route-${dropBoss.replace(/\s+/g, '_')}`);
          if (bossEl) bossEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      });

      body.appendChild(dropBox);
    } else {
      if (currentViewMode === "tree") {
        const treeRoot = document.createElement("ul");
        treeRoot.className = "tree-root";
        renderTreeNode(itemName, slot, treeRoot, 0, [slot, itemName], `${slot}: ${itemName}`);
        body.appendChild(treeRoot);
      } else {
        const flowContainer = createFlowView(itemName, slot, leaves);
        body.appendChild(flowContainer);
      }
    }

    const remainingBox = createRemainingMaterialsBox(leaves);
    body.appendChild(remainingBox);

    const toggleBtn = header.querySelector(".btn-toggle-tree");
    toggleBtn.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    const changeBtn = header.querySelector(".btn-change-gear");
    changeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openGearModal(slot);
    });

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  function renderTreeNode(itemName, slot, parentEl, depth, currentPath, pathDisplay) {
    const recipe = getRecipe(itemName);
    const li = document.createElement("li");
    li.className = "tree-node";

    if (recipe) {
      const itemBox = document.createElement("div");
      itemBox.className = "tree-item-box is-composite";

      const subLeaves = getSubtreeLeaves(itemName, slot, currentPath, pathDisplay);
      const isComplete = subLeaves.length > 0 && subLeaves.every(l => checkedNodes.has(l.id));
      if (isComplete) itemBox.classList.add("completed");

      const nodeLvl = recipe.level_str || (recipe.level ? `Lv.${recipe.level}` : "");
      const nodeSynergy = recipe.synergy || recipe.special_effect || "";
      itemBox.innerHTML = `
        <span class="badge-craft">조합</span>
        <span class="item-name" style="cursor: pointer;" title="클릭 시 하위 재료 일괄 완료/취소 토글">${itemName}</span>
        ${nodeLvl ? `<span class="badge-level">${nodeLvl}</span>` : ""}
        ${recipe.category ? `<span class="slot-tag ${recipe.category}">${recipe.category}</span>` : ""}
        ${nodeSynergy ? `<span class="badge-synergy-tag" title="특수직업효과: ${nodeSynergy}">✨ 시너지: ${nodeSynergy}</span>` : ""}
        ${isComplete ? `<span style="color: #86efac; font-size: 11px; margin-left: 6px;">✓ 완성</span>` : `<span style="color: var(--text-muted); font-size: 11px; margin-left: 6px;">(클릭 시 하위 재료 일괄 완료)</span>`}
      `;

      // Auto-check progression: Clicking intermediate composite item toggles its children
      itemBox.addEventListener("click", (e) => {
        if (subLeaves.length === 0) return;
        const allDone = subLeaves.every(l => checkedNodes.has(l.id));
        subLeaves.forEach(l => {
          if (allDone) checkedNodes.delete(l.id);
          else checkedNodes.add(l.id);
        });
        saveCheckedNodes();
        renderAll();
      });

      li.appendChild(itemBox);

      const childrenUl = document.createElement("ul");
      childrenUl.className = "tree-children";

      if (!recipe.materials || recipe.materials.length === 0) {
        const emptyNotice = document.createElement("li");
        emptyNotice.className = "tree-node";
        emptyNotice.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem; padding: 4px 12px; display: inline-block;">(세부 조합식 정보 준비 중)</span>`;
        childrenUl.appendChild(emptyNotice);
      } else {
        recipe.materials.forEach((mat, idx) => {
          renderTreeMaterial(mat, idx, recipe.name, slot, childrenUl, depth + 1, currentPath, pathDisplay);
        });
      }

      li.appendChild(childrenUl);
    }

    parentEl.appendChild(li);
  }

  function renderTreeMaterial(mat, matIndex, parentRecipeName, slot, parentEl, depth, currentPath, pathDisplay) {
    const subRecipe = getRecipe(mat.name);
    const isSubRecipe = (mat.boss === "조합템" || !!subRecipe) && subRecipe && subRecipe.materials && subRecipe.materials.length > 0 && !subRecipe.is_drop;
    const nextCurrentPath = [...currentPath, `${mat.name}#${matIndex}`];
    const nextPathDisplay = `${pathDisplay} > ${mat.name}`;

    if (isSubRecipe) {
      renderTreeNode(mat.name, slot, parentEl, depth, nextCurrentPath, nextPathDisplay);
    } else {
      const nodeId = nextCurrentPath.join("__");
      const li = document.createElement("li");
      li.className = "tree-node";

      const itemBox = document.createElement("div");
      itemBox.className = "tree-item-box";
      const isChecked = checkedNodes.has(nodeId);
      if (isChecked) itemBox.classList.add("completed");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "tree-checkbox";
      checkbox.checked = isChecked;
      checkbox.addEventListener("change", (e) => {
        toggleNodeCheck(nodeId, checkbox.checked);
      });

      itemBox.addEventListener("click", (e) => {
        if (e.target === checkbox) return;
        toggleNodeCheck(nodeId, !checkedNodes.has(nodeId));
      });

      const nameSpan = document.createElement("span");
      nameSpan.className = "item-name";
      nameSpan.textContent = `${mat.name} x${mat.qty || 1}`;

      itemBox.appendChild(checkbox);
      itemBox.appendChild(nameSpan);

      const bossName = (mat.boss && mat.boss !== "조합템") ? mat.boss : (subRecipe && subRecipe.drop_boss ? subRecipe.drop_boss : "");
      if (bossName) {
        const bossBadge = document.createElement("span");
        bossBadge.className = "badge-boss";
        const icon = (bossName.includes("채광") || bossName.includes("채굴")) ? "⛏️ " : "👹 ";
        bossBadge.textContent = `${icon}${bossName}`;
        const loc = mat.location || (subRecipe && subRecipe.drop_location);
        if (loc) bossBadge.title = `지역: ${loc}`;
        itemBox.appendChild(bossBadge);
      }

      const lvlStr = mat.level_str || (subRecipe ? subRecipe.level_str : (mat.level ? `Lv.${mat.level}` : (subRecipe && subRecipe.level ? `Lv.${subRecipe.level}` : "")));
      if (lvlStr) {
        const lvlBadge = document.createElement("span");
        lvlBadge.className = "badge-level";
        lvlBadge.textContent = lvlStr;
        itemBox.appendChild(lvlBadge);
      }

      li.appendChild(itemBox);
      parentEl.appendChild(li);
    }
  }

  function createFlowView(rootItemName, slot, leaves) {
    const container = document.createElement("div");
    container.className = "flow-view-container";

    const steps = [];
    const visited = new Set();

    function collectSteps(name) {
      if (visited.has(name)) return;
      const rec = getRecipe(name);
      if (!rec) return;

      if (rec.materials && rec.materials.length > 0 && !rec.is_drop) {
        rec.materials.forEach(m => {
          const sub = getRecipe(m.name);
          if (sub && sub.materials && sub.materials.length > 0 && !sub.is_drop) {
            collectSteps(m.name);
          }
        });
      }

      visited.add(name);
      steps.push(rec);
    }

    collectSteps(rootItemName);

    steps.forEach((stepRecipe, index) => {
      const stepCard = document.createElement("div");
      stepCard.className = "flow-step-card";

      const isFinal = (index === steps.length - 1);
      const stepLvl = stepRecipe.level_str || (stepRecipe.level ? `Lv.${stepRecipe.level}` : "");
      stepCard.innerHTML = `
        <div class="flow-step-header">
          <div class="flow-step-target">
            <span class="flow-step-number">Step ${index + 1}${isFinal ? " (최종 완성)" : ""}</span>
            <strong>${stepRecipe.name}</strong>
            ${stepLvl ? `<span class="badge-level">${stepLvl}</span>` : ""}
          </div>
        </div>
      `;

      const matsList = document.createElement("div");
      matsList.className = "flow-mats-list";

      if (!stepRecipe.materials || stepRecipe.materials.length === 0) {
        matsList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 6px 12px;">세부 조합 정보 준비 중</div>`;
      } else {
        stepRecipe.materials.forEach((m) => {
          const matItem = document.createElement("div");
          matItem.className = "flow-mat-item";
          const sub = getRecipe(m.name);
          const isSubRecipe = (m.boss === "조합템" || !!sub) && sub && sub.materials && sub.materials.length > 0 && !sub.is_drop;
          const matchingLeaves = (leaves || []).filter(l => l.parentRecipe === stepRecipe.name && l.name === m.name);
          const isChecked = matchingLeaves.length > 0 && matchingLeaves.every(l => checkedNodes.has(l.id));
          if (isChecked) matItem.classList.add("checked");

          const bossName = (m.boss && m.boss !== "조합템") ? m.boss : (sub ? sub.drop_boss : "");
          const mLevelStr = m.level_str || (sub ? sub.level_str : (m.level ? `Lv.${m.level}` : ""));

          matItem.innerHTML = `
            <input type="checkbox" class="tree-checkbox" ${isChecked ? "checked" : ""} />
            <span class="item-name">${m.name} x${m.qty || 1}</span>
            ${isSubRecipe 
              ? '<span class="badge-craft">조합템</span>'
              : `<span class="badge-boss">${(bossName && (bossName.includes("채광") || bossName.includes("채굴"))) ? "⛏️ " : "👹 "}${bossName || '보스'}</span> ${mLevelStr ? `<span class="badge-level">${mLevelStr}</span>` : ''}`
            }
          `;

          const chk = matItem.querySelector(".tree-checkbox");
          chk.addEventListener("change", () => {
            if (matchingLeaves.length > 0) {
              if (chk.checked) {
                const nextUnchecked = matchingLeaves.find(l => !checkedNodes.has(l.id));
                if (nextUnchecked) toggleNodeCheck(nextUnchecked.id, true);
              } else {
                const lastChecked = [...matchingLeaves].reverse().find(l => checkedNodes.has(l.id));
                if (lastChecked) toggleNodeCheck(lastChecked.id, false);
              }
            }
          });

          matsList.appendChild(matItem);
        });
      }

      stepCard.appendChild(matsList);
      container.appendChild(stepCard);
    });

    return container;
  }

  function createRemainingMaterialsBox(leaves) {
    const box = document.createElement("div");
    box.className = "remaining-mats-box";

    const matGroups = {};
    leaves.forEach(l => {
      if (!matGroups[l.name]) {
        matGroups[l.name] = {
          name: l.name,
          boss: l.boss,
          level_str: l.level_str,
          nodes: []
        };
      }
      matGroups[l.name].nodes.push(l);
    });

    const items = Object.values(matGroups);
    const uncompleted = items.filter(g => g.nodes.some(n => !checkedNodes.has(n.id)));

    if (leaves.length === 0) {
      box.innerHTML = `
        <div class="remaining-mats-title" style="color: var(--text-muted);">
          📝 세부 조합 정보 준비 중 (엑셀 업데이트 예정)
        </div>
      `;
      return box;
    }

    if (uncompleted.length === 0) {
      box.innerHTML = `
        <div class="remaining-mats-title" style="color: var(--accent-green);">
          ✨ 이 부위의 모든 재료 파밍이 완료되었습니다!
        </div>
      `;
      return box;
    }

    box.innerHTML = `
      <div class="remaining-mats-title">
        📌 이 부위에 필요한 재료 진행 상황 (클릭하여 획득 체크):
      </div>
    `;

    const chips = document.createElement("div");
    chips.className = "remaining-chips";

    items.forEach(g => {
      const total = g.nodes.length;
      const checked = g.nodes.filter(n => checkedNodes.has(n.id)).length;
      const remaining = total - checked;

      const chip = document.createElement("div");
      chip.className = `mat-chip ${remaining === 0 ? "all-done" : ""}`;
      chip.style.cursor = "pointer";
      chip.title = `클릭하면 1개 획득/취소 토글 (총 ${total}개 중 ${checked}개 보유)`;

      chip.innerHTML = `
        <strong>${g.name}</strong>
        <span class="qty-count">${checked} / ${total}개</span>
        ${remaining > 0 ? `<span style="color: #f87171; font-size: 11px;">(${remaining}개 부족)</span>` : `<span style="color: #86efac; font-size: 11px;">(완료)</span>`}
        ${g.boss ? `<span class="boss-tag">[${g.boss}]</span>` : ""}
      `;

      chip.addEventListener("click", () => {
        if (remaining > 0) {
          const nextNode = g.nodes.find(n => !checkedNodes.has(n.id));
          if (nextNode) toggleNodeCheck(nextNode.id, true);
        } else {
          const lastNode = g.nodes[g.nodes.length - 1];
          if (lastNode) toggleNodeCheck(lastNode.id, false);
        }
      });

      chips.appendChild(chip);
    });

    box.appendChild(chips);
    return box;
  }

  // =========================================================================
  // Inventory (보유 재료 보관함)
  // =========================================================================
  function renderInventory() {
    if (!invItemsList) return;
    invItemsList.innerHTML = "";

    // Count required leaf materials in the current loadout
    const requiredMap = {};
    const allLeaves = getAllCurrentLeaves();
    allLeaves.forEach(l => {
      requiredMap[l.name] = (requiredMap[l.name] || 0) + 1;
    });

    const invKeys = Object.keys(userInventory);
    if (invCountBadge) invCountBadge.textContent = `${invKeys.length}종류`;

    // Render Quick Add Chips: top materials needed in current loadout
    if (invQuickChips) {
      invQuickChips.innerHTML = "";
      const neededUnowned = Object.keys(requiredMap).filter(name => {
        const owned = userInventory[name] || 0;
        return owned < requiredMap[name];
      });

      neededUnowned.slice(0, 8).forEach(matName => {
        const chip = document.createElement("button");
        chip.className = "quick-chip";
        chip.textContent = `+ ${matName}`;
        chip.title = `클릭하면 가방에 1개 추가 (필요: ${requiredMap[matName]}개)`;
        chip.addEventListener("click", () => {
          userInventory[matName] = (userInventory[matName] || 0) + 1;
          saveInventory();
          renderInventory();
        });
        invQuickChips.appendChild(chip);
      });
      if (neededUnowned.length === 0) {
        invQuickChips.innerHTML = `<span style="color: var(--accent-green); font-size: 11px;">필요한 모든 재료가 가방에 등록되어 있습니다!</span>`;
      }
    }

    if (invKeys.length === 0) {
      invItemsList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 12px 8px; font-size: 12px;">
          🎒 가방이 비어 있습니다.<br>
          파밍한 재료를 등록하면 체크박스를 자동으로 체크할 수 있습니다!
        </div>
      `;
      return;
    }

    // Sort inventory items: items needed for current loadout first
    const sortedKeys = [...invKeys].sort((a, b) => {
      const aReq = requiredMap[a] || 0;
      const bReq = requiredMap[b] || 0;
      if (aReq > 0 && bReq === 0) return -1;
      if (aReq === 0 && bReq > 0) return 1;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(itemName => {
      const qty = userInventory[itemName];
      const req = requiredMap[itemName] || 0;

      const row = document.createElement("div");
      row.className = "inv-item-row";

      let statusBadge = "";
      if (req > 0) {
        if (qty >= req) {
          statusBadge = `<span class="badge-status-sufficient">충분 (${qty}/${req})</span>`;
        } else {
          statusBadge = `<span class="badge-status-shortage">${req - qty}개 부족 (${qty}/${req})</span>`;
        }
      } else {
        statusBadge = `<span class="badge-status-unused">현재 미필요 (${qty}개)</span>`;
      }

      row.innerHTML = `
        <div class="inv-item-info">
          <span class="inv-item-name" title="${itemName}">${itemName}</span>
          <div class="inv-item-compare">
            ${statusBadge}
          </div>
        </div>
        <div class="inv-stepper">
          <button class="btn-inv-qty btn-inv-minus">-</button>
          <span style="font-size: 12px; font-weight: 700; width: 24px; text-align: center;">${qty}</span>
          <button class="btn-inv-qty btn-inv-plus">+</button>
          <button class="btn-inv-del" title="삭제">&times;</button>
        </div>
      `;

      const btnPlus = row.querySelector(".btn-inv-plus");
      const btnMinus = row.querySelector(".btn-inv-minus");
      const btnDel = row.querySelector(".btn-inv-del");

      btnPlus.addEventListener("click", () => {
        userInventory[itemName] = (userInventory[itemName] || 0) + 1;
        saveInventory();
        renderInventory();
      });

      btnMinus.addEventListener("click", () => {
        if (userInventory[itemName] > 1) {
          userInventory[itemName] -= 1;
        } else {
          delete userInventory[itemName];
        }
        saveInventory();
        renderInventory();
      });

      btnDel.addEventListener("click", () => {
        delete userInventory[itemName];
        saveInventory();
        renderInventory();
      });

      invItemsList.appendChild(row);
    });
  }

  // One-click Auto Check from Inventory
  function autoCheckFromInventory() {
    const allLeaves = getAllCurrentLeaves();
    if (allLeaves.length === 0) {
      alert("현재 선택된 장비에 필요한 재료 정보가 없습니다.");
      return;
    }

    const countsUsed = {};
    let newlyChecked = 0;

    allLeaves.forEach(leaf => {
      const owned = userInventory[leaf.name] || 0;
      const used = countsUsed[leaf.name] || 0;

      if (used < owned) {
        if (!checkedNodes.has(leaf.id)) newlyChecked++;
        checkedNodes.add(leaf.id);
        countsUsed[leaf.name] = used + 1;
      }
    });

    saveCheckedNodes();
    renderAll();

    alert(`⚡ 가방에 등록된 재료를 바탕으로 총 ${newlyChecked}개 재료가 새롭게 체크 반영되었습니다!`);
  }

  // =========================================================================
  // Right Side Column: Sticky Level-Based Farming Checklist
  // =========================================================================
  function renderSideLevelList() {
    if (!sideLevelList) return;
    sideLevelList.innerHTML = "";

    const allLeaves = (sideSlotSync && currentSlot !== "ALL")
      ? getLeafMaterials(currentLoadout[currentSlot], currentSlot)
      : getAllCurrentLeaves();

    const levelGroups = {};
    allLeaves.forEach(l => {
      const lvl = l.level || 0;
      if (!levelGroups[lvl]) {
        levelGroups[lvl] = {
          level: lvl,
          level_str: l.level_str || (lvl > 0 ? `Lv.${lvl}` : "채광 / 일반"),
          materials: {}
        };
      }

      if (!levelGroups[lvl].materials[l.name]) {
        levelGroups[lvl].materials[l.name] = {
          name: l.name,
          boss: l.boss,
          nodes: []
        };
      }
      levelGroups[lvl].materials[l.name].nodes.push(l);
    });

    const sortedLevels = Object.values(levelGroups).sort((a, b) => a.level - b.level).filter(grp => {
      if (sideLevelFilter === "ALL") return true;
      const [min, max] = sideLevelFilter.split("-").map(Number);
      if (max) return grp.level >= min && grp.level <= max;
      return grp.level >= min;
    });

    let renderedGroupCount = 0;

    sortedLevels.forEach(grp => {
      const matList = Object.values(grp.materials);

      const matchedMats = matList.filter(m => {
        if (!sideSearchQuery) return true;
        return m.name.toLowerCase().includes(sideSearchQuery) || 
               (m.boss && m.boss.toLowerCase().includes(sideSearchQuery));
      });

      if (matchedMats.length === 0) return;

      const displayMats = showOnlyRemaining
        ? matchedMats.filter(m => m.nodes.some(n => !checkedNodes.has(n.id)))
        : matchedMats;

      if (displayMats.length === 0 && showOnlyRemaining) return;

      renderedGroupCount++;

      let lvlTotal = 0;
      let lvlChecked = 0;
      matchedMats.forEach(m => {
        lvlTotal += m.nodes.length;
        lvlChecked += m.nodes.filter(n => checkedNodes.has(n.id)).length;
      });
      const lvlRemaining = lvlTotal - lvlChecked;
      const isLevelAllDone = (lvlRemaining === 0);

      const groupCard = document.createElement("div");
      groupCard.className = `side-level-group ${isLevelAllDone ? "all-cleared" : ""} ${isAllCollapsed ? "collapsed" : ""}`;

      const bossesInLevel = Array.from(new Set(matchedMats.map(m => m.boss).filter(b => b && b !== "조합템")));
      const bossDisplayText = bossesInLevel.length > 2 
        ? `${bossesInLevel.slice(0, 2).join(", ")} 외 ${bossesInLevel.length - 2}종` 
        : bossesInLevel.join(", ");

      groupCard.innerHTML = `
        <div class="side-level-header" title="클릭하여 접기/펼치기">
          <div class="side-level-tag">
            <span class="side-level-badge">${grp.level_str}</span>
            <span class="side-level-bosses" title="${bossesInLevel.join(', ')}">${bossDisplayText}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="side-level-remaining-tag">
              ${isLevelAllDone 
                ? '<span style="color: #86efac; font-weight: 700;">✓ 완료</span>' 
                : `남은 필요: <strong>${lvlRemaining}개</strong>`}
            </div>
            <span class="side-level-arrow">▼</span>
          </div>
        </div>
      `;

      const headerEl = groupCard.querySelector(".side-level-header");
      headerEl.addEventListener("click", () => {
        groupCard.classList.toggle("collapsed");
      });

      const groupBody = document.createElement("div");
      groupBody.className = "side-level-body";

      displayMats.forEach(m => {
        const total = m.nodes.length;
        const checked = m.nodes.filter(n => checkedNodes.has(n.id)).length;
        const remaining = total - checked;
        const isMatDone = (remaining === 0);

        const matItem = document.createElement("div");
        matItem.className = `side-mat-item ${isMatDone ? "is-done" : ""}`;

        const top = document.createElement("div");
        top.className = "side-mat-top";
        top.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
            <span class="side-mat-name" title="${m.name}">${m.name}</span>
            <span class="side-mat-boss-tag">${(m.boss && (m.boss.includes("채광") || m.boss.includes("채굴"))) ? "⛏️ " : "👹 "}${m.boss}</span>
          </div>
          <div class="side-stepper">
            <button class="btn-side-step minus" title="1개 취소">-1</button>
            <button class="btn-side-step plus" title="1개 획득">+1 획득</button>
          </div>
        `;

        const btnPlus = top.querySelector(".plus");
        const btnMinus = top.querySelector(".minus");

        btnPlus.addEventListener("click", (e) => {
          e.stopPropagation();
          const nextNode = m.nodes.find(n => !checkedNodes.has(n.id));
          if (nextNode) toggleNodeCheck(nextNode.id, true);
        });

        btnMinus.addEventListener("click", (e) => {
          e.stopPropagation();
          const lastCheckedNode = [...m.nodes].reverse().find(n => checkedNodes.has(n.id));
          if (lastCheckedNode) toggleNodeCheck(lastCheckedNode.id, false);
        });

        const middle = document.createElement("div");
        middle.className = "side-mat-middle";
        middle.innerHTML = `
          <span class="side-mat-count-badge ${isMatDone ? 'done' : 'needed'}">
            ${isMatDone ? `✓ 파밍 완료 (${total}/${total})` : `필요: <strong>${remaining}개</strong> (보유 ${checked}/${total})`}
          </span>
        `;

        const chipsContainer = document.createElement("div");
        chipsContainer.className = "side-slot-chips";

        m.nodes.forEach((node, nodeIdx) => {
          const isNodeChecked = checkedNodes.has(node.id);
          const chip = document.createElement("span");
          chip.className = `side-slot-chip ${isNodeChecked ? "checked" : ""}`;
          chip.title = `${node.path}\n(상위 조합: ${node.parentRecipe})\n클릭하여 획득/취소 토글`;
          const label = m.nodes.length > 1 ? `[${node.slot} ${nodeIdx + 1}]` : `[${node.slot}]`;
          chip.innerHTML = `${isNodeChecked ? "✓ " : ""}${label}`;

          chip.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleNodeCheck(node.id, !isNodeChecked);
          });

          chipsContainer.appendChild(chip);
        });

        middle.appendChild(chipsContainer);
        matItem.appendChild(top);
        matItem.appendChild(middle);
        groupBody.appendChild(matItem);
      });

      groupCard.appendChild(groupBody);
      sideLevelList.appendChild(groupCard);
    });

    if (renderedGroupCount === 0) {
      let emptyMsg = "검색 조건에 일치하는 재료가 없습니다.";
      if (showOnlyRemaining) {
        emptyMsg = "🎉 축하합니다! 모든 재료 파밍이 완료되었습니다!<br><span style='font-size: 11px;'>상단 '남은 것만 보기'를 누르면 완료된 목록을 볼 수 있습니다.</span>";
      } else if (sideSlotSync && currentSlot !== "ALL") {
        emptyMsg = `선택한 [${currentSlot}] 부위에 해당하는 레벨 재료가 없습니다.`;
      }
      sideLevelList.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); font-size: 13px;">
          ${emptyMsg}
        </div>
      `;
    }
  }

  function toggleNodeCheck(nodeId, isChecked) {
    if (isChecked) {
      checkedNodes.add(nodeId);
    } else {
      checkedNodes.delete(nodeId);
    }
    saveCheckedNodes();
    renderAll();
  }

  // =========================================================================
  // Gear Selection Modal
  // =========================================================================
  function openGearModal(slot) {
    modalSlot = slot;
    modalSearchQuery = "";
    modalWeaponSubFilter = "ALL";
    if (gearModalSearch) gearModalSearch.value = "";
    if (gearSelectModalTitle) gearSelectModalTitle.textContent = `${slot} 장비 변경`;
    if (gearModalSlotBadge) {
      gearModalSlotBadge.textContent = slot;
      gearModalSlotBadge.className = `slot-tag ${slot}`;
    }

    const jobData = getJobData();
    const synergyList = (jobData && jobData.recommendations && jobData.recommendations[slot]) || [];
    if (gearModalSynergyNote) {
      gearModalSynergyNote.innerHTML = synergyList.length > 0
        ? `⭐ <strong>${currentJob} 추천 장비:</strong> ${synergyList.join(", ")}`
        : `💡 직업별 시너지 아이템을 선택하면 고유 효과를 극대화할 수 있습니다.`;
    }

    renderGearModalList();
    if (gearSelectModal) gearSelectModal.style.display = "flex";
  }

  function renderGearModalList() {
    if (!gearSelectList) return;
    gearSelectList.innerHTML = "";

    const modalWeaponSubFilterBar = document.getElementById("modalWeaponSubFilterBar");
    if (modalWeaponSubFilterBar) {
      if (modalSlot === "무기") {
        modalWeaponSubFilterBar.style.display = "flex";
        const subBtns = modalWeaponSubFilterBar.querySelectorAll(".weapon-sub-btn");
        subBtns.forEach(btn => {
          btn.classList.toggle("active", btn.dataset.sub === modalWeaponSubFilter);
          btn.onclick = () => {
            modalWeaponSubFilter = btn.dataset.sub;
            renderGearModalList();
          };
        });
      } else {
        modalWeaponSubFilterBar.style.display = "none";
      }
    }

    const catData = gameData && gameData.category_gear && gameData.category_gear[modalSlot];
    const topGearList = (catData && catData.top_gear) || [];

    const currentlyEquipped = currentLoadout[modalSlot];

    const filtered = topGearList.filter(name => {
      const recipe = getRecipe(name);
      if (modalSlot === "무기" && modalWeaponSubFilter !== "ALL") {
        if (!recipe || recipe.sub_cat !== modalWeaponSubFilter) return false;
      }
      if (!modalSearchQuery) return true;
      return name.toLowerCase().includes(modalSearchQuery.toLowerCase());
    });

    // Sort: Synergy items for current job first, then equipped, then level descending, then alphabetical
    filtered.sort((a, b) => {
      const recA = getRecipe(a);
      const recB = getRecipe(b);
      const synA = recA && recA.synergy_jobs && recA.synergy_jobs.includes(currentJob);
      const synB = recB && recB.synergy_jobs && recB.synergy_jobs.includes(currentJob);

      if (synA && !synB) return -1;
      if (!synA && synB) return 1;
      if (a === currentlyEquipped) return -1;
      if (b === currentlyEquipped) return 1;

      const lvlA = (recA && recA.level) || 0;
      const lvlB = (recB && recB.level) || 0;
      if (lvlA !== lvlB) return lvlB - lvlA;

      return a.localeCompare(b);
    });

    if (filtered.length === 0) {
      gearSelectList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">검색된 장비가 없습니다.</div>`;
      return;
    }

    filtered.forEach(itemName => {
      const recipe = getRecipe(itemName);
      const isEquipped = (itemName === currentlyEquipped);
      const hasSynergy = recipe && recipe.synergy_jobs && recipe.synergy_jobs.includes(currentJob);
      const itemSynergy = recipe ? (recipe.synergy || recipe.special_effect || "") : "";
      const isDrop = recipe && recipe.is_drop;
      const lvlStr = recipe ? (recipe.level_str || (recipe.level ? `Lv.${recipe.level}` : "")) : "";
      const subTag = (modalSlot === "무기" && recipe && recipe.sub_cat) ? recipe.sub_cat : modalSlot;

      const card = document.createElement("div");
      card.className = `gear-select-card ${isEquipped ? 'active-equipped' : ''} ${hasSynergy ? 'has-synergy' : ''}`;

      card.innerHTML = `
        <div>
          <div class="gear-select-card-header">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span class="slot-tag ${subTag}">${subTag}</span>
              <span class="gear-select-card-name">${itemName}</span>
              ${lvlStr ? `<span class="badge-level">${lvlStr}</span>` : ""}
              ${isDrop ? `<span class="badge-boss" style="font-size: 11px;">👹 ${recipe.drop_boss || '드랍'}</span>` : ""}
            </div>
            ${hasSynergy ? `<span class="badge-synergy active">⭐ ${currentJob} 추천</span>` : (itemSynergy ? `<span class="badge-synergy-tag">✨ ${itemSynergy}</span>` : "")}
          </div>
          ${itemSynergy ? `<div class="gear-select-card-effect">✨ <strong>[특수직업효과]</strong> ${itemSynergy}</div>` : ""}
        </div>
        <button class="gear-select-card-btn">${isEquipped ? '✓ 현재 장착 중' : '장착하기'}</button>
      `;

      card.addEventListener("click", () => {
        currentLoadout[modalSlot] = itemName;
        saveActiveLoadout();
        if (gearSelectModal) gearSelectModal.style.display = "none";
        renderAll();
      });

      gearSelectList.appendChild(card);
    });
  }

  // =========================================================================
  // Tab 2: Boss Farming Route Report
  // =========================================================================
  function renderBossRouteTab() {
    const container = document.getElementById("bossRouteGrid");
    if (!container) return;
    container.innerHTML = "";

    const allLeaves = getAllCurrentLeaves();
    const bossMap = {};

    allLeaves.forEach(leaf => {
      const bName = leaf.boss || "기타/일반";
      if (bName === "조합템") return;

      if (!bossMap[bName]) {
        bossMap[bName] = {
          boss_name: bName,
          level: leaf.level || 0,
          level_str: leaf.level_str || (leaf.level ? `Lv.${leaf.level}` : ""),
          location: "",
          materials: {}
        };

        // Lookup boss location
        if (gameData && gameData.bosses) {
          const matchedBoss = gameData.bosses.find(b => b.name === bName || bName.includes(b.name));
          if (matchedBoss && matchedBoss.location) {
            bossMap[bName].location = matchedBoss.location;
          }
        }
      }

      if (!bossMap[bName].materials[leaf.name]) {
        bossMap[bName].materials[leaf.name] = {
          name: leaf.name,
          level_str: leaf.level_str,
          nodes: []
        };
      }
      bossMap[bName].materials[leaf.name].nodes.push(leaf);
    });

    const sortedBosses = Object.values(bossMap).sort((a, b) => a.level - b.level);

    if (sortedBosses.length === 0) {
      container.innerHTML = `<div class="empty-msg">선택한 장비에 필요한 보스 드랍 재료가 없습니다.</div>`;
      return;
    }

    sortedBosses.forEach(bData => {
      const card = document.createElement("div");
      card.className = "boss-route-card";
      card.id = `boss-route-${bData.boss_name.replace(/\s+/g, '_')}`;

      const matList = Object.values(bData.materials);
      const isAllCleared = matList.every(m => m.nodes.every(n => checkedNodes.has(n.id)));
      if (isAllCleared) card.classList.add("all-cleared");

      const isMining = bData.boss_name.includes("채광") || bData.boss_name.includes("채굴");
      const icon = isMining ? "⛏️ " : "👹 ";

      card.innerHTML = `
        <div class="boss-route-header">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <h4 class="boss-route-title">${icon}${bData.boss_name}</h4>
            ${bData.location ? `<span class="boss-loc-tag">🗺️ ${bData.location}</span>` : ""}
          </div>
          ${bData.level_str ? `<span class="boss-level-pill">${bData.level_str}</span>` : ""}
        </div>
      `;

      const ul = document.createElement("ul");
      ul.className = "boss-req-list";

      matList.forEach(m => {
        const total = m.nodes.length;
        const checked = m.nodes.filter(n => checkedNodes.has(n.id)).length;
        const remaining = total - checked;
        const isMatDone = (remaining === 0);

        const li = document.createElement("li");
        li.className = `boss-req-item ${isMatDone ? "all-done" : ""}`;

        const topRow = document.createElement("div");
        topRow.className = "boss-req-item-top";
        topRow.innerHTML = `
          <div class="boss-req-name-group">
            <span class="boss-mat-name">${m.name}</span>
            <span class="qty-status-badge ${isMatDone ? 'complete' : ''}">
              보유 <strong>${checked}</strong> / 총 <strong>${total}</strong>개 ${isMatDone ? '✓ 완료' : `(${remaining}개 필요)`}
            </span>
          </div>
          <div class="stepper-group">
            <button class="btn-stepper btn-minus" title="보유 개수 1개 취소">- 1개</button>
            <button class="btn-stepper btn-plus" title="보유 개수 1개 획득">+ 1개 획득</button>
          </div>
        `;

        const btnPlus = topRow.querySelector(".btn-plus");
        const btnMinus = topRow.querySelector(".btn-minus");

        btnPlus.addEventListener("click", () => {
          const nextNode = m.nodes.find(n => !checkedNodes.has(n.id));
          if (nextNode) toggleNodeCheck(nextNode.id, true);
        });

        btnMinus.addEventListener("click", () => {
          const lastCheckedNode = [...m.nodes].reverse().find(n => checkedNodes.has(n.id));
          if (lastCheckedNode) toggleNodeCheck(lastCheckedNode.id, false);
        });

        const chipsContainer = document.createElement("div");
        chipsContainer.className = "slot-chips-container";

        m.nodes.forEach((node, nodeIdx) => {
          const isNodeChecked = checkedNodes.has(node.id);
          const chip = document.createElement("label");
          chip.className = `slot-node-chip ${isNodeChecked ? "checked" : ""}`;
          chip.title = `${node.path}\n클릭하여 획득/취소 토글`;

          const label = m.nodes.length > 1 ? `[${node.slot} ${nodeIdx + 1}] ${node.parentRecipe}` : `[${node.slot}] ${node.parentRecipe}`;
          chip.innerHTML = `
            <input type="checkbox" class="tree-checkbox" ${isNodeChecked ? "checked" : ""} />
            <span>${label}</span>
          `;

          const chk = chip.querySelector("input");
          chk.addEventListener("change", () => {
            toggleNodeCheck(node.id, chk.checked);
          });

          chipsContainer.appendChild(chip);
        });

        li.appendChild(topRow);
        li.appendChild(chipsContainer);
        ul.appendChild(li);
      });

      card.appendChild(ul);
      container.appendChild(card);
    });
  }

  // =========================================================================
  // Tab 3: Boss Drop Codex
  // =========================================================================
  function renderCodexTab() {
    const container = document.getElementById("bossCodexGrid");
    if (!container || !gameData || !gameData.bosses) return;
    container.innerHTML = "";

    const searchInput = document.getElementById("codexSearch");
    const levelSelect = document.getElementById("codexLevelFilter");
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const lvlFilter = levelSelect ? levelSelect.value : "ALL";

    // Build needed item counts from current loadout leaves
    const neededCounts = {};
    const allLeaves = getAllCurrentLeaves();
    allLeaves.forEach(l => {
      neededCounts[l.name] = (neededCounts[l.name] || 0) + 1;
    });

    const filteredBosses = gameData.bosses.filter(b => {
      if (lvlFilter !== "ALL") {
        const [min, max] = lvlFilter.split("-").map(Number);
        if (max) {
          if (b.level < min || b.level > max) return false;
        } else {
          if (b.level < min) return false;
        }
      }

      if (query) {
        const matchBoss = b.name.toLowerCase().includes(query);
        const matchLoc = (b.location || "").toLowerCase().includes(query);
        const matchDrop = b.drops.some(d => d.name.toLowerCase().includes(query));
        if (!matchBoss && !matchLoc && !matchDrop) return false;
      }

      return true;
    });

    if (filteredBosses.length === 0) {
      container.innerHTML = `<div class="empty-msg" style="grid-column: 1/-1;">검색 조건에 맞는 보스가 없습니다.</div>`;
      return;
    }

    filteredBosses.forEach(b => {
      const card = document.createElement("div");
      card.className = "boss-codex-card";
      card.id = `boss-card-${b.name.replace(/\s+/g, '_')}`;

      const isMining = b.name.includes("채광");
      const icon = isMining ? "⛏️ " : "👹 ";

      card.innerHTML = `
        <div class="codex-card-header">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="codex-boss-name">${icon}${b.name}</span>
            ${b.location ? `<span class="boss-loc-tag">🗺️ ${b.location}</span>` : ""}
          </div>
          <span class="badge-level">${b.level_str || (b.level ? `Lv.${b.level}` : "일반")}</span>
        </div>
      `;

      const ul = document.createElement("ul");
      ul.className = "codex-drop-list";

      b.drops.forEach(d => {
        const needed = neededCounts[d.name] || 0;
        const li = document.createElement("li");
        li.className = `codex-drop-item ${needed > 0 ? "is-needed" : ""}`;

        const isItemType = d.type === "아이템";
        const isMiningType = d.type === "채광";
        const typeClass = isItemType ? "tag-drop-item" : (isMiningType ? "tag-drop-mining" : "tag-drop-mat");
        const lvlStr = d.level_str || (b.level_str || (b.level ? `Lv.${b.level}` : ""));

        li.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span class="drop-name">${isMining ? (d.display || (d.location ? `${d.name}-${d.location}` : d.name)) : d.name}</span>
            ${lvlStr ? `<span class="badge-level" style="font-size: 11px;">${lvlStr}</span>` : ""}
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${needed > 0 ? `<span class="needed-badge">★ 현재 빌드 ${needed}개 필요</span> ` : ""}
            <span class="drop-type-tag ${typeClass}">${d.type || (isMining ? "채광" : "재료")}</span>
          </div>
        `;
        ul.appendChild(li);
      });

      card.appendChild(ul);
      container.appendChild(card);
    });
  }

  // =========================================================================
  // Tab 4: Gear Codex & Job Synergy
  // =========================================================================
  function renderGearCodexTab() {
    if (!gearCodexGrid || !gameData || !gameData.category_gear) return;
    gearCodexGrid.innerHTML = "";

    const weaponSubFilterBar = document.getElementById("weaponSubFilterBar");
    if (weaponSubFilterBar) {
      if (gearCodexCat === "무기") {
        weaponSubFilterBar.style.display = "flex";
        const subBtns = weaponSubFilterBar.querySelectorAll(".weapon-sub-btn");
        subBtns.forEach(btn => {
          btn.classList.toggle("active", btn.dataset.sub === weaponSubFilter);
          btn.onclick = () => {
            weaponSubFilter = btn.dataset.sub;
            renderGearCodexTab();
          };
        });
      } else {
        weaponSubFilterBar.style.display = "none";
      }
    }

    const categories = (gearCodexCat === "전체") ? CATEGORIES : [gearCodexCat];
    const cardsToRender = [];

    categories.forEach(cat => {
      const topList = (gameData.category_gear[cat] && gameData.category_gear[cat].top_gear) || [];
      topList.forEach(itemName => {
        const recipe = getRecipe(itemName);
        if (!recipe) return;

        if (cat === "무기" && weaponSubFilter !== "ALL") {
          if (recipe.sub_cat !== weaponSubFilter) return;
        }

        const hasSynergy = recipe.synergy_jobs && recipe.synergy_jobs.includes(currentJob);
        if (gearCodexSynergyOnly && !hasSynergy) return;

        if (gearCodexSearchQuery) {
          const matchName = itemName.toLowerCase().includes(gearCodexSearchQuery);
          const matchEffect = (recipe.special_effect || "").toLowerCase().includes(gearCodexSearchQuery);
          if (!matchName && !matchEffect) return;
        }

        cardsToRender.push({
          slot: cat,
          name: itemName,
          recipe: recipe,
          hasSynergy: hasSynergy
        });
      });
    });

    // Sort: Synergy items for current job first, then level descending, then name
    cardsToRender.sort((a, b) => {
      if (a.hasSynergy && !b.hasSynergy) return -1;
      if (!a.hasSynergy && b.hasSynergy) return 1;
      const lvlA = (a.recipe && a.recipe.level) || 0;
      const lvlB = (b.recipe && b.recipe.level) || 0;
      if (lvlA !== lvlB) return lvlB - lvlA;
      return a.name.localeCompare(b.name);
    });

    if (cardsToRender.length === 0) {
      gearCodexGrid.innerHTML = `<div class="empty-msg" style="grid-column: 1/-1;">조건에 맞는 장비가 없습니다.</div>`;
      return;
    }

    cardsToRender.forEach(item => {
      const card = document.createElement("div");
      card.className = `gear-codex-card ${item.hasSynergy ? 'has-synergy' : ''}`;

      const isEquipped = (currentLoadout[item.slot] === item.name);

      let matsHtml = "";
      if (item.recipe.is_drop) {
        matsHtml = `
          <div style="margin-top: 10px; padding: 8px 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px;">
            <div style="font-size: 12px; font-weight: 700; color: #f1f5f9; display: flex; align-items: center; gap: 6px;">
              <span>👹 드랍 보스: <strong>${item.recipe.drop_boss || "보스"}</strong></span>
            </div>
            ${item.recipe.drop_location ? `<div style="font-size: 11.5px; color: var(--accent-gold); margin-top: 4px;">🗺️ 지역: ${item.recipe.drop_location}</div>` : ""}
          </div>
        `;
      } else if (item.recipe.materials && item.recipe.materials.length > 0) {
        matsHtml = `
          <div class="gear-codex-mats-section">
            <div class="gear-codex-mats-title">🧩 조합 재료 (${item.recipe.materials.length}종류):</div>
            <div class="gear-codex-mats-grid">
              ${item.recipe.materials.map(m => {
                const mSrc = m.boss && m.boss !== "조합템" ? (m.boss.includes("채광") ? `⛏️ ${m.boss}` : `👹 ${m.boss}`) : "🛠️ 조합";
                return `
                  <div class="gear-codex-mat-chip" title="${m.name} (${mSrc})">
                    <div class="gear-codex-mat-info">
                      <span class="gear-codex-mat-name">${m.name}</span>
                      <span class="gear-codex-mat-source">${mSrc}</span>
                    </div>
                    <span class="gear-codex-mat-qty">x${m.qty || 1}</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }

      const codexSynergy = item.recipe.synergy || item.recipe.special_effect || "";
      const subTag = (item.slot === "무기" && item.recipe.sub_cat) ? item.recipe.sub_cat : item.slot;

      card.innerHTML = `
        <div class="gear-codex-card-top">
          <!-- Row 1: Badges (Subcategory, Level, Drop, Synergy) -->
          <div class="gear-codex-card-meta-row">
            <span class="slot-tag ${subTag}">${subTag}</span>
            ${item.recipe.level_str || item.recipe.level ? `<span class="badge-level">${item.recipe.level_str || 'Lv.' + item.recipe.level}</span>` : ""}
            ${item.recipe.is_drop ? `<span class="badge-drop-item" style="font-size: 11px;">완제품 드랍</span>` : ""}
            ${item.hasSynergy ? `<span class="badge-synergy active">⭐ ${currentJob} 추천 [${codexSynergy}]</span>` : (codexSynergy ? `<span class="badge-synergy other">✨ 시너지: ${codexSynergy}</span>` : "")}
          </div>
          <!-- Row 2: Item Name -->
          <div class="gear-codex-card-title-row">
            <h4 class="gear-codex-card-name">${item.name}</h4>
          </div>
          ${codexSynergy ? `<div class="synergy-effect-box">✨ <strong>[특수직업효과]</strong> ${codexSynergy}</div>` : ""}
          ${matsHtml}
        </div>
        <button class="btn-equip-loadout" data-slot="${item.slot}" data-item="${item.name}">
          ${isEquipped ? '✓ 현재 빌드에 착용 중' : `[${item.slot}] 이 장비 빌드에 적용`}
        </button>
      `;

      const btnEquip = card.querySelector(".btn-equip-loadout");
      btnEquip.addEventListener("click", () => {
        currentLoadout[item.slot] = item.name;
        saveActiveLoadout();
        alert(`[${item.slot}] 부위에 '${item.name}' 장비가 적용되었습니다!`);
        // Switch to tree tab to view updated tree
        currentTab = "tree";
        try { localStorage.setItem("dream_selected_tab", currentTab); } catch (e) {}
        restoreUIState();
        renderAll();
      });

      gearCodexGrid.appendChild(card);
    });
  }

  // =========================================================================
  // Global Search Engine
  // =========================================================================
  function handleGlobalSearch(query) {
    if (!globalSearchResults) return;
    const q = query.trim().toLowerCase();

    if (!q) {
      globalSearchResults.style.display = "none";
      if (btnClearSearch) btnClearSearch.style.display = "none";
      return;
    }

    if (btnClearSearch) btnClearSearch.style.display = "block";

    const results = [];

    // 1. Search Top Gear
    if (gameData && gameData.category_gear) {
      CATEGORIES.forEach(cat => {
        const topList = (gameData.category_gear[cat] && gameData.category_gear[cat].top_gear) || [];
        topList.forEach(name => {
          if (name.toLowerCase().includes(q)) {
            const recipe = getRecipe(name);
            const hasSyn = recipe && recipe.synergy_jobs && recipe.synergy_jobs.includes(currentJob);
            const synText = recipe ? (recipe.synergy || recipe.special_effect || "") : "";
            const synBadge = hasSyn ? `· ⭐ ${currentJob} 추천 [시너지: ${synText}]` : (synText ? `· ✨ [시너지: ${synText}]` : "");
            const lvlText = recipe ? (recipe.level_str || (recipe.level ? `Lv.${recipe.level}` : "")) : "";
            const dropText = recipe && recipe.is_drop ? `(👹 ${recipe.drop_boss})` : "";
            results.push({
              type: "gear",
              slot: cat,
              name: name,
              sub: `${cat} ${lvlText} ${dropText} ${synBadge}`.trim(),
              badge: cat,
              badgeClass: `slot-tag ${cat}`,
              action: () => {
                currentLoadout[cat] = name;
                saveActiveLoadout();
                currentTab = "tree";
                currentSlot = cat;
                restoreUIState();
                renderAll();
              }
            });
          }
        });
      });
    }

    // 2. Search Materials & Sub-recipes
    if (gameData && gameData.global_recipe_map) {
      Object.keys(gameData.global_recipe_map).forEach(rName => {
        if (rName.toLowerCase().includes(q)) {
          const rec = gameData.global_recipe_map[rName];
          if (!results.some(r => r.name === rName)) {
            const subSyn = rec ? (rec.synergy || rec.special_effect || "") : "";
            const subSynBadge = subSyn ? ` · ✨ [시너지: ${subSyn}]` : "";
            results.push({
              type: "subrecipe",
              slot: rec.category || "조합템",
              name: rName,
              sub: `조합 아이템 (${rec.materials.length}개 재료 필요)${subSynBadge}`,
              badge: "조합템",
              badgeClass: "badge-craft",
              action: () => {
                currentTab = "tree";
                restoreUIState();
                renderAll();
              }
            });
          }
        }
      });
    }

    // 3. Search Bosses & Locations
    if (gameData && gameData.bosses) {
      gameData.bosses.forEach(b => {
        if (b.name.toLowerCase().includes(q) || (b.location && b.location.toLowerCase().includes(q))) {
          results.push({
            type: "boss",
            name: b.name,
            sub: `${b.level_str || `Lv.${b.level}`} · 🗺️ ${b.location || "위치 정보 없음"}`,
            badge: "보스",
            badgeClass: "badge-boss",
            action: () => {
              currentTab = "codex";
              restoreUIState();
              renderAll();
              setTimeout(() => {
                const targetEl = document.getElementById(`boss-card-${b.name.replace(/\s+/g, '_')}`);
                if (targetEl) {
                  targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                  targetEl.style.boxShadow = "0 0 20px #f59e0b";
                  setTimeout(() => { targetEl.style.boxShadow = ""; }, 2500);
                }
              }, 100);
            }
          });
        }
      });
    }

    // Render results
    globalSearchResults.innerHTML = "";
    if (results.length === 0) {
      globalSearchResults.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 12px; text-align: center;">검색 결과가 없습니다.</div>`;
    } else {
      results.slice(0, 15).forEach(item => {
        const div = document.createElement("div");
        div.className = "search-result-item";
        div.innerHTML = `
          <div>
            <div class="search-result-title">
              <span>${item.name}</span>
              <span class="${item.badgeClass}">${item.badge}</span>
            </div>
            <div class="search-result-sub">${item.sub}</div>
          </div>
          <span style="font-size: 11px; color: var(--border-focus);">이동 ➔</span>
        `;
        div.addEventListener("click", () => {
          globalSearchResults.style.display = "none";
          item.action();
        });
        globalSearchResults.appendChild(div);
      });
    }

    globalSearchResults.style.display = "block";
  }

  // =========================================================================
  // Event Bindings
  // =========================================================================
  function bindEvents() {
    // Job Select
    if (jobSelect) {
      jobSelect.addEventListener("change", (e) => {
        currentJob = e.target.value;
        try { localStorage.setItem("dream_selected_job", currentJob); } catch (err) {}
        loadActiveLoadout();
        loadCheckedNodes();
        if (loadoutJobName) loadoutJobName.textContent = currentJob;
        if (currentJobSynergyLabel) currentJobSynergyLabel.textContent = currentJob;
        renderAll();
      });
    }

    // Navigation Tabs
    navTabs.forEach(btn => {
      btn.addEventListener("click", () => {
        navTabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentTab = btn.dataset.tab;
        try { localStorage.setItem("dream_selected_tab", currentTab); } catch (err) {}

        Object.keys(tabContents).forEach(key => {
          if (tabContents[key]) tabContents[key].style.display = "none";
        });

        if (currentTab === "tree" && tabContents.tree) tabContents.tree.style.display = "block";
        else if (currentTab === "boss-route" && tabContents.bossRoute) tabContents.bossRoute.style.display = "block";
        else if (currentTab === "codex" && tabContents.codex) tabContents.codex.style.display = "block";
        else if (currentTab === "gear-codex" && tabContents.gearCodex) tabContents.gearCodex.style.display = "block";

        renderAll();
      });
    });

    // Slot Buttons (Tab 1)
    slotButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        slotButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentSlot = btn.dataset.slot;
        try { localStorage.setItem("dream_selected_slot", currentSlot); } catch (err) {}
        renderTreeTab();
        if (sideSlotSync) renderSideLevelList();
      });
    });

    // View Mode Buttons (Tab 1)
    viewModeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        viewModeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentViewMode = btn.dataset.mode;
        try { localStorage.setItem("dream_selected_view_mode", currentViewMode); } catch (err) {}
        renderTreeTab();
      });
    });

    // Global Search Events
    if (globalSearchInput) {
      globalSearchInput.addEventListener("input", (e) => {
        handleGlobalSearch(e.target.value);
      });
      globalSearchInput.addEventListener("focus", (e) => {
        if (e.target.value.trim()) handleGlobalSearch(e.target.value);
      });
    }
    if (btnClearSearch) {
      btnClearSearch.addEventListener("click", () => {
        if (globalSearchInput) globalSearchInput.value = "";
        btnClearSearch.style.display = "none";
        if (globalSearchResults) globalSearchResults.style.display = "none";
      });
    }
    document.addEventListener("click", (e) => {
      if (globalSearchResults && !e.target.closest(".global-search-container")) {
        globalSearchResults.style.display = "none";
      }
    });

    // Reset Checks Button
    if (btnResetChecks) {
      btnResetChecks.addEventListener("click", () => {
        if (confirm(`'${currentJob}'의 모든 재료 체크 내역을 초기화하시겠습니까?`)) {
          checkedNodes.clear();
          saveCheckedNodes();
          renderAll();
        }
      });
    }

    // Inventory Events
    if (btnAutoCheckFromInv) {
      btnAutoCheckFromInv.addEventListener("click", () => {
        autoCheckFromInventory();
      });
    }

    if (btnToggleInvCollapse) {
      btnToggleInvCollapse.addEventListener("click", () => {
        invCollapsed = !invCollapsed;
        try { localStorage.setItem("dream_inv_collapsed", JSON.stringify(invCollapsed)); } catch (e) {}
        if (invBody) invBody.classList.toggle("collapsed", invCollapsed);
        btnToggleInvCollapse.textContent = invCollapsed ? "펼치기" : "접기";
        updateInvBarHeight();
      });
    }

    const tab1StickyEl = document.getElementById("tab1StickyTop");
    if (tab1StickyEl && window.ResizeObserver) {
      new ResizeObserver(() => {
        updateInvBarHeight();
      }).observe(tab1StickyEl);
    }

    if (btnAddInvItem && invItemSearch) {
      const addItemAction = () => {
        const name = invItemSearch.value.trim();
        const qty = parseInt(invItemQty.value) || 1;
        if (!name) return;
        userInventory[name] = (userInventory[name] || 0) + qty;
        saveInventory();
        invItemSearch.value = "";
        invItemQty.value = "1";
        if (invSearchSuggestions) invSearchSuggestions.style.display = "none";
        renderInventory();
      };

      btnAddInvItem.addEventListener("click", addItemAction);
      invItemSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addItemAction();
      });

      // Autocomplete suggestions for inventory search
      invItemSearch.addEventListener("input", (e) => {
        const val = e.target.value.trim().toLowerCase();
        if (!val || !invSearchSuggestions) {
          if (invSearchSuggestions) invSearchSuggestions.style.display = "none";
          return;
        }

        const allLeaves = getAllCurrentLeaves();
        const matchedNames = Array.from(new Set(allLeaves.map(l => l.name))).filter(n => n.toLowerCase().includes(val));

        invSearchSuggestions.innerHTML = "";
        if (matchedNames.length > 0) {
          matchedNames.slice(0, 5).forEach(mName => {
            const div = document.createElement("div");
            div.className = "inv-suggestion-item";
            div.textContent = mName;
            div.addEventListener("click", () => {
              invItemSearch.value = mName;
              invSearchSuggestions.style.display = "none";
            });
            invSearchSuggestions.appendChild(div);
          });
          invSearchSuggestions.style.display = "block";
        } else {
          invSearchSuggestions.style.display = "none";
        }
      });
    }

    // Side Panel Filter Controls
    if (btnToggleCompleted) {
      btnToggleCompleted.addEventListener("click", () => {
        showOnlyRemaining = !showOnlyRemaining;
        try { localStorage.setItem("dream_show_only_remaining", JSON.stringify(showOnlyRemaining)); } catch (err) {}
        btnToggleCompleted.classList.toggle("active", showOnlyRemaining);
        btnToggleCompleted.textContent = showOnlyRemaining ? "남은 것만 보기" : "전체 재료 보기";
        renderSideLevelList();
      });
    }

    if (btnToggleSideSync) {
      btnToggleSideSync.addEventListener("click", () => {
        sideSlotSync = !sideSlotSync;
        try { localStorage.setItem("dream_side_slot_sync", JSON.stringify(sideSlotSync)); } catch (err) {}
        btnToggleSideSync.classList.toggle("active", sideSlotSync);
        btnToggleSideSync.textContent = sideSlotSync ? "선택 부위만 보기" : "선택 부위 연동";
        renderSideLevelList();
      });
    }

    if (btnToggleCollapseAll) {
      btnToggleCollapseAll.addEventListener("click", () => {
        isAllCollapsed = !isAllCollapsed;
        btnToggleCollapseAll.textContent = isAllCollapsed ? "모두 펼치기" : "모두 접기";
        const groups = document.querySelectorAll(".side-level-group");
        groups.forEach(g => g.classList.toggle("collapsed", isAllCollapsed));
      });
    }

    if (btnTogglePanelMode) {
      btnTogglePanelMode.addEventListener("click", () => {
        sidePanelMode = (sidePanelMode === "sticky") ? "expanded" : "sticky";
        try { localStorage.setItem("dream_side_panel_mode", sidePanelMode); } catch (err) {}
        btnTogglePanelMode.classList.toggle("active", sidePanelMode === "expanded");
        btnTogglePanelMode.textContent = sidePanelMode === "expanded" ? "📜 전체 펼침" : "📌 화면 고정";
        const sidePanelEl = document.querySelector(".side-panel-sticky");
        if (sidePanelEl) {
          sidePanelEl.classList.toggle("mode-expanded", sidePanelMode === "expanded");
        }
      });
    }

    sideLevelFilterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        sideLevelFilterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        sideLevelFilter = btn.dataset.range;
        try { localStorage.setItem("dream_side_level_filter", sideLevelFilter); } catch (err) {}
        renderSideLevelList();
      });
    });

    if (sideSearchInput) {
      sideSearchInput.addEventListener("input", (e) => {
        sideSearchQuery = e.target.value.trim().toLowerCase();
        renderSideLevelList();
      });
    }

    // Gear Modal Events
    if (btnCloseGearModal) {
      btnCloseGearModal.addEventListener("click", () => {
        if (gearSelectModal) gearSelectModal.style.display = "none";
      });
    }
    if (gearModalSearch) {
      gearModalSearch.addEventListener("input", (e) => {
        modalSearchQuery = e.target.value.trim();
        renderGearModalList();
      });
    }
    window.addEventListener("click", (e) => {
      if (e.target === gearSelectModal) {
        gearSelectModal.style.display = "none";
      }
    });

    // Tab 3 Codex Search & Level Filter
    const codexSearch = document.getElementById("codexSearch");
    if (codexSearch) {
      codexSearch.addEventListener("input", () => renderCodexTab());
    }
    const codexLevelFilter = document.getElementById("codexLevelFilter");
    if (codexLevelFilter) {
      codexLevelFilter.addEventListener("change", () => renderCodexTab());
    }

    // Tab 4 Gear Codex Events
    gearCatButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        gearCatButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        gearCodexCat = btn.dataset.cat;
        if (gearCodexCat !== "무기") {
          weaponSubFilter = "ALL";
        }
        renderGearCodexTab();
      });
    });

    if (gearCodexSearch) {
      gearCodexSearch.addEventListener("input", (e) => {
        gearCodexSearchQuery = e.target.value.trim().toLowerCase();
        renderGearCodexTab();
      });
    }

    if (chkSynergyOnly) {
      chkSynergyOnly.addEventListener("change", (e) => {
        gearCodexSynergyOnly = e.target.checked;
        renderGearCodexTab();
      });
    }

    // Upload Modal Events
    if (btnOpenUpload) {
      btnOpenUpload.addEventListener("click", () => {
        if (uploadModal) uploadModal.classList.add("show");
      });
    }
    if (btnCloseModal) {
      btnCloseModal.addEventListener("click", () => {
        if (uploadModal) uploadModal.classList.remove("show");
      });
    }
    window.addEventListener("click", (e) => {
      if (e.target === uploadModal) {
        uploadModal.classList.remove("show");
      }
    });

    if (dropZone) {
      dropZone.addEventListener("click", () => excelFileInput.click());
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleExcelFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (excelFileInput) {
      excelFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleExcelFile(e.target.files[0]);
        }
      });
    }
  }

  // =========================================================================
  // Excel File Parsing on Client-Side
  // =========================================================================
  function handleExcelFile(file) {
    if (!window.XLSX) {
      alert("SheetJS 라이브러리를 불러올 수 없습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const parsed = parseWorkbookData(workbook);

        gameData = parsed;
        localStorage.setItem("dream_custom_data", JSON.stringify(parsed));
        if (uploadModal) uploadModal.classList.remove("show");

        if (!gameData.jobs[currentJob]) {
          currentJob = Object.keys(gameData.jobs)[0] || "프리스트";
        }

        loadActiveLoadout();
        loadCheckedNodes();
        renderJobSelector();
        renderAll();
        alert(`엑셀 데이터가 성공적으로 반영되었습니다!\n발견된 직업 수: ${Object.keys(gameData.jobs).length}개`);
      } catch (err) {
        console.error("Excel parse error:", err);
        alert("엑셀 파일 파싱 중 오류가 발생했습니다: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function detectColumns(headerRow) {
    const colMap = {};
    if (!headerRow) return colMap;
    headerRow.forEach((col, idx) => {
      const c = String(col || "").trim();
      if (["종류", "분류", "부위"].includes(c)) colMap.category = idx;
      else if (["아이템 이름", "아이템", "최종템", "아이템이름", "장비", "이름"].includes(c)) colMap.item = idx;
      else if (["재료", "필요재료", "재료이름"].includes(c)) colMap.material = idx;
      else if (["수량", "개수", "필요수량"].includes(c)) colMap.qty = idx;
      else if (["드랍 몬스터", "보스", "드랍", "획득처", "몬스터"].includes(c)) colMap.boss = idx;
      else if (["레벨", "몬스터 레벨", "보스레벨"].includes(c)) colMap.level = idx;
      else if (["이동지역", "지역", "위치"].includes(c)) colMap.location = idx;
      else if (["특수직업효과", "직업효과", "시너지"].includes(c)) colMap.synergy = idx;
    });
    return colMap;
  }

  function parseWorkbookData(wb) {
    const result = {
      jobs: {},
      job_list: [],
      all_job_list: (gameData && gameData.all_job_list) ? gameData.all_job_list : [
        "네크로맨서", "인형술사", "점성술사", "프리스트", "얼음마법사", "어둠마법사", "비전마법사",
        "화염마법사", "드루이드", "번개마법사", "원소마법사", "암살자", "궁수", "검성", "사수",
        "블레이드 스피릿", "거너", "머스킷티어", "싸움꾼", "기계공", "권법가", "격투가", "가디언",
        "살육자", "검혼", "검사", "광전사", "마검사", "죽음의기사", "배틀메이지", "성기사"
      ],
      bosses: [],
      category_gear: {},
      global_recipe_map: {}
    };

    const bossLevelLookup = {};
    const itemToBoss = {};

    // Mining items mapping
    const MINING_ITEMS = {
      "철광석": { boss: "채광", location: "광산", level: 0 },
      "은광석": { boss: "채광", location: "광산", level: 0 },
      "금광석": { boss: "채광", location: "광산", level: 0 },
      "맑은 샘의 보석": { boss: "채광", location: "멀록해변", level: 0 },
      "현빙": { boss: "채광", location: "운설산", level: 0 },
      "지옥석": { boss: "채광", location: "용암화산", level: 0 }
    };
    Object.keys(MINING_ITEMS).forEach(m => { itemToBoss[m] = MINING_ITEMS[m]; });

    // Parse Boss Sheet
    const bossSheet = wb.Sheets["보스"];
    if (bossSheet) {
      const bRows = window.XLSX.utils.sheet_to_json(bossSheet, { header: 1, defval: "" });
      let bHeaderIdx = 0;
      for (let i = 0; i < bRows.length; i++) {
        if (bRows[i].some(c => String(c).includes("보스") || String(c).includes("레벨"))) {
          bHeaderIdx = i;
          break;
        }
      }

      const colMap = detectColumns(bRows[bHeaderIdx]);
      const cLvl = colMap.level !== undefined ? colMap.level : 0;
      const cBoss = colMap.boss !== undefined ? colMap.boss : 1;
      const cMat = colMap.material !== undefined ? colMap.material : 2;
      const cLoc = colMap.location !== undefined ? colMap.location : 4;

      const bossMap = {};

      for (let i = bHeaderIdx + 1; i < bRows.length; i++) {
        const r = bRows[i];
        if (!r || r.length === 0) continue;
        const bName = normalizeName(r[cBoss]);
        if (!bName) continue;

        let lvl = String(r[cLvl] || "").replace(/\D/g, "");
        const lvlNum = lvl ? parseInt(lvl) : 0;
        const mat = normalizeName(r[cMat]);
        const loc = String(r[cLoc] || "").trim();

        if (bName.includes("채광") || bName.includes("채굴")) continue;

        if (!bossMap[bName]) {
          bossMap[bName] = {
            name: bName,
            level: lvlNum,
            level_str: lvlNum > 0 ? `Lv.${lvlNum}` : "",
            location: loc,
            drops: []
          };
          bossLevelLookup[bName] = lvlNum;
        }

        if (loc && !bossMap[bName].location) {
          bossMap[bName].location = loc;
        }

        if (mat && !bossMap[bName].drops.some(d => d.name === mat)) {
          const itType = (r.length > 3 && r[3]) ? String(r[3]).trim() : "아이템";
          bossMap[bName].drops.push({ name: mat, type: itType, level: lvlNum, level_str: lvlNum > 0 ? `Lv.${lvlNum}` : "" });
          itemToBoss[mat] = { boss: bName, level: lvlNum, level_str: lvlNum > 0 ? `Lv.${lvlNum}` : "", location: bossMap[bName].location, type: itType };
        }
      }

      // Propagate location from boss to all itemToBoss entries
      Object.keys(itemToBoss).forEach(mName => {
        const info = itemToBoss[mName];
        if (info.boss && bossMap[info.boss] && bossMap[info.boss].location && !info.location) {
          info.location = bossMap[info.boss].location;
        }
      });

      // Add consolidated mining entry
      const miningBoss = {
        name: "채광",
        level: 0,
        level_str: "채광",
        location: "광산 / 멀록해변 / 운설산 / 용암화산",
        drops: [
          { name: "철광석", type: "채광", level: 0, level_str: "채광" },
          { name: "은광석", type: "채광", level: 0, level_str: "채광" },
          { name: "금광석", type: "채광", level: 0, level_str: "채광" },
          { name: "맑은 샘의 보석", type: "채광", level: 0, level_str: "채광" },
          { name: "현빙", type: "채광", level: 0, level_str: "채광" },
          { name: "지옥석", type: "채광", level: 0, level_str: "채광" }
        ]
      };

      result.bosses = [miningBoss, ...Object.values(bossMap).sort((a, b) => a.level - b.level)];
    }

    // Parse 6 Category Sheets
    CATEGORIES.forEach(cat => {
      const sheet = wb.Sheets[cat];
      if (!sheet) return;

      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!rows || rows.length < 2) return;

      let hIdx = 0;
      for (let i = 0; i < rows.length; i++) {
        const cm = detectColumns(rows[i]);
        if (cm.item !== undefined || cm.material !== undefined) {
          hIdx = i;
          break;
        }
      }

      const colMap = detectColumns(rows[hIdx]);
      const cCat = colMap.category !== undefined ? colMap.category : 0;
      const cItem = colMap.item !== undefined ? colMap.item : 1;
      const cMat = colMap.material !== undefined ? colMap.material : 2;
      const cQty = colMap.qty !== undefined ? colMap.qty : 3;
      const cBoss = colMap.boss !== undefined ? colMap.boss : 4;
      const cLvl = colMap.level !== undefined ? colMap.level : 5;
      const cSyn = colMap.synergy !== undefined ? colMap.synergy : 6;

      const recipes = [];
      let currentItem = "";
      let currentRecipe = null;

      for (let i = hIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        const it = normalizeName(r[cItem]);
        const mat = normalizeName(r[cMat]);
        const qty = String(r[cQty] || "").trim();
        const boss = normalizeName(r[cBoss]);
        let lvl = String(r[cLvl] || "").replace(/\D/g, "");
        const syn = String(r[cSyn] || "").trim();

        if (it && it !== currentItem) {
          currentItem = it;
          const itemLvlNum = lvl ? parseInt(lvl) : 0;
          currentRecipe = {
            category: cat,
            name: currentItem,
            level: itemLvlNum,
            level_str: itemLvlNum > 0 ? `Lv.${itemLvlNum}` : "",
            materials: [],
            special_effect: syn,
            synergy_jobs: [],
            is_drop: false,
            drop_boss: "",
            drop_level: 0,
            drop_location: "",
            drop_type: "아이템"
          };

          // Find synergy jobs
          result.all_job_list.forEach(j => {
            if (syn.includes(j)) currentRecipe.synergy_jobs.push(j);
          });

          recipes.push(currentRecipe);
        }

        if (mat && currentRecipe) {
          let qVal = 1;
          let finalMat = mat;
          if (qty && !isNaN(qty)) {
            qVal = parseInt(qty);
          } else if (mat.includes("*")) {
            const parts = mat.split("*");
            finalMat = parts[0].trim();
            if (parts[1] && !isNaN(parts[1])) qVal = parseInt(parts[1]);
          }

          let finalBoss = boss;
          if (!finalBoss || finalBoss === "재료" || finalBoss === "아이템") {
            if (itemToBoss[finalMat]) {
              finalBoss = itemToBoss[finalMat].boss;
              if (!lvl) lvl = String(itemToBoss[finalMat].level);
            } else {
              finalBoss = "조합템";
            }
          }

          if (!lvl && finalBoss && bossLevelLookup[finalBoss]) {
            lvl = String(bossLevelLookup[finalBoss]);
          }

          const lvlNum = lvl ? parseInt(lvl) : 0;
          const lvlStr = (lvl && lvlNum > 0) ? `Lv.${lvl}` : ((finalBoss && finalBoss.includes("채광")) ? "채광" : "");

          currentRecipe.materials.push({
            name: finalMat,
            qty: qVal,
            boss: finalBoss || "조합템",
            level: lvlNum,
            level_str: lvlStr
          });
        }
      }

      recipes.forEach(rc => {
        if (rc.materials.length === 0) {
          const itLookup = normalizeName(rc.name);
          if (itemToBoss[itLookup]) {
            const dropInfo = itemToBoss[itLookup];
            rc.is_drop = true;
            rc.drop_boss = dropInfo.boss;
            rc.drop_level = dropInfo.level;
            rc.drop_location = dropInfo.location || "";
            rc.drop_type = dropInfo.type || "아이템";
            if (!rc.level && dropInfo.level) {
              rc.level = dropInfo.level;
              rc.level_str = `Lv.${dropInfo.level}`;
            }
          }
        }
        result.global_recipe_map[rc.name] = rc;
      });

      const usedAsMat = new Set();
      recipes.forEach(rc => {
        rc.materials.forEach(m => usedAsMat.add(m.name));
      });

      const endGear = recipes.filter(rc => !usedAsMat.has(rc.name)).sort((a, b) => b.level - a.level).map(rc => rc.name);
      const otherGear = recipes.filter(rc => usedAsMat.has(rc.name)).sort((a, b) => b.level - a.level).map(rc => rc.name);
      const topGear = [...endGear, ...otherGear];
      result.category_gear[cat] = {
        top_gear: topGear,
        recipes: recipes
      };
    });

    // Build 31 Jobs Loadouts & Recipes
    result.all_job_list.forEach(job => {
      const defLoadout = {};
      const jobRecommendations = {};

      CATEGORIES.forEach(cat => {
        const topList = (result.category_gear[cat] && result.category_gear[cat].top_gear) || [];
        const synItems = topList.filter(name => {
          const rec = result.global_recipe_map[name];
          return rec && rec.synergy_jobs && rec.synergy_jobs.includes(job);
        });

        jobRecommendations[cat] = synItems;
        defLoadout[cat] = synItems.length > 0 ? synItems[0] : (topList[0] || "");
      });

      result.jobs[job] = {
        name: job,
        default_loadout: defLoadout,
        recommendations: jobRecommendations,
        gear_slots: defLoadout
      };
      if (!result.job_list.includes(job)) result.job_list.push(job);
    });

    return result;
  }

  // Auto-init on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
