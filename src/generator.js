function toPositiveInt(value, fallback, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[randomInt(0, items.length - 1)];
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(2)).toString();
}

function formatSignedConstant(value) {
  if (value === 0) return "";
  return value > 0 ? ` + ${formatNumber(value)}` : ` - ${formatNumber(Math.abs(value))}`;
}

function formatLinearExpression(coefficient, constant) {
  const xPart =
    coefficient === 0
      ? ""
      : coefficient === 1
        ? "x"
        : coefficient === -1
          ? "-x"
          : `${formatNumber(coefficient)}x`;

  if (!xPart) return formatNumber(constant);
  return `${xPart}${formatSignedConstant(constant)}`;
}

function makeEquation(leftX, leftConstant, rightX, rightConstant) {
  return {
    left: { x: leftX, constant: leftConstant },
    right: { x: rightX, constant: rightConstant },
  };
}

function renderEquation(equation) {
  return `${formatLinearExpression(equation.left.x, equation.left.constant)} = ${formatLinearExpression(
    equation.right.x,
    equation.right.constant
  )}`;
}

function buildProblem(type, equation, answer, solution, includeSolution, question, extra = {}) {
  return {
    typeId: type.id,
    typeName: type.name,
    focus: type.focus,
    question: question || renderEquation(equation),
    equation,
    answer,
    solution: includeSolution ? solution : "",
    ...extra,
  };
}

function solveLinear(equation) {
  const coefficient = equation.left.x - equation.right.x;
  const constant = equation.right.constant - equation.left.constant;
  return constant / coefficient;
}

