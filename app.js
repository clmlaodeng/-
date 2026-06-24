const form = document.querySelector("#generatorForm");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const finderGroupsPanel = document.querySelector("#finderGroups");
const selectedPackPanel = document.querySelector("#selectedPackPanel");
const selectedPackSummary = document.querySelector("#selectedPackSummary");
const selectedPackTypes = document.querySelector("#selectedPackTypes");
const coverageMap = document.querySelector("#coverageMap");
const coverageSummary = document.querySelector("#coverageSummary");
const countInput = document.querySelector("#count");
const categoryInput = document.querySelector("#category");
const typeInput = document.querySelector("#type");
const includeSolutionInput = document.querySelector("#includeSolution");
const useAiInput = document.querySelector("#useAi");
const aiStatus = document.querySelector("#aiStatus");
const message = document.querySelector("#message");
const typeInfo = document.querySelector("#typeInfo span");
const typeProfileTitle = document.querySelector("#typeProfileTitle");
const typeProfilePattern = document.querySelector("#typeProfilePattern");
const typeProfileChips = document.querySelector("#typeProfileChips");
const typeProfileFocus = document.querySelector("#typeProfileFocus");
const typeProfileExamples = document.querySelector("#typeProfileExamples");
const studentList = document.querySelector("#studentList");
const answerList = document.querySelector("#answerList");
const printButton = document.querySelector("#printButton");
const categoryCountLabel = document.querySelector("#categoryCountLabel");
const typeCountLabel = document.querySelector("#typeCountLabel");

let catalog = [];
let finderGroups = [];
let selectedPackTypeIds = [];
let selectedPackLabel = "";

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/脳/g, "*")
    .replace(/梅/g, "/");
}

function isUsefulPartialAlias(alias) {
  return alias.length >= 2;
}

function setMessage(text, strong = false) {
  message.textContent = text;
  message.classList.toggle("strong", strong);
}

function createListItem(className, children) {
  const item = document.createElement("li");
  item.className = className;
  children.forEach((child) => item.appendChild(child));
  return item;
}

function textBlock(className, text) {
  const block = document.createElement("div");
  block.className = className;
  block.textContent = text;
  return block;
}

function renderProblems(problems) {
  studentList.replaceChildren();
  answerList.replaceChildren();

  problems.forEach((problem) => {
    const studentChildren = [
      textBlock("problem-tag", problem.typeName || "专项题型"),
      textBlock("problem-question", problem.question),
    ];

    if (problem.mode === "diagnosis" && problem.wrongWork) {
      studentChildren.push(textBlock("wrong-work", `错误过程：${problem.wrongWork}`));
    }

    studentList.appendChild(createListItem("problem-card", studentChildren));

    const answerChildren = [
      textBlock("problem-tag", `${problem.typeName || "专项题型"} · ${problem.focus || "训练解方程能力"}`),
      textBlock("problem-question", problem.question),
      textBlock("answer-line", `答案：x = ${problem.answer}`),
    ];

    if (problem.modelEquation) {
      answerChildren.push(textBlock("model-line", `列式：${problem.modelEquation}`));
    }

    if (problem.wrongWork) {
      answerChildren.push(textBlock("wrong-work", `错误过程：${problem.wrongWork}`));
    }

    if (problem.errorPoint) {
      answerChildren.push(textBlock("error-point", `错误点：${problem.errorPoint}`));
    }

    if (problem.solution) {
      answerChildren.push(textBlock("solution-line", `解析：${problem.solution}`));
    }

    answerList.appendChild(createListItem("answer-card", answerChildren));
  });
}

function getSelectedCategory() {
  return catalog.find((category) => category.id === categoryInput.value) || catalog[0];
}

function getSelectedType() {
  const category = getSelectedCategory();
  const type = category?.types.find((item) => item.id === typeInput.value) || category?.types[0];
  return type ? { ...type, categoryName: category.name } : type;
}

function getAllTypes() {
  return catalog.flatMap((category) =>
    category.types.map((type) => ({
      ...type,
      categoryId: category.id,
      categoryName: category.name,
    }))
  );
}

function findTypeById(typeId) {
  return getAllTypes().find((type) => type.id === typeId);
}

