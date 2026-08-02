// Chart dimensions
const margin = { top: 30, right: 30, bottom: 90, left: 205 };
const chartWidth = 660;
const chartHeight = 400;
const width = chartWidth - margin.left - margin.right;
const height = chartHeight - margin.top - margin.bottom;

// Stress group colors and labels
const stressColor = {
  0: "#4f8f5f",
  1: "#c99a3c",
  2: "#b0453b"
};

const stressLabel = {
  0: "Low stress",
  1: "Medium stress",
  2: "High stress"
};

// Variable labels
const varLabels = {
  bullying: "Bullying",
  future_career_concerns: "Future career concerns",
  anxiety_level: "Anxiety level",
  depression: "Depression",
  self_esteem: "Self-esteem",
  sleep_quality: "Sleep quality",
  academic_performance: "Academic performance",
  safety: "Safety",
  social_support: "Social support",
  teacher_student_relationship: "Teacher-student relationship"
};

const outcomeLabels = {
  academic_performance: "Academic performance",
  social_support: "Social support",
  sleep_quality: "Sleep quality",
  anxiety_level: "Anxiety level",
  depression: "Depression"
};

// Data and chart elements
let data = [];
let svg;
const tooltip = d3.select("#tooltip");

// Current state
let currentScene = 1;
let selectedExploreVariable = "academic_performance";

// Load the dataset
d3.csv("data/StressLevelDataset.csv", d3.autoType).then(raw => {
  data = raw;

  svg = d3.select("#chart")
    .attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  renderScene();
});

// Display the current scene
function renderScene() {
  svg.selectAll("*").remove();

  d3.select("#prev-btn").property("disabled", currentScene === 1);
  d3.select("#next-btn").property("disabled", currentScene === 3);
  d3.select("#scene-counter").text(`Scene ${currentScene} of 3`);

  d3.select("#explore-controls").property("hidden", currentScene !== 3);

  d3.select("#scene1-legend").style("display", currentScene === 1 ? "block" : "none");

  if (currentScene === 1) {
    drawScene1();
  }

  if (currentScene === 2) {
    drawScene2();
  }

  if (currentScene === 3) {
    selectedExploreVariable = "academic_performance";

    d3.select("#explore-select")
      .property("value", selectedExploreVariable);

    drawScene3(selectedExploreVariable, true);
  }
}

// Calculate correlation with stress
function correlation(field) {
  const x = data.map(d => d[field]);
  const y = data.map(d => d.stress_level);

  const mx = d3.mean(x);
  const my = d3.mean(y);

  const cov = d3.sum(
    x.map((value, i) => (value - mx) * (y[i] - my))
  );

  const sx = Math.sqrt(
    d3.sum(x.map(value => (value - mx) ** 2))
  );

  const sy = Math.sqrt(
    d3.sum(y.map(value => (value - my) ** 2))
  );

  return cov / (sx * sy);
}

