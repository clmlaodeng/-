const test = require("node:test");
const assert = require("node:assert/strict");

const {
  evaluateLinearEquation,
  getTypeCatalog,
  searchTypes,
  generateLocalProblems,
  generateProblems,
} = require("../src/generator");

function assertProblemIsValid(problem) {
  assert.equal(typeof problem.question, "string");
  assert.match(`${problem.question} ${problem.modelEquation || ""}`, /x/);
  assert.equal(typeof problem.answer, "number");
  assert.equal(typeof problem.solution, "string");

  const value = evaluateLinearEquation(problem.equation, problem.answer);
  assert.ok(
    Math.abs(value.left - value.right) < 1e-9,
    `${problem.question} answer ${problem.answer} should satisfy equation`
  );
}

test("generates requested counts for each difficulty", () => {
  for (const count of [1, 10, 20]) {
    for (const difficulty of ["easy", "medium", "hard"]) {
      const result = generateLocalProblems({ count, difficulty, includeSolution: true });

      assert.equal(result.source, "local");
      assert.equal(result.problems.length, count);
      result.problems.forEach(assertProblemIsValid);
    }
  }
});

test("exposes a searchable vertical equation type catalog", () => {
  const catalog = getTypeCatalog();
  const typeIds = catalog.flatMap((category) => category.types.map((type) => type.id));

  assert.ok(catalog.length >= 8);
  assert.ok(typeIds.length >= 18);
  assert.ok(typeIds.includes("unknown_as_subtrahend"));
  assert.ok(typeIds.includes("unknown_as_divisor"));
  assert.ok(typeIds.includes("coefficient_group_as_subtrahend"));
  assert.ok(typeIds.includes("coefficient_group_as_divisor"));
  assert.ok(typeIds.includes("bracket_as_whole"));
  assert.ok(typeIds.includes("combine_like_terms"));
  assert.ok(typeIds.includes("x_on_both_sides"));
  assert.ok(typeIds.includes("solve_and_check"));
  assert.ok(typeIds.includes("sum_multiple_word_problem"));
  assert.ok(typeIds.includes("difference_multiple_word_problem"));
  assert.ok(typeIds.includes("price_word_problem"));
  assert.ok(typeIds.includes("perimeter_word_problem"));
  assert.ok(typeIds.includes("missing_both_sides_operation"));
  assert.ok(typeIds.includes("sign_error_diagnosis"));
  assert.ok(typeIds.includes("identify_equation"));
  assert.ok(typeIds.includes("check_equation_solution"));
  assert.ok(typeIds.includes("equality_property_choice"));
  assert.ok(typeIds.includes("write_equation_from_relation"));
  assert.ok(typeIds.includes("fraction_term_equation"));
  assert.ok(typeIds.includes("clear_denominator_both_sides"));
  assert.ok(typeIds.includes("denominator_error_diagnosis"));
  assert.ok(typeIds.includes("bracket_move_terms_comprehensive"));
  assert.ok(typeIds.includes("denominator_bracket_comprehensive"));
  assert.ok(typeIds.includes("coefficient_to_one_comprehensive"));
  assert.ok(typeIds.includes("age_word_problem"));
  assert.ok(typeIds.includes("work_rate_word_problem"));
  assert.ok(typeIds.includes("allocation_word_problem"));
  assert.ok(typeIds.includes("percent_coefficient_equation"));
  assert.ok(typeIds.includes("proportion_equation"));
  assert.ok(typeIds.includes("ratio_distribution_word_problem"));
  assert.ok(typeIds.includes("catch_up_word_problem"));
  assert.ok(typeIds.includes("upstream_downstream_word_problem"));
  assert.ok(typeIds.includes("round_trip_word_problem"));
  assert.ok(typeIds.includes("decimal_point_error_diagnosis"));
  assert.ok(typeIds.includes("reciprocal_error_diagnosis"));
  assert.ok(typeIds.includes("unknown_divisor_error_diagnosis"));

  catalog.forEach((category) => {
    assert.equal(typeof category.id, "string");
    assert.equal(typeof category.name, "string");
    assert.equal(typeof category.description, "string");
    category.types.forEach((type) => {
      assert.equal(typeof type.id, "string");
      assert.equal(typeof type.name, "string");
      assert.equal(typeof type.pattern, "string");
      assert.equal(typeof type.focus, "string");
      assert.ok(type.examples.length >= 1);
    });
  });
});

