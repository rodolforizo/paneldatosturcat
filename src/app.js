import { modules } from './data/modules.js';
import { photos } from './data/photos.js';

const palette = ['#1479a8','#d09a20','#26876c','#d55748','#805cc9','#17a8a8','#d16e28','#3658a4','#b73c77','#6d8f32'];
const nav = document.getElementById('module-nav');
const view = document.getElementById('module-view');
const charts = [];
const fmt = (value, digits = 1) => value == null ? '—' : Number(value).toLocaleString('es-AR', { maximumFractionDigits: digits });
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function setHero() {
  const photo = photos[0];
  document.getElementById('hero').style.setProperty('--hero-image', `url("${photo.src}")`);
  const credit = document.getElementById('hero-credit');
  credit.href = photo.page;
  credit.textContent = `${photo.title} · ${photo.author} · ${photo.license}`;
}

function buildNav() {
  nav.innerHTML = modules.map((module, i) => `
    <button class="nav-item" type="button" data-module="${i}" style="--module-color:${palette[i]}" aria-pressed="false">
      <span class="nav-num">${String(i + 1).padStart(2,'0')}</span>
      <span class="nav-title">${esc(module.title)}</span>
      <span class="nav-sub">${esc(module.sub)}</span>
    </button>`).join('');
  nav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-module]');
    if (button) showModule(Number(button.dataset.module), true);
  });
}

const sourceLinks = [
  [{label:'Consolidado provincial y control de fuentes · acceso interno'}],
  [{label:'Padrón de prestadores · fuente 92 · acceso interno'},{label:'Consolidado y control de fuentes · acceso interno'}],
  [{label:'Base OIT y reglas de depuración · acceso interno'}],
  [{label:'Consolidado ANAC · control de corte · acceso interno'}],
  [{label:'Tablero Yvera de conectividad terrestre',url:'https://tableros.yvera.tur.ar/conectividad_terrestre.html'},{label:'Datos abiertos nacionales',url:'https://www.datos.gob.ar/dataset/turismo-conectividad-terrestre-interurbana'}],
  [{label:'Informe Poncho · repositorio indicado por el usuario'},{label:'Serie diaria recalculada · acceso interno'}],
  [{label:'Base de visitas de Museos de Tinogasta · acceso interno'}],
  [{label:'Modelo estadístico ADLS 2026 · fuente 73 · acceso interno'},{label:'Consolidado de controles · acceso interno'}]
];

function kpiMarkup(items, color) {
  return `<div class="kpi-grid">${items.map(([label,value])=>`<div class="kpi" style="--module-color:${color}"><span class="kpi-label">${esc(label)}</span><strong>${fmt(value, label.includes('%') || label.includes('Ocupación') ? 1 : 0)}${label.includes('Ocupación') ? '%' : ''}</strong></div>`).join('')}</div>`;
}

function readingMarkup(index) {
  if (index === 0) return `<aside class="reading"><h3>Cómo leer la ocupación</h3><p><strong>59,4% (enero–agosto 2026)</strong> es el porcentaje informado para el período. La fuente no aclara si el cálculo usa plazas-noches u habitaciones-noches ni cómo agrega los meses. El padrón registra <strong>359 establecimientos, 3.332 habitaciones y 10.385 plazas</strong>; ese inventario mide capacidad física, no el denominador de ocupación. No corresponde multiplicar el 59,4% por las plazas para estimar plazas ocupadas.</p></aside>`;
  if (index === 1) return `<aside class="reading"><h3>Capacidad y conciliación</h3><p>El resumen por región declara <strong>359 establecimientos, 3.332 habitaciones y 10.385 plazas</strong>. Al sumar las filas individuales marcadas como indicador 1 se obtienen <strong>3.320 habitaciones y 10.359 plazas</strong>. Se muestran los totales declarados y se deja visible la diferencia pendiente de conciliación.</p></aside>`;
  if (index === 5) return `<aside class="reading"><h3>Unidad de conteo</h3><p>La cifra representa <strong>movimientos de circulación durante las jornadas</strong>. Puede incluir entradas reiteradas de una misma persona; no se interpreta como personas únicas ni como turistas alojados.</p></aside>`;
  if (index === 7) return `<aside class="reading"><h3>Control del total</h3><p>La suma de los valores mensuales disponibles para enero–agosto es <strong>1.625</strong>; el total consignado en el modelo fuente es 1.595. Se conserva el recálculo y se informa la diferencia de 30 hasta completar la conciliación.</p></aside>`;
  return '';
}