function renderSelectedPack() {
  selectedPackTypes.replaceChildren();

  if (!selectedPackTypeIds.length) {
    selectedPackPanel.hidden = true;
    selectedPackSummary.textContent = "选择一个专题包后显示覆盖题型。";
    return;
  }

  const types = selectedPackTypeIds.map((typeId) => findTypeById(typeId)).filter(Boolean);
  selectedPackPanel.hidden = false;
  selectedPackSummary.textContent = `${selectedPackLabel}：覆盖 ${types.length} 个细分题型，生成时会循环混合出题。`;

  types.forEach((type) => {
    const chip = document.createElement("span");
    chip.className = "pack-type-chip";
    chip.textContent = `${type.name}｜${type.pattern}`;
    selectedPackTypes.appendChild(chip);
  });
}

function clearSelectedPack() {
  selectedPackTypeIds = [];
  selectedPackLabel = "";
  renderSelectedPack();
}

function selectType(categoryId, typeId) {
  clearSelectedPack();
  categoryInput.value = categoryId;
  renderTypes();
  typeInput.value = typeId;
  renderTypeInfo();
}

function inferTypeIdsFromEquation(query) {
  const compact = normalizeSearchText(query).replace(/（/g, "(").replace(/）/g, ")");
  if (!compact.includes("=") || !compact.includes("x")) return [];

  const inferred = [];
  const add = (typeId) => {
    if (!inferred.includes(typeId)) inferred.push(typeId);
  };

  if (/%x=|%\*?x=/.test(compact)) add("percent_coefficient_equation");
  if (/x:\d+(\.\d+)?=\d+(\.\d+)?:\d+(\.\d+)?/.test(compact)) add("proportion_equation");
  if (/^\d+(\.\d+)?-x=/.test(compact)) add("unknown_as_subtrahend");
  if (/^\d+(\.\d+)?\/x=/.test(compact)) add("unknown_as_divisor");
  if (/\([^)]*x[^)]*\)\/\d/.test(compact) && /\+\d|-\d/.test(compact)) add("denominator_bracket_comprehensive");
  if (/\d+\([^)]*x[^)]*\)=/.test(compact)) add("bracket_as_whole");
  if (/-\([^)]*x[^)]*\)/.test(compact)) add("minus_before_bracket");
  if (/x\/\d/.test(compact)) add("fraction_term_equation");
  if (/x.*=.*x/.test(compact)) add("coefficient_to_one_comprehensive");
  if (/(^|[+\-=])\d*(\.\d+)?x[+\-]\d*(\.\d+)?x/.test(compact)) add("combine_like_terms");

  return inferred;
}

function scoreCatalogMatch(type, normalizedQuery) {
  const aliases = (type.keywords || []).map(normalizeSearchText);
  const explicitAliases = aliases.filter((keyword) => keyword.length > 0);
  const partialAliases = explicitAliases.filter(isUsefulPartialAlias);
  if (explicitAliases.some((alias) => alias === normalizedQuery)) return 100;
  if (normalizeSearchText(type.name) === normalizedQuery) return 90;
  if (partialAliases.some((alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias))) return 80;

  const directText = normalizeSearchText([type.name, type.pattern, type.focus, ...(type.examples || [])].join(" "));
  if (directText.includes(normalizedQuery)) return 60;

  const categoryText = normalizeSearchText(type.categoryName);
  if (categoryText.includes(normalizedQuery)) return 20;

  const haystack = normalizeSearchText(
    [
      type.categoryName,
      type.name,
      type.pattern,
      type.focus,
      ...(type.examples || []),
      ...(type.keywords || []),
    ].join(" ")
  );
  return haystack.includes(normalizedQuery) ? 10 : 0;
}

function getSearchMatchReason(type, query) {
  const normalizedQuery = normalizeSearchText(query);
  const aliases = (type.keywords || []).map(normalizeSearchText);
  const directText = normalizeSearchText([type.name, type.pattern, type.focus, ...(type.examples || [])].join(" "));

  if (inferTypeIdsFromEquation(query).includes(type.id)) return "根据粘贴例题定位";
  if (normalizeSearchText(type.name) === normalizedQuery) return "细分题型名称完全匹配";
  if (aliases.some((alias) => alias === normalizedQuery)) return "教师常用说法完全匹配";
  if (aliases.some((alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias))) {
    return "命中同义词/课堂说法";
  }
  if (directText.includes(normalizedQuery)) return "命中题型结构、训练重点或例题";
  if (normalizeSearchText(type.categoryName).includes(normalizedQuery)) return "命中大专项分类";
  return "相关题型推荐";
}

