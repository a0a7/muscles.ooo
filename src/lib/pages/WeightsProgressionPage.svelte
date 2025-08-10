
<script lang="ts">
import { onMount, afterUpdate, onDestroy, tick } from 'svelte';
import { get } from 'svelte/store';
import { useMetric } from '../../stores/useMetric';
import allLiftsJson from '$lib/components/exercise-muscle-groups.json';
// No workaround needed, use $useMetric directly in reactive blocks
// (removed duplicate import of onDestroy)
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

export let activities: any[] = [];

// List of lifts to show by default (user can customize this in future)
// All available lifts from JSON
const allLifts: string[] = Object.keys(allLiftsJson);
// User-selected lifts, cached in localStorage
let selectedLifts: string[] = [];
const SELECTED_LIFTS_KEY = 'weightsProgressionSelectedLifts';
// Load from localStorage if available
if (typeof localStorage !== 'undefined') {
  const cached = localStorage.getItem(SELECTED_LIFTS_KEY);
  if (cached) {
    try {
      selectedLifts = JSON.parse(cached);
    } catch (e) {
      selectedLifts = ['LAT_PULLDOWN'];
    }
  } else {
    selectedLifts = ['LAT_PULLDOWN'];
  }
}
let liftSearch = '';

// Custom sorted lifts for selector UI
let sortedLifts: string[] = allLifts;

// Resort lifts so selected are at the top after selector closes (after toggle)
function updateSortedLifts() {
  sortedLifts = [
    ...selectedLifts,
    ...allLifts.filter(l => !selectedLifts.includes(l))
  ];
}
updateSortedLifts();

// Date range selection
let minDate = '';
let maxDate = '';
// Compute min/max from activities if not set
$: {
  if (activities.length > 0 && (!minDate || !maxDate)) {
    const allDates = activities.flatMap(a => [a.startTime, a.startTimeLocal].filter(Boolean)).map(d => d && (d.split('T')[0] || d.split(' ')[0]));
    const sorted = allDates.filter(Boolean).sort();
    if (!minDate) minDate = sorted[0] || '';
    if (!maxDate) maxDate = sorted[sorted.length - 1] || '';
  }
}

const liftNames: Record<string, string> = {
};

// Helper: convert kg to lbs
const kgToLbs = (kg: number) => kg * 2.20462;
const lombardi1RM = (weight: number, reps: number) => weight * Math.pow(reps, 0.1);
const lombardi6RM = (weight: number, reps: number) => lombardi1RM(weight, reps) / Math.pow(6, 0.1);

// Process activities into a map of lift name -> array of {date, 6RM, ...}

let liftData: Record<string, Array<{ date: string, avgWeight: number, avgReps: number, est6RM: number }>> = {};
// Store trendline info for each lift
let trendlines: Record<string, { m: number, b: number, r2: number, eq: string } | null> = {};
// (removed duplicate import of onDestroy)


// Debug: Print all unique set names from activities
$: if (activities && activities.length > 0) {
  const allSetNames = new Set();
  for (const activity of activities) {
    if (activity.exerciseSets) {
      for (const set of activity.exerciseSets) {
        allSetNames.add(set.name);
      }
    }
  }
  console.log('All set names in activities:', Array.from(allSetNames));
}

// Toggle lift selection
function toggleLift(lift: string) {
  let newLifts;
  if (selectedLifts.includes(lift)) {
    newLifts = selectedLifts.filter(l => l !== lift);
  } else {
    newLifts = [...selectedLifts, lift];
  }
  selectedLifts = newLifts;
  // Save to localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SELECTED_LIFTS_KEY, JSON.stringify(selectedLifts));
  }
  // Resort lifts so selected are at the top
  updateSortedLifts();
}