// Scene 1
function drawScene1() {
  // Reset chart position
  svg.attr(
    "transform",
    `translate(${margin.left},${margin.top})`
  );

  d3.select("#scene-heading").text("What predicts stress?");

  d3.select("#scene-text")
    .text(
      "Comparing each factor in the survey to students' reported stress level, " +
      "bullying shows the strongest relationship with stress, with future career " +
      "concerns, anxiety, and depression close behind. Factors like self-esteem " +
      "and sleep quality run the other way: higher values are associated with " +
      "lower stress. Hover any bar to see its exact correlation value."
    );

  const results = Object.keys(varLabels)
    .map(key => ({
      label: varLabels[key],
      corr: correlation(key)
    }))
    .sort((a, b) => b.corr - a.corr);

  const x = d3.scaleLinear()
    .domain([-1, 1])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(results.map(d => d.label))
    .range([0, height])
    .padding(0.25);

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));

  svg.append("line")
    .attr("class", "zero-line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", 0)
    .attr("y2", height);

  svg.selectAll("rect")
    .data(results)
    .join("rect")
    .attr("y", d => y(d.label))
    .attr("height", y.bandwidth())
    .attr("x", d => x(Math.min(0, d.corr)))
    .attr("width", d => Math.abs(x(d.corr) - x(0)))
    .attr("fill", d => d.corr >= 0 ? "#b0453b" : "#4f8f5f")
    .attr("fill-opacity", 0.85)
    .on("mouseover", (event, d) => {
      showTooltip(
        event,
        `${d.label}<br>Correlation with stress: ${d.corr.toFixed(2)}`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 38)
    .attr("text-anchor", "middle")
    .text("Correlation with stress level (−1 to 1)");

  const top = results[0];
  const ty = y(top.label) + y.bandwidth() / 2;

  drawAnnotation(
    x(top.corr),
    ty,
    25,
    -8,
    "Highest correlation",
    `${top.label}, r = ${top.corr.toFixed(2)}`
  );
}

// Scene 2
function drawScene2() {
  d3.select("#scene-heading").text("A closer look: bullying");

  d3.select("#scene-text")
    .text(
      "Bullying was the single highest correlation in Scene 1. Grouping students " +
      "by how much bullying they report (0 = none, 5 = a great deal) shows why " +
      "the average stress rises with almost every step up the scale. Hover any " +
      "bar to see the exact average."
    );

  drawVerticalBars(
    "bullying",
    "stress_level",
    "Bullying (0–5)",
    "Average stress level (0–2)",
    "#3f72a8"
  );
}

// Scene 3
function drawScene3(variable, isDefault) {
  const heading = isDefault
    ? "The consequences: academic performance. Explore it yourself."
    : `Exploring: ${outcomeLabels[variable].toLowerCase()}`;

  const bodyText = isDefault
    ? "Grouping students by their overall stress level instead (low, medium, high) " +
      "shows that the highest-stress group reports the lowest average academic " +
      "performance. Hover a bar to see the exact average. This is where the guided " +
      "story ends. Use the dropdown below to explore how stress relates to other " +
      "outcomes on your own."
    : `Average ${outcomeLabels[variable].toLowerCase()} across the three stress ` +
      "groups. Hover a bar for the exact value, or pick a different outcome above " +
      "to keep exploring.";

  d3.select("#scene-heading").text(heading);
  d3.select("#scene-text").text(bodyText);

  drawStressGroupBars(variable);
}

// Draw the Scene 2 bar chart
function drawVerticalBars(
  categoryField,
  valueField,
  xLabel,
  yLabel,
  color
) {
  svg.selectAll("*").remove();
  svg.attr("transform", `translate(60,${margin.top})`);

  const innerWidth = chartWidth - 60 - 30;

  const grouped = d3.rollups(
    data,
    values => d3.mean(values, d => d[valueField]),
    d => d[categoryField]
  ).sort((a, b) => d3.ascending(a[0], b[0]));

  const x = d3.scaleBand()
    .domain(grouped.map(d => d[0]))
    .range([0, innerWidth])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(grouped, d => d[1]) * 1.2])
    .range([height, 0]);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(grouped)
    .join("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d[1]))
    .attr("fill", color)
    .attr("fill-opacity", 0.85)
    .on("mouseover", (event, d) => {
      showTooltip(
        event,
        `Value ${d[0]}<br>Average: ${d[1].toFixed(2)}`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", height + 38)
    .attr("text-anchor", "middle")
    .text(xLabel);

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -42)
    .attr("text-anchor", "middle")
    .text(yLabel);

  const last = grouped[grouped.length - 1];
  const bx = x(last[0]) + x.bandwidth() / 2;
  const by = y(last[1]);

  drawAnnotation(
    bx,
    by,
    -90,
    -55,
    "Highest bullying group",
    `Average stress: ${last[1].toFixed(2)} of 2`
  );
}

// Draw the Scene 3 bar chart
function drawStressGroupBars(valueField) {
  svg.selectAll("*").remove();
  svg.attr("transform", `translate(60,${margin.top})`);

  const innerWidth = chartWidth - 60 - 30;

  const grouped = [0, 1, 2].map(level => {
    const rows = data.filter(d => d.stress_level === level);

    return {
      level,
      value: d3.mean(rows, d => d[valueField])
    };
  });

  const maxVal = d3.max(grouped, d => d.value);

  const x = d3.scaleBand()
    .domain([0, 1, 2])
    .range([0, innerWidth])
    .padding(0.35);

  const y = d3.scaleLinear()
    .domain([0, maxVal * 1.2])
    .range([height, 0]);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d => stressLabel[d])
    );

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(grouped)
    .join("rect")
    .attr("x", d => x(d.level))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", d => stressColor[d.level])
    .attr("fill-opacity", 0.85)
    .on("mouseover", (event, d) => {
      showTooltip(
        event,
        `${stressLabel[d.level]}<br>Average: ${d.value.toFixed(2)}`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", height + 38)
    .attr("text-anchor", "middle")
    .text("Stress group");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -42)
    .attr("text-anchor", "middle")
    .text(`Average ${outcomeLabels[valueField].toLowerCase()}`);

  const highGroup = grouped[2];
  const lowGroup = grouped[0];

  const direction =
    highGroup.value < lowGroup.value ? "lowest" : "highest";

  const bx = x(2) + x.bandwidth() / 2;
  const by = y(highGroup.value);

  drawAnnotation(
    bx,
    by,
    25,
    -55,
    "High-stress group",
    `${direction === "lowest" ? "Lowest" : "Highest"} average: ` +
    highGroup.value.toFixed(2)
  );
}

// Draw an annotation
function drawAnnotation(px, py, dx, dy, title, detail) {
  const group = svg.append("g");

  const lineEndX = px + dx;
  const lineEndY = py + dy;

  // Position annotation text
  const textAnchor = dx < 0 ? "end" : "start";
  const textX = lineEndX + (dx < 0 ? -8 : 8);

  group.append("line")
    .attr("class", "annotation-line")
    .attr("x1", px)
    .attr("y1", py)
    .attr("x2", lineEndX)
    .attr("y2", lineEndY);

  group.append("text")
    .attr("class", "annotation-text")
    .attr("x", textX)
    .attr("y", lineEndY - 4)
    .attr("text-anchor", textAnchor)
    .attr("font-weight", "bold")
    .text(title);

  group.append("text")
    .attr("class", "annotation-text")
    .attr("x", textX)
    .attr("y", lineEndY + 12)
    .attr("text-anchor", textAnchor)
    .text(detail);
}

// Tooltip functions
function showTooltip(event, html) {
  tooltip
    .attr("hidden", null)
    .html(html);

  moveTooltip(event);
}

function moveTooltip(event) {
  tooltip
    .style("left", event.pageX + 12 + "px")
    .style("top", event.pageY + 8 + "px");
}

function hideTooltip() {
  tooltip.attr("hidden", true);
}

// Navigation buttons
d3.select("#next-btn").on("click", () => {
  if (currentScene < 3) {
    currentScene++;
    renderScene();
  }
});

d3.select("#prev-btn").on("click", () => {
  if (currentScene > 1) {
    currentScene--;
    renderScene();
  }
});

// Exploration controls
d3.select("#explore-select").on("change", function () {
  selectedExploreVariable = this.value;

  drawScene3(
    selectedExploreVariable,
    selectedExploreVariable === "academic_performance"
  );
});

d3.select("#reset-btn").on("click", () => {
  selectedExploreVariable = "academic_performance";

  d3.select("#explore-select")
    .property("value", selectedExploreVariable);

  drawScene3(selectedExploreVariable, true);
});