function tableMarkup(chart) {
  const hasSecond = Array.isArray(chart.v2);
  const isDoughnut = chart.kind === 'doughnut';
  const secondName = chart.secondLabel || 'Serie 2';
  let head = `<thead><tr><th>Categoría</th><th>${hasSecond ? esc(chart.firstLabel || 'Serie 1') : 'Valor'}</th>${hasSecond?`<th>${esc(secondName)}</th>`:''}${isDoughnut?'<th>Participación</th>':''}</tr></thead>`;
  let rows = chart.l.map((label, idx) => {
    const a = chart.v[idx], b = hasSecond ? chart.v2[idx] : null;
    const share = isDoughnut && a != null ? `${fmt(a / chart.v.filter(x=>x!=null).reduce((sum,x)=>sum+x,0)*100,1)}%` : '';
    return `<tr><td>${esc(label)}</td><td class="${a==null?'empty':''}">${a==null?'—':fmt(a,1)}${esc(chart.unit||'')}</td>${hasSecond?`<td class="${b==null?'empty':''}">${b==null?'—':fmt(b,1)}${esc(chart.unit||'')}</td>`:''}${isDoughnut?`<td>${share}</td>`:''}</tr>`;
  }).join('');
  return `<table class="data-table">${head}<tbody>${rows}</tbody></table>`;
}

function chartMarkup(chart, index) {
  const caption = chart.caption ? `<p class="chart-caption">${esc(chart.caption)}</p>` : '';
  return `<section class="chart-card"><h3>${esc(chart.t)}</h3><div class="chart-layout"><div class="chart-wrap"><canvas id="chart-${index}" aria-label="${esc(chart.t)}"></canvas></div>${tableMarkup(chart)}</div>${caption}</section>`;
}

function makeChart(canvas, chart, moduleIndex, chartIndex) {
  if (!window.Chart) return;
  if (window.ChartDataLabels) window.Chart.register(window.ChartDataLabels);
  const isDonut = chart.kind === 'doughnut';
  const type = chart.kind || 'bar';
  const colors = chart.l.map((_, i) => palette[(i + moduleIndex + chartIndex) % palette.length]);
  const datasets = [{
    label: chart.firstLabel || chart.t,
    data: chart.v,
    backgroundColor: isDonut ? colors : type === 'bar' && !chart.v2 ? colors : type === 'line' ? colors[chartIndex % colors.length] : '#1479a8',
    borderColor: isDonut ? '#ffffff' : type === 'line' ? colors[chartIndex % colors.length] : colors,
    borderWidth: isDonut ? 2 : type === 'line' ? 3 : 0,
    borderRadius: type === 'bar' ? 2 : 0,
    pointRadius: type === 'line' ? 3 : 0,
    pointHoverRadius: type === 'line' ? 6 : 0,
    tension: .28,
    fill: type === 'line' && !chart.v2,
    spanGaps: false
  }];
  if (Array.isArray(chart.v2)) datasets.push({
    label: chart.secondLabel || 'Serie 2', data: chart.v2,
    backgroundColor: '#d09a20', borderColor: '#b77c10', borderWidth: type === 'line' ? 3 : 0,
    borderRadius: 2, pointRadius: type === 'line' ? 3 : 0, tension: .28, spanGaps: false
  });
  return new window.Chart(canvas, {
    type,
    data: { labels: chart.l, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 25, right: 8, left: 4 } },
      plugins: {
        legend: { display: datasets.length > 1, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 10, weight: '700' } } },
        tooltip: { backgroundColor: '#10263d', padding: 11, cornerRadius: 3, titleFont: { weight: '700' } },
        datalabels: {
          display: (ctx) => {
            const value = ctx.dataset.data[ctx.dataIndex];
            if (value == null) return false;
            if (isDonut) return (value / chart.v.filter(x=>x!=null).reduce((a,b)=>a+b,0)) >= .055;
            return type === 'bar' || type === 'line';
          },
          color: isDonut ? '#fff' : '#243a50',
          anchor: isDonut ? 'center' : 'end', align: isDonut ? 'center' : 'top', offset: isDonut ? 0 : 1,
          clamp: true, clip: false,
          font: (ctx) => ({ size: chart.l.length > 9 ? 8 : 10, weight: '800' }),
          formatter: (value, ctx) => isDonut ? `${fmt(value / chart.v.filter(x=>x!=null).reduce((a,b)=>a+b,0)*100,0)}%` : `${fmt(value,1)}${chart.unit||''}`
        }
      },
      scales: isDonut ? {} : {
        x: { grid: { display: false }, ticks: { color: '#50667c', maxRotation: 35, minRotation: 0, autoSkip: chart.l.length > 9, font: { size: 9, weight: '600' } }, border: { display: false } },
        y: { beginAtZero: true, grace: '22%', grid: { color: '#e0e5e9' }, border: { display: false }, ticks: { color: '#64788a', font: { size: 9 }, callback: (v) => `${Number(v).toLocaleString('es-AR')}${chart.unit||''}` } }
      }
    }
  });
}