// Linear regression helper
function linearRegression(data: {x: number, y: number}[]) {
  const n = data.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (const p of data) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = meanY - m * meanX;
  // r^2
  let ssTot = 0, ssRes = 0;
  for (const p of data) {
    const yPred = m * p.x + b;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - yPred) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  // Calculate slope per month (x is ms, so 1 month ≈ 30.44*24*60*60*1000 ms)
  const MS_PER_MONTH = 30.44 * 24 * 60 * 60 * 1000;
  const slopePerMonth = m * MS_PER_MONTH;
  return { m, b, r2, slopePerMonth };
}

$: {
  const out: typeof liftData = {};
  const trend: typeof trendlines = {};
  for (const lift of selectedLifts) {
    out[lift] = [];
    for (const activity of activities) {
      if (!activity.exerciseSets) continue;
      const sets = activity.exerciseSets.filter((s: any) => s.name === lift);
      if (!sets.length) continue;
      const dateTime = activity.startTime || activity.startTimeLocal || '';
      let date = '';
      if (dateTime.includes('T')) {
        date = dateTime.split('T')[0];
      } else if (dateTime.includes(' ')) {
        date = dateTime.split(' ')[0];
      } else {
        date = dateTime;
      }
      // Filter by date range
      if ((minDate && date < minDate) || (maxDate && date > maxDate)) continue;
      const totalSets = sets.length;
      if (totalSets === 0) continue;
      const avgWeightKg = sets.reduce((sum: number, s: any) => sum + (s.weight || 0), 0) / totalSets;
      const avgReps = sets.reduce((sum: number, s: any) => sum + (s.reps || 0), 0) / totalSets;
      const avgWeight = ($useMetric ? avgWeightKg : kgToLbs(avgWeightKg)) / 1000;
      const est6RM = lombardi6RM(avgWeight, avgReps);
      out[lift].push({ date, avgWeight, avgReps, est6RM });    
    }
    out[lift].sort((a, b) => a.date.localeCompare(b.date));
    // Compute trendline for this lift
    const points = out[lift].map(row => ({
      x: new Date(row.date + 'T00:00:00').getTime(),
      y: row.est6RM
    }));
    trend[lift] = points.length >= 2 ? linearRegression(points) : null;
  }
  liftData = out;
  trendlines = trend;
  console.log('WeightsProgressionPage liftData:', JSON.stringify(out, null, 2));
}

let chartInstances: Record<string, Chart> = {};


$: {
  // Re-render charts when liftData or selectedLifts changes
  renderCharts();
}

async function renderCharts() {
  // Wait for DOM to update so canvases exist
  await tick();
  setTimeout(() => {
    if (!liftData || typeof $useMetric === 'undefined') return;
    // Destroy charts for lifts that are no longer selected
    for (const k in chartInstances) {
      if (!selectedLifts.includes(k)) {
        chartInstances[k].destroy();
        delete chartInstances[k];
      }
    }
    for (const lift of selectedLifts) {
      const canvas = document.getElementById('chart-' + lift) as HTMLCanvasElement;
      if (!canvas) continue;
      if (chartInstances[lift]) {
        chartInstances[lift].destroy();
        delete chartInstances[lift];
      }
      const dataRows = liftData[lift];
      if (!dataRows || dataRows.length === 0) continue;
      const points = dataRows.map(row => ({
        x: new Date(row.date + 'T00:00:00').getTime(),
        y: row.est6RM
      }));
      // Add trendline if possible
      let trendlineDataset = null;
      const trend = trendlines[lift];
      if (trend && points.length >= 2) {
        // Trendline from min x to max x
        const x1 = points[0].x;
        const x2 = points[points.length - 1].x;
        const y1 = trend.m * x1 + trend.b;
        const y2 = trend.m * x2 + trend.b;
        trendlineDataset = {
          label: 'Trendline',
          data: [ { x: x1, y: y1 }, { x: x2, y: y2 } ],
          type: 'line',
          borderColor: '#f59e42',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          order: 1,
          tension: 0,
        };
      }
      const datasets = [
        {
          label: '6RM',
          data: points,
          backgroundColor: '#2563eb',
          pointRadius: 3,
          order: 2,
        }
      ];
      if (trendlineDataset) datasets.push(trendlineDataset);
      chartInstances[lift] = new Chart(canvas, {
        type: 'scatter',
        data: {
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false }
          },
          scales: {
            x: {
              type: 'time',
              time: { unit: 'month' },
              title: { display: true, text: 'Date' }
            },
            y: {
              title: { display: true, text: $useMetric ? '6RM (kg)' : '6RM (lbs)' },
              beginAtZero: true
            }
          }
        }
      });
    }
  }, 0);
}

