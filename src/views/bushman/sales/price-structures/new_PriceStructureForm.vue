<template>
  <div class="ps-page">
    <!-- Top App Header -->
    <header class="app-header">
      <div class="brand">
        <div class="burger">☰</div>
        <div class="logo">VueStudio</div>
      </div>

      <div class="search">
        <span class="icon">🔎</span>
        <input placeholder="Search menu..." />
      </div>

      <div class="header-right">
        <button class="icon-btn" title="Notifications">🔔</button>
        <div class="avatar">
          <img
            alt="user"
            src="https://i.pravatar.cc/40?img=12"
          />
          <span>johnsmith@vuestudio.com</span>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="content">
      <!-- Page Title Row -->
      <div class="page-head">
        <div>
          <div class="crumbs">GPIOT DZ / <span>PRICE STRUCTURES</span></div>
          <h1>Create Price Structure</h1>
          <p class="subtitle">Rate card for a specific area + season + currency.</p>
        </div>

        <div class="head-actions">
          <button class="btn ghost" @click="resetForm">⟲ Reset</button>
          <button class="btn ghost" @click="saveDraft">💾 Save Draft</button>
          <button class="btn primary" @click="saveAndActivate">💾 Save &amp; Activate</button>
        </div>
      </div>

      <!-- 3-column layout -->
      <section class="grid">
        <!-- LEFT: Create Price Structure Form -->
        <aside class="panel">
          <div class="panel-title">Create Price Structure</div>

          <div class="form">
            <label class="field">
              <span class="lbl">Name <span class="req">*</span></span>
              <input v-model="form.name" placeholder="2025/26 USD - Maswa North" />
            </label>

            <label class="field">
              <span class="lbl">Area <span class="req">*</span></span>
              <select v-model="form.area">
                <option value="" disabled>Select area</option>
                <option>Maswa North</option>
                <option>Maswa South</option>
                <option>Burko</option>
              </select>
            </label>

            <label class="field">
              <span class="lbl">Season <span class="req">*</span></span>
              <select v-model="form.season">
                <option value="" disabled>Select season</option>
                <option>2025/2026</option>
                <option>2026/2027</option>
              </select>
            </label>

            <label class="field">
              <span class="lbl">Start Date <span class="req">*</span></span>
              <input v-model="form.startDate" type="date" />
            </label>

            <label class="field">
              <span class="lbl">End Date <span class="req">*</span></span>
              <input v-model="form.endDate" type="date" />
            </label>

            <label class="field">
              <span class="lbl">Currency <span class="req">*</span></span>
              <select v-model="form.currency">
                <option value="" disabled>Select currency</option>
                <option>USD</option>
                <option>TZS</option>
                <option>EUR</option>
              </select>
            </label>

            <div class="toggle-row">
              <span class="lbl">Active</span>
              <label class="switch">
                <input type="checkbox" v-model="form.active" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </aside>

        <!-- CENTER: Price Map + Rate Lines -->
        <section class="panel center">
          <div class="panel-title">Price Map</div>

          <div class="tabs">
            <button
              v-for="t in tabs"
              :key="t"
              class="tab"
              :class="{ active: activeTab === t }"
              @click="activeTab = t"
            >
              <span class="tab-icon">{{ tabIcon(t) }}</span>
              {{ t }}
            </button>
          </div>

          <div class="search-row">
            <span class="icon">🔎</span>
            <input v-model="search" placeholder="Search item name/code..." />
            <button class="icon-btn small">🔍</button>
          </div>

          <div class="rate-lines-head">
            <h3>Rate Lines</h3>
            <button class="btn primary small" @click="addLine">＋ Add line</button>
          </div>

          <div class="table">
            <div class="thead">
              <div>Item</div>
              <div>Type</div>
              <div>Hunting</div>
              <div>Min days</div>
              <div>Max days</div>
              <div></div>
            </div>

            <div
              v-for="(line, idx) in filteredLines"
              :key="line.id"
              class="trow"
              :class="{ selected: selectedLineId === line.id }"
              @click="selectLine(line.id)"
            >
              <div class="item-col">
                <div class="code">{{ line.code }}</div>
                <div class="name">{{ line.name }}</div>
              </div>

              <div>
                <select v-model="line.type" @click.stop>
                  <option>PACKAGE</option>
                  <option>TROPHY</option>
                  <option>EXTRA</option>
                  <option>LOGISTICS</option>
                </select>
              </div>

              <div>
                <select v-model="line.hunting" @click.stop>
                  <option>1x1</option>
                  <option>2x1</option>
                  <option>Observer</option>
                </select>
              </div>

              <div>
                <input v-model.number="line.minDays" type="number" min="0" @click.stop />
              </div>

              <div>
                <input v-model.number="line.maxDays" type="number" min="0" @click.stop />
              </div>

              <div class="remove">
                <button class="x" @click.stop="removeLine(idx)">✕</button>
              </div>
            </div>

            <div v-if="filteredLines.length === 0" class="empty">
              No lines found. Click “Add line”.
            </div>
          </div>
        </section>

        <!-- RIGHT: Line Details -->
        <aside class="panel">
          <div class="panel-title">Line Details</div>

          <div v-if="selectedLine" class="details">
            <div class="detail-title">
              <div class="big">{{ selectedLine.name }}</div>
              <div class="small muted">{{ selectedLine.code }}</div>
            </div>

            <div class="kv">
              <div class="row">
                <span class="k">Area:</span>
                <span class="v">{{ form.area || '—' }}</span>
                <span class="badge" :class="form.active ? 'ok' : 'off'">
                  {{ form.active ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <div class="row">
                <span class="k">Season:</span>
                <span class="v">{{ form.season || '—' }}</span>
              </div>

              <div class="row">
                <span class="k">Hunting Type:</span>
                <span class="v">{{ selectedLine.hunting }}</span>
              </div>

              <div class="row">
                <span class="k">Duration:</span>
                <span class="v">minDays={{ selectedLine.minDays }} maxDays={{ selectedLine.maxDays }}</span>
              </div>

              <hr />

              <div class="row">
                <span class="k">Pricing Unit:</span>
                <span class="v">{{ selectedLine.pricingUnit }}</span>
              </div>

              <div class="row">
                <span class="k">Amount:</span>
                <span class="v"><b>{{ money(selectedLine.amount) }}</b> {{ form.currency || 'USD' }}</span>
              </div>
            </div>

            <div class="detail-actions">
              <button class="btn primary" @click="editSelected">Edit</button>
              <button class="btn ghost" @click="disableSelected">Disable</button>
            </div>

            <div class="muted small linkish">Add Seasonal Override <i>(High Season)</i></div>
            <button class="btn ghost full" @click="manualOverride">Add Manual Override</button>
          </div>

          <div v-else class="empty-details">
            Select a line from “Rate Lines” to view details.
          </div>

          <div class="bottom-actions">
            <button class="btn ghost full" @click="saveDraft">Save Draft</button>
            <button class="btn success full" @click="saveAndActivate">💾 Save &amp; Activate</button>
          </div>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";

const tabs = ["Packages", "Trophy Fees", "Extras", "Logistics"];
const activeTab = ref("Packages");
const search = ref("");

const form = reactive({
  name: "2025/26 USD - Maswa North",
  area: "Maswa North",
  season: "2025/2026",
  startDate: "2025-07-01",
  endDate: "2026-11-30",
  currency: "USD",
  active: true,
});

const lines = reactive([
  {
    id: 1,
    code: "PKG-14D-BUFF-PLN",
    name: "14 Days Buff & Plains Game (1x1)",
    type: "PACKAGE",
    hunting: "1x1",
    minDays: 14,
    maxDays: 14,
    pricingUnit: "FLAT",
    amount: 45000,
  },
  {
    id: 2,
    code: "TF-BUFF-1ST",
    name: "Buffalo Trophy Fee — 1st",
    type: "TROPHY",
    hunting: "1x1",
    minDays: 0,
    maxDays: 0,
    pricingUnit: "PER ITEM",
    amount: 4100,
  },
  {
    id: 3,
    code: "EXT-OBSERVER-DAY",
    name: "Observer (per day/person)",
    type: "EXTRA",
    hunting: "Observer",
    minDays: 0,
    maxDays: 0,
    pricingUnit: "PER DAY/PERSON",
    amount: 450,
  },
  {
    id: 4,
    code: "LOG-HOTEL-ROOM-NIGHT",
    name: "Hotel Room Night",
    type: "LOGISTICS",
    hunting: "1x1",
    minDays: 0,
    maxDays: 0,
    pricingUnit: "PER NIGHT",
    amount: 180,
  },
]);

const selectedLineId = ref(lines[0]?.id ?? null);

const selectedLine = computed(() => {
  return lines.find((l) => l.id === selectedLineId.value) || null;
});

const filteredLines = computed(() => {
  const tabToType = {
    "Packages": "PACKAGE",
    "Trophy Fees": "TROPHY",
    "Extras": "EXTRA",
    "Logistics": "LOGISTICS",
  };

  const wantedType = tabToType[activeTab.value];
  const q = search.value.trim().toLowerCase();

  return lines.filter((l) => {
    const matchTab = l.type === wantedType;
    const matchSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });
});

function tabIcon(t) {
  if (t === "Packages") return "👤";
  if (t === "Trophy Fees") return "🏆";
  if (t === "Extras") return "🧾";
  return "🚐";
}

function selectLine(id) {
  selectedLineId.value = id;
}

function addLine() {
  const nextId = Math.max(0, ...lines.map((l) => l.id)) + 1;
  const typeMap = {
    "Packages": "PACKAGE",
    "Trophy Fees": "TROPHY",
    "Extras": "EXTRA",
    "Logistics": "LOGISTICS",
  };

  const type = typeMap[activeTab.value] || "PACKAGE";

  lines.push({
    id: nextId,
    code: `NEW-${nextId}`,
    name: "New rate line",
    type,
    hunting: "1x1",
    minDays: 0,
    maxDays: 0,
    pricingUnit: type === "PACKAGE" ? "FLAT" : "PER ITEM",
    amount: 0,
  });

  selectedLineId.value = nextId;
}

function removeLine(idx) {
  const removed = filteredLines.value[idx];
  const indexInAll = lines.findIndex((l) => l.id === removed.id);
  if (indexInAll >= 0) lines.splice(indexInAll, 1);

  if (selectedLineId.value === removed.id) {
    selectedLineId.value = lines[0]?.id ?? null;
  }
}

function money(v) {
  try {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
  } catch {
    return String(v);
  }
}

/* Mock actions */
function resetForm() {
  form.name = "2025/26 USD - Maswa North";
  form.area = "Maswa North";
  form.season = "2025/2026";
  form.startDate = "2025-07-01";
  form.endDate = "2026-11-30";
  form.currency = "USD";
  form.active = true;
}

function saveDraft() {
  alert("Saved as Draft (mock)");
}
function saveAndActivate() {
  alert("Saved & Activated (mock)");
}
function editSelected() {
  alert("Edit line (mock)");
}
function disableSelected() {
  alert("Disable line (mock)");
}
function manualOverride() {
  alert("Manual override (mock)");
}
</script>

<style scoped>
/* Basic look similar to the screenshots: light gray page, soft cards */
:root {
  --bg: #f3f5f9;
  --card: #ffffff;
  --border: #e5e7ef;
  --text: #1b2430;
  --muted: #667085;
  --blue: #1f6feb;
  --blue-weak: #e9f1ff;
  --green: #2e7d32;
  --shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.ps-page {
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

/* Header */
.app-header {
  height: 64px;
  display: grid;
  grid-template-columns: 220px 1fr 340px;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.burger {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
}
.logo {
  font-weight: 800;
  font-size: 20px;
}

.search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f1f3f7;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
}
.search input {
  border: 0;
  background: transparent;
  outline: none;
  width: 100%;
}

.header-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}
.avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 13px;
}
.avatar img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.icon-btn {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  height: 38px;
  width: 38px;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.icon-btn.small {
  height: 36px;
  width: 44px;
  border-radius: 10px;
}

/* Content */
.content {
  padding: 18px 18px 26px;
}

/* Page head */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
}
.crumbs {
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.3px;
}
.crumbs span {
  font-weight: 700;
}
h1 {
  margin: 8px 0 4px;
  font-size: 34px;
}
.subtitle {
  margin: 0;
  color: var(--muted);
}

.head-actions {
  display: flex;
  gap: 10px;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  gap: 16px;
  align-items: start;
}

/* Panels */
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: hidden;
}
.panel-title {
  padding: 14px 14px;
  border-bottom: 1px solid var(--border);
  font-weight: 800;
  background: #fbfbfe;
}
.panel.center {
  min-height: 520px;
}

/* Buttons */
.btn {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}
.btn.small {
  padding: 8px 12px;
  border-radius: 10px;
}
.btn.primary {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
}
.btn.success {
  background: #1b8f4b;
  border-color: #1b8f4b;
  color: #fff;
}
.btn.ghost {
  background: #fff;
}
.btn.full {
  width: 100%;
}

/* Left Form */
.form {
  padding: 14px;
  display: grid;
  gap: 12px;
}
.field {
  display: grid;
  gap: 6px;
}
.lbl {
  font-size: 13px;
  color: #334155;
  font-weight: 700;
}
.req {
  color: #e11d48;
}
input,
select {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #d0d5dd;
  border-radius: 999px;
  transition: 0.2s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
}
.switch input:checked + .slider {
  background-color: var(--blue);
}
.switch input:checked + .slider:before {
  transform: translateX(24px);
}

/* Center: tabs and search */
.tabs {
  display: flex;
  gap: 10px;
  padding: 12px 12px 0;
}
.tab {
  border: 1px solid var(--border);
  background: #f6f8fc;
  border-radius: 12px;
  padding: 9px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #24324b;
}
.tab.active {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
}
.tab-icon {
  font-size: 14px;
}

.search-row {
  margin: 10px 12px 12px;
  display: grid;
  grid-template-columns: 28px 1fr 52px;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 8px 10px;
}
.search-row input {
  border: 0;
  padding: 8px 6px;
  border-radius: 0;
}
.rate-lines-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px 10px;
}
.rate-lines-head h3 {
  margin: 0;
  font-size: 18px;
}