test("generates equation-modeling word problems with model fields", () => {
  for (const typeId of [
    "sum_multiple_word_problem",
    "difference_multiple_word_problem",
    "price_word_problem",
    "perimeter_word_problem",
    "age_word_problem",
    "work_rate_word_problem",
    "allocation_word_problem",
    "catch_up_word_problem",
    "upstream_downstream_word_problem",
    "round_trip_word_problem",
  ]) {
    const result = generateLocalProblems({ count: 2, typeId, includeSolution: true });

    assert.equal(result.problems.length, 2);
    result.problems.forEach((problem) => {
      assert.equal(problem.mode, "word_problem");
      assert.equal(problem.typeId, typeId);
      assert.equal(typeof problem.modelEquation, "string");
      assert.match(problem.modelEquation, /x/);
      assert.match(problem.question, /？|多少|各/);
      assertProblemIsValid(problem);
    });
  }
});

test("generates error-diagnosis problems with wrong work and correction", () => {
  for (const typeId of [
    "missing_both_sides_operation",
    "sign_error_diagnosis",
    "bracket_error_diagnosis",
    "decimal_point_error_diagnosis",
    "reciprocal_error_diagnosis",
    "unknown_divisor_error_diagnosis",
  ]) {
    const result = generateLocalProblems({ count: 2, typeId, includeSolution: true });

    assert.equal(result.problems.length, 2);
    result.problems.forEach((problem) => {
      assert.equal(problem.mode, "diagnosis");
      assert.equal(problem.typeId, typeId);
      assert.equal(typeof problem.wrongWork, "string");
      assert.equal(typeof problem.errorPoint, "string");
      assert.match(problem.solution, /正确|错误|应/);
      assertProblemIsValid(problem);
    });
  }
});

test("searches vertical types by user-facing keywords", () => {
  const cases = [
    { query: "除数是x", expected: "unknown_as_divisor" },
    { query: "除数", expected: "unknown_as_divisor" },
    { query: "去括号", expected: "bracket_error_diagnosis" },
    { query: "括号", expected: "bracket_as_whole" },
    { query: "应用题", expected: "sum_multiple_word_problem" },
    { query: "列式", expected: "write_equation_from_relation" },
    { query: "方程的解", expected: "check_equation_solution" },
    { query: "等式性质", expected: "equality_property_choice" },
    { query: "和倍", expected: "sum_multiple_word_problem" },
    { query: "错因", expected: "missing_both_sides_operation" },
    { query: "移项", expected: "sign_error_diagnosis" },
    { query: "小数", expected: "decimal_coefficient" },
  ];

  for (const item of cases) {
    const results = searchTypes(item.query);
    assert.ok(results.some((result) => result.id === item.expected), `${item.query} should match ${item.expected}`);
  }
});