const TYPE_CATALOG = [
  {
    id: "foundation",
    name: "方程概念与等式性质",
    description: "先练方程的意义、方程的解、等式性质和数量关系列式。",
    types: [
      {
        id: "identify_equation",
        name: "判断是不是方程",
        pattern: "expression with unknown",
        focus: "理解含有未知数的等式才是方程。",
        examples: ["判断 3x + 5 = 20 是不是方程"],
      },
      {
        id: "check_equation_solution",
        name: "判断方程的解",
        pattern: "check x = a",
        focus: "把给定的 x 值代入原方程，看等式是否成立。",
        examples: ["x = 5 是不是 2x + 3 = 13 的解"],
      },
      {
        id: "equality_property_choice",
        name: "等式性质选择",
        pattern: "choose both-side operation",
        focus: "理解等式两边同时加、减、乘、除同一个数，等式仍成立。",
        examples: ["x + 7 = 15 下一步两边同时做什么"],
      },
      {
        id: "write_equation_from_relation",
        name: "根据数量关系列方程",
        pattern: "relation -> equation",
        focus: "从文字关系中找等量关系，再写成含 x 的方程。",
        examples: ["一个数的 3 倍加 5 等于 20，列方程"],
      },
    ],
  },
  {
    id: "one_step",
    name: "一步方程",
    description: "先覆盖最基础的加、减、乘、除四类方程。",
    types: [
      {
        id: "add_one_step",
        name: "加法一步方程",
        pattern: "x + a = b",
        focus: "等式两边同时减去同一个数。",
        examples: ["x + 9 = 17"],
      },
      {
        id: "subtract_one_step",
        name: "减法一步方程",
        pattern: "x - a = b",
        focus: "等式两边同时加上同一个数。",
        examples: ["x - 8 = 5"],
      },
      {
        id: "multiply_one_step",
        name: "乘法一步方程",
        pattern: "ax = b",
        focus: "等式两边同时除以未知数前面的系数。",
        examples: ["3x = 18"],
      },
      {
        id: "divide_one_step",
        name: "除法一步方程",
        pattern: "x / a = b",
        focus: "等式两边同时乘除数。",
        examples: ["x / 3 = 3"],
      },
    ],
  },
  {
    id: "special_position",
    name: "未知数特殊位置",
    description: "专练未知数在减数、除数位置的高频易错题。",
    types: [
      {
        id: "unknown_as_subtrahend",
        name: "未知数作减数",
        pattern: "a - x = b",
        focus: "先求被减去的数，避免直接把 x 移错方向。",
        examples: ["20 - x = 12"],
      },
      {
        id: "unknown_as_divisor",
        name: "未知数作除数",
        pattern: "a / x = b",
        focus: "先根据被除数和商求除数。",
        examples: ["36 / x = 6"],
      },
      {
        id: "coefficient_group_as_subtrahend",
        name: "几 x 作减数",
        pattern: "a - bx = c",
        focus: "把 bx 看作一个整体，先求出被减去的整体，再求 x。",
        examples: ["50 - 5x = 30"],
      },
      {
        id: "coefficient_group_as_divisor",
        name: "几 x 作除数",
        pattern: "a / bx = c",
        focus: "把 bx 看作一个整体，先求除数整体，再求 x。",
        examples: ["4.8 / 2x = 1.2"],
      },
      {
        id: "decimal_divide_unknown",
        name: "小数除以未知数",
        pattern: "a.b / x = c.d",
        focus: "把小数除法和未知数作除数两个易错点合在一起练。",
        examples: ["6.3 / x = 1.2"],
      },
    ],
  },
  {
    id: "two_step",
    name: "两步方程",
    description: "从常数合并、乘加乘减到混合运算，训练解题顺序。",
    types: [
      {
        id: "add_subtract_two_step",
        name: "加减两步方程",
        pattern: "x + a - b = c",
        focus: "先合并纯数字部分，再解一步方程。",
        examples: ["16 + x - 9 = 20"],
      },
      {
        id: "multiply_add_two_step",
        name: "乘加乘减两步方程",
        pattern: "ax +/- b = c",
        focus: "先处理常数项，再处理未知数前面的系数。",
        examples: ["6x + 3 = 27"],
      },
      {
        id: "divide_then_multiply",
        name: "先除后乘两步方程",
        pattern: "x / a * b = c",
        focus: "把 x / a 看成一个整体，按逆运算还原。",
        examples: ["x / 3 * 6 = 18"],
      },
      {
        id: "number_part_first",
        name: "能算的先算",
        pattern: "ax +/- b * c = d",
        focus: "先算不含未知数的乘除部分，再解方程。",
        examples: ["3x - 12 * 6 = 6"],
      },
    ],
  },
  {
    id: "brackets",
    name: "括号整体",
    description: "把括号看作整体，逐层还原。",
    types: [
      {
        id: "bracket_as_whole",
        name: "括号作整体",
        pattern: "a(x +/- b) = c",
        focus: "先把括号里的式子看成一个整体。",
        examples: ["4(x + 2) = 20"],
      },
      {
        id: "minus_before_bracket",
        name: "括号前有减号",
        pattern: "a - (x +/- b) = c",
        focus: "去括号时注意变号，也可以先把括号整体求出来。",
        examples: ["22 - (x - 3) = 15"],
      },
      {
        id: "bracket_division",
        name: "括号整体除法",
        pattern: "(x +/- a) / b = c",
        focus: "先还原括号整体，再解括号内部。",
        examples: ["(x - 3) / 2 = 7.5"],
      },
      {
        id: "bracket_contains_coefficient",
        name: "括号内含 ax",
        pattern: "(ax +/- b) * c = d",
        focus: "先把括号看整体，再处理括号内的 ax +/- b。",
        examples: ["(5x - 12) * 8 = 24"],
      },
    ],
  },
  {
    id: "combine_terms",
    name: "合并同类项",
    description: "把几个 x 合并成一个整体，再解方程。",
    types: [
      {
        id: "combine_like_terms",
        name: "同类项相加",
        pattern: "ax + bx = c",
        focus: "先合并含 x 的项。",
        examples: ["2x + 1.5x = 17.5"],
      },
      {
        id: "subtract_like_terms",
        name: "同类项相减",
        pattern: "ax - bx = c",
        focus: "系数相减时不要漏掉 x。",
        examples: ["8x - 3x = 105"],
      },
      {
        id: "decimal_like_terms",
        name: "小数系数合并",
        pattern: "x +/- ax = b",
        focus: "理解 x 就是 1x。",
        examples: ["x - 0.36x = 32"],
      },
    ],
  },
  {
    id: "x_both_sides",
    name: "两边都有 x",
    description: "训练消去较小的 x，保持等式两边操作一致。",
    types: [
      {
        id: "x_on_both_sides",
        name: "两边都有 x",
        pattern: "ax = bx + c",
        focus: "先消去较小的 x，再解一步方程。",
        examples: ["3x = x + 100"],
      },
      {
        id: "x_both_sides_with_constant",
        name: "两边都有 x 和常数",
        pattern: "ax + b = cx + d",
        focus: "含 x 的项放一边，常数项放另一边。",
        examples: ["0.3x + 4 = 0.8x"],
      },
      {
        id: "x_both_sides_with_minus",
        name: "两边含 x 且有减号",
        pattern: "ax - b = c - dx",
        focus: "移项时特别注意减号。",
        examples: ["5x - 9 = 12 - 2x"],
      },
    ],
  },
  {
    id: "decimal_fraction",
    name: "小数 / 分数",
    description: "专练小数、分数参与计算时的准确性。",
    types: [
      {
        id: "decimal_coefficient",
        name: "小数系数",
        pattern: "0.ax = b",
        focus: "小数乘除要算准。",
        examples: ["0.8x = 4"],
      },
      {
        id: "fraction_coefficient",
        name: "分数系数",
        pattern: "a/b x = c",
        focus: "两边同时除以分数，也可以乘倒数。",
        examples: ["1/5x = 6"],
      },
      {
        id: "decimal_mixed",
        name: "小数混合运算",
        pattern: "ax - b.c * d = e.f",
        focus: "先算小数乘法，再解方程。",
        examples: ["4x - 1.2 * 5 = 7.2"],
      },
    ],
  },
  {
    id: "percent_ratio",
    name: "百分数 / 比例",
    description: "覆盖六年级常见的百分数方程、比例式解方程和按比例分配建模。",
    types: [
      {
        id: "percent_coefficient_equation",
        name: "百分数系数",
        pattern: "a%x = b",
        focus: "先把百分数化成小数或分数，再按一步方程求解。",
        examples: ["30%x = 12"],
      },
      {
        id: "proportion_equation",
        name: "比例式解方程",
        pattern: "x : a = b : c",
        focus: "利用比例的基本性质，交叉相乘后转化为一元一次方程。",
        examples: ["x : 3 = 4 : 6"],
      },
      {
        id: "ratio_distribution_word_problem",
        name: "按比例分配应用题",
        pattern: "ax + bx = c",
        focus: "把比例中的每一份设为 x，再根据总量列方程。",
        examples: ["甲乙按 2:3 分配 50 个名额，各分多少？"],
      },
    ],
  },
  {
    id: "clear_denominator",
    name: "含分母 / 去分母",
    description: "衔接初一一元一次方程，专练含分母项、两边同乘最小公倍数和漏乘易错点。",
    types: [
      {
        id: "fraction_term_equation",
        name: "含 x / a 的方程",
        pattern: "x / a +/- b = c",
        focus: "先把含分母的 x 项看清，再通过两边同乘分母去分母。",
        examples: ["x / 3 + 5 = 11"],
      },
      {
        id: "clear_denominator_both_sides",
        name: "两边含分母",
        pattern: "(x +/- a) / b = (x +/- c) / d",
        focus: "两边同乘各分母的最小公倍数，把分母一次清掉。",
        examples: ["(x + 2) / 3 = (x - 4) / 5"],
      },
      {
        id: "denominator_error_diagnosis",
        name: "去分母漏乘诊断",
        pattern: "wrong: x / a + b = c -> x + b = ac",
        focus: "诊断去分母时只乘了含分母项，漏乘不含分母项的错误。",
        examples: ["x / 4 + 3 = 9，错写成 x + 3 = 36"],
      },
    ],
  },
  {
    id: "comprehensive_linear",
    name: "一元一次方程综合",
    description: "把去括号、去分母、移项、合并同类项、系数化为 1 串起来，练接近考试的综合题。",
    types: [
      {
        id: "bracket_move_terms_comprehensive",
        name: "去括号 + 移项",
        pattern: "a(x +/- b) +/- c = dx +/- e",
        focus: "先去括号，再把含 x 的项和常数项分别移到等式两边。",
        examples: ["3(x + 4) - 5 = 2x + 19"],
      },
      {
        id: "denominator_bracket_comprehensive",
        name: "去分母 + 去括号",
        pattern: "(x +/- a) / b +/- c = d",
        focus: "先去分母，再去括号，最后移项、合并同类项、系数化为 1。",
        examples: ["(x + 4) / 3 + 2 = 8"],
      },
      {
        id: "coefficient_to_one_comprehensive",
        name: "合并后系数化为 1",
        pattern: "ax +/- b = cx +/- d",
        focus: "移项合并后，把 x 前面的系数化为 1，得到方程的解。",
        examples: ["7x - 8 = 3x + 20"],
      },
    ],
  },
  {
    id: "check_and_diagnose",
    name: "检验与易错诊断",
    description: "从会解题走向会检查、会发现错误。",
    types: [
      {
        id: "solve_and_check",
        name: "解方程并检验",
        pattern: "equation, check",
        focus: "解完后把 x 的值代回原方程检验。",
        examples: ["x + 9 = 17, 并检验"],
      },
      {
        id: "operation_consistency",
        name: "等式两边同操作",
        pattern: "ax +/- b = c",
        focus: "每一步都必须等式两边同时做同一种操作。",
        examples: ["4x - 3 = 13"],
      },
      {
        id: "missing_both_sides_operation",
        name: "漏做等式另一边",
        pattern: "wrong: ax + b = c -> ax = c",
        focus: "诊断只改了一边、另一边没有同步操作的错误。",
        examples: ["4x + 3 = 19 错解为 4x = 19"],
      },
      {
        id: "sign_error_diagnosis",
        name: "移项符号错误",
        pattern: "wrong sign when moving terms",
        focus: "诊断移项时加减号改变错误的问题。",
        examples: ["5x - 9 = 21 错解为 5x = 21 - 9"],
      },
      {
        id: "bracket_error_diagnosis",
        name: "去括号错误",
        pattern: "wrong bracket expansion",
        focus: "诊断括号前减号、括号整体被错误展开的问题。",
        examples: ["22 - (x - 3) = 15 错解为 22 - x - 3 = 15"],
      },
      {
        id: "decimal_point_error_diagnosis",
        name: "小数点错位诊断",
        pattern: "wrong decimal division",
        focus: "诊断小数系数方程中小数点移动、除法计算错位的问题。",
        examples: ["0.3x = 1.2 错算成 x = 0.4"],
      },
      {
        id: "reciprocal_error_diagnosis",
        name: "分数倒数错误",
        pattern: "wrong reciprocal operation",
        focus: "诊断分数系数方程中没有乘倒数或倒数写反的问题。",
        examples: ["1/5x = 6 错算成 x = 6 / 5"],
      },
      {
        id: "unknown_divisor_error_diagnosis",
        name: "未知数作除数错因",
        pattern: "wrong: a / x = b -> x = a * b",
        focus: "诊断把除数未知数当成被除数处理的错误。",
        examples: ["36 / x = 6 错算成 x = 36 * 6"],
      },
    ],
  },
  {
    id: "word_problem",
    name: "列方程应用题",
    description: "从文字关系中设未知数、列方程、求解，覆盖小学高频建模题。",
    types: [
      {
        id: "sum_multiple_word_problem",
        name: "和倍问题",
        pattern: "x + ax = b",
        focus: "总数已知，一个量是另一个量的几倍，先设较小量为 x。",
        examples: ["男生是女生 1.4 倍，共 108 人，各有多少人？"],
      },
      {
        id: "difference_multiple_word_problem",
        name: "差倍问题",
        pattern: "ax - x = b",
        focus: "差量已知，一个量是另一个量的几倍，用倍数差列方程。",
        examples: ["跳绳人数是踢毽子的 3 倍，多 20 人，各有多少人？"],
      },
      {
        id: "price_word_problem",
        name: "单价总价问题",
        pattern: "ax + bx = c",
        focus: "根据单价、数量、总价关系列方程。",
        examples: ["钢笔单价是圆珠笔的 4 倍，共花 25 元，各多少钱？"],
      },
      {
        id: "perimeter_word_problem",
        name: "几何周长问题",
        pattern: "2(x + a) = b",
        focus: "把长方形周长公式转化成方程。",
        examples: ["长方形宽 x 米，长比宽多 5 米，周长 34 米，宽是多少？"],
      },
      {
        id: "distance_word_problem",
        name: "行程初步问题",
        pattern: "ax + bx = c",
        focus: "用速度、时间、路程的关系建立方程，作为六年级衔接。",
        examples: ["两人相向而行，速度分别为 4 和 5 千米/时，几小时相遇？"],
      },
      {
        id: "catch_up_word_problem",
        name: "追及问题",
        pattern: "ax - bx = c",
        focus: "用速度差乘追及时间等于相差路程来列方程。",
        examples: ["甲每小时 8 千米，乙每小时 5 千米，相距 18 千米，几小时追上？"],
      },
      {
        id: "upstream_downstream_word_problem",
        name: "顺逆水问题",
        pattern: "(v + a)x + (v - a)y = c",
        focus: "顺水速度等于静水速度加水速，逆水速度等于静水速度减水速。",
        examples: ["船静水速度 x 千米/时，水速 2 千米/时，顺水 3 小时比逆水 2 小时多行多少？"],
      },
      {
        id: "round_trip_word_problem",
        name: "往返问题",
        pattern: "ax + bx = c",
        focus: "根据去程和返程路程相同或总时间关系列方程。",
        examples: ["去程每小时 6 千米，返程每小时 4 千米，共用 5 小时，单程多少千米？"],
      },
      {
        id: "age_word_problem",
        name: "年龄问题",
        pattern: "x + a = bx",
        focus: "抓住年龄差不变，用现在或几年后的年龄关系列方程。",
        examples: ["爸爸比小明大 28 岁，爸爸年龄是小明的 3 倍，小明几岁？"],
      },
      {
        id: "work_rate_word_problem",
        name: "工程效率问题",
        pattern: "ax + bx = 1",
        focus: "把工作总量看作 1，用效率乘时间列方程。",
        examples: ["甲每天完成 1/6，乙每天完成 1/12，合作几天完成？"],
      },
      {
        id: "allocation_word_problem",
        name: "分配调配问题",
        pattern: "x + a = b",
        focus: "根据调入、调出后数量相等或达到指定关系来列方程。",
        examples: ["甲组比乙组多 12 人，从甲组调 6 人到乙组后两组相等，原来乙组多少人？"],
      },
    ],
  },
];