/* Table */
.table {
  margin: 0 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.thead {
  display: grid;
  grid-template-columns: 1.6fr 0.9fr 0.9fr 0.7fr 0.7fr 52px;
  gap: 10px;
  padding: 12px;
  background: #f6f8fc;
  font-weight: 900;
  color: #2b364d;
}
.trow {
  display: grid;
  grid-template-columns: 1.6fr 0.9fr 0.9fr 0.7fr 0.7fr 52px;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid var(--border);
  cursor: pointer;
}
.trow.selected {
  background: var(--blue-weak);
}
.item-col .code {
  font-weight: 900;
}
.item-col .name {
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}
.remove {
  display: flex;
  align-items: center;
  justify-content: center;
}
.x {
  border: 0;
  background: transparent;
  color: #e11d48;
  font-size: 18px;
  cursor: pointer;
}
.empty {
  padding: 18px;
  color: var(--muted);
}

/* Right details */
.details {
  padding: 14px;
}
.detail-title .big {
  font-size: 18px;
  font-weight: 900;
}
.detail-title .small {
  margin-top: 4px;
}
.kv {
  margin-top: 12px;
}
.kv .row {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
}
.kv .k {
  color: var(--muted);
  font-weight: 700;
}
.kv hr {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 10px 0;
}
.badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 12px;
  border: 1px solid var(--border);
}
.badge.ok {
  background: #e9f7ef;
  border-color: #b7e2c5;
  color: var(--green);
}
.badge.off {
  background: #f2f4f7;
  color: #475467;
}
.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.muted {
  color: var(--muted);
}
.small {
  font-size: 12px;
}
.linkish {
  margin-top: 10px;
}

.empty-details {
  padding: 18px 14px;
  color: var(--muted);
}

.bottom-actions {
  border-top: 1px solid var(--border);
  padding: 12px 14px 14px;
  display: grid;
  gap: 10px;
}
</style>