test("searches by teacher shorthand and common classroom phrasing", () => {
  const cases = [
    { query: "未知数在分母", expected: "unknown_as_divisor" },
    { query: "分母有x", expected: "unknown_as_divisor" },
    { query: "减数是未知数", expected: "unknown_as_subtrahend" },
    { query: "两边都有未知数", expected: "x_on_both_sides" },
    { query: "检验答案", expected: "solve_and_check" },
    { query: "等量关系", expected: "write_equation_from_relation" },
    { query: "先算数字", expected: "number_part_first" },
    { query: "去括号变号", expected: "minus_before_bracket" },
    { query: "同类项合并", expected: "combine_like_terms" },
    { query: "去分母", expected: "fraction_term_equation" },
    { query: "含分母方程", expected: "clear_denominator_both_sides" },
    { query: "最小公倍数", expected: "clear_denominator_both_sides" },
    { query: "漏乘不含分母项", expected: "denominator_error_diagnosis" },
    { query: "综合解方程", expected: "bracket_move_terms_comprehensive" },
    { query: "去分母去括号", expected: "denominator_bracket_comprehensive" },
    { query: "五步法", expected: "denominator_bracket_comprehensive" },
    { query: "系数化为1", expected: "coefficient_to_one_comprehensive" },
    { query: "年龄问题", expected: "age_word_problem" },
    { query: "工程问题", expected: "work_rate_word_problem" },
    { query: "效率问题", expected: "work_rate_word_problem" },
    { query: "分配问题", expected: "allocation_word_problem" },
    { query: "调配问题", expected: "allocation_word_problem" },
    { query: "百分数方程", expected: "percent_coefficient_equation" },
    { query: "解比例", expected: "proportion_equation" },
    { query: "比例方程", expected: "proportion_equation" },
    { query: "按比例分配", expected: "ratio_distribution_word_problem" },
    { query: "追及问题", expected: "catch_up_word_problem" },
    { query: "顺逆水", expected: "upstream_downstream_word_problem" },
    { query: "顺水逆水", expected: "upstream_downstream_word_problem" },
    { query: "往返问题", expected: "round_trip_word_problem" },
    { query: "小数点错位", expected: "decimal_point_error_diagnosis" },
    { query: "分数倒数错误", expected: "reciprocal_error_diagnosis" },
    { query: "除数位置错误", expected: "unknown_divisor_error_diagnosis" },
    { query: "除数当被除数", expected: "unknown_divisor_error_diagnosis" },
    { query: "五年级解方程", expected: "add_one_step" },
    { query: "五年级上册", expected: "unknown_as_subtrahend" },
    { query: "六年级比例", expected: "proportion_equation" },
    { query: "六年级百分数", expected: "percent_coefficient_equation" },
    { query: "初一一元一次方程", expected: "bracket_move_terms_comprehensive" },
    { query: "七年级一元一次方程", expected: "coefficient_to_one_comprehensive" },
  ];

  for (const item of cases) {
    const results = searchTypes(item.query);
    assert.ok(results.some((result) => result.id === item.expected), `${item.query} should match ${item.expected}`);
  }
});

test("searches worksheet-style equation type names from classroom materials", () => {
  const cases = [
    { query: "一般方程", expected: "add_one_step" },
    { query: "特殊方程", expected: "unknown_as_subtrahend" },
    { query: "复杂方程", expected: "multiply_add_two_step" },
    { query: "能算的先算", expected: "number_part_first" },
    { query: "把括号看作一个整体", expected: "bracket_as_whole" },
    { query: "先合并再解方程", expected: "combine_like_terms" },
    { query: "等式两边有x", expected: "x_on_both_sides" },
    { query: "先消去数字小的x", expected: "x_on_both_sides" },
    { query: "把几x看作一个整体", expected: "coefficient_group_as_subtrahend" },
    { query: "x前面有减号或除号", expected: "coefficient_group_as_subtrahend" },
    { query: "几x作除数", expected: "coefficient_group_as_divisor" },
  ];

  for (const item of cases) {
    const results = searchTypes(item.query);
    assert.ok(results.some((result) => result.id === item.expected), `${item.query} should match ${item.expected}`);
  }
});

test("searches two-side-x types by primary classroom phrasing", () => {
  const cases = [
    { query: "两边都有x", expected: "x_on_both_sides" },
    { query: "等号两边都有x", expected: "x_on_both_sides" },
    { query: "x在等号两边", expected: "x_on_both_sides" },
    { query: "两边含未知数", expected: "x_on_both_sides" },
    { query: "消去较小的x", expected: "x_on_both_sides" },
    { query: "两边有x还有减号", expected: "x_both_sides_with_minus" },
  ];

  for (const item of cases) {
    const results = searchTypes(item.query);
    assert.ok(results.some((result) => result.id === item.expected), `${item.query} should match ${item.expected}`);
  }
});

