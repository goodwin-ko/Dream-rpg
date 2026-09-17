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
    "지옥석": "지옥석 조각",
    "지옥볼의 핵": "지옥불의 핵",
    "파천의뇌석": "파천의 뇌석",
    "빅옹의 결정": "빙옥의 결정",
    "끝없는 어룸의 로브": "끝없는 어둠의 로브",
  };

  function normalizeName(name) {
    if (!name) return "";
    const trimmed = String(name).trim();
    return ALIAS_MAP[trimmed] || trimmed;
  }

  // App State
  let gameData = null;
  let currentJob = "프리스트";
  let currentTab = "tree"; // "tree", "boss-route", "codex"
  let currentSlot = "ALL";
  let currentViewMode = "tree"; // "tree" or "flow"
  let checkedNodes = new Set(); // Stores unique nodeIds e.g. "무기__타오르는 별 마법봉__영혼 정화의 성목__1"
  let showOnlyRemaining = true; // Right panel filter: true = only needed items, false = all
  let sideSearchQuery = "";
  let sideLevelFilter = "ALL"; // Level range filter: "ALL", "1-260", "280-320", "340-360", "380-400"
  let sideSlotSync = false; // true = only show materials for currentSlot when currentSlot !== "ALL"
  let sidePanelMode = "sticky"; // "sticky" or "expanded"
  let isAllCollapsed = false;

  // DOM Elements
  const jobSelect = document.getElementById("jobSelect");
  const navTabs = document.querySelectorAll(".tab-btn");
  const slotButtons = document.querySelectorAll(".slot-btn");
  const viewModeButtons = document.querySelectorAll(".view-mode-btn");
  const tabContents = {
    tree: document.getElementById("tabTreeContent"),
    bossRoute: document.getElementById("tabBossRouteContent"),
    codex: document.getElementById("tabCodexContent")
  };
  const btnResetChecks = document.getElementById("btnResetChecks");
  const btnOpenUpload = document.getElementById("btnOpenUpload");
  const uploadModal = document.getElementById("uploadModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const dropZone = document.getElementById("dropZone");
  const excelFileInput = document.getElementById("excelFileInput");

  // Progress Banner Elements
  const overallProgressFill = document.getElementById("overallProgressFill");
  const overallProgressText = document.getElementById("overallProgressText");

  // Side Panel Elements
  const btnToggleCompleted = document.getElementById("btnToggleCompleted");
  const btnToggleSideSync = document.getElementById("btnToggleSideSync");
  const btnToggleCollapseAll = document.getElementById("btnToggleCollapseAll");
  const btnTogglePanelMode = document.getElementById("btnTogglePanelMode");
  const sideSearchInput = document.getElementById("sideSearchInput");
  const sideLevelList = document.getElementById("sideLevelList");
  const sideLevelFilterButtons = document.querySelectorAll(".level-filter-btn");

  // Initialize
  function init() {
    loadGameData();
    restoreSavedState();
    loadCheckedNodes();
    renderJobSelector();
    bindEvents();
    restoreUIState();
    renderAll();
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
      if (savedTab) currentTab = savedTab;

      const savedSlot = localStorage.getItem("dream_selected_slot");
      if (savedSlot) currentSlot = savedSlot;

      const savedViewMode = localStorage.getItem("dream_selected_view_mode");
      if (savedViewMode) currentViewMode = savedViewMode;

      const savedRemaining = localStorage.getItem("dream_show_only_remaining");
      if (savedRemaining !== null) {
        showOnlyRemaining = JSON.parse(savedRemaining);
      }

      const savedSideFilter = localStorage.getItem("dream_side_level_filter");
      if (savedSideFilter) sideLevelFilter = savedSideFilter;

      const savedSideSlotSync = localStorage.getItem("dream_side_slot_sync");
      if (savedSideSlotSync !== null) {
        sideSlotSync = JSON.parse(savedSideSlotSync);
      }

      const savedSidePanelMode = localStorage.getItem("dream_side_panel_mode");
      if (savedSidePanelMode) sidePanelMode = savedSidePanelMode;
    } catch (e) {
      console.error("Failed to restore saved state:", e);
    }
  }

  function restoreUIState() {
    if (jobSelect) jobSelect.value = currentJob;

    navTabs.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === currentTab);
    });

    Object.keys(tabContents).forEach(key => {
      if (tabContents[key]) tabContents[key].style.display = "none";
    });
    if (currentTab === "tree" && tabContents.tree) tabContents.tree.style.display = "block";
    else if (currentTab === "boss-route" && tabContents.bossRoute) tabContents.bossRoute.style.display = "block";
    else if (currentTab === "codex" && tabContents.codex) tabContents.codex.style.display = "block";

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

  function renderJobSelector() {
    if (!jobSelect || !gameData) return;
    jobSelect.innerHTML = "";

    const availableJobs = Object.keys(gameData.jobs || {});
    const allJobs = gameData.all_job_list || [currentJob];

    const optgroupAvailable = document.createElement("optgroup");
    optgroupAvailable.label = "준비된 직업 (조합 정보 활성화)";
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
      optgroupOthers.label = "대기 중인 직업 (엑셀 탭 추가 시 활성화)";
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

  function bindEvents() {
    if (jobSelect) {
      jobSelect.addEventListener("change", (e) => {
        currentJob = e.target.value;
        try { localStorage.setItem("dream_selected_job", currentJob); } catch (err) {}
        loadCheckedNodes();
        renderAll();
      });
    }

    navTabs.forEach(btn => {
      btn.addEventListener("click", () => {
        navTabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentTab = btn.dataset.tab;
        try { localStorage.setItem("dream_selected_tab", currentTab); } catch (err) {}

        Object.keys(tabContents).forEach(key => {
          if (tabContents[key]) tabContents[key].style.display = "none";
        });

        if (currentTab === "tree" && tabContents.tree) {
          tabContents.tree.style.display = "block";
        } else if (currentTab === "boss-route" && tabContents.bossRoute) {
          tabContents.bossRoute.style.display = "block";
        } else if (currentTab === "codex" && tabContents.codex) {
          tabContents.codex.style.display = "block";
        }
        renderAll();
      });
    });

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

    viewModeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        viewModeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentViewMode = btn.dataset.mode;
        try { localStorage.setItem("dream_selected_view_mode", currentViewMode); } catch (err) {}
        renderTreeTab();
      });
    });

    if (btnResetChecks) {
      btnResetChecks.addEventListener("click", () => {
        if (confirm(`'${currentJob}'의 모든 재료 체크 내역을 초기화하시겠습니까?`)) {
          checkedNodes.clear();
          saveCheckedNodes();
          renderAll();
        }
      });
    }

    // Right Side Panel Filter Controls
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

    if (btnOpenUpload) {
      btnOpenUpload.addEventListener("click", () => {
        uploadModal.classList.add("show");
      });
    }
    if (btnCloseModal) {
      btnCloseModal.addEventListener("click", () => {
        uploadModal.classList.remove("show");
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

    const codexSearch = document.getElementById("codexSearch");
    if (codexSearch) {
      codexSearch.addEventListener("input", () => renderCodexTab());
    }

    const codexLevelFilter = document.getElementById("codexLevelFilter");
    if (codexLevelFilter) {
      codexLevelFilter.addEventListener("change", () => renderCodexTab());
    }
  }

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
        
        if (Object.keys(parsed.jobs).length === 0) {
          alert("유효한 직업 아이템 시트를 찾을 수 없습니다.");
          return;
        }

        gameData = parsed;
        localStorage.setItem("dream_custom_data", JSON.stringify(parsed));
        uploadModal.classList.remove("show");

        if (!gameData.jobs[currentJob]) {
          currentJob = Object.keys(gameData.jobs)[0];
        }

        loadCheckedNodes();
        renderJobSelector();
        renderAll();
        alert(`엑셀 데이터가 성공적으로 반영되었습니다!\n발견된 직업: ${Object.keys(gameData.jobs).join(", ")}`);
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
      else if (["아이템 이름", "아이템", "최종템", "아이템이름", "장비"].includes(c)) colMap.item = idx;
      else if (["재료", "필요재료", "재료이름"].includes(c)) colMap.material = idx;
      else if (["개수", "수량"].includes(c)) colMap.qty = idx;
      else if (["보스", "드랍보스", "획득처", "보스이름"].includes(c)) colMap.boss = idx;
      else if (["레벨", "Lv", "렙"].includes(c)) colMap.level = idx;
    });
    return colMap;
  }

  function parseWorkbookData(wb) {
    const result = {
      jobs: {},
      bosses: [],
      job_list: [],
      all_job_list: (gameData && gameData.all_job_list) || [
        "프리스트", "가디언", "드루이드", "블레이드 스피릿", "얼음마법사", "검사", "버서커", "팔라딘", "워리어", "크루세이더",
        "소드마스터", "다크나이트", "블레이더", "랜서", "어쌔신",
        "스나이퍼", "보우마스터", "헌터", "트릭스터", "메이지",
        "아크메이지", "워록", "네크로맨서", "소서러", "엘리멘탈리스트",
        "샤먼", "수도승", "몽크", "퇴마사",
        "음유시인", "기공사", "격투가", "소울브링어", "블랙스미스", "연금술사"
      ]
    };

    const bossLevelLookup = {};
    const itemToBoss = {};

    // 1. Parse Boss sheet first
    if (wb.SheetNames.includes("보스")) {
      const sheet = wb.Sheets["보스"];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (rows && rows.length > 0) {
        const bossMap = {};
        const colMap = detectColumns(rows[0]);
        const cBoss = colMap.boss !== undefined ? colMap.boss : 0;
        const cLvl = colMap.level !== undefined ? colMap.level : 1;
        const cItem = colMap.item !== undefined ? colMap.item : 2;
        const cCat = colMap.category !== undefined ? colMap.category : 3;

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0) continue;
          const bName = normalizeName(r[cBoss]);
          const lvl = String(r[cLvl] || "").replace(/\D/g, "");
          const itName = normalizeName(r[cItem]);
          const cat = normalizeName(r[cCat]) || "아이템";
          if (!bName) continue;

          if (!bossMap[bName]) {
            bossMap[bName] = {
              name: bName,
              level: lvl ? parseInt(lvl) : 0,
              level_str: lvl ? `Lv.${lvl}` : "",
              drops: []
            };
          }
          if (itName) {
            bossMap[bName].drops.push({ name: itName, type: cat });
            const lvlNum = lvl ? parseInt(lvl) : 0;
            itemToBoss[itName] = { boss: bName, level: lvlNum };
          }
        }

        // Fallback mappings for unlisted drops
        if (!itemToBoss["이그니르의 심장"]) itemToBoss["이그니르의 심장"] = { boss: "작열하는 용 이그니르", level: 340 };
        if (!itemToBoss["이그닐의 심장"]) itemToBoss["이그닐의 심장"] = { boss: "작열하는 용 이그니르", level: 340 };
        if (!itemToBoss["현빙"]) itemToBoss["현빙"] = { boss: "눈사람", level: 320 };

        if (bossMap["작열하는 용 이그니르"]) {
          const drops = bossMap["작열하는 용 이그니르"].drops.map(d => d.name);
          if (!drops.includes("이그니르의 심장") && !drops.includes("이그닐의 심장")) {
            bossMap["작열하는 용 이그니르"].drops.push({ name: "이그니르의 심장", type: "재료" });
          }
        }
        if (bossMap["눈사람"]) {
          const drops = bossMap["눈사람"].drops.map(d => d.name);
          if (!drops.includes("현빙")) {
            bossMap["눈사람"].drops.push({ name: "현빙", type: "재료" });
          }
        }

        result.bosses = Object.values(bossMap).sort((a, b) => a.level - b.level);
        result.bosses.forEach(b => {
          bossLevelLookup[b.name] = b.level;
        });
      }
    }

    // 2. Parse Job sheets
    wb.SheetNames.forEach(sheetName => {
      const nameClean = sheetName.trim();
      if (nameClean === "보스" || nameClean.startsWith("Sheet")) return;

      const sheet = wb.Sheets[sheetName];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!rows || rows.length < 2) return;

      const jobName = nameClean;
      if (!result.job_list.includes(jobName)) result.job_list.push(jobName);

      // Detect header index
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

      // Pre-scan recipe names to distinguish combo sub-recipes from raw boss drops
      const allJobRecipes = new Set();
      for (let i = hIdx + 1; i < rows.length; i++) {
        const it = normalizeName(rows[i][cItem]);
        if (it) allJobRecipes.add(it);
      }

      const recipes = [];
      let currentCat = "";
      let currentItem = "";
      let currentRecipe = null;

      for (let i = hIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        const cat = normalizeName(r[cCat]);
        const it = normalizeName(r[cItem]);
        const mat = normalizeName(r[cMat]);
        const qty = String(r[cQty] || "").trim();
        const boss = normalizeName(r[cBoss]);
        let lvl = String(r[cLvl] || "").replace(/\D/g, "");

        if (cat) currentCat = cat;
        if (it && it !== currentItem) {
          currentItem = it;
          currentRecipe = {
            category: currentCat,
            name: currentItem,
            materials: []
          };
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
            if (allJobRecipes.has(finalMat)) {
              finalBoss = "조합템";
            } else if (itemToBoss[finalMat]) {
              finalBoss = itemToBoss[finalMat].boss;
              if (!lvl) lvl = String(itemToBoss[finalMat].level);
            } else {
              finalBoss = "조합템";
            }
          }

          if (!lvl && finalBoss && bossLevelLookup[finalBoss]) {
            lvl = String(bossLevelLookup[finalBoss]);
          }

          currentRecipe.materials.push({
            name: finalMat,
            qty: qVal,
            boss: finalBoss || "조합템",
            level: lvl ? parseInt(lvl) : 0,
            level_str: lvl ? `Lv.${lvl}` : ""
          });
        }
      }

      const recipeMap = {};
      recipes.forEach(rc => { recipeMap[rc.name] = rc; });

      const usedAsMat = new Set();
      recipes.forEach(rc => {
        rc.materials.forEach(m => {
          if (m.boss === "조합템" || recipeMap[m.name]) {
            usedAsMat.add(m.name);
          }
        });
      });

      const categoriesOrder = ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"];
      const gearSlots = {};
      categoriesOrder.forEach(c => { gearSlots[c] = []; });

      recipes.forEach(rc => {
        if (!usedAsMat.has(rc.name)) {
          const c = rc.category;
          if (!gearSlots[c]) gearSlots[c] = [];
          gearSlots[c].push(rc.name);
        }
      });

      result.jobs[jobName] = {
        name: jobName,
        recipes: recipes,
        recipe_map: recipeMap,
        gear_slots: gearSlots
      };
    });

    return result;
  }

  function getJobData() {
    if (!gameData || !gameData.jobs) return null;
    return gameData.jobs[currentJob] || null;
  }

  // Get all leaf (raw boss drop) materials required for a root item with UNIQUE path-based nodeId
  function getLeafMaterials(rootItemName, slot, recipeMap) {
    const leaves = [];

    function traverse(itemName, currentPath, pathDisplay) {
      const recipe = recipeMap[itemName];
      if (!recipe) return;

      recipe.materials.forEach((mat, idx) => {
        const subRecipe = recipeMap[mat.name];
        const isCombo = mat.boss === "조합템" || !!subRecipe;
        const nextCurrentPath = [...currentPath, `${mat.name}#${idx}`];
        const nextPathDisplay = `${pathDisplay} > ${mat.name}`;

        if (isCombo && subRecipe) {
          traverse(mat.name, nextCurrentPath, nextPathDisplay);
        } else {
          const nodeId = nextCurrentPath.join("__");
          leaves.push({
            id: nodeId,
            slot: slot,
            parentRecipe: recipe.name,
            rootItem: rootItemName,
            path: nextPathDisplay,
            name: mat.name,
            qty: mat.qty || 1,
            boss: mat.boss,
            level: mat.level,
            level_str: mat.level_str
          });
        }
      });
    }

    traverse(rootItemName, [slot, rootItemName], `${slot}: ${rootItemName}`);
    return leaves;
  }

  // Helper to get all leaf nodes under any arbitrary subtree node
  function getSubtreeLeaves(itemName, slot, recipeMap, currentPath, pathDisplay) {
    const leaves = [];

    function traverse(name, path, disp) {
      const rec = recipeMap[name];
      if (!rec) return;

      rec.materials.forEach((m, idx) => {
        const sub = recipeMap[m.name];
        const isCombo = m.boss === "조합템" || !!sub;
        const nextPath = [...path, `${m.name}#${idx}`];
        const nextDisp = `${disp} > ${m.name}`;

        if (isCombo && sub) {
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

  // Master Render Function
  function renderAll() {
    updateProgressStats();
    if (currentTab === "tree") {
      renderTreeTab();
      renderSideLevelList();
    } else if (currentTab === "boss-route") {
      renderBossRouteTab();
    } else if (currentTab === "codex") {
      renderCodexTab();
    }
  }

  function updateProgressStats() {
    const jobData = getJobData();
    if (!jobData) return;

    let totalNodes = 0;
    let checkedCount = 0;

    const slots = ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"];
    slots.forEach(slot => {
      const topItems = jobData.gear_slots[slot] || [];
      let slotTotal = 0;
      let slotChecked = 0;

      topItems.forEach(item => {
        const leaves = getLeafMaterials(item, slot, jobData.recipe_map);
        leaves.forEach(leaf => {
          slotTotal++;
          if (checkedNodes.has(leaf.id)) {
            slotChecked++;
          }
        });
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

  // Render Tab 1: Crafting Tree View (Left Column)
  function renderTreeTab() {
    const container = document.getElementById("gearGrid");
    if (!container) return;
    container.innerHTML = "";

    const jobData = getJobData();
    if (!jobData) {
      container.innerHTML = `<div class="empty-msg">선택한 직업('${currentJob}')에 대한 조합 정보가 없습니다.</div>`;
      return;
    }

    const slotsToShow = currentSlot === "ALL" 
      ? ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"]
      : [currentSlot];

    slotsToShow.forEach(slot => {
      const topItems = jobData.gear_slots[slot] || [];
      topItems.forEach(topItemName => {
        const card = createGearCard(topItemName, slot, jobData);
        container.appendChild(card);
      });
    });
  }

  function createGearCard(itemName, slot, jobData) {
    const card = document.createElement("div");
    card.className = `gear-card slot-${slot}`;

    const leaves = getLeafMaterials(itemName, slot, jobData.recipe_map);
    let checkedInCard = 0;
    leaves.forEach(l => { if (checkedNodes.has(l.id)) checkedInCard++; });
    const pct = leaves.length > 0 ? Math.round((checkedInCard / leaves.length) * 100) : 0;

    const header = document.createElement("div");
    header.className = "gear-card-header";
    header.innerHTML = `
      <div class="gear-info">
        <span class="slot-tag ${slot}">${slot}</span>
        <h3 class="gear-title">${itemName}</h3>
      </div>
      <div class="gear-card-actions">
        <span class="gear-progress-text">${leaves.length > 0 ? `달성률: <strong>${pct}%</strong> (${checkedInCard}/${leaves.length})` : `<span style="color: var(--text-muted); font-size: 0.85rem;">조합 정보 준비 중</span>`}</span>
        <button class="btn-toggle-tree" data-target="body-${itemName.replace(/\s+/g, '_')}">펼치기/접기</button>
      </div>
    `;

    const body = document.createElement("div");
    body.className = "gear-card-body";
    body.id = `body-${itemName.replace(/\s+/g, '_')}`;

    if (currentViewMode === "tree") {
      const treeRoot = document.createElement("ul");
      treeRoot.className = "tree-root";
      renderTreeNode(itemName, slot, treeRoot, jobData.recipe_map, 0, [slot, itemName], `${slot}: ${itemName}`);
      body.appendChild(treeRoot);
    } else {
      const flowContainer = createFlowView(itemName, slot, jobData.recipe_map, leaves);
      body.appendChild(flowContainer);
    }

    const remainingBox = createRemainingMaterialsBox(leaves);
    body.appendChild(remainingBox);

    const toggleBtn = header.querySelector(".btn-toggle-tree");
    toggleBtn.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  function renderTreeNode(itemName, slot, parentEl, recipeMap, depth, currentPath, pathDisplay) {
    const recipe = recipeMap[itemName];
    const li = document.createElement("li");
    li.className = "tree-node";

    if (recipe) {
      const itemBox = document.createElement("div");
      itemBox.className = "tree-item-box is-composite";

      const subLeaves = getSubtreeLeaves(itemName, slot, recipeMap, currentPath, pathDisplay);
      const isComplete = subLeaves.length > 0 && subLeaves.every(l => checkedNodes.has(l.id));
      if (isComplete) itemBox.classList.add("completed");

      itemBox.innerHTML = `
        <span class="badge-craft">조합</span>
        <span class="item-name">${itemName}</span>
        ${recipe.category ? `<span class="slot-tag ${recipe.category}">${recipe.category}</span>` : ""}
      `;

      li.appendChild(itemBox);

      const childrenUl = document.createElement("ul");
      childrenUl.className = "tree-children";

      if (recipe.materials.length === 0) {
        const emptyNotice = document.createElement("li");
        emptyNotice.className = "tree-node";
        emptyNotice.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem; padding: 4px 12px; display: inline-block;">(세부 조합식 정보 준비 중)</span>`;
        childrenUl.appendChild(emptyNotice);
      } else {
        recipe.materials.forEach((mat, idx) => {
          renderTreeMaterial(mat, idx, recipe.name, slot, childrenUl, recipeMap, depth + 1, currentPath, pathDisplay);
        });
      }

      li.appendChild(childrenUl);
    }

    parentEl.appendChild(li);
  }

  function renderTreeMaterial(mat, matIndex, parentRecipeName, slot, parentEl, recipeMap, depth, currentPath, pathDisplay) {
    const isSubRecipe = mat.boss === "조합템" || !!recipeMap[mat.name];
    const nextCurrentPath = [...currentPath, `${mat.name}#${matIndex}`];
    const nextPathDisplay = `${pathDisplay} > ${mat.name}`;

    if (isSubRecipe && recipeMap[mat.name]) {
      renderTreeNode(mat.name, slot, parentEl, recipeMap, depth, nextCurrentPath, nextPathDisplay);
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

      if (mat.boss && mat.boss !== "조합템") {
        const bossBadge = document.createElement("span");
        bossBadge.className = "badge-boss";
        bossBadge.textContent = `👹 ${mat.boss}`;
        itemBox.appendChild(bossBadge);
      }

      if (mat.level_str || mat.level) {
        const lvlBadge = document.createElement("span");
        lvlBadge.className = "badge-level";
        lvlBadge.textContent = mat.level_str || `Lv.${mat.level}`;
        itemBox.appendChild(lvlBadge);
      }

      li.appendChild(itemBox);
      parentEl.appendChild(li);
    }
  }

  function createFlowView(rootItemName, slot, recipeMap, leaves) {
    const container = document.createElement("div");
    container.className = "flow-view-container";

    const steps = [];
    const visited = new Set();

    function collectSteps(name) {
      if (visited.has(name)) return;
      const rec = recipeMap[name];
      if (!rec) return;

      rec.materials.forEach(m => {
        if (recipeMap[m.name]) collectSteps(m.name);
      });

      visited.add(name);
      steps.push(rec);
    }

    collectSteps(rootItemName);

    steps.forEach((stepRecipe, index) => {
      const stepCard = document.createElement("div");
      stepCard.className = "flow-step-card";

      const isFinal = (index === steps.length - 1);
      stepCard.innerHTML = `
        <div class="flow-step-header">
          <div class="flow-step-target">
            <span class="flow-step-number">Step ${index + 1}${isFinal ? " (최종 완성)" : ""}</span>
            <strong>${stepRecipe.name}</strong>
          </div>
        </div>
      `;

      const matsList = document.createElement("div");
      matsList.className = "flow-mats-list";

      if (stepRecipe.materials.length === 0) {
        matsList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 6px 12px;">세부 조합 정보 준비 중</div>`;
      } else {
        stepRecipe.materials.forEach((m, mIdx) => {
        const matItem = document.createElement("div");
        matItem.className = "flow-mat-item";
        const isSubRecipe = m.boss === "조합템" || !!recipeMap[m.name];
        const matchingLeaves = (leaves || []).filter(l => l.parentRecipe === stepRecipe.name && l.name === m.name);
        const isChecked = matchingLeaves.length > 0 && matchingLeaves.every(l => checkedNodes.has(l.id));
        if (isChecked) matItem.classList.add("checked");

        matItem.innerHTML = `
          <input type="checkbox" class="tree-checkbox" ${isChecked ? "checked" : ""} />
          <span class="item-name">${m.name} x${m.qty || 1}</span>
          ${isSubRecipe 
            ? '<span class="badge-craft">조합템</span>'
            : `<span class="badge-boss">${m.boss}</span> ${m.level_str ? `<span class="badge-level">${m.level_str}</span>` : ''}`
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

  // Render Right Column: Sticky Level-Based Farming Checklist
  function renderSideLevelList() {
    if (!sideLevelList) return;
    sideLevelList.innerHTML = "";

    const jobData = getJobData();
    if (!jobData) return;

    // Gather raw material leaf nodes (either for selected slot or all slots)
    const allLeaves = [];
    const slots = (sideSlotSync && currentSlot !== "ALL")
      ? [currentSlot]
      : ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"];

    slots.forEach(slot => {
      (jobData.gear_slots[slot] || []).forEach(topItem => {
        const leaves = getLeafMaterials(topItem, slot, jobData.recipe_map);
        allLeaves.push(...leaves);
      });
    });

    // Group leaves by Level
    const levelGroups = {};
    allLeaves.forEach(l => {
      const lvl = l.level || 0;
      if (!levelGroups[lvl]) {
        levelGroups[lvl] = {
          level: lvl,
          level_str: l.level_str || (lvl > 0 ? `Lv.${lvl}` : "일반"),
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

    // Sort by level ascending and filter by sideLevelFilter
    const sortedLevels = Object.values(levelGroups).sort((a, b) => a.level - b.level).filter(grp => {
      if (sideLevelFilter === "ALL") return true;
      const [min, max] = sideLevelFilter.split("-").map(Number);
      if (max) {
        return grp.level >= min && grp.level <= max;
      } else {
        return grp.level >= min;
      }
    });

    let renderedGroupCount = 0;

    sortedLevels.forEach(grp => {
      const matList = Object.values(grp.materials);

      // Filter by search query if present
      const matchedMats = matList.filter(m => {
        if (!sideSearchQuery) return true;
        return m.name.toLowerCase().includes(sideSearchQuery) || 
               (m.boss && m.boss.toLowerCase().includes(sideSearchQuery));
      });

      if (matchedMats.length === 0) return;

      // Filter by showOnlyRemaining
      const displayMats = showOnlyRemaining
        ? matchedMats.filter(m => m.nodes.some(n => !checkedNodes.has(n.id)))
        : matchedMats;

      if (displayMats.length === 0 && showOnlyRemaining) return;

      renderedGroupCount++;

      // Calculate level statistics
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

      // Accordion click toggle
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

        // Top line: Name & Boss on left, Steppers on right
        const top = document.createElement("div");
        top.className = "side-mat-top";
        top.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
            <span class="side-mat-name" title="${m.name}">${m.name}</span>
            <span class="side-mat-boss-tag">👹 ${m.boss}</span>
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

        // Middle line: Count badge on left, Slot badges on right
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

  // Render Tab 2: Boss Farming Route Report with Quantity Tracker
  function renderBossRouteTab() {
    const container = document.getElementById("bossRouteGrid");
    if (!container) return;
    container.innerHTML = "";

    const jobData = getJobData();
    if (!jobData) {
      container.innerHTML = `<div class="empty-msg">선택한 직업에 대한 데이터가 없습니다.</div>`;
      return;
    }

    const allLeaves = [];
    const slots = ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"];
    slots.forEach(slot => {
      (jobData.gear_slots[slot] || []).forEach(topItem => {
        const leaves = getLeafMaterials(topItem, slot, jobData.recipe_map);
        allLeaves.push(...leaves);
      });
    });

    const bossMap = {};
    allLeaves.forEach(leaf => {
      const bName = leaf.boss || "기타/일반";
      if (bName === "조합템") return;

      if (!bossMap[bName]) {
        bossMap[bName] = {
          boss_name: bName,
          level: leaf.level || 0,
          level_str: leaf.level_str || (leaf.level ? `Lv.${leaf.level}` : ""),
          materials: {}
        };
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

    sortedBosses.forEach(bData => {
      const card = document.createElement("div");
      card.className = "boss-route-card";

      const matList = Object.values(bData.materials);
      const isAllCleared = matList.every(m => m.nodes.every(n => checkedNodes.has(n.id)));
      if (isAllCleared) card.classList.add("all-cleared");

      card.innerHTML = `
        <div class="boss-route-header">
          <h4 class="boss-route-title">👹 ${bData.boss_name}</h4>
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
          if (nextNode) {
            toggleNodeCheck(nextNode.id, true);
          }
        });

        btnMinus.addEventListener("click", () => {
          const lastCheckedNode = [...m.nodes].reverse().find(n => checkedNodes.has(n.id));
          if (lastCheckedNode) {
            toggleNodeCheck(lastCheckedNode.id, false);
          }
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

  // Render Tab 3: Boss Codex
  function renderCodexTab() {
    const container = document.getElementById("bossCodexGrid");
    if (!container || !gameData || !gameData.bosses) return;
    container.innerHTML = "";

    const searchInput = document.getElementById("codexSearch");
    const levelSelect = document.getElementById("codexLevelFilter");
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const lvlFilter = levelSelect ? levelSelect.value : "ALL";

    const jobData = getJobData();
    const neededCounts = {};
    if (jobData) {
      const slots = ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"];
      slots.forEach(slot => {
        (jobData.gear_slots[slot] || []).forEach(topItem => {
          const leaves = getLeafMaterials(topItem, slot, jobData.recipe_map);
          leaves.forEach(l => {
            neededCounts[l.name] = (neededCounts[l.name] || 0) + 1;
          });
        });
      });
    }

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
        const matchDrop = b.drops.some(d => d.name.toLowerCase().includes(query));
        if (!matchBoss && !matchDrop) return false;
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

      card.innerHTML = `
        <div class="codex-card-header">
          <span class="codex-boss-name">👹 ${b.name}</span>
          <span class="badge-level">${b.level_str || `Lv.${b.level}`}</span>
        </div>
      `;

      const ul = document.createElement("ul");
      ul.className = "codex-drop-list";

      b.drops.forEach(d => {
        const needed = neededCounts[d.name] || 0;
        const li = document.createElement("li");
        li.className = `codex-drop-item ${needed > 0 ? "is-needed" : ""}`;

        li.innerHTML = `
          <span class="drop-name">${d.name}</span>
          <div>
            ${needed > 0 ? `<span class="needed-badge">★ ${currentJob} ${needed}개 필요</span> ` : ""}
            <span class="drop-type-tag">${d.type || "드랍"}</span>
          </div>
        `;
        ul.appendChild(li);
      });

      card.appendChild(ul);
      container.appendChild(card);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