const TYPE_BY_ID = new Map(
  TYPE_CATALOG.flatMap((category) => category.types.map((type) => [type.id, type]))
);

const TYPE_KEYWORD_ALIASES = {
  identify_equation: ["方程概念", "是不是方程", "判断方程", "含未知数", "等式"],
  check_equation_solution: ["方程的解", "判断解", "代入", "是不是解", "检验"],
  equality_property_choice: ["等式性质", "两边同时", "下一步", "同加同减", "同乘同除"],
  write_equation_from_relation: ["列式", "列方程", "数量关系", "等量关系", "文字题"],
  unknown_as_subtrahend: ["五年级上册", "五年级易错题", "特殊方程", "减数是x", "x是减数", "未知数在减数", "减数是未知数", "未知数作减数", "a-x"],
  unknown_as_divisor: ["特殊方程", "除数是x", "x是除数", "未知数在除数", "未知数在分母", "分母有x", "未知数作除数", "a/x", "除以x"],
  coefficient_group_as_subtrahend: [
    "特殊方程",
    "把几x看作一个整体",
    "几x作减数",
    "x前面有减号",
    "x前面有减号或除号",
    "当几x前面有减号",
    "a-bx",
    "50-5x",
  ],
  coefficient_group_as_divisor: [
    "特殊方程",
    "把几x看作一个整体",
    "几x作除数",
    "x前面有除号",
    "x前面有减号或除号",
    "当几x前面有除号",
    "a/bx",
    "4.8/2x",
  ],
  decimal_divide_unknown: ["小数除以x", "小数除数", "小数除以未知数"],
  add_one_step: ["一般方程", "五年级", "五年级解方程", "五年级上册", "基础解方程", "简易方程"],
  subtract_one_step: ["一般方程", "五年级", "五年级解方程", "五年级上册", "基础解方程", "简易方程"],
  multiply_one_step: ["一般方程", "五年级", "五年级解方程", "五年级上册", "基础解方程", "简易方程"],
  divide_one_step: ["一般方程", "五年级", "五年级解方程", "五年级上册", "基础解方程", "简易方程"],
  bracket_as_whole: ["括号", "括号整体", "有括号", "括号方程", "把括号看作一个整体", "括号看成整体"],
  minus_before_bracket: ["去括号", "括号前减号", "去括号变号"],
  bracket_error_diagnosis: ["去括号", "括号错误", "去括号错误", "括号变号"],
  multiply_add_two_step: ["复杂方程", "两步方程", "把几x看作一个整体"],
  number_part_first: ["复杂方程", "先算数字", "能算先算", "能算的先算", "先算常数", "先算不含x"],
  combine_like_terms: ["合并", "合并同类项", "同类项合并", "几个x", "同类项", "先合并再解方程"],
  decimal_like_terms: ["小数合并", "1x", "x减小数x"],
  x_on_both_sides: [
    "两边都有x",
    "等号两边都有x",
    "x在等号两边",
    "两边含x",
    "两边含未知数",
    "两边都有未知数",
    "两边都有未知数项",
    "等式两边有x",
    "消去x",
    "消去较小的x",
    "消掉较小的x",
    "先消去数字小的x",
    "数字小的x",
  ],
  x_both_sides_with_constant: ["两边都有x", "等号两边都有x", "移项", "含常数"],
  x_both_sides_with_minus: [
    "两边有x且有减号",
    "两边有x还有减号",
    "两边都有x有减号",
    "两边含x有减号",
    "移项减号",
    "减号移项",
  ],
  sign_error_diagnosis: ["移项", "符号", "移项符号", "符号错误"],
  missing_both_sides_operation: ["错因", "诊断", "等式两边", "漏做一边"],
  operation_consistency: ["等式性质", "两边同操作", "操作一致"],
  solve_and_check: ["检验", "解并检验", "代入检验", "检验答案", "先解后检验"],
  decimal_point_error_diagnosis: ["错因", "诊断", "小数点", "小数点错位", "小数计算错误", "小数除法错误"],
  reciprocal_error_diagnosis: ["错因", "诊断", "分数倒数", "倒数错误", "分数系数错误", "乘倒数"],
  unknown_divisor_error_diagnosis: ["错因", "诊断", "除数位置错误", "除数当被除数", "未知数作除数错误", "除数是x"],
  decimal_coefficient: ["小数", "小数系数"],
  decimal_mixed: ["小数", "小数混合", "能算先算"],
  fraction_coefficient: ["分数", "分数系数"],
  percent_coefficient_equation: ["六年级", "六年级百分数", "百分数", "百分数方程", "百分数系数", "百分号", "%"],
  proportion_equation: ["六年级", "六年级比例", "比例", "解比例", "比例方程", "比例式", "交叉相乘", "内项外项"],
  ratio_distribution_word_problem: ["比例", "按比例分配", "比例分配", "比例应用题", "份数"],
  fraction_term_equation: ["去分母", "含分母", "含分母方程", "x/a", "x除以数"],
  clear_denominator_both_sides: ["去分母", "两边含分母", "含分母方程", "最小公倍数", "公分母"],
  denominator_error_diagnosis: ["去分母", "漏乘", "漏乘不含分母项", "去分母漏乘", "错因诊断"],
  bracket_move_terms_comprehensive: ["初一", "初一一元一次方程", "一元一次方程", "综合解方程", "综合题", "去括号移项", "移项合并", "考试题"],
  denominator_bracket_comprehensive: ["综合解方程", "去分母去括号", "五步法", "一般步骤", "去分母", "去括号"],
  coefficient_to_one_comprehensive: ["七年级", "七年级一元一次方程", "一元一次方程", "系数化为1", "系数化为 1", "化系数为1", "移项合并", "综合解方程"],
  sum_multiple_word_problem: ["应用题", "和倍", "列方程", "总数", "倍数"],
  difference_multiple_word_problem: ["应用题", "差倍", "列方程", "多多少", "少多少"],
  price_word_problem: ["应用题", "价格", "单价", "总价", "列方程"],
  perimeter_word_problem: ["应用题", "周长", "长方形", "几何", "列方程"],
  distance_word_problem: ["应用题", "行程", "相遇", "速度", "路程"],
  catch_up_word_problem: ["应用题", "行程", "追及", "追及问题", "速度差", "追上"],
  upstream_downstream_word_problem: ["应用题", "行程", "顺逆水", "顺水逆水", "水流", "水速", "静水速度"],
  round_trip_word_problem: ["应用题", "行程", "往返", "往返问题", "去程返程", "总时间"],
  age_word_problem: ["应用题", "年龄", "年龄问题", "年龄差", "几岁", "列方程"],
  work_rate_word_problem: ["应用题", "工程", "工程问题", "效率", "效率问题", "合作完成", "工作总量"],
  allocation_word_problem: ["应用题", "分配", "分配问题", "调配", "调配问题", "调入", "调出"],
};