function showModule(index, scroll = false) {
  charts.splice(0).forEach(chart => chart.destroy());
  const module = modules[index];
  const photo = photos[index];
  document.querySelectorAll('.nav-item').forEach((button, i) => {
    button.classList.toggle('active', i === index);
    button.setAttribute('aria-pressed', String(i === index));
  });
  view.innerHTML = `
    <section class="module-head ${index === 5 ? 'poncho' : ''}" style="--module-color:${palette[index]};--module-image:url('${photo.src}')">
      <div class="module-head-content"><span class="module-kicker">MÓDULO ${String(index+1).padStart(2,'0')} / 08</span><h2>${esc(module.title)}</h2><p>${esc(module.sub)}</p></div>
      <a class="photo-credit" href="${photo.page}" target="_blank" rel="noopener">${esc(photo.author)} · ${esc(photo.license)}</a>
    </section>
    ${kpiMarkup(module.k, palette[index])}
    ${readingMarkup(index)}
    <div class="chart-grid">${module.charts.map((chart, j) => chartMarkup(chart, `m${index}-c${j}`)).join('')}</div>
    <aside class="note-box" style="--module-color:${palette[index]}"><strong>Lectura y cobertura.</strong> ${esc(module.note)}</aside>
    <div class="module-sources">${sourceLinks[index].map(link=>`<a href="${link.url}" target="_blank" rel="noopener">${esc(link.label)} ↗</a>`).join('')}</div>`;
  module.charts.forEach((chart, j) => {
    const instance = makeChart(document.getElementById(`chart-m${index}-c${j}`), chart, index, j);
    if (instance) charts.push(instance);
  });
  if (scroll) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPhotoCredits() {
  document.getElementById('credits-list').innerHTML = photos.map(photo => `<div class="credit-card"><a href="${photo.page}" target="_blank" rel="noopener">${esc(photo.title)}</a><small>Autor: ${esc(photo.author)} · Licencia: <a href="${photo.licenseUrl}" target="_blank" rel="noopener">${esc(photo.license)}</a> · Uso ilustrativo. Si se recortó, se indica como adaptación.</small></div>`).join('');
}

function init() {
  setHero();
  buildNav();
  renderPhotoCredits();
  showModule(0, false);
  window.addEventListener('beforeprint', () => charts.forEach(chart=>chart.resize()));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