onDestroy(() => {
  for (const k in chartInstances) chartInstances[k].destroy();
});
</script>

<div class="max-w-[86.5%] h-full px-6 lg:px-8 mx-auto items-center justify-center">
  <h2 class="text-3xl font-black mx-auto mt-8 text-center w-full">Lift Progressions</h2>
  <p class="max-w-2xl mx-auto">This tool is scuffed but it works like this: every set of an excercise is converted to an equivalent 6-rep max using the Lombardi formula. Sets for each excercise are averaged across each day.</p>
  <!-- Date range picker above -->
  <div class="flex flex-col gap-2 w-full max-w-2xl mx-auto mt-2 mb-4">
    <label class="font-semibold">Date Range</label>
    <div class="flex gap-2 items-center">
      <input type="date" bind:value={minDate} class="border rounded px-2 py-1" />
      <span>to</span>
      <input type="date" bind:value={maxDate} class="border rounded px-2 py-1" />
    </div>
  </div>
  <!-- Lift multi-select full width -->
  <div class="flex flex-col gap-2 w-full max-w-2xl mx-auto mb-4">
    <label class="font-semibold">Select Lifts</label>
    <input type="text" placeholder="Search lifts..." bind:value={liftSearch} class="border rounded px-2 py-1" />
    <div class="border rounded h-48 overflow-y-auto bg-white">
      {#each sortedLifts.filter(l => l.toLowerCase().includes(liftSearch.replace(/ /g, '_').toLowerCase())) as lift}
        <div class="flex items-center px-2 py-1 hover:bg-blue-50 cursor-pointer" on:click={() => toggleLift(lift)}>
          <input type="checkbox" checked={selectedLifts.includes(lift)} readonly class="mr-2" />
          <span>{lift.replace(/_/g, ' ')}</span>
        </div>
      {/each}
    </div>
    <div class="text-xs text-gray-500 mt-1">Selected: {selectedLifts.length}</div>
  </div>
  <div class="flex flex-col items-center w-full mt-8">
    <div class="text-sm text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-4 py-2 mb-6 max-w-xl text-center">
      After selecting new lifts, please <b>reload the page</b> to see the updated charts.
    </div>
  </div>
  <div class="w-full max-w-2xl mx-auto overflow-x-auto">
    <div class="flex gap-8 py-2 min-w-fit" style="width: max-content;">
      {#each selectedLifts as lift}
        <div class="flex flex-col items-center w-[340px] flex-shrink-0">
          <h3 class="text-base font-semibold mb-1">{liftNames[lift] || lift}</h3>
          {#if trendlines[lift] && liftData[lift] && liftData[lift].length >= 2}
            <div class="text-xs text-gray-500 mb-1 text-center">
              Δ {($useMetric ? 'kg' : 'lbs')}/month: {trendlines[lift].slopePerMonth.toFixed(2)}, R² = {trendlines[lift].r2.toFixed(3)}
            </div>
          {/if}
          <div style="height:260px;width:100%">
            {#if liftData[lift] && liftData[lift].length === 0}
              <div class="flex items-center justify-center h-full text-gray-400 text-sm" style="height: 100%">No data for this lift.</div>
            {:else}
              <canvas id={'chart-' + lift}></canvas>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>