const FINDER_GROUPS = [
  {
    title: "按年级阶段",
    items: [
      {
        label: "五年级基础解方程",
        query: "五年级上册",
        note: "一步方程、特殊位置、简易方程易错题",
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
      },
      {
        label: "六年级比例百分数",
        query: "六年级比例",
        note: "百分数方程、解比例、按比例分配",
        typeIds: ["percent_coefficient_equation", "proportion_equation", "ratio_distribution_word_problem"],
      },
      {
        label: "初一一元一次方程",
        query: "初一一元一次方程",
        note: "去括号、移项、去分母、综合步骤",
        typeIds: [
          "bracket_move_terms_comprehensive",
          "denominator_bracket_comprehensive",
          "coefficient_to_one_comprehensive",
          "clear_denominator_both_sides",
        ],
      },
    ],
  },
  {
    title: "按易错点",
    items: [
      {
        label: "未知数在减数/除数位置",
        query: "未知数作除数",
        note: "20 - x、36 / x 这类高频错题",
        typeIds: [
          "unknown_as_subtrahend",
          "unknown_as_divisor",
          "coefficient_group_as_subtrahend",
          "coefficient_group_as_divisor",
          "decimal_divide_unknown",
        ],
      },
      {
        label: "去括号变号",
        query: "去括号变号",
        note: "括号前有减号、整体去括号",
        typeIds: ["minus_before_bracket", "bracket_error_diagnosis", "bracket_move_terms_comprehensive"],
      },
      {
        label: "去分母漏乘",
        query: "去分母漏乘",
        note: "防止只乘含分母项",
        typeIds: ["fraction_term_equation", "clear_denominator_both_sides", "denominator_error_diagnosis"],
      },
      {
        label: "移项符号错误",
        query: "移项符号错误",
        note: "加减号变号专项",
        typeIds: ["x_both_sides_with_constant", "x_both_sides_with_minus", "sign_error_diagnosis"],
      },
      {
        label: "小数/分数计算错因",
        query: "小数点错位",
        note: "小数点、倒数、除法位置",
        typeIds: [
          "decimal_coefficient",
          "fraction_coefficient",
          "decimal_mixed",
          "decimal_point_error_diagnosis",
          "reciprocal_error_diagnosis",
        ],
      },
    ],
  },
  {
    title: "按题面特征",
    items: [
      {
        label: "有括号",
        query: "括号方程",
        note: "把括号看作整体或去括号",
        typeIds: ["bracket_as_whole", "minus_before_bracket", "bracket_division", "bracket_contains_coefficient"],
      },
      {
        label: "两边都有 x",
        query: "等号两边都有x",
        note: "先消去较小的 x，尽量避免负系数",
        typeIds: ["x_on_both_sides", "x_both_sides_with_constant", "x_both_sides_with_minus"],
      },
      {
        label: "含分母",
        query: "含分母方程",
        note: "x/a、两边含分母、去分母",
        typeIds: ["fraction_term_equation", "clear_denominator_both_sides", "denominator_bracket_comprehensive"],
      },
      {
        label: "小数/分数参与计算",
        query: "小数分数",
        note: "小数系数、分数系数、混合运算",
        typeIds: [
          "decimal_coefficient",
          "fraction_coefficient",
          "decimal_mixed",
          "decimal_like_terms",
          "decimal_divide_unknown",
        ],
      },
      {
        label: "列方程应用题",
        query: "应用题",
        note: "和倍、差倍、行程、年龄、工程、分配",
        typeIds: [
          "sum_multiple_word_problem",
          "difference_multiple_word_problem",
          "price_word_problem",
          "perimeter_word_problem",
          "distance_word_problem",
          "catch_up_word_problem",
          "upstream_downstream_word_problem",
          "round_trip_word_problem",
          "age_word_problem",
          "work_rate_word_problem",
          "allocation_word_problem",
        ],
      },
    ],
  },
];

const CATEGORY_STAGE_LABELS = {
  foundation: "五年级上册",
  one_step: "五年级上册",
  special_position: "五年级上册",
  two_step: "小学高年级",
  brackets: "小学高年级",
  combine_terms: "小学高年级",
  x_both_sides: "小学高年级 / 初一衔接",
  decimal_fraction: "小学高年级",
  percent_ratio: "六年级",
  clear_denominator: "初一衔接",
  comprehensive_linear: "初一衔接",
  check_and_diagnose: "小学高年级",
  word_problem: "小学高年级 / 六年级",
};

const CATEGORY_DISPLAY_TAGS = {
  foundation: ["概念理解", "等式性质"],
  one_step: ["基础计算", "一步还原"],
  special_position: ["高频易错", "未知数位置"],
  two_step: ["运算顺序", "两步还原"],
  brackets: ["括号整体", "去括号"],
  combine_terms: ["合并同类项", "系数理解"],
  x_both_sides: ["移项消元", "两边含 x"],
  decimal_fraction: ["小数分数", "计算准确"],
  percent_ratio: ["比例百分数", "六年级衔接"],
  clear_denominator: ["去分母", "初一过渡"],
  comprehensive_linear: ["综合步骤", "一元一次"],
  check_and_diagnose: ["错因诊断", "检验答案"],
  word_problem: ["列方程应用题", "等量关系"],
};

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");
}

function buildKeywords(category, type) {
  return Array.from(
    new Set(
      [
        category.name,
        category.description,
        type.name,
        type.pattern,
        type.focus,
        ...type.examples,
        ...(TYPE_KEYWORD_ALIASES[type.id] || []),
      ]
        .join(" ")
        .split(/[，。；、,;()\s]+/)
        .filter(Boolean)
        .concat(TYPE_KEYWORD_ALIASES[type.id] || [])
    )
  );
}

function buildTypeMetadata(category, type) {
  return {
    stage: CATEGORY_STAGE_LABELS[category.id] || "小学高年级",
    displayTags: Array.from(new Set([...(CATEGORY_DISPLAY_TAGS[category.id] || []), type.pattern])).slice(0, 3),
    exampleHint: `例：${type.examples[0]}`,
  };
}

