const test = require("node:test");
const assert = require("node:assert/strict");

const { createServer } = require("../server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

test("serves the MVP page, assets, API, and print CSS", async () => {
  const server = createServer({ env: {} });
  const baseUrl = await listen(server);

  try {
    const html = await fetch(`${baseUrl}/`).then((response) => response.text());
    assert.match(html, /解方程练习生成器/);
    assert.match(html, /专项题型库/);
    assert.match(html, /13 大专项/);
    assert.match(html, /58 个细分题型/);
    assert.match(html, /id="categoryCountLabel"/);
    assert.match(html, /id="typeCountLabel"/);
    assert.match(html, /细分题型/);
    assert.match(html, /想练哪类就找哪类/);
    assert.match(html, /应用题|错因|易错|训练重点/);
    assert.match(html, /搜索题型/);
    assert.match(html, /按年级 \/ 说法 \/ 例题找题/);
    assert.match(html, /未知数在分母/);
    assert.match(html, /去括号变号/);
    assert.match(html, /检验答案/);
    assert.match(html, /等量关系/);
    assert.match(html, /去分母/);
    assert.match(html, /综合解方程/);
    assert.match(html, /年龄问题/);
    assert.match(html, /工程问题/);
    assert.match(html, /百分数方程/);
    assert.match(html, /解比例/);
    assert.match(html, /追及问题/);
    assert.match(html, /顺逆水/);
    assert.match(html, /小数点错位/);
    assert.match(html, /五年级上册/);
    assert.match(html, /六年级比例/);
    assert.match(html, /初一一元一次方程/);
    assert.match(html, /阶段导航/);
    assert.match(html, /五年级基础/);
    assert.match(html, /六年级比例百分数/);
    assert.match(html, /初一综合/);
    assert.match(html, /例题找题/);
    assert.match(html, /3\(x\+2\)=20/);
    assert.match(html, /两边都有未知数/);
    assert.match(html, /一般方程/);
    assert.match(html, /特殊方程/);
    assert.match(html, /把几 x 看作整体/);
    assert.match(html, /能算的先算/);
    assert.match(html, /题型全景图/);
    assert.match(html, /覆盖清单/);
    assert.match(html, /id="finderPanel"/);
    assert.match(html, /按老师需求找题/);
    assert.match(html, /id="selectedPackPanel"/);
    assert.match(html, /id="typeProfile"/);
    assert.match(html, /id="typeProfileExamples"/);
    assert.match(html, /id="keywordDictionary"/);
    assert.match(html, /id="keywordMap"/);
    assert.match(html, /当前专题包覆盖/);
    assert.match(html, /按年级阶段/);
    assert.match(html, /按易错点/);
    assert.match(html, /按题面特征/);
    assert.match(html, /生成练习/);
    assert.match(html, /学生版/);
    assert.match(html, /答案与解析/);

    const script = await fetch(`${baseUrl}/app.js`).then((response) => response.text());
    assert.match(script, /getTypeCatalog\(\)/);
    assert.match(script, /getFinderGroups\(\)/);
    assert.match(script, /generateProblems\(/);
    assert.match(script, /createBrowserAiCaller/);
    assert.match(script, /getStoredApiKey/);
    assert.match(script, /typeId/);
    assert.match(script, /modelEquation/);
    assert.match(script, /wrongWork/);
    assert.match(script, /searchInput/);
    assert.match(script, /renderSearchResults/);
    assert.match(script, /renderKeywordDictionary/);
    assert.match(script, /keyword-card/);
    assert.match(script, /keyword-chip/);
    assert.match(script, /getSearchMatchReason/);
    assert.match(script, /renderNoResultSuggestions/);
    assert.match(script, /search-summary/);
    assert.match(script, /match-reason/);
    assert.match(script, /no-result-suggestion/);
    assert.match(script, /coverageMap/);
    assert.match(script, /renderCoverageMap/);
    assert.match(script, /coverage-type-button/);
    assert.match(script, /type-meta/);
    assert.match(script, /type-stage/);
    assert.match(script, /exampleHint/);
    assert.match(script, /selectType\(category.id, type.id\)/);
    assert.match(script, /finderGroups/);
    assert.match(script, /renderFinderPanel/);
    assert.match(script, /finder-item/);
    assert.match(script, /selectedPackTypeIds/);
    assert.match(script, /selectedPackPanel/);
    assert.match(script, /renderSelectedPack/);
    assert.match(script, /pack-type-chip/);
    assert.match(script, /renderTypeProfile/);
    assert.match(script, /type-profile-chip/);
    assert.match(script, /typeProfileExamples/);
    assert.match(script, /typeIds/);
    assert.match(script, /isUsefulPartialAlias/);
    assert.match(script, /function renderAdvantageStats/);
    assert.match(script, /renderAdvantageStats\(\)/);
    assert.match(script, /stage-entry/);

    const css = await fetch(`${baseUrl}/styles.css`).then((response) => response.text());
    assert.match(css, /@media print/);
    assert.match(css, /\.keyword-dictionary/);
    assert.match(css, /\.keyword-chip/);
    assert.match(css, /\.search-summary/);
    assert.match(css, /\.match-reason/);
    assert.match(css, /\.no-result-suggestions/);
    assert.match(css, /\.type-profile/);
    assert.match(css, /\.type-profile-chip/);
    assert.match(css, /\.tool-panel\s*{\s*display:\s*none;/);

    const generated = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count: 5,
        difficulty: "hard",
        useAi: true,
        includeSolution: true,
      }),
    }).then((response) => response.json());

    assert.equal(generated.source, "local");
    assert.equal(generated.problems.length, 5);
    assert.match(generated.problems[0].question, /x/);
    assert.match(generated.problems[0].solution, /x/);
  } finally {
    server.close();
  }
});
