(function () {
  "use strict";

  const API_BASE = "/analytics";
  const FETCH_TIMEOUT_MS = 15000;

  const ALGORITHM_LABELS = {
    global: "Global",
    fixed: "Fixed Window",
    "sliding-log": "Sliding Log",
    "sliding-counter": "Sliding Counter",
    "token-bucket": "Token Bucket",
    "leaky-bucket": "Leaky Bucket",
  };

  const state = {
    algorithm: null,
    charts: { browsers: null, algorithms: null, hourly: null },
  };

  const el = {
    pageTitle: document.getElementById("pageTitle"),
    pageSubtitle: document.getElementById("pageSubtitle"),
    algorithmFilter: document.getElementById("algorithmFilter"),
    algorithmChartCard: document.getElementById("algorithmChartCard"),
    stateLoading: document.getElementById("stateLoading"),
    stateError: document.getElementById("stateError"),
    stateReady: document.getElementById("stateReady"),
    errorMessage: document.getElementById("errorMessage"),
    retryBtn: document.getElementById("retryBtn"),
    kpiTotalRequests: document.getElementById("kpiTotalRequests"),
    kpiUniqueIps: document.getElementById("kpiUniqueIps"),
  };

  function getAlgorithmFromPath() {
    const match = window.location.pathname.match(/^\/dashboard\/algorithm\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function syncFilterFromPath() {
    const fromPath = getAlgorithmFromPath();
    state.algorithm = fromPath;
    el.algorithmFilter.value = fromPath || "";
    updateNavActive();
    updatePageHeading();
  }

  function updatePageHeading() {
    if (state.algorithm) {
      const label = ALGORITHM_LABELS[state.algorithm] || state.algorithm;
      el.pageTitle.textContent = label + " Analytics";
      el.pageSubtitle.textContent = "Filtered by " + label;
    } else {
      el.pageTitle.textContent = "Analytics Overview";
      el.pageSubtitle.textContent = "All algorithms";
    }
  }

  function updateNavActive() {
    document.querySelectorAll(".nav-link").forEach((a) => {
      a.classList.remove("active");
      const algo = a.getAttribute("data-algorithm");
      if (state.algorithm) {
        if (algo === state.algorithm) a.classList.add("active");
      } else {
        if (a.getAttribute("data-page") === "overview") a.classList.add("active");
      }
    });
  }

  function showState(which) {
    if (el.stateLoading) el.stateLoading.hidden = which !== "loading";
    if (el.stateError) el.stateError.hidden = which !== "error";
    if (el.stateReady) el.stateReady.hidden = which !== "ready";
  }

  function showError(msg) {
    if (el.errorMessage) el.errorMessage.textContent = msg || "Failed to load data.";
    showState("error");
  }

  function buildApiUrl(path, params = {}) {
    const pathWithQuery = API_BASE + path;
    const url = new URL(pathWithQuery, window.location.origin || "http://localhost");
    if (state.algorithm && path.indexOf("/algorithm/") === -1) url.searchParams.set("algorithm", state.algorithm);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  async function fetchApi(path, params = {}) {
    const url = buildApiUrl(path, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res;
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") throw new Error("Request timed out. Is the server running at " + (window.location.origin || "http://localhost:3000") + "?");
      throw new Error(err.message || "Network error. Is the server running?");
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      let errMsg = res.statusText || "Request failed";
      try {
        const j = JSON.parse(text);
        if (j.message) errMsg = j.message;
      } catch (_) {}
      throw new Error(errMsg + " (" + res.status + ")");
    }
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (_) {
      throw new Error("Invalid JSON from server");
    }
  }

  async function loadData() {
    showState("loading");
    try {
      var base =
        window.location.origin && window.location.origin !== "null"
          ? window.location.origin
          : "http://localhost:3000";
      var pingUrl = base + API_BASE + "/ping";
      var pingOk = false;
      try {
        var pingRes = await fetch(pingUrl, { method: "GET" });
        pingOk = pingRes.ok;
      } catch (_) {}

      if (!pingOk) {
        throw new Error(
          "Cannot reach server. Start the app (npm run dev) and open: " + base + "/dashboard"
        );
      }

      if (state.algorithm) {
        const data = await fetchApi("/algorithm/" + encodeURIComponent(state.algorithm));
        if (!data || !data.overall) throw new Error("Invalid response from server");
        renderOverview(data.overall);
        renderBrowsers(data.browsers || []);
        renderHourly(data.hourly || []);
        if (el.algorithmChartCard) el.algorithmChartCard.style.display = "none";
        if (el.stateReady) el.stateReady.classList.add("dashboard--algorithm-view");
        if (state.charts.algorithms) {
          state.charts.algorithms.data.labels = [];
          state.charts.algorithms.data.datasets[0].data = [];
          state.charts.algorithms.update("none");
        }
      } else {
        const [overall, browsers, algorithms, hourly] = await Promise.all([
          fetchApi("/overall"),
          fetchApi("/browsers"),
          fetchApi("/algorithms"),
          fetchApi("/hourly"),
        ]);
        renderOverview(overall || { total_requests: 0, unique_ips: 0 });
        renderBrowsers(browsers || []);
        renderAlgorithms(algorithms || []);
        renderHourly(hourly || []);
        if (el.algorithmChartCard) el.algorithmChartCard.style.display = "";
        if (el.stateReady) el.stateReady.classList.remove("dashboard--algorithm-view");
      }
      showState("ready");
    } catch (err) {
      console.error("Analytics load error:", err);
      showError(err.message || "Failed to load analytics.");
    } finally {
      if (el.stateLoading) el.stateLoading.hidden = true;
    }
  }

  function renderOverview(data) {
    if (!data) return;
    const total = Number(data.total_requests) || 0;
    const ips = Number(data.unique_ips) || 0;
    if (el.kpiTotalRequests) el.kpiTotalRequests.textContent = formatNumber(total);
    if (el.kpiUniqueIps) el.kpiUniqueIps.textContent = formatNumber(ips);
  }

  function formatNumber(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(n);
  }

  const CHART_COLORS = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4",
  ];

  function renderBrowsers(data) {
    const list = Array.isArray(data) ? data : [];
    const labels = list.map((d) => (d && d.browser) ? d.browser : "Unknown");
    const values = list.map((d) => (d && typeof d.total === "number") ? d.total : 0);

    const barColors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    const barColorsAlpha = barColors.map((c) => c + "99");

    if (state.charts.browsers) {
      state.charts.browsers.data.labels = labels;
      state.charts.browsers.data.datasets[0].data = values;
      state.charts.browsers.data.datasets[0].backgroundColor = barColorsAlpha;
      state.charts.browsers.data.datasets[0].borderColor = barColors;
      state.charts.browsers.update("none");
      return;
    }

    const canvas = document.getElementById("chartBrowsers");
    if (!canvas || typeof Chart === "undefined") return;
    const ctx = canvas.getContext("2d");
    state.charts.browsers = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Requests",
          data: values,
          backgroundColor: barColorsAlpha,
          borderColor: barColors,
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.06)" },
            ticks: { color: "#a1a1aa" },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#a1a1aa", maxRotation: 45 },
          },
        },
      },
    });
  }

  function renderAlgorithms(data) {
    const list = Array.isArray(data) ? data : [];
    const filtered = list.filter((d) => d && (d.total > 0));
    const labels = filtered.map((d) => ALGORITHM_LABELS[d.algorithm] || d.algorithm || "Unknown");
    const values = filtered.map((d) => (typeof d.total === "number") ? d.total : 0);

    if (state.charts.algorithms) {
      state.charts.algorithms.data.labels = labels;
      state.charts.algorithms.data.datasets[0].data = values;
      state.charts.algorithms.data.datasets[0].backgroundColor = CHART_COLORS.slice(0, values.length);
      state.charts.algorithms.update("none");
      return;
    }

    const canvas = document.getElementById("chartAlgorithms");
    if (!canvas || typeof Chart === "undefined") return;
    const ctx = canvas.getContext("2d");
    state.charts.algorithms = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: CHART_COLORS.slice(0, values.length),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right" },
        },
      },
    });
  }

  function renderHourly(data) {
    const list = Array.isArray(data) ? data : [];
    const points = list.map((d) => ({ x: d && d.hour, y: (d && typeof d.total === "number") ? d.total : 0 }));
    const labels = points.map((p) => formatHour(p.x));
    const values = points.map((p) => p.y);

    if (state.charts.hourly) {
      state.charts.hourly.data.labels = labels;
      state.charts.hourly.data.datasets[0].data = values;
      state.charts.hourly.update("none");
      return;
    }

    const canvas = document.getElementById("chartHourly");
    if (!canvas || typeof Chart === "undefined") return;
    const ctx = canvas.getContext("2d");
    state.charts.hourly = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Requests",
          data: values,
          borderColor: CHART_COLORS[0],
          backgroundColor: CHART_COLORS[0] + "20",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.06)" },
            ticks: { color: "#a1a1aa" },
          },
          x: {
            grid: { color: "rgba(255,255,255,0.06)" },
            ticks: { color: "#a1a1aa", maxRotation: 45 },
          },
        },
      },
    });
  }

  function formatHour(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function onFilterChange() {
    const value = el.algorithmFilter.value || null;
    state.algorithm = value;
    if (value) {
      const path = "/dashboard/algorithm/" + encodeURIComponent(value);
      window.history.pushState({}, "", path);
    } else {
      window.history.pushState({}, "", "/dashboard");
    }
    updateNavActive();
    updatePageHeading();
    loadData();
  }

  function onPopState() {
    syncFilterFromPath();
    loadData();
  }

  function init() {
    if (!el.stateLoading || !el.stateReady || !el.stateError) {
      console.error("Dashboard: missing required DOM elements");
      return;
    }
    syncFilterFromPath();
    if (el.algorithmFilter) el.algorithmFilter.addEventListener("change", onFilterChange);
    window.addEventListener("popstate", onPopState);
    if (el.retryBtn) el.retryBtn.addEventListener("click", loadData);

    loadData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