function getTypeSearchResult(typeId) {
  for (const category of TYPE_CATALOG) {
    const type = category.types.find((item) => item.id === typeId);
    if (type) {
      return {
        ...type,
        ...buildTypeMetadata(category, type),
        categoryId: category.id,
        categoryName: category.name,
        keywords: buildKeywords(category, type),
      };
    }
  }

  return null;
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

function scoreTypeSearchMatch(category, type, normalizedQuery) {
  const aliases = (TYPE_KEYWORD_ALIASES[type.id] || []).map(normalizeSearchText);
  if (aliases.some((alias) => alias === normalizedQuery)) return 100;
  if (normalizeSearchText(type.name) === normalizedQuery) return 90;
  if (aliases.some((alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias))) return 80;

  const directText = normalizeSearchText([type.name, type.pattern, type.focus, ...type.examples].join(" "));
  if (directText.includes(normalizedQuery)) return 60;

  const categoryText = normalizeSearchText([category.name, category.description].join(" "));
  if (categoryText.includes(normalizedQuery)) return 20;

  const keywords = buildKeywords(category, type);
  const haystack = normalizeSearchText([category.id, type.id, ...keywords].join(" "));
  return haystack.includes(normalizedQuery) ? 10 : 0;
}

function searchTypes(query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return getAllTypes();

  const results = [];
  const scoredResults = [];
  for (const typeId of inferTypeIdsFromEquation(query)) {
    const result = getTypeSearchResult(typeId);
    if (result) {
      results.push(result);
      scoredResults.push({ result, score: 120 });
    }
  }

  TYPE_CATALOG.forEach((category, categoryIndex) => {
    for (const type of category.types) {
      if (results.some((result) => result.id === type.id)) continue;
      const score = scoreTypeSearchMatch(category, type, normalizedQuery);
      if (score > 0) {
        const result = { ...type, categoryId: category.id, categoryName: category.name, keywords: buildKeywords(category, type) };
        results.push(result);
        scoredResults.push({ result, score, order: categoryIndex * 100 + category.types.indexOf(type) });
      }
    }
  });

  return scoredResults
    .sort((a, b) => b.score - a.score || (a.order || 0) - (b.order || 0))
    .map((item) => item.result);
}

function createEquationByType(type, includeSolution) {
  const answer = randomInt(2, 18);
  let equation;
  let question;
  let solution;

  switch (type.id) {
    case "identify_equation": {
      const a = randomInt(2, 6);
      const b = randomInt(3, 12);
      equation = makeEquation(a, b, 0, a * answer + b);
      question = `判断：${a}x + ${b} = ${a * answer + b} 是不是方程？为什么？`;
      solution = `这是方程。因为它既是等式，又含有未知数 x。解这个方程可得 x = ${answer}。`;
      return buildProblem(type, equation, answer, solution, includeSolution, question, {
        mode: "concept",
        conceptAnswer: "是方程",
      });
    }
    case "check_equation_solution": {
      const a = randomInt(2, 8);
      const b = randomInt(2, 10);
      equation = makeEquation(a, b, 0, a * answer + b);
      question = `判断：x = ${answer} 是不是方程 ${a}x + ${b} = ${a * answer + b} 的解？`;
      solution = `把 x = ${answer} 代入原方程，左边 = ${a}×${answer} + ${b} = ${a * answer + b}，等于右边，所以 x = ${answer} 是方程的解。`;
      return buildProblem(type, equation, answer, solution, includeSolution, question, {
        mode: "concept",
        conceptAnswer: "是方程的解",
      });
    }
    case "equality_property_choice": {
      const b = randomInt(3, 15);
      equation = makeEquation(1, b, 0, answer + b);
      question = `方程 x + ${b} = ${answer + b}，下一步应根据等式性质怎样做？`;
      solution = `根据等式性质，两边同时减去 ${b}，等式仍成立，得到 x = ${answer}。`;
      return buildProblem(type, equation, answer, solution, includeSolution, question, {
        mode: "concept",
        conceptAnswer: `两边同时减去 ${b}`,
      });
    }
    case "write_equation_from_relation": {
      const a = randomInt(2, 6);
      const b = randomInt(3, 12);
      equation = makeEquation(a, b, 0, a * answer + b);
      question = `一个数的 ${a} 倍加 ${b} 等于 ${a * answer + b}。设这个数为 x，请列方程并求出这个数。`;
      solution = `根据数量关系“${a} 倍 + ${b} = ${a * answer + b}”，列方程 ${a}x + ${b} = ${a * answer + b}，解得 x = ${answer}。`;
      return buildProblem(type, equation, answer, solution, includeSolution, question, {
        mode: "concept",
        conceptAnswer: `${a}x + ${b} = ${a * answer + b}`,
        modelEquation: `${a}x + ${b} = ${a * answer + b}`,
      });
    }
    case "add_one_step": {
      const a = randomInt(3, 20);
      equation = makeEquation(1, a, 0, answer + a);
      solution = `两边同时减去 ${a}，得到 x = ${answer}。`;
      break;
    }
    case "subtract_one_step": {
      const right = randomInt(2, 18);
      const a = randomInt(3, 12);
      const realAnswer = right + a;
      equation = makeEquation(1, -a, 0, right);
      solution = `两边同时加上 ${a}，得到 x = ${realAnswer}。`;
      return buildProblem(type, equation, realAnswer, solution, includeSolution);
    }
    case "multiply_one_step": {
      const a = randomInt(2, 9);
      equation = makeEquation(a, 0, 0, a * answer);
      solution = `两边同时除以 ${a}，得到 x = ${answer}。`;
      break;
    }
    case "divide_one_step": {
      const a = randomInt(2, 9);
      equation = makeEquation(1 / a, 0, 0, answer);
      question = `x / ${a} = ${answer}`;
      solution = `两边同时乘 ${a}，得到 x = ${answer * a}。`;
      return buildProblem(type, equation, answer * a, solution, includeSolution, question);
    }
    case "unknown_as_subtrahend": {
      const right = randomInt(4, 20);
      const left = answer + right;
      equation = makeEquation(-1, left, 0, right);
      question = `${left} - x = ${right}`;
      solution = `先想 ${left} 减几等于 ${right}，得到 x = ${answer}。`;
      break;
    }
    case "unknown_as_divisor": {
      const quotient = randomInt(2, 9);
      const left = answer * quotient;
      equation = makeEquation(quotient, 0, 0, left);
      question = `${left} / x = ${quotient}`;
      solution = `根据 除数 = 被除数 / 商，得到 x = ${left} / ${quotient} = ${answer}。`;
      break;
    }
    case "coefficient_group_as_subtrahend": {
      const coefficient = randomInt(2, 9);
      const right = randomInt(8, 35);
      const left = coefficient * answer + right;
      equation = makeEquation(-coefficient, left, 0, right);
      question = `${left} - ${coefficient}x = ${right}`;
      solution = `把 ${coefficient}x 看作一个整体。先想 ${left} 减多少等于 ${right}，得到 ${coefficient}x = ${
        left - right
      }，所以 x = ${answer}。`;
      break;
    }
    case "coefficient_group_as_divisor": {
      const coefficient = randomInt(2, 6);
      const quotient = pick([0.6, 1.2, 1.5, 2, 3]);
      const divisorGroup = coefficient * answer;
      const dividend = Number((divisorGroup * quotient).toFixed(1));
      equation = makeEquation(coefficient * quotient, 0, 0, dividend);
      question = `${formatNumber(dividend)} / ${coefficient}x = ${formatNumber(quotient)}`;
      solution = `把 ${coefficient}x 看作一个整体。除数 = 被除数 / 商，所以 ${coefficient}x = ${formatNumber(
        dividend
      )} / ${formatNumber(quotient)} = ${divisorGroup}，得到 x = ${answer}。`;
      break;
    }
    case "decimal_divide_unknown": {
      const quotient = pick([0.3, 0.6, 1.2, 1.5]);
      const left = Number((answer * quotient).toFixed(1));
      equation = makeEquation(quotient, 0, 0, left);
      question = `${formatNumber(left)} / x = ${formatNumber(quotient)}`;
      solution = `未知数作除数，x = ${formatNumber(left)} / ${formatNumber(quotient)} = ${answer}。`;
      break;
    }
    case "add_subtract_two_step": {
      const a = randomInt(8, 20);
      const b = randomInt(2, 9);
      equation = makeEquation(1, a - b, 0, answer + a - b);
      question = `${a} + x - ${b} = ${answer + a - b}`;
      solution = `先算 ${a} - ${b} = ${a - b}，得到 x + ${a - b} = ${answer + a - b}，所以 x = ${answer}。`;
      break;
    }
    case "multiply_add_two_step":
    case "operation_consistency": {
      const a = randomInt(2, 9);
      const b = randomInt(2, 15);
      const sign = Math.random() > 0.5 ? 1 : -1;
      equation = makeEquation(a, sign * b, 0, a * answer + sign * b);
      solution = `先处理常数 ${sign > 0 ? b : -b}，再两边同时除以 ${a}，得到 x = ${answer}。`;
      break;
    }
    case "divide_then_multiply": {
      const divisor = randomInt(2, 6);
      const multiplier = randomInt(2, 8);
      const realAnswer = answer * divisor;
      equation = makeEquation(multiplier / divisor, 0, 0, answer * multiplier);
      question = `x / ${divisor} * ${multiplier} = ${answer * multiplier}`;
      solution = `先把 x / ${divisor} 看成整体，得到 x / ${divisor} = ${answer}，所以 x = ${realAnswer}。`;
      return buildProblem(type, equation, realAnswer, solution, includeSolution, question);
    }
    case "number_part_first": {
      const a = randomInt(2, 8);
      const b = randomInt(2, 9);
      const c = randomInt(2, 8);
      equation = makeEquation(a, -b * c, 0, a * answer - b * c);
      question = `${a}x - ${b} * ${c} = ${a * answer - b * c}`;
      solution = `先算 ${b} * ${c} = ${b * c}，得到 ${a}x - ${b * c} = ${a * answer - b * c}，所以 x = ${answer}。`;
      break;
    }
    case "bracket_as_whole": {
      const a = randomInt(2, 8);
      const b = randomInt(-6, 8);
      equation = makeEquation(a, a * b, 0, a * (answer + b));
      question = `${a}(x${formatSignedConstant(b)}) = ${a * (answer + b)}`;
      solution = `先把括号看成整体，括号内等于 ${answer + b}，再解 x${formatSignedConstant(b)} = ${answer + b}，得到 x = ${answer}。`;
      break;
    }
    case "minus_before_bracket": {
      const a = randomInt(18, 40);
      const b = randomInt(-5, 8);
      const right = a - (answer + b);
      equation = makeEquation(-1, a - b, 0, right);
      question = `${a} - (x${formatSignedConstant(b)}) = ${right}`;
      solution = `先求括号整体：x${formatSignedConstant(b)} = ${a - right}，再得到 x = ${answer}。`;
      break;
    }
    case "bracket_division": {
      const divisor = randomInt(2, 6);
      const b = randomInt(-5, 7);
      const right = (answer + b) / divisor;
      equation = makeEquation(1 / divisor, b / divisor, 0, right);
      question = `(x${formatSignedConstant(b)}) / ${divisor} = ${formatNumber(right)}`;
      solution = `两边先乘 ${divisor}，得到 x${formatSignedConstant(b)} = ${answer + b}，所以 x = ${answer}。`;
      break;
    }
    case "bracket_contains_coefficient": {
      const innerA = randomInt(2, 6);
      const innerB = randomInt(-10, 10);
      const outer = randomInt(2, 5);
      const right = (innerA * answer + innerB) * outer;
      equation = makeEquation(innerA * outer, innerB * outer, 0, right);
      question = `(${innerA}x${formatSignedConstant(innerB)}) * ${outer} = ${right}`;
      solution = `先把括号看整体，括号内等于 ${right / outer}，再解 ${innerA}x${formatSignedConstant(innerB)} = ${right / outer}，得到 x = ${answer}。`;
      break;
    }
    case "combine_like_terms": {
      const a = pick([1.5, 2, 2.5, 3]);
      const b = pick([1, 1.5, 2, 3]);
      equation = makeEquation(a + b, 0, 0, (a + b) * answer);
      question = `${formatNumber(a)}x + ${formatNumber(b)}x = ${formatNumber((a + b) * answer)}`;
      solution = `先合并同类项，得到 ${formatNumber(a + b)}x = ${formatNumber((a + b) * answer)}，所以 x = ${answer}。`;
      break;
    }
    case "subtract_like_terms": {
      const b = randomInt(1, 4);
      const a = b + randomInt(2, 6);
      equation = makeEquation(a - b, 0, 0, (a - b) * answer);
      question = `${a}x - ${b}x = ${(a - b) * answer}`;
      solution = `先合并同类项，得到 ${a - b}x = ${(a - b) * answer}，所以 x = ${answer}。`;
      break;
    }
    case "decimal_like_terms": {
      const b = pick([0.2, 0.25, 0.36, 0.4, 0.6]);
      equation = makeEquation(1 - b, 0, 0, Number(((1 - b) * answer).toFixed(2)));
      question = `x - ${formatNumber(b)}x = ${formatNumber((1 - b) * answer)}`;
      solution = `把 x 看成 1x，合并得到 ${formatNumber(1 - b)}x = ${formatNumber((1 - b) * answer)}，所以 x = ${answer}。`;
      break;
    }
    case "x_on_both_sides": {
      const rightX = randomInt(1, 4);
      const leftX = rightX + randomInt(2, 6);
      equation = makeEquation(leftX, 0, rightX, (leftX - rightX) * answer);
      question = `${leftX}x = ${rightX}x + ${(leftX - rightX) * answer}`;
      solution = `两边同时减去 ${rightX}x，得到 ${leftX - rightX}x = ${(leftX - rightX) * answer}，所以 x = ${answer}。`;
      break;
    }
    case "x_both_sides_with_constant": {
      const leftX = pick([0.3, 0.4, 0.5, 0.6]);
      const rightX = pick([0.8, 0.9, 1.1]);
      const rightC = randomInt(2, 10);
      const leftC = Number((rightC + (rightX - leftX) * answer).toFixed(2));
      equation = makeEquation(leftX, leftC, rightX, rightC);
      solution = `把含 x 的项移到一边，常数移到另一边，得到 ${formatNumber(rightX - leftX)}x = ${formatNumber(leftC - rightC)}，所以 x = ${answer}。`;
      break;
    }
    case "x_both_sides_with_minus": {
      const realAnswer = randomInt(6, 18);
      const rightX = randomInt(1, 4);
      const leftX = rightX + randomInt(2, 5);
      const leftC = -randomInt(2, 8);
      const rightC = (leftX - rightX) * realAnswer + leftC;
      equation = makeEquation(leftX, leftC, rightX, rightC);
      solution = `移项时注意减号，先把较小的 ${rightX}x 消去，得到 ${leftX - rightX}x = ${rightC - leftC}，所以 x = ${realAnswer}。`;
      break;
    }
    case "decimal_coefficient": {
      const a = pick([0.2, 0.3, 0.4, 0.5, 0.8]);
      equation = makeEquation(a, 0, 0, a * answer);
      solution = `两边同时除以 ${formatNumber(a)}，得到 x = ${answer}。`;
      break;
    }
    case "fraction_coefficient": {
      const denominator = pick([3, 4, 5, 6]);
      equation = makeEquation(1 / denominator, 0, 0, answer);
      question = `1/${denominator}x = ${answer}`;
      solution = `两边同时乘 ${denominator}，得到 x = ${answer * denominator}。`;
      return buildProblem(type, equation, answer * denominator, solution, includeSolution, question);
    }
    case "percent_coefficient_equation": {
      const percent = pick([20, 25, 30, 40, 50, 75]);
      const coefficient = percent / 100;
      const right = coefficient * answer;
      equation = makeEquation(coefficient, 0, 0, right);
      question = `${percent}%x = ${formatNumber(right)}`;
      solution = `先把百分数化成小数，${percent}% = ${formatNumber(coefficient)}，得 ${formatNumber(
        coefficient
      )}x = ${formatNumber(right)}，所以 x = ${answer}。`;
      break;
    }
    case "proportion_equation": {
      const leftDenominator = randomInt(2, 8);
      const rightDenominator = leftDenominator + randomInt(2, 8);
      const rightNumerator = (answer * rightDenominator) / leftDenominator;
      equation = makeEquation(rightDenominator, 0, 0, rightNumerator * leftDenominator);
      question = `x : ${leftDenominator} = ${formatNumber(rightNumerator)} : ${rightDenominator}`;
      solution = `根据比例的基本性质，交叉相乘得 ${rightDenominator}x = ${formatNumber(
        rightNumerator * leftDenominator
      )}，解得 x = ${answer}。`;
      break;
    }
    case "ratio_distribution_word_problem": {
      const partA = randomInt(2, 5);
      const partB = partA + randomInt(1, 4);
      const unit = answer;
      const total = (partA + partB) * unit;
      equation = makeEquation(partA + partB, 0, 0, total);
      question = `甲、乙按 ${partA}:${partB} 分配 ${total} 个名额。甲、乙各分多少个？`;
      solution = `设每一份是 x 个，按比例分配可列方程 ${partA}x + ${partB}x = ${total}，解得 x = ${unit}。甲分 ${
        partA * unit
      } 个，乙分 ${partB * unit} 个。`;
      return buildProblem(type, equation, unit, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `${partA}x + ${partB}x = ${total}`,
      });
    }
    case "fraction_term_equation": {
      const denominator = pick([2, 3, 4, 5, 6]);
      const realAnswer = answer * denominator;
      const constant = randomInt(2, 9);
      const right = answer + constant;
      equation = makeEquation(1 / denominator, constant, 0, right);
      question = `x / ${denominator} + ${constant} = ${right}`;
      solution = `两边先减 ${constant}，得 x / ${denominator} = ${answer}。再两边同乘分母 ${denominator}，得 x = ${realAnswer}。`;
      return buildProblem(type, equation, realAnswer, solution, includeSolution, question);
    }
    case "clear_denominator_both_sides": {
      const leftDenominator = pick([2, 3, 4]);
      const rightDenominator = pick([5, 6, 8]);
      const sharedValue = randomInt(3, 9);
      const leftConstant = leftDenominator * sharedValue - answer;
      const rightConstant = rightDenominator * sharedValue - answer;
      equation = makeEquation(
        1 / leftDenominator,
        leftConstant / leftDenominator,
        1 / rightDenominator,
        rightConstant / rightDenominator
      );
      question = `(x${formatSignedConstant(leftConstant)}) / ${leftDenominator} = (x${formatSignedConstant(
        rightConstant
      )}) / ${rightDenominator}`;
      solution = `两边同乘 ${leftDenominator} 和 ${rightDenominator} 的公倍数，先去分母，再移项合并，得到 x = ${answer}。`;
      break;
    }
    case "denominator_error_diagnosis": {
      const denominator = pick([3, 4, 5, 6]);
      const realAnswer = answer * denominator;
      const constant = randomInt(2, 8);
      const right = answer + constant;
      equation = makeEquation(1 / denominator, constant, 0, right);
      question = `判断下面去分母哪里错，并写出正确解法：x / ${denominator} + ${constant} = ${right}`;
      solution = `错误在于去分母时漏乘不含分母的 ${constant}。正确做法：两边同乘 ${denominator}，得 x + ${constant * denominator} = ${
        right * denominator
      }，所以 x = ${realAnswer}。`;
      return buildProblem(type, equation, realAnswer, solution, includeSolution, question, {
        mode: "diagnosis",
        wrongWork: `x / ${denominator} + ${constant} = ${right}，两边同乘 ${denominator}，错写成 x + ${constant} = ${
          right * denominator
        }`,
        errorPoint: "去分母时漏乘不含分母项。",
      });
    }
    case "bracket_move_terms_comprehensive": {
      const outer = randomInt(2, 5);
      const innerConstant = randomInt(2, 8);
      const rightX = randomInt(1, outer - 1);
      const leftConstant = -randomInt(2, 9);
      const rightConstant = (outer - rightX) * answer + outer * innerConstant + leftConstant;
      equation = makeEquation(outer, outer * innerConstant + leftConstant, rightX, rightConstant);
      question = `${outer}(x + ${innerConstant}) - ${Math.abs(leftConstant)} = ${rightX}x + ${rightConstant}`;
      solution = `先去括号，得 ${outer}x + ${outer * innerConstant + leftConstant} = ${rightX}x + ${rightConstant}；再移项、合并同类项，最后系数化为 1，得 x = ${answer}。`;
      break;
    }
    case "denominator_bracket_comprehensive": {
      const denominator = pick([2, 3, 4, 5]);
      const innerConstant = randomInt(2, 8);
      const outside = randomInt(1, 6);
      const right = (answer + innerConstant) / denominator + outside;
      equation = makeEquation(1 / denominator, innerConstant / denominator + outside, 0, right);
      question = `(x + ${innerConstant}) / ${denominator} + ${outside} = ${formatNumber(right)}`;
      solution = `按五步法处理：先去分母，得 x + ${innerConstant} + ${outside * denominator} = ${formatNumber(
        right * denominator
      )}；再去括号或整理，移项、合并同类项，系数化为 1，得 x = ${answer}。`;
      break;
    }
    case "coefficient_to_one_comprehensive": {
      const rightX = randomInt(1, 5);
      const leftX = rightX + randomInt(2, 6);
      const leftConstant = -randomInt(2, 12);
      const rightConstant = (leftX - rightX) * answer + leftConstant;
      equation = makeEquation(leftX, leftConstant, rightX, rightConstant);
      question = `${leftX}x - ${Math.abs(leftConstant)} = ${rightX}x + ${rightConstant}`;
      solution = `先移项，得 ${leftX - rightX}x = ${rightConstant - leftConstant}；再把 x 前面的系数化为 1，得 x = ${answer}。`;
      break;
    }
    case "decimal_mixed": {
      const a = randomInt(2, 7);
      const b = pick([0.4, 0.8, 1.2, 1.5]);
      const c = randomInt(2, 6);
      equation = makeEquation(a, -b * c, 0, a * answer - b * c);
      question = `${a}x - ${formatNumber(b)} * ${c} = ${formatNumber(a * answer - b * c)}`;
      solution = `先算 ${formatNumber(b)} * ${c} = ${formatNumber(b * c)}，再解方程，得到 x = ${answer}。`;
      break;
    }
    case "solve_and_check": {
      const a = randomInt(3, 12);
      equation = makeEquation(1, a, 0, answer + a);
      question = `x + ${a} = ${answer + a}, 并检验`;
      solution = `两边同时减去 ${a}，得到 x = ${answer}。检验：${answer} + ${a} = ${answer + a}，正确。`;
      break;
    }
    case "sum_multiple_word_problem": {
      const multiple = pick([1.5, 2, 3, 4]);
      const smaller = answer * 2;
      const total = smaller + multiple * smaller;
      equation = makeEquation(1 + multiple, 0, 0, total);
      question = `科技小组共有 ${formatNumber(total)} 人，男生人数是女生人数的 ${formatNumber(multiple)} 倍。男生、女生各有多少人？`;
      solution = `设女生有 x 人，则男生有 ${formatNumber(multiple)}x 人。列方程 x + ${formatNumber(multiple)}x = ${formatNumber(total)}，解得 x = ${smaller}，男生 ${formatNumber(multiple * smaller)} 人。`;
      return buildProblem(type, equation, smaller, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `x + ${formatNumber(multiple)}x = ${formatNumber(total)}`,
      });
    }
    case "difference_multiple_word_problem": {
      const multiple = randomInt(2, 5);
      const smaller = answer;
      const difference = (multiple - 1) * smaller;
      equation = makeEquation(multiple - 1, 0, 0, difference);
      question = `跳绳人数是踢毽子人数的 ${multiple} 倍，跳绳比踢毽子多 ${difference} 人。跳绳、踢毽子各有多少人？`;
      solution = `设踢毽子有 x 人，则跳绳有 ${multiple}x 人。列方程 ${multiple}x - x = ${difference}，解得 x = ${smaller}，跳绳 ${multiple * smaller} 人。`;
      return buildProblem(type, equation, smaller, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `${multiple}x - x = ${difference}`,
      });
    }
    case "price_word_problem": {
      const multiple = pick([2, 3, 4, 4.5]);
      const countA = randomInt(2, 5);
      const countB = randomInt(2, 6);
      const unit = answer;
      const total = (countA * multiple + countB) * unit;
      equation = makeEquation(countA * multiple + countB, 0, 0, total);
      question = `买 ${countA} 支钢笔和 ${countB} 支圆珠笔共花 ${formatNumber(total)} 元，钢笔单价是圆珠笔的 ${formatNumber(multiple)} 倍。钢笔和圆珠笔各多少元？`;
      solution = `设圆珠笔每支 x 元，则钢笔每支 ${formatNumber(multiple)}x 元。列方程 ${countA}×${formatNumber(multiple)}x + ${countB}x = ${formatNumber(total)}，解得 x = ${unit}，钢笔 ${formatNumber(multiple * unit)} 元。`;
      return buildProblem(type, equation, unit, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `${formatNumber(countA * multiple)}x + ${countB}x = ${formatNumber(total)}`,
      });
    }
    case "perimeter_word_problem": {
      const width = answer;
      const extra = randomInt(3, 12);
      const perimeter = 2 * (width + width + extra);
      equation = makeEquation(4, 2 * extra, 0, perimeter);
      question = `一个长方形的长比宽多 ${extra} 米，周长是 ${perimeter} 米。这个长方形的宽是多少米？`;
      solution = `设宽是 x 米，则长是 x + ${extra} 米。列方程 2(x + x + ${extra}) = ${perimeter}，解得 x = ${width}。`;
      return buildProblem(type, equation, width, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `2(x + x + ${extra}) = ${perimeter}`,
      });
    }
    case "distance_word_problem": {
      const speedA = randomInt(3, 8);
      const speedB = randomInt(4, 9);
      const time = answer;
      const distance = (speedA + speedB) * time;
      equation = makeEquation(speedA + speedB, 0, 0, distance);
      question = `甲、乙两人从相距 ${distance} 千米的两地相向而行，甲每小时行 ${speedA} 千米，乙每小时行 ${speedB} 千米。几小时后相遇？`;
      solution = `设 x 小时后相遇。列方程 ${speedA}x + ${speedB}x = ${distance}，解得 x = ${time}。`;
      return buildProblem(type, equation, time, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `${speedA}x + ${speedB}x = ${distance}`,
      });
    }
    case "catch_up_word_problem": {
      const slowSpeed = randomInt(3, 7);
      const fastSpeed = slowSpeed + randomInt(2, 5);
      const time = answer;
      const gap = (fastSpeed - slowSpeed) * time;
      equation = makeEquation(fastSpeed - slowSpeed, 0, 0, gap);
      question = `甲每小时行 ${fastSpeed} 千米，乙每小时行 ${slowSpeed} 千米，甲在乙后面 ${gap} 千米处同时出发。甲几小时追上乙？`;
      solution = `设 x 小时追上。速度差是 ${fastSpeed} - ${slowSpeed}，列方程 (${fastSpeed} - ${slowSpeed})x = ${gap}，解得 x = ${time}。`;
      return buildProblem(type, equation, time, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `(${fastSpeed} - ${slowSpeed})x = ${gap}`,
      });
    }
    case "upstream_downstream_word_problem": {
      const waterSpeed = randomInt(1, 3);
      const downstreamTime = randomInt(2, 5);
      const upstreamTime = randomInt(2, 5);
      const stillSpeed = answer + waterSpeed + 3;
      const distanceDifference = (stillSpeed + waterSpeed) * downstreamTime - (stillSpeed - waterSpeed) * upstreamTime;
      equation = makeEquation(downstreamTime - upstreamTime, waterSpeed * (downstreamTime + upstreamTime), 0, distanceDifference);
      question = `一艘船顺水行 ${downstreamTime} 小时，逆水行 ${upstreamTime} 小时，水速是 ${waterSpeed} 千米/时，顺水比逆水多行 ${distanceDifference} 千米。船在静水中的速度是多少千米/时？`;
      solution = `设静水速度为 x 千米/时。顺水速度是 x + ${waterSpeed}，逆水速度是 x - ${waterSpeed}。列方程 (${downstreamTime})(x + ${waterSpeed}) - ${upstreamTime}(x - ${waterSpeed}) = ${distanceDifference}，解得 x = ${stillSpeed}。`;
      return buildProblem(type, equation, stillSpeed, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `${downstreamTime}(x + ${waterSpeed}) - ${upstreamTime}(x - ${waterSpeed}) = ${distanceDifference}`,
      });
    }
    case "round_trip_word_problem": {
      const goSpeed = randomInt(5, 9);
      const returnSpeed = randomInt(3, goSpeed - 1);
      const distance = goSpeed * returnSpeed;
      const totalTime = distance / goSpeed + distance / returnSpeed;
      equation = makeEquation(1 / goSpeed + 1 / returnSpeed, 0, 0, totalTime);
      question = `小明从家到学校，去程每小时 ${goSpeed} 千米，返程每小时 ${returnSpeed} 千米，往返共用 ${formatNumber(totalTime)} 小时。家到学校单程多少千米？`;
      solution = `设单程路程为 x 千米。去程时间是 x/${goSpeed}，返程时间是 x/${returnSpeed}，列方程 x/${goSpeed} + x/${returnSpeed} = ${formatNumber(totalTime)}，解得 x = ${distance}。`;
      return buildProblem(type, equation, distance, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `x/${goSpeed} + x/${returnSpeed} = ${formatNumber(totalTime)}`,
      });
    }
    case "age_word_problem": {
      const childAge = answer;
      const multiple = pick([2, 3, 4]);
      const difference = (multiple - 1) * childAge;
      equation = makeEquation(multiple - 1, 0, 0, difference);
      question = `爸爸比小明大 ${difference} 岁，爸爸今年的年龄是小明的 ${multiple} 倍。小明今年几岁？`;
      solution = `设小明今年 x 岁，则爸爸今年 ${multiple}x 岁。列方程 ${multiple}x - x = ${difference}，解得 x = ${childAge}。`;
      return buildProblem(type, equation, childAge, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `${multiple}x - x = ${difference}`,
      });
    }
    case "work_rate_word_problem": {
      const daysA = pick([6, 8, 10, 12]);
      const daysB = pick([12, 16, 20, 24]);
      const totalDays = (daysA * daysB) / (daysA + daysB);
      const scaledTotal = daysA * daysB;
      const scaledRate = daysA + daysB;
      equation = makeEquation(scaledRate, 0, 0, scaledTotal);
      question = `甲单独做 ${daysA} 天完成，乙单独做 ${daysB} 天完成。两人合作几天完成？`;
      solution = `设合作 x 天完成。工作总量看作 1，列方程 x/${daysA} + x/${daysB} = 1，去分母得 ${scaledRate}x = ${scaledTotal}，解得 x = ${formatNumber(totalDays)}。`;
      return buildProblem(type, equation, totalDays, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `x/${daysA} + x/${daysB} = 1`,
      });
    }
    case "allocation_word_problem": {
      const secondGroup = answer + randomInt(4, 10);
      const moved = randomInt(2, 8);
      const firstGroup = secondGroup + 2 * moved;
      equation = makeEquation(1, 2 * moved, 0, firstGroup);
      question = `甲组原来有 ${firstGroup} 人，从甲组调 ${moved} 人到乙组后，两组人数相等。乙组原来有多少人？`;
      solution = `设乙组原来有 x 人。调配后甲组有 ${firstGroup} - ${moved} 人，乙组有 x + ${moved} 人。列方程 x + ${moved} = ${firstGroup - moved}，解得 x = ${secondGroup}。`;
      return buildProblem(type, equation, secondGroup, solution, includeSolution, question, {
        mode: "word_problem",
        modelEquation: `x + ${moved} = ${firstGroup - moved}`,
      });
    }
    case "missing_both_sides_operation": {
      const a = randomInt(2, 8);
      const b = randomInt(2, 12);
      equation = makeEquation(a, b, 0, a * answer + b);
      question = `判断下面解法哪里错，并写出正确解法：${a}x + ${b} = ${a * answer + b}`;
      solution = `错误在于只去掉了左边的 +${b}，右边没有同时减 ${b}。正确：两边同时减 ${b}，得 ${a}x = ${a * answer}，所以 x = ${answer}。`;
      return buildProblem(type, equation, answer, solution, includeSolution, question, {
        mode: "diagnosis",
        wrongWork: `${a}x + ${b} = ${a * answer + b}，所以 ${a}x = ${a * answer + b}，x = ${formatNumber((a * answer + b) / a)}`,
        errorPoint: "等式两边没有同时做同一种操作。",
      });
    }
    case "sign_error_diagnosis": {
      const a = randomInt(3, 8);
      const b = randomInt(2, 12);
      equation = makeEquation(a, -b, 0, a * answer - b);
      question = `判断下面移项是否正确，并改正：${a}x - ${b} = ${a * answer - b}`;
      solution = `错误在于把 -${b} 移到右边时仍写成 -${b}。正确：两边同时加 ${b}，得 ${a}x = ${a * answer}，所以 x = ${answer}。`;
      return buildProblem(type, equation, answer, solution, includeSolution, question, {
        mode: "diagnosis",
        wrongWork: `${a}x - ${b} = ${a * answer - b}，${a}x = ${a * answer - b} - ${b}`,
        errorPoint: "移项时符号改变错误。",
      });
    }
    case "bracket_error_diagnosis": {
      const outer = randomInt(18, 35);
      const inner = randomInt(2, 8);
      const right = outer - (answer - inner);
      equation = makeEquation(-1, outer + inner, 0, right);
      question = `判断下面去括号哪里错，并写出正确解法：${outer} - (x - ${inner}) = ${right}`;
      solution = `错误在于括号前是减号，去括号后括号内各项都要变号。正确可先把括号看整体：x - ${inner} = ${outer - right}，所以 x = ${answer}。`;
      return buildProblem(type, equation, answer, solution, includeSolution, question, {
        mode: "diagnosis",
        wrongWork: `${outer} - (x - ${inner}) = ${right}，写成 ${outer} - x - ${inner} = ${right}`,
        errorPoint: "括号前有减号，去括号没有全部变号。",
      });
    }
    case "decimal_point_error_diagnosis": {
      const coefficient = pick([0.2, 0.3, 0.4, 0.5]);
      const right = coefficient * answer;
      equation = makeEquation(coefficient, 0, 0, right);
      question = `判断下面解法哪里错，并写出正确解法：${formatNumber(coefficient)}x = ${formatNumber(right)}`;
      solution = `错误在于小数除法小数点错位。正确做法：x = ${formatNumber(right)} / ${formatNumber(
        coefficient
      )} = ${answer}。`;
      return buildProblem(type, equation, answer, solution, includeSolution, question, {
        mode: "diagnosis",
        wrongWork: `${formatNumber(coefficient)}x = ${formatNumber(right)}，错算成 x = ${formatNumber(
          right * coefficient
        )}`,
        errorPoint: "小数点错位，导致除以小数时结果缩小。",
      });
    }
    case "reciprocal_error_diagnosis": {
      const denominator = pick([3, 4, 5, 6]);
      const realAnswer = answer * denominator;
      equation = makeEquation(1 / denominator, 0, 0, answer);
      question = `判断下面解法哪里错，并写出正确解法：1/${denominator}x = ${answer}`;
      solution = `错误在于没有乘倒数。正确做法：两边同时乘 ${denominator}，得 x = ${realAnswer}。`;
      return buildProblem(type, equation, realAnswer, solution, includeSolution, question, {
        mode: "diagnosis",
        wrongWork: `1/${denominator}x = ${answer}，错算成 x = ${answer} / ${denominator}`,
        errorPoint: "分数系数化为 1 时，应乘倒数，不能直接再除以分母。",
      });
    }
    case "unknown_divisor_error_diagnosis": {
      const quotient = randomInt(2, 9);
      const realAnswer = answer;
      const dividend = realAnswer * quotient;
      equation = makeEquation(quotient, 0, 0, dividend);
      question = `判断下面解法哪里错，并写出正确解法：${dividend} / x = ${quotient}`;
      solution = `错误在于把未知数作除数当成了被除数。正确做法：除数 = 被除数 / 商，所以 x = ${dividend} / ${quotient} = ${realAnswer}。`;
      return buildProblem(type, equation, realAnswer, solution, includeSolution, question, {
        mode: "diagnosis",
        wrongWork: `${dividend} / x = ${quotient}，错算成 x = ${dividend} * ${quotient}`,
        errorPoint: "未知数在除数位置，不能按 x / ${quotient} 的方法处理。",
      });
    }
    default:
      return createEquationByType(TYPE_BY_ID.get("multiply_add_two_step"), includeSolution);
  }

  return buildProblem(type, equation, solveLinear(equation), solution, includeSolution, question);
}