test("searches by pasted equation examples", () => {
  const cases = [
    { query: "3(x+2)=20", expected: "bracket_as_whole" },
    { query: "(x+4)/3+2=8", expected: "denominator_bracket_comprehensive" },
    { query: "7x-8=3x+20", expected: "coefficient_to_one_comprehensive" },
    { query: "2x+1.5x=17.5", expected: "combine_like_terms" },
    { query: "20-x=12", expected: "unknown_as_subtrahend" },
    { query: "30%x=12", expected: "percent_coefficient_equation" },
    { query: "x:3=4:6", expected: "proportion_equation" },
  ];

  for (const item of cases) {
    const results = searchTypes(item.query);
    assert.ok(results.some((result) => result.id === item.expected), `${item.query} should match ${item.expected}`);
  }
});

test("prioritizes explicit stage aliases over broad category descriptions", () => {
  assert.equal(searchTypes("初一一元一次方程")[0].id, "bracket_move_terms_comprehensive");
  assert.equal(searchTypes("七年级一元一次方程")[0].id, "coefficient_to_one_comprehensive");
  assert.equal(searchTypes("六年级比例")[0].id, "proportion_equation");
});

test("generates percent and proportion equation practice", () => {
  for (const typeId of [
    "percent_coefficient_equation",
    "proportion_equation",
    "ratio_distribution_word_problem",
  ]) {
    const result = generateLocalProblems({ count: 2, typeId, includeSolution: true });

    assert.equal(result.problems.length, 2);
    result.problems.forEach((problem) => {
      assert.equal(problem.typeId, typeId);
      assert.match(problem.question, /%|比例|:/);
      assert.match(`${problem.solution} ${problem.modelEquation || ""}`, /百分数|比例|交叉相乘|按比例/);
      assertProblemIsValid(problem);
    });
  }
});

test("generates comprehensive one-variable linear equation practice", () => {
  for (const typeId of [
    "bracket_move_terms_comprehensive",
    "denominator_bracket_comprehensive",
    "coefficient_to_one_comprehensive",
  ]) {
    const result = generateLocalProblems({ count: 2, typeId, includeSolution: true });

    assert.equal(result.problems.length, 2);
    result.problems.forEach((problem) => {
      assert.equal(problem.typeId, typeId);
      assert.match(problem.question, /x/);
      assert.match(problem.solution, /移项|去括号|去分母|系数化为 1/);
      assertProblemIsValid(problem);
    });
  }
});