function searchCatalog(query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const allTypes = getAllTypes();
  const inferredResults = inferTypeIdsFromEquation(query)
    .map((typeId) => allTypes.find((type) => type.id === typeId))
    .filter(Boolean);
  const scoredResults = inferredResults.map((type) => ({ type, score: 120 }));

  allTypes.forEach((type, index) => {
    if (scoredResults.some((result) => result.type.id === type.id)) return;
    const score = scoreCatalogMatch(type, normalizedQuery);
    if (score > 0) {
      scoredResults.push({ type, score, index });
    }
  });

  return scoredResults
    .sort((a, b) => b.score - a.score || (a.index || 0) - (b.index || 0))
    .map((item) => item.type);
}

function selectFinderItem(item) {
  selectedPackTypeIds = Array.isArray(item.typeIds) ? item.typeIds : [];
  selectedPackLabel = item.label;
  renderSelectedPack();
  applySearchQuery(item.query);
  if (selectedPackTypeIds.length > 0) {
    setMessage(`已选择「${item.label}」组合包，点击生成会混合这些细分题型。`, true);
  }
}

function renderNoResultSuggestions(query) {
  const wrapper = document.createElement("div");
  wrapper.className = "no-result-suggestions";

  const text = document.createElement("p");
  text.textContent = `暂时没有精确匹配「${query}」。可以先从这些高频专题包进入，再微调细分题型。`;
  wrapper.appendChild(text);

  finderGroups
    .flatMap((group) => group.items || [])
    .slice(0, 6)
    .forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "no-result-suggestion";
      button.textContent = item.label;
      button.addEventListener("click", () => selectFinderItem(item));
      wrapper.appendChild(button);
    });

  searchResults.appendChild(wrapper);
}

function renderSearchResults() {
  const allResults = searchCatalog(searchInput.value);
  const results = allResults.slice(0, 8);
  searchResults.replaceChildren();

  if (!searchInput.value.trim()) {
    searchResults.textContent = "可以直接搜：五年级上册、六年级比例、初一一元一次方程、小数点错位、顺逆水；也可以直接粘贴 3(x+2)=20、30%x=12 这类例题。";
    return;
  }

  if (results.length === 0) {
    renderNoResultSuggestions(searchInput.value.trim());
    return;
  }

  const summary = document.createElement("div");
  summary.className = "search-summary";
  summary.textContent = `找到 ${allResults.length} 个匹配题型，优先展示最相关的 ${results.length} 个。`;
  searchResults.appendChild(summary);

  results.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";

    const title = document.createElement("span");
    title.textContent = `${type.categoryName} / ${type.name}：${type.pattern}`;

    const meta = document.createElement("small");
    meta.className = "type-meta";
    meta.textContent = `${type.stage} · ${(type.displayTags || []).join(" / ")} · ${type.exampleHint}`;

    const reason = document.createElement("small");
    reason.className = "match-reason";
    reason.textContent = getSearchMatchReason(type, searchInput.value);

    button.append(title, meta, reason);
    button.addEventListener("click", () => {
      selectType(type.categoryId, type.id);
      searchInput.value = type.name;
      renderSearchResults();
    });
    searchResults.appendChild(button);
  });
}

function renderCoverageMap() {
  const types = getAllTypes();
  coverageMap.replaceChildren();
  coverageSummary.textContent = `${catalog.length} 大专项，${types.length} 个细分题型；计算、应用题、错因诊断都在一个入口里。`;

  catalog.forEach((category) => {
    const card = document.createElement("article");
    card.className = "coverage-card";
    card.innerHTML = `
      <strong>${category.name}</strong>
      <span>${category.types.length} 涓鍨?/span>
      <div class="coverage-type-list"></div>
    `;

    const list = card.querySelector(".coverage-type-list");
    category.types.forEach((type) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "coverage-type-button";

      const name = document.createElement("span");
      name.textContent = type.name;

      const meta = document.createElement("small");
      meta.className = "type-stage";
      meta.textContent = `${type.stage} · ${type.exampleHint}`;

      button.append(name, meta);
      button.addEventListener("click", () => {
        selectType(category.id, type.id);
        searchInput.value = type.name;
        renderSearchResults();
      });
      list.appendChild(button);
    });

    coverageMap.appendChild(card);
  });
}