function getTypeCatalog() {
  return TYPE_CATALOG.map((category) => ({
    ...category,
    types: category.types.map((type) => ({
      ...type,
      ...buildTypeMetadata(category, type),
      examples: [...type.examples],
      keywords: buildKeywords(category, type),
    })),
  }));
}

function getFinderGroups() {
  return FINDER_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      ...item,
      typeIds: item.typeIds ? [...item.typeIds] : undefined,
    })),
  }));
}

function getAllTypes() {
  return TYPE_CATALOG.flatMap((category) => category.types);
}

function resolveTypes(options = {}) {
  if (Array.isArray(options.typeIds) && options.typeIds.length > 0) {
    const types = Array.from(new Set(options.typeIds)).map((id) => TYPE_BY_ID.get(id)).filter(Boolean);
    if (types.length > 0) return types;
  }

  if (options.typeId && TYPE_BY_ID.has(options.typeId)) {
    return [TYPE_BY_ID.get(options.typeId)];
  }

  if (options.categoryId) {
    const category = TYPE_CATALOG.find((item) => item.id === options.categoryId);
    if (category) return category.types;
  }

  if (options.difficulty === "easy") {
    return ["add_one_step", "subtract_one_step", "multiply_one_step", "divide_one_step"].map((id) =>
      TYPE_BY_ID.get(id)
    );
  }

  if (options.difficulty === "medium") {
    return ["multiply_add_two_step", "add_subtract_two_step", "number_part_first"].map((id) =>
      TYPE_BY_ID.get(id)
    );
  }

  if (options.difficulty === "hard") {
    return ["bracket_as_whole", "combine_like_terms", "x_on_both_sides"].map((id) =>
      TYPE_BY_ID.get(id)
    );
  }

  return getAllTypes();
}