test("generates denominator-clearing problems for junior equation transition", () => {
  for (const typeId of [
    "fraction_term_equation",
    "clear_denominator_both_sides",
    "denominator_error_diagnosis",
  ]) {
    const result = generateLocalProblems({ count: 2, typeId, includeSolution: true });

    assert.equal(result.problems.length, 2);
    result.problems.forEach((problem) => {
      assert.equal(problem.typeId, typeId);
      assert.match(problem.question, /\//);
      assert.match(`${problem.solution} ${problem.errorPoint || ""}`, /分母|公倍数|漏乘/);
      assertProblemIsValid(problem);
    });
  }
});

test("generates coefficient-group special-position problems from primary worksheets", () => {
  for (const typeId of ["coefficient_group_as_subtrahend", "coefficient_group_as_divisor"]) {
    const result = generateLocalProblems({ count: 5, typeId, includeSolution: true });

    assert.equal(result.problems.length, 5);
    result.problems.forEach((problem) => {
      assert.equal(problem.typeId, typeId);
      assert.match(problem.question, typeId === "coefficient_group_as_subtrahend" ? /-\s*\d+x/ : /\/\s*\d+x/);
      assert.match(problem.focus, /整体/);
      assertProblemIsValid(problem);
    });
  }
});

test("generates foundation concept problems for equation understanding", () => {
  for (const typeId of [
    "identify_equation",
    "check_equation_solution",
    "equality_property_choice",
    "write_equation_from_relation",
  ]) {
    const result = generateLocalProblems({ count: 2, typeId, includeSolution: true });

    assert.equal(result.problems.length, 2);
    result.problems.forEach((problem) => {
      assert.equal(problem.mode, "concept");
      assert.equal(problem.typeId, typeId);
      assert.equal(typeof problem.conceptAnswer, "string");
      assert.match(problem.solution, /方程|等式|列式|代入|性质/);
      assertProblemIsValid(problem);
    });
  }
});

test("catalog exposes search keywords for every type", () => {
  const types = getTypeCatalog().flatMap((category) => category.types);

  types.forEach((type) => {
    assert.ok(Array.isArray(type.keywords));
    assert.ok(type.keywords.length >= 2, `${type.id} should have useful keywords`);
  });
});

test("catalog exposes vertical stage and display tags for every type", () => {
  const types = getTypeCatalog().flatMap((category) => category.types);

  types.forEach((type) => {
    assert.equal(typeof type.stage, "string", `${type.id} should expose a stage label`);
    assert.ok(type.stage.length >= 2, `${type.id} should have a useful stage label`);
    assert.ok(Array.isArray(type.displayTags), `${type.id} should expose display tags`);
    assert.ok(type.displayTags.length >= 2, `${type.id} should have at least two display tags`);
    assert.equal(typeof type.exampleHint, "string", `${type.id} should expose an example hint`);
    assert.match(type.exampleHint, /例：/);
  });

  const bothSideMinus = types.find((type) => type.id === "x_both_sides_with_minus");
  assert.equal(bothSideMinus.stage, "小学高年级 / 初一衔接");
  assert.ok(bothSideMinus.displayTags.includes("移项消元"));
});

test("generates problems for each specific vertical type", () => {
  const catalog = getTypeCatalog();
  const allTypes = catalog.flatMap((category) => category.types);

  for (const type of allTypes) {
    const result = generateLocalProblems({
      count: 2,
      typeId: type.id,
      includeSolution: true,
    });

    assert.equal(result.source, "local");
    assert.equal(result.problems.length, 2);
    result.problems.forEach((problem) => {
      assert.equal(problem.typeId, type.id);
      assert.equal(typeof problem.typeName, "string");
      assert.equal(typeof problem.focus, "string");
      assertProblemIsValid(problem);
    });
  }
});

test("generates mixed practice from a vertical type pack", () => {
  const packTypeIds = [
    "add_one_step",
    "unknown_as_subtrahend",
    "coefficient_group_as_subtrahend",
    "coefficient_group_as_divisor",
  ];
  const result = generateLocalProblems({
    count: 8,
    typeIds: packTypeIds,
    includeSolution: true,
  });
  const generatedTypeIds = new Set(result.problems.map((problem) => problem.typeId));

  assert.equal(result.problems.length, 8);
  packTypeIds.forEach((typeId) => {
    assert.ok(generatedTypeIds.has(typeId), `${typeId} should appear in mixed pack`);
  });
  result.problems.forEach(assertProblemIsValid);
});

test("keeps primary one-step and pack equations away from negative right sides", () => {
  const direct = generateLocalProblems({
    count: 20,
    typeId: "subtract_one_step",
    includeSolution: true,
  });
  const pack = generateLocalProblems({
    count: 16,
    typeIds: [
      "add_one_step",
      "subtract_one_step",
      "multiply_one_step",
      "divide_one_step",
      "unknown_as_subtrahend",
      "unknown_as_divisor",
      "coefficient_group_as_subtrahend",
      "coefficient_group_as_divisor",
    ],
    includeSolution: true,
  });

  [...direct.problems, ...pack.problems].forEach((problem) => {
    assert.doesNotMatch(problem.question, /=\s*-/);
    assertProblemIsValid(problem);
  });
});

test("finder groups expose one-click vertical type packs", () => {
  const finderGroups = require("../src/generator").getFinderGroups();
  const items = finderGroups.flatMap((group) => group.items);
  const primaryPack = items.find((item) => item.label === "五年级基础解方程");
  const ratioPack = items.find((item) => item.label === "六年级比例百分数");
  const juniorPack = items.find((item) => item.label === "初一一元一次方程");

  assert.ok(primaryPack.typeIds.includes("coefficient_group_as_subtrahend"));
  assert.ok(primaryPack.typeIds.includes("coefficient_group_as_divisor"));
  assert.ok(ratioPack.typeIds.includes("proportion_equation"));
  assert.ok(juniorPack.typeIds.includes("denominator_bracket_comprehensive"));

  items.forEach((item) => {
    assert.ok(Array.isArray(item.typeIds), `${item.label} should expose a typeIds pack`);
    assert.ok(item.typeIds.length >= 1, `${item.label} should include at least one type`);
  });

  const applicationPack = items.find((item) => item.label === "列方程应用题");
  assert.ok(applicationPack.typeIds.includes("sum_multiple_word_problem"));
  assert.ok(applicationPack.typeIds.includes("work_rate_word_problem"));

  const denominatorPack = items.find((item) => item.label === "含分母");
  assert.ok(denominatorPack.typeIds.includes("fraction_term_equation"));
  assert.ok(denominatorPack.typeIds.includes("clear_denominator_both_sides"));
});

test("keeps both-side-x minus problems friendly for primary students", () => {
  const result = generateLocalProblems({
    count: 20,
    typeId: "x_both_sides_with_minus",
    includeSolution: true,
  });

  result.problems.forEach((problem) => {
    assert.equal(problem.typeId, "x_both_sides_with_minus");
    assert.doesNotMatch(problem.question, /(^|=\s*)-\d*x/);
    assert.doesNotMatch(problem.question, /-\d+x/);
    assert.match(problem.question, /x\s*-\s*\d+\s*=/);
    assertProblemIsValid(problem);
  });
});

test("keeps both-side-x constant problems away from negative student-facing numbers", () => {
  const result = generateLocalProblems({
    count: 20,
    typeId: "x_both_sides_with_constant",
    includeSolution: true,
  });

  result.problems.forEach((problem) => {
    assert.equal(problem.typeId, "x_both_sides_with_constant");
    assert.doesNotMatch(problem.question, /(^|=\s*)-\d*x/);
    assert.doesNotMatch(problem.question, /-\d+x/);
    assert.doesNotMatch(problem.question, /=.*-\s*\d/);
    assertProblemIsValid(problem);
  });
});

test("keeps generated student questions free of negative x coefficients by default", () => {
  const allTypes = getTypeCatalog().flatMap((category) => category.types);

  for (const type of allTypes) {
    const result = generateLocalProblems({
      count: 5,
      typeId: type.id,
      includeSolution: true,
    });

    result.problems.forEach((problem) => {
      assert.doesNotMatch(problem.question, /(^|=\s*)-\d*x/, `${type.id} generated ${problem.question}`);
      if (type.id !== "coefficient_group_as_subtrahend") {
        assert.doesNotMatch(problem.question, /-\d+x/, `${type.id} generated ${problem.question}`);
      }
    });
  }
});

test("omits solution text when includeSolution is false", () => {
  const result = generateLocalProblems({
    count: 3,
    difficulty: "medium",
    includeSolution: false,
  });

  assert.equal(result.problems.length, 3);
  result.problems.forEach((problem) => {
    assert.equal(problem.solution, "");
    assertProblemIsValid({ ...problem, solution: "placeholder" });
  });
});

test("falls back to local generation when AI generation fails", async () => {
  const result = await generateProblems(
    { count: 5, difficulty: "hard", useAi: true, includeSolution: true },
    {
      aiAvailable: true,
      callAi: async () => {
        throw new Error("AI unavailable");
      },
    }
  );

  assert.equal(result.source, "local");
  assert.equal(result.fallback, true);
  assert.match(result.message, /本地生成/);
  assert.equal(result.problems.length, 5);
  result.problems.forEach(assertProblemIsValid);
});

test("uses local generation when AI is not requested", async () => {
  const result = await generateProblems(
    { count: 2, difficulty: "easy", useAi: false, includeSolution: true },
    { aiAvailable: true }
  );

  assert.equal(result.source, "local");
  assert.equal(result.fallback, false);
  assert.equal(result.problems.length, 2);
});