function renderFinderPanel() {
  finderGroupsPanel.replaceChildren();

  finderGroups.forEach((group) => {
    const card = document.createElement("article");
    card.className = "finder-group";

    const title = document.createElement("strong");
    title.textContent = group.title;
    card.appendChild(title);

    (group.items || []).forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "finder-item";
      button.innerHTML = `<span>${item.label}</span><small>${item.note}</small>`;
      button.addEventListener("click", () => selectFinderItem(item));
      card.appendChild(button);
    });

    finderGroupsPanel.appendChild(card);
  });
}

function renderAdvantageStats() {
  const typeCount = getAllTypes().length;
  categoryCountLabel.textContent = `${catalog.length} 大专项`;
  typeCountLabel.textContent = `${typeCount} 个细分题型`;
}

function renderCategories() {
  categoryInput.replaceChildren();
  catalog.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = `${category.name}：${category.description}`;
    categoryInput.appendChild(option);
  });
}

function renderTypes() {
  clearSelectedPack();
  const category = getSelectedCategory();
  typeInput.replaceChildren();

  if (!category) {
    typeInfo.textContent = "题型库加载失败，请刷新重试。";
    return;
  }

  category.types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type.id;
    option.textContent = `${type.name}：${type.pattern}`;
    typeInput.appendChild(option);
  });

  renderTypeInfo();
}

function renderTypeInfo() {
  const type = getSelectedType();
  if (!type) return;
  typeInfo.textContent = `${type.focus} 例：${type.examples.join("、")}`;
  renderTypeProfile(type);
}

function renderTypeProfile(type) {
  typeProfileTitle.textContent = type.name;
  typeProfilePattern.textContent = `题型结构：${type.pattern}`;
  typeProfileFocus.textContent = type.focus;
  typeProfileChips.replaceChildren();
  typeProfileExamples.replaceChildren();

  [type.categoryName, type.stage, ...(type.displayTags || [])].filter(Boolean).forEach((label) => {
    const chip = document.createElement("span");
    chip.className = "type-profile-chip";
    chip.textContent = label;
    typeProfileChips.appendChild(chip);
  });

  (type.examples || []).forEach((example) => {
    const item = document.createElement("li");
    item.textContent = example;
    typeProfileExamples.appendChild(item);
  });
}

async function loadCatalog() {
  try {
    const response = await fetch("/api/catalog");
    const data = await response.json();
    catalog = data.categories || [];
    finderGroups = data.finderGroups || [];
    renderAdvantageStats();
    renderCategories();
    renderTypes();
    renderFinderPanel();
    renderCoverageMap();
    renderSearchResults();
  } catch (error) {
      typeInfo.textContent = "题型库加载失败，请刷新页面。";
  }
}

async function loadConfigStatus() {
  try {
    const response = await fetch("/api/config-status");
    const status = await response.json();

    if (status.aiAvailable) {
      aiStatus.textContent = "AI增强可用";
      useAiInput.disabled = false;
    } else {
      aiStatus.textContent = "本地规则可用";
      useAiInput.checked = false;
      useAiInput.disabled = true;
    }
  } catch (error) {
    aiStatus.textContent = "本地规则可用";
    useAiInput.checked = false;
    useAiInput.disabled = true;
  }
}

async function generatePractice(event) {
  event.preventDefault();
  setMessage("正在生成练习...");

  const payload = {
    count: Number(countInput.value),
    categoryId: categoryInput.value,
    typeId: typeInput.value,
    typeIds: selectedPackTypeIds,
    includeSolution: includeSolutionInput.checked,
    useAi: useAiInput.checked,
  };

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "鐢熸垚澶辫触");
    }

    renderProblems(result.problems);
    setMessage(result.message || "已生成练习。", true);
  } catch (error) {
    setMessage(`生成失败：${error.message}`);
  }
}

form.addEventListener("submit", generatePractice);
categoryInput.addEventListener("change", renderTypes);
typeInput.addEventListener("change", renderTypeInfo);
searchInput.addEventListener("input", renderSearchResults);

function applySearchQuery(query) {
  searchInput.value = query || "";
  renderSearchResults();
}

document.querySelectorAll(".stage-entry").forEach((button) => {
  button.addEventListener("click", () => {
    applySearchQuery(button.dataset.query);
  });
});

document.querySelectorAll(".quick-tags button").forEach((button) => {
  button.addEventListener("click", () => {
    applySearchQuery(button.dataset.query);
  });
});
printButton.addEventListener("click", () => window.print());

loadCatalog();
loadConfigStatus();