function generateLocalProblems(options = {}) {
  const count = toPositiveInt(options.count, 10, 1, 30);
  const includeSolution = options.includeSolution !== false;
  const types = resolveTypes(options);

  return {
    source: "local",
    fallback: false,
    message: "已使用本地专项题型库生成。",
    catalogVersion: "vertical-equation-v1",
    problems: Array.from({ length: count }, (_, index) =>
      createEquationByType(types[index % types.length], includeSolution)
    ),
  };
}

function evaluateLinearEquation(equation, xValue) {
  return {
    left: equation.left.x * xValue + equation.left.constant,
    right: equation.right.x * xValue + equation.right.constant,
  };
}

async function generateProblems(options = {}, services = {}) {
  const shouldUseAi = Boolean(options.useAi && services.aiAvailable && services.callAi);

  if (shouldUseAi) {
    try {
      const aiResult = await services.callAi(options);
      return { ...aiResult, source: "ai", fallback: false };
    } catch (error) {
      const localResult = generateLocalProblems(options);
      return {
        ...localResult,
        fallback: true,
        message: "AI 生成失败，已使用本地生成：专项题型库。",
      };
    }
  }

  return generateLocalProblems(options);
}

module.exports = {
  evaluateLinearEquation,
  generateLocalProblems,
  generateProblems,
  getFinderGroups,
  getTypeCatalog,
  searchTypes,
